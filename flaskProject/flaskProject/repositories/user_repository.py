from models.user import UserData
from init import db

class UserRepository:
    @staticmethod
    def find_by_username(username):
        return UserData.query.filter_by(username=username).first()

    @staticmethod
    def save(user):
        db.session.add(user)
        db.session.commit()
