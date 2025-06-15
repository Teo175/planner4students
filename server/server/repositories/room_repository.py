from typing import Iterable

from sqlalchemy import func, and_

from server.models.group import Group
from server.models.professor import Professor
from server.models.room import Room
from server.models.specialization import Specialization
from server.models.student import Student

from server.models.study_year import StudyYear
from server.models.subgroup import Subgroup


class RoomRepository:

    def __init__(self, sess):
        self.session = sess

    def get_room_by_name(self, name:str) -> Room | None:
        return self.session.query(Room).filter_by(
            name=name
        ).first()

    def add_room(self, name:str,location:str = None, google_maps_url: str = None) -> Room:
        room = Room(
            name=name,
            location=location,
            google_maps_url=google_maps_url
        )
        self.session.add(room)
        self.session.commit()
        return room

    def update_location_by_id(self, room_id: str, location: str) -> Room | None:
        room = self.session.query(Room).filter_by(room_id=room_id).first()
        if room:
            room.location = location
            self.session.commit()
            return room
        return None

    def update_google_maps_url(self, room_id: str, google_maps_url: str) -> Room | None:
        room = self.session.query(Room).filter_by(room_id=room_id).first()
        if room:
            room.google_maps_url = google_maps_url
            self.session.commit()
            return room
        return None

    def get_all_rooms(self) -> list[Room]:
        return self.session.query(Room).all()
