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

def register_routes_course(app, Session):

    logger.info("Inregistrare rute pentru cursuri")

    @courses_bp.route('/courses/by-student-id', methods=['GET'])
    def get_courses_for_student():
        session = Session()
        try:
            student_courses_service = StudentCoursesService(session)
            course_service = CourseService(session)

            student_id = request.args.get('student_id')
            if not student_id:
                return handle_response(
                    message="Parametrul student_id lipseste",
                    status_code=HTTP_ERROR_CODE
                )

            student_uuid = UUID(student_id)
            logger.info(f"Se obtin datele orarului pentru studentul cu ID-ul {student_id}")
            courses: list[Course] = student_courses_service.get_all_courses_for_a_student(student_uuid)

            serialized_courses = [
                {
                    **course_service.serialize_course(course),
                    "student_count": student_courses_service.get_no_students(course.course_id)
                }
                for course in courses
            ]

            return handle_response(
                message="Date incarcate cu succes",
                data=serialized_courses,
                status_code=HTTP_OK_CODE
            )

        except Exception as e:
            logger.error(f"Eroare neasteptata la obtinerea datelor orarului: {str(e)}")
            return handle_response(
                message="A aparut o eroare neasteptata",
                data="Null",
                status_code=HTTP_ERROR_CODE
            )
        finally:
            session.close()

    @courses_bp.route('/filtered-courses', methods=['GET'])
    def get_available_courses():
        session = Session()
        try:
            subgroup_service = SubgroupService(session)
            group_service = GroupService(session)
            study_year_service = StudyYearService(session)
            course_service = CourseService(session)

            subgroup_id = request.args.get('subgroup_id', '')
            subgroup_UUID = UUID(subgroup_id)
            subgroup = subgroup_service.get_subgroup_by_id(subgroup_UUID)
            group = group_service.get_group_by_id(subgroup.group_id)
            study_year = study_year_service.get_study_year_by_id(group.study_year_id)
            filtered_courses = course_service.search_unique_names_courses(study_year.study_year_id)

            return handle_response(
                message="Cursuri gasite cu succes",
                data=filtered_courses,
                status_code=HTTP_OK_CODE
            )

        except Exception as e:
            logger.error(f"Eroare la cautarea cursurilor: {str(e)}")
            return handle_response(
                message=f"A aparut o eroare la cautarea cursurilor: {str(e)}",
                data=[],
                status_code=HTTP_ERROR_CODE
            )
        finally:
            session.close()

    @courses_bp.route('/wanted-courses', methods=['GET'])
    def get_wanted_courses():
        session = Session()
        try:
            subgroup_service = SubgroupService(session)
            group_service = GroupService(session)
            course_service = CourseService(session)
            student_courses_service = StudentCoursesService(session)

            name = request.args.get('name', '')
            course_type = request.args.get('type', '')
            subgroup_id = request.args.get('subgroup_id','')
            if not subgroup_id:
                logger.error("Parametrul 'subgroup_id' este obligatoriu")
                return handle_response(
                    message="Parametrul 'subgroup_id' este obligatoriu",
                    data=[],
                    status_code=HTTP_BAD_REQUEST_CODE
                )
            subgroup_UUID = UUID(subgroup_id)
            logger.info(f"Cautare cursuri dupa nume='{name}', tip='{course_type}', grupa='{subgroup_UUID}'")
            subgroup = subgroup_service.get_subgroup_by_id(subgroup_UUID)
            group = group_service.get_group_by_id(subgroup.group_id)
            filtered_courses = course_service.search_courses_by_name_and_type(group.group_id, name, course_type)

            serialized_courses = [
                {
                    **course_service.serialize_course(course),
                    "student_count": student_courses_service.get_no_students(course.course_id)
                }
                for course in filtered_courses
            ]

            return handle_response(
                message="Cursuri gasite cu succes",
                data=serialized_courses,
                status_code=HTTP_OK_CODE
            )

        except Exception as e:
            logger.error(f"Eroare la cautarea cursurilor: {str(e)}")
            return handle_response(
                message=f"A aparut o eroare la cautarea cursurilor: {str(e)}",
                data=[],
                status_code=HTTP_ERROR_CODE
            )
        finally:
            session.close()

    @courses_bp.route('/delete-courses', methods=['DELETE'])
    def delete_courses_for_student():
        session = Session()
        try:
            student_courses_service = StudentCoursesService(session)
            data = request.get_json()

            if not data or 'student_id' not in data or 'courses' not in data:
                return handle_response(
                    message="Datele lipsesc sau sunt incomplete",
                    data="Null",
                    status_code=400
                )

            student_id = data['student_id']
            student_UUID = uuid.UUID(data['student_id'])
            new_courses = data['courses']

            if not isinstance(student_id, str) or not isinstance(new_courses, list):
                return handle_response(
                    message="Format invalid pentru student_id sau new_courses",
                    data="Null",
                    status_code=400
                )

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
            logger.error(f"Eroare neasteptata la actualizarea cursurilor: {str(e)}")
            return handle_response(
                message="A aparut o eroare neasteptata",
                data="Null",
                status_code=HTTP_ERROR_CODE
            )
        finally:
            session.close()

    @courses_bp.route('/reset-courses', methods=['POST'])
    def reset_courses_for_student():
        session = Session()
        try:
            student_service = StudentService(session)
            subgroup_service = SubgroupService(session)
            group_service = GroupService(session)
            course_service = CourseService(session)
            student_courses_service = StudentCoursesService(session)
            data = request.get_json()

            if not data or 'student_id' not in data:
                return handle_response(
                    message="Datele lipsesc sau sunt incomplete",
                    data="Null",
                    status_code=400
                )

            student_id = data['student_id']
            student_UUID = uuid.UUID(student_id)

            if not isinstance(student_id, str):
                return handle_response(
                    message="Format invalid pentru student_id",
                    data="Null",
                    status_code=400
                )

            student = student_service.get_student_by_id(student_UUID)

            if not student:
                return handle_response(
                    message=STUDENT_NOT_FOUND_ERROR,
                    data="Null",
                    status_code=HTTP_NOT_FOUND_CODE
                )

            subgroup = subgroup_service.get_subgroup_by_id(student.subgroup_id)
            group = group_service.get_group_by_id(subgroup.group_id)
            logger.info(f"Se insereaza datele orarului pentru studentul din subgrupa {subgroup.subgroup_id}")
            courses: list[Course] = course_service.get_schedule_by_subgroup(subgroup, group)
            student_courses_service.update_student_courses(student.student_id, courses)
            courses = student_courses_service.get_all_courses_for_a_student(student_UUID)

            serialized_courses = [
                {
                    **course_service.serialize_course(course),
                    "student_count": student_courses_service.get_no_students(course.course_id)
                }
                for course in courses
            ]

            return handle_response(
                message="Date incarcate cu succes",
                data=serialized_courses,
                status_code=HTTP_OK_CODE
            )

        except Exception as e:
            logger.error(f"Eroare neprevazuta la resetarea orarului: {str(e)}")
            return handle_response(
                message=f"A aparut o eroare la resetarea orarului: {str(e)}",
                data="Null",
                status_code=HTTP_ERROR_CODE
            )
        finally:
            session.close()

    app.register_blueprint(courses_bp)
    logger.info("Rutele pentru cursuri au fost inregistrate cu succes")
