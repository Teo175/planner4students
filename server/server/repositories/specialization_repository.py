from typing import Iterable

from sqlalchemy import func, and_

from server.models.professor import Professor
from server.models.specialization import Specialization
from server.models.student import Student


class SpecializationRepository:
    """
    Repository for Professors
    """

    def __init__(self, sess):
        """Constructor for ProfessorRepository
            :param sess: session instance
         """
        self.session = sess

    def get_specialization_by_name_and_language(self, name: str, language: str) -> Specialization | None:
        return self.session.query(Specialization).filter_by(
            name=name,
            language=language
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
        """
        Get all specializations from the database

        Returns:
            list[Specialization]: List of all specialization objects
        """
        return self.session.query(Specialization).all()