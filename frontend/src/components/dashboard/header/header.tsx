import { Combobox, Option } from '@fluentui/react-components';
import { Calendar, Edit, Menu, Plus, Save, Search, Undo, X, LogOut, User, Building2 } from 'lucide-react';
import { useEffect, useState, useRef } from 'react';
import apiService from '../../../server/apiService';
import { useNavigate } from 'react-router-dom';

const CalendarHeader = ({ 
  title, 
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
  hasTempAddedCourses=false,
  availableCourses = [],
  searchLoading = false
}) => {
  // State pentru tipul de curs selectat
  const [selectedCourseType, setSelectedCourseType] = useState('');
  // State pentru cursul selectat
  const [selectedCourseName, setSelectedCourseName] = useState('');
  // State pentru a ști dacă combobox-ul este deschis
  const [isComboboxOpen, setIsComboboxOpen] = useState(false);
  const [isCoursesComboboxOpen, setIsCoursesComboboxOpen] = useState(false);
  // State pentru dropdown menu
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  // Ref pentru dropdown menu
  const menuRef = useRef(null);
  
  // Utilizarea hook-ului în componentă
  const navigate = useNavigate();


  // Opțiunile pentru dropdown
  const courseTypeOptions = [
    { value: 'Curs', color: '#4285F4' },     // Albastru
    { value: 'Seminar', color: '#0F9D58' },  // Verde
    { value: 'Laborator', color: '#DB4437' } // Roșu
  ];
  
  // Pentru selectarea tipului de curs
  const handleCourseTypeChange = (_, data) => {
    const typeValue = data.optionValue ?? '';
    setSelectedCourseType(typeValue);
    setIsComboboxOpen(false); // închide combobox-ul
    onCourseTypeChange && onCourseTypeChange(typeValue);
  };

  // Pentru selectarea numelui cursului
  const handleCourseNameChange = (_, data) => {
    const typeValue = data.optionValue ?? '';
    setSelectedCourseName(typeValue);
    setIsCoursesComboboxOpen(false); // închide combobox-ul
    onCourseSelect && onCourseSelect(typeValue); 
  };

  // Toggle pentru meniul dropdown
  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  // Handler pentru acțiunile din meniu
  const handleMenuAction = (action) => {
    // Aici puteți adăuga logica pentru fiecare acțiune
    console.log(`Acțiune selectată: ${action}`);
    setIsMenuOpen(false);
    
    // Implementați aici logica specifică pentru fiecare acțiune
    if (action === 'logout') {
      handleLogout();
      navigate('/login');
    } else if (action === 'profile') {
      navigate('/editProfile');
    }
    else if(action == 'harta_sali'){
      console.log('Harta salilor')
    }
  };

  // Închide meniul când se face click în afara lui
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    // Când ieșim din modul de adăugare (isAddingCourses devine false),
    // resetăm valorile selectate
    if (!isAddingCourses) {
      setSelectedCourseType('');
      setSelectedCourseName('');
    }
  }, [isAddingCourses]);

  // Handler pentru deschiderea/închiderea combobox-ului
  const handleComboboxOpenChange = (_, data) => {
    setIsComboboxOpen(data.open);
  };

  const isSaveButtonDisabled = () => {
    return !hasTempAddedCourses;
  };

  // Handler pentru deschiderea/închiderea combobox-ului pentru cursuri
  const handleCoursesComboboxOpenChange = (_, data) => {
    setIsCoursesComboboxOpen(data.open);
  };
  const handleLogout = () => {
    // Folosește metoda logout din apiService
    apiService.logout();
    
    // Redirecționează utilizatorul la pagina de login
    window.location.href = '/login'; // sau utilizați React Router: navigate('/login')
    
    // Închide meniul dropdown
    setIsMenuOpen(false);
  };
  const isSearchButtonDisabled = () => {
    return !selectedCourseType || !selectedCourseName;
  };
  
  return (
    <header className="calendar-header">
      <div className="header-left">
        <div className="menu-container" ref={menuRef}>
          <button className="menu-button" onClick={toggleMenu}>
            <Menu size={20} />
          </button>
          {isMenuOpen && (
            <div className="menu-dropdown">
              <div 
                className="menu-item" 
                onClick={() => handleMenuAction('harta_sali')}
              >
                <Building2 size={16} />
                <span>Harta sălilor</span>
              </div>
              <div 
                className="menu-item" 
                onClick={() => handleMenuAction('profile')}
              >
                <User size={16} />
                <span>Editează-ți profilul</span>
              </div>
              <div 
                className="menu-item" 
                onClick={() => handleMenuAction('logout')}
              >
                <LogOut size={16} />
                <span>Deconectează-te</span>
              </div>
            </div>
          )}
        </div>
        <div className="logo">
          <Calendar size={20} className="calendar-icon" />
          <span className="title">{title}</span>
        </div>
      </div>
      <div className="header-right">
       
        {isWeekView && !isEditMode && !isAddingCourses && (
           <button
              className="menu-button undo-button"
              title="Revino la orarul inițial"
              onClick={onUndo}
            >
              <Undo size={18} />
            </button>
        )}
         {isWeekView && !isEditMode && !isAddingCourses && (
          <button
            className="menu-button add-button"
            aria-label="Adaugă"
            title="Adaugă"
            onClick={onAddCourses}
          >
            <Plus size={18} />
          </button>
        )}
         {isWeekView && !isEditMode && !isAddingCourses && (
          <button
            className="menu-button edit-button"
            aria-label="Edit"
            title="Editează orarul"
            onClick={onEdit}
          >
            <Edit size={18} />
          </button>
        )}

        
        {isWeekView && isEditMode && (
          <div className="actions">
            <button
              className="menu-button save-button"
              title="Salvează modificările"
              onClick={onSave}
            >
              <Save size={18} /> 
            </button>
            <button
              className="menu-button cancel-edit-button"
              title="Renunță la modificări" 
              onClick={onCancel}
            >
              <X size={18} />
            </button>
          </div>
        )}
        
        {isWeekView && isAddingCourses && (
          <div className="add-container">
            <div className="course-selector-container">
              {/* Combobox pentru selectarea cursurilor */}
              <div className="course-selector">
                 <Combobox 
                  className="combobox"
                  placeholder="Selectează materia"
                  onOptionSelect={handleCourseNameChange}
                  value={selectedCourseName}
                  appearance="outline"
                  freeform={false}
                  open={isCoursesComboboxOpen}
                  onOpenChange={handleCoursesComboboxOpenChange}
                >
                  {availableCourses.map((option) => (
                    <Option 
                      key={option} 
                      text={option} 
                      value={option}
                    >
                      <div className="course-type-option-content">
                        <span>{option}</span>
                      </div>
                    </Option>
                  ))}
                </Combobox>

                {searchLoading && <div className="search-loading">Se încarcă...</div>}
              </div>
              
              {/* Combobox pentru tipul de curs */}
              <div className="course-type-selector">
                <Combobox 
                  className="combobox"
                  placeholder="Selectează tipul"
                  onOptionSelect={handleCourseTypeChange}
                  value={selectedCourseType}
                  appearance="outline"
                  freeform={false}
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
                        <div 
                          className="color-indicator" 
                          style={{ backgroundColor: option.color }}
                        ></div>
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
              aria-label="Caută cursuri"
              title={isSearchButtonDisabled() ? "Selectează un curs și un tip de curs" : "Caută cursuri"}
              onClick={onSearchCourses}
              disabled={isSearchButtonDisabled()}
            >
               <Search size={18} /> 
            </button>
             <button
              className={`menu-button save-add-button ${isSaveButtonDisabled() ? 'button-disabled' : ''}`}
              aria-label="Save Add Course"
              title={isSaveButtonDisabled() ? "Nu există cursuri adăugate pentru salvare" : "Salvează modificările"}
              onClick={onSaveAddedCourses}
              disabled={isSaveButtonDisabled()}
            >
              <Save size={18} /> 
            </button>
            <button
              className="menu-button cancel-add-button"
              aria-label="Cancel Add Course"
              title="Renunță la adăugare"
              onClick={onCancelAddCourse}
            >
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