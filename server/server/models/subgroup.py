
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy import Column, String, Integer, ForeignKey
from sqlalchemy import text
from sqlalchemy.orm import relationship

from server.models.base import Base
from server.models.column_names import SubgroupTableColumns


class Subgroup(Base):
    __tablename__ = 'subgroups'

    subgroup_id = Column(UUID(as_uuid=True), primary_key=True, server_default=text('gen_random_uuid()'))
    subgroup_number = Column(SubgroupTableColumns.SUBGROUP_NUMBER.value,Integer,nullable= False)
    group_id = Column(
        SubgroupTableColumns.GROUP_ID.value,
        UUID(as_uuid=True),
        ForeignKey('groups.group_id'),
        nullable=False
    )
    group = relationship("Group", back_populates="subgroups")
    students = relationship("Student", back_populates="subgroup")
    courses = relationship("Course", back_populates="subgroup")

    def __init__(self, subgroup_number: int, group_id: UUID):
        super().__init__()
        self.subgroup_number = subgroup_number
        self.group_id = group_id

    def __str__(self):
        return f'{self.subgroup_number} - {self.group}'


    def __repr__(self):
        return f"<Subgroup(subgroup_number='{self.subgroup_number}', group='{self.group_id}')>"
