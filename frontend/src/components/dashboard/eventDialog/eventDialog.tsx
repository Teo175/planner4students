import React from 'react';
import './eventDialog.scss';
import DayView from '../views/dayView/dayView';
import { EventDialogProps } from '../../../common';

//extended component for mothview
const EventDialog: React.FC<EventDialogProps> = ({ isOpen, onClose, date, courses, academicSchedule }) => {
  if (!isOpen || !date) return null;

  return (
    <div className="event-dialog-overlay">
      <div className="event-dialog-content">
        <div className="event-dialog-header">
          <h3>Program pentru {date.getDate()}/{date.getMonth() + 1}/{date.getFullYear()}</h3>
          <button className="event-dialog-close-btn" onClick={onClose}>×</button>
        </div>
        <div className="event-dialog-body">
          <DayView currentDate={date} courses={courses} academicSchedule={academicSchedule} />
        </div>
      </div>
    </div>
  );
};

export default EventDialog;
