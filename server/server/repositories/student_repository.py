from werkzeug.security import generate_password_hash
from server.models.student import Student

class StudentRepository:

    def __init__(self, sess):
        self.session = sess

    def update_student(self,student: Student) -> Student or None:
        try:
            result = self.session.query(Student).filter(
                Student.student_id == student.student_id
            ).update({
                Student.first_name: student.first_name,
                Student.last_name: student.last_name,
                Student.subgroup_id: student.subgroup_id
            })


            if result == 0:
                print(f"Student with ID {student.student_id} not found")
                return None

            self.session.commit()

            print(f"Student {student.student_id} updated successfully")
            return student

        except Exception as e:
            self.session.rollback()
            print(f"Error updating Student: {e}")
            return None
    def get_student_by_email(self, email: str) -> Student or None:
        return self.session.query(Student).filter(Student.email == email).first()

    def get_student_by_id(self, id) -> Student or None:
        return self.session.query(Student).filter(Student.student_id == id).first()

    def add_student(self, new_student:Student) -> Student or None:
        existing_student = self.get_student_by_email(new_student.get_email())
        if existing_student:
            return None

        try:
            self.session.add(new_student)
            self.session.commit()
            return new_student
        except Exception as e:
            self.session.rollback()
            print(f"Error adding Student: {e}")
            return None

