import React, { useRef, useEffect } from 'react';
import {
  fullDayNames,
  getEventsForDate,
  arrangeOverlappingEvents,
  formatHour,
  isHoliday
} from '../../utils/dateUtils';
import EventItem from '../../utils/eventItem';
import './dayView.scss';
import { DayViewProps, EventData, Holiday } from '../../../../common';

const DayView: React.FC<DayViewProps> = ({ currentDate, courses, academicSchedule }) => {
  const hours: number[] = Array.from({ length: 24 }, (_, i) => i);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (scrollRef.current) {
      const hourHeight: number = 60;
      const targetHour: number = 8;
      scrollRef.current.scrollTop = targetHour * hourHeight;
    }
  }, [currentDate]);

  const holidayInfo: Holiday | null = academicSchedule?.holidays
    ? isHoliday(currentDate, academicSchedule.holidays)
    : null;

  let dayEvents: EventData[] = getEventsForDate(currentDate, courses, academicSchedule);
  dayEvents = arrangeOverlappingEvents(dayEvents);

  return (
    <div className="day-view">
      <div className="day-header">
        <div className={`day-number ${currentDate.toDateString() === new Date().toDateString() ? 'today' : ''}`}>
          {currentDate.getDate()}
        </div>
        <div className="day-name">
          {fullDayNames[currentDate.getDay() === 0 ? 6 : currentDate.getDay() - 1]}
        </div>
        {holidayInfo && (
          <div className="holiday-name">
            {holidayInfo.name}
          </div>
        )}
      </div>

      <div ref={scrollRef} className="day-body">
        {hours.map((hour: number) => (
          <div key={hour} className="hour-row">
            <div className="time-cell">
              {formatHour(hour)}
            </div>

            <div className="events-container">
              {dayEvents
                .filter((event: EventData) => event.startHour === hour)
                .map((event: EventData) => {
                  const startMinute: number = event.startMinute || 0;
                  const endHour: number = event.endHour || 0;
                  const endMinute: number = event.endMinute || 0;

                  const columnCount: number = event.columnCount ?? 1;
                  const column: number = event.column ?? 0;

                  const durationMinutes: number = (endHour - hour) * 60 + (endMinute - startMinute);

                  return (
                    <div
                      key={event.id}
                      className="event-wrapper"
                    >
                      <div className="event-content">
                        <EventItem 
                          event={event} 
                          topPosition={0}
                          duration={durationMinutes / 60}
                          columnCount={columnCount}
                          column={column}
                          isDayView={true} 
                        />
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DayView;