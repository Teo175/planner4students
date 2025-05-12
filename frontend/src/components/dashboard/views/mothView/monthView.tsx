import React, { useState } from 'react';
import { dayNames, getDaysArray, getEventsForDate, isHoliday } from '../../utils/dateUtils';

import './mothView.scss';
import EventDialog from '../../eventDialog/eventDialog';

const MonthView = ({ currentDate, courses, academicSchedule }) => {
  // State pentru dialog
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);

  // Handler pentru click pe butonul "View more"
  const handleViewMoreClick = (date) => {
    setSelectedDate(date);
    setDialogOpen(true);
  };

  // Get only the days needed for the current month
  const daysArray = getDaysArray(currentDate, true);
  
  // Group days into weeks for rendering
  const weeks = [];
  let currentWeek = [];
  
  daysArray.forEach((day, index) => {
    currentWeek.push(day);
    
    // After 7 days or at the end of the array, push the week and start a new one
    if (currentWeek.length === 7 || index === daysArray.length - 1) {
      weeks.push([...currentWeek]);
      currentWeek = [];
    }
  });

  return (
    <div className="month-view-container">
      <div className="day-headers-container">
        {dayNames.map((day, index) => (
          <div key={index} className="day-header">
            {day}
          </div>
        ))}
      </div>
      
      <div className="month-grid">
        {weeks.map((week, weekIndex) => (
          <React.Fragment key={`week-${weekIndex}`}>
            {week.map((day, dayIndex) => {
              // Verifică dacă ziua este zi liberă - folosim direct isHoliday cu ora fixată
              const fixedDate = new Date(day.date);
              // Stabilim ora la mijlocul zilei pentru a evita probleme de fus orar
              fixedDate.setHours(12, 0, 0, 0);
              const holidayInfo = academicSchedule && academicSchedule.holidays ? 
                isHoliday(fixedDate, academicSchedule.holidays) : null;
              
              // Get events for this day and sort them by start time
              // Doar dacă nu este zi liberă
              let dayEvents = [];
              if (!holidayInfo) {
                dayEvents = getEventsForDate(day.date, courses, academicSchedule).sort((a, b) => {
                  // Convert to minutes since midnight for easy comparison
                  const aMinutes = (a.startHour * 60) + a.startMinute;
                  const bMinutes = (b.startHour * 60) + b.startMinute;
                  
                  return aMinutes - bMinutes; // Ascending order
                });
              }
              
              // Afișăm maxim 2 evenimente per celulă
              const maxVisibleEvents = 2;
              const hasMoreEvents = dayEvents.length > maxVisibleEvents;
              
              return (
                <div
                  key={`day-${weekIndex}-${dayIndex}`}
                  className={`day-cell ${
                    !day.currentMonth ? 'other-month' : ''
                  } ${day.today ? 'today' : ''} ${holidayInfo ? 'holiday' : ''}`}
                >
                  <div className="day-number-container">
                    <span className={`day-number ${
                      day.today ? 'today' : ''
                    }`}>
                      {day.day}
                    </span>
                    
                    {/* Afișează numele sărbătorii dacă există */}
                    {holidayInfo && (
                      <div className="holiday-name" title={holidayInfo.name}>
                        {holidayInfo.name}
                      </div>
                    )}
                  </div>
                  <div className="events-container">
                    {dayEvents.length > 0 ? (
                      <>
                        {dayEvents.slice(0, maxVisibleEvents).map((event, eventIndex) => (
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
                        
                        {/* Buton "View more" cu handler de click */}
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
      
      {/* Dialog pentru afișarea detaliilor zilei */}
      <EventDialog
        isOpen={dialogOpen}
        onClose={() => setDialogOpen(false)}
        date={selectedDate}
        courses={courses}
      />
    </div>
  );
};

export default MonthView;