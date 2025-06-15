from enum import Enum

class AcademicScheduleTableColumns(Enum):
    ID = "id"
    START_DATE = "start_date"
    END_DATE = "end_date"
    PERIOD_TYPE = "period_type"
    TARGET = "target"
    SEMESTER = "semester"

class AcademicHolidayTableColumns(Enum):
    ID = "id"
    HOLIDAY_DATE = "holiday_date"
    NAME = "name"

class SpecializationTableColumns(Enum):
    SPECIALIZATION_ID = "specialization_id"
    NAME = "name"
    LANGUAGE = "language"

class StudyYearTableColumns(Enum):
    STUDY_YEAR_ID = "study_year_id"
    YEAR = "year"
    SPECIALIZATION_ID = "specialization_id"

class GroupTableColumns(Enum):
    GROUP_ID = "group_id"
    GROUP_NUMBER = "group_number"
    STUDY_YEAR_ID = "study_year_id"

class SubgroupTableColumns(Enum):
    SUBGROUP_ID = "subgroup_id"
    SUBGROUP_NUMBER = "subgroup_number"
    GROUP_ID = "group_id"

class StudentTableColumns(Enum):
    STUDENT_ID = "student_id"
    FIRST_NAME = "first_name"
    LAST_NAME = "last_name"
    EMAIL = "email"
    PASSWORD = "password"
    SUBGROUP_ID = "subgroup_id"

class ProfessorTableColumns(Enum):
    professor_id = "professor_id"
    FIRST_NAME = "first_name"
    LAST_NAME = "last_name"
    TITLE = "title"
    EMAIL = "email"
    WEB_PAGE = "web_page"
    DEPARTMENT = "department"
    IMAGE_URL = "image_url"
    DETAILS = "details"

class DomainTableColumns(Enum):
    NAME = "name"
class RoomTableColumns(Enum):
    ROOM_ID = "room_id"
    NAME = "name"
    LOCATION = "location"
    GOOGLE_MAPS_URL = "google_maps_url"

class CourseTableColumns(Enum):
    COURSE_ID = "course_id"
    NAME = "name"
    PROFESSOR_ID = "professor_id"
    COURSE_TYPE = "course_type" #curs,lab,seminar
    STUDY_YEAR_ID = "study_year_id" #daca e curs mereu va fi study_year_id
    GROUP_ID = "group_id"
    SUBGROUP_ID = "subgroup_id"
    DAY = "day"
    START_TIME = "start_time"
    END_TIME = "end_time"
    ROOM_ID = "room_id"
    FREQUENCY = "frequency"

class StudentCoursesTableColumns(Enum):
    ID ="id"
    STUDENT_ID = "student_id"
    COURSE_ID = "course_id"

class ProfessorDomainsTableColumns(Enum):
    ID ="id"
    PROFESSOR_ID = "professor_id"
    DOMAIN_ID = "domain_id"