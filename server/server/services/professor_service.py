from typing import Iterable, Optional

from server.models.professor import Professor
from server.repositories.professor_repository import ProfessorRepository


class ProfessorService:
    """
    Service for ProfessorsService
    """

    def __init__(self, session):
        self.professorRepository = ProfessorRepository(session)


    def get_professor_by_name(self, first_name: str,last_name:str,title:str) -> Professor:
        """
        Retrieve a
        :return: User object or None if not found
        """
        return self.professorRepository.get_professor_by_name(first_name,last_name,title)

    def add_professor(self,first_name: str, last_name: str, title: str, email: str = None, web_page: str = None) -> Professor:
        """
        Adds a new user in the system
        :param email: The data of the new user
        :return: User object or None if not added
        """
        return self.professorRepository.add_professor(first_name, last_name, title, email, web_page)


