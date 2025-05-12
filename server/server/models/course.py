
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy import Column, String, Integer, ForeignKey,Time
from sqlalchemy import text
from sqlalchemy.orm import relationship

from server.models.column_names import CourseTableColumns
from server.models.base import Base

class Course(Base):
    __tablename__ = 'courses'

    course_id = Column(UUID(as_uuid=True), primary_key=True, server_default=text('gen_random_uuid()'))
    name = Column(CourseTableColumns.NAME.value, String(100), nullable=False)
    professor_id = Column(CourseTableColumns.PROFESSOR_ID.value, UUID(as_uuid=True),ForeignKey('professors.professor_id'), nullable=False)
    course_type = Column(CourseTableColumns.COURSE_TYPE.value, String(255), nullable=False) #curs/seminar/lab
    study_year_id = Column(CourseTableColumns.STUDY_YEAR_ID.value,UUID(as_uuid=True),ForeignKey('study_years.study_year_id'))
    group_id = Column(CourseTableColumns.GROUP_ID.value,UUID(as_uuid=True),ForeignKey('groups.group_id'),nullable=True)
    subgroup_id = Column(CourseTableColumns.SUBGROUP_ID.value, UUID(as_uuid=True),ForeignKey('subgroups.subgroup_id'),nullable=True) #0-toti 1/2
    day = Column(CourseTableColumns.DAY.value, String(50))
    start_time = Column(CourseTableColumns.START_TIME.value, Time)
    end_time = Column(CourseTableColumns.END_TIME.value,Time)
    room_id = Column(CourseTableColumns.ROOM_ID.value,UUID(as_uuid=True),ForeignKey('rooms.room_id'),nullable=True)
    frequency = Column(CourseTableColumns.FREQUENCY.value,Integer)

    professor = relationship("Professor", back_populates="courses")
    study_year = relationship("StudyYear", back_populates="courses")
    group = relationship("Group", back_populates="courses")
    subgroup = relationship("Subgroup", back_populates="courses")


    def __init__(self, name: str, professor_id: UUID, course_type: str,
                 study_year_id: UUID = None, group_id: UUID = None,
                 subgroup_id: UUID = None, day: str = None,
                 start_time: Time = None, end_time: Time = None,
                 room_id: UUID = None, frequency: int = None):
        super().__init__()
        self.name = name
        self.professor_id = professor_id
        self.course_type = course_type
        self.study_year_id = study_year_id
        self.group_id = group_id
        self.subgroup_id = subgroup_id
        self.day = day
        self.start_time = start_time
        self.end_time = end_time
        self.room_id = room_id
        self.frequency = frequency

    def __str__(self):
        return f'{self.name} - {self.course_type}'

    def __repr__(self):
        return f"<Course(name='{self.name}', type='{self.course_type}', professor_id='{self.professor_id}')>"