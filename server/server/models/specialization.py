
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy import Column, String, Integer, Text
from sqlalchemy import text
from sqlalchemy.orm import relationship

from server.models.column_names import SpecializationTableColumns
from server.models.base import Base


class Specialization(Base):
    __tablename__ = 'specializations'

    specialization_id = Column(UUID(as_uuid=True), primary_key=True, server_default=text('gen_random_uuid()'))
    name = Column(SpecializationTableColumns.NAME.value,String(100), nullable= False)
    language = Column(SpecializationTableColumns.LANGUAGE.value,String(100), nullable= False)
    study_years = relationship("StudyYear", back_populates="specialization") #toti anii de studiu care au aceasta specializare

    def __init__(self, name: str, language: str):
        super().__init__()
        self.name = name
        self.language = language



    def get_name(self) -> str:
        return self.name

    def get_language(self) -> str:
        return self.language

    def __str__(self):
        return f'{self.specialization_id} - {self.name} {self.language}'

    def __repr__(self):
        return f"<Specialization(specialization_id='{self.specialization_id}', name='{self.name}', language='{self.language}')>"
