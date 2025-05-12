from server.models.column_names import SubgroupTableColumns
from server.models.group import Group
from server.models.subgroup import Subgroup
from server.repositories.subgroup_repository import SubgroupRepository


class SubgroupService:
    """
    Service for SubgroupService
    """

    def __init__(self, session):
        self.subgroupRepository = SubgroupRepository(session)


    def get_subgroup(self, subgroup_number,group:Group) -> Subgroup or None:
        """
        Retrieve a subgroup by their subgroup_number and group id
        :param subgroup_number: The number of the subgroup
        :param group_id: The group that contains the subgroup
        :return: Subgroup object or None if not found
        """
        return self.subgroupRepository.get_subgroup(subgroup_number,group)
    def get_subgroup_by_id(self,subgroup_uuid)-> Subgroup:
        return self.subgroupRepository.get_subgroup_by_id(subgroup_uuid)
    def get_all_subgroups(self) -> list[Subgroup]:
        return self.subgroupRepository.get_all()

    @staticmethod
    def serialize_subgroup(subgroup: Subgroup):
        """
           Function for serializing a course

           :param course: Course object
           :return: a dictionary containing every field of the course
           """
        if subgroup is None:
            return {}
        return {
            SubgroupTableColumns.SUBGROUP_ID.value: str(subgroup.subgroup_id),
            SubgroupTableColumns.SUBGROUP_NUMBER.value: subgroup.subgroup_number,
            SubgroupTableColumns.GROUP_ID.value: str(subgroup.group_id),
        }