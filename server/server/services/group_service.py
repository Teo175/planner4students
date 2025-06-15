from server.models.column_names import GroupTableColumns
from server.models.group import Group
from server.models.study_year import StudyYear
from server.repositories.group_repository import GroupRepository


class GroupService:
    def __init__(self, session):
        self.groupRepository = GroupRepository(session)


    def get_group(self,group_number,study_year: StudyYear) -> Group or None:
        return self.groupRepository.get_group(group_number,study_year)
    def get_group_by_id(self,group_id) ->Group:
        return self.groupRepository.get_group_by_id(group_id)
    def get_all_groups(self) ->list[Group]:
        return self.groupRepository.get_all()

    @staticmethod
    def serialize_group(group: Group):
        if group is None:
            return {}
        return {
            GroupTableColumns.GROUP_ID.value: str(group.group_id),
            GroupTableColumns.GROUP_NUMBER.value: group.group_number,
            GroupTableColumns.STUDY_YEAR_ID.value: str(group.study_year_id),
        }