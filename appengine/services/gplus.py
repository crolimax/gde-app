"""This module defines the gplus api functions.

The functions called by two CRON jobs defined in cron.yaml

UpdateActivityPosts iterates through all the activites and
finds out wether the number of +1 and reshares has changed
and updates the ActivityRecord (it should exit, log error)
so that the total impact is updated.
    
"""
import webapp2
import logging
from datetime import datetime
from google.appengine.api import mail
from apiclient.discovery import build

from models import ActivityPost
from models import ActivityRecord
from models import activity_record as ar

API_KEY = 'AIzaSyBVCJKggp_1VBIC2xisWCWrX-VR-Dih694'

class UpdateActivityPosts(webapp2.RequestHandler):

    """Updates Existing Activity Posts."""

    def get(self):
        """Process the CRON job."""
        logging.info('Start UpdateActivityPosts')
        metrics = {"start" : datetime.now().strftime("%Y-%m-%d %H:%M:%S")}
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

        metrics["count"] = count
        metrics["updated_count"] = updated_count
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
        body_string = "Started at %s \n" % metrics["start"]
        body_string += "ActivityPosts processed : %s \n" % metrics["count"]
        body_string += "ActivityPosts updated : %s \n" % metrics["updated_count"]
        body_string += "Ended at %s \n" % metrics["end"]

        mail.send_mail(sender="GDE Tracking App Support <omega-keep-406@appspot.gserviceaccount.com>",
              to="Patrick Martinent <patrick.martinent@gmail.com>",
              subject="Update ActivityPost for %s " % datetime.now().strftime("%Y-%m-%d"),
              body="""%s""" % body_string)


