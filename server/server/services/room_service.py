from sqlalchemy import UUID

from server.common.logger import setup_logger
from server.models.room import Room
from server.repositories.room_repository import RoomRepository


class RoomService:

    logger = setup_logger(__name__)

    def __init__(self, session):
        self.roomRepository = RoomRepository(session)  # Fix: era RoomService în loc de RoomRepository

    def get_all_rooms(self) -> list[Room]:

        try:
            rooms = self.roomRepository.get_all_rooms()
            self.logger.info(f"Retrieved {len(rooms)} rooms from database")
            return rooms
        except Exception as e:
            self.logger.error(f"Eroare la obținerea sălilor: {str(e)}")
            return []



