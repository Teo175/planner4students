from typing import Iterable

from sqlalchemy import func, and_

from server.models.user import User


class UserRepository:
    """
    Repository for users
    """

    def __init__(self, sess):
        """Constructor for UserRepository
            :param sess: session instance
         """
        self.session = sess


    def get_user_by_email(self, email: str) -> User:
        """
        Retrieve a user by their name
        :param email: The email of the user
        :return: User object or None if not found
        """
        return self.session.query(User).filter(User.email == email).first()

    def add_user(self, new_user:User) -> User or None:
        """
        Adds a new user in the system
        :param email: The data of the new user
        :return: User object or None if not added
        """
        existing_user = self.get_user_by_email(new_user.get_email())
        if existing_user:
            # Return None if user with the same email already exists
            return None

        # Hash the password before saving (security measure)
        # hashed_password = generate_password_hash(data_user.get('password'))
        try:
            # Add the new user to the session and commit
            self.session.add(new_user)
            self.session.commit()
            return new_user  # Successfully created and saved
        except Exception as e:
            # In case of error, rollback the transaction
            self.session.rollback()
            print(f"Error adding user: {e}")
            return None

