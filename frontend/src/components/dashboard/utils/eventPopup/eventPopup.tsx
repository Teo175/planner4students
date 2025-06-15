import React from 'react';
import './eventPopup.scss';
import { EventPopupProps } from '../../../../common';

const EventPopup: React.FC<EventPopupProps> = ({
  event,
  isVisible,
  onClose,
  isEditMode = false,
  isPossibleAdd = false,
  onDeleteCourse,
  onAddCourse
}) => {
  if (!isVisible || !event) return null;

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

  const handleDeleteClick = () => {
    if (onDeleteCourse && id) {
      onDeleteCourse(id);
      onClose();
    }
  };

  const handleAddClick = () => {
    if (onAddCourse && id) {
      onAddCourse(id);
      onClose();
    }
  };

  return (
    <div className="event-popup-overlay" onClick={onClose}>
      <div className="event-popup" onClick={(e) => e.stopPropagation()}>
        <div className="event-popup-header" style={{ backgroundColor: color }}>
          <h3>{title}</h3>
          <button className="popup-close-btn" onClick={onClose} aria-label="Închide popup">×</button>
        </div>

        <div className="event-popup-content">
          <div className="event-detail-row">
            <span className="detail-label">Tip:</span>
            <span className="detail-value">{courseType}</span>
          </div>
          <div className="event-detail-row">
            <span className="detail-label">Orar:</span>
            <span className="detail-value">
              {`${String(startHour).padStart(2, '0')}:${String(startMinute).padStart(2, '0')} - ${String(endHour).padStart(2, '0')}:${String(endMinute).padStart(2, '0')}`}
            </span>
          </div>
          {professor_name && (
            <div className="event-detail-row">
              <span className="detail-label">Profesor:</span>
              <span className="detail-value">{professor_name}</span>
            </div>
          )}
          {room_name && (
            <div className="event-detail-row">
              <span className="detail-label">Sala:</span>
              <span className="detail-value">{room_name}</span>
            </div>
          )}
          <div className="event-detail-row">
            <span className="detail-label">Număr studenți:</span>
            <span className="detail-value">{student_count}</span>
          </div>
        </div>

        {(isEditMode || isPossibleAdd) && (
          <div className="event-popup-actions">
            {isEditMode && !isPossibleAdd && (
              <button className="popup-delete-btn" onClick={handleDeleteClick}>
                Șterge cursul
              </button>
            )}
            {isPossibleAdd && (
              <button className="popup-add-btn" onClick={handleAddClick}>
                Adaugă cursul în orar
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default EventPopup;
