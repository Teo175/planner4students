from datetime import date

from server.models.academic_schedule import AcademicSchedule


class AcademicScheduleRepository:
    def __init__(self, sess):
        self.session = sess

    def get_schedule(self,start_date: date,end_date:date,period_type,target,semester) -> AcademicSchedule | None:
        return self.session.query(AcademicSchedule).filter_by(
            start_date=start_date,
            end_date=end_date,
            period_type=period_type,
            target=target,
            semester=semester
        ).first()

    def add_schedule(self, schedule: AcademicSchedule) -> AcademicSchedule:
        self.session.add(schedule)
        self.session.commit()
        return schedule

    def get_semester_start_dates(self) -> dict:

        semester_starts = {}


        semester_1_start = self.session.query(AcademicSchedule.start_date) \
            .filter(AcademicSchedule.semester == 1) \
            .filter(AcademicSchedule.period_type == 'activitate didactică') \
            .order_by(AcademicSchedule.start_date.asc()) \
            .first()

        if semester_1_start:
            semester_starts[1] = semester_1_start[0]

        semester_2_start = self.session.query(AcademicSchedule.start_date) \
            .filter(AcademicSchedule.semester == 2) \
            .filter(AcademicSchedule.period_type == 'activitate didactică') \
            .order_by(AcademicSchedule.start_date.asc()) \
            .first()

        if semester_2_start:
            semester_starts[2] = semester_2_start[0]

        return semester_starts

    def get_schedule_structure(self) -> list[AcademicSchedule]:
        return self.session.query(AcademicSchedule).all()