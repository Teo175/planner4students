from werkzeug.security import generate_password_hash
from server.models.student import Student

class StudentRepository:
    """
    Repository for Students
    """

    def __init__(self, sess):
        """Constructor for StudentRepository
            :param sess: session instance
         """
        self.session = sess

    def update_student(self,student: Student) -> Student or None:
        try:
            # Update SQL direct
            result = self.session.query(Student).filter(
                Student.student_id == student.student_id
            ).update({
                Student.first_name: student.first_name,
                Student.last_name: student.last_name,
                Student.subgroup_id: student.subgroup_id
            })

            # Verifică dacă a fost actualizat cel puțin un rând
            if result == 0:
                print(f"Student with ID {student.student_id} not found")
                return None

            # Salvează modificările în baza de date
            self.session.commit()

            print(f"Student {student.student_id} updated successfully")
            return student  # Returnează studentul cu datele actualizate

        except Exception as e:
            # În caz de eroare, rollback tranzacția
            self.session.rollback()
            print(f"Error updating Student: {e}")
            return None
    def get_student_by_email(self, email: str) -> Student or None:
        """
        Retrieve a Student by their name
        :param email: The email of the student
        :return: student object or None if not found
        """
        return self.session.query(Student).filter(Student.email == email).first()

    def get_student_by_id(self, id) -> Student or None:
        """
        Retrieve a Student by their name
        :param email: The email of the student
        :return: student object or None if not found
        """
        return self.session.query(Student).filter(Student.student_id == id).first()

    def add_student(self, new_student:Student) -> Student or None:
        """
        Adds a new Student in the system
        :param new_student: The data of the new student
        :return: student object or None if not added
        """
        existing_student = self.get_student_by_email(new_student.get_email())
        if existing_student:
            # Return None if Student with the same email already exists
            return None

        try:
            # Add the new Student to the session and commit
            self.session.add(new_student)
            self.session.commit()
            return new_student  # Successfully created and saved
        except Exception as e:
            # In case of error, rollback the transaction
            self.session.rollback()
            print(f"Error adding Student: {e}")
            return None

