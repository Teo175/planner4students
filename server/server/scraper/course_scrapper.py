
from typing import Tuple
from datetime import time
import requests
from bs4 import BeautifulSoup
import re

from sqlalchemy import text

from server.common.logger import setup_logger
from server.models.course import Course
from server.models.group import Group
from server.models.professor import Professor
from server.models.room import Room
from server.models.study_year import StudyYear
from server.repositories.course_repository import CourseRepository
from server.repositories.group_repository import GroupRepository
from server.repositories.professor_repository import ProfessorRepository
from server.repositories.room_repository import RoomRepository
from server.repositories.specialization_repository import SpecializationRepository
from server.repositories.study_year_repository import StudyYearRepository
from server.repositories.subgroup_repository import SubgroupRepository


class CourseScrapper:
    logger = setup_logger(__name__)

    def __init__(self, session):
        # Initialize repositories with session
        self.session = session
        self.professorRepository = ProfessorRepository(session)
        self.specializationRepository = SpecializationRepository(session)
        self.studyYearRepository = StudyYearRepository(session)
        self.groupRepository = GroupRepository(session)
        self.subgroupRepository = SubgroupRepository(session)
        self.roomRepository = RoomRepository(session)
        self.courseRepository = CourseRepository(session)

    def scrape_tables(self,url,study_year):
        """Preluare date din toate tabelele și extragerea conținutului fiecărui <td>."""
        response = requests.get(url)
        response.encoding = 'utf-8'
        soup = BeautifulSoup(response.text, 'html.parser')

        group_headers = soup.find_all('h1', string=re.compile(r'Grupa \d+'))
        for group_header in group_headers:
            group_name = group_header.text.strip()
            group_number = re.search(r'Grupa (\d+)', group_name).group(1)
            group = self.parse_group(group_number,study_year)

            table = group_header.find_next('table')
            if not table:
                continue
            header_row = table.find('tr')
            if not header_row:
                continue

            headers = []
            for th in header_row.find_all('th'):
                headers.append(th.text.strip())

            for row_idx, row in enumerate(table.find_all('tr')[1:], 1):
                cells = row.find_all('td')
                row_dict = {headers[i]: cells[i].text.strip() for i in range(len(cells)) if i < len(headers)}
                # Extract and parse each cell
                professor = self.parse_professor_name(row_dict.get("Cadrul didactic"))
                room = self.parse_room(row_dict.get("Sala"))
                start_time,end_time = self.parse_hours(row_dict.get("Orele"))
                course = Course(
                    name=row_dict.get("Disciplina"),
                    professor_id=professor.professor_id,  # Link to the professor
                    course_type=row_dict.get("Tipul"),
                    study_year_id=study_year.study_year_id,
                    group_id=None if row_dict.get('Tipul') == 'Curs' else group.group_id,
                    subgroup_id=None if row_dict.get('Tipul') == 'Curs' else self.parse_subgroup(row_dict.get("Formatia"),group),
                    day=row_dict.get("Ziua"),
                    start_time=start_time,
                    end_time=end_time,
                    room_id=room.room_id,
                    frequency=self.parse_frequency(row_dict.get("Frecventa"))
                )
                existing_course = self.courseRepository.get_course(course.name,
                                                                   course.professor_id,
                                                                   course.course_type,
                                                                   course.study_year_id,
                                                                   course.group_id,
                                                                   course.subgroup_id,
                                                                   course.day,
                                                                   course.start_time,
                                                                   course.end_time,
                                                                   course.room_id,
                                                                   course.frequency)
                if existing_course is None:
                    self.courseRepository.add_course(course)
                    self.logger.info(f"Course added: {course.name}")
                else:
                    self.logger.info(f"Course already exists: {existing_course.name}")

    def parse_hours(self, hours: str) -> Tuple[time, time] | Tuple[None,None]:
        """
        Primește un string de forma '8-10' sau '12-14' și returnează un tuple (start_time, end_time) de tip `datetime.time`.
        """
        try:
            if not hours or "-" not in hours:
                self.logger.warning(f"Ore invalide: '{hours}'")
                return None,None

            start_str, end_str = hours.split('-')
            start_time = time(hour=int(start_str.strip()))
            end_time = time(hour=int(end_str.strip()))
            return start_time, end_time

        except Exception as e:
            self.logger.error(f"Eroare la parsarea orelor '{hours}': {str(e)}")
            return None,None
    def parse_room(self,sala:str) -> Room | None:
        """
            Primește un string cu numele sălii și returnează obiectul Room.
            Dacă sala nu există în baza de date, o creează.
            """
        if not sala:
            self.logger.warning("Numele sălii este gol. Se returnează None.")
            return None

        room = self.roomRepository.get_room(sala)

        if room:
            self.logger.debug(f"Room găsită: {room.name}")
            return room

        self.logger.info(f"Room '{sala}' nu există. Se adaugă în baza de date.")
        new_room = self.roomRepository.add_room(sala)
        return new_room
    def parse_frequency(self,freq:str)-> int:
        """
          Primește un string de forma 'sapt. 1' sau 'sapt. X' și returnează numărul săptămânii.
          Dacă stringul e gol sau invalid, returnează 1 ca default.
          """
        if not freq:
            self.logger.debug("Frequency string is empty. Returning default value: 1.")
            return 0

        match = re.search(r'sapt\.?\s*(\d+)', freq.lower())
        if match:
            week_number = int(match.group(1))
            self.logger.debug(f"Extracted frequency week number: {week_number} from string: '{freq}'")
            return week_number
        else:
            self.logger.warning(f"Could not parse frequency from string: '{freq}'. Returning default 1.")
            return 0
    def parse_subgroup(self,subgroup:str,group:Group):
        if '/' not in subgroup:
            return None

        try:
            subgroup_number = int(subgroup.split('/')[-1])
            self.logger.debug(f"Subgroup number extras: {subgroup_number}")
        except ValueError:
            self.logger.warning(f"Subgrup invalid: {subgroup}")
            return None

        found_subgroup = self.subgroupRepository.get_subgroup(subgroup_number, group)

        if found_subgroup:
            self.logger.info(f"Subgrupul {subgroup_number} deja există pentru grupa {group.group_number}.")
            return found_subgroup.subgroup_id

        self.logger.info(f"Adăugăm subgrupul {subgroup_number} pentru grupa {group.group_number}.")
        return self.subgroupRepository.add_subgroup(subgroup_number, group).subgroup_id
    def parse_group(self,group:str,study_year:StudyYear) -> Group | None:
        try:
            group_number = int(group)
            self.logger.debug(f"Parsed group number: {group_number}")
        except ValueError:
            self.logger.error(f"Invalid group number: '{group}' is not an integer.")
            return None

        existing_group = self.groupRepository.get_group(group_number,study_year)
        if existing_group:
            self.logger.info(f"Group {group_number} already exists.")
            return existing_group

        # Add the group if it doesn't exist
        self.logger.info(f"Group {group_number} not found. Adding new group...")
        new_group = self.groupRepository.add_group(group_number,study_year)
        self.logger.info(f"Group {group_number} added successfully.")
        return new_group

    def parse_professor_name(self, prof_name: str) -> Professor | None:
        """
        Parses professor name from a full string with title, first name, last name.

        Examples:
            "c.d. asociat SUCIU Dan Mircea"
            "Drd. Marin Preda"

        Returns:
            Professor object or None
        """
        self.logger.debug(f"Parsing professor name: {prof_name}")
        words = prof_name.strip().split()
        title_parts = []
        name_parts = []

        # Identify title until the first all-uppercase word (likely last name)
        for i, word in enumerate(words):
            if word.isupper():
                name_parts = words[i:]
                break
            else:
                title_parts.append(word)

        # Handle case with no all-uppercase name parts (e.g., "Drd. Marin Preda")
        if not name_parts:
            if len(words) >= 2:
                title_parts = words[:-2]
                name_parts = words[-2:]
            else:
                self.logger.warning(f"Cannot parse name (too short or ambiguous): {prof_name}")
                return None

        # Extract names
        last_names = [w for w in name_parts if w.isupper()]
        first_names = [w for w in name_parts if not w.isupper()]

        # If still no uppercase last names, assume last word is last name
        if not last_names and len(name_parts) >= 2:
            *first_names, last_name = name_parts
            last_names = [last_name]

        professor_data = {
            'title': ' '.join(title_parts),
            'first_name': ' '.join(first_names),
            'last_name': ' '.join(last_names),
        }

        self.logger.info(f"Parsed professor: {professor_data}")

        # Check if professor exists
        existing_prof = self.professorRepository.get_professor_by_name(
            first_name=professor_data['first_name'],
            last_name=professor_data['last_name'],
            title=professor_data['title']
        )

        if existing_prof:
            self.logger.info("Professor already exists in the database.")
            return existing_prof

        # Add new professor if not exists
        new_prof = self.professorRepository.add_professor(
            first_name=professor_data['first_name'],
            last_name=professor_data['last_name'],
            title=professor_data['title']
        )
        self.logger.info("New professor added to the database.")
        return new_prof

    def clear_course_table(self):
        table_name = "courses"
        self.logger.info(f"Starting to clear table '{table_name}'...")
        try:
            # Temporarily defer all foreign key constraints
            self.session.execute(text("SET CONSTRAINTS ALL DEFERRED"))
            try:
                # Attempt fast TRUNCATE (also resets auto-increment)
                self.session.execute(text(f"TRUNCATE TABLE {table_name} CASCADE"))
                self.logger.info(f"Successfully truncated '{table_name}' table.")
            except Exception as e:
                self.logger.warning(f"TRUNCATE failed for '{table_name}', falling back to DELETE. Error: {str(e)}")
                self.session.execute(text(f"DELETE FROM {table_name}"))
                self.logger.info(f"Deleted all records from '{table_name}' using DELETE.")

            # Re-enable constraint checking
            self.session.execute(text("SET CONSTRAINTS ALL IMMEDIATE"))

            # Commit changes
            self.session.commit()
            self.logger.info(f"Table '{table_name}' cleared successfully.")
        except Exception as e:
            self.session.rollback()
            self.logger.error(f"Failed to clear table '{table_name}': {str(e)}", exc_info=True)
            # Attempt to re-enable constraints if something went wrong
            try:
                self.session.execute(text("SET CONSTRAINTS ALL IMMEDIATE"))
            except Exception as constraint_err:
                self.logger.warning(f"Could not re-enable constraints: {constraint_err}")
