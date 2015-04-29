""" Auth Utils

"""

import cloudstorage as gcs
import endpoints
import json
import os
import webapp2
import logging
import re
from datetime import datetime
from datetime import date
from google.appengine.api import app_identity
from google.appengine.api import mail
from apiclient.discovery import build

from models import ActivityPost
from models import ActivityRecord
from models import Account
from models import activity_record as ar


my_default_retry_params = gcs.RetryParams(initial_delay=0.2,
                                          max_delay=5.0,
                                          backoff_factor=2,
                                          max_retry_period=15)

gcs.set_default_retry_params(my_default_retry_params)


def get_so_api_key():
    bucket = '/' + os.environ.get('BUCKET_NAME',
                                  app_identity.get_default_gcs_bucket_name())

    secrets_file = None

    try:
        secrets_file = gcs.open(bucket + '/' + 'secrets.json', 'r')
    except gcs.NotFoundError:
        logging.error('secrets.json not found in default bucket')
        return None

    secrets = json.loads(secrets_file.read())
    return secrets.get('so_api_key')


def get_admin_api_key():
    bucket = '/' + os.environ.get('BUCKET_NAME',
                                  app_identity.get_default_gcs_bucket_name())

    secrets_file = None

    try:
        secrets_file = gcs.open(bucket + '/' + 'secrets.json', 'r')
    except gcs.NotFoundError:
        logging.error('secrets.json not found in default bucket')
        return None

    secrets = json.loads(secrets_file.read())
    return secrets.get('admin_api_key')


def get_server_api_key():
    bucket = '/' + os.environ.get('BUCKET_NAME',
                                  app_identity.get_default_gcs_bucket_name())

    secrets_file = None

    try:
        secrets_file = gcs.open(bucket + '/' + 'secrets.json', 'r')
    except gcs.NotFoundError:
        logging.error('secrets.json not found in default bucket')
        return None

    secrets = json.loads(secrets_file.read())
    return secrets.get('server_api_key')


def get_current_account():
    user = endpoints.get_current_user()
    if user is None:
        return None

    logging.debug('Authenticated user: %s' % user.email().lower())

    accounts = Account.query(Account.email == user.email().lower()).fetch(1)
    if len(accounts) == 0:
        return None

    return accounts[0]


def check_auth(gplus_id, api_key):

    # Check against API Key for maintainance script
    if api_key is not None:
        if api_key == get_admin_api_key():
            return True

    # check authenticated user
    user = get_current_account()
    if user is not None:
        # Users can change their own data
        if user.gplus_id == gplus_id:
            return True

        # Administrators can change everything
        if user.type == 'administrator':
            return True

        # We could do further checks here, depending on user.type, e.g.
        #  "disabled" GDEs are not allowed
        #  Only allow active GDEs to enter data
        return False

    return False
