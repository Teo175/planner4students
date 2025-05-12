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
    """
    Repository for Professors
    """

    def __init__(self, sess):
        """Constructor for ProfessorRepository
            :param sess: session instance
         """
        self.session = sess

    def get_room(self, name:str) -> Room | None:
        return self.session.query(Room).filter_by(
            name=name
        ).first()

    def add_room(self, name:str,location:str = None) -> Room:
        room = Room(
            name=name,
            location=location
        )
        self.session.add(room)
        self.session.commit()
        return room

