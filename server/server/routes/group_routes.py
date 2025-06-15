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

def register_routes_group(app, Session):
    logger.info("Inregistrare rute pentru grupe")

    @groups_bp.route('/groups', methods=['GET'])
    def get_all_groups():
        session = Session()
        try:
            group_service = GroupService(session)
            groups = group_service.get_all_groups()

            serialized_groups = [
                {
                    "group_id": group.group_id,
                    "group_number": group.group_number,
                    "study_year_id": group.study_year_id
                }
                for group in groups
            ]

            logger.info(f"S-au preluat {len(serialized_groups)} grupe")

            return handle_response(
                message=DATA_MESSAGE,
                data=serialized_groups,
                status_code=HTTP_OK_CODE
            )

        except Exception as e:
            logger.error(f"Eroare la preluarea grupelor: {str(e)}")
            return handle_response(
                message=f"Nu s-au putut prelua grupele: {str(e)}",
                status_code=HTTP_ERROR_CODE
            )
        finally:
            session.close()

    app.register_blueprint(groups_bp)
    logger.info("Rutele pentru grupe au fost inregistrate cu succes")
