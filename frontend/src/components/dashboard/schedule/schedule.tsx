// src/components/Calendar/Schedule.jsx
import React, { useState, useEffect } from 'react';
import './schedule.scss';
import apiService from '../../../server/apiService';
import CalendarHeader from '../header/header';
import CalendarToolbar from '../toolbar/toolbar';
import MonthView from '../views//mothView/monthView';
import WeekView from '../views/weekView/weekView';
import DayView from '../views/dayView/dayView';
import { formatCoursesToEvents } from '../utils/dateUtils';

const Schedule = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewType, setViewType] = useState('week'); // 'month', 'week', 'day'
  
  // Stări pentru date
  const [courses, setCourses] = useState([]); // Cursuri formatate pentru afișare
  const [originalFormattedCourses, setOriginalFormattedCourses] = useState([]); // Copie a cursurilor formatate
  const [backendCourses, setBackendCourses] = useState([]); // Cursuri în format backend
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
 
  const [groupInfo, setGroupInfo] = useState({ group: null, subgroup: null });

  const [isEditMode, setIsEditMode] = useState(false);
  const [academicSchedule, setAcademicSchedule] = useState(null);

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
      console.log("Raw courses data:", coursesData);
      
      // Convert course data to event format
      setBackendCourses(coursesData);
      const formattedEvents = formatCoursesToEvents(coursesData);
      console.log("Formatted events:", formattedEvents);
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
        
        // Afișăm mesaj de succes
        alert('Orarul a fost actualizat cu succes!');
      } else {
        // Afișăm mesaj de eroare
        alert('Nu s-a putut actualiza orarul: ' + (response.message || 'Eroare necunoscută'));
        window.location.reload();
      }
    } catch (error) {
      console.error('Eroare la salvarea orarului:', error);
      alert('A apărut o eroare la salvarea modificărilor. Vă rugăm încercați din nou.');
      window.location.reload();
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

  useEffect(() => {
    fetchGroupInfo();
    fetchCourses();
    fetchAcademicSchedule(); 
  }, []);

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
       onEdit={toggleEditMode}
       onSave={saveChanges}
       onCancel={cancelEdit}
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
            courses={courses} 
            isEditMode={isEditMode}
            onDeleteCourse={handleDeleteCourse}
            academicSchedule={academicSchedule}
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