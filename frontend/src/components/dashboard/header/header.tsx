import { Combobox, Option } from '@fluentui/react-components';
import { Calendar, Edit, Menu, Plus, Save, Search, Undo, X } from 'lucide-react';
import { useEffect, useState } from 'react';

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
  const isSearchButtonDisabled = ()=>
    {
      return !selectedCourseType || !selectedCourseName;
    }
  
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
                  onOpenChange={handleCoursesComboboxOpenChange }
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