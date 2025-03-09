import threading

from flask import Flask
from flask_cors import CORS
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from server.routes.user_routes import register_routes_user


def create_app():
    app = Flask(__name__)
    CORS(app)

    engine = create_engine("postgresql://postgres:dinozaur123@localhost:5432/planner4students")
    Session = sessionmaker(bind=engine)
    user_session = Session()
    register_routes_user(app, user_session)

    return app
