import json
import webapp2
from google.appengine.ext import ndb
import logging

from models.activityRecord import ActivityRecord


class RPCMethods:

    """ Defines the methods that can be RPCed.
    NOTE: Do not allow remote callers access to private/protected "_*" methods.
    """

    def getActivityRecord(self, params):
        query_activityRecord = ActivityRecord.query(ActivityRecord.id == params["id"])

        for activityRecord in query_activityRecord:
            activityRecord_json = {}
            activityRecord_json["id"] =  ActivityRecord.id
            activityRecord_json["gplusId"] =  ActivityRecord.gplusId
            activityRecord_json["name"] =  ActivityRecord.name
            activityRecord_json["date"] =  ActivityRecord.date
            activityRecord_json["plusOners"] =  ActivityRecord.plusOners
            activityRecord_json["title"] =  ActivityRecord.title
            activityRecord_json["url"] =  ActivityRecord.url
            activityRecord_json["productGroup"] =  ActivityRecord.productGroup
            activityRecord_json["activityType"] =  ActivityRecord.activityType
            activityRecord_json["links"] =  ActivityRecord.links
            activityRecord_json["activityMetadata"] =  ActivityRecord.activityMetadata
            return activityRecord_json
        return None

    def updateActivityRecord(self, params):
        activityRecord = self.getActivityRecord({"id": params["id"]})
        if activityRecord == None:
            activityRecord = ActivityRecord(id=params["id"],
                                            gplusId=params["gplusId"],
                                            name=params["name"],
                                            date=params["date"],
                                            plusOners=params["plusOners"],
                                            resharers=params["resharers"],
                                            title=params["title"],
                                            url=params["url"],
                                            productGroup=params["productGroup"],
                                            activityType=params["activityType"],
                                            links=params["links"],
                                            activityMetadata=params["activityMetadata"])
        else:
            query_activityRecord = ActivityRecord.query(ActivityRecord.id == params["id"])
            for activityRecord in query_activityRecord:
                activityRecord.id = params["id"]
                activityRecord.gplusId = params["gplusId"]
                activityRecord.name = params["name"]
                activityRecord.plusOners = params["plusOners"]
                activityRecord.resharers = params["resharers"]
                activityRecord.title = params["title"]
                activityRecord.date = params["date"]
                activityRecord.url = params["url"]
                activityRecord.productGroup = params["productGroup"]
                activityRecord.activityType = params["activityType"]
                activityRecord.links = params["links"]

        activityRecord.put()
        return True


class RPCHandler(webapp2.RequestHandler):

    """ Allows the functions defined in the RPCMethods class to be RPCed."""

    def __init__(self, request=None, response=None):
        webapp2.RequestHandler.__init__(self, request, response)
        self.methods = RPCMethods()

    def get(self):
        self.post()  # For debugging purposes, you may want this disabled

    def post(self):
        action = self.request.params['action']
        params = self.request.params['params']
        key = self.request.params['key']

        if not key or key != '6op48y9or0':
            self.error(404)  # file not found
            return

        if not action:
            self.error(404)  # file not found

        if action[0] == '_':
            self.error(403)  # access denied
            return

        func = getattr(self.methods, action, None)

        if not func:
            self.error(404)  # file not found
            return

        result = func(json.loads(params))
        self.response.out.write(json.dumps(result))

app = webapp2.WSGIApplication([('/rpc', RPCHandler),
                               ],
                              debug=False)
