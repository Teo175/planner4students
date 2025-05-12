from typing import Iterable

from sqlalchemy import func, and_, Boolean

from server.models.professor import Professor
from server.models.specialization import Specialization
from server.models.student import Student

from server.models.study_year import StudyYear

class StudyYearRepository:
    """
    Repository for Professors
    """

    def __init__(self, sess):
        """Constructor for ProfessorRepository
            :param sess: session instance
         """
        self.session = sess

    def get_study_year(self, year: int, specialization: Specialization) -> StudyYear | None:
        return self.session.query(StudyYear).filter_by(
            year=year,
            specialization_id=specialization.specialization_id
        ).first()

    def get_study_year_by_id(self,study_year_id)->StudyYear or None:
        return self.session.query(StudyYear).filter_by(
            study_year_id=study_year_id,
        ).first()

    def find_is_last_year(self,year,specialization_id):
        max_year = self.session.query(func.max(StudyYear.year)) \
            .filter(StudyYear.specialization_id == specialization_id) \
            .scalar()
        return max_year == year

    def add_study_year(self, year:int, specialization: Specialization) -> StudyYear:
        study_year = StudyYear(
            year=year,
            specialization_id=specialization.specialization_id
        )
        self.session.add(study_year)
        self.session.commit()
        return study_year

    def get_all(self) -> list[StudyYear]:
        """
               Get all study_years from the database

               Returns:
                   list[StudyYear]: List of all study year objects
               """
        return self.session.query(StudyYear).all()
