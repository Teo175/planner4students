import { ChevronLeft, ChevronRight } from 'lucide-react';

type ViewType = 'month' | 'week' | 'day';

interface CalendarToolbarProps {
  currentDate: Date;
  viewType: ViewType;
  setViewType: (viewType: ViewType) => void;
  goToPrevious: () => void;
  goToNext: () => void;
  goToToday: () => void;
}

interface ViewButtonConfig {
  type: ViewType;
  label: string;
}

const CalendarToolbar = ({
  currentDate,
  viewType,
  setViewType,
  goToPrevious,
  goToNext,
  goToToday
}: CalendarToolbarProps) => {
  const monthNames: string[] = [
    'Ianuarie', 'Februarie', 'Martie', 'Aprilie', 'Mai', 'Iunie',
    'Iulie', 'August', 'Septembrie', 'Octombrie', 'Noiembrie', 'Decembrie'
  ];

  const viewButtons: ViewButtonConfig[] = [
    { type: 'month', label: 'Lună' },
    { type: 'week', label: 'Săptămână' },
    { type: 'day', label: 'Zi' }
  ];

  const getDisplayTitle = (): string => {
    const month: string = monthNames[currentDate.getMonth()];
    const year: number = currentDate.getFullYear();
    const day: number = currentDate.getDate();

    switch (viewType) {
      case 'month':
        return `${month} ${year}`;
      case 'week':
        return `${month} ${year}`;
      case 'day':
        return `${day} ${month} ${year}`;
      default:
        return `${month} ${year}`;
    }
  };

  const handleViewTypeChange = (newViewType: ViewType): void => {
    setViewType(newViewType);
  };

  const handleTodayClick = (): void => {
    goToToday();
  };

  const handlePreviousClick = (): void => {
    goToPrevious();
  };

  const handleNextClick = (): void => {
    goToNext();
  };

  return (
    <div className="calendar-toolbar">
      <div className="toolbar-left">
        <button 
          className="today-button"
          onClick={handleTodayClick}
          type="button"
        >
          Astăzi
        </button>
        
        <button 
          className="navigation-button"
          onClick={handlePreviousClick}
          type="button"
          aria-label="Săptămâna anterioară"
        >
          <ChevronLeft size={20} />
        </button>
        
        <button 
          className="navigation-button"
          onClick={handleNextClick}
          type="button"
          aria-label="Săptămâna următoare"
        >
          <ChevronRight size={20} />
        </button>
        
        <h2 className="date-title">
          {getDisplayTitle()}
        </h2>
      </div>
      
      <div className="toolbar-right">
        <div className="view-switcher">
          {viewButtons.map((button: ViewButtonConfig) => (
            <button
              key={button.type}
              className={`view-button ${viewType === button.type ? 'active' : ''}`}
              onClick={() => handleViewTypeChange(button.type)}
              type="button"
              aria-pressed={viewType === button.type}
            >
              {button.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CalendarToolbar;
export type { CalendarToolbarProps, ViewType };