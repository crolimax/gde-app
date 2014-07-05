import endpoints
from .web_endpoints import ActivityPostService
from .web_endpoints import ActivityRecordService
from .web_endpoints import AccountService

from .gplus import UpdateActivityPosts

import webapp2

application = endpoints.api_server([ActivityRecordService, ActivityPostService,
                                    AccountService], restricted=False)

app = webapp2.WSGIApplication([('/tasks/uapost', UpdateActivityPosts),], debug=True)