"""Cron and task routings."""

from .update_gplus import TaskNewGplus
from .update_gplus import CronNewGplus

from .update_gplus import TaskUpdateGplus
from .update_gplus import CronUpdateGplus

from .update_blogger_metrics import TaskUpdBlogger
from .update_blogger_metrics import CronUpdBlogger

import webapp2

app = webapp2.WSGIApplication([('/crons/new_gplus', CronNewGplus),
                               ('/tasks/new_gplus', TaskNewGplus),
                               ('/crons/upd_gplus', CronUpdateGplus),
                               ('/tasks/upd_gplus', TaskUpdateGplus),
                               # ('/crons/upd_blogger', CronUpdBlogger),
                               # ('/tasks/upd_blogger', TaskUpdBlogger),
                              ], debug=True)
