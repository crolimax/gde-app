import endpoints
from .web_endpoints import ActivityPostService
from .web_endpoints import ActivityRecordService
from .web_endpoints import AccountService

application = endpoints.api_server([ActivityRecordService, ActivityPostService,
                                    AccountService], restricted=False)
