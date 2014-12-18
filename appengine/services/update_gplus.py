"""This module defines the architecture template to pull impact data.

components in the architecture:
- cron job run a regular intervals
    - daily for getting new activies
    - weekly for refreshing impact data from existing activites
    - monthly for ...

- task queues (defined a queue called gplus) that are populated by the cron jobs
    - use logging to report success / failure TBD
    - have a daily cron which harvests some log entries and email the admin TBD
    - orchetration ? TBD

- classes
    - ???? service (update_gplus) which encapsulates the data fetching and update
    - cron class which iterates and create on task per gde
    - task task which calls the service

patt0 10092014 : we use gplus as the example
patt0 22102014 : finalizing the updates with staging env

"""

import webapp2
import logging
import re
from datetime import datetime
from datetime import date

from google.appengine.api import taskqueue
from google.appengine.api import mail

from apiclient.discovery import build

from models import ActivityPost
from models import ActivityRecord
from models import Account
from models import activity_record as ar

from .utils import get_server_api_key

class CronNewGplus(webapp2.RequestHandler):

    """Creates tasks to get new gplus activities for each gde."""

    def get(self):
        """Create tasks."""
        logging.info('crons/new_gplus')

        accounts = Account.query()
        user_count = 0
        for account in accounts:
            #don't process admin users
            if account.type == "administrator":
                continue
            #don't process inactive users
            if account.type != "active":
                continue
            user_count +=1
            taskqueue.add(queue_name='gplus',
                          url='/tasks/new_gplus',
                          params={'gplus_id':account.gplus_id})

        logging.info('crons/new_gplus created tasks for %s users' % user_count)


class TaskNewGplus(webapp2.RequestHandler):

    """Gets new activities for a particular gde."""

    def post(self):
        """."""
        logging.info('tasks/new_gplus')

        gplus_id = self.request.get('gplus_id')
        logging.info(gplus_id)

        #build the service object for the gplus api
        API_KEY = get_server_api_key()
        gplus_service = build('plus', 'v1', developerKey=API_KEY)
        # find out what the last activity date recorded is for the expert
        activities = ActivityPost.query(ActivityPost.gplus_id == gplus_id).order(-ActivityPost.date).fetch(1)
        # if this is the first time we are getting activities for a new user
        if len(activities) == 0:
            last_activity_date = date(1990, 1, 1).strftime("%Y-%m-%d %H:%M:%S")
        else:
            last_activity_date = activities[0].date
        logging.info('Last activity date : % s' % last_activity_date)
        # get the last 100 activities from gplus
        # eventually we can also query using the date so we don't
        # have to compare each post with the date we just got
        try: 
            result = gplus_service.activities().list(userId=gplus_id,
                                               collection='public',
                                               maxResults=100).execute()
        except:
            #try againg
            logging.info('trying to get gplus activities again')
            try:
                result = gplus_service.activities().list(userId=gplus_id,
                                                   collection='public',
                                                   maxResults=100).execute()
            except:
                logging.info('failed again, giving up')

        else:
            #patt0 25102014 sort the items in reverse update date order 
            gplus_act = result.get('items', [])
            gplus_activities = sorted(gplus_act, key=lambda k: k['updated'])
            for gplus_activity in gplus_activities:
                if gplus_activity["updated"] > last_activity_date:
                    # ensure this is a gde post
                    if is_gde_post(gplus_activity):

                        #create a new activity
                        new_activity = ActivityPost(id=gplus_activity["id"])
                        new_activity.create_from_gplus_post(gplus_activity)
                        new_activity.put()
                        logging.info('new activity recorded: %s' % new_activity.url)

                        activity_record = find_or_create_ar(gplus_activity, new_activity)
                        activity_record.add_post(new_activity)


def find_or_create_ar(gplus_activity, activity_post):
    # is this a reshare find the first AR that references the post
    # if the post is shared query for the original post id
    # if there are none the create a new activity record and return it
    if gplus_activity["verb"] == 'post':
        original_post_id = gplus_activity['id']
    elif gplus_activity["verb"] == 'share':
        original_post_id = gplus_activity['object']['id']

    if original_post_id is not None:
        records = ActivityRecord.query(ActivityRecord.gplus_posts == 
                                       original_post_id).fetch(20)
        if (len(records) == 0):
                return ar.create_activity_record(activity_post)
        else:
            return records[0]    

    return ar.create_activity_record(activity_post)

def is_gde_post(activity):
    """Identify gde post."""
    # first find out wether the post contains #gde
    content = activity['object']['content']
    if 'annotation' in activity:
        content += ' ' + activity['annotation']
    result = re.search('(#(gde</a>))', content, flags=re.IGNORECASE)
    if result is None:
        return False
    # find out wether the verb of the post is 'post'
    # alternatively is the verb is 'share' then verify that
    # actor.id of the share and the original post are the same
    if 'verb' in activity:
        if activity["verb"] == 'post':
            return True
        elif activity["object"]["actor"]["id"] == activity["actor"]["id"]:
            return True
        else:
            return False
    else:
        return True


