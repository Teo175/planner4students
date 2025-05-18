from datetime import datetime, timedelta

import jwt

from server.models.column_names import StudentTableColumns
from server.models.student import Student
from server.repositories.student_repository import StudentRepository


class StudentService:
    """
    Service for StudentsService
    """

    def __init__(self, session):
        self.studentRepository = StudentRepository(session)
        self.__secret_key = "Dinozaur123"


    def get_student_by_email(self, email: str) -> Student or None:
        """
        Retrieve a student by their email
        :param email: The email of the student
        :return: student object or None if not found
        """
        return self.studentRepository.get_student_by_email(email)

    def get_student_by_id(self, id) -> Student or None:
        """
        Retrieve a student by their email
        :param email: The email of the student
        :return: student object or None if not found
        """
        return self.studentRepository.get_student_by_id(id)

    def add_student(self, new_student: Student) -> Student or None:
        """
        Adds a new student in the system
        :param new_student: The data of the new student
        :return: Student object or None if not added
        """
        return self.studentRepository.add_student(new_student)

    def generate_jwt(self, student: Student) -> str:
        """
        Generate a JWT token for the student

        :param student: The student object (can include student id or email)
        :return: JWT token as a string
        """
        payload = {
            'email': student.get_email(),
            'exp': datetime.utcnow() + timedelta(hours=24)  # Set token expiration (24 hours in this case)
        }

        # Create JWT token
        token = jwt.encode(payload, self.__secret_key, algorithm='HS256')

        return token

    @staticmethod
    def serialize_student(student: Student):
        """
        Function for serializing a student

        :param student: Student
        :return: a dictionary containing every field of the user
        """
        if student is None:
            return {}
        return {StudentTableColumns.STUDENT_ID.value: student.student_id,
                StudentTableColumns.FIRST_NAME.value: student.first_name,
                StudentTableColumns.LAST_NAME.value: student.last_name,
                StudentTableColumns.EMAIL.value: student.email,
                StudentTableColumns.PASSWORD.value: student.password,
                StudentTableColumns.SUBGROUP_ID.value: student.subgroup_id}
