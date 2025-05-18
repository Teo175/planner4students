
// src/components/Calendar/CalendarToolbar.jsx
import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const CalendarToolbar = ({ 
  currentDate, 
  viewType, 
  setViewType, 
  goToPrevious, 
  goToNext, 
  goToToday 
}) => {
  const monthNames = [
    'Ianuarie', 'Februarie', 'Martie', 'Aprilie', 'Mai', 'Iunie',
    'Iulie', 'August', 'Septembrie', 'Octombrie', 'Noiembrie', 'Decembrie'
  ];

  const getDisplayTitle = () => {
    if (viewType === 'month') {
      return `${monthNames[currentDate.getMonth()]} ${currentDate.getFullYear()}`;
    } else if (viewType === 'week') {
      return `${monthNames[currentDate.getMonth()]} ${currentDate.getFullYear()} `;
    } else if (viewType === 'day') {
      return `${currentDate.getDate()} ${monthNames[currentDate.getMonth()]} ${currentDate.getFullYear()}`;
    }
  };

  return (
    <div className="calendar-toolbar">
      <div className="toolbar-left">
        <button 
          className="today-button"
          onClick={goToToday}
        >
          Astăzi
        </button>
        
        <button 
          className="navigation-button"
          onClick={goToPrevious}
        >
          <ChevronLeft size={20} />
        </button>
        
        <button 
          className="navigation-button"
          onClick={goToNext}
        >
          <ChevronRight size={20} />
        </button>
        
        <h2 className="date-title">
          {getDisplayTitle()}
        </h2>
      </div>
      
      <div className="toolbar-right">
        <div className="view-switcher">
          <button 
            className={`view-button ${viewType === 'month' ? 'active' : ''}`}
            onClick={() => setViewType('month')}
          >
            Lună
          </button>
          <button 
            className={`view-button ${viewType === 'week' ? 'active' : ''}`}
            onClick={() => setViewType('week')}
          >
            Săptămână
          </button>
          <button 
            className={`view-button ${viewType === 'day' ? 'active' : ''}`}
            onClick={() => setViewType('day')}
          >
            Zi
          </button>
        </div>
      </div>
    </div>
  );
};

export default CalendarToolbar;