from typing import Iterable

from sqlalchemy import func, and_, UUID
from sqlalchemy.orm import joinedload

from server.models.course import Course
from server.models.group import Group
from server.models.professor import Professor
from server.models.professor_domain import ProfessorDomain
from server.models.room import Room
from server.models.specialization import Specialization
from server.models.student import Student
from server.models.student_courses import StudentCourses

from server.models.study_year import StudyYear

class ProfessorDomainsRepository:

    def __init__(self, sess):

        self.session = sess

    def add(self, professor_id: UUID, domain_id: UUID) -> ProfessorDomain | None:

        professor_domain = ProfessorDomain(
            professor_id=professor_id,
            domain_id=domain_id
        )

        self.session.add(professor_domain)
        self.session.commit()

        return professor_domain

    def find_by_professor_and_domain(self, professor_id: UUID, domain_id: UUID) ->ProfessorDomain | None:

        return self.session.query(ProfessorDomain).filter(
            and_(
                ProfessorDomain.professor_id == professor_id,
                ProfessorDomain.domain_id == domain_id
            )
        ).first()