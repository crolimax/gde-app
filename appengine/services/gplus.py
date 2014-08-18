"""This module defines the gplus api functions.

The functions called by two CRON jobs defined in cron.yaml

UpdateActivityPosts iterates through all the activites and finds out wether 
the number of +1 and reshares has changed and updates the ActivityRecord (it 
should exit, log error) so that the total impact is updated.

NewActivityPosts iterates through all the experts accounts and obtains all 
the public posts from gplus.  If the post is #gde then create an entity for
the new post.
    
"""
import webapp2
import logging
import re
from datetime import datetime
from datetime import date
from google.appengine.api import mail
from apiclient.discovery import build

from models import ActivityPost
from models import ActivityRecord
from models import Account
from models import activity_record as ar

API_KEY = 'AIzaSyBVCJKggp_1VBIC2xisWCWrX-VR-Dih694'

ACTIVITY_TYPES = ["#bugreport", "#article", "#blogpost", "#book", "#techdocs",
                  "#translation", "#techtalk", "#opensourcecode",
                  "#forumpost", "#community", "#video", "#tutorial", "#interview"];

PRODUCT_GROUPS = ["#android", "#admob", "#adwords", "#angularjs", "#chrome",
                  "#dart", "#dartlang", "#cloudplatform", "#googleanalytics",
                  "#googleappsapi","#googleappsscript", "#googledrive",
                  "#glass", "#googlemapsapi", "#googleplus", "#youtube",
                  "#uxdesign"];

class UpdateActivityPosts(webapp2.RequestHandler):

    """Updates Existing Activity Posts."""

    def get(self):
        """Process the CRON job."""
        logging.info('Start UpdateActivityPosts')
        metrics = {"start" : datetime.now().strftime("%Y-%m-%d %H:%M:%S")}
        records = []
        #build the service object for the gplus api
        service = build('plus', 'v1', developerKey=API_KEY)
        #get all the activities (last 6 months enough?)
        # activities = ActivityPost.query(ActivityPost.gplus_id == '117346385807218227082').order(ActivityPost.gplus_id)
        activities = ActivityPost.query().order(ActivityPost.gplus_id)
        count = 0
        updated_count = 0

        # activities are ordered so we can send only one mail per gde
        first_time = True
        bad_posts = []
        for activity in activities:
            if first_time:
                first_time = False
                previous_activity = activity

            if previous_activity.gplus_id != activity.gplus_id:
                if len(bad_posts) > 0:
                    self.send_update_mail(bad_posts, previous_activity.gplus_id)
                bad_posts = []
                previous_activity = activity

            count += 1
            #get the activity from gplus
            try:
                plus_activity = service.activities().get(
                    activityId=activity.post_id,
                    fields='object(plusoners/totalItems,replies/totalItems,resharers/totalItems,content)').execute()
            except:
                #try again
                logging.info('trying to get gplus activities again')
                try:
                    plus_activity = service.activities().get(
                        activityId=activity.post_id,
                        fields='object(plusoners/totalItems,replies/totalItems,resharers/totalItems,content)').execute()
                except:
                    logging.info('failed again, giving up')

            # toogle one of the two lines below

            # comment if you need to update every activity post
            updated_activity = self.update_if_changed(activity, plus_activity)

            # comment is you need to only update changed activity posts
            # plus_oners, resharers, replies ( comments )
            #updated_activity = activity
            
            if not updated_activity is None:
                logging.info('updated gplus post id %s' % updated_activity.post_id)
                updated_activity.put()
                activity_record = ar.find_or_create(updated_activity)
                activity_record.add_post(updated_activity)

                #create a list of updated posts
                updated_count += 1
                records.append(updated_activity.url)

            # does the activity have the necessary hashtags? NOT -> bad_posts
            if len(activity.product_group) == 0 or len(activity.activity_type) is 0:
                logging.info('bad post spotted')
                bad_posts.append(activity.url)

        if len(bad_posts) > 0:
            self.send_update_mail(bad_posts, previous_activity.gplus_id)
        bad_posts = []
        previous_activity = activity


        metrics["count"] = count
        metrics["updated_count"] = updated_count
        metrics["records"] = records
        metrics["end"] = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        self.send_transcript_mail(metrics)
        logging.info('End UpdateActivityPosts')

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

        prod_group = entity.get_product_groups(post['object']['content'])
        act_type = entity.get_activity_types(post['object']['content'])

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

    def send_transcript_mail(self, metrics):
        """Send out a mail with some metrics about the process."""
        body_string = "Started at %s \n" % metrics["start"]
        body_string += "ActivityPosts processed : %s \n" % metrics["count"]
        body_string += "ActivityPosts updated : %s \n" % metrics["updated_count"]

        records = metrics["records"]
        for record in records:
            body_string += "%s \n" % record 

        body_string += "Ended at %s \n" % metrics["end"]

        mail.send_mail(sender="GDE Tracking App Support <no-reply@omega-keep-406.appspotmail.com>",
              to="Patrick Martinent <patrick.martinent@gmail.com>",
              subject="GAE CRON JOB : Update ActivityPost for %s " % datetime.now().strftime("%Y-%m-%d"),
              body="""%s""" % body_string)

    def send_update_mail(self, bad_posts, gplus_id):
        """Send out a mail with a link to the post for update"""
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


