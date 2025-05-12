from flask import Blueprint, request
from werkzeug.security import generate_password_hash, check_password_hash

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

groups_bp = Blueprint('groups', __name__)
logger = setup_logger(__name__)
def register_routes_group(app, session):
    """
    Function that registers all the routes for the group requests.
    Includes proper error handling and logging throughout the process.

    Args:
        app: Flask application instance
        session: Database session
    """
    logger.info("Registering group routes")
    study_year_service = StudyYearService(session)
    subgroup_service = SubgroupService(session)
    group_service = GroupService(session)

    @groups_bp.route('/groups', methods=['GET'])
    def get_all_groups():
        """Endpoint to get all groups"""
        try:
            # Get all groups from the service
            groups = group_service.get_all_groups()

            # Serialize the groups
            serialized_groups = [
                {
                    "group_id": group.group_id,
                    "group_number": group.group_number,
                    "study_year_id": group.study_year_id
                }
                for group in groups
            ]

            logger.info(f"Retrieved {len(serialized_groups)} groups")

            # Return the response
            return handle_response(
                message=DATA_MESSAGE,
                data=serialized_groups,
                status_code=HTTP_OK_CODE
            )

        except Exception as e:
            logger.error(f"Error retrieving groups: {str(e)}")
            return handle_response(
                message=f"Failed to retrieve groups: {str(e)}",
                status_code=HTTP_ERROR_CODE
            )

    app.register_blueprint(groups_bp)
    logger.info("group routes registered successfully")
