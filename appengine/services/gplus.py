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

PRODUCT_GROUPS = ["#android", "#admob", "#adwords", "#angulars", "#chrome",
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
        activities = ActivityPost.query()
        count = 0
        updated_count = 0
        for activity in activities:
            count += 1
            #get the activity from gplus
            request = service.activities().get(activityId=activity.post_id)
            plus_activity = request.execute()

            updated_activity = self.update_if_changed(activity, plus_activity)

            if not updated_activity is None:
                updated_count += 1
                logging.info('updated gplus post id %s' % updated_activity.post_id)
                updated_activity.put()
                activity_record = ar.find_or_create(updated_activity)
                activity_record.add_post(updated_activity)
                #create a list of updated posts
                records.append(updated_activity.url)

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
            result = service.activities().list(userId=account.gplus_id,
                                               collection='public',
                                               maxResults=100).execute()
            gplus_activities = result.get('items', [])
            for gplus_activity in gplus_activities:
                if gplus_activity["updated"] > last_activity_date:
                    # ensure this is a gde post
                    if self.is_gde_post(gplus_activity):
                        new_activities += 1
                        #create a list of updated posts
                        records.append(gplus_activity["url"])
                        activity_post = self.create_activity(gplus_activity, account)
                        logging.info(activity_post)
                        activity_post.put()
                        activity_record = ar.find_or_create(activity_post)
                        activity_record.add_post(activity_post)

                        # activity = ActivityPost(activity_data)
                        # activity.put()
        metrics["user_count"] = user_count
        metrics["new_activities"] = new_activities
        metrics["records"] = records
        metrics["end"] = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
               
        self.send_transcript_mail(metrics)
        print user_count

    def create_activity(self, activity, account):
        """Create the ActivityPost object from gplus post."""
        plus_oners = activity['object']['plusoners']['totalItems']
        resharers = activity['object']['resharers']['totalItems']

        activity_post = ActivityPost(id=activity["id"],
                                post_id=activity["id"],
                                name=account.real_name,
                                gplus_id=account.gplus_id,
                                date=activity["updated"],
                                url=activity["url"],
                                title=activity["title"],
                                plus_oners=plus_oners,
                                resharers=resharers)

        at = self.get_activity_types(activity["object"]["content"])
        activity_post.populate(activity_type=at)
        pg = self.get_product_groups(activity["object"]["content"])
        activity_post.populate(product_group=pg)
        try:
            attachments = activity["object"]["attachments"]
        except Exception as e:
            logging.error(e)
        else:
            links = self.get_links(attachments)
            activity_post.populate(links=links)
        
        return activity_post

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
        elif activity["object"]["actor"]["id"] == activity["id"]:
            return True
        else:
            return False

    def get_activity_types(self, content):
        """Extract activity type hashtags."""
        at = []
        for activity_type in ACTIVITY_TYPES:
            result = re.search(activity_type, content, flags=re.IGNORECASE)
            if result is not None:
                at.append(activity_type)
        return at

    def get_product_groups(self, content):
        """Extract product group hashtags."""
        pg = []
        for product_group in PRODUCT_GROUPS:
            result = re.search(product_group, content, flags=re.IGNORECASE)
            if result is not None:
                pg.append(product_group)
        return pg

    def get_links(self, attachments):
        """Extract links."""
        links = ""
        for attachment in attachments:
            if attachment["objectType"] == "article" or attachment["objectType"] == "video":
                if links != "":
                    links += ", "
                links += attachment["url"]
        return links

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




