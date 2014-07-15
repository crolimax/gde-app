"""This module defines the utility functions.

These functions are called by scheduling one time CRON jobs as defined in 
cron.yaml

ReconstructDataSet iterates through all the gplus activity posts to rebuild
the data model. Used as we change the data models.

    
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

class ReconstructDataSet(webapp2.RequestHandler):

    """Updates Existing Activity Posts."""

    def get(self):
        """Process the job."""
        
        logging.info('Start ReconstructDataSet')
        metrics = {"start" : datetime.now().strftime("%Y-%m-%d %H:%M:%S")}
        records = []

        #build the service object for the gplus api
        service = build('plus', 'v1', developerKey=API_KEY)

        # delete all the activity records first
        self.delete_all_act_records()

        #get all the activity posts and start building the activity records
        activities = ActivityPost.query()
        count = 0
        updated_count = 0
        for activity in activities:
            #get the activity from gplus
            try:
                result = service.activities().get(
                    activityId=activity.post_id).excute()
            except:
                #try again
                logging.info('trying to get gplus activities again')
                try:
                    result = service.activities().get(
                        activityId=activity.post_id).execute()
                except:
                    logging.info('failed again, giving up')
                    continue

            gplus_activity = result

            #update your datamodel here, populate the new values
            #delete the activity
            activity.key.delete()

            #create a new activity
            new_activity = ActivityPost(id=gplus_activity["id"])
            new_activity.create_from_gplus_post(gplus_activity)
            new_activity.put()

            #create the new activity record
            activity_record = ar.find_or_create(new_activity)
            activity_record.add_post(new_activity)

            #create a list of updated posts
            count += 1
            records.append(new_activity.url)

        metrics["count"] = count
        metrics["records"] = records
        metrics["end"] = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        self.send_transcript_mail(metrics)
        logging.info('End ReconstructDataSet')


    def delete_all_act_records(self):
        logging.info('Start delete_all_act_records')
        #get all the activities
        activities = ActivityRecord.query()
        count = 0
        updated_count = 0
        for activity in activities:
            activity.key.delete()
        logging.info('End delete_all_act_records')


    def send_transcript_mail(self, metrics):
        """Send out a mail with some metrics about the process."""
        body_string = "Started at %s \n" % metrics["start"]
        body_string += "ActivityPosts processed : %s \n" % metrics["count"]

        records = metrics["records"]
        for record in records:
            body_string += "%s \n" % record 

        body_string += "Ended at %s \n" % metrics["end"]

        mail.send_mail(sender="GDE Tracking App Support <no-reply@omega-keep-406.appspotmail.com>",
              to="Patrick Martinent <patrick.martinent@gmail.com>",
              subject="GAE CRON JOB : ReconstructDataSet for %s " % datetime.now().strftime("%Y-%m-%d"),
              body="""%s""" % body_string)

