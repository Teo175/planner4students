from server.models.study_year import StudyYear
from server.models.subgroup import Subgroup
from server.repositories.study_year_repository import StudyYearRepository
from server.repositories.subgroup_repository import SubgroupRepository


class StudyYearService:
    """
    Service for StudyYearService
    """

    def __init__(self, session):
        self.studyYearRepository = StudyYearRepository(session)


    def get_study_year(self, study_year_number,specialization) -> StudyYear or None:
        """
        Retrieve a subgroup by their subgroup_number and group id
        :param subgroup_number: The number of the subgroup
        :param group_id: The group that contains the subgroup
        :return: Subgroup object or None if not found
        """
        return self.studyYearRepository.get_study_year(study_year_number,specialization)

    def get_study_year_by_id(self,study_year_id) -> StudyYear or None:
        return self.studyYearRepository.get_study_year_by_id(study_year_id)

    def find_is_last_year(self,study_year_id):
        study_year: StudyYear = self.studyYearRepository.get_study_year_by_id(study_year_id)
        if study_year:
            return self.studyYearRepository.find_is_last_year(study_year.year,study_year.specialization_id)
        return False


    def get_all_study_years(self) -> list[StudyYear]:
        return self.studyYearRepository.get_all()