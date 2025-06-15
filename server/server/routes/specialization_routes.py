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

specializations_bp = Blueprint('specializations', __name__)
logger = setup_logger(__name__)

def register_routes_specialization(app, Session):
    logger.info("Inregistrare rute pentru specializari")

    @specializations_bp.route('/specializations', methods=['GET'])
    def get_all_specializations():
        session = Session()
        try:
            specialization_service = SpecializationService(session)
            specializations = specialization_service.get_all_specializations()

            serialized_specializations = [
                {
                    "specialization_id": spec.specialization_id,
                    "name": spec.name,
                    "language": spec.language
                }
                for spec in specializations
            ]

            logger.info(f"S-au preluat {len(serialized_specializations)} specializari")

            return handle_response(
                message=DATA_MESSAGE,
                data=serialized_specializations,
                status_code=HTTP_OK_CODE
            )

        except Exception as e:
            logger.error(f"Eroare la preluarea specializarilor: {str(e)}")
            return handle_response(
                message=f"Nu s-au putut prelua specializarile: {str(e)}",
                status_code=HTTP_ERROR_CODE
            )
        finally:
            session.close()

    app.register_blueprint(specializations_bp)
    logger.info("Rutele pentru specializari au fost inregistrate cu succes")
