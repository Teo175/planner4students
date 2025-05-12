from server.models.academic_holiday import AcademicHoliday
from datetime import date

class AcademicHolidayRepository:
    """
    Repository for Professors
    """

    def __init__(self, sess):
        """Constructor for ProfessorRepository
            :param sess: session instance
         """
        self.session = sess

    def get_holiday_by_date_and_name(self, holiday_date: date, name: str) -> AcademicHoliday | None:
        return self.session.query(AcademicHoliday).filter_by(
            holiday_date = holiday_date,
            name = name
        ).first()

    def add_holiday(self, holiday: AcademicHoliday) -> AcademicHoliday:
        self.session.add(holiday)
        self.session.commit()
        return holiday

    def get_all_holidays(self) -> list[AcademicHoliday]:
        return self.session.query(AcademicHoliday).all()