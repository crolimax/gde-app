from google.appengine.ext import ndb
from endpoints_proto_datastore.ndb import EndpointsModel
from endpoints_proto_datastore.ndb import EndpointsAliasProperty


class ActivityPost(EndpointsModel):

    _message_fields_schema = ('id', 'post_id', 'gplus_id', 'name', 'date',
                              'plus_oners', 'resharers', 'comments', 'title', 'url',
                              'product_group', 'activity_type', 'links')

    # tempted to use the G+ unique activity id ( stack overflow ?)
    post_id = ndb.StringProperty()
    # we identify GDE's uniquely using this
    gplus_id = ndb.StringProperty()
    name = ndb.StringProperty()
    # date at which the activity (post) was made
    date = ndb.StringProperty()
    plus_oners = ndb.IntegerProperty()
    resharers = ndb.IntegerProperty()
    comments = ndb.IntegerProperty()
    title = ndb.StringProperty()
    # url of the post (question for stack overflow)
    url = ndb.StringProperty()
    product_group = ndb.StringProperty(repeated=True)
    activity_type = ndb.StringProperty(repeated=True)
    links = ndb.StringProperty()

    def IdSet(self, value):
        if not isinstance(value, basestring):
            raise TypeError('ID must be a string.')
        self.UpdateFromKey(ndb.Key(ActivityPost, value))

    @EndpointsAliasProperty(setter=IdSet, required=True)
    def id(self):
        if self.key is not None:
            return self.key.string_id()



