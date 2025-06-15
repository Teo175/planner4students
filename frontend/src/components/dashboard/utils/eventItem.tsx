import { useState } from 'react';
import EventPopup from './eventPopup/eventPopup';
import { EventItemProps } from '../../../common';

const EventItem = ({
  event,
  topPosition,
  duration,
  columnCount,
  column,
  isDayView = false,
  isEditMode = false,
  isPossibleAdd = false,
  onDeleteCourse,
  onAddCourse
}: EventItemProps) => {
  const [showPopup, setShowPopup] = useState(false);

  const {
    id,
    title,
    color,
    courseType,
    startHour,
    startMinute,
    endHour,
    endMinute,
    room_name,
    professor_name,
    student_count
  } = event;

  const handleEventClick = (e: React.MouseEvent) => {
    if (
      (e.target as HTMLElement).closest('.event-delete-btn') ||
      (e.target as HTMLElement).closest('.event-add-btn')
    ) {
      return;
    }
    setShowPopup(true);
  };

  const handleClosePopup = () => setShowPopup(false);

  const handleDelete = (eventId: string) => {
    if (onDeleteCourse) onDeleteCourse(eventId);
  };

  const handleAdd = (eventId: string) => {
    if (onAddCourse) onAddCourse(eventId);
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onDeleteCourse && id) onDeleteCourse(id);
  };

  const handleAddClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onAddCourse && id) onAddCourse(id);
  };

  const styleProps: React.CSSProperties = {
    backgroundColor: color,
    top: `${topPosition * 4}rem`,
    height: isDayView ? `${duration * 4 - 0.7}rem` : `${duration * 4 - 0.5}rem`,
    margin: '0.15rem 0',
    zIndex: 10,
    cursor: 'pointer'
  };

  if (isDayView) {
    styleProps.left = columnCount > 1 ? `calc(${column * (100 / columnCount)}% + 0.1rem)` : '0.1rem';
    styleProps.width = columnCount > 1 ? `calc(${100 / columnCount}% - 0.2rem)` : 'calc(100% - 0.2rem)';
    styleProps.marginRight = columnCount === 1 ? '0.1rem' : '0';
  } else {
    styleProps.left = columnCount > 1 ? `calc(${column * (100 / columnCount)}% + 0.1rem)` : '0.25rem';
    styleProps.width = columnCount > 1 ? `calc(${100 / columnCount}% - 0.3rem)` : 'calc(100% - 0.5rem)';
    styleProps.right = columnCount > 1 ? 'auto' : '0.25rem';
  }

  if (isPossibleAdd) {
    styleProps.opacity = 0.7;
    styleProps.border = '2px dashed #333';
  }

  const eventClassName = `event ${isEditMode ? 'event-edit-mode' : ''} ${isPossibleAdd ? 'possible-add-event' : ''}`;

  return (
    <>
      <div className={eventClassName} style={styleProps} onClick={handleEventClick}>
        {isEditMode && !isPossibleAdd && (
          <button className="event-delete-btn" onClick={handleDeleteClick} title="Șterge cursul">
            &times;
          </button>
        )}
        {isPossibleAdd && (
          <button className="event-add-btn" onClick={handleAddClick} title="Adaugă cursul în orar">
            +
          </button>
        )}
        <div className="event-content">
          <div className="event-title">{title}-{courseType}</div>
          <div className="event-type">
            {professor_name && <div className="event-location">Prof: {professor_name}</div>}
          </div>
          <div className="event-type">
            {`${startHour}:${String(startMinute).padStart(2, '0')} - ${endHour}:${String(endMinute).padStart(2, '0')}`}
          </div>
          <div className="event-type">
            {room_name && <div className="event-location">Sala: {room_name}</div>}
          </div>
        </div>
        <div className="students-no">Nr. studenți: {student_count}</div>
      </div>

      <EventPopup
        event={event}
        isVisible={showPopup}
        onClose={handleClosePopup}
        isEditMode={isEditMode}
        isPossibleAdd={isPossibleAdd}
        onDeleteCourse={handleDelete}
        onAddCourse={handleAdd}
      />
    </>
  );
};

export default EventItem;
