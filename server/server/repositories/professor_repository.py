from typing import Iterable

from sqlalchemy import func, and_

from server.models.professor import Professor
from server.models.student import Student


class ProfessorRepository:
    """
    Repository for Professors
    """

    def __init__(self, sess):
        """Constructor for ProfessorRepository
            :param sess: session instance
         """
        self.session = sess

    def get_professor_by_name(self, first_name: str, last_name: str, title: str) -> Professor | None:
        return self.session.query(Professor).filter_by(
            first_name=first_name,
            last_name=last_name,
            title=title
        ).first()

    def add_professor(self, first_name: str, last_name: str, title: str, email: str = None, web_page: str = None) -> Professor:
        professor = Professor(
            first_name=first_name,
            last_name=last_name,
            title=title,
            email=email,
            web_page=web_page
        )
        self.session.add(professor)
        self.session.commit()
        return professor

