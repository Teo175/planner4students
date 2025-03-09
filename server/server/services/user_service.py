from typing import Iterable, Optional

from server.models.user import User
from server.repositories.user_repository import UserRepository


class UserService:
    """
    Service for UsersService
    """

    def __init__(self, session):
        self.userRepository = UserRepository(session)


    def find_user_by_email(self, email: str) -> User:
        """
        Retrieve a user by their user_name
        :param email: The email of the user
        :return: User object or None if not found
        """
        return self.userRepository.get_user_by_email(email)

    def add_user(self, new_user: User) -> User:
        """
        Adds a new user in the system
        :param email: The data of the new user
        :return: User object or None if not added
        """
        return self.userRepository.add_user(new_user)


