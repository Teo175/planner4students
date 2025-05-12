from server.models.column_names import CourseTableColumns
from server.models.course import Course
from server.models.group import Group
from server.models.study_year import StudyYear
from server.models.subgroup import Subgroup
from server.repositories.course_repository import CourseRepository
from server.repositories.group_repository import GroupRepository


class CourseService:
    """
    Service for GroupService
    """

    def __init__(self, session):
        self.courseRepository = CourseRepository(session)


    def get_schedule_by_subgroup(self,subgroup:Subgroup,group:Group) -> list[Course]:
        """
        Retrieve a group by their group_number
        :param group_number: The number of the group
        :return: Group object or None if not found
        """
        return self.courseRepository.get_schedule_by_subgroup(subgroup,group)

    @staticmethod
    def serialize_course(course: Course):
        """
           Function for serializing a course

           :param course: Course object
           :return: a dictionary containing every field of the course
           """
        if course is None:
            return {}
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
            CourseTableColumns.FREQUENCY.value: course.frequency
        }