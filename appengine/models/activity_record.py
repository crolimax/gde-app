from google.appengine.ext import ndb
from endpoints_proto_datastore.ndb import EndpointsModel


class ActivityRecord(EndpointsModel):
    # tempted to use the G+ unique activity id ( stack overflow ?)
    id = ndb.StringProperty()
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
    activityMetadata = ndb.JsonProperty()
