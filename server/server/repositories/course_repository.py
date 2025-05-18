from typing import Iterable

from sqlalchemy import Time, or_, and_
from sqlalchemy.orm import joinedload

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

    def search_courses_by_name_and_type(self, study_year_id, search_term: str = '', course_type: str = '') -> list[
        Course]:
        """
        Returnează cursurile care au tipul specificat și numele exact,
        precum și study_year_id specific sau fără nicio restricție de study_year_id.
        Elimină duplicatele și dă prioritate cursurilor cu study_year_id specificat.

        Args:
            study_year_id: ID-ul anului de studiu pentru care se caută cursurile
            search_term: Numele exact al cursului
            course_type: Tipul cursului exact (Curs, Seminar, Laborator)

        Returns:
            Lista de cursuri unice care îndeplinesc criteriile
        """
        query = self.session.query(Course)

        # Adăugăm condițiile de filtrare
        if course_type:
            query = query.filter(Course.course_type == course_type)

        if search_term:
            query = query.filter(Course.name == search_term)

        # Filtrăm doar cursurile pentru study_year_id specificat sau cursurile generale (fără study_year_id)
        query = query.filter((Course.study_year_id == study_year_id) | (Course.study_year_id == None))

        # Obținem toate cursurile care îndeplinesc criteriile
        all_courses = query.all()
        # Dicționar pentru a ține evidența cursurilor unice
        # Cheia este tuplul de unicitate, valoarea este cursul însuși
        unique_courses_dict = {}

        for course in all_courses:
            # Creăm o cheie unică bazată pe criteriile de duplicare
            unique_key = (
                repr(course.name),
                repr(course.course_type),
                repr(course.day),
                repr(course.start_time),
                repr(course.end_time),
                repr(course.professor_id),
                repr(course.room_id)
            )

            # Verificăm dacă această cheie există deja în dicționar
            if unique_key in unique_courses_dict:
                # Dacă există, verificăm dacă noul curs are study_year_id egal cu cel cerut
                existing_course = unique_courses_dict[unique_key]

                # Dacă cursul nou are study_year_id egal cu cel cerut, îl înlocuim pe cel existent
                if course.study_year_id == study_year_id and existing_course.study_year_id != study_year_id:
                    unique_courses_dict[unique_key] = course

                # Altfel păstrăm cursul existent
            else:
                # Dacă cheia nu există, adăugăm cursul
                unique_courses_dict[unique_key] = course

        # Convertim dicționarul înapoi la o listă
        unique_courses = list(unique_courses_dict.values())

        return unique_courses

    def search_unique_course_names(self, study_year_id) -> list[str]:
        """
        Returnează numele unice ale cursurilor pentru un anumit an de studiu.

        Args:
            study_year_id: ID-ul anului de studiu pentru care se caută cursurile

        Returns:
            Lista de nume unice de cursuri pentru anul de studiu specificat
        """
        # Folosim distinct pentru a obține doar valorile unice
        # și filtrăm după study_year_id sau null (pentru cursuri generale)
        query = self.session.query(Course.name.distinct()).filter(
            (Course.study_year_id == study_year_id) | (Course.study_year_id == None)
        )

        # Extrag doar numele din rezultate
        results = [row[0] for row in query.all()]

        # Returnăm lista de nume unice
        return results