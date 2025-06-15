from flask import Blueprint

from server.common.logger import setup_logger
from server.services.group_service import GroupService
from server.services.subgroup_service import SubgroupService
from server.utils.handle_response import handle_response
from server.common.common_constants import HTTP_OK_CODE, HTTP_ERROR_CODE, DATA_MESSAGE
from server.services.study_year_service import StudyYearService

subgroups_bp = Blueprint('subgroups', __name__)
logger = setup_logger(__name__)

def register_routes_subgroup(app, Session):
    logger.info("Inregistrare rute pentru subgrupe")

    @subgroups_bp.route('/subgroups', methods=['GET'])
    def get_all_subgroups():
        session = Session()
        try:
            subgroup_service = SubgroupService(session)
            subgroups = subgroup_service.get_all_subgroups()

            serialized_subgroups = [
                {
                    "subgroup_id": subgroup.subgroup_id,
                    "subgroup_number": subgroup.subgroup_number,
                    "group_id": subgroup.group_id
                }
                for subgroup in subgroups
            ]

            logger.info(f"S-au preluat {len(serialized_subgroups)} subgrupe")

            return handle_response(
                message=DATA_MESSAGE,
                data=serialized_subgroups,
                status_code=HTTP_OK_CODE
            )

        except Exception as e:
            logger.error(f"Eroare la preluarea subgrupelor: {str(e)}")
            return handle_response(
                message=f"Nu s-au putut prelua subgrupele: {str(e)}",
                status_code=HTTP_ERROR_CODE
            )
        finally:
            session.close()

    app.register_blueprint(subgroups_bp)
    logger.info("Rutele pentru subgrupe au fost inregistrate cu succes")
