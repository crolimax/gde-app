import endpoints
from .activity_record import ActivityRecordService

application = endpoints.api_server([ActivityRecordService], restricted=False)