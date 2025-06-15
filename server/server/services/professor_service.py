from typing import Iterable, Optional

from server.models.professor import Professor
from server.repositories.professor_repository import ProfessorRepository


class ProfessorService:
    def __init__(self, session):
        self.professorRepository = ProfessorRepository(session)


    def get_professor_by_name(self, first_name: str,last_name:str) -> Professor:

        return self.professorRepository.get_professor_by_name(first_name,last_name)

    def add_professor(self,first_name: str, last_name: str, title: str, email: str = None, web_page: str = None,image_url:str =None,department:str=None,details:str=None) -> Professor:

        return self.professorRepository.add_professor(first_name, last_name, title, email, web_page,image_url,department,details)

    def get_all_professors_from_department(self,department):
        return self.professorRepository.get_all_professors_from_department(department=department)

    def get_all_professors(self):
        return self.professorRepository.get_all_professors()

    def get_professor_subjects(self,professor_id):
        return self.professorRepository.get_professor_subjects(professor_id)
    @staticmethod
    def serialize_professor(professor: Professor) -> dict:
        return {
            "professor_id": str(professor.professor_id),
            "first_name": professor.first_name,
            "last_name": professor.last_name,
            "title": professor.title,
            "email": professor.email,
            "web_page": professor.web_page,
            "department": professor.department,
            "image_url": professor.image_url,
            "details": professor.details,
            "domains": [domain.name for domain in professor.domains]
        }