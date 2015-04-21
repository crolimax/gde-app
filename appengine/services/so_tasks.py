"""This module defines a number of tasks related to harvesting SO.

we use the same approach / architecture as described in update_glus.py for harvesting

Account Entity contains the so user_id and the ProductGroup associated with him
ProductGroup Entity contains the tags of interest for the API

Application registered:
http://stackapps.com/apps/oauth/view/4620

EndPoint 1 : https://api.stackexchange.com/docs/answers-on-users
>> /2.2/users/26406/answers?page=1&pagesize=100&order=desc&sort=creation&site=stackoverflow

EndPoint 2 : https://api.stackexchange.com/docs/questions-by-ids
>> /2.2/questions/29363485?order=desc&sort=activity&site=stackoverflow

Use EP1 above to get all the answers answered for the month (date range)
then use EP2 to match tags on the question


Harvesting is for an interval, creates an ActivityRecord
with the metadata it extracts from the SO API

We create one AR per product group per month if questions are anwered in that PG

Using the exising fields (we need to refactor for the decoupling from G+)

count answers -> meta impact

NO SOCIAL DATA is harvested currently, just the number of questions answered.
Social data tends to make sense over time, and this is not the objective of the harvest.

The above was decided arbitrarly :(

"""

import webapp2
import logging
from datetime import datetime, date, timedelta
from monthdelta import monthdelta

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

from .utils import get_so_api_key

SO_ROOT = "https://api.stackexchange.com/2.2"
SO_KEY = get_so_api_key()


class CronHarvestSO(webapp2.RequestHandler):

    """Creates tasks to get SO metrics for each gde."""

    def get(self):
        """Create tasks."""
        logging.info('crons/harvest_so')

        # harvest a period i.e. from January 1st INITIAL RUN
        # num_months = 15
        # start_date = date(2014, 1, 1)

        # normal monthly harvest >> HAS TO RUN ON THE FIRST OF THE MONTH
        if date.today().day != 1:
            logging.info(
                'Stack Overflow Harvesting MUST be run on first of the month : EXITING')
            return

        num_months = 1
        start_date = date.today() - monthdelta(1)

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

            for i in range(0, num_months):
                start = start_date + monthdelta(i)
                end = start + monthdelta(1) - timedelta(1)
                taskqueue.add(queue_name='gplus',
                              url='/tasks/harvest_so',
                              params={'key': account.key.urlsafe(), 'from': str(start), 'to': str(end)})

        logging.info(
            'crons/harvest_so created tasks for %s users' % user_count)


class TaskHarvestSO(webapp2.RequestHandler):

    """Gets new activities for a particular gde."""

    def post(self):
        """."""
        logging.info('tasks/harvest_so')

        # get the gde Account entity
        safe_key = self.request.get('key')
        gde = ndb.Key(urlsafe=safe_key).get()
        logging.info(gde.gplus_id)
        logging.info(gde)

        # harvesting interval set to weekly with a page size of 100
        to_date = datetime.strptime(self.request.get('to'), "%Y-%m-%d").date()
        from_date = datetime.strptime(
            self.request.get('from'), "%Y-%m-%d").date()

        logging.info("harvesting from {} to {}".format(from_date, to_date))

        # populate product groups and tags associated with the GDE
        # multiple product groups is not uncommon and even more so
        # with the polymer harvesting experiment

        # changed the approach above so that all product group questions
        # are recorded independant of the GDE product group affiliation.
        pg_tags = {}
        product_groups = ProductGroup.query().fetch(100)
        for pg in product_groups:
            product_group = pg
            # not sure why I am dealing with unicode here :(
            so_tags = [x.encode('UTF8') for x in product_group.so_tags]
            pg_tags[product_group.id] = {}
            for tag in so_tags:
                pg_tags[product_group.id][tag] = 0

        logging.info(pg_tags)

        query = "/answers?key=" + SO_KEY + \
            "&page=1&pagesize=100&site=stackoverflow&order=desc&sort=creation&filter=default"

        query = query + \
            "&fromdate={}&todate={}".format(
                from_date.strftime('%s'), to_date.strftime('%s'))

        url = SO_ROOT + \
            "/users/{}".format(gde.so_id) + query

        logging.info(url)

        req = Request(url)
        res = urlopen(req).read()
        answers = json.loads(res)["items"]
        logging.info("Number of answers posted this period %s" % len(answers))

        # identify if the answers are specific to tags of interest
        for answer in answers:
            self.add_answer_to_tag_count(pg_tags, answer["question_id"])

        logging.info(pg_tags)

        # create Activity Records for product group that have some answers
        # for product_group in pg_tags:
        for pg in product_groups:
            product_group = pg
            count = 0
            for pg_tag in pg_tags[product_group.id]:
                count += pg_tags[product_group.id][pg_tag]
            if count != 0:
                logging.info(
                    "create ar for {} with {} answers".format(product_group.description, count))

                link = url

                title = "SO HARVEST - {} - from {} to {}".format(
                    product_group.tag, str(from_date), str(to_date))

                activities = ActivityRecord.query(ActivityRecord.gplus_id == gde.gplus_id,
                                                  ActivityRecord.metadata.type == '#stackOverflow',
                                                  ActivityRecord.post_date == str(
                                                      to_date),
                                                  ActivityRecord.activity_title == title)

                if activities.count(20) == 0:
                    logging.info("create activity record")
                    activity_record = ActivityRecord(gplus_id=gde.gplus_id,
                                                     post_date=str(to_date),
                                                     activity_types=[
                                                         "#forumpost"],
                                                     product_groups=[
                                                         product_group.tag],
                                                     activity_link=link,
                                                     activity_title=title,
                                                     plus_oners=0,
                                                     resharers=0,
                                                     comments=0,
                                                     deleted=False)
                    activity_record.metadata.insert(0, ActivityMetaData())
                    meta = activity_record.metadata[0]
                    meta.type = '#stackOverflow'
                    meta.activity_group = '#forumpost'
                    meta.link = activity_record.activity_link
                    meta.impact = count
                    activity_record.put()
                else:
                    logging.info("ActivityRecord Exist Not Overwritting")

    def add_answer_to_tag_count(self, pg_tags, question_id):
        # this can be optimized to do only one call, by passed many question
        # ids
        query = "?" + SO_KEY + \
            "&site=stackoverflow&order=desc&sort=activity&filter=default"

        url = SO_ROOT + \
            "/questions/{}".format(question_id) + query
        logging.info(url)

        req = Request(url)
        res = urlopen(req).read()
        questions = json.loads(res)["items"]
        # should really assert that we have only one question
        for question in questions:
            # logging.info(question)
            tags = question["tags"]
            for tag in tags:
                # logging.info(tag)
                for product_group in pg_tags:
                    for pg_tag in pg_tags[product_group]:
                        if tag == pg_tag:
                            # logging.info("found")
                            # logging.info(pg_tag)
                            pg_tags[product_group][tag] += 1
