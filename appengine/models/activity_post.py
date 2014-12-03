import re
import logging
from google.appengine.ext import ndb
from endpoints_proto_datastore.ndb import EndpointsModel
from endpoints_proto_datastore.ndb import EndpointsAliasProperty
from endpoints_proto_datastore.ndb import EndpointsVariantIntegerProperty
from protorpc import messages
from models.activity_type import ActivityType
from models.product_group import ProductGroup

class ActivityPost(EndpointsModel):

    _message_fields_schema = ('id', 'post_id', 'gplus_id', 'name', 'date',
                              'plus_oners', 'resharers', 'comments', 'title', 'url',
                              'product_group', 'activity_type', 'links', 'api_key')

    _api_key = None

    # tempted to use the G+ unique activity id ( stack overflow ?)
    post_id = ndb.StringProperty()
    # we identify GDE's uniquely using this
    gplus_id = ndb.StringProperty()
    name = ndb.StringProperty()
    # date at which the activity (post) was made
    date = ndb.StringProperty()
    plus_oners = EndpointsVariantIntegerProperty(variant=messages.Variant.INT32)
    resharers = EndpointsVariantIntegerProperty(variant=messages.Variant.INT32)
    comments = EndpointsVariantIntegerProperty(variant=messages.Variant.INT32) 
    title = ndb.StringProperty()
    # url of the post (question for stack overflow)
    url = ndb.StringProperty()
    product_group = ndb.StringProperty(repeated=True)
    activity_type = ndb.StringProperty(repeated=True)
    links = ndb.StringProperty()

    def ApiKeySet(self, value):
        self._api_key = value

    @EndpointsAliasProperty(setter=ApiKeySet, property_type=messages.StringField)
    def api_key(self):
        return self._api_key

    def IdSet(self, value):
        if not isinstance(value, basestring):
            raise TypeError('ID must be a string.')
        self.UpdateFromKey(ndb.Key(ActivityPost, value))

    @EndpointsAliasProperty(setter=IdSet, required=True)
    def id(self):
        if self.key is not None:
            return self.key.string_id()

    def create_from_gplus_post(self, gplus_post):
        self.post_id = gplus_post["id"]
        self.name=gplus_post['actor']['displayName']
        self.gplus_id=gplus_post['actor']['id']
        self.date=gplus_post["updated"]
        self.url=gplus_post["url"]
        self.title=gplus_post["title"]
        self.plus_oners=gplus_post['object']['plusoners']['totalItems']
        self.resharers=gplus_post['object']['resharers']['totalItems']
        self.comments=gplus_post['object']['replies']['totalItems']

        content = gplus_post["object"]["content"]
        if 'annotation' in gplus_post:
            content += ' ' + gplus_post['annotation']

        self.activity_type = self.get_activity_types(content)
        self.product_group = self.get_product_groups(content)
        try:
            attachments = gplus_post["object"]["attachments"]
        except Exception as e:
            logging.info('no attachments')
            self.links=""
        else:
            attachment_links = self.get_links(attachments)
            self.links=attachment_links

    def get_activity_types(self, content):
        """Extract activity type hashtags."""
        at = []
        for activity_type in ActivityType.all_tags():
            result = re.search(activity_type, content, flags=re.IGNORECASE)
            if result is not None:
                at.append(activity_type)
        return at

    def get_product_groups(self, content):
        """Extract product group hashtags."""
        pg = []
        for product_group in ProductGroup.all_tags():
            result = re.search(product_group, content, flags=re.IGNORECASE)
            if result is not None:
                pg.append(product_group)
        return pg

    def get_links(self, attachments):
        """Extract links."""
        links = ""
        for attachment in attachments:
            if attachment["objectType"] == "article" or attachment["objectType"] == "video":
                if links != "":
                    links += ", "
                links += attachment["url"]
        return links
