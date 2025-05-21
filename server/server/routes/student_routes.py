from flask import Blueprint, request
from sqlalchemy import UUID
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
from server.services.specialization_service import SpecializationService
from server.services.student_service import StudentService
from server.services.study_year_service import StudyYearService
from server.services.subgroup_service import SubgroupService

students_bp = Blueprint('students', __name__)
logger = setup_logger(__name__)


def register_routes_student(app, session):
    """
    Function that registers all the routes for the student requests.
    Includes proper error handling and logging throughout the process.

    Args:
        app: Flask application instance
        session: Database session
    """
    logger.info("Registering student routes")
    student_service = StudentService(session)
    specialization_service = SpecializationService(session)
    study_year_service = StudyYearService(session)
    subgroup_service = SubgroupService(session)
    group_service = GroupService(session)
    course_service = CourseService(session)
    student_courses_service = StudentCoursesService(session)

    @students_bp.route('/user-subgroup-group', methods=['GET'])
    def get_user_subgroup_and_group():
        try:
            subgroup_id = request.args.get('subgroup_id')

            if not subgroup_id:
                return handle_response(
                    status_code= HTTP_BAD_REQUEST_CODE,
                    message= 'Missing subgroup_id parameter',
                    data= None
                )
            try:
                subgroup_id = int(subgroup_id)
            except ValueError:
                pass
            # cautare subgrupa,grupa
            subgroup = subgroup_service.get_subgroup_by_id(subgroup_id)
            serialized_subgroup = subgroup_service.serialize_subgroup(subgroup)
            group = group_service.get_group_by_id(subgroup.group_id)
            serialized_group = group_service.serialize_group(group)
            return handle_response(
                status_code=HTTP_OK_CODE,
                message="Success",
                data={'subgroup':serialized_subgroup,'group':serialized_group}
            )
        except Exception as e:
            return handle_response(
                status_code= HTTP_ERROR_CODE,
                message= f'Server error: {str(e)}',
                data= None
            )
    @students_bp.route('/login', methods=['POST'])
    def get_student_by_email_and_password():
        """Endpoint to authenticate a student by email and password"""
        try:
            # Get data from request body instead of query parameters
            data = request.json
            email = data.get('email')
            password = data.get('password')

            logger.info(f"Login attempt with email: {email}")

            student = student_service.get_student_by_email(email)
            if not student:
                logger.warning(f"Student not found for email: {email}")
                return handle_response(STUDENT_NOT_FOUND_ERROR, status_code=HTTP_NOT_FOUND_CODE)

            # Add password verification using check_password_hash
            if not check_password_hash(student.password, password):
                logger.warning(f"Invalid password for email: {email}")
                return handle_response(
                    message="Invalid credentials",
                    status_code=HTTP_ERROR_CODE
                )

            serialized_student = student_service.serialize_student(student)
            token = student_service.generate_jwt(student)
            response = handle_response(
                message=DATA_MESSAGE,
                data={"user": serialized_student, "token": token},
                status_code=HTTP_OK_CODE
            )

            logger.info(f"Login successful for email: {email}")
            return response

        except Exception as e:
            logger.error(f"Error in login process: {str(e)}")
            return handle_response(
                message="An unexpected error occurred during login",
                status_code=HTTP_ERROR_CODE
            )

    @students_bp.route('/signup', methods=['POST'])
    def sign_up_student():
        """Endpoint to register a new student"""
        try:
            logger.info("Student signup attempt")

            # Get the data from the request
            data = request.get_json()
            if not data:
                logger.warning("Signup attempt with no data")
                return handle_response(
                    message="No data provided",
                    status_code=HTTP_BAD_REQUEST_CODE
                )

            # Extract the necessary data from the request
            first_name = data.get(StudentTableColumns.FIRST_NAME.value)
            last_name = data.get(StudentTableColumns.LAST_NAME.value)
            email = data.get(StudentTableColumns.EMAIL.value)
            password = data.get(StudentTableColumns.PASSWORD.value)
            specialization_name = data.get("specialization_name")
            specialization_language = data.get("specialization_language")
            specialization = specialization_service.get_specialization_by_name_and_language(specialization_name,specialization_language)
            study_year_number = data.get("study_year")
            study_year = study_year_service.get_study_year(study_year_number,specialization)
            group_number = data.get("group_number")
            subgroup_number = data.get("subgroup_number")
            group = group_service.get_group(group_number,study_year)
            subgroup_id =subgroup_service.get_subgroup(subgroup_number,group).subgroup_id

            # Log the attempt (excluding password for security)
            logger.info(f"Signup attempt for: {email}, {first_name} {last_name}, subgroup: {subgroup_id}")

            # Validate all required fields
            missing_fields = []
            if not first_name:
                missing_fields.append('first_name')
            if not last_name:
                missing_fields.append('last_name')
            if not email:
                missing_fields.append('email')
            if not password:
                missing_fields.append('password')
            if not specialization_name:
                missing_fields.append('specialization_name')
            if not specialization_language:
                missing_fields.append('specialization_language')
            if not study_year_number:
                missing_fields.append('study_year_number')
            if not group_number:
                missing_fields.append('group_number')
            if not subgroup_number:
                missing_fields.append('subgroup_number')

            if missing_fields:
                missing = ', '.join(missing_fields)
                logger.warning(f"Signup missing required fields: {missing}")
                return handle_response(
                    message=f"Missing required fields: {missing}",
                    status_code=HTTP_BAD_REQUEST_CODE
                )

            # Create a new student instance
            new_student = Student(
                first_name=first_name,
                last_name=last_name,
                email=email,
                password=password,
                subgroup_id=subgroup_id
            )

            existing_student = student_service.get_student_by_email(new_student.get_email())
            if existing_student:
                logger.warning(f"Signup attempt for existing email: {email}")
                return handle_response(
                    message='Student already has an account',
                    data=None,
                    status_code=HTTP_ERROR_CODE
                )

            # Hash the password before saving
            plain_password = new_student.password
            hashed_password = generate_password_hash(plain_password, method='pbkdf2:sha256')
            new_student.password = hashed_password

            # Adaugă studentul direct prin serviciu
            student = student_service.add_student(new_student)
            if student:
                logger.info(f"Student created successfully: {email}")
                serialized_user = student_service.serialize_student(student)
                token = student_service.generate_jwt(student)
                #adaug cursurile asociate studentului din semigrupa sa in tabela studentCourses
                subgroup = subgroup_service.get_subgroup_by_id(student.subgroup_id)
                group = group_service.get_group_by_id(subgroup.group_id)
                logger.info(f"Inserting the schedule data for the student from {subgroup.subgroup_id}")
                courses: list[Course] = course_service.get_schedule_by_subgroup(subgroup, group)

                student_courses_service.update_student_courses(student.student_id,courses)
                return handle_response(
                    message='Student created successfully',
                    data={"user": serialized_user, "token": token},
                    status_code=HTTP_OK_CODE
                )
            else:
                logger.error(f"Student creation failed for email: {email}")
                return handle_response(
                    message='Student creation failed',
                    data=None,
                    status_code=HTTP_ERROR_CODE
                )

        except Exception as e:
            logger.error(f"Unexpected error in signup process: {str(e)}")
            return handle_response(
                message="An unexpected error occurred during registration",
                status_code=HTTP_ERROR_CODE
            )

    @students_bp.route('/student-profile/<student_id>', methods=['GET'])
    def get_complete_student_profile(student_id):
        """Endpoint to get complete student profile data including academic information"""
        try:
            logger.info(f"Getting complete profile for student: {student_id}")
            # Obține studentul pe baza ID-ului
            student = student_service.get_student_by_id(student_id)
            if not student:
                logger.warning(f"Student not found for ID: {student_id}")
                return handle_response(
                    message="Student not found",
                    status_code=HTTP_NOT_FOUND_CODE,
                    data=None
                )

            # Obține subgrupa studentului
            subgroup = subgroup_service.get_subgroup_by_id(student.subgroup_id)
            if not subgroup:
                logger.error(f"Subgroup not found for student: {student_id}")
                return handle_response(
                    message="Subgroup not found",
                    status_code=HTTP_ERROR_CODE,
                    data=None
                )

            # Obține grupa din subgrupă
            group = group_service.get_group_by_id(subgroup.group_id)
            if not group:
                logger.error(f"Group not found for student: {student_id}")
                return handle_response(
                    message="Group not found",
                    status_code=HTTP_ERROR_CODE,
                    data=None
                )

            # Obține anul de studiu din grupă
            study_year = study_year_service.get_study_year_by_id(group.study_year_id)
            if not study_year:
                logger.error(f"Study year not found for student: {student_id}")
                return handle_response(
                    message="Study year not found",
                    status_code=HTTP_ERROR_CODE,
                    data=None
                )

            # Obține specializarea din anul de studiu
            specialization = specialization_service.get_specialization_by_id(study_year.specialization_id)
            if not specialization:
                logger.error(f"Specialization not found for student: {student_id}")
                return handle_response(
                    message="Specialization not found",
                    status_code=HTTP_ERROR_CODE,
                    data=None
                )

            # Construiește răspunsul cu toate datele necesare
            complete_profile = {
                'student_id': str(student.student_id),
                'first_name': student.first_name,
                'last_name': student.last_name,
                'email': student.email,
                'subgroup_id': student.subgroup_id,
                'subgroup': str(subgroup.subgroup_number),
                'group': str(group.group_number),
                'year': study_year.year,
                'language': specialization.language,
                'specialization': specialization.name
            }

            logger.info(f"Complete profile retrieved successfully for student: {student_id}")
            return handle_response(
                message="Student profile retrieved successfully",
                status_code=HTTP_OK_CODE,
                data=complete_profile
            )

        except Exception as e:
            logger.error(f"Error getting complete student profile: {str(e)}")
            return handle_response(
                message=f"Server error: {str(e)}",
                status_code=HTTP_ERROR_CODE,
                data=None
            )

    @students_bp.route('/update-student-profile', methods=['PUT'])
    def update_student_profile():
        """Endpoint to update student profile information"""
        try:
            logger.info("Student profile update attempt")

            # Get the data from the request
            data = request.get_json()
            if not data:
                logger.warning("Profile update attempt with no data")
                return handle_response(
                    message="No data provided",
                    status_code=HTTP_BAD_REQUEST_CODE
                )

            # Extract the necessary data from the request
            student_id = data.get('student_id')
            first_name = data.get('first_name')
            last_name = data.get('last_name')
            subgroup_id = data.get('subgroup_id')

            logger.info(f"Profile update attempt for student: {student_id}")

            # Validate all required fields
            missing_fields = []
            if not student_id:
                missing_fields.append('student_id')
            if not first_name:
                missing_fields.append('first_name')
            if not last_name:
                missing_fields.append('last_name')
            if not subgroup_id:
                missing_fields.append('subgroup_id')

            if missing_fields:
                missing = ', '.join(missing_fields)
                logger.warning(f"Profile update missing required fields: {missing}")
                return handle_response(
                    message=f"Missing required fields: {missing}",
                    status_code=HTTP_BAD_REQUEST_CODE
                )

            # Validează că studentul există
            student = student_service.get_student_by_id(student_id)
            if not student:
                logger.warning(f"Student not found for ID: {student_id}")
                return handle_response(
                    message="Student not found",
                    status_code=HTTP_NOT_FOUND_CODE,
                    data=None
                )

            subgroup = subgroup_service.get_subgroup_by_id(subgroup_id)
            if not subgroup:
                logger.warning(f"Subgroup not found for ID: {subgroup_id}")
                return handle_response(
                    message="Subgroup not found",
                    status_code=HTTP_BAD_REQUEST_CODE,
                    data=None
                )

            # Actualizează datele studentului
            student.first_name = first_name.strip()
            student.last_name = last_name.strip()

            # Verifică dacă subgrupa s-a schimbat
            old_subgroup_id = student.subgroup_id
            print(old_subgroup_id)
            print(subgroup_id)
            student.subgroup_id = subgroup_id

            # Salvează modificările în baza de date
            updated_student = student_service.update_student(student)

            if updated_student:
                logger.info(f"Student profile updated successfully: {student_id}")

                # Dacă subgrupa s-a schimbat, actualizează și cursurile studentului
                if old_subgroup_id != updated_student.subgroup_id:
                    logger.info(f"Subgroup changed for student {student_id}: {old_subgroup_id} -> {updated_student.subgroup_id}")
                    try:
                        # Obține grupa din noua subgrupă
                        group = group_service.get_group_by_id(subgroup.group_id)
                        if group:
                            # Obține cursurile pentru noua subgrupă
                            courses = course_service.get_schedule_by_subgroup(subgroup, group)
                            # Actualizează cursurile studentului
                            student_courses_service.update_student_courses(student.student_id, courses)
                            logger.info(f"Schedule updated for student {student_id} due to subgroup change")
                        else:
                            logger.warning(f"Group not found for subgroup {updated_student.subgroup_id}")
                    except Exception as e:
                        logger.error(f"Error updating student schedule after subgroup change: {str(e)}")
                        # Nu returnăm eroare pentru că profilul s-a actualizat cu succes
                        # doar logging-ul eșecului actualizării cursurilor

                # Returnează datele actualizate ale studentului
                serialized_student = student_service.serialize_student(updated_student)

                return handle_response(
                    message='Student profile updated successfully',
                    data={"user": serialized_student},
                    status_code=HTTP_OK_CODE
                )
            else:
                logger.error(f"Student profile update failed for ID: {student_id}")
                return handle_response(
                    message='Student profile update failed',
                    data=None,
                    status_code=HTTP_ERROR_CODE
                )

        except Exception as e:
            logger.error(f"Unexpected error in profile update process: {str(e)}")
            return handle_response(
                message="An unexpected error occurred during profile update",
                status_code=HTTP_ERROR_CODE
            )
    # Register the blueprint with the app
    app.register_blueprint(students_bp)
    logger.info("Student routes registered successfully")

