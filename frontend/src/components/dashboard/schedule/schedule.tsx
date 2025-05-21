import { useState, useEffect, useCallback } from 'react';
import './schedule.scss';
import apiService from '../../../server/apiService';
import CalendarHeader from '../header/header';
import CalendarToolbar from '../toolbar/toolbar';
import MonthView from '../views//mothView/monthView';
import WeekView from '../views/weekView/weekView';
import DayView from '../views/dayView/dayView';
import { formatCoursesToEvents } from '../utils/dateUtils';
import Swal from 'sweetalert2';

const Schedule = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewType, setViewType] = useState('week');
  const [courses, setCourses] = useState([]); 
  const [originalFormattedCourses, setOriginalFormattedCourses] = useState([]); 
  const [backendCourses, setBackendCourses] = useState([]); 
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
 
  const [groupInfo, setGroupInfo] = useState({ group: null, subgroup: null });

  const [isEditMode, setIsEditMode] = useState(false);
  const [academicSchedule, setAcademicSchedule] = useState(null);
  const [addingCourses, setAddingCourses] = useState(false);
  
  // State-uri pentru cursurile disponibile
  const [availableCourses, setAvailableCourses] = useState([]);
  const [selectedCourseType, setSelectedCourseType] = useState('');
  const [selectedCourseName, setSelectedCourseName] = useState('');
  const [searchLoading, setSearchLoading] = useState(false);


