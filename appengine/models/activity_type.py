from google.appengine.ext import ndb
from endpoints_proto_datastore.ndb import EndpointsModel
from endpoints_proto_datastore.ndb import EndpointsAliasProperty
from protorpc import messages


class ActivityType(EndpointsModel):

    _message_fields_schema = ('id', 'tag', 'description', 'group')

    _api_key = None

    # Hashtag to be used for this activity type
    tag = ndb.StringProperty()

    # Description of the Activity Type / to be displayed in the Front End
    description = ndb.StringProperty()

    # Associtated activity group (e.g. #content) for metadata
    group = ndb.StringProperty()

    def ApiKeySet(self, value):
        self._api_key = value

    @EndpointsAliasProperty(setter=ApiKeySet, property_type=messages.StringField)
    def api_key(self):
        return self._api_key

    def IdSet(self, value):
        if not isinstance(value, basestring):
            raise TypeError('ID must be a string.')
        self.UpdateFromKey(ndb.Key(ActivityType, value))

    @EndpointsAliasProperty(setter=IdSet, required=True)
    def id(self):
        if self.key is not None:
            return self.key.string_id()

    @classmethod
    def all_tags(cls):
        return [entity.tag for entity in cls.query()]
