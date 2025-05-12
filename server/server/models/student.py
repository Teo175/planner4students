
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy import Column, String, Integer, Text, ForeignKey
from sqlalchemy import text
from sqlalchemy.orm import relationship

from server.models.column_names import StudentTableColumns
from server.models.base import Base


class Student(Base):
    __tablename__ = 'students'

    student_id = Column(UUID(as_uuid=True), primary_key=True, server_default=text('gen_random_uuid()'))
    first_name = Column(StudentTableColumns.FIRST_NAME.value, String(100), nullable=False)
    last_name = Column(StudentTableColumns.LAST_NAME.value, String(100), nullable=False)
    email = Column(StudentTableColumns.EMAIL.value, String(255), unique=True, nullable=False)
    password = Column(StudentTableColumns.PASSWORD.value, String(255), nullable=False)
    subgroup_id = Column(
        StudentTableColumns.SUBGROUP_ID.value,
        UUID(as_uuid=True),
        ForeignKey('subgroups.subgroup_id'),
        nullable=False
    )

    subgroup = relationship("Subgroup", back_populates="students")

    def __init__(self, first_name: str, last_name: str, email: str, password: str, subgroup_id: UUID):
        super().__init__()
        self.first_name = first_name
        self.last_name = last_name
        self.email = email
        self.password = password
        self.subgroup_id = subgroup_id

    def get_student_id(self) -> str:
        return self.student_id
    def get_email(self) -> str:
        return self.email
    def get_subgroup(self):
        return self.subgroup
    def __str__(self):
        return f'{self.first_name} {self.last_name} '
    def __repr__(self):
        return f"<Student(id='{self.student_id}', name='{self.first_name} {self.last_name}', email='{self.email}')>"
