from server.models.specialization import Specialization
from server.models.subgroup import Subgroup
from server.repositories.specialization_repository import SpecializationRepository
from server.repositories.study_year_repository import StudyYearRepository
from server.repositories.subgroup_repository import SubgroupRepository


class SpecializationService:

    def __init__(self, session):
        self.specializationRepository = SpecializationRepository(session)

    def get_specialization_by_id(self, id) -> Specialization or None:

        return self.specializationRepository.get_specialization_by_id(id)
    def get_specialization_by_name_and_language(self, name,language) -> Specialization or None:

        return self.specializationRepository.get_specialization_by_name_and_language(name, language)

    def get_all_specializations(self)->list[Specialization]:

        return self.specializationRepository.get_all()