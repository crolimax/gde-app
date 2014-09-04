from google.appengine.ext import ndb
from endpoints_proto_datastore.ndb import EndpointsModel
from endpoints_proto_datastore.ndb import EndpointsAliasProperty
from protorpc import messages


class ActivityGroup(EndpointsModel):

    _message_fields_schema = ('id', 'tag', 'types', 'title', 'description', 'link',
                              'impact', 'other_link1', 'other_link2', 'location',
                              'google_expensed', 'us_approx_amount')

    _api_key = None

    # Hashtag to be used for the activity group
    tag = ndb.StringProperty()

    # type of the activity, sub-type of this activity group
    types = ndb.StringProperty(repeated=True)

    # Labels for the different data fields
    # Fields with empty labels should not be displayed in the UI
    title = ndb.StringProperty()
    description = ndb.StringProperty()
    link = ndb.StringProperty()
    impact = ndb.StringProperty()
    other_link1 = ndb.StringProperty()
    other_link2 = ndb.StringProperty()
    location = ndb.StringProperty()
    google_expensed = ndb.StringProperty()
    us_approx_amount = ndb.StringProperty()

    def ApiKeySet(self, value):
        self._api_key = value

    @EndpointsAliasProperty(setter=ApiKeySet, property_type=messages.StringField)
    def api_key(self):
        return self._api_key

    def IdSet(self, value):
        if not isinstance(value, basestring):
            raise TypeError('ID must be a string.')
        self.UpdateFromKey(ndb.Key(ActivityGroup, value))

    @EndpointsAliasProperty(setter=IdSet, required=True)
    def id(self):
        if self.key is not None:
            return self.key.string_id()

    @classmethod
    def all_tags(cls):
        return [entity.tag for entity in cls.query()]
