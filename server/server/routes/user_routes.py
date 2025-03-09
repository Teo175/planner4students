from flask import Blueprint, request, jsonify
from server.api.user_api import UserAPI
from server.models.column_names import UserTableColumns
from server.models.user import User
from server.services.user_service import UserService

users_bp = Blueprint('users', __name__)


def register_routes_user(app, session):
    """
    Function that registers all the routes for the users requests
    """
    user_service = UserService(session)
    user_api = UserAPI(user_service)

    @users_bp.route('/logIn', methods=['GET'])
    def get_user_by_email():
        email = request.args.get('email')

        if not email:
            return {'error': 'Email is required'}, 400

        return user_api.get_user_by_email(email)

    @users_bp.route('/signUp', methods=['POST'])
    def sign_up_user():
        # Get the data from the request
        data = request.get_json()

        # Extract the necessary data from the request
        first_name = data.get(UserTableColumns.USER_FIRST_NAME.value)
        last_name = data.get(UserTableColumns.USER_LAST_NAME.value)
        email = data.get(UserTableColumns.USER_EMAIL.value)
        password = data.get(UserTableColumns.USER_PASSWORD.value)
        field = data.get(UserTableColumns.STUDY_FIELD.value)
        language = data.get(UserTableColumns.LANGUAGE.value)
        year_of_study = data.get(UserTableColumns.YEAR_OF_STUDY.value)

        # Check if all the fields are provided
        if not (first_name and last_name and email and password and field and language and year_of_study):
            return jsonify({'error': 'All fields are required'}), 400

        # Create a new user in the database (you can use an ORM method like `add_user`)
        new_user = User(
            first_name=first_name,
            last_name=last_name,
            email=email,
            password=password,
            field=field,
            language=language,
            year_of_study=year_of_study
        )

        # Call the user API to add the new user (you need to define this function in your `user_api` module)
        new_user = user_api.add_user(new_user)

        # If user is added successfully, return success message
        if new_user:
            return jsonify({'message': 'User registered successfully!'}), 201
        else:
            return jsonify({'error': 'Failed to create user'}), 500

    app.register_blueprint(users_bp)
