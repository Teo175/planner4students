from sqlalchemy import UUID

from server.common.logger import setup_logger
from server.models.column_names import GroupTableColumns
from server.models.course import Course
from server.models.group import Group
from server.models.student_courses import StudentCourses
from server.models.study_year import StudyYear
from server.repositories.group_repository import GroupRepository
from server.repositories.student_courses_repository import StudentCoursesRepository


class StudentCoursesService:
    """
    Service for GroupService
    """
    logger = setup_logger(__name__)

    def __init__(self, session):
        self.studentCourses = StudentCoursesRepository(session)


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
            self.studentCourses.update_student_courses(student_id,new_courses)
            self.logger.info("Update cu succes")
            return True;
        except Exception as e:
            self.logger.error(f"Eroare la actualizarea cursurilor studentului: {str(e)}")
            return False

    def get_all_courses_for_a_student(self, student_id:UUID) -> list[Course]:
        return self.studentCourses.get_all_courses_for_a_student(student_id)

    def get_no_students(self,course_id):
        return self.studentCourses.get_no_students_for_course(course_id)