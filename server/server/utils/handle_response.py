from flask import jsonify
from server.common.common_constants import HTTP_OK_CODE

def handle_response(message, data=None, status_code=HTTP_OK_CODE):
    response = {
        'message': message,
        'data': data,
        'status': status_code
    }
    return jsonify(response)
