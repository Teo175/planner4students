
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy import Column, String, Integer, ForeignKey
from sqlalchemy import text
from sqlalchemy.orm import relationship

from server.models.base import Base
from server.models.column_names import StudyYearTableColumns, GroupTableColumns


class Group(Base):
    __tablename__ = 'groups'

    group_id = Column(UUID(as_uuid=True), primary_key=True, server_default=text('gen_random_uuid()'))
    group_number = Column(GroupTableColumns.GROUP_NUMBER.value,Integer,nullable= False)
    study_year_id = Column(
        GroupTableColumns.STUDY_YEAR_ID.value,
        UUID(as_uuid=True),
        ForeignKey('study_years.study_year_id'),
        nullable=False
    )
    study_year = relationship("StudyYear", back_populates="groups") # intoarce complet tot obiectul din tabela study year

    subgroups = relationship("Subgroup",back_populates="group")
    courses = relationship("Course", back_populates="group")
    def __init__(self, group_number: int, study_year_id: UUID):
        super().__init__()
        self.group_number = group_number
        self.study_year_id = study_year_id

    def __str__(self):
        return f'{self.group_number} - {self.study_year}'


    def __repr__(self):
        return f"<Group(group_number='{self.group_number}', study_year='{self.study_year}')>"
