import React from 'react';

const EventItem = ({ 
  event, 
  firstHour, 
  topPosition, 
  duration, 
  columnCount, 
  column,
  isDayView = false,
  isInDialog = false,
  isEditMode = false,
  onDeleteCourse
}) => {
  const {
    title,
    color,
    courseType,
    startHour,
    startMinute,
    endHour,
    endMinute
  } = event;

  // Dacă evenimentul este afișat în dialog și nu avem topPosition, duration etc.
  // Vom folosi stiluri diferite bazate pe isInDialog
  if (isInDialog) {
    return (
      <div 
        className="event-dialog-item"
        style={{ backgroundColor: color }}
      >
        <div className="event-header">
          <span className="event-time">
            {`${String(startHour).padStart(2, '0')}:${String(startMinute).padStart(2, '0')} - 
            ${String(endHour).padStart(2, '0')}:${String(endMinute).padStart(2, '0')}`}
          </span>
        </div>
        <div className="event-title">{title}</div>
        <div className="event-type">{courseType}</div>
      </div>
    );
  }

  // Calculate position and size - folosim implementarea existentă
  const styleProps = {
    backgroundColor: color,
    top: `${topPosition * 4}rem`,
    height: `${duration * 4 - 0.3}rem`,
    margin: '0.15rem 0',
    zIndex: 10
  };

  // Adjust positioning based on column count and if it's in day view
  if (isDayView) {
    styleProps.left = columnCount > 1 ? `calc(${column * (100 / columnCount)}% + 0.1rem)` : '0.1rem';
    styleProps.width = columnCount > 1 ? `calc(${100 / columnCount}% - 0.3rem)` : 'calc(100% - 0.2rem)';
    styleProps.marginRight = columnCount === 1 ? '0.1rem' : '0';
  } else {
    styleProps.left = columnCount > 1 ? `calc(${column * (100 / columnCount)}% + 0.1rem)` : '0.25rem';
    styleProps.width = columnCount > 1 ? `calc(${100 / columnCount}% - 0.3rem)` : 'calc(100% - 0.5rem)';
    styleProps.right = columnCount > 1 ? 'auto' : '0.25rem';
  }

  // Adăugăm o clasă suplimentară când suntem în modul de editare
  const eventClassName = `event ${isEditMode ? 'event-edit-mode' : ''}`;

  // Funcția goală pentru butonul de ștergere
  const handleDeleteClick = (e) => {
    e.stopPropagation(); // Prevenim propagarea evenimentului
    
    if (onDeleteCourse && event.id) {
      onDeleteCourse(event.id); // Apelăm funcția de ștergere cu ID-ul evenimentului
    } else {
      console.log("Delete clicked for event:", event.title);
      console.warn("Ștergerea nu este posibilă: lipsește onDeleteCourse sau event.id");
    }
  };

  return (
    <div 
      className={eventClassName}
      style={styleProps}
    >
      {isEditMode && (
        <button 
          className="event-delete-btn"
          onClick={handleDeleteClick}
        >
          &times;
        </button>
      )}
      <div className="event-title">{title}</div>
      <div className="event-time">
        {`${startHour}:${String(startMinute).padStart(2, '0')} - 
        ${endHour}:${String(endMinute).padStart(2, '0')}`}
      </div>
      <div className="event-type">{courseType}</div>
    </div>
  );
};

export default EventItem;