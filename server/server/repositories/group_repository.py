
from server.models.group import Group
from server.models.study_year import StudyYear

class GroupRepository:
    def __init__(self, sess):
        self.session = sess

    def get_group(self, group_number:int,study_year:StudyYear) -> Group | None:
        return self.session.query(Group).filter_by(
            group_number=group_number,
            study_year_id=study_year.study_year_id
        ).first()

    def get_group_by_id(self, group_id) -> Group | None:
        return self.session.query(Group).filter_by(
            group_id=group_id
        ).first()

    def add_group(self, group_number,study_year:StudyYear) -> Group:
        group = Group(
            group_number=group_number,
            study_year_id=study_year.study_year_id
        )
        self.session.add(group)
        self.session.commit()
        return group


    def get_all(self) -> list[Group]:
        return self.session.query(Group).all()