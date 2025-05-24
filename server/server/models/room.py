from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy import Column, String, Integer, ForeignKey
from sqlalchemy import text
from sqlalchemy.orm import relationship

from server.models.base import Base
from server.models.column_names import RoomTableColumns


class Room(Base):
    __tablename__ = 'rooms'

    room_id = Column(UUID(as_uuid=True), primary_key=True, server_default=text('gen_random_uuid()'))
    name = Column(RoomTableColumns.NAME.value, String(100), nullable=False)
    location = Column(RoomTableColumns.LOCATION.value, String(255))
    google_maps_url = Column(RoomTableColumns.GOOGLE_MAPS_URL.value, String(2048), nullable=True)

    courses = relationship("Course", back_populates="room")

    def __init__(self, name: str, location: str, google_maps_url: str = None):
        super().__init__()
        self.name = name
        self.location = location
        self.google_maps_url = google_maps_url

    def __str__(self):
        return f'{self.name} - {self.location}'

    def __repr__(self):
        return f"<Room(name='{self.name}', location='{self.location}', google_maps_url='{self.google_maps_url}')>"