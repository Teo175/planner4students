from server.app import create_app
# server/models/__init__.py
from server.models.base import Base
from server.models.specialization import Specialization
from server.models.study_year import StudyYear
from server.models.group import Group
from server.models.subgroup import Subgroup
from server.models.student import Student
from server.models.professor import Professor
from server.models.room import Room
from server.models.course import Course
from sqlalchemy.orm import configure_mappers


if __name__ == '__main__':
    app = create_app()
    app.run()
