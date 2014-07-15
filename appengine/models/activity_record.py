from google.appengine.ext import ndb
from endpoints_proto_datastore.ndb import EndpointsModel
from datetime import datetime

from models import ActivityPost


class ActivityMetaData(EndpointsModel):
    ## Description

    # should match one of the activity_types of the ActivityRecord
    kind = ndb.StringProperty()

    # for all types, can be event link/blog link/github link/...
    link = ndb.StringProperty()

    # bugreport, techtalk
    title = ndb.StringProperty()

    # opensourcecode
    description = ndb.StringProperty()

    # community
    event_name = ndb.StringProperty()
    event_type = ndb.StringProperty()
    photos_link = ndb.StringProperty()

    # techtalk
    abstract = ndb.StringProperty()
    slides_link = ndb.StringProperty()
    recordings_link = ndb.StringProperty()

    # community, techtalk
    location = ndb.StringProperty()
    google_covered_expenses = ndb.BooleanProperty()

    ## Metrics

    # bugreport
    users_affected = ndb.IntegerProperty()

    # community
    attendees = ndb.IntegerProperty()

    # forumpost
    upvotes = ndb.IntegerProperty()

    # article, blogpost, book, techdocs, translation
    page_views = ndb.IntegerProperty()
    plus_oners = ndb.IntegerProperty()
    reshares = ndb.IntegerProperty()

    # opensourcecode
    downloads = ndb.IntegerProperty()
    active_contributors = ndb.IntegerProperty()


class ActivityRecord(EndpointsModel):

    _message_fields_schema = ('id', 'gplus_id', 'gde_name', 'date_created',
                              'date_updated', 'post_date', 'activity_types',
                              'product_groups',
                              'activity_link', 'gplus_posts', 'activity_title',
                              'plus_oners', 'resharers', 'comments', 'metadata')

    # we identify GDE's uniquely using this
    gplus_id = ndb.StringProperty()
    gde_name = ndb.StringProperty()
    # dates: are they really useful????
    date_created = ndb.DateTimeProperty(auto_now_add=True)
    date_updated = ndb.DateTimeProperty(auto_now=True)
    # first post date, will be more interesting
    post_date = ndb.StringProperty()
    # related posts, we store the post_id's and the activity link
    # in some case the activity link is the gplus_post link itself
    # when there are no links attached to the post
    activity_link = ndb.StringProperty()
    activity_title = ndb.StringProperty()
    gplus_posts = ndb.StringProperty(repeated=True)
    # cumulative plus_oners & resharers
    plus_oners = ndb.IntegerProperty()
    resharers = ndb.IntegerProperty()
    comments = ndb.IntegerProperty()
    # activity types and product groups
    activity_types = ndb.StringProperty(repeated=True)
    product_groups = ndb.StringProperty(repeated=True)

    #  activity type metadata
    metadata = ndb.StructuredProperty(ActivityMetaData, repeated=True)

    def calculate_impact(self):
        self.plus_oners = 0
        self.resharers = 0
        self.comments = 0
        for post_id in self.gplus_posts:
            post_key = ndb.Key(ActivityPost, post_id)
            activity_post = post_key.get()
            if activity_post is not None:
                self.plus_oners += activity_post.plus_oners
                self.resharers += activity_post.resharers
                self.comments += activity_post.comments

                if activity_post.product_group:
                    for product_group in activity_post.product_group:
                        if product_group not in self.product_groups:
                            self.product_groups.append(product_group)

                if activity_post.activity_type:
                    for act_type in activity_post.activity_type:
                        if act_type not in self.activity_types:
                            self.activity_types.append(act_type)


    def add_post(self, activity_post):
        if (self.gplus_posts.count(activity_post.post_id) == 0):
            self.gplus_posts.append(activity_post.post_id)
        self.calculate_impact()
        self.put()


def create_activity_record(activity_post):
    # is there a link attached to the post? if not query using the post as
    # activity link
    activity_link = activity_post.links
    if activity_post.links == "":
        activity_link = activity_post.url

    date = datetime.strptime(activity_post.date[0:19], '%Y-%m-%dT%H:%M:%S')
    date_format = date.strftime("%Y/%m/%d")
    activity_record = ActivityRecord(gplus_id=activity_post.gplus_id,
                                     gde_name=activity_post.name,
                                     post_date=date_format,
                                     activity_link=activity_link,
                                     activity_title=activity_post.title)
    activity_record.put()
    return activity_record


def find_or_create(activity_post):
    # is there a link attached to the post? if not query using the post as
    # activity link
    activity_link = activity_post.links
    if activity_post.links == "":
        activity_link = activity_post.url

    # find out if a record exist
    records = ActivityRecord.query(ActivityRecord.activity_link ==
                                   activity_link).fetch(20)
    if (len(records) == 0):
        return create_activity_record(activity_post)
    elif(len(records) == 1):
        return records[0]
    else:
        # TODO : DON'T KNOW WHAT TO DO HERE
        return remote.ApplicationError("Mutiple Matching ActivityRecord")
