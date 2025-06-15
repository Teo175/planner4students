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

def register_routes_student(app, Session):
    logger.info("Inregistrare rute pentru studenti")

    @students_bp.route('/user-subgroup-group', methods=['GET'])
    def get_user_subgroup_and_group():
        session = Session()
        try:
            subgroup_service = SubgroupService(session)
            group_service = GroupService(session)

            subgroup_id = request.args.get('subgroup_id')
            if not subgroup_id:
                return handle_response(
                    status_code=HTTP_BAD_REQUEST_CODE,
                    message='Lipseste parametrul subgroup_id',
                    data=None
                )
            try:
                subgroup_id = int(subgroup_id)
            except ValueError:
                pass

            subgroup = subgroup_service.get_subgroup_by_id(subgroup_id)
            serialized_subgroup = subgroup_service.serialize_subgroup(subgroup)
            group = group_service.get_group_by_id(subgroup.group_id)
            serialized_group = group_service.serialize_group(group)
            return handle_response(
                status_code=HTTP_OK_CODE,
                message="Succes",
                data={'subgroup': serialized_subgroup, 'group': serialized_group}
            )
        except Exception as e:
            return handle_response(
                status_code=HTTP_ERROR_CODE,
                message=f'Eroare de server: {str(e)}',
                data=None
            )
        finally:
            session.close()

    @students_bp.route('/login', methods=['POST'])
    def get_student_by_email_and_password():
        session = Session()
        try:
            student_service = StudentService(session)
            student_courses_service = StudentCoursesService(session)
            subgroup_service = SubgroupService(session)
            group_service = GroupService(session)
            course_service = CourseService(session)

            data = request.json
            email = data.get('email')
            password = data.get('password')

            logger.info(f"Tentativa de autentificare cu email-ul: {email}")

            student = student_service.get_student_by_email(email)
            if not student:
                logger.warning(f"Student negasit pentru email-ul: {email}")
                return handle_response(STUDENT_NOT_FOUND_ERROR, status_code=HTTP_NOT_FOUND_CODE)

            if not check_password_hash(student.password, password):
                logger.warning(f"Parola incorecta pentru email-ul: {email}")
                return handle_response(
                    message="Date de autentificare invalide",
                    status_code=HTTP_ERROR_CODE
                )

            existing_courses = student_courses_service.get_all_courses_for_a_student(student.student_id)

            if not existing_courses:
                logger.info(f"Studentul {student.student_id} nu are cursuri. Se adauga orarul.")
                try:
                    subgroup = subgroup_service.get_subgroup_by_id(student.subgroup_id)
                    group = group_service.get_group_by_id(subgroup.group_id)
                    courses = course_service.get_schedule_by_subgroup(subgroup, group)
                    if courses:
                        student_courses_service.update_student_courses(student.student_id, courses)
                        logger.info(f"Adaugate {len(courses)} cursuri pentru studentul {student.student_id}")
                    else:
                        logger.warning(f"Nu s-au gasit cursuri pentru subgrupa {subgroup.subgroup_id}")
                except Exception as e:
                    logger.error(f"Eroare la adaugarea cursurilor: {str(e)}")

            serialized_student = student_service.serialize_student(student)
            token = student_service.generate_jwt(student)
            response = handle_response(
                message=DATA_MESSAGE,
                data={"user": serialized_student, "token": token},
                status_code=HTTP_OK_CODE
            )

            logger.info(f"Autentificare reusita pentru email-ul: {email}")
            return response

        except Exception as e:
            logger.error(f"Eroare in autentificare: {str(e)}")
            return handle_response(
                message="A aparut o eroare neasteptata in timpul autentificarii",
                status_code=HTTP_ERROR_CODE
            )
        finally:
            session.close()

    @students_bp.route('/signup', methods=['POST'])
    def sign_up_student():
        session = Session()
        try:
            student_service = StudentService(session)
            specialization_service = SpecializationService(session)
            study_year_service = StudyYearService(session)
            subgroup_service = SubgroupService(session)
            group_service = GroupService(session)
            course_service = CourseService(session)
            student_courses_service = StudentCoursesService(session)

            logger.info("Tentativa de inregistrare student")

            data = request.get_json()
            if not data:
                return handle_response(message="Nu au fost furnizate date", status_code=HTTP_BAD_REQUEST_CODE)

            first_name = data.get(StudentTableColumns.FIRST_NAME.value)
            last_name = data.get(StudentTableColumns.LAST_NAME.value)
            email = data.get(StudentTableColumns.EMAIL.value)
            password = data.get(StudentTableColumns.PASSWORD.value)
            specialization_name = data.get("specialization_name")
            specialization_language = data.get("specialization_language")
            specialization = specialization_service.get_specialization_by_name_and_language(specialization_name, specialization_language)
            study_year_number = data.get("study_year")
            study_year = study_year_service.get_study_year(study_year_number, specialization)
            group_number = data.get("group_number")
            subgroup_number = data.get("subgroup_number")
            group = group_service.get_group(group_number, study_year)
            subgroup_id = subgroup_service.get_subgroup(subgroup_number, group).subgroup_id

            missing_fields = []
            for field, value in [('first_name', first_name), ('last_name', last_name), ('email', email),
                                 ('password', password), ('specialization_name', specialization_name),
                                 ('specialization_language', specialization_language),
                                 ('study_year_number', study_year_number), ('group_number', group_number),
                                 ('subgroup_number', subgroup_number)]:
                if not value:
                    missing_fields.append(field)

            if missing_fields:
                missing = ', '.join(missing_fields)
                return handle_response(message=f"Lipsesc campurile obligatorii: {missing}", status_code=HTTP_BAD_REQUEST_CODE)

            new_student = Student(first_name=first_name, last_name=last_name, email=email,
                                  password=password, subgroup_id=subgroup_id)

            if student_service.get_student_by_email(email):
                return handle_response(message='Acest email este deja folosit', status_code=HTTP_ERROR_CODE)

            new_student.password = generate_password_hash(password, method='pbkdf2:sha256')
            student = student_service.add_student(new_student)
            if student:
                serialized_user = student_service.serialize_student(student)
                token = student_service.generate_jwt(student)
                subgroup = subgroup_service.get_subgroup_by_id(student.subgroup_id)
                group = group_service.get_group_by_id(subgroup.group_id)
                courses = course_service.get_schedule_by_subgroup(subgroup, group)
                if courses:
                    student_courses_service.update_student_courses(student.student_id, courses)
                return handle_response(
                    message='Contul a fost creat cu succes',
                    data={"user": serialized_user, "token": token},
                    status_code=HTTP_OK_CODE
                )
            else:
                return handle_response(message='Crearea contului a esuat', status_code=HTTP_ERROR_CODE)

        except Exception as e:
            logger.error(f"Eroare la inregistrare: {str(e)}")
            return handle_response(
                message="A aparut o eroare neasteptata in timpul inregistrarii",
                status_code=HTTP_ERROR_CODE
            )
        finally:
            session.close()

    @students_bp.route('/student-profile/<student_id>', methods=['GET'])
    def get_complete_student_profile(student_id):
        session = Session()
        try:
            student_service = StudentService(session)
            specialization_service = SpecializationService(session)
            study_year_service = StudyYearService(session)
            subgroup_service = SubgroupService(session)
            group_service = GroupService(session)

            student = student_service.get_student_by_id(student_id)
            if not student:
                return handle_response(message="Studentul nu a fost gasit", status_code=HTTP_NOT_FOUND_CODE)

            subgroup = subgroup_service.get_subgroup_by_id(student.subgroup_id)
            group = group_service.get_group_by_id(subgroup.group_id)
            study_year = study_year_service.get_study_year_by_id(group.study_year_id)
            specialization = specialization_service.get_specialization_by_id(study_year.specialization_id)

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

            return handle_response(
                message="Profilul studentului a fost obtinut cu succes",
                status_code=HTTP_OK_CODE,
                data=complete_profile
            )

        except Exception as e:
            logger.error(f"Eroare la obtinerea profilului: {str(e)}")
            return handle_response(
                message="Eroare de server",
                status_code=HTTP_ERROR_CODE
            )
        finally:
            session.close()

    @students_bp.route('/update-student-profile', methods=['PUT'])
    def update_student_profile():
        session = Session()
        try:
            student_service = StudentService(session)
            subgroup_service = SubgroupService(session)
            group_service = GroupService(session)
            course_service = CourseService(session)
            student_courses_service = StudentCoursesService(session)

            data = request.get_json()
            if not data:
                return handle_response(message="Nu au fost furnizate date", status_code=HTTP_BAD_REQUEST_CODE)

            student_id = data.get('student_id')
            first_name = data.get('first_name')
            last_name = data.get('last_name')
            subgroup_id = data.get('subgroup_id')

            missing_fields = [field for field in ['student_id', 'first_name', 'last_name', 'subgroup_id'] if not data.get(field)]
            if missing_fields:
                return handle_response(message=f"Lipsesc campurile obligatorii: {', '.join(missing_fields)}", status_code=HTTP_BAD_REQUEST_CODE)

            student = student_service.get_student_by_id(student_id)
            if not student:
                return handle_response(message="Studentul nu a fost gasit", status_code=HTTP_NOT_FOUND_CODE)

            subgroup = subgroup_service.get_subgroup_by_id(subgroup_id)
            if not subgroup:
                return handle_response(message="Subgrupa nu a fost gasita", status_code=HTTP_BAD_REQUEST_CODE)

            student.first_name = first_name.strip()
            student.last_name = last_name.strip()

            old_subgroup_id = student.subgroup_id
            student.subgroup_id = subgroup_id

            updated_student = student_service.update_student(student)

            if updated_student and old_subgroup_id != updated_student.subgroup_id:
                group = group_service.get_group_by_id(subgroup.group_id)
                if group:
                    courses = course_service.get_schedule_by_subgroup(subgroup, group)
                    student_courses_service.update_student_courses(student.student_id, courses)

            serialized_student = student_service.serialize_student(updated_student)
            return handle_response(
                message='Profilul studentului a fost actualizat cu succes',
                data={"user": serialized_student},
                status_code=HTTP_OK_CODE
            )

        except Exception as e:
            logger.error(f"Eroare la actualizarea profilului: {str(e)}")
            return handle_response(
                message="A aparut o eroare neasteptata in timpul actualizarii profilului",
                status_code=HTTP_ERROR_CODE
            )
        finally:
            session.close()

    app.register_blueprint(students_bp)
    logger.info("Rutele pentru studenti au fost inregistrate cu succes")
