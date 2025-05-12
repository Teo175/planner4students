
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy import Column, String, Date, Integer
from sqlalchemy import text

from server.models.base import Base
from server.models.column_names import AcademicScheduleTableColumns


class AcademicSchedule(Base):
    __tablename__ = 'academic_schedule'

    id = Column(UUID(as_uuid=True), primary_key=True, server_default=text('gen_random_uuid()'))
    start_date = Column(AcademicScheduleTableColumns.START_DATE.value,Date,nullable= False)
    end_date = Column(AcademicScheduleTableColumns.END_DATE.value,Date,nullable=False)
    period_type = Column(AcademicScheduleTableColumns.PERIOD_TYPE.value, String(50),nullable=False)
    target = Column(AcademicScheduleTableColumns.TARGET.value,String(20))
    semester = Column(AcademicScheduleTableColumns.SEMESTER.value,Integer,nullable=False)

    def __init__(self, start_date, end_date, period_type,target,semester):
        self.start_date = start_date
        self.end_date = end_date
        self.period_type = period_type
        self.target = target
        self.semester = semester

    def __repr__(self):
        return f"<AcademicSchedule(id={self.id}, start_date={self.start_date}, end_date={self.end_date}, period_type='{self.period_type}' target='{self.target}', semester='{self.semester}')>"

    def __str__(self):
        return f"[{self.period_type.upper()}] {self.start_date} ➡ {self.end_date}"