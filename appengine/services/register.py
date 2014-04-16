import endpoints
from .activity import ActivityPostService
from .activity import ActivityRecordService
from .activity import AccountService
#from .activity_record import ActivityRecordService

application = endpoints.api_server([ActivityRecordService, ActivityPostService,
                                    AccountService], restricted=False)
