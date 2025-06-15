from flask import Flask
from flask_cors import CORS
from server.common.logger import setup_logger
from server.routes.chatbot_routes import register_routes_chatbot
from server.routes.course_routes import register_routes_course
from server.routes.group_routes import register_routes_group
from server.routes.professors_routes import register_routes_professor
from server.routes.room_routes import register_routes_room
from server.routes.schedule_routes import register_routes_schedule
from server.routes.specialization_routes import register_routes_specialization
from server.routes.student_routes import register_routes_student
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from server.routes.study_year_routes import register_routes_study_year
from server.routes.subgroup_routes import register_routes_subgroup
from server.scraper.room_scraper import RoomScrapper
from server.scraper.scrapper_manager import ScrapperManager
from apscheduler.schedulers.background import BackgroundScheduler
import atexit

class AppManager:
    def __init__(self):
        self.logger = setup_logger(__name__)
        self.scrapper_manager = None
        self.scheduler = None

    def scheduled_update(self):
        """Functia de update programat"""
        self.logger.info("Se executa verificarea programata la 24h...")
        try:
            results = self.scrapper_manager.update_db()
            self.logger.info(f"Rezultatele verificarii programate: {results}")
        except Exception as e:
            self.logger.error(f"Eroare in verificarea programata: {e}")

    def create_app(self):
        self.logger.info("Se porneste aplicatia Flask...")
        app = Flask(__name__)
        CORS(app)

        engine = create_engine("postgresql://postgres:dinozaur123@localhost:5432/planner4students")
        Session = sessionmaker(bind=engine)

        self.scrapper_manager = ScrapperManager(Session)

        # Verificare initiala la pornirea serverului
        update_results = self.scrapper_manager.update_db()
        self.logger.info(f"Rezultatele scrapingului initial: {update_results}")

        # Crearea si pornirea scheduler-ului
        self.scheduler = BackgroundScheduler()
        self.scheduler.add_job(
            func=self.scheduled_update,
            trigger="interval",
            hours=24,
            id='update_db'
        )
        self.scheduler.start()
        self.logger.info("Scheduler-ul pentru actualizari automate a fost pornit (interval: 24h)")

        atexit.register(lambda: self.scheduler.shutdown())

        register_routes_student(app, Session)
        register_routes_specialization(app, Session)
        register_routes_study_year(app, Session)
        register_routes_group(app, Session)
        register_routes_subgroup(app, Session)
        register_routes_course(app, Session)
        register_routes_schedule(app, Session)
        register_routes_room(app, Session)
        register_routes_professor(app,Session)
        register_routes_chatbot(app,Session)
        return app

app_manager = AppManager()

def create_app():
    return app_manager.create_app()