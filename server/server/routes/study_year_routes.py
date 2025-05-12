from flask import Blueprint, request
from werkzeug.security import generate_password_hash, check_password_hash

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

study_year_bp = Blueprint('study_years', __name__)
logger = setup_logger(__name__)
def register_routes_study_year(app, session):
    """
    Function that registers all the routes for the specialization requests.
    Includes proper error handling and logging throughout the process.

    Args:
        app: Flask application instance
        session: Database session
    """
    logger.info("Registering specialization routes")
    specialization_service = SpecializationService(session)
    study_year_service = StudyYearService(session)
    subgroup_service = SubgroupService(session)
    group_service = GroupService(session)

    @study_year_bp.route('/study_years', methods=['GET'])
    def get_all_study_years():
        """Endpoint to get all study years"""
        try:
            # Get all specializations from the service
            study_years = study_year_service.get_all_study_years()

            # Serialize the specializations
            serialized_study_years = [
                {
                    "study_year_id": year.study_year_id,
                    "year": year.year,
                    "specialization_id": year.specialization_id
                }
                for year in study_years
            ]

            logger.info(f"Retrieved {len(serialized_study_years)} study years")

            # Return the response
            return handle_response(
                message=DATA_MESSAGE,
                data=serialized_study_years,
                status_code=HTTP_OK_CODE
            )

        except Exception as e:
            logger.error(f"Error retrieving study_years: {str(e)}")
            return handle_response(
                message=f"Failed to retrieve study_years: {str(e)}",
                status_code=HTTP_ERROR_CODE
            )

    app.register_blueprint(study_year_bp)
    logger.info("Study year routes registered successfully")
