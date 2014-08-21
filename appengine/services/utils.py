"""This module defines the utility functions.

These functions are called by scheduling one time CRON jobs as defined in
cron.yaml

ReconstructDataSet iterates through all the gplus activity posts to rebuild
the data model. Used as we change the data models.

"""

import cloudstorage as gcs
import endpoints
import json
import os
import webapp2
import logging
import re
from datetime import datetime
from datetime import date
from google.appengine.api import app_identity
from google.appengine.api import mail
from apiclient.discovery import build

from models import ActivityPost
from models import ActivityRecord
from models import Account
from models import activity_record as ar

API_KEY = 'AIzaSyBVCJKggp_1VBIC2xisWCWrX-VR-Dih694'

ACTIVITY_TYPES = ["#bugreport", "#article", "#blogpost", "#book", "#techdocs",
                  "#translation", "#techtalk", "#opensourcecode",
                  "#forumpost", "#community", "#video", "#tutorial", "#interview"]

PRODUCT_GROUPS = ["#android", "#admob", "#adwords", "#angularjs", "#chrome",
                  "#dart", "#dartlang", "#cloudplatform", "#googleanalytics",
                  "#googleappsapi", "#googleappsscript", "#googledrive",
                  "#glass", "#googlemapsapi", "#googleplus", "#youtube",
                  "#uxdesign"]


my_default_retry_params = gcs.RetryParams(initial_delay=0.2,
                                          max_delay=5.0,
                                          backoff_factor=2,
                                          max_retry_period=15)

gcs.set_default_retry_params(my_default_retry_params)


def get_admin_api_key():
    bucket = '/' + os.environ.get('BUCKET_NAME',
                                  app_identity.get_default_gcs_bucket_name())

    secrets_file = None

    try:
        secrets_file = gcs.open(bucket + '/' + 'secrets.json', 'r')
    except gcs.NotFoundError:
        logging.error('secrets.json not found in default bucket')
        return None

    secrets = json.loads(secrets_file.read())
    return secrets.get('admin_api_key')


def get_current_account():
    user = endpoints.get_current_user()
    if user is None:
        return None

    accounts = Account.query(Account.email == user.email()).fetch(1)
    if len(accounts) == 0:
        return None

    return accounts[0]


def check_auth(gplus_id, api_key):
    # check authenticated user
    user = get_current_account()
    if user is not None:
        # We could do further checks here, depending on user.type, e.g.
        #  Admins/Managers always are allowed
        #  "disabled" GDEs are not allowed
        #  For active GDEs check if user.gplus_id == gplus_id so they can only edit their own data
        #  Only allow active GDEs to enter data
        return True

    # Check against API Key for maintainance script
    if api_key is not None:
        if api_key == get_admin_api_key():
            return True

    return False


class UpdateDates(webapp2.RequestHandler):

    """Update dates for https://github.com/maiera/gde-app/issues/86. """

    def get(self):
        """Process the job."""

        logging.info('Start date format update')
        activities = ActivityRecord.query()
        count = 0
        for activity in activities:
            count += 1
            # logging.info(activity.id)
            try:
                date = datetime.strptime(activity.post_date, '%Y/%m/%d')
                date_formated = date.strftime("%Y-%m-%d")
                activity.post_date = date_formated
            except:
                logging.info('failed')
                logging.info(activity.id) 
            else:
                # pass
                activity.put()
            
        logging.info('End date format update, processed %s activities' % count)


class ReconstructDataSet(webapp2.RequestHandler):

    """Updates Existing Activity Posts. """

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

