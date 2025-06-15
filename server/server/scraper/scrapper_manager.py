from contextlib import contextmanager
from datetime import date
from sqlalchemy import text
from server.common.logger import setup_logger
from server.scraper.professors_scrapper import ProfessorsScrapper
from server.scraper.structure_of_schedule_scrapper import StructureOfScheduleScrapper
from server.scraper.specializations_scrapper import SpecializationsScrapper
from server.scraper.room_scraper import RoomScrapper
from server.scraper.course_scrapper import CourseScrapper
from server.services.academic_schedule_service import AcademicScheduleService


class ScrapperManager:
    """
    Clasa principala pentru gestionarea tuturor operatiunilor de scraping si actualizare a bazei de date.
    Coordoneaza toate scrapper-urile si gestioneaza ciclul de actualizare in functie de calendar academic.
    """

    def __init__(self, SessionMaker):
        """
        Initializeaza obiectul ScrapperManager cu factory-ul de sesiuni.

        Argumente:
            SessionMaker: Factory pentru crearea sesiunilor SQLAlchemy
        """
        self.SessionMaker = SessionMaker
        self.logger = setup_logger(__name__)

    @contextmanager
    def get_session(self):
        """
        Context manager pentru gestionarea sesiunilor bazei de date.
        Asigura commit automat la succes si rollback la eroare, cu inchiderea finala a sesiunii.

        Yields:
            Session: Sesiunea SQLAlchemy configurata
        """
        session = self.SessionMaker()
        try:
            yield session
            session.commit()
        except Exception as e:
            session.rollback()
            self.logger.error(f"Eroare de sesiune: {e}")
            raise
        finally:
            session.close()

    def clear_db(self, preserve_students=False):
        """
        Sterge toate datele din baza de date cu optiunea de a pastra studentii.
        Reseteaza subgroup_id la NULL pentru studenti daca sunt pastrati.

        Argumente:
            preserve_students: Daca True, nu sterge studentii si reseteaza subgroup_id

        Returneaza:
            Dict cu status-ul operatiunii (success/error) si mesajul corespunzator
        """
        self.logger.info("Se incepe stergerea completa a bazei de date...")

        tables_to_delete = [
            "academic_holidays",
            "academic_schedule",
            "student_courses",
            "courses",
            "subgroups",
            "groups",
            "study_years",
            "specializations",
            "professor_domains",
            "professors",
            "domains",
            "domains",
            "rooms"
        ]

        try:
            with self.get_session() as session:
                if preserve_students:
                    self.logger.info("Se reseteaza 'subgroup_id' la NULL in tabela 'students'...")
                    try:
                        session.execute(text("UPDATE students SET subgroup_id = NULL"))
                        self.logger.info("subgroup_id a fost resetat cu succes.")
                    except Exception as e:
                        self.logger.error(f"Eroare la resetarea subgroup_id din 'students': {e}")
                        session.rollback()
                        return {"status": "error", "error": f"Reset subgroup_id esuat: {str(e)}"}

                for table in tables_to_delete:
                    try:
                        session.execute(text(f"DELETE FROM {table}"))
                        self.logger.info(f"Datele din tabela '{table}' au fost sterse cu succes.")
                    except Exception as e:
                        self.logger.error(f"Eroare la stergerea tabelei '{table}': {e}")
                        session.rollback()
                        return {"status": "error", "error": f"Esec la stergerea din {table}: {str(e)}"}

                return {"status": "success",
                        "message": "Baza de date a fost stearsa cu succes (fara a sterge studentii)."}

        except Exception as e:
            self.logger.error(f"Eroare la stergerea bazei de date: {e}", exc_info=True)
            return {"status": "error", "error": str(e)}

    def update_db(self):
        """
        Verifica daca este necesara actualizarea bazei de date in functie de calendarul academic.
        Executa actualizare completa la inceputul semestrului 1 sau doar cursuri la semestrul 2.

        Returneaza:
            Dict cu status-ul operatiunii si detaliile actualizarii efectuate
        """
        self.logger.info("Se verifica daca este necesara actualizarea...")

        try:
            with self.get_session() as session:
                academic_schedule_service = AcademicScheduleService(session)
                semester_starts = academic_schedule_service.get_semester_starts()
                semester_1 = semester_starts.get(1)
                semester_2 = semester_starts.get(2)
                today = date.today()
                today = date(2024, 9, 30)

                if semester_1 and today == semester_1:
                    self.logger.info(
                        f"Astazi ({today}) este inceputul semestrului 1. Se incepe actualizarea completa...")
                    return self._full_semester_update(session)

                elif semester_2 and today == semester_2:
                    self.logger.info(
                        f"Astazi ({today}) este inceputul semestrului 2. Se actualizeaza doar cursurile...")
                    return self._courses_only_update(session)

                else:
                    self.logger.info(f"Nu este necesara actualizarea astazi ({today}).")
                    return {"status": "skipped"}

        except Exception as e:
            self.logger.error(f"Eroare la actualizare: {e}")
            return {"status": "error", "error": str(e)}

    def _full_semester_update(self, session):
        """
        Executa actualizarea completa a bazei de date pentru inceputul semestrului 1.
        Include structura anului, sali, specializari, cursuri si profesori.

        Argumente:
            session: Sesiunea bazei de date activa

        Returneaza:
            Dict cu status-ul operatiunii si detaliile actualizarii
        """
        try:
            self.logger.info("Se sterg toate datele existente din baza de date (se pastreaza studentii)...")
            clear_result = self.clear_db(preserve_students=True)
            if clear_result["status"] == "error":
                self.logger.error(f"Eroare la stergerea bazei de date: {clear_result['error']}")
                return {"status": "error", "error": clear_result["error"], "type": "full_update", "semester": 1}

            self.logger.info("Se actualizeaza structura anului universitar...")
            structure_scrapper = StructureOfScheduleScrapper(session)
            structure_scrapper.scrape_schedule()

            self.logger.info("Se actualizeaza profesorii...")
            my_urls = [
                "https://www.cs.ubbcluj.ro/despre-facultate/structura/departamentul-de-matematica/#",
                "https://www.cs.ubbcluj.ro/despre-facultate/structura/departamentul-de-informatica/#",
                "https://www.cs.ubbcluj.ro/departamentul-de-matematica-si-informatica-al-liniei-maghiare/#"
            ]

            professors_scrapper = ProfessorsScrapper(session, my_urls)
            professors_scrapper.scrape_professors()
            self.logger.info("Se actualizeaza salile...")
            room_scrapper = RoomScrapper(session)
            room_scrapper.scrape_and_update_complete()

            self.logger.info("Se actualizeaza specializarile si cursurile...")
            specializations_scrapper = SpecializationsScrapper(session)
            specializations_scrapper.scrape_specializations()



            self.logger.info("Actualizarea completa pentru semestrul 1 a fost finalizata cu succes!")
            return {"status": "updated", "type": "full_update", "semester": 1}

        except Exception as e:
            self.logger.error(f"Eroare la actualizarea completa: {e}")
            return {"status": "error", "error": str(e), "type": "full_update", "semester": 1}

    def _courses_only_update(self, session):
        """
        Executa actualizarea doar a cursurilor pentru inceputul semestrului 2.
        Sterge cursurile existente si le re-extrage din surse.

        Argumente:
            session: Sesiunea bazei de date activa

        Returneaza:
            Dict cu status-ul operatiunii si detaliile actualizarii
        """
        try:
            self.logger.info("Se actualizeaza doar cursurile pentru semestrul 2...")
            CourseScrapper(session).clear_course_table()
            SpecializationsScrapper(session).scrape_specializations()
            self.logger.info("Actualizarea cursurilor pentru semestrul 2 a fost finalizata cu succes!")
            return {"status": "updated", "type": "courses_only", "semester": 2}

        except Exception as e:
            self.logger.error(f"Eroare la actualizarea cursurilor: {e}")
            return {"status": "error", "error": str(e), "type": "courses_only", "semester": 2}