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

const DayView = ({ currentDate, courses, academicSchedule }) => {
  const hours = Array.from({ length: 24 }, (_, i) => i);
  
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      const hourHeight = 60; // înălțimea unei ore (px)
      const targetHour = 8;  // ora pe care vrem să o vedem
      scrollRef.current.scrollTop = targetHour * hourHeight;
    }
  }, [currentDate]);

  // Verifică dacă ziua curentă este zi liberă (sărbătoare)
  const holidayInfo = academicSchedule && academicSchedule.holidays ? 
    isHoliday(currentDate, academicSchedule.holidays) : null;

  let dayEvents = getEventsForDate(currentDate, courses, academicSchedule);
  dayEvents = arrangeOverlappingEvents(dayEvents, hours[0]);

  return (
    <div className="day-view">
      <div className="day-header">
        <div className={`day-number ${currentDate.toDateString() === new Date().toDateString() ? 'today' : ''}`}>
          {currentDate.getDate()}
        </div>
        <div className="day-name">
          {fullDayNames[currentDate.getDay() === 0 ? 6 : currentDate.getDay() - 1]}
        </div>
        
        {/* Afișează numele sărbătorii dacă există */}
        {holidayInfo && (
          <div className="holiday-name">
            {holidayInfo.name}
          </div>
        )}
      </div>

      <div 
        ref={scrollRef}
        className="day-body" 
        style={{ 
          display: 'flex', 
          flexDirection: 'column',
          height: 'calc(100vh - 160px)', 
          overflowY: 'auto',
          position: 'relative',
          borderTop: '1px solid #ddd'
        }}
      >
        {hours.map((hour, index) => (
          <div key={index} style={{
            display: 'flex',
            minHeight: '60px',
            borderBottom: '1px solid #eee',
            backgroundColor: index % 2 === 0 ? '#fafafa' : '#fff'
          }}>
            {/* Ora în stânga */}
            <div style={{
              width: '60px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '0.85rem',
              color: '#555',
              borderRight: '1px solid #ddd'
            }}>
              {formatHour(hour)}
            </div>

            {/* Evenimentele în dreapta */}
            <div style={{ 
              flex: 1, 
              position: 'relative'
            }}>
              {dayEvents
                .filter(event => {
                  const startHour = parseInt(event.startHour);
                  return startHour === hour;
                })
                .map((event, eventIndex) => {
                  const startMinute = parseInt(event.startMinute) || 0;
                  const endHour = parseInt(event.endHour) || 0;
                  const endMinute = parseInt(event.endMinute) || 0;

                  const columnCount = event.columnCount || 1;
                  const column = event.column || 0;

                  const durationMinutes = (endHour - hour) * 60 + (endMinute - startMinute);
                  
                  // Use fixed pixel-based margins instead of percentage
                  const eventWidth = 100 / columnCount;
                  const columnPosition = eventWidth * column;
                  
                  // Apply consistent fixed-width margins
                  return (
                    <div
                      key={eventIndex}
                      style={{
                        position: 'absolute',
                        top: `${startMinute}px`,
                        left: `${columnPosition}%`,
                        width: `${eventWidth-0.8}%`,
                        height: `${durationMinutes}px`,
                        padding: '1px',
                        boxSizing: 'border-box'
                      }}
                    >
                      <div style={{
                        marginRight: '2px',
                        marginLeft: '2px',
                        height: '100%'
                      }}>
                        <EventItem event={event} isDayView={true} />
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