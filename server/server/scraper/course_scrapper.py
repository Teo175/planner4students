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
    """
    Clasa pentru extragerea si procesarea datelor de cursuri din paginile web.
    Gestioneaza parsarea tabelelor cu orare si salvarea in baza de date.
    """
    logger = setup_logger(__name__)

    def __init__(self, session):
        """
        Initializeaza obiectul CourseScrapper cu sesiunea bazei de date.
        Argumente:
            session: Sesiunea SQLAlchemy pentru operatiuni cu baza de date
        """
        self.session = session
        self.professorRepository = ProfessorRepository(session)
        self.specializationRepository = SpecializationRepository(session)
        self.studyYearRepository = StudyYearRepository(session)
        self.groupRepository = GroupRepository(session)
        self.subgroupRepository = SubgroupRepository(session)
        self.roomRepository = RoomRepository(session)
        self.courseRepository = CourseRepository(session)

    def scrape_tables(self, url, study_year):
        """
        Extrage datele din toate tabelele de pe o pagina web si proceseaza continutul fiecarui element.
        Parseza tabelele cu orare si salveaza cursurile in baza de date.

        Argumente:
            url: URL-ul paginii web de unde se extrag datele
            study_year: Obiectul StudyYear pentru care se proceseaza cursurile
        """
        try:
            response = requests.get(url, timeout=30)
            response.encoding = 'utf-8'
            response.raise_for_status()
        except requests.RequestException as e:
            error_msg = f"Eroare la accesarea URL-ului {url}: {e}"
            self.logger.error(error_msg)
            raise Exception(error_msg) from e

        soup = BeautifulSoup(response.text, 'html.parser')
        tables = soup.find_all('table')
        if not tables:
            self.logger.warning(f"Nu s-au gasit tabele in pagina {url}. Se omite procesarea acestei pagini.")
            return
        group_headers = soup.find_all('h1', string=re.compile(r'Grupa \d+'))
        if not group_headers:
            error_msg = f"Nu s-au gasit headerele de grupa in pagina {url}. Structura paginii s-a schimbat?"
            self.logger.error(error_msg)
            raise Exception(error_msg)

        try:
            for group_header in group_headers:
                group_name = group_header.text.strip()

                group_match = re.search(r'Grupa (\d+)', group_name)
                if not group_match:
                    error_msg = f"Nu s-a putut extrage numarul grupei din '{group_name}'"
                    self.logger.error(error_msg)
                    raise Exception(error_msg)

                group_number = group_match.group(1)

                try:
                    group = self.parse_group(group_number, study_year)
                    if not group:
                        self.logger.warning(f"Nu s-a putut parsa grupa {group_number}, se omite.")
                        continue
                except Exception as e:
                    error_msg = f"Eroare la parsarea grupei {group_number}: {e}"
                    self.logger.error(error_msg)
                    raise Exception(error_msg) from e

                table = group_header.find_next('table')
                if not table:
                    self.logger.warning(f"Nu s-a gasit tabelul pentru grupa {group_number}, se omite.")
                    continue

                header_row = table.find('tr')
                if not header_row:
                    self.logger.warning(f"Nu s-a gasit randul de header pentru grupa {group_number}, se omite.")
                    continue

                headers = []
                for th in header_row.find_all('th'):
                    headers.append(th.text.strip())

                if not headers:
                    self.logger.warning(f"Nu s-au gasit headerele pentru grupa {group_number}, se omite.")
                    continue

                for row_idx, row in enumerate(table.find_all('tr')[1:], 1):
                    cells = row.find_all('td')
                    if not cells:
                        continue

                    try:
                        row_dict = {headers[i]: cells[i].text.strip() for i in range(len(cells)) if i < len(headers)}

                        professor = self.parse_professor_name(row_dict.get("Cadrul didactic"))
                        if not professor:
                            self.logger.warning(
                                f"Nu s-a putut parsa profesorul pentru randul {row_idx} din grupa {group_number}, se omite.")
                            continue

                        room = self.parse_room(row_dict.get("Sala"))
                        if not room:
                            self.logger.warning(
                                f"Nu s-a putut parsa sala pentru randul {row_idx} din grupa {group_number}, se omite.")
                            continue

                        start_time, end_time = self.parse_hours(row_dict.get("Orele"))
                        if not start_time or not end_time:
                            self.logger.warning(
                                f"Nu s-au putut parsa orele pentru randul {row_idx} din grupa {group_number}, se omite.")
                            continue

                        course = Course(
                            name=row_dict.get("Disciplina"),
                            professor_id=professor.professor_id,
                            course_type=row_dict.get("Tipul"),
                            study_year_id=study_year.study_year_id,
                            group_id=None if row_dict.get('Tipul') == 'Curs' else group.group_id,
                            subgroup_id=None if row_dict.get('Tipul') == 'Curs' else self.parse_subgroup(
                                row_dict.get("Formatia"), group),
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
                            self.logger.info(f"Curs adaugat: {course.name}")
                        else:
                            self.logger.info(f"Cursul exista deja: {existing_course.name}")

                    except Exception as e:
                        error_msg = f"Eroare la procesarea randului {row_idx} din grupa {group_number}: {e}"
                        self.logger.error(error_msg)
                        raise Exception(error_msg) from e

        except Exception as e:
            if "raise Exception(error_msg) from e" in str(e):
                raise
            error_msg = f"Eroare neasteptata la procesarea grupelor din {url}: {e}"
            self.logger.error(error_msg)
            raise Exception(error_msg) from e
    def parse_hours(self, hours: str) -> Tuple[time, time] | Tuple[None, None]:
        """
        Parseaza un string cu intervalul orar si returneaza obiectele time pentru inceput si sfarsit.

        Argumente:
            hours: String de forma '8-10' sau '12-14'

        Returneaza:
            Tuple cu (start_time, end_time) de tip datetime.time sau (None, None) daca parsarea esueaza
        """
        try:
            if not hours or "-" not in hours:
                self.logger.warning(f"Ore invalide: '{hours}'")
                return None, None

            start_str, end_str = hours.split('-')
            start_time = time(hour=int(start_str.strip()))
            end_time = time(hour=int(end_str.strip()))
            return start_time, end_time

        except Exception as e:
            self.logger.error(f"Eroare la parsarea orelor '{hours}': {str(e)}")
            return None, None
    def parse_room(self, sala: str) -> Room | None:
        """
        Parseaza numele unei sali si returneaza obiectul Room corespunzator.
        Daca sala nu exista in baza de date, o creeaza.

        Argumente:
            sala: Numele salii de procesat

        Returneaza:
            Obiectul Room sau None daca numele este invalid
        """
        try:
            if not sala:
                self.logger.warning("Numele salii este gol. Se returneaza None.")
                return None

            room = self.roomRepository.get_room_by_name(sala)

            if room:
                self.logger.debug(f"Sala gasita: {room.name}")
                return room

            self.logger.info(f"Sala '{sala}' nu exista. Se adauga in baza de date.")
            new_room = self.roomRepository.add_room(sala)
            return new_room

        except Exception as e:
            error_msg = f"Eroare la parsarea/salvarea salii '{sala}': {e}"
            self.logger.error(error_msg)
            raise Exception(error_msg) from e
    def parse_frequency(self, freq: str) -> int:
        """
        Parseaza frecventa unui curs din string si returneaza numarul saptamanii.

        Argumente:
            freq: String de forma 'sapt. 1' sau 'sapt. X'

        Returneaza:
            Numarul saptamanii sau 0 ca valoare implicita daca stringul este invalid
        """
        try:
            if not freq:
                self.logger.debug("String-ul de frecventa este gol. Se returneaza valoarea implicita: 0.")
                return 0

            match = re.search(r'sapt\.?\s*(\d+)', freq.lower())
            if match:
                week_number = int(match.group(1))
                self.logger.debug(f"Numarul saptamanii extras: {week_number} din string-ul: '{freq}'")
                return week_number
            else:
                self.logger.warning(f"Nu s-a putut parsa frecventa din string-ul: '{freq}'. Se returneaza 0 implicit.")
                return 0

        except Exception as e:
            error_msg = f"Eroare la parsarea frecventei '{freq}': {e}"
            self.logger.error(error_msg)
            raise Exception(error_msg) from e
    def parse_subgroup(self, subgroup: str, group: Group):
        """
        Parseaza informatiile despre subgrupa si returneaza ID-ul subgrupei.
        Creeaza subgrupa daca nu exista in baza de date.

        Argumente:
            subgroup: String cu informatiile subgrupei (ex: 'Grupa/1')
            group: Obiectul Group caruia ii apartine subgrupa

        Returneaza:
            ID-ul subgrupei sau None daca parsarea esueaza
        """
        try:
            if '/' not in subgroup:
                return None

            try:
                subgroup_number = int(subgroup.split('/')[-1])
                self.logger.debug(f"Numarul subgrupei extras: {subgroup_number}")
            except ValueError:
                self.logger.warning(f"Subgrup invalid: {subgroup}")
                return None

            found_subgroup = self.subgroupRepository.get_subgroup(subgroup_number, group)

            if found_subgroup:
                self.logger.info(f"Subgrupa {subgroup_number} exista deja pentru grupa {group.group_number}.")
                return found_subgroup.subgroup_id

            self.logger.info(f"Se adauga subgrupa {subgroup_number} pentru grupa {group.group_number}.")
            return self.subgroupRepository.add_subgroup(subgroup_number, group).subgroup_id

        except Exception as e:
            error_msg = f"Eroare la parsarea/salvarea subgrupei '{subgroup}': {e}"
            self.logger.error(error_msg)
            raise Exception(error_msg) from e
    def parse_group(self, group: str, study_year: StudyYear) -> Group | None:
        """
        Parseaza numarul grupei si returneaza obiectul Group corespunzator.
        Creeaza grupa daca nu exista in baza de date.

        Argumente:
            group: String cu numarul grupei
            study_year: Obiectul StudyYear caruia ii apartine grupa

        Returneaza:
            Obiectul Group sau None daca parsarea esueaza
        """
        try:
            try:
                group_number = int(group)
                self.logger.debug(f"Numarul grupei parsat: {group_number}")
            except ValueError:
                self.logger.error(f"Numarul grupei invalid: '{group}' nu este un numar intreg.")
                return None

            existing_group = self.groupRepository.get_group(group_number, study_year)
            if existing_group:
                self.logger.info(f"Grupa {group_number} exista deja.")
                return existing_group

            self.logger.info(f"Grupa {group_number} nu a fost gasita. Se adauga grupa noua...")
            new_group = self.groupRepository.add_group(group_number, study_year)
            self.logger.info(f"Grupa {group_number} a fost adaugata cu succes.")
            return new_group

        except Exception as e:
            error_msg = f"Eroare la parsarea/salvarea grupei '{group}': {e}"
            self.logger.error(error_msg)
            raise Exception(error_msg) from e
    def parse_professor_name(self, prof_name: str) -> Professor | None:
        """
        Parseaza numele complet al profesorului si returneaza obiectul Professor.
        Extrage titlul, prenumele si numele din stringul complet.
        Creeaza profesorul daca nu exista in baza de date.

        Argumente:
            prof_name: Numele complet al profesorului (ex: "c.d. asociat SUCIU Dan Mircea")

        Returneaza:
            Obiectul Professor sau None daca parsarea esueaza
        """
        try:
            if not prof_name or not prof_name.strip():
                self.logger.warning("Numele profesorului este gol.")
                return None

            self.logger.debug(f"Se parseaza numele profesorului: {prof_name}")
            words = prof_name.strip().split()
            title_parts = []
            name_parts = []

            for i, word in enumerate(words):
                if word.isupper():
                    name_parts = words[i:]
                    break
                else:
                    title_parts.append(word)

            if not name_parts:
                if len(words) >= 2:
                    title_parts = words[:-2]
                    name_parts = words[-2:]
                else:
                    self.logger.warning(f"Nu se poate parsa numele (prea scurt sau ambiguu): {prof_name}")
                    return None

            last_names = [w for w in name_parts if w.isupper()]
            first_names = [w for w in name_parts if not w.isupper()]

            if not last_names and len(name_parts) >= 2:
                *first_names, last_name = name_parts
                last_names = [last_name]

            professor_data = {
                'title': ' '.join(title_parts),
                'first_name': ' '.join(first_names),
                'last_name': ' '.join(last_names),
            }

            self.logger.info(f"Profesor parsat: {professor_data}")

            existing_prof = self.professorRepository.get_professor_by_name(
                first_name=professor_data['first_name'],
                last_name=professor_data['last_name']
            )

            if existing_prof:
                self.logger.info("Profesorul exista deja in baza de date.")
                return existing_prof

            new_prof = self.professorRepository.add_professor(
                first_name=professor_data['first_name'],
                last_name=professor_data['last_name'],
                title=professor_data['title']
            )
            self.logger.info("Profesor nou adaugat in baza de date.")
            return new_prof

        except Exception as e:
            error_msg = f"Eroare la parsarea/salvarea profesorului '{prof_name}': {e}"
            self.logger.error(error_msg)
            raise Exception(error_msg) from e
    def clear_course_table(self):
        """
        Sterge datele din tabelele student_courses si courses in ordinea corecta.
        Gestioneaza constrangerile de cheie externa pentru a evita erorile.
        Foloseste TRUNCATE sau DELETE pentru curatarea completa a tabelelor.
        """
        self.logger.info("Se incepe curatarea tabelelor legate de cursuri...")
        try:
            self.session.execute(text("SET CONSTRAINTS ALL DEFERRED"))

            students_courses_table = "student_courses"
            self.logger.info(f"Se curata tabelul '{students_courses_table}' primul...")
            try:
                self.session.execute(text(f"TRUNCATE TABLE {students_courses_table} CASCADE"))
                self.logger.info(f"Tabelul '{students_courses_table}' a fost golit cu succes.")
            except Exception as e:
                self.logger.warning(
                    f"TRUNCATE a esuat pentru '{students_courses_table}', se revine la DELETE. Eroare: {str(e)}")
                self.session.execute(text(f"DELETE FROM {students_courses_table}"))
                self.logger.info(f"Toate inregistrarile din '{students_courses_table}' au fost sterse folosind DELETE.")

            courses_table = "courses"
            self.logger.info(f"Se curata tabelul '{courses_table}'...")
            try:
                self.session.execute(text(f"TRUNCATE TABLE {courses_table} CASCADE"))
                self.logger.info(f"Tabelul '{courses_table}' a fost golit cu succes.")
            except Exception as e:
                self.logger.warning(f"TRUNCATE a esuat pentru '{courses_table}', se revine la DELETE. Eroare: {str(e)}")
                self.session.execute(text(f"DELETE FROM {courses_table}"))
                self.logger.info(f"Toate inregistrarile din '{courses_table}' au fost sterse folosind DELETE.")

            self.session.execute(text("SET CONSTRAINTS ALL IMMEDIATE"))

            self.session.commit()
            self.logger.info("Toate tabelele legate de cursuri au fost curatate cu succes.")

        except Exception as e:
            self.session.rollback()
            error_msg = f"Esec la curatarea tabelelor legate de cursuri: {str(e)}"
            self.logger.error(error_msg, exc_info=True)
            try:
                self.session.execute(text("SET CONSTRAINTS ALL IMMEDIATE"))
            except Exception as constraint_err:
                self.logger.warning(f"Nu s-au putut reabilita constrangerile: {constraint_err}")
            raise Exception(error_msg) from e




