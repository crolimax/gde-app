import endpoints
from protorpc import remote
from models import ActivityRecord
api_root = endpoints.api(name='gdetracking', version='v1.0b1')

@api_root.api_class(resource_name='activity_record', path='activityRecord')
class ActivityRecordService(remote.Service):

    @ActivityRecord.method(path='/activityRecord/{id}', http_method='POST', name='insert')
    def insert(self, activity_record):
    	#if activity_record.from_datastore:
    		#name = activity_record.key.string_id()
    		#raise endpoints.BadRequestException(
    			#'ActivityRecord of id %s already exists. ' % (name,))
        activity_record.put()
        return activity_record


    @ActivityRecord.method(request_fields=('id',),  path='/activityRecord/{id}', http_method='GET', name='get')
    def get(self, activity_record):
        if not activity_record.from_datastore:
            raise endpoints.NotFoundException('ActivityRecord not found.')

        return activity_record