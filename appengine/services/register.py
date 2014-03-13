import endpoints
from .activity_post import ActivityPostService

application = endpoints.api_server([ActivityPostService], restricted=False)