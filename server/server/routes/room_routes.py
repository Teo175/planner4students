from flask import Blueprint, request

from server.common.common_constants import DATA_MESSAGE, HTTP_OK_CODE, HTTP_ERROR_CODE
from server.services.room_service import RoomService
from server.common.logger import setup_logger
from server.utils.handle_response import handle_response

rooms_bp = Blueprint('rooms', __name__)
logger = setup_logger(__name__)

def register_routes_room(app, Session):
    logger.info("Inregistrare rute pentru sali")

    @rooms_bp.route('/rooms', methods=['GET'])
    def get_all_rooms():
        session = Session()
        try:
            room_service = RoomService(session)
            rooms = room_service.get_all_rooms()

            serialized_rooms = [
                {
                    "room_id": room.room_id,
                    "name": room.name,
                    "location": room.location,
                    "google_maps_url": room.google_maps_url
                }
                for room in rooms
            ]

            logger.info(f"S-au preluat {len(serialized_rooms)} sali")

            return handle_response(
                message=DATA_MESSAGE,
                data=serialized_rooms,
                status_code=HTTP_OK_CODE
            )

        except Exception as e:
            logger.error(f"Eroare la preluarea salilor: {str(e)}")
            return handle_response(
                message=f"Nu s-au putut prelua salile: {str(e)}",
                status_code=HTTP_ERROR_CODE
            )
        finally:
            session.close()

    app.register_blueprint(rooms_bp)
    logger.info("Rutele pentru sali au fost inregistrate cu succes")
