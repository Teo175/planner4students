from sqlalchemy import UUID

from server.models.column_names import CourseTableColumns
from server.models.course import Course
from server.models.group import Group
from server.models.study_year import StudyYear
from server.models.subgroup import Subgroup
from server.repositories.course_repository import CourseRepository
from server.repositories.group_repository import GroupRepository
from server.repositories.study_year_repository import StudyYearRepository


class CourseService:
    def __init__(self, session):
        self.courseRepository = CourseRepository(session)
        self.groupRepository = GroupRepository(session)
        self.studyYearRepository = StudyYearRepository(session)


    def get_schedule_by_subgroup(self,subgroup:Subgroup,group:Group) -> list[Course]:

        return self.courseRepository.get_schedule_by_subgroup(subgroup,group)

    def search_courses_by_name_and_type(self, group_UUID, search_term: str = '', course_type: str = '') -> list[Course]:

        group = self.groupRepository.get_group_by_id(group_UUID)
        study_year = self.studyYearRepository.get_study_year_by_id(group.study_year_id)
        return self.courseRepository.search_courses_by_name_and_type(study_year.study_year_id,search_term,course_type)

    def search_unique_names_courses(self,study_year_id) -> list[str]:

        return self.courseRepository.search_unique_course_names(study_year_id)

    @staticmethod
    def serialize_course(course: Course):

        if course is None:
            return {}


        room_name = None
        professor_full_name = None

        if hasattr(course, 'room') and course.room is not None:
            room_name = course.room.name


        if hasattr(course, 'professor') and course.professor is not None:

            professor_full_name = f"{course.professor.title} {course.professor.last_name} {course.professor.first_name}"

        return {
            CourseTableColumns.COURSE_ID.value: str(course.course_id),
            CourseTableColumns.NAME.value: course.name,
            CourseTableColumns.PROFESSOR_ID.value: str(course.professor_id),
            CourseTableColumns.COURSE_TYPE.value: course.course_type,
            CourseTableColumns.STUDY_YEAR_ID.value: str(course.study_year_id) if course.study_year_id else None,
            CourseTableColumns.GROUP_ID.value: str(course.group_id) if course.group_id else None,
            CourseTableColumns.SUBGROUP_ID.value: str(course.subgroup_id) if course.subgroup_id else None,
            CourseTableColumns.DAY.value: course.day,
            CourseTableColumns.START_TIME.value: str(course.start_time),
            CourseTableColumns.END_TIME.value: str(course.end_time),
            CourseTableColumns.ROOM_ID.value: str(course.room_id) if course.room_id else None,
            CourseTableColumns.FREQUENCY.value: course.frequency,
            'room_name': room_name,
            'professor_name': professor_full_name
        }
