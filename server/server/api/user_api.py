from typing import Dict, Any

from server.api.utils.handle_response import handle_response
from server.common.common_constants import USER_NOT_FOUND_ERROR, DATA_MESSAGE, USER_FOUND_ALREADY
from server.models.column_names import UserTableColumns
from server.models.user import User
from server.services.user_service import UserService


class UserAPI:
    """
    REST API for the users system
    """
    __service: UserService

    def __init__(self, service: UserService):
        """
        :param service: UsersService
        """
        self.__service = service


    def get_user_by_email(self, email: str) -> Dict[str, Any]:
        """
        Returns a user by email as a JSON object

        :param email: The email of the user
        :return: JSON object containing the user or an error message if not found
        """
        user = self.__service.find_user_by_email(email)
        if user:
            serialized_user = self.serialize_user(user)
            return handle_response(DATA_MESSAGE, serialized_user)
        else:
            return handle_response(USER_NOT_FOUND_ERROR, data=None)

    def add_user(self,new_user:User):
        """
        Adds a new user into the system
        :param user_data: The data of the new user
        :return JSON obj containing the new user created
        """
        existing_user = self.__service.find_user_by_email(new_user.get_email())
        if existing_user:
            return handle_response('User already have an account',data=None);

        # Hash the password before saving
        # hashed_password = generate_password_hash(password)

        user = self.__service.add_user(new_user)
        if user:
            serialized_user = self.serialize_user(user)
            return handle_response('User created successfully', serialized_user)
        else:
            return handle_response('User not found or creation failed', data=None)
    @staticmethod
    def serialize_user(user: User):
        """
        Function for serializing a user

        :param user: User
        :return: a dictionary containing every field of the user
        """
        if user is None:
            return {}
        return {UserTableColumns.USER_ID.value: user.user_id,
                UserTableColumns.USER_FIRST_NAME.value: user.first_name,
                UserTableColumns.USER_LAST_NAME.value: user.last_name,
                UserTableColumns.USER_EMAIL.value: user.email,
                UserTableColumns.USER_PASSWORD.value: user.password,
                UserTableColumns.STUDY_FIELD.value: user.field,
                UserTableColumns.LANGUAGE.value: user.language,
                UserTableColumns.YEAR_OF_STUDY.value: user.year_of_study}
