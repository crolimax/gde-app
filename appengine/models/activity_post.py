from google.appengine.ext import ndb
from endpoints_proto_datastore.ndb import EndpointsModel
from endpoints_proto_datastore.ndb import EndpointsAliasProperty


class ActivityPost(EndpointsModel):

    _message_fields_schema = ('id', 'post_id', 'gplus_id', 'name', 'date', 'plus_oners', 'resharers', 
        'title', 'url', 'product_group', 'activity_type', 'links')

    # tempted to use the G+ unique activity id ( stack overflow ?)
    post_id = ndb.StringProperty()
    gplus_id = ndb.StringProperty()          # we identify GDE's uniquely using this
    name = ndb.StringProperty()
    date = ndb.StringProperty()				# date at which the activity (post) was made
    plus_oners = ndb.IntegerProperty(default=0)
    resharers = ndb.IntegerProperty(default=0)
    title = ndb.StringProperty()
    # url of the post (question for stack overflow)
    url = ndb.StringProperty()
    product_group = ndb.StringProperty()
    activity_type = ndb.StringProperty()
    links = ndb.StringProperty()

    def IdSet(self, value):
        if not isinstance(value, basestring):
            raise TypeError('ID must be a string.')
        self.UpdateFromKey(ndb.Key(ActivityPost, value))

    @EndpointsAliasProperty(setter=IdSet, required=True)
    def id(self):
        if self.key is not None:
            return self.key.string_id()



