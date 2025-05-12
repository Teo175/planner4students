
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
from server.models.specialization import Specialization
from server.models.study_year import StudyYear
from server.repositories.course_repository import CourseRepository
from server.repositories.group_repository import GroupRepository
from server.repositories.professor_repository import ProfessorRepository
from server.repositories.room_repository import RoomRepository
from server.repositories.specialization_repository import SpecializationRepository
from server.repositories.study_year_repository import StudyYearRepository
from server.repositories.subgroup_repository import SubgroupRepository
from server.scraper.course_scrapper import CourseScrapper


class ProfessorsScrapper:
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
        self.courseScraper = CourseScrapper(session)
        self.url = "https://www.cs.ubbcluj.ro/files/orar/2024-2/tabelar/index.html"

    def scrape_specializations(self):
        response = requests.get(self.url)
        response.encoding = 'utf-8'
        soup = BeautifulSoup(response.text, 'html.parser')

        table = soup.find("table")

        rows = table.find_all("tr")

        for row in rows[1:-1]:
            cols = row.find_all("td")
            if not cols:
                continue

            specialization_text = cols[0].text.strip()
            specialization= self.parse_specialization(specialization_text)
            for link in cols[1:]:
                study_year_text = link.text.strip() if link and link.text else ""
                if study_year_text:
                    study_year = self.parse_year(study_year_text)
                    study_year_item = self.studyYearRepository.get_study_year(study_year,specialization)
                    if study_year_item is None:
                        self.logger.info(f"Adding new study year: {study_year}")
                        study_year_item = self.studyYearRepository.add_study_year(study_year,specialization)
                    else:
                        self.logger.info(f"Study year {study_year} already exists")

                    href = link.find("a")["href"] if link.find("a") else None
                    if href:
                        #scrape the course program
                        url = f"https://www.cs.ubbcluj.ro/files/orar/2024-2/tabelar/{href}"
                        self.logger.info(f"Specializare: '{specialization}' si anul {study_year_text}")
                        self.courseScraper.scrape_tables(url,study_year_item)


    def parse_specialization(self, specialization_name):
        """
        Parse a specialization string to extract the program and language.
        Then checks if it exists in the repository and adds it if it doesn't.

        Args:
            specialization_name (str): The full specialization name, which could be in formats like:
                - "Matematica - linia de studiu romana"
                - "Ingineria informatiei in limba engleza"

        Returns:
            Specialization: The specialization object from the repository
        """
        valid_languages = ["romana", "engleza", "maghiara", "germana"]

        # Handle cases with a dash
        if " - " in specialization_name:
            parts = specialization_name.split(' - ')
            specialization = parts[0].strip()
            language_part = parts[1].strip()
            language = language_part.split()[-1].lower()

            # Validate language
            if language not in valid_languages:
                language = None

        # Handle cases with "in limba"
        elif " in limba " in specialization_name:
            parts = specialization_name.split(' in limba ')
            specialization = parts[0].strip()
            language = parts[1].strip().lower()

            # Validate language
            if language not in valid_languages:
                language = None

        # Handle other formats or return as is if no pattern matches
        else:
            words = specialization_name.split()
            if words and words[-1].lower() in valid_languages:
                language = words[-1].lower()
                specialization = " ".join(words[:-1]).strip()
            else:
                specialization = specialization_name
                language = None

        # Check if specialization exists in repository and add if needed
        specialization_item = self.specializationRepository.get_specialization_by_name_and_language(specialization,
                                                                                                    language)
        if specialization_item is None:
            self.logger.info(f"Adding new specialization '{specialization}' with language '{language}'")
            specialization_item = self.specializationRepository.add_specialization(specialization, language)
        else:
            self.logger.info(f"Already exists specialization '{specialization}' with language '{language}'")
        return specialization_item

    def parse_year(self, year_text):
        """
        Parse the study year text to extract the numeric year value.

        Args:
            year_text (str): The study year text (e.g., "Anul 1", "Anul 3", etc.)

        Returns:
            int: The numeric year value or None if no numeric value is found
        """
        # Import regular expressions
        import re

        # Use regex to find all digits in the text
        digits = re.findall(r'\d+', year_text)

        # If digits were found, convert the first one to int and return
        if digits:
            return int(digits[0])

        # If no digits were found, return None
        return None