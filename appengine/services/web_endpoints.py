import endpoints
from protorpc import remote
from models import ActivityPost
from models import ActivityRecord
from models import activity_record as ar
from models import Account
from models import ActivityType
from models import ProductGroup

from .utils import check_auth

_CLIENT_IDs = [
    endpoints.API_EXPLORER_CLIENT_ID,
    '47242318878-dik3r14d8jc528h1ao35f8ehqa7tmpe1.apps.googleusercontent.com'
]

api_root = endpoints.api(name='gdetracking', version='v1.0b2', allowed_client_ids=_CLIENT_IDs)


@api_root.api_class(resource_name='activity_record', path='activityRecord')
class ActivityRecordService(remote.Service):

    @ActivityRecord.method(request_fields=('id',), path='/activityRecord/{id}',
                           http_method='GET', name='get')
    def get(self, activity_record):
        if not activity_record.from_datastore:
            raise endpoints.NotFoundException('ActivityRecord not found.')
        return activity_record

    @ActivityRecord.method(path='/activityRecord', http_method='POST',
                           name='insert')
    def ActivityRecordInsert(self, activity_record):

        if not check_auth(activity_record.gplus_id, activity_record.api_key):
            raise endpoints.UnauthorizedException('Only GDEs and admins may enter or change data.')

        activity_record.put()
        return activity_record

    @ActivityRecord.method(path='/activityRecord/{id}', http_method='PUT',
                           name='update')
    def ActivityRecordUpdate(self, activity_record):
        if not activity_record.from_datastore:
            raise endpoints.NotFoundException('ActivityRecord not found.')

        if not check_auth(activity_record.gplus_id, activity_record.api_key):
            raise endpoints.UnauthorizedException('Only GDEs and admins may enter or change data.')

        activity_record.put()
        return activity_record

    @ActivityRecord.method(path='/activityRecord/{id}', http_method='PATCH',
                           name='patch')
    def ActivityRecordPatch(self, activity_record):
        if not activity_record.from_datastore:
            raise endpoints.NotFoundException('ActivityRecord not found.')

        if not check_auth(activity_record.gplus_id, activity_record.api_key):
            raise endpoints.UnauthorizedException('Only GDEs and admins may enter or change data.')

        activity_record.put()
        return activity_record

    @ActivityRecord.method(request_fields=('id', 'api_key',), response_fields=('id',),
                           path='/activityRecord/{id}',
                           http_method='DELETE', name='delete')
    def ActivityRecordDelete(self, activity_record):
        if not activity_record.from_datastore:
            raise endpoints.NotFoundException('ActivityRecord not found.')

        if not check_auth(activity_record.gplus_id, activity_record.api_key):
            raise endpoints.UnauthorizedException('Only GDEs and admins may enter or change data.')

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
        if not check_auth(activity_post.gplus_id, activity_post.api_key):
            raise endpoints.UnauthorizedException('Only GDEs and admins may enter or change data.')

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

    @Account.method(path='/account/{id}', http_method='POST', name='insert',
                    request_fields=('id', 'gplus_id', 'gplus_page', 'type',
                                    'display_name', 'pic_url', 'geocode',
                                    'real_name', 'email', 'location', 'region',
                                    'country', 'ctry_filename', 'product_group',
                                    'pg_filename', 'deleted', 'api_key'),
                    response_fields=('id', 'gplus_id', 'gplus_page', 'type',
                                     'display_name', 'pic_url', 'geocode',
                                     'real_name', 'email', 'location', 'region',
                                     'country', 'ctry_filename', 'product_group',
                                     'pg_filename', 'deleted'))
    def AccountInsert(self, account):
        if not check_auth(None, account.api_key):
            raise endpoints.UnauthorizedException('Only Admins may enter or change this data.')

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


@api_root.api_class(resource_name='activity_type', path='activityType')
class ActivityTypeService(remote.Service):

    @ActivityType.method(path='/activityType/{id}', http_method='POST', name='insert',
                         request_fields=('id', 'tag', 'description', 'group', 'api_key'))
    def at_insert(self, activity_type):
        if not check_auth(None, activity_type.api_key):
            raise endpoints.UnauthorizedException('Only Admins may enter or change this data.')

        activity_type.put()
        return activity_type

    @ActivityType.method(request_fields=('id',),  path='/activityType/{id}',
                    http_method='GET', name='get')
    def at_get(self, activity_type):
        if not activity_type.from_datastore:
            raise endpoints.NotFoundException('Activity type not found.')
        return activity_type

    @ActivityType.method(request_fields=('id', 'api_key'), response_fields=("id",),
                         path='/activityType/{id}',
                         http_method='DELETE', name='delete')
    def at_delete(self, activity_type):
        if not activity_type.from_datastore:
            raise endpoints.NotFoundException('Activity type not found.')
        if not check_auth(None, activity_type.api_key):
            raise endpoints.UnauthorizedException('Only Admins may enter or change this data.')

        activity_type.key.delete()

        return activity_type

    @ActivityType.query_method(query_fields=('limit', 'order', 'pageToken'),
                               path='/activityType', name='list')
    def at_list(self, query):
        return query


@api_root.api_class(resource_name='product_group', path='productGroup')
class ProductGroupService(remote.Service):

    @ProductGroup.method(path='/productGroup/{id}', http_method='POST', name='insert',
                         request_fields=('id', 'tag', 'description', 'url', 'image', 'api_key'))
    def pg_insert(self, product_group):
        if not check_auth(None, product_group.api_key):
            raise endpoints.UnauthorizedException('Only Admins may enter or change this data.')

        product_group.put()
        return product_group

    @ProductGroup.method(request_fields=('id',),  path='/productGroup/{id}',
                    http_method='GET', name='get')
    def pg_get(self, product_group):
        if not product_group.from_datastore:
            raise endpoints.NotFoundException('Activity type not found.')
        return product_group

    @ProductGroup.method(request_fields=('id', 'api_key'), response_fields=("id",),
                         path='/productGroup/{id}',
                         http_method='DELETE', name='delete')
    def pg_delete(self, product_group):
        if not product_group.from_datastore:
            raise endpoints.NotFoundException('Activity type not found.')
        if not check_auth(None, product_group.api_key):
            raise endpoints.UnauthorizedException('Only Admins may enter or change this data.')

        product_group.key.delete()

        return product_group

    @ProductGroup.query_method(query_fields=('limit', 'order', 'pageToken'),
                               path='/productGroup', name='list')
    def pg_list(self, query):
        return query
