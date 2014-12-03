""" Endpoint api server registration."""

import endpoints
from .web_endpoints import ActivityPostService
from .web_endpoints import ActivityRecordService
from .web_endpoints import AccountService
from .web_endpoints import ProductGroupService
from .web_endpoints import ActivityTypeService
from .web_endpoints import ActivityGroupService

application = endpoints.api_server([ActivityRecordService, ActivityPostService,
                                    AccountService, ProductGroupService,
                                    ActivityTypeService, ActivityGroupService],
                                   restricted=False)
