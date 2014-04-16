from google.appengine.ext import ndb
from endpoints_proto_datastore.ndb import EndpointsModel
from endpoints_proto_datastore.ndb import EndpointsAliasProperty

class Account(EndpointsModel):

    _message_fields_schema = ('id', 'type', 'display_name', 'real_name',
                              'email', 'location', 'region',
                              'country', 'product_group', 'deleted')

    type = ndb.StringProperty()
    plus_id = ndb.StringProperty()
    display_name = ndb.StringProperty()
    real_name = ndb.StringProperty()
    email = ndb.StringProperty()
    location = ndb.StringProperty()
    region = ndb.StringProperty()
    country = ndb.StringProperty()
    product_group = ndb.StringProperty(repeated=True)
    deleted = ndb.BooleanProperty()
    # how will we manage these? using AR ids?
    #activities = ndb.StringProperty(repeated=True)

    def IdSet(self, value):
        if not isinstance(value, basestring):
            raise TypeError('ID must be a string.')
        self.UpdateFromKey(ndb.Key(Account, value))

    @EndpointsAliasProperty(setter=IdSet, required=True)
    def id(self):
        if self.key is not None:
            return self.key.string_id()