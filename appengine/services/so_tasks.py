"""This module defines a number of tasks related to harvesting SO.

we use the same approach / architecture as described in update_glus.py

API : https://api.stackexchange.com/docs/top-user-answers-in-tags

Account Entity contains the so user id
ProductGroup contains the tags of interest for the API

Harvesting is for an interval, creates an ActivityRecord 
with the metadata it extracts from the SO API

At first look the API returns 30 entries, and we need to understand
what is an acceptable interval, a week or a month

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

        today = date.today().strftime('%s')
        yesterday = (date.today() - timedelta(1000)).strftime('%s')
        logging.info(today)
        logging.info(yesterday)

        q = "/top-answers?((&site=stackoverflow&order=desc&sort=activity&filter=default"
        q = q + "&fromdate={}&todate={}".format(yesterday, today)

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

            for so_tag in so_tags:

                #q = "/top-answers?((&site=stackoverflow&order=desc&sort=activity&filter=default"
                # fromdate=1383264000&todate=1427760000
                url = SO_ROOT + \
                    "/users/{}/tags/[{}]".format(gde.so_id, so_tag) + q
                logging.info(url)

                req = Request(url)
                try:
                    response = urlopen(req)
                except URLError as e:
                    if hasattr(e, 'reason'):
                        logging.error('We failed to reach a server.')
                        logging.error('Reason: ', e.reason)
                    elif hasattr(e, 'code'):
                        logging.error(
                            'The server couldn\'t fulfill the request.')
                        logging.error('Error code: ', e.code)
                else:
                    r = response.read()
                    logging.info(r)
                    answers = json.loads(r)["items"]
                    count = len(answers)
                    score = 0
                    accepted = 0
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

            activities = ActivityRecord.query(ActivityRecord.gplus_id == gplus_id,
                                              ActivityRecord.metadata.type == '#stackOverflow')