// Adaugă un nou state pentru a stoca cursurile temporare adăugate
const [tempAddedCourses, setTempAddedCourses] = useState([]);

  const [possibleAddCourses, setPossibleAddCourses] = useState([]);
  // Adaugă o nouă funcție pentru a obține structura anului academic
  const fetchAcademicSchedule = async () => {
    try {
      const scheduleData = await apiService.getAcademicSchedule();
      setAcademicSchedule(scheduleData);
    } catch (err) {
      console.error('Error fetching academic schedule:', err);
    }
  };
  
  // Funcție pentru a încărca informațiile despre grup
  const fetchGroupInfo = async () => {
    try {
      const result = await apiService.getUserSubgroupAndGroup();
      setGroupInfo(result);
    } catch (err) {
      console.error('Error fetching group and subgroup info:', err);
    }
  };


 const fetchUniqueNameCourses = async () => {
  try {
    setSearchLoading(true);
    const userDataFromStorage = apiService.getUserData();
    
    if (!userDataFromStorage.subgroup_id) {
      console.error('Subgroup ID not found in user data');
      return;
    }

    const availableCoursesData = await apiService.getAvailableCourses(userDataFromStorage.subgroup_id);
    setAvailableCourses(availableCoursesData);
  } catch (err) {
    console.error('Error fetching available courses:', err);
    Swal.fire({
      title: 'Eroare',
      text: 'Nu s-au putut încărca cursurile disponibile.',
      icon: 'error',
      confirmButtonText: 'OK'
    });
  } finally {
    setSearchLoading(false);
  }
};

  // Funcție pentru a încărca cursurile
  const fetchCourses = async () => {
    const userDataFromStorage = apiService.getUserData();
    
    if (!userDataFromStorage.subgroup_id) {
      console.error('Subgroup ID not found in user data');
      return;
    }
    
    setLoading(true);
    try {
      const coursesData = await apiService.getCoursesByStudentId(userDataFromStorage.student_id);
      
      setBackendCourses(coursesData);
      const formattedEvents = formatCoursesToEvents(coursesData);
      setCourses(formattedEvents);
      setOriginalFormattedCourses(formattedEvents); // Salvăm și o copie pentru cancel
      setError(null);
    } catch (err) {
      console.error('Error fetching courses:', err);
      setError('Nu s-au putut încărca cursurile. Vă rugăm încercați din nou.');
    } finally {
      setLoading(false);
    }
  };

  // Funcție pentru ștergerea unui curs
  const handleDeleteCourse = (courseId) => {
    // Actualizăm atât cursurile formatate cât și cele pentru backend
    setCourses(prevCourses => prevCourses.filter(course => course.id !== courseId));
    console.log(backendCourses);
    setBackendCourses(prevBackendCourses => 
      prevBackendCourses.filter(course => course.course_id !== courseId)
    );
  };

  // Intrare în modul de editare
  const toggleEditMode = () => {
    // Salvăm o copie a cursurilor formatate pentru a putea reveni la ele
    setOriginalFormattedCourses([...courses]);
    setIsEditMode(true);
  };
  
  const undoSchedule = () => {
    Swal.fire({
      title: 'Confirmare',
      text: 'Ești sigur/a că vrei să revii la orarul inițial?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Da',
      cancelButtonText: 'Nu',
      reverseButtons: true
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          const userData = apiService.getUserData();
          
          if (!userData || !userData.student_id) {
            throw new Error('Nu s-au găsit date despre student');
          }
          
          // Apelăm noua metodă pentru resetarea orarului
          const response = await apiService.resetCourseSubscriptions(userData.student_id);
          
          // Verificăm dacă resetarea a avut succes
          if (response.status === 200) {
            // Reîncărcăm cursurile pentru a avea datele actualizate
            await fetchCourses();
            
            Swal.fire(
              'Resetat!',
              'Orarul a fost resetat cu succes.',
              'success'
            );
          } else {
            Swal.fire(
              'Eroare',
              'Nu s-a putut reseta orarul: ' + (response.message || 'Eroare necunoscută'),
              'error'
            );
          }
        } catch (error) {
          console.error('Eroare la resetarea orarului:', error);
          Swal.fire(
            'Eroare',
            'A apărut o eroare la resetarea orarului. Vă rugăm încercați din nou.',
            'error'
          );
        }
      }
    });
  };
  
  // Salvare modificări
  const saveChanges = async () => {
    try {
      const userData = apiService.getUserData();
      
      if (!userData || !userData.student_id) {
        throw new Error('Nu s-au găsit date despre student');
      }
      
      // Trimitem lista actualizată de cursuri către backend
      const response = await apiService.updateCourseSubscriptions(
        userData.student_id, 
        backendCourses
      );
      
      // Verificăm dacă actualizarea a avut succes
      if (response.status === 200) {
        // Reîncărcăm cursurile pentru a avea datele actualizate
        await fetchCourses();
        
        // Afișăm mesaj de succes cu SweetAlert2
        Swal.fire({
          title: 'Succes!',
          text: 'Orarul a fost actualizat cu succes.',
          icon: 'success',
          confirmButtonText: 'OK'
        });
      } else {
        // Afișăm mesaj de eroare cu SweetAlert2
        Swal.fire({
          title: 'Eroare',
          text: 'Nu s-a putut actualiza orarul: ' + (response.message || 'Eroare necunoscută'),
          icon: 'error',
          confirmButtonText: 'OK'
        }).then(() => {
          window.location.reload();
        });
      }
    } catch (error) {
      console.error('Eroare la salvarea orarului:', error);
      
      // Afișăm mesaj de eroare cu SweetAlert2
      Swal.fire({
        title: 'Eroare',
        text: 'A apărut o eroare la salvarea modificărilor. Vă rugăm încercați din nou.',
        icon: 'error',
        confirmButtonText: 'OK'
      }).then(() => {
        window.location.reload();
      });
    } finally {
      setIsEditMode(false);
    }
  };
  
  // Anulare modificări
  const cancelEdit = () => {
    // Restaurăm versiunea originală a cursurilor formatate
    setCourses([...originalFormattedCourses]);
    setIsEditMode(false);
  };
 
  const handleAddCourse = () => {
    setAddingCourses(true);
    // Încărcăm cursurile disponibile când intrăm în modul de adăugare
    fetchUniqueNameCourses();
  };
  
  // const cancelAddCourse = () => {
  //   setAddingCourses(false);
  //   // Resetăm state-urile pentru combobox-uri
  //   setSelectedCourseType('');
  //   setSelectedCourseName('');
  //   setPossibleAddCourses([]);
  // };
  
  // Funcția pentru gestionarea selecției tipului de curs
  const handleCourseTypeChange = (courseType) => {
    setSelectedCourseType(courseType);
  };
  
  // Funcția pentru selectarea unui curs din combobox
  const handleCourseNameChange = (courseName) => {
    setSelectedCourseName(courseName);
  };

 const handleSearchCourses = async () => {
  try {
    setSearchLoading(true);
    const userData = apiService.getUserData();
      
    if (!userData || !userData.student_id) {
      throw new Error('Nu s-au găsit date despre student');
    }
    
    if (selectedCourseName && selectedCourseType) {
      console.log(`Căutare pentru: Curs=${selectedCourseName}, Tip=${selectedCourseType}`);
      
      const coursesData = await apiService.getWantedCourses(selectedCourseName, selectedCourseType, userData.subgroup_id);
      console.log(coursesData);
      
      if (coursesData && coursesData.length > 0) {
        const formattedPossibleCourses = formatCoursesToEvents(coursesData);
        console.log(formattedPossibleCourses);
        
        // Filtram cursurile pentru a elimina cele care există deja în orar
        const filteredCourses = formattedPossibleCourses.filter(possibleCourse => 
          !courses.some(existingCourse => existingCourse.id === possibleCourse.id)
        );
        
        // Verifică dacă există cursuri după filtrare
        if (filteredCourses.length > 0) {
          // Actualizăm state-ul cu cursurile găsite și filtrate
          setPossibleAddCourses(filteredCourses);
          
          
        } else {
          // Dacă toate cursurile găsite există deja în orar
          setPossibleAddCourses([]); // Resetăm array-ul pentru siguranță
          
          Swal.fire({
            title: 'Informație',
            text: 'Nu sunt alte sloturi disponibile pentru acest tip de căutare. Toate cursurile găsite există deja în orarul tău.',
            icon: 'info',
            confirmButtonText: 'OK'
          });
        }
      } else {
        // Dacă nu s-au găsit cursuri de la server
        setPossibleAddCourses([]);
        
        Swal.fire({
          title: 'Informație',
          text: 'Nu au fost găsite cursuri care să corespundă criteriilor selectate.',
          icon: 'info',
          confirmButtonText: 'OK'
        });
      }
    }
  } catch (error) {
    console.error('Eroare la căutarea cursurilor:', error);
    setPossibleAddCourses([]);
    
    Swal.fire({
      title: 'Eroare',
      text: 'A apărut o eroare la căutarea cursurilor. Vă rugăm încercați din nou.',
      icon: 'error',
      confirmButtonText: 'OK'
    });
  } finally {
    setSearchLoading(false);
  }
};


  useEffect(() => {
    fetchGroupInfo();
    fetchCourses();
    fetchAcademicSchedule(); 
  }, []);


  // Funcție pentru adăugarea cursurilor în mod temporar
