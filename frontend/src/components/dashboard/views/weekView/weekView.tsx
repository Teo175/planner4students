// src/components/Calendar/views/WeekView.jsx
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
import './weekView.scss';

const WeekView = ({ currentDate, courses, isEditMode, onDeleteCourse, academicSchedule }) => {
  const weekDays = getWeekDays(currentDate);
  const hours = Array.from({ length: 24 }, (_, i) => i); // Afișează toate orele de la 0 la 23
  
  // Folosim un ref pentru a controla scrollarea
  const weekViewRef = useRef(null);
  const weekBodyRef = useRef(null);

  useEffect(() => {
    if (weekBodyRef.current) {
      const hourHeight = 60; // Înălțimea unei ore în pixeli
      const targetHour = 8;  // Ora la care să se poziționeze inițial (8 AM)
      weekBodyRef.current.scrollTop = targetHour * hourHeight;
    }
  }, [currentDate]);

  return (
    <div className="week-view" ref={weekViewRef}>
      <div className="week-header">
        <div className="header-cell time-header"></div>
        {weekDays.map((date, index) => {
          const dayIndex = date.getDay();
          const isToday = date.toDateString() === new Date().toDateString();
          
          // Verifică dacă este zi liberă și obține informații despre ea
          const holidayInfo = academicSchedule && academicSchedule.holidays ? 
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
        {hours.map((hour, hourIndex) => (
          <div key={hourIndex} className="hour-row">
            <div className="time-cell">
              {formatHour(hour)}
            </div>
            
            {weekDays.map((date, dateIndex) => {
              // Verifică dacă este zi liberă
              const holidayInfo = academicSchedule && academicSchedule.holidays ? 
                isHoliday(date, academicSchedule.holidays) : null;
              
              // Obține evenimentele pentru această zi și le aranjează pentru suprapuneri
              let dayEvents = getEventsForDate(date, courses, academicSchedule);
              dayEvents = arrangeOverlappingEvents(dayEvents, hours[0]);
              
              // Filtrăm evenimentele care încep în ora curentă
              const hourEvents = dayEvents.filter(event => 
                parseInt(event.startHour) === hour
              );
              
              return (
                <div key={dateIndex} className={`day-cell ${holidayInfo ? 'holiday-cell' : ''}`}>
                  {hourEvents.map((event, eventIndex) => {
                    const startHour = parseInt(event.startHour);
                    const startMinute = parseInt(event.startMinute);
                    const endHour = parseInt(event.endHour);
                    const endMinute = parseInt(event.endMinute);
                    
                    // Calculează poziția și durata
                    const topPosition = 0; // Poziția este relativă la ora curentă, deci 0
                    const durationHours = ((endHour - startHour) * 60 + (endMinute - startMinute)) / 60 -0.1;
                    
                    // Asigură-te că durata este cel puțin 0.5 pentru vizibilitate
                    const validDuration = Math.max(0.5, durationHours);
                    
                    return (
                      <EventItem 
                        key={eventIndex}
                        event={event}
                        firstHour={hour}
                        topPosition={topPosition}
                        duration={validDuration}
                        columnCount={event.columnCount || 1}
                        column={event.column || 0}
                        isEditMode={isEditMode}
                        onDeleteCourse={onDeleteCourse}
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