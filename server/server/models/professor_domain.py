from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy import Column, String, Integer, ForeignKey, text
from sqlalchemy.orm import relationship

from server.models.base import Base
from server.models.column_names import ProfessorDomainsTableColumns


class ProfessorDomain(Base):
    __tablename__ = 'professor_domains'

    id = Column(Integer, primary_key=True, autoincrement=True)
    professor_id = Column(ProfessorDomainsTableColumns.PROFESSOR_ID.value,UUID(as_uuid=True), ForeignKey('professors.professor_id'), nullable=False)
    domain_id = Column(ProfessorDomainsTableColumns.DOMAIN_ID.value,UUID(as_uuid=True), ForeignKey('domains.domain_id'), nullable=False)

    def __init__(self, professor_id, domain_id):
        super().__init__()
        self.professor_id = professor_id
        self.domain_id = domain_id

    def __repr__(self):
        return f"<ProfessorDomain(id='{self.id}', professor_id='{self.professor_id}', domain_id='{self.domain_id}')>"