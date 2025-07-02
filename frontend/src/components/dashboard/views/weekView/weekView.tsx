import React, { useRef, useEffect } from 'react';
import { 
  fullDayNames, 
  getEventsForDate,
  arrangeOverlappingEvents,
  formatHour,
  getWeekDays,
  isHoliday
} from '../../utils/dateUtils';
import EventItem from '../../utils/eventItem';
import { EventData, Holiday, WeekViewProps } from '../../../../common';
import './weekView.scss';

const WeekView: React.FC<WeekViewProps> = ({ 
  currentDate, 
  courses, 
  isEditMode = false, 
  onDeleteCourse, 
  academicSchedule, 
  possibleAddCourses = [],
  isAddingCourses = false,  
  onAddCourse 
}) => {
  const weekDays: Date[] = getWeekDays(currentDate);
  const hours: number[] = Array.from({ length: 24 }, (_, i) => i);

  const weekViewRef = useRef<HTMLDivElement>(null);
  const weekBodyRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (weekBodyRef.current) {
      const hourHeight: number = 60;
      const targetHour: number = 8;  
      weekBodyRef.current.scrollTop = targetHour * hourHeight;
    }
  }, [currentDate]);

  return (
    <div className="week-view" ref={weekViewRef}>
      <div className="week-header">
        <div className="header-cell time-header"></div>
        {weekDays.map((date: Date, index: number) => {
          const dayIndex: number = date.getDay();
          const isToday: boolean = date.toDateString() === new Date().toDateString();
          
          const holidayInfo: Holiday | null = academicSchedule && academicSchedule.holidays ? 
            isHoliday(date, academicSchedule.holidays) : null;
          
          return (
            <div key={index} className={`header-cell day-header ${holidayInfo ? 'holiday' : ''}`}>
              <div className="day-name">
                {fullDayNames[dayIndex === 0 ? 6 : dayIndex - 1]}
              </div>
              <div className={`day-number ${isToday ? 'today' : ''}`}>
                {date.getDate()}
              </div>
              {holidayInfo && (
                <span className="holiday-badge" title={holidayInfo.name}>
                  {" • " + holidayInfo.name}
                </span>
              )}
            </div>
          );
        })}
      </div>
      
      <div ref={weekBodyRef} className="week-body">
        {hours.map((hour: number, hourIndex: number) => (
          <div key={hourIndex} className="hour-row">
            <div className="time-cell">
              {formatHour(hour)}
            </div>
            
            {weekDays.map((date: Date, dateIndex: number) => {
              const holidayInfo: Holiday | null = academicSchedule && academicSchedule.holidays ? 
                isHoliday(date, academicSchedule.holidays) : null;
              
              let dayEvents: EventData[] = getEventsForDate(date, courses, academicSchedule);
              
              let possibleDayEvents: EventData[] = [];
              if (isAddingCourses && possibleAddCourses.length > 0) {
                possibleDayEvents = getEventsForDate(date, possibleAddCourses, academicSchedule);
              }
              
              const allDayEvents: EventData[] = [...dayEvents, ...possibleDayEvents];
              
              const arrangedEvents: EventData[] = arrangeOverlappingEvents(allDayEvents);
             // console.log(arrangedEvents);
              const hourEvents: EventData[] = arrangedEvents.filter((event: EventData) => 
                event.startHour === hour
              );
              console.log(hourEvents);
              
              return (
                <div key={dateIndex} className={`day-cell ${holidayInfo ? 'holiday-cell' : ''}`}>
                  {hourEvents.map((event: EventData, eventIndex: number) => {
                    const startHour: number = event.startHour;
                    const startMinute: number = event.startMinute;
                    const endHour: number = event.endHour;
                    const endMinute: number = event.endMinute;
                    
                    const topPosition: number = 0;
                    const durationHours: number = ((endHour - startHour) * 60 + (endMinute - startMinute)) / 60 - 0.1;
                    
                    const validDuration: number = Math.max(0.5, durationHours);
                    
                    const isPossibleAddEvent: boolean = isAddingCourses && possibleAddCourses.some((c: EventData) => c.id === event.id);
                    
                    return (
                      <EventItem 
                        key={eventIndex}
                        event={event}
                        topPosition={topPosition}
                        duration={validDuration}
                        columnCount={event.columnCount || 1}
                        column={event.column || 0}
                        isEditMode={isEditMode}
                        onDeleteCourse={onDeleteCourse}
                        isPossibleAdd={isPossibleAddEvent}
                        onAddCourse={onAddCourse}
                      />
                    );
                  })}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
};

export default WeekView;