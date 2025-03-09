from flask import jsonify

from server.common.common_constants import HTTP_OK_CODE


def handle_response(message, data=None, status_code=HTTP_OK_CODE):
    """
    Creates a standardized JSON response.
    :param message: Message to include in the response.
    :param data: Optional data to include in the response.
    :param status_code: HTTP status code for the response.
    :return: A response with JSON data.
    """
    response = {
        'message': message,
        'data': data
    }
    return jsonify(response), status_code
