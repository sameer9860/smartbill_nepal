from rest_framework.exceptions import APIException


class PaymentRequired(APIException):
    status_code = 402
    default_detail = {
        'detail': 'Your free trial has expired. Please subscribe to continue.',
        'code': 'trial_expired',
    }
    default_code = 'payment_required'
