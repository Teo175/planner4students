
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy import Column, String, Integer, ForeignKey,Time
from sqlalchemy import text
from sqlalchemy.orm import relationship

from server.models.column_names import CourseTableColumns, StudentCoursesTableColumns
from server.models.base import Base

class StudentCourses(Base):
    __tablename__ = 'student_courses'

    id = Column(UUID(as_uuid=True), primary_key=True, server_default=text('gen_random_uuid()'))
    student_id = Column(StudentCoursesTableColumns.STUDENT_ID.value, UUID(as_uuid=True),ForeignKey('students.student_id'), nullable=False)
    course_id = Column(StudentCoursesTableColumns.COURSE_ID.value,UUID(as_uuid=True),ForeignKey('courses.course_id'))


    def __init__(self, student_id: UUID, course_id: UUID,):
        super().__init__()
        self.student_id = student_id
        self.course_id = course_id

    def __str__(self):
        return f'{self.student} - {self.course}'

    def __repr__(self):
        return f"<Course(name='{self.course_id}', for student='{self.student_id}')>"