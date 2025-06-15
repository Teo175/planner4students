import requests
from bs4 import BeautifulSoup
from server.common.logger import setup_logger
from server.repositories.course_repository import CourseRepository
from server.repositories.group_repository import GroupRepository
from server.repositories.professor_repository import ProfessorRepository
from server.repositories.room_repository import RoomRepository
from server.repositories.specialization_repository import SpecializationRepository
from server.repositories.study_year_repository import StudyYearRepository
from server.repositories.subgroup_repository import SubgroupRepository
from server.scraper.course_scrapper import CourseScrapper


class SpecializationsScrapper:
    """
    Clasa pentru extragerea si procesarea datelor despre specializari din paginile web.
    Gestioneaza parsarea tabelelor cu specializari, ani de studiu si extragerea cursurilor.
    """
    logger = setup_logger(__name__)

    def __init__(self, session):
        """
        Initializeaza obiectul SpecializationsScrapper cu sesiunea bazei de date.

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
        self.courseScraper = CourseScrapper(session)
        self.url = "https://www.cs.ubbcluj.ro/files/orar/2024-2/tabelar/index.html"

    def scrape_specializations(self):
        """
        Extrage specializarile din tabelul principal si proceseaza anii de studiu.
        Pentru fiecare specializare si an de studiu gasit, extrage cursurile corespunzatoare.
        """
        try:
            response = requests.get(self.url, timeout=30)
            response.encoding = 'utf-8'
            response.raise_for_status()
        except requests.RequestException as e:
            error_msg = f"Eroare la accesarea URL-ului {self.url}: {e}"
            self.logger.error(error_msg)
            raise Exception(error_msg) from e

        soup = BeautifulSoup(response.text, 'html.parser')

        table = soup.find("table")
        if not table:
            error_msg = "Nu s-a gasit tabelul cu specializarile! Structura paginii s-a schimbat?"
            self.logger.error(error_msg)
            raise Exception(error_msg)

        rows = table.find_all("tr")
        if len(rows) < 2:
            error_msg = f"Tabelul are prea putine randuri ({len(rows)}). Structura paginii s-a schimbat?"
            self.logger.error(error_msg)
            raise Exception(error_msg)

        try:
            for row in rows[1:-1]:
                cols = row.find_all("td")
                if not cols:
                    continue

                specialization_text = cols[0].text.strip()
                if not specialization_text:
                    self.logger.warning("Specializare goala gasita, se omite.")
                    continue

                try:
                    specialization = self.parse_specialization(specialization_text)
                except Exception as e:
                    error_msg = f"Eroare la parsarea specializarii '{specialization_text}': {e}"
                    self.logger.error(error_msg)
                    raise Exception(error_msg) from e

                for link in cols[1:]:
                    study_year_text = link.text.strip() if link and link.text else ""
                    if study_year_text:
                        try:
                            study_year = self.parse_year(study_year_text)
                            if study_year is None:
                                self.logger.warning(
                                    f"Nu s-a putut parsa anul de studiu din '{study_year_text}', se omite.")
                                continue

                            study_year_item = self.studyYearRepository.get_study_year(study_year, specialization)
                            if study_year_item is None:
                                self.logger.info(f"Se adauga anul de studiu nou: {study_year}")
                                study_year_item = self.studyYearRepository.add_study_year(study_year, specialization)
                            else:
                                self.logger.info(f"Anul de studiu {study_year} exista deja")

                            href = link.find("a")["href"] if link.find("a") else None
                            if href:
                                url = f"https://www.cs.ubbcluj.ro/files/orar/2024-2/tabelar/{href}"
                                self.logger.info(f"Specializare: '{specialization}' si anul {study_year_text}")

                                try:
                                    self.courseScraper.scrape_tables(url, study_year_item)
                                except Exception as e:
                                    error_msg = f"Eroare la extragerea cursurilor pentru '{specialization}' anul {study_year}: {e}"
                                    self.logger.error(error_msg)
                                    raise Exception(error_msg) from e

                        except Exception as e:
                            if "raise Exception(error_msg) from e" in str(e):
                                raise
                            error_msg = f"Eroare la procesarea anului de studiu '{study_year_text}' pentru specializarea '{specialization_text}': {e}"
                            self.logger.error(error_msg)
                            raise Exception(error_msg) from e

        except Exception as e:
            if "raise Exception(error_msg) from e" in str(e):
                raise
            error_msg = f"Eroare neasteptata la procesarea randurilor din tabel: {e}"
            self.logger.error(error_msg)
            raise Exception(error_msg) from e

    def parse_specialization(self, specialization_name):
        """
        Parseaza un string de specializare pentru a extrage programul si limba.
        Verifica daca exista in repository si o adauga daca nu exista.

        Argumente:
            specialization_name: Numele complet al specializarii care poate fi in formate ca:
                - "Matematica - linia de studiu romana"
                - "Ingineria informatiei in limba engleza"

        Returneaza:
            Obiectul Specialization din repository
        """
        try:
            valid_languages = ["romana", "engleza", "maghiara", "germana"]

            if " - " in specialization_name:
                parts = specialization_name.split(' - ')
                specialization = parts[0].strip()
                language_part = parts[1].strip()
                language = language_part.split()[-1].lower()

                if language not in valid_languages:
                    language = None

            elif " in limba " in specialization_name:
                parts = specialization_name.split(' in limba ')
                specialization = parts[0].strip()
                language = parts[1].strip().lower()

                if language not in valid_languages:
                    language = None

            else:
                words = specialization_name.split()
                if words and words[-1].lower() in valid_languages:
                    language = words[-1].lower()
                    specialization = " ".join(words[:-1]).strip()
                else:
                    specialization = specialization_name
                    language = None

            try:
                specialization_item = self.specializationRepository.get_specialization_by_name_and_language(
                    specialization, language)
                if specialization_item is None:
                    self.logger.info(f"Se adauga specializarea noua '{specialization}' cu limba '{language}'")
                    specialization_item = self.specializationRepository.add_specialization(specialization, language)
                else:
                    self.logger.info(f"Exista deja specializarea '{specialization}' cu limba '{language}'")

                return specialization_item

            except Exception as e:
                error_msg = f"Eroare la accesarea/salvarea specializarii in repository: {e}"
                self.logger.error(error_msg)
                raise Exception(error_msg) from e

        except Exception as e:
            if "raise Exception(error_msg) from e" in str(e):
                raise
            error_msg = f"Eroare neasteptata la parsarea specializarii '{specialization_name}': {e}"
            self.logger.error(error_msg)
            raise Exception(error_msg) from e

    def parse_year(self, year_text):
        """
        Parseaza textul anului de studiu pentru a extrage valoarea numerica.

        Argumente:
            year_text: Textul anului de studiu (ex: "Anul 1", "Anul 3", etc.)

        Returneaza:
            Valoarea numerica a anului sau None daca nu se gaseste o valoare numerica
        """
        try:
            import re

            digits = re.findall(r'\d+', year_text)

            if digits:
                return int(digits[0])

            self.logger.warning(f"Nu s-au gasit cifre in textul anului de studiu: '{year_text}'")
            return None

        except Exception as e:
            error_msg = f"Eroare la parsarea anului de studiu '{year_text}': {e}"
            self.logger.error(error_msg)
            raise Exception(error_msg) from e