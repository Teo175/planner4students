
// src/components/Calendar/CalendarHeader.jsx
import React from 'react';
import { Calendar, Menu, Save, X } from 'lucide-react';
import { FaEdit } from 'react-icons/fa';

const CalendarHeader = ({ 
  title, 
  isWeekView, 
  isEditMode = false, 
  onEdit, 
  onSave, 
  onCancel 
}) => {
  return (
    <header className="calendar-header">
      <div className="header-left">
        <button className="menu-button">
          <Menu size={20} />
        </button>
        <div className="logo">
          <Calendar size={20} className="calendar-icon" />
          <span className="title">{title}</span>
        </div>
      </div>
      <div className="header-right">
        {isWeekView && !isEditMode && (
          <button
            className="menu-button"
            aria-label="Edit"
            onClick={onEdit}
          >
            <FaEdit /> Edit
          </button>
        )}
        
        {isWeekView && isEditMode && (
          <>
            <button
              className="menu-button save-button"
              aria-label="Save"
              onClick={onSave}
            >
              <Save size={18} /> Save
            </button>
            <button
              className="menu-button cancel-button"
              aria-label="Cancel"
              onClick={onCancel}
            >
              <X size={18} /> Cancel
            </button>
          </>
        )}
      </div>
    </header>
  );
};

export default CalendarHeader;