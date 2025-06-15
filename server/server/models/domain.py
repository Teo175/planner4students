from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy import Column, String, Integer, ForeignKey, text
from sqlalchemy.orm import relationship

from server.models.base import Base
from server.models.column_names import DomainTableColumns


class Domain(Base):
    __tablename__ = 'domains'

    domain_id = Column(UUID(as_uuid=True), primary_key=True, server_default=text('gen_random_uuid()'))
    name =  Column(DomainTableColumns.NAME.value, String(255), nullable=False, unique=True)
    professors = relationship("Professor", secondary="professor_domains", back_populates="domains")

    def __init__(self, name: str):
        super().__init__()
        self.name = name

    def __str__(self):
        return self.name

    def __repr__(self):
        return f"<Domain(id='{self.domain_id}', name='{self.name}')>"

