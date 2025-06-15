
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
    department = Column(ProfessorTableColumns.DEPARTMENT.value, String(255))
    image_url = Column(ProfessorTableColumns.IMAGE_URL.value,String(255))
    details = Column (ProfessorTableColumns.DETAILS.value, String(255))

    courses = relationship("Course", back_populates="professor")
    domains = relationship("Domain", secondary="professor_domains", back_populates="professors")
    def __init__(self, first_name: str, last_name: str, title: str, email: str, web_page: str, department: str, image_url : str,details: str):
        super().__init__()
        self.first_name = first_name
        self.last_name = last_name
        self.title = title
        self.email = email
        self.web_page = web_page
        self.department = department
        self.image_url = image_url
        self.details = details

    def __str__(self):
        return f'{self.title} {self.first_name} {self.last_name}'
    def __repr__(self):
        return f"<Professor(id='{self.professor_id}', name='{self.first_name} {self.last_name}', email='{self.email}')>"
