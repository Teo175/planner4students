from typing import Iterable

from sqlalchemy import func, and_

from server.models.professor import Professor
from server.models.specialization import Specialization
from server.models.student import Student


class SpecializationRepository:
    def __init__(self, sess):
        self.session = sess

    def get_specialization_by_name_and_language(self, name: str, language: str) -> Specialization | None:
        return self.session.query(Specialization).filter_by(
            name=name,
            language=language
        ).first()

    def get_specialization_by_id(self, id) -> Specialization | None:
        return self.session.query(Specialization).filter_by(
            specialization_id=id
        ).first()

    def add_specialization(self, name: str, language: str) -> Specialization:
        specialization = Specialization(
            name=name,
            language=language
        )
        self.session.add(specialization)
        self.session.commit()
        return specialization

    def get_all(self) -> list[Specialization]:
        return self.session.query(Specialization).all()