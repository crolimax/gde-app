from google.appengine.ext import ndb
from endpoints_proto_datastore.ndb import EndpointsModel
from endpoints_proto_datastore.ndb import EndpointsAliasProperty


class ActivityRecord(EndpointsModel):

    _message_fields_schema = ('id', 'postId', 'gplusId', 'name', 'date', 'plusOners', 'resharers', 
        'title', 'url', 'productGroup', 'activityType', 'links', 'activityMetadata')

    # tempted to use the G+ unique activity id ( stack overflow ?)
    postId = ndb.StringProperty()
    gplusId = ndb.StringProperty()          # we identify GDE's uniquely using this
    name = ndb.StringProperty()
    date = ndb.StringProperty()				# date at which the activity (post) was made
    plusOners = ndb.IntegerProperty()
    resharers = ndb.IntegerProperty()
    title = ndb.StringProperty()
    # url of the post (question for stack overflow)
    url = ndb.StringProperty()
    productGroup = ndb.StringProperty()
    activityType = ndb.StringProperty()
    links = ndb.StringProperty()
    # each activity type has a different Metadata
    activityMetadata = ndb.StringProperty()

    def IdSet(self, value):
        if not isinstance(value, basestring):
            raise TypeError('ID must be a string.')
        self.UpdateFromKey(ndb.Key(ActivityRecord, value))

    @EndpointsAliasProperty(setter=IdSet, required=True)
    def id(self):
        if self.key is not None:
            return self.key.string_id()



