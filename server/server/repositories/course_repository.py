from typing import Iterable

from sqlalchemy import Time, or_, and_
from sqlalchemy.orm import joinedload

from server.models.course import Course
from server.models.group import Group
from server.models.subgroup import Subgroup


class CourseRepository:
    def __init__(self, sess):
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


        group_courses = self.session.query(Course).filter(
            Course.group_id == subgroup.group_id,
            Course.subgroup_id.is_(None)
        )

        year_courses = self.session.query(Course).filter(
            Course.study_year_id == group.study_year_id,
            Course.group_id.is_(None)
        )

        combined_query = subgroup_courses.union(group_courses).union(year_courses)

        return combined_query.all()

    def search_courses_by_name_and_type(self, study_year_id, search_term: str = '', course_type: str = '') -> list[
        Course]:

        query = self.session.query(Course)


        if course_type:
            query = query.filter(Course.course_type == course_type)

        if search_term:
            query = query.filter(Course.name == search_term)


        query = query.filter((Course.study_year_id == study_year_id) | (Course.study_year_id == None))

        all_courses = query.all()
        unique_courses_dict = {}

        for course in all_courses:

            unique_key = (
                repr(course.name),
                repr(course.course_type),
                repr(course.day),
                repr(course.start_time),
                repr(course.end_time),
                repr(course.professor_id),
                repr(course.room_id)
            )


            if unique_key in unique_courses_dict:

                existing_course = unique_courses_dict[unique_key]

                if course.study_year_id == study_year_id and existing_course.study_year_id != study_year_id:
                    unique_courses_dict[unique_key] = course

            else:
                unique_courses_dict[unique_key] = course

        unique_courses = list(unique_courses_dict.values())

        return unique_courses

    def search_unique_course_names(self, study_year_id) -> list[str]:

        query = self.session.query(Course.name.distinct()).filter(
            (Course.study_year_id == study_year_id) | (Course.study_year_id == None)
        )
        results = [row[0] for row in query.all()]
        return results