import webapp2
import logging
from apiclient.discovery import build

from models import ActivityPost
from models import ActivityRecord

API_KEY = 'AIzaSyBVCJKggp_1VBIC2xisWCWrX-VR-Dih694'

class UpdateActivityPosts(webapp2.RequestHandler):
    def get(self):
        logging.info('Start UpdateActivityPosts')
        # do something
        service = build('plus', 'v1', developerKey=API_KEY)
        activities = ActivityPost.query()
        for activity in activities:
            request = service.activities().get(activityId=activity.post_id)
            plus_activity = request.execute()
            plus_oners = plus_activity['object']['plusoners']['totalItems']
            resharers = plus_activity['object']['resharers']['totalItems']
            if plus_oners != activity.plus_oners or resharers != activity.resharers:
                activity.plus_oners = plus_oners
                activity.resharers = resharers
                print 'CHANGE'
                activity_link = activity.links
                if activity.links == "":
                    activity_link = activity.url                
                # find out if a record exist
                records = ActivityRecord.query(ActivityRecord.activity_link ==
                                               activity_link).fetch(20)
                if (len(records) == 0):
                    self.response.set_status(404)
                elif(len(records) == 1):
                    activity_record = records[0]
                    activity_record.add_post(activity)
                    activity_record.put()
                    activity.put()
        logging.info('End UpdateActivityPosts')


