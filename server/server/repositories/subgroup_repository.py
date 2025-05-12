from typing import Iterable

from sqlalchemy import func, and_

from server.models.group import Group
from server.models.professor import Professor
from server.models.specialization import Specialization
from server.models.student import Student

from server.models.study_year import StudyYear
from server.models.subgroup import Subgroup


class SubgroupRepository:
    """
    Repository for Professors
    """

    def __init__(self, sess):
        """Constructor for ProfessorRepository
            :param sess: session instance
         """
        self.session = sess

    def get_subgroup(self, subgroup_number:int,group:Group) -> Subgroup | None:
        return self.session.query(Subgroup).filter_by(
            subgroup_number=subgroup_number,
            group_id=group.group_id
        ).first()

    def get_subgroup_by_id(self, subgroup_id) -> Subgroup | None:
        return self.session.query(Subgroup).filter_by(
            subgroup_id=subgroup_id
        ).first()
    def add_subgroup(self, subgroup_number,group:Group) -> Subgroup:
        subgroup = Subgroup(
            subgroup_number=subgroup_number,
            group_id=group.group_id
        )
        self.session.add(subgroup)
        self.session.commit()
        return subgroup

    def get_all(self) ->list[Subgroup]:
        return self.session.query(Subgroup).all()