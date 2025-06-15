from datetime import datetime, timedelta

import jwt

from server.models.column_names import StudentTableColumns
from server.models.student import Student
from server.repositories.student_repository import StudentRepository


class StudentService:

    def __init__(self, session):
        self.studentRepository = StudentRepository(session)
        self.__secret_key = "Dinozaur123"

    def update_student(self,student: Student) -> Student or None:
        return self.studentRepository.update_student(student)

    def get_student_by_email(self, email: str) -> Student or None:

        return self.studentRepository.get_student_by_email(email)

    def get_student_by_id(self, id) -> Student or None:

        return self.studentRepository.get_student_by_id(id)

    def add_student(self, new_student: Student) -> Student or None:

        return self.studentRepository.add_student(new_student)

    def generate_jwt(self, student: Student) -> str:

        payload = {
            'email': student.get_email(),
            'exp': datetime.utcnow() + timedelta(hours=24)
        }


        token = jwt.encode(payload, self.__secret_key, algorithm='HS256')

        return token

    @staticmethod
    def serialize_student(student: Student):

        if student is None:
            return {}
        return {StudentTableColumns.STUDENT_ID.value: student.student_id,
                StudentTableColumns.FIRST_NAME.value: student.first_name,
                StudentTableColumns.LAST_NAME.value: student.last_name,
                StudentTableColumns.EMAIL.value: student.email,
                StudentTableColumns.PASSWORD.value: student.password,
                StudentTableColumns.SUBGROUP_ID.value: student.subgroup_id}
