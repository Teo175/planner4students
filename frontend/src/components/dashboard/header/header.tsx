import { Combobox, Option } from '@fluentui/react-components';
import {
  Edit, Menu, Plus, Save, Search, Undo, X, LogOut, User, Building2, Users,
} from 'lucide-react';
import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import apiService from '../../../api/server/apiService';
import { CalendarHeaderProps } from '../../../common';

const CalendarHeader: React.FC<CalendarHeaderProps> = ({
  isWeekView,
  isEditMode = false,
  isAddingCourses = false,
  onEdit,
  onSave,
  onCancel,
  onUndo,
  onAddCourses,
  onCancelAddCourse,
  onCourseTypeChange,
  onCourseSelect,
  onSearchCourses,
  onSaveAddedCourses,
  hasTempAddedCourses = false,
  availableCourses = [],
  searchLoading = false,
}) => {
  const [selectedCourseType, setSelectedCourseType] = useState('');
  const [selectedCourseName, setSelectedCourseName] = useState('');
  const [isComboboxOpen, setIsComboboxOpen] = useState(false);
  const [isCoursesComboboxOpen, setIsCoursesComboboxOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef(null);
  const navigate = useNavigate();

  const courseTypeOptions = [
    { value: 'Curs', color: '#4285F4' },
    { value: 'Seminar', color: '#0F9D58' },
    { value: 'Laborator', color: '#DB4437' },
  ];

  const handleCourseTypeChange = (_: any, data: any) => {
    const typeValue = data.optionValue ?? '';
    setSelectedCourseType(typeValue);
    setIsComboboxOpen(false);
    onCourseTypeChange?.(typeValue);
  };

  const handleCourseNameChange = (_: any, data: any) => {
    const typeValue = data.optionValue ?? '';
    setSelectedCourseName(typeValue);
    setIsCoursesComboboxOpen(false);
    onCourseSelect?.(typeValue);
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const handleMenuAction = (action: string) => {
    setIsMenuOpen(false);
    if (action === 'logout') {
      handleLogout();
      navigate('/login');
    } else if (action === 'profile') {
      navigate('/editProfile');
    } else if (action === 'harta_sali') {
      navigate('/roomsMaps');
    } else if (action === 'cadre_didactice') {
      navigate('/professors');
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !(menuRef.current as HTMLElement).contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    if (!isAddingCourses) {
      setSelectedCourseType('');
      setSelectedCourseName('');
    }
  }, [isAddingCourses]);

  const handleComboboxOpenChange = (_: any, data: any) => {
    setIsComboboxOpen(data.open);
  };

  const handleCoursesComboboxOpenChange = (_: any, data: any) => {
    setIsCoursesComboboxOpen(data.open);
  };

  const handleLogout = () => {
    apiService.logout();
    window.location.href = '/login';
    setIsMenuOpen(false);
  };

  const isSearchButtonDisabled = () => {
    return !selectedCourseType || !selectedCourseName;
  };

  const isSaveButtonDisabled = () => {
    return !hasTempAddedCourses;
  };

  return (
    <header className="calendar-header">
      <div className="header-left">
        <div className="menu-container" ref={menuRef}>
          <button className="menu-button menu" onClick={toggleMenu}>
            <Menu size={20} />
          </button>
          {isMenuOpen && (
            <div className="menu-dropdown">
              <div className="menu-item" onClick={() => handleMenuAction('harta_sali')}>
                <Building2 size={16} />
                <span>Harta sălilor</span>
              </div>
              <div className="menu-item" onClick={() => handleMenuAction('cadre_didactice')}>
                <Users size={16} />
                <span>Cadre didactice</span>
              </div>
              <div className="menu-item" onClick={() => handleMenuAction('profile')}>
                <User size={16} />
                <span>Editează-ți profilul</span>
              </div>
              <div className="menu-item" onClick={() => handleMenuAction('logout')}>
                <LogOut size={16} />
                <span>Deconectează-te</span>
              </div>
            </div>
          )}
        </div>
        <div className="logo">
          <img src="images/finalogo.png" alt="Planner 4 Students" className="form-logo" />
        </div>
      </div>
      <div className="header-right">
        {isWeekView && !isEditMode && !isAddingCourses && (
          <>
            <button className="menu-button undo-button" title="Revino la orarul inițial" onClick={onUndo}>
              <Undo size={18} />
            </button>
            <button className="menu-button add-button" title="Adaugă" onClick={onAddCourses}>
              <Plus size={18} />
            </button>
            <button className="menu-button edit-button" title="Editează orarul" onClick={onEdit}>
              <Edit size={18} />
            </button>
          </>
        )}

        {isWeekView && isEditMode && (
          <div className="actions">
            <button className="menu-button save-button" title="Salvează modificările" onClick={onSave}>
              <Save size={18} />
            </button>
            <button className="menu-button cancel-edit-button" title="Renunță la modificări" onClick={onCancel}>
              <X size={18} />
            </button>
          </div>
        )}

        {isWeekView && isAddingCourses && (
          <div className="add-container">
            <div className="course-selector-container">
              <div className="course-selector">
                <Combobox
                  className="combobox dropdown-compact"
                  placeholder="Selectează materia"
                  onOptionSelect={handleCourseNameChange}
                  value={selectedCourseName}
                  appearance="outline"
                  freeform={false}
                  listbox
                  open={isCoursesComboboxOpen}
                  onOpenChange={handleCoursesComboboxOpenChange}
                >
                  {availableCourses.map((option) => (
                    <Option key={option} text={option} value={option}>
                      <div className="course-type-option-content">
                        <span>{option}</span>
                      </div>
                    </Option>
                  ))}
                </Combobox>
                {searchLoading && <div className="search-loading">Se încarcă...</div>}
              </div>

              <div className="course-type-selector">
                <Combobox
                  className="combobox dropdown-compact"
                  placeholder="Selectează tipul"
                  onOptionSelect={handleCourseTypeChange}
                  value={selectedCourseType}
                  appearance="outline"
                  freeform={false}
                  listbox
                  open={isComboboxOpen}
                  onOpenChange={handleComboboxOpenChange}
                >
                  {courseTypeOptions.map((option) => (
                    <Option
                      key={option.value}
                      text={option.value}
                      value={option.value}
                      className={`course-type-option course-type-option-${option.value.toLowerCase()}`}
                    >
                      <div className="course-type-option-content">
                        <div className="color-indicator" style={{ backgroundColor: option.color }}></div>
                        <span>{option.value}</span>
                      </div>
                    </Option>
                  ))}
                </Combobox>
              </div>
            </div>

            <div className="add-actions">
              <button
                className={`menu-button find-button ${isSearchButtonDisabled() ? 'button-disabled' : ''}`}
                title={isSearchButtonDisabled() ? 'Selectează un curs și un tip de curs' : 'Caută cursuri'}
                onClick={onSearchCourses}
                disabled={isSearchButtonDisabled()}
              >
                <Search size={18} />
              </button>
              <button
                className={`menu-button save-add-button ${isSaveButtonDisabled() ? 'button-disabled' : ''}`}
                title={
                  isSaveButtonDisabled()
                    ? 'Nu există cursuri adăugate pentru salvare'
                    : 'Salvează modificările'
                }
                onClick={onSaveAddedCourses}
                disabled={isSaveButtonDisabled()}
              >
                <Save size={18} />
              </button>
              <button className="menu-button cancel-add-button" title="Renunță la adăugare" onClick={onCancelAddCourse}>
                <X size={18} />
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default CalendarHeader;