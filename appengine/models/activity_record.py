from google.appengine.ext import ndb
from endpoints_proto_datastore.ndb import EndpointsModel
from endpoints_proto_datastore.ndb import EndpointsAliasProperty

from models import ActivityPost


class ActivityRecord(EndpointsModel):

    _message_fields_schema = ('id', 'gplus_id', 'date_created', 'date_updated', 'activity_link',
                             'gplus_posts', 'plus_oners', 'resharers')

    # we identify GDE's uniquely using this
    gplus_id = ndb.StringProperty()
    # dates
    date_created = ndb.DateTimeProperty(auto_now_add=True)
    date_updated = ndb.DateTimeProperty(auto_now=True)
    # related posts, we store the post_id's and the activity link
    # in some case the activity link is the gplus_post link itself
    # when there are no links attached to the post
    activity_link = ndb.StringProperty()
    gplus_posts = ndb.StringProperty(repeated=True)
    # cumulative plus_oners & resharers
    plus_oners = ndb.IntegerProperty()
    resharers = ndb.IntegerProperty()

    def calculate_impact(self):
        self.plus_oners = 0
        self.resharers = 0
        for post_id in self.gplus_posts:
            post_key = ndb.Key(ActivityPost, post_id)
            activity_post = post_key.get()
            if activity_post is not None:
                self.plus_oners += activity_post.plus_oners
                self.resharers += activity_post.resharers

    def add_post(self, activity_post):
        if (self.gplus_posts.count(activity_post.post_id) == 0):
            self.gplus_posts.append(activity_post.post_id)
        self.calculate_impact()
