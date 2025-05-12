
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy import Column, String, Integer, Text, ForeignKey
from sqlalchemy import text
from sqlalchemy.orm import relationship

from server.models.column_names import ProfessorTableColumns
from server.models.base import Base


class Professor(Base):
    __tablename__ = 'professors'

    professor_id = Column(UUID(as_uuid=True), primary_key=True, server_default=text('gen_random_uuid()'))
    first_name = Column(ProfessorTableColumns.FIRST_NAME.value, String(100), nullable=False)
    last_name = Column(ProfessorTableColumns.LAST_NAME.value, String(100), nullable=False)
    title = Column(ProfessorTableColumns.TITLE.value,String(100),nullable=False)
    email = Column(ProfessorTableColumns.EMAIL.value, String(255), unique=True)
    web_page = Column(ProfessorTableColumns.WEB_PAGE.value, String(255), unique=True)

    courses = relationship("Course", back_populates="professor")

    def __init__(self, first_name: str, last_name: str, title: str, email: str, web_page: str):
        super().__init__()
        self.first_name = first_name
        self.last_name = last_name
        self.title = title
        self.email = email
        self.web_page = web_page

    def __str__(self):
        return f'{self.title} {self.first_name} {self.last_name}'
    def __repr__(self):
        return f"<Professor(id='{self.user_id}', name='{self.first_name} {self.last_name}', email='{self.email}')>"