const handleAddCourseToSchedule = (course_id) => {
  // Găsim cursul pe care vrem să-l adăugăm
  const courseToAdd = possibleAddCourses.find(course => course.id === course_id);
  
  if (!courseToAdd) {
    console.error("Cursul cu ID-ul", course_id, "nu a fost găsit în possibleAddCourses");
    return;
  }
  
  // Adăugăm cursul la lista temporară
  setTempAddedCourses(prev => [...prev, courseToAdd]);

  // Eliminăm cursul din lista de posibile adăugări
  setPossibleAddCourses(prev => prev.filter(c => c.id !== course_id));
};
const saveAddedCourses = async () => {
  try {
    // Adăugăm cursurile temporare la cursurile existente
    setCourses(prev => [...prev, ...tempAddedCourses]);
    
    // Transformăm cursurile temporare în formatul pentru backend
    const backendCoursesToAdd = tempAddedCourses.map(course => ({
      course_id: course.id,
      name: course.title,
      course_type: course.courseType,
      day: course.day,
      start_time: `${String(course.startHour).padStart(2, '0')}:${String(course.startMinute).padStart(2, '0')}:00`,
      end_time: `${String(course.endHour).padStart(2, '0')}:${String(course.endMinute).padStart(2, '0')}:00`,
      professor_id: course.professor_id,
      room_id: course.room_id,
      professor_name: course.professor_name,
      room_name: course.room_name,
      study_year_id: course.study_year_id,
      group_id: course.group_id,
      subgroup_id: course.subgroup_id,
      frequency: course.frequency || 0
    }));
    
    // Adăugăm la backendCourses
    setBackendCourses(prev => [...prev, ...backendCoursesToAdd]);
    
    // Trimitem lista actualizată către backend
    const userData = apiService.getUserData();
    
    if (!userData || !userData.student_id) {
      throw new Error('Nu s-au găsit date despre student');
    }
    
    const updatedBackendCourses = [...backendCourses, ...backendCoursesToAdd];
    
    const response = await apiService.updateCourseSubscriptions(
      userData.student_id, 
      updatedBackendCourses
    );
    
    if (response.status === 200) {
      // Reîncărcăm cursurile pentru a avea datele actualizate
      await fetchCourses();
      
      // Afișăm mesaj de succes
      Swal.fire({
        title: 'Succes!',
        text: 'Cursurile au fost adăugate în orarul tău.',
        icon: 'success',
        confirmButtonText: 'OK'
      });
      
      // Resetăm state-urile pentru adăugarea de cursuri
      setTempAddedCourses([]);
      setPossibleAddCourses([]);
      setAddingCourses(false);
      setSelectedCourseName('');
      setSelectedCourseType('');
    } else {
      throw new Error(response.message || 'Eroare necunoscută');
    }
  } catch (error) {
    console.error('Eroare la salvarea cursurilor:', error);
    
    Swal.fire({
      title: 'Eroare',
      text: 'A apărut o eroare la salvarea cursurilor. Vă rugăm încercați din nou.',
      icon: 'error',
      confirmButtonText: 'OK'
    });
  }
};

