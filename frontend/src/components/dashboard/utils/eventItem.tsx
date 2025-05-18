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
  onDeleteCourse,
  isPossibleAdd = false,  // Adăugat prop pentru a marca un curs ce poate fi adăugat
  onAddCourse           // Adăugat callback pentru adăugarea cursului
}) => {
  const {
    title,
    color,
    courseType,
    startHour,
    startMinute,
    endHour,
    endMinute,
    room_name,
    professor_name,
    id
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
        <div className="event-type">{courseType}
           {room_name && <div className="event-location">Sala: {room_name}</div>}
        </div>
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

  // Modificăm stilurile dacă evenimentul poate fi adăugat
  if (isPossibleAdd) {
    styleProps.opacity = 0.7;
    styleProps.border = '2px dashed #333';
  }

  // Adăugăm o clasă suplimentară când suntem în modul de editare sau când este un curs ce poate fi adăugat
  const eventClassName = `event ${isEditMode ? 'event-edit-mode' : ''} ${isPossibleAdd ? 'possible-add-event' : ''}`;

  // Funcția pentru butonul de ștergere
  const handleDeleteClick = (e) => {
    e.stopPropagation(); // Prevenim propagarea evenimentului
    
    if (onDeleteCourse && id) {
      onDeleteCourse(id); // Apelăm funcția de ștergere cu ID-ul evenimentului
    } else {
      console.log("Delete clicked for event:", title);
      console.warn("Ștergerea nu este posibilă: lipsește onDeleteCourse sau event.id");
    }
  };

  // Funcția pentru butonul de adăugare
  const handleAddClick = (e) => {
    e.stopPropagation(); // Prevenim propagarea evenimentului
    
    if (onAddCourse && id) {
      onAddCourse(id); // Apelăm funcția de adăugare cu ID-ul evenimentului
    } else {
      console.log("Add clicked for event:", title);
      console.warn("Adăugarea nu este posibilă: lipsește onAddCourse sau event.id");
    }
  };

  return (
    <div 
      className={eventClassName}
      style={styleProps}
    >
      {isEditMode && !isPossibleAdd && (
        <button 
          className="event-delete-btn"
          onClick={handleDeleteClick}
          title="Șterge cursul"
        >
          &times;
        </button>
      )}
      
      {isPossibleAdd && (
        <button 
          className="event-add-btn"
          onClick={handleAddClick}
          title="Adaugă cursul în orar"
        >
          +
        </button>
      )}
      
      <div className="event-title">{title}-{courseType}</div>
      
      <div className="event-type">
            {professor_name && <div className="event-location">Prof: {professor_name}</div>}
            
      </div>
      <div className="event-type">
        {`${startHour}:${String(startMinute).padStart(2, '0')} - 
        ${endHour}:${String(endMinute).padStart(2, '0')}`}
      </div>
      <div className='event-type'>
        {room_name && <div className="event-location">Sala: {room_name}</div>}
      </div>
    </div>
  );
};

export default EventItem;