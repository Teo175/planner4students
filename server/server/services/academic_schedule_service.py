from server.repositories.academic_holiday_repository import AcademicHolidayRepository
from server.repositories.academic_schedule_repository import AcademicScheduleRepository


class AcademicScheduleService:
    def __init__(self, session):
        self.academicScheduleRepository = AcademicScheduleRepository(session)
        self.academicHolidayRepository = AcademicHolidayRepository(session)

    def get_semester_starts(self):
        return self.academicScheduleRepository.get_semester_start_dates()

    def get_holidays(self):
        return self.academicHolidayRepository.get_all_holidays()

    def get_study_periods(self):
        return self.academicScheduleRepository.get_schedule_structure()