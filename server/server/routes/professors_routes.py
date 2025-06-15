from flask import Blueprint, request
from server.services.professor_service import ProfessorService
from server.utils.handle_response import handle_response
from server.common.common_constants import HTTP_OK_CODE, HTTP_ERROR_CODE, DATA_MESSAGE, HTTP_BAD_REQUEST_CODE
from server.common.logger import setup_logger

professor_bp = Blueprint('professors', __name__)
logger = setup_logger(__name__)

def register_routes_professor(app, Session):
    logger.info("Inregistrare rute pentru profesori")

    @professor_bp.route('/professors', methods=['GET'])
    def get_professors_by_department():
        department = request.args.get('department')
        if not department:
            return handle_response(
                status_code=HTTP_BAD_REQUEST_CODE,
                message="Parametrul 'department' lipseste"
            )

        session = Session()
        try:
            professor_service = ProfessorService(session)
            professors = professor_service.get_all_professors_from_department(department)
            data = [professor_service.serialize_professor(prof) for prof in professors]

            return handle_response(
                status_code=HTTP_OK_CODE,
                message=DATA_MESSAGE,
                data=data
            )

        except Exception as e:
            logger.error(f"Eroare la obtinerea profesorilor dupa departament: {str(e)}")
            return handle_response(
                status_code=HTTP_ERROR_CODE,
                message=f"Eroare la obtinerea profesorilor: {str(e)}"
            )
        finally:
            session.close()

    app.register_blueprint(professor_bp)
    logger.info("Rutele pentru profesori au fost inregistrate cu succes")
