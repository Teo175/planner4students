import uuid
from uuid import UUID

from flask import Blueprint, request
from werkzeug.security import generate_password_hash, check_password_hash

from server.models.course import Course
from server.services.course_service import CourseService
from server.services.student_courses_service import StudentCoursesService
from server.utils.handle_response import handle_response
from server.common.common_constants import HTTP_BAD_REQUEST_CODE, HTTP_OK_CODE, HTTP_ERROR_CODE, \
    STUDENT_NOT_FOUND_ERROR, DATA_MESSAGE, HTTP_NOT_FOUND_CODE
from server.common.logger import setup_logger
from server.models.column_names import StudentTableColumns
from server.models.student import Student
from server.services.group_service import GroupService
from server.services.student_service import StudentService
from server.services.study_year_service import StudyYearService
from server.services.subgroup_service import SubgroupService

courses_bp = Blueprint('courses', __name__)
logger = setup_logger(__name__)
def register_routes_course(app, session):
    """
    Function that registers all the routes for the group requests.
    Includes proper error handling and logging throughout the process.

    Args:
        app: Flask application instance
        session: Database session
    """
    logger.info("Registering courses routes")
    group_service = GroupService(session)
    study_year_service = StudyYearService(session)
    subgroup_service = SubgroupService(session)
    course_service = CourseService(session)
    student_courses_service = StudentCoursesService(session)
    student_service = StudentService(session)
    @courses_bp.route('/courses/by-student-id', methods=['GET'])
    def get_courses_for_student():
        """Get all courses for a specific subgroup by its ID"""
        try:
            student_id = request.args.get('student_id')
            if not student_id:
                return handle_response(
                    message="Missing student_id parameter",
                    status_code=HTTP_ERROR_CODE  # Bad Request
                )

            student_uuid = UUID(student_id)
            logger.info(f"Getting the schedule data for the student from {student_id}")
            courses: list[Course] = student_courses_service.get_all_courses_for_a_student(student_uuid)
            serialized_courses = [course_service.serialize_course(c) for c in courses]

            return handle_response(
                message="Succesfully loaded data",
                data=serialized_courses,
                status_code=HTTP_OK_CODE
            )

        except Exception as e:
            logger.error(f"Unexpected error in getting schedule data: {str(e)}")
            return handle_response(
                message="An unexpected error occurred during registration",
                data="Null",
                status_code=HTTP_ERROR_CODE
            )

    @courses_bp.route('/filtered-courses', methods=['GET'])
    def get_available_courses():
        """
        Endpoint pentru căutarea cursurilor după nume și tip.
        Parametri disponibili în URL:
        - search: termen de căutare pentru numele cursului
        - type: tipul cursului (Curs, Seminar, Laborator)

        Returnează o listă de cursuri care îndeplinesc criteriile de căutare.
        """
        try:
            # Extrage parametrii de căutare din query string
            subgroup_id = request.args.get('subgroup_id', '')
            subgroup_UUID = UUID(subgroup_id)
            # Folosește metoda din CourseService pentru a căuta cursuri
            subgroup = subgroup_service.get_subgroup_by_id(subgroup_UUID)
            group = group_service.get_group_by_id(subgroup.group_id)
            study_year = study_year_service.get_study_year_by_id(group.study_year_id)
            filtered_courses = course_service.search_unique_names_courses(study_year.study_year_id)


            return handle_response(
                message="Cursuri găsite cu succes",
                data=filtered_courses,
                status_code=HTTP_OK_CODE
            )

        except Exception as e:
            logger.error(f"Eroare la căutarea cursurilor: {str(e)}")
            return handle_response(
                message=f"A apărut o eroare la căutarea cursurilor: {str(e)}",
                data=[],
                status_code=HTTP_ERROR_CODE
            )

    @courses_bp.route('/wanted-courses', methods=['GET'])
    def get_wanted_courses():
        """
        Endpoint pentru căutarea cursurilor după nume și tip.
        Parametri disponibili în URL:
        - search: termen de căutare pentru numele cursului
        - type: tipul cursului (Curs, Seminar, Laborator)

        Returnează o listă de cursuri care îndeplinesc criteriile de căutare.
        """
        try:
            # Extrage parametrii de căutare din query string
            name = request.args.get('name', '')
            course_type = request.args.get('type', '')
            subgroup_id = request.args.get('subgroup_id','')
            if not subgroup_id:
                logger.error("Eroare: Parametrul 'subgroup_id' este obligatoriu")
                return handle_response(
                    message="Eroare: Parametrul 'subgroup_id' este obligatoriu",
                    data=[],
                    status_code=HTTP_BAD_REQUEST_CODE  # de obicei 400
                )
            subgroup_UUID = UUID(subgroup_id)
            logger.info(f"Căutare cursuri cu searchTerm='{name}', courseType='{course_type}', group_id='{subgroup_UUID}'")
            subgroup = subgroup_service.get_subgroup_by_id(subgroup_UUID)
            group = group_service.get_group_by_id(subgroup.group_id)
            # Folosește metoda din CourseService pentru a căuta cursuri
            filtered_courses = course_service.search_courses_by_name_and_type(group.group_id,name,course_type,)
            serialized_courses = [course_service.serialize_course(c) for c in filtered_courses]

            return handle_response(
                message="Cursuri găsite cu succes",
                data=serialized_courses,
                status_code=HTTP_OK_CODE
            )

        except Exception as e:
            logger.error(f"Eroare la căutarea cursurilor: {str(e)}")
            return handle_response(
                message=f"A apărut o eroare la căutarea cursurilor: {str(e)}",
                data=[],
                status_code=HTTP_ERROR_CODE
            )
    @courses_bp.route('/delete-courses', methods=['DELETE'])
    def delete_courses_for_student():
        try:
            # Extrage datele din request
            data = request.get_json()

            # Verifică dacă datele necesare sunt prezente
            if not data or 'student_id' not in data or 'courses' not in data:
                return handle_response(
                    message="Datele lipsesc sau sunt incomplete",
                    data="Null",
                    status_code=400
                )

            student_id = data['student_id']
            student_UUID = uuid.UUID(data['student_id'])
            new_courses = data['courses']
            # Validează datele
            if not isinstance(student_id, str) or not isinstance(new_courses, list):
                return handle_response(
                    message="Format invalid pentru student_id sau new_courses",
                    data="Null",
                    status_code=400
                )

            # Apelează serviciul pentru actualizarea cursurilor
            success = student_courses_service.update_student_courses(student_UUID, new_courses)

            if success:
                return handle_response(
                    message="Cursurile studentului au fost actualizate cu succes",
                    data="Null",
                    status_code=200
                )
            else:
                return handle_response(
                    message="Eroare la actualizarea cursurilor",
                    data="Null",
                    status_code=500
                )

        except Exception as e:
            logger.error(f"Unexpected error in getting schedule data: {str(e)}")
            return handle_response(
                message="An unexpected error occurred during registration",
                data="Null",
                status_code=HTTP_ERROR_CODE
            )

    @courses_bp.route('/reset-courses', methods=['POST'])
    def reset_courses_for_student():
        try:
            # Extrage datele din request
            data = request.get_json()

            # Verifică dacă datele necesare sunt prezente
            if not data or 'student_id' not in data:
                return handle_response(
                    message="Datele lipsesc sau sunt incomplete",
                    data="Null",
                    status_code=400
                )

            student_id = data['student_id']
            student_UUID = uuid.UUID(student_id)

            # Validează datele
            if not isinstance(student_id, str):
                return handle_response(
                    message="Format invalid pentru student_id",
                    data="Null",
                    status_code=400
                )

            # Găsește studentul pentru a obține informațiile despre grupă și subgrupă
            student = student_service.get_student_by_id(student_UUID)

            if not student:
                return handle_response(
                    message=STUDENT_NOT_FOUND_ERROR,
                    data="Null",
                    status_code=HTTP_NOT_FOUND_CODE
                )

            subgroup = subgroup_service.get_subgroup_by_id(student.subgroup_id)
            group = group_service.get_group_by_id(subgroup.group_id)
            logger.info(f"Inserting the schedule data for the student from {subgroup.subgroup_id}")
            courses: list[Course] = course_service.get_schedule_by_subgroup(subgroup, group)
            student_courses_service.update_student_courses(student.student_id, courses)
            courses: list[Course] = student_courses_service.get_all_courses_for_a_student(student_UUID)
            for c in courses:
                print(c)
            serialized_courses = [course_service.serialize_course(c) for c in courses]

            return handle_response(
                message="Succesfully loaded data",
                data=serialized_courses,
                status_code=HTTP_OK_CODE
            )

        except Exception as e:
            logger.error(f"Eroare neprevăzută la resetarea orarului: {str(e)}")
            return handle_response(
                message=f"A apărut o eroare la resetarea orarului: {str(e)}",
                data="Null",
                status_code=HTTP_ERROR_CODE
            )
    app.register_blueprint(courses_bp)
    logger.info("courses routes registered successfully")

