from flask import Blueprint

from server.common.logger import setup_logger
from server.services.group_service import GroupService
from server.services.subgroup_service import SubgroupService
from server.utils.handle_response import handle_response
from server.common.common_constants import HTTP_OK_CODE, HTTP_ERROR_CODE, DATA_MESSAGE
from server.services.study_year_service import StudyYearService

subgroups_bp = Blueprint('subgroups', __name__)
logger = setup_logger(__name__)
def register_routes_subgroup(app, session):
    """
    Function that registers all the routes for the subgroup requests.
    Includes proper error handling and logging throughout the process.

    Args:
        app: Flask application instance
        session: Database session
    """
    logger.info("Registering subgroup routes")
    group_service = GroupService(session)
    study_year_service = StudyYearService(session)
    subgroup_service = SubgroupService(session)
    group_service = GroupService(session)

    @subgroups_bp.route('/subgroups', methods=['GET'])
    def get_all_subgroups():
        """Endpoint to get all subgroups"""
        try:
            # Get all subgroups from the service
            subgroups = subgroup_service.get_all_subgroups()

            # Serialize the subgroups
            serialized_subgroups = [
                {
                    "subgroup_id": subgroup.subgroup_id,
                    "subgroup_number": subgroup.subgroup_number,
                    "group_id": subgroup.group_id
                }
                for subgroup in subgroups
            ]

            logger.info(f"Retrieved {len(serialized_subgroups)} subgroups")

            # Return the response
            return handle_response(
                message=DATA_MESSAGE,
                data=serialized_subgroups,
                status_code=HTTP_OK_CODE
            )

        except Exception as e:
            logger.error(f"Error retrieving subgroups: {str(e)}")
            return handle_response(
                message=f"Failed to retrieve subgroups: {str(e)}",
                status_code=HTTP_ERROR_CODE
            )

    app.register_blueprint(subgroups_bp)
    logger.info("subgroup routes registered successfully")
