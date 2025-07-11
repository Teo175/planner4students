import uuid
from datetime import date

from flask import Blueprint, request
from sqlalchemy import UUID

from server.services.academic_schedule_service import AcademicScheduleService
from server.utils.handle_response import handle_response
from server.common.common_constants import HTTP_BAD_REQUEST_CODE, HTTP_OK_CODE, HTTP_ERROR_CODE, \
    STUDENT_NOT_FOUND_ERROR, DATA_MESSAGE, HTTP_NOT_FOUND_CODE
from server.common.logger import setup_logger
from server.services.group_service import GroupService
from server.services.specialization_service import SpecializationService
from server.services.student_service import StudentService
from server.services.study_year_service import StudyYearService
from server.services.subgroup_service import SubgroupService

schedule_bp = Blueprint('academic_schedule', __name__)
logger = setup_logger(__name__)

def register_routes_schedule(app, Session):
    logger.info("Inregistrare rute pentru orar academic")

    @schedule_bp.route('/schedule', methods=['GET'])
    def get_schedule():
        session = Session()
        try:
            academic_schedule_service = AcademicScheduleService(session)
            subgroup_service = SubgroupService(session)
            group_service = GroupService(session)
            study_year_service = StudyYearService(session)

            subgroup_id = request.args.get('subgroup_id')
            subgroup_UUID = uuid.UUID(subgroup_id)
            subgroup = subgroup_service.get_subgroup_by_id(subgroup_UUID)
            group = group_service.get_group_by_id(subgroup.group_id)
            study_year = study_year_service.get_study_year_by_id(group.study_year_id)
            is_terminal = study_year_service.find_is_last_year(study_year.study_year_id)
            logger.info(f"Studentul este in an terminal: {is_terminal}")

            semester_starts = academic_schedule_service.get_semester_starts()
            semester_1 = semester_starts.get(1)
            semester_2 = semester_starts.get(2)
            today = date.today()

            current_semester = 1
            if semester_2 and today >= semester_2:
                current_semester = 2
            elif semester_1 and today >= semester_1:
                current_semester = 1

            logger.info(f"Semestrul curent: {current_semester}")

            academic_periods = academic_schedule_service.get_study_periods()
            holidays = academic_schedule_service.get_holidays()

            periods_data = []
            for period in academic_periods:
                if period.semester == current_semester:
                    if current_semester == 2:
                        if (is_terminal and period.target == 'terminal') or \
                                (not is_terminal and period.target == 'neterminal') or \
                                (period.target is None or period.target == ''):
                            periods_data.append({
                                'id': str(period.id),
                                'start_date': period.start_date.strftime('%Y-%m-%d') if period.start_date else None,
                                'end_date': period.end_date.strftime('%Y-%m-%d') if period.end_date else None,
                                'period_type': period.period_type,
                                'target': period.target,
                                'semester': period.semester
                            })
                    else:
                        periods_data.append({
                            'id': str(period.id),
                            'start_date': period.start_date.strftime('%Y-%m-%d') if period.start_date else None,
                            'end_date': period.end_date.strftime('%Y-%m-%d') if period.end_date else None,
                            'period_type': period.period_type,
                            'target': period.target,
                            'semester': period.semester
                        })

            holidays_data = []
            for holiday in holidays:
                holidays_data.append({
                    'id': str(holiday.id),
                    'holiday_date': holiday.holiday_date.strftime('%Y-%m-%d') if holiday.holiday_date else None,
                    'name': holiday.name
                })

            response_data = {
                'academic_periods': periods_data,
                'holidays': holidays_data,
                'is_terminal': is_terminal,
                'current_semester': current_semester
            }

            return handle_response(
                status_code=HTTP_OK_CODE,
                message=DATA_MESSAGE,
                data=response_data
            )

        except Exception as e:
            logger.error(f"Eroare la obtinerea orarului academic: {str(e)}")
            return handle_response(
                status_code=HTTP_ERROR_CODE,
                message=f"Eroare la obtinerea orarului academic: {str(e)}"
            )
        finally:
            session.close()

    app.register_blueprint(schedule_bp)
    logger.info("Rutele pentru orar academic au fost inregistrate cu succes")