class NewActivityPosts(webapp2.RequestHandler):

    """Gets New Activity Posts."""

    def get(self):
        """Process the CRON job."""
        logging.info('Start NewActivityPosts')
        metrics = {"start" : datetime.now().strftime("%Y-%m-%d %H:%M:%S")}
        records = []
        #build the service object for the gplus api
        service = build('plus', 'v1', developerKey=API_KEY)
        accounts = Account.query()
        user_count = 0
        new_activities = 0
        for account in accounts:
            #don't process admin users
            if account.type == "administrator":
                continue
            logging.info(account.display_name)
            user_count += 1
            # find out what the last activity date recorded is for the expert
            activities = ActivityPost.query(ActivityPost.gplus_id == account.gplus_id).order(-ActivityPost.date).fetch(1)
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
                result = service.activities().list(userId=account.gplus_id,
                                                   collection='public',
                                                   maxResults=100).execute()
            except:
                #try againg
                logging.info('trying to get gplus activities again')
                try:
                    result = service.activities().list(userId=account.gplus_id,
                                                       collection='public',
                                                       maxResults=100).execute()
                except:
                    logging.info('failed again, giving up')
                    continue

            gplus_activities = result.get('items', [])
            for gplus_activity in gplus_activities:
                if gplus_activity["updated"] > last_activity_date:
                    # ensure this is a gde post
                    if self.is_gde_post(gplus_activity):

                        #create a new activity
                        new_activity = ActivityPost(id=gplus_activity["id"])
                        new_activity.create_from_gplus_post(gplus_activity)
                        new_activity.put()

                        #create the new activity record
                        activity_record = ar.find_or_create(new_activity)
                        activity_record.add_post(new_activity)

                        #create a list of updated posts
                        new_activities += 1
                        records.append(new_activity.url)

        metrics["user_count"] = user_count
        metrics["new_activities"] = new_activities
        metrics["records"] = records
        metrics["end"] = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
               
        self.send_transcript_mail(metrics)
        logging.info('End NewActivityPosts')

    def is_gde_post(self, activity):
        """Identify gde post."""
        # first find out wether the post contains #gde
        result = re.search('(#(gde</a>))', activity["object"]["content"], flags=re.IGNORECASE)
        if result is None:
            return False
        # find out wether the verb of the post is 'post'
        # alternatively is the verb is 'share' then verify that
        # actor.id of the share and the original post are the same
        valid_post = False
        if activity["verb"] == 'post':
            return True
        elif activity["object"]["actor"]["id"] == activity["actor"]["id"]:
            return True
        else:
            return False

    def send_transcript_mail(self, metrics):
        """Send out a mail with some metrics about the process."""
        body_string = "Started at %s \n" % metrics["start"]
        body_string += "Accounts processed : %s \n" % metrics["user_count"]
        body_string += "New activities found : %s \n" % metrics["new_activities"]

        records = metrics["records"]
        for record in records:
            body_string += "%s \n" % record 

        body_string += "Ended at %s \n" % metrics["end"]

        mail.send_mail(sender="GDE Tracking App Support <no-reply@omega-keep-406.appspotmail.com>",
              to="Patrick Martinent <patrick.martinent@gmail.com>",
              subject="GAE CRON JOB : Get New Activities %s " % datetime.now().strftime("%Y-%m-%d"),
              body="""%s""" % body_string)




