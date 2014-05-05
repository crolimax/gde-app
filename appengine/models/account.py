from google.appengine.ext import ndb
from endpoints_proto_datastore.ndb import EndpointsModel
from endpoints_proto_datastore.ndb import EndpointsAliasProperty


class Account(EndpointsModel):

    _message_fields_schema = ('id', 'gplus_id', 'gplus_page', 'type',
                              'display_name', 'pic_url', 'geocode',
                              'real_name', 'email', 'location', 'region',
                              'country', 'ctry_filename', 'product_group',
                              'pg_filename', 'deleted')

    gplus_id = ndb.StringProperty()
    gplus_page = ndb.StringProperty()
    type = ndb.StringProperty()
    display_name = ndb.StringProperty()
    real_name = ndb.StringProperty()
    email = ndb.StringProperty()
    location = ndb.StringProperty()
    region = ndb.StringProperty()
    country = ndb.StringProperty()
    ctry_filename = ndb.StringProperty()
    geocode = ndb.StringProperty()
    product_group = ndb.StringProperty(repeated=True)
    pg_filename = ndb.StringProperty()
    deleted = ndb.BooleanProperty()
    pic_url = ndb.StringProperty()
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