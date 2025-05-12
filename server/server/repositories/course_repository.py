from typing import Iterable

from sqlalchemy import Time, or_, and_

from server.models.course import Course
from server.models.group import Group
from server.models.subgroup import Subgroup


class CourseRepository:
    """
    Repository for Professors
    """

    def __init__(self, sess):
        """Constructor for ProfessorRepository
            :param sess: session instance
         """
        self.session = sess

    def get_course(self,name:str,professor_id,course_type,study_year_id,group_id,subgroup_id,day:str,start_time:Time,end_time:Time,room_id,frequency) -> Course | None:
        return self.session.query(Course).filter_by(
            name=name,
            professor_id=professor_id,
            course_type=course_type,
            study_year_id=study_year_id,
            group_id=group_id,
            subgroup_id=subgroup_id,
            day=day,
            start_time=start_time,
            end_time=end_time,
            room_id=room_id,
            frequency=frequency

        ).first()

    def add_course(self,course: Course ) -> Course:
        self.session.add(course)
        self.session.commit()
        return course

    def get_schedule_by_subgroup(self, subgroup: Subgroup, group: Group) -> list[Course]:
        subgroup_courses = self.session.query(Course).filter(
            Course.subgroup_id == subgroup.subgroup_id,
        )

        # Query 2: Get courses specific to this group
        group_courses = self.session.query(Course).filter(
            Course.group_id == subgroup.group_id,
            Course.subgroup_id.is_(None)
        )

        # Query 3: Get courses for the entire study year
        year_courses = self.session.query(Course).filter(
            Course.study_year_id == group.study_year_id,
            Course.group_id.is_(None)
        )

        # Combine all three queries with UNION
        combined_query = subgroup_courses.union(group_courses).union(year_courses)

        # Execute the query and return the results
        return combined_query
