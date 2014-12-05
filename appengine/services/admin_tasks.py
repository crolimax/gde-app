"""This module defines a number of tasks related to administration tasks.

TaskCalcImpact needs to be run everytime we update the definition of
total_impact.
"""

import webapp2
import logging

from models import ActivityRecord


class TaskCalcImpact(webapp2.RequestHandler):

    """Force calculate of total_impact with a put()."""

    def get(self):
        """."""
        logging.info('tasks/calc_impact')

        activity_records = ActivityRecord.query()
        ar_count = 0
        for ar in activity_records:
            ar.put()
            ar_count += 1

        logging.info('tasks/calc_impact calculated %s ar' % ar_count)
