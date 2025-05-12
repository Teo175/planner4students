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


    app.register_blueprint(courses_bp)
    logger.info("courses routes registered successfully")

