import React, { useState } from 'react';
import { dayNames, getDaysArray, getEventsForDate, isHoliday } from '../../utils/dateUtils';
import { EventData, Holiday, DayInfo, MonthViewProps } from '../../../../common';
import './mothView.scss';
import EventDialog from '../../eventDialog/eventDialog';

const MonthView: React.FC<MonthViewProps> = ({ currentDate, courses, academicSchedule }) => {
  const [dialogOpen, setDialogOpen] = useState<boolean>(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const handleViewMoreClick = (date: Date): void => {
    setSelectedDate(date);
    setDialogOpen(true);
  };

  const daysArray: DayInfo[] = getDaysArray(currentDate, true);
  
  const weeks: DayInfo[][] = [];
  let currentWeek: DayInfo[] = [];
  
  daysArray.forEach((day: DayInfo, index: number) => {
    currentWeek.push(day);
    
    if (currentWeek.length === 7 || index === daysArray.length - 1) {
      weeks.push([...currentWeek]);
      currentWeek = [];
    }
  });

  return (
    <div className="month-view-container">
      <div className="day-headers-container">
        {dayNames.map((day: string, index: number) => (
          <div key={index} className="day-header">
            {day}
          </div>
        ))}
      </div>
      
      <div className="month-grid">
        {weeks.map((week: DayInfo[], weekIndex: number) => (
          <React.Fragment key={`week-${weekIndex}`}>
            {week.map((day: DayInfo, dayIndex: number) => {
              const fixedDate: Date = new Date(day.date);
              fixedDate.setHours(12, 0, 0, 0);
              const holidayInfo: Holiday | null = academicSchedule && academicSchedule.holidays ? 
                isHoliday(fixedDate, academicSchedule.holidays) : null;
              
              let dayEvents: EventData[] = [];
              if (!holidayInfo) {
                dayEvents = getEventsForDate(day.date, courses, academicSchedule).sort((a: EventData, b: EventData) => {
                  const aMinutes: number = (a.startHour * 60) + a.startMinute;
                  const bMinutes: number = (b.startHour * 60) + b.startMinute;
                  return aMinutes - bMinutes;
                });
              }
              
              const maxVisibleEvents: number = 2;
              const hasMoreEvents: boolean = dayEvents.length > maxVisibleEvents;
              
              return (
                <div
                  key={`day-${weekIndex}-${dayIndex}`}
                  className={`day-cell ${
                    !day.currentMonth ? 'other-month' : ''
                  } ${day.today ? 'today' : ''} ${holidayInfo ? 'holiday' : ''}`}
                >
                  <div className="day-number-container">
                    <span className={`day-number ${day.today ? 'today' : ''}`}>
                      {day.day}
                    </span>
                    
                    {holidayInfo && (
                      <div className="holiday-name" title={holidayInfo.name}>
                        {holidayInfo.name}
                      </div>
                    )}
                  </div>
                  <div className="events-container">
                    {dayEvents.length > 0 ? (
                      <>
                        {dayEvents.slice(0, maxVisibleEvents).map((event: EventData, eventIndex: number) => (
                          <div
                            key={eventIndex}
                            className="event"
                            style={{ backgroundColor: event.color }}
                            title={`${event.title} (${event.courseType}) - ${event.start_time} - ${event.end_time}`}
                          >
                            <span className="event-time">
                              {`${String(event.startHour).padStart(2, '0')}:${String(event.startMinute).padStart(2, '0')}`}
                            </span>
                            <span className="event-title">
                              {`${event.title} (${event.courseType})`}
                            </span>
                          </div>
                        ))}
                        
                        {hasMoreEvents && (
                          <div 
                            className="view-more-button"
                            onClick={() => handleViewMoreClick(day.date)}
                          >
                            <span>Extindere ({dayEvents.length - maxVisibleEvents})</span>
                          </div>
                        )}
                      </>
                    ) : day.currentMonth && !holidayInfo ? (
                      <div className="no-events"></div>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </React.Fragment>
        ))}
      </div>
      
      <EventDialog
        isOpen={dialogOpen}
        onClose={() => setDialogOpen(false)}
        date={selectedDate}
        courses={courses}
        academicSchedule={academicSchedule}
      />
    </div>
  );
};

export default MonthView;