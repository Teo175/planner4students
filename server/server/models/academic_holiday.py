
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy import Column, String, Date
from sqlalchemy import text

from server.models.base import Base
from server.models.column_names import AcademicHolidayTableColumns


class AcademicHoliday(Base):
    __tablename__ = 'academic_holidays'

    id = Column(UUID(as_uuid=True), primary_key=True, server_default=text('gen_random_uuid()'))
    holiday_date = Column(AcademicHolidayTableColumns.HOLIDAY_DATE.value,Date,nullable=False)
    name = Column(AcademicHolidayTableColumns.NAME.value,String(100),nullable=False)

    def __init__(self,holiday_date, name):
        self.holiday_date = holiday_date
        self.name = name

    def __repr__(self):
        return f"<AcademicHoliday(id={self.id}, holiday_date={self.holiday_date}, name='{self.name}')>"

    def __str__(self):
        return f"[{self.name.upper()}]: {self.holiday_date} "