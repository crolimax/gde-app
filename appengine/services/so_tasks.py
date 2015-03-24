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
import re
from datetime import datetime
from datetime import date

import urllib2

from google.appengine.api import taskqueue
from google.appengine.api import mail
from google.appengine.api import app_identity

from apiclient.discovery import build

from models import ActivityPost
from models import ActivityRecord
from models import ActivityMetaData
from models import Account
from models import activity_record as ar

from .utils import get_server_api_key


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
        key = self.request.get('key')
        logging.info(key)
