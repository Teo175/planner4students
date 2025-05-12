from server.models.column_names import GroupTableColumns
from server.models.group import Group
from server.models.study_year import StudyYear
from server.repositories.group_repository import GroupRepository


class GroupService:
    """
    Service for GroupService
    """

    def __init__(self, session):
        self.groupRepository = GroupRepository(session)


    def get_group(self,group_number,study_year: StudyYear) -> Group or None:
        """
        Retrieve a group by their group_number
        :param group_number: The number of the group
        :return: Group object or None if not found
        """
        return self.groupRepository.get_group(group_number,study_year)
    def get_group_by_id(self,group_id) ->Group:
        return self.groupRepository.get_group_by_id(group_id)
    def get_all_groups(self) ->list[Group]:
        return self.groupRepository.get_all()

    @staticmethod
    def serialize_group(group: Group):
        """
           Function for serializing a course

           :param course: Course object
           :return: a dictionary containing every field of the course
           """
        if group is None:
            return {}
        return {
            GroupTableColumns.GROUP_ID.value: str(group.group_id),
            GroupTableColumns.GROUP_NUMBER.value: group.group_number,
            GroupTableColumns.STUDY_YEAR_ID.value: str(group.study_year_id),
        }