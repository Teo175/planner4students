
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy import Column, String, Integer, Text
from sqlalchemy import text
from server.models.column_names import UserTableColumns
from server.models.base import Base


class User(Base):
    __tablename__ = 'users'

    user_id = Column(UUID(as_uuid=True), primary_key=True, server_default=text('gen_random_uuid()'))
    first_name = Column(UserTableColumns.USER_FIRST_NAME.value, String(100), nullable=False)
    last_name = Column(UserTableColumns.USER_LAST_NAME.value, String(100), nullable=False)
    email = Column(UserTableColumns.USER_EMAIL.value, String(255), unique=True, nullable=False)
    password = Column(UserTableColumns.USER_PASSWORD.value, Text, nullable=False)
    field = Column(UserTableColumns.STUDY_FIELD.value, String(255))
    language = Column(UserTableColumns.LANGUAGE.value, String(50))
    year_of_study = Column(UserTableColumns.YEAR_OF_STUDY.value, Integer)

    def __init__(self, first_name: str, last_name: str, email: str, password: str, field: str = None,
                 language: str = None, year_of_study: int = None):
        super().__init__()
        self.first_name = first_name
        self.last_name = last_name
        self.email = email
        self.password = password
        self.field = field
        self.language = language
        self.year_of_study = year_of_study


    def get_email(self) -> str:
        return self.email

    def __str__(self):
        return f'{self.user_id} - {self.first_name} {self.last_name}'

    def __repr__(self):
        return f"<User(id='{self.user_id}', name='{self.first_name} {self.last_name}', email='{self.email}')>"
