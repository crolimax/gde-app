from .gplus import UpdateActivityPosts
from .gplus import NewActivityPosts
from .utils import ReconstructDataSet
from .utils import UpdateDates

import webapp2

app = webapp2.WSGIApplication([('/tasks/uapost', UpdateActivityPosts),
                               ('/tasks/napost', NewActivityPosts),
                               ('/tasks/datechange', UpdateDates),
                               ('/tasks/reconstruct', ReconstructDataSet)], debug=True)