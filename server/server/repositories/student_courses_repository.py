from typing import Iterable

from sqlalchemy import func, and_, UUID
from sqlalchemy.orm import joinedload

from server.models.course import Course
from server.models.group import Group
from server.models.professor import Professor
from server.models.room import Room
from server.models.specialization import Specialization
from server.models.student import Student
from server.models.student_courses import StudentCourses

from server.models.study_year import StudyYear

class StudentCoursesRepository:
    """
    Repository for Professors
    """

    def __init__(self, sess):
        """Constructor for ProfessorRepository
            :param sess: session instance
         """
        self.session = sess

    def get_student(self, group_number:int,study_year:StudyYear) -> Group | None:
        return self.session.query(Group).filter_by(
            group_number=group_number,
            study_year_id=study_year.study_year_id
        ).first()

    def get_group_by_id(self, group_id) -> Group | None:
        return self.session.query(Group).filter_by(
            group_id=group_id
        ).first()

    def update_student_courses(self, student_id: UUID, new_courses) -> bool:
        """
        Actualizează lista de cursuri pentru un anumit student.
        Șterge toate înregistrările existente și adaugă noile cursuri.

        Args:
            student_id: UUID-ul studentului
            new_courses: Lista de cursuri trimise de la frontend

        Returns:
            bool: True dacă actualizarea a reușit, False în caz contrar
        """
        try:
            # Șterge toate înregistrările existente pentru acest student
            self.session.query(StudentCourses).filter(
                StudentCourses.student_id == student_id
            ).delete()

            # Adaugă noile înregistrări
            for course in new_courses:
                # Determină course_id în funcție de tipul obiectului
                if hasattr(course, 'course_id'):
                    # Este un obiect Course
                    course_id = course.course_id
                elif isinstance(course, dict) and 'course_id' in course:
                    # Este un dicționar
                    course_id = course['course_id']
                else:
                    print(f"Formatul cursului nu este recunoscut: {course}")
                    continue

                student_course = StudentCourses(
                    student_id=student_id,
                    course_id=course_id
                )
                self.session.add(student_course)

            # Commit schimbările
            self.session.commit()
            return True

        except Exception as e:
            # În caz de eroare, anulează tranzacția
            self.session.rollback()
            print(f"Eroare la actualizarea cursurilor studentului: {str(e)}")
            return False

    def delete_student_courses(self, student_id):
        self.session.query(StudentCourses).filter(
            StudentCourses.student_id == student_id
        ).delete()
        self.session.commit()

    def get_all_courses_for_a_student(self, student_id) -> list[Course]:
        return self.session.query(Course) \
            .join(StudentCourses, StudentCourses.course_id == Course.course_id) \
            .filter(StudentCourses.student_id == student_id) \
            .options(
            joinedload(Course.room),
            joinedload(Course.professor)  # Adăugăm încărcarea eager pentru profesor
        ) \
            .all()