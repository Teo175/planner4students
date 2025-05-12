
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy import Column, String, Integer, ForeignKey
from sqlalchemy import text
from sqlalchemy.orm import relationship

from server.models.base import Base
from server.models.column_names import StudyYearTableColumns


class StudyYear(Base):
    __tablename__ = 'study_years'

    study_year_id = Column(UUID(as_uuid=True), primary_key=True, server_default=text('gen_random_uuid()'))
    year = Column(StudyYearTableColumns.YEAR.value,Integer,nullable= False)
    specialization_id = Column(
        StudyYearTableColumns.SPECIALIZATION_ID.value,
        UUID(as_uuid=True),  # Change the type to match Specialization's primary key
        ForeignKey('specializations.specialization_id'),  # Add foreign key constraint
        nullable=False
    )
    specialization = relationship("Specialization", back_populates="study_years") # intoarce complet tot obiectul din tabela specialization
    groups = relationship("Group",back_populates="study_year") #intoarce toate grupurile din study year respectiv
    courses = relationship("Course", back_populates="study_year")
    def __init__(self, year: int, specialization_id: UUID):
        super().__init__()
        self.year = year
        self.specialization_id = specialization_id

    def __str__(self):
        return f'{self.study_year_id} - {self.year} - {self.specialization}'

    def __repr__(self):
        return f"<StudyYear(study_year_id='{self.study_year_id}', year='{self.year}', specialization_id='{self.specialization_id}')>"
