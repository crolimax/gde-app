from .gplus import UpdateActivityPosts
from .gplus import NewActivityPosts
from .utils import ReconstructDataSet

import webapp2

app = webapp2.WSGIApplication([('/tasks/uapost', UpdateActivityPosts),
                               ('/tasks/napost', NewActivityPosts),
                               ('/tasks/reconstruct', ReconstructDataSet)], debug=True)