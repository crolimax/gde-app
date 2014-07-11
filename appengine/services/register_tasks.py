from .gplus import UpdateActivityPosts
from .gplus import NewActivityPosts

import webapp2

app = webapp2.WSGIApplication([('/tasks/uapost', UpdateActivityPosts),
                               ('/tasks/napost', NewActivityPosts)], debug=True)