import endpoints
from protorpc import remote
from models import ActivityPost
from models import ActivityRecord
from models import activity_record as ar
from models import Account
from datetime import datetime

api_root = endpoints.api(name='gdetracking', version='v1.0b1')


@api_root.api_class(resource_name='activity_record', path='activityRecord')
class ActivityRecordService(remote.Service):

    @ActivityRecord.method(request_fields=('id',), path='/activityRecord/{id}',
                           http_method='GET', name='get')
    def get(self, activity_record):
        if not activity_record.from_datastore:
            raise endpoints.NotFoundException('ActivityRecord not found.')
        return activity_record

    @ActivityRecord.method(path='/activityRecord/{id}', http_method='POST',
                           name='insert')
    def ActivityRecordInsert(self, activity_record):
        activity_record.put()
        return activity_record

    @ActivityRecord.method(path='/activityRecord/{id}', http_method='PUT',
                           name='update')
    def ActivityRecordUpdate(self, activity_record):
        if not activity_record.from_datastore:
            raise endpoints.NotFoundException('ActivityRecord not found.')
        activity_record.put()
        return activity_record

    @ActivityRecord.method(path='/activityRecord/{id}', http_method='PATCH',
                           name='patch')
    def ActivityRecordPatch(self, activity_record):
        if not activity_record.from_datastore:
            raise endpoints.NotFoundException('ActivityRecord not found.')
        activity_record.put()
        return activity_record

    @ActivityRecord.method(request_fields=('id',), response_fields=('id',),
                           path='/activityRecord/{id}',
                           http_method='DELETE', name='delete')
    def ActivityRecordDelete(self, activity_record):
        if not activity_record.from_datastore:
            raise endpoints.NotFoundException('ActivityRecord not found.')
        activity_record.key.delete()
        return activity_record

    @ActivityRecord.query_method(query_fields=('limit', 'order', 'pageToken', 'gplus_id',
                                               'minDate', 'maxDate'),
                                 path='activityRecord', name='list')
    def ActivityRecordList(self, query):
        return query


@api_root.api_class(resource_name='activity_post', path='activityPost')
class ActivityPostService(remote.Service):

    @ActivityPost.method(path='/activityPost/{id}', http_method='POST',
                         name='insert')
    def insert(self, activity_post):
        activity_post.put()
        activity_record = ar.find_or_create(activity_post)
        activity_record.add_post(activity_post)
        return activity_post

    @ActivityPost.method(request_fields=('id',),  path='/activityPost/{id}',
                         http_method='GET', name='get')
    def get(self, activity_post):
        if not activity_post.from_datastore:
            raise endpoints.NotFoundException('ActivityPost not found.')
        return activity_post

    @ActivityPost.query_method(query_fields=('limit', 'order', 'pageToken'),
                               path='activityPost', name='list')
    def ActivityPostList(self, query):
        return query


@api_root.api_class(resource_name='account', path='account')
class AccountService(remote.Service):

    @Account.method(path='/account/{id}', http_method='POST', name='insert')
    def AccountInsert(self, account):
        account.put()
        return account

    @Account.method(request_fields=('id',),  path='/account/{id}',
                    http_method='GET', name='get')
    def get(self, account):
        if not account.from_datastore:
            raise endpoints.NotFoundException('Account not found.')
        return account

    @Account.query_method(query_fields=('limit', 'order', 'pageToken', 'type'),
                          path='account', name='list')
    def AccountList(self, query):
        return query