class CronUpdateGplus(webapp2.RequestHandler):

    """Creates tasks to get updated metrics activities for each gde."""

    def get(self):
        """create tasks."""
        logging.info('crons/upd_gplus')

        accounts = Account.query()
        user_count = 0
        for account in accounts:
            #don't process admin users
            if account.type == "administrator":
                continue
            #don't process inactive users
            if account.type != "active":
                continue
            user_count +=1
            taskqueue.add(queue_name='gplus',
                          url='/tasks/upd_gplus',
                          params={'gplus_id':account.gplus_id})

        logging.info('crons/upd_gplus created tasks for %s users' % user_count)


class TaskUpdateGplus(webapp2.RequestHandler):

    """Update existing activities for a particular gde."""

    def post(self):
        """."""
        logging.info('tasks/upd_gplus')
        
        bad_posts = []
        gplus_id = self.request.get('gplus_id')
        logging.info(gplus_id)

        #build the service object for the gplus api
        API_KEY = get_server_api_key()
        gplus_service = build('plus', 'v1', developerKey=API_KEY)
        #get the activities for the gde
        activities = ActivityPost.query(ActivityPost.gplus_id == gplus_id)

        for activity in activities:
            # check if post belongs to deleted activity
            activity_record = ar.find(activity)
            if activity_record is not None:
                if activity_record.deleted:
                    continue

            # get the activity from gplus
            fields = 'id,verb,actor/id,annotation,object(id,actor/id,plusoners/totalItems,replies/totalItems,resharers/totalItems,content)'
            try:
                plus_activity = gplus_service.activities().get(
                    activityId=activity.post_id,
                    fields=fields).execute()
            except:
                # try again
                logging.info('trying to get gplus activities again')
                try:
                    plus_activity = gplus_service.activities().get(
                        activityId=activity.post_id,
                        fields=fields).execute()
                except:
                    logging.info('failed again, giving up')
                    continue

            if not is_gde_post(plus_activity):
                # #gde tag has been removed from post
                # This post and associated AR should be deleted
                # For now we just skip any further action on this post
                continue

            updated_activity = self.update_if_changed(activity, plus_activity)

            if updated_activity is not None:
                logging.info('updated gplus post id %s' % updated_activity.post_id)
                activity_record = find_or_create_ar(plus_activity, updated_activity)
                activity_record.add_post(updated_activity)
                updated_activity.put()

            # does the activity have the necessary hashtags? NOT -> bad_posts
            if len(activity.product_group) == 0 or len(activity.activity_type) == 0:
                # check associated AR as well
                really_bad = False
                activity_record = ar.find(activity)
                if activity_record is None:
                    really_bad = True
                elif len(activity_record.activity_types) == 0 or len(activity_record.product_groups) == 0:
                    really_bad = True

                if really_bad:
                    logging.info('bad post spotted')
                    bad_posts.append(activity.url)

        if len(bad_posts) > 0:
            self.send_update_mail(bad_posts, gplus_id)

    def update_if_changed(self, entity, post):
        """Find out if the post has more +1 or reshares."""
        changed = False

        if entity.plus_oners != post['object']['plusoners']['totalItems']:
            changed = True
            entity.plus_oners = post['object']['plusoners']['totalItems']

        if entity.resharers != post['object']['resharers']['totalItems']:
            changed = True
            entity.resharers = post['object']['resharers']['totalItems']

        if entity.comments != post['object']['replies']['totalItems']:
            changed = True
            entity.comments = post['object']['replies']['totalItems']

        content = post['object']['content']
        if 'annotation' in post:
            content += ' ' + post['annotation']

        prod_group = entity.get_product_groups(content)
        act_type = entity.get_activity_types(content)

        if sorted(entity.product_group) != sorted(prod_group):
            changed = True
            entity.product_group = prod_group

        if sorted(entity.activity_type) != sorted(act_type):
            changed = True
            entity.activity_type = act_type

        if changed:
            return entity
        else:
            return None

    def send_update_mail(self, bad_posts, gplus_id):
        """Send out a mail with a link to the post for update."""

        logging.info('sending a bad_post mail')

        # get the user
        accounts = Account.query(Account.gplus_id == gplus_id)

        for account in accounts:
            email = account.email

        body_s = "The GDE Tracking team thanks you for using the tool. \n\n"
        body_s += "The following post(s) is(are) missing Activity Type and/or Product Group hashtags. "
        body_s += "Because of this, it(they) does not reflect in your GDE stats. \n\n"

        for bad_post in bad_posts:
            body_s += "%s \n" % bad_post 

        body_s += "\nKindly update your post(s) with #hashtags. A reminder of the valid "
        body_s += "hashtags can be found in the 'How Its Used?' section of http://gdetracking.gweb.io/. \n\n"
        body_s += "GDE Tracking Team"

        mail.send_mail(sender="GDE Tracking App Support <no-reply@omega-keep-406.appspotmail.com>",
              to=email,
              subject="GDE Activity Tracker : Missing hashtags on ActivityPost for %s " % datetime.now().strftime("%Y-%m-%d"),
              body="""%s""" % body_s)

