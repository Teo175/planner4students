from server.models.column_names import SubgroupTableColumns
from server.models.group import Group
from server.models.subgroup import Subgroup
from server.repositories.subgroup_repository import SubgroupRepository


class SubgroupService:

    def __init__(self, session):
        self.subgroupRepository = SubgroupRepository(session)


    def get_subgroup(self, subgroup_number,group:Group) -> Subgroup or None:

        return self.subgroupRepository.get_subgroup(subgroup_number,group)
    def get_subgroup_by_id(self,subgroup_uuid)-> Subgroup:
        return self.subgroupRepository.get_subgroup_by_id(subgroup_uuid)
    def get_all_subgroups(self) -> list[Subgroup]:
        return self.subgroupRepository.get_all()

    @staticmethod
    def serialize_subgroup(subgroup: Subgroup):

        if subgroup is None:
            return {}
        return {
            SubgroupTableColumns.SUBGROUP_ID.value: str(subgroup.subgroup_id),
            SubgroupTableColumns.SUBGROUP_NUMBER.value: subgroup.subgroup_number,
            SubgroupTableColumns.GROUP_ID.value: str(subgroup.group_id),
        }