import threading
from datetime import date

from flask import Flask
from flask_cors import CORS
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from server.common.logger import setup_logger
from server.models.academic_holiday import AcademicHoliday
from server.models.academic_schedule import AcademicSchedule
from server.models.course import Course
from server.models.group import Group
from server.models.professor import Professor
from server.models.room import Room
from server.models.specialization import Specialization
from server.models.study_year import StudyYear
from server.models.subgroup import Subgroup
from server.routes.course_routes import register_routes_course
from server.routes.group_routes import register_routes_group
from server.routes.schedule_routes import register_routes_schedule
from server.routes.specialization_routes import register_routes_specialization
from server.routes.student_routes import register_routes_student

# def create_app():
#     logger = setup_logger(__name__)
#     logger.info("Starting Flask application setup...")
#
#     app = Flask(__name__)
#     CORS(app)
#
#     engine = create_engine("postgresql://postgres:dinozaur123@localhost:5432/planner4students")
#     Session = sessionmaker(bind=engine)
#     user_session = Session()
#     scrapper_service = Scrapper(user_session)
#
#     scrapper_service.scrape_tables()
#
# #    register_routes_student(app, user_session)
#
#     return app

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from server.routes.study_year_routes import register_routes_study_year
from server.routes.subgroup_routes import register_routes_subgroup
from server.scraper.course_scrapper import CourseScrapper
from server.scraper.specializations_scrapper import SpecializationsScrapper
from server.scraper.structure_of_schedule_scrapper import StructureOfScheduleScrapper
from server.services.academic_schedule_service import AcademicScheduleService


def update_db(session):
    logger = setup_logger(__name__)
    academic_schedule_service = AcademicScheduleService(session)
    semester_starts = academic_schedule_service.get_semester_starts()
    semester_1 = semester_starts.get(1)
    semester_2 = semester_starts.get(2)
    today = date.today()

    # Verifică dacă data curentă coincide cu începutul unuia dintre semestre
    if (semester_1 and today == semester_1) or (semester_2 and today == semester_2):
        # Dacă da, repopulează baza de date
        repopulate_structure_of_year_db(session)
        logger.info(f"Baza de date a fost actualizată deoarece astăzi ({today}) este începutul unui semestru.")
    else:
        logger.info(f"Nu este necesară actualizarea bazei de date astăzi ({today}).")

def repopulate_structure_of_year_db(session):
        '''
        Aceasta functie se va apela pentru actualizarea intregii bd, structura-an scolar,ore,cursuri in functie de perioada de an.
        In prima zi din sem1 se apeleaza si in prima zi din sem2
        '''
        logger = setup_logger(__name__)

        # Salvează un snapshot al datelor existente pentru rollback posibil
        try:
            # Începe o tranzacție explicită
            transaction = session.begin_nested()

            logger.info('Starting database repopulation...')

            # Șterge datele în ordinea corectă pentru a respecta constrângerile de integritate
            session.query(Course).delete()
            session.query(Subgroup).delete()
            session.query(Group).delete()
            session.query(StudyYear).delete()
            session.query(Specialization).delete()
            session.query(Professor).delete()
            session.query(Room).delete()
            session.query(AcademicHoliday).delete()
            session.query(AcademicSchedule).delete()

            logger.info('Database cleared successfully, starting data extraction...')

            # Extrage și încarcă datele noi
            try:
                # Inițializează și execută scrapere-le
                structure_of_year_scrapper = StructureOfScheduleScrapper(session)
                structure_of_year_scrapper.scrape_schedule()

                schedule_scrapper = SpecializationsScrapper(session)
                schedule_scrapper.scrape_specializations()

                # Dacă ajungem aici, totul a funcționat - commit tranzacția
                transaction.commit()
                logger.info('Database repopulation completed successfully!')

            except Exception as scraping_error:
                # Rollback la savepoint-ul creat de begin_nested()
                transaction.rollback()
                logger.error(f'Error during data scraping: {str(scraping_error)}. Rolling back to previous state.')
                # Re-raise excepția pentru a fi tratată de nivelul superior
                raise scraping_error

        except Exception as outer_error:
            # Asigură-te că orice excepție din afara blocului tranzacțional este tratată
            session.rollback()  # Rollback complet al sesiunii
            logger.critical(
                f'Critical error during database repopulation: {str(outer_error)}. Database rolled back to original state.')
            raise outer_error

        finally:
            # Curăță orice resurse deschise
            logger.info('Cleanup complete.')

def create_app():
    logger = setup_logger(__name__)
    logger.info("Starting Flask application setup...")
    app = Flask(__name__)
    CORS(app)

    engine = create_engine("postgresql://postgres:dinozaur123@localhost:5432/planner4students")
    Session = sessionmaker(bind=engine)

    # Crează o singură sesiune pentru update_db
    scraper_session = Session()
    update_db(scraper_session)
    scraper_session.close()  # Închide sesiunea după utilizare

    # Creează un scoped_session pentru a partaja aceeași sesiune între rute
    from sqlalchemy.orm import scoped_session
    session = scoped_session(Session)
    register_routes_student(app,session)
    register_routes_specialization(app,session)
    register_routes_study_year(app,session)
    register_routes_group(app,session)
    register_routes_subgroup(app,session)
    register_routes_course(app,session)
    register_routes_schedule(app,session)
    return app