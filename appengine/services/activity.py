import endpoints
from protorpc import remote
from models import ActivityPost
from models import ActivityRecord

api_root = endpoints.api(name='gdetracking', version='v1.0b1')


@api_root.api_class(resource_name='activity_record', path='activityRecord')
class ActivityRecordService(remote.Service):

    @ActivityRecord.method(request_fields=('id',),  path='/activityRecord/{id}', http_method='GET', name='get')
    def get(self, activity_record):
        if not activity_record.from_datastore:
            raise endpoints.NotFoundException('ActivityRecord not found.')

        return activity_record

    @ActivityRecord.query_method(path='activityRecord', name='activityRecord.list')
    def ActivityRecordList(self, query2):
        return query2


@api_root.api_class(resource_name='activity_post', path='activityPost')
class ActivityPostService(remote.Service):

    @ActivityPost.method(path='/activityPost/{id}', http_method='POST', name='insert')
    def insert(self, activity_post):
        activity_post.put()
        # is there a link attached to the post? if not query using the post as
        # activity link
        activity_link = activity_post.links
        if activity_post.links == "":
            activity_link = activity_post.url

        # find out if a record exist
        records = ActivityRecord.query(
                ActivityRecord.activity_link == activity_link).fetch(20)

        if (len(records) == 0):
            activity_record = ActivityRecord(gplus_id=activity_post.gplus_id, 
                activity_link=activity_link)
        elif(len(records) == 1):
            activity_record = records[0]
        else:
            # TODO : DON'T KNOW WHAT TO DO HERE
            return remote.ApplicationError("Mutiple Matching ActivityRecord Found")

        activity_record.add_post(activity_post)
        activity_record.put()

        return activity_post

    @ActivityPost.method(request_fields=('id',),  path='/activityPost/{id}', http_method='GET', name='get')
    def get(self, activity_post):
        if not activity_post.from_datastore:
            raise endpoints.NotFoundException('ActivityPost not found.')

        return activity_post

    @ActivityPost.query_method(path='activityPost', name='activityPost.list')
    def ActivityPostList(self, query):
        return query

