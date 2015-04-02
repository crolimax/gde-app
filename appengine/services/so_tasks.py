"""This module defines a number of tasks related to harvesting SO.

we use the same approach / architecture as described in update_glus.py

API : https://api.stackexchange.com/docs/top-user-answers-in-tags

Account Entity contains the so user id
ProductGroup contains the tags of interest for the API

Harvesting is for an interval, creates an ActivityRecord
with the metadata it extracts from the SO API

At first look the API returns 30 entries, and we need to understand
what is an acceptable interval, a week or a month -> A DAY / TAG is
the acceptable value to get all answers

We create one AR per product group per day is questions are anwered


Using the exising fields (we need to refactor for the decoupling from G+)

count answers -> meta impact
cumulative score -> +1
cumulative is_accepted -> reshares

The above was decided arbitrarly :(

"""

import webapp2
import logging
from datetime import datetime, date, timedelta

import json
import urllib2
from urllib2 import Request, urlopen, URLError

from google.appengine.ext import ndb
from google.appengine.api import taskqueue
from google.appengine.api import mail
from google.appengine.api import app_identity

from apiclient.discovery import build

from models import ActivityPost
from models import ActivityRecord
from models import ActivityMetaData
from models import Account
from models import ProductGroup
from models import activity_record as ar

from .utils import get_server_api_key

SO_ROOT = "https://api.stackexchange.com/2.2"

# https://api.stackexchange.com/2.2/users/2748916/tags/[google-drive-sdk]/top-answers?((&site=stackoverflow&order=desc&sort=activity&filter=default


class CronHarvestSO(webapp2.RequestHandler):

    """Creates tasks to get SO metrics for each gde."""

    def get(self):
        """Create tasks."""
        logging.info('crons/harvest_so')

        accounts = Account.query(Account.so_id != None)
        user_count = 0
        for account in accounts:
            # don't process admin users
            if account.type == "administrator":
                continue
            # don't process inactive users
            if account.type != "active":
                continue
            user_count += 1
            taskqueue.add(queue_name='gplus',
                          url='/tasks/harvest_so',
                          params={'gplus_id': account.gplus_id,
                                  'key': account.key.urlsafe()})

        logging.info(
            'crons/harvest_so created tasks for %s users' % user_count)


class TaskHarvestSO(webapp2.RequestHandler):

    """Gets new activities for a particular gde."""

    def post(self):
        """."""
        logging.info('tasks/harvest_so')

        gplus_id = self.request.get('gplus_id')
        logging.info(gplus_id)
        safe_key = self.request.get('key')
        logging.info(safe_key)

        gde = ndb.Key(urlsafe=safe_key).get()
        logging.info(gde.gplus_id)

        today = date.today()
        # this will be run a on daily basis
        # taking 1000 days inteval to get some data
        yesterday = date.today() - timedelta(1000)
        logging.info(today)
        logging.info(yesterday)

        q = "/top-answers?((&site=stackoverflow&order=desc&sort=activity&filter=default"
        q = q + \
            "&fromdate={}&todate={}".format(
                yesterday.strftime('%s'), today.strftime('%s'))

        # product_group is a repeated property : some GDE's have multiple hats
        for pg in gde.product_group:
            product_group = ndb.Key('ProductGroup', pg).get()
            logging.info(product_group)
            so_tags = product_group.so_tags

            logging.info(so_tags)
            # so_tags = str([x.encode('UTF8') for x in so_tags])
            # logging.info(so_tags)

            # this routine is predicated on the daily rate of answer for a tag
            # by a GDE is less than 30

            daily_answers = 0
            daily_score = 0
            daily_accepted = 0

            count = 0
            score = 0
            accepted = 0

            title = "SO HARVEST - {} - {}".format(
                product_group.tag, str(yesterday))

            link = SO_ROOT + \
                "/users/{}/tags/[{}]".format(gde.so_id, ','.join(so_tags)) + q

            for so_tag in so_tags:

                count = 0
                score = 0
                accepted = 0
                # q = "/top-answers?((&site=stackoverflow&order=desc&sort=activity&filter=default"
                # fromdate=1383264000&todate=1427760000
                url = SO_ROOT + \
                    "/users/{}/tags/[{}]".format(gde.so_id, so_tag) + q
                logging.info(url)

                req = Request(url)
                response = urlopen(req)
                r = response.read()
                answers = json.loads(r)["items"]
                count = len(answers)
                for answer in answers:
                    score += answer["score"]
                    if answer["is_accepted"]:
                        accepted += 1

                logging.info(count)
                logging.info(score)
                logging.info(accepted)

                daily_answers += count
                daily_score += score
                daily_accepted += accepted

            logging.info(daily_answers)
            logging.info(daily_score)
            logging.info(daily_accepted)

            # create(get) activity record
            # polymer #forumpost #stackOverflow

            if daily_answers != 0:
                activities = ActivityRecord.query(ActivityRecord.gplus_id == gplus_id,
                                                  ActivityRecord.metadata.type == '#stackOverflow',
                                                  ActivityRecord.post_date == str(
                                                      today),
                                                  ActivityRecord.activity_link == link)

                if activities.count() == 0:
                    logging.info("create activity record")
                    activity_record = ActivityRecord(gplus_id=gde.gplus_id,
                                                     post_date=str(
                                                         today),
                                                     activity_types=[
                                                         "#forumpost"],
                                                     product_groups=[
                                                         product_group.tag],
                                                     activity_link=link,
                                                     activity_title=title,
                                                     plus_oners=daily_score,
                                                     resharers=daily_accepted,
                                                     deleted=False)
                    activity_record.metadata.insert(0, ActivityMetaData())
                    meta = activity_record.metadata[0]
                    meta.type = '#stackOverflow'
                    meta.activity_group = '#forumpost'
                    meta.link = activity_record.activity_link
                    meta.impact = daily_answers
                    activity_record.put()
                else:
                    logging.info("existing activity record")
