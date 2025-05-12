from server.models.specialization import Specialization
from server.models.subgroup import Subgroup
from server.repositories.specialization_repository import SpecializationRepository
from server.repositories.study_year_repository import StudyYearRepository
from server.repositories.subgroup_repository import SubgroupRepository


class SpecializationService:
    """
    Service for SpecializationService
    """

    def __init__(self, session):
        self.specializationRepository = SpecializationRepository(session)


    def get_specialization_by_name_and_language(self, name,language) -> Specialization or None:
        """
        Retrieve a subgroup by their subgroup_number and group id
        :param subgroup_number: The number of the subgroup
        :param group_id: The group that contains the subgroup
        :return: Subgroup object or None if not found
        """
        return self.specializationRepository.get_specialization_by_name_and_language(name, language)

    def get_all_specializations(self)->list[Specialization]:
        """
          Get all specializations from the database

          Returns:
              list[Specialization]: List of all specialization objects
          """
        return self.specializationRepository.get_all()