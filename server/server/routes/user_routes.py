from flask import Blueprint, jsonify,request
from init import db
from sqlalchemy import text
from models.user import UserData
from services.user_service import UserService

user_bp = Blueprint('user', __name__)
@user_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')

    if not username or not password:
        return jsonify({"message": "Username and password are required"}), 400

    success, message = UserService.login(username, password)
    status_code = 200 if success else 401
    return jsonify({"message": message}), status_code

@user_bp.route('/sign-in', methods=['POST'])
def sign_in():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')

    # Validate input
    if not username or not password:
        return jsonify({"message": "Username and password are required"}), 400

    # Use UserService to handle sign-in logic
    success, message = UserService.register_user(username, password)
    status_code = 201 if success else 400

    return jsonify({"message": message}), status_code