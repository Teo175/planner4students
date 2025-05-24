from flask import Blueprint, request

from server.common.common_constants import DATA_MESSAGE, HTTP_OK_CODE, HTTP_ERROR_CODE
from server.services.room_service import RoomService
from server.common.logger import setup_logger
from server.utils.handle_response import handle_response

rooms_bp = Blueprint('rooms', __name__)
logger = setup_logger(__name__)
def register_routes_room(app, session):
    """
    Function that registers all the routes for the group requests.
    Includes proper error handling and logging throughout the process.

    Args:
        app: Flask application instance
        session: Database session
    """
    logger.info("Registering group routes")
    room_service = RoomService(session)

    @rooms_bp.route('/rooms', methods=['GET'])
    def get_all_rooms():
        """Endpoint to get all rooms"""
        try:
            # Get all groups from the service
            rooms = room_service.get_all_rooms()

            # Serialize the groups
            serialized_rooms = [
                {
                    "room_id": room.room_id,
                    "name": room.name,
                    "location": room.location,
                    "google_maps_url": room.google_maps_url
                }
                for room in rooms
            ]

            logger.info(f"Retrieved {len(serialized_rooms)} rooms")

            # Return the response
            return handle_response(
                message=DATA_MESSAGE,
                data=serialized_rooms,
                status_code=HTTP_OK_CODE
            )

        except Exception as e:
            logger.error(f"Error retrieving rooms: {str(e)}")
            return handle_response(
                message=f"Failed to retrieve rooms: {str(e)}",
                status_code=HTTP_ERROR_CODE
            )

    app.register_blueprint(rooms_bp)
    logger.info("group routes registered successfully")
