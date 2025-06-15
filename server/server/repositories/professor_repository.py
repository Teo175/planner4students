from typing import Iterable

from sqlalchemy import func, and_, distinct
from sqlalchemy.orm import joinedload

from server.models.course import Course
from server.models.professor import Professor
from server.models.student import Student


class ProfessorRepository:


    def __init__(self, sess):
        self.session = sess

    def get_professor_by_name(self, first_name: str, last_name: str) -> Professor | None:
        return self.session.query(Professor).filter(
            func.unaccent(Professor.last_name) == func.unaccent(last_name),
            func.unaccent(Professor.first_name).ilike(func.unaccent(f"{first_name}%"))
        ).first()

    def add_professor(self, first_name: str, last_name: str, title: str,email: str = None, web_page: str = None,image_url:str=None,department:str=None,details:str=None) -> Professor:
        professor = Professor(
            first_name=first_name,
            last_name=last_name,
            title=title,
            department=department,
            image_url=image_url,
            email=email,
            web_page=web_page,
            details =details
        )
        self.session.add(professor)
        self.session.commit()
        return professor

    def get_professor_by_email(self, email: str) -> Professor | None:
        return self.session.query(Professor).filter_by(
            email=email
        ).first()

    def update_professor(self, professor_id, professor: Professor) -> Professor | None:
        existing_professor = self.session.query(Professor).filter_by(
            professor_id=professor_id
        ).first()

        if existing_professor:
            existing_professor.first_name = professor.first_name
            existing_professor.last_name = professor.last_name
            existing_professor.title = professor.title
            existing_professor.image_url = professor.image_url
            existing_professor.email = professor.email
            existing_professor.web_page = professor.web_page
            existing_professor.department = professor.department
            existing_professor.details= professor.details

            self.session.commit()
            return existing_professor

        return None

    def get_all_professors_from_department(self, department: str) -> list[Professor]:
        return self.session.query(Professor).options(
            joinedload(Professor.domains)
        ).filter(
            Professor.department == department
        ).all()

    def get_professor_subjects(self, professor_id: int) -> list[str]:
        results = self.session.query(distinct(Course.name)).filter(
            Course.professor_id == professor_id
        ).all()
        return [name for (name,) in results]
    def get_all_professors(self) -> list[Professor]:
        return self.session.query(Professor).all()