// Modifică funcția cancelAddCourse pentru a reseta și cursurile temporare
const cancelAddCourses = () => {
  setAddingCourses(false);
  // Resetăm state-urile pentru combobox-uri
  setSelectedCourseType('');
  setSelectedCourseName('');
  setPossibleAddCourses([]);
  // Resetăm cursurile temporare adăugate
  setTempAddedCourses([]);
  setTempAddedBackendCourses([]);
};

  const getHeaderTitle = () => {
    if (groupInfo.group && groupInfo.subgroup) {
      return `Orarul grupei ${groupInfo.group.group_number}, semigrupa: ${groupInfo.subgroup.subgroup_number}`;
    }
    return "Orar";
  };

  // Navigare calendar
  const goToPrevious = () => {
    const newDate = new Date(currentDate);
    if (viewType === 'month') {
      newDate.setMonth(newDate.getMonth() - 1);
    } else if (viewType === 'week') {
      newDate.setDate(newDate.getDate() - 7);
    } else if (viewType === 'day') {
      newDate.setDate(newDate.getDate() - 1);
    }
    setCurrentDate(newDate);
  };
  
  const goToNext = () => {
    const newDate = new Date(currentDate);
    if (viewType === 'month') {
      newDate.setMonth(newDate.getMonth() + 1);
    } else if (viewType === 'week') {
      newDate.setDate(newDate.getDate() + 7);
    } else if (viewType === 'day') {
      newDate.setDate(newDate.getDate() + 1);
    }
    setCurrentDate(newDate);
  };
  
  const goToToday = () => {
    setCurrentDate(new Date());
  };
  
  if (loading) {
    return <div className="loading-container">Se încarcă orarul...</div>;
  }
  
  if (error) {
    return <div className="error-container">{error}</div>;
  }
  
  return (
    <div className="calendar-container">
      {/* Header */}
      <CalendarHeader 
        title={getHeaderTitle()} 
        isWeekView={viewType === "week"}
        isEditMode={isEditMode}
        isAddingCourses={addingCourses}
        onEdit={toggleEditMode}
        onSave={saveChanges}
        onCancel={cancelEdit}
        onUndo={undoSchedule}
        onAddCourses={handleAddCourse}
        onCancelAddCourse={cancelAddCourses}
        onCourseTypeChange={handleCourseTypeChange}
        onCourseSelect={handleCourseNameChange}
        availableCourses={availableCourses}
        onSearchCourses={handleSearchCourses}
        searchLoading={searchLoading}
        onSaveAddedCourses={saveAddedCourses} 
        hasTempAddedCourses={tempAddedCourses.length > 0}
      />
      
      {/* Toolbar */}
      <CalendarToolbar 
        currentDate={currentDate}
        viewType={viewType}
        setViewType={setViewType}
        goToPrevious={goToPrevious}
        goToNext={goToNext}
        goToToday={goToToday}
      />
      
      {/* Calendar Content */}
      <div className="calendar-content">
        {viewType === 'month' && (
          <MonthView 
            currentDate={currentDate} 
            courses={courses} 
            academicSchedule={academicSchedule}
          />
        )}
        {viewType === 'week' && (
          <WeekView 
            currentDate={currentDate} 
            courses={[...courses, ...tempAddedCourses]} 
            isEditMode={isEditMode}
            onDeleteCourse={handleDeleteCourse}
            academicSchedule={academicSchedule}
            possibleAddCourses={possibleAddCourses}
            isAddingCourses={addingCourses}
            onAddCourse={handleAddCourseToSchedule}
          />
        )}
        {viewType === 'day' && (
          <DayView 
            currentDate={currentDate} 
            courses={courses}
            academicSchedule={academicSchedule}
          />
        )}
      </div>
    </div>
  );
};

export default Schedule;