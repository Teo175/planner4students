import { useState, useEffect} from 'react';
import './schedule.scss';
import apiService from '../../../api/server/apiService';
import CalendarHeader from '../header/header';
import CalendarToolbar from '../toolbar/toolbar';
import MonthView from '../views//mothView/monthView';
import WeekView from '../views/weekView/weekView';
import DayView from '../views/dayView/dayView';
import { formatCoursesToEvents } from '../utils/dateUtils';
import Swal from 'sweetalert2';
import { AcademicSchedule, Course, EventData } from '../../../common';

interface UserData {
  student_id: string;
  subgroup_id: string;
  [key: string]: any;
}

interface ApiResponse {
  status: number;
  message?: string;
  data?: any;
}

const Schedule = () => {
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [viewType, setViewType] = useState<'month' | 'week' | 'day'>('week');
  const [courses, setCourses] = useState<EventData[]>([]); 
  const [originalFormattedCourses, setOriginalFormattedCourses] = useState<EventData[]>([]); 
  const [backendCourses, setBackendCourses] = useState<Course[]>([]); 
  
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
 
  const [isEditMode, setIsEditMode] = useState<boolean>(false);
  const [academicSchedule, setAcademicSchedule] = useState<AcademicSchedule | null>(null);
  const [addingCourses, setAddingCourses] = useState<boolean>(false);
  
  const [availableCourses, setAvailableCourses] = useState<string[]>([]);
  const [selectedCourseType, setSelectedCourseType] = useState<string>('');
  const [selectedCourseName, setSelectedCourseName] = useState<string>('');
  const [searchLoading, setSearchLoading] = useState<boolean>(false);

  const [tempAddedCourses, setTempAddedCourses] = useState<EventData[]>([]);
  const [possibleAddCourses, setPossibleAddCourses] = useState<EventData[]>([]);

  const checkSemesterStart = (academicData: AcademicSchedule): void => {
    if (!academicData || !academicData.academic_periods) return;

    const today = new Date();
   // const todayStr = today.toISOString().split('T')[0]; 
    const todayStr = '2024-09-30';
    
    const allStartDates = academicData.academic_periods
      .map(period => period.start_date)
      .filter(date => date); 

    const earliestDate = allStartDates.length > 0 
      ? allStartDates.reduce((earliest, current) => current < earliest ? current : earliest)
      : null;

  
    if (earliestDate && todayStr === earliestDate) {
      const warningKey = `semester_warning_${todayStr}`;
      const hasShownWarning = localStorage.getItem(warningKey);

     if (!hasShownWarning) {
        Swal.fire({
          title: '🎓 Actualizare orar!',
          html: `
            <div style="text-align: left; margin: 20px 0;">
              <p><strong>Astăzi orarul a fost actualizat!</strong></p>
              <p><strong>Data: ${earliestDate}</strong></p>
              <br>
              <p>📅 <strong>Informație importantă:</strong></p>
              <p>• Orarul a fost actualizat cu cursurile noi</p>
              <p>• Cursurile tale pot fi diferite față de perioada anterioară</p>
              <p>• Dacă nu vezi cursurile așteptate, acestea vor fi actualizate automat în câteva momente</p>
              <br>
              <p>💡 <strong>Ce poți face:</strong></p>
              <p>• Verifică din nou orarul în câteva minute</p>
              <p>• Reîncarcă pagina dacă cursurile nu apar</p>
              <p>• Dacă persistă probleme, contactează administratorul</p>
            </div>
          `,
          icon: 'info',
          confirmButtonText: 'Am înțeles',
          confirmButtonColor: '#28a745',
          allowOutsideClick: false,
          customClass: {
            popup: 'semester-warning-popup'
          }
        });
        localStorage.setItem(warningKey, 'true');
      }
    }
  };

  const fetchAcademicSchedule = async (): Promise<void> => {
    try {
      const scheduleData = await apiService.getAcademicSchedule();
      
      if (scheduleData) {
        setAcademicSchedule(scheduleData);
        checkSemesterStart(scheduleData);
      } else {
        console.warn('Nu s-au putut încărca datele programului academic');
      }
    } catch (err) {
      console.error('Error fetching academic schedule:', err);
    }
  };
  
  const fetchUniqueNameCourses = async (): Promise<void> => {
    try {
      setSearchLoading(true);
      const userDataFromStorage: UserData | null = apiService.getUserData();
      
      if (!userDataFromStorage?.subgroup_id) {
        console.error('Subgroup ID not found in user data');
        setAvailableCourses([]);
        return;
      }

      const availableCoursesData = await apiService.getAvailableCourses(userDataFromStorage.subgroup_id);
      
      if (Array.isArray(availableCoursesData)) {
        setAvailableCourses(availableCoursesData);
      } else {
        console.warn('Format neașteptat pentru cursurile disponibile');
        setAvailableCourses([]);
      }
    } catch (err) {
      console.error('Error fetching available courses:', err);
      setAvailableCourses([]);
      Swal.fire({
        title: 'Eroare',
        text: 'Nu s-au putut încărca cursurile disponibile.',
        icon: 'error',
        confirmButtonText: 'OK',
        confirmButtonColor: '#28a745'
      });
    } finally {
      setSearchLoading(false);
    }
  };

  const fetchCourses = async (): Promise<void> => {
    const userDataFromStorage: UserData | null = apiService.getUserData();
    
    if (!userDataFromStorage?.student_id) {
      console.error('Student ID not found in user data');
      setError('Nu s-au găsit informațiile utilizatorului');
      setLoading(false);
      return;
    }
    
    setLoading(true);
    try {
      const coursesData = await apiService.getCoursesByStudentId(userDataFromStorage.student_id);
      
      if (Array.isArray(coursesData)) {
        setBackendCourses(coursesData);
        const formattedEvents = formatCoursesToEvents(coursesData);
        setCourses(formattedEvents);
        setOriginalFormattedCourses(formattedEvents); 
        setError(null);
      } else {
        console.warn('Format neașteptat pentru cursuri');
        setCourses([]);
        setBackendCourses([]);
      }
    } catch (err) {
      console.error('Error fetching courses:', err);
      setError('Nu s-au putut încărca cursurile. Vă rugăm încercați din nou.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCourse = (courseId: string): void => {
    setCourses(prevCourses => prevCourses.filter(course => course.id !== courseId));
    setBackendCourses(prevBackendCourses => 
      prevBackendCourses.filter(course => course.course_id !== courseId)
    );
  };

  const toggleEditMode = (): void => {
    setOriginalFormattedCourses([...courses]);
    setIsEditMode(true);
  };
  
  const undoSchedule = (): void => {
    Swal.fire({
      title: 'Confirmare',
      text: 'Ești sigur/a că vrei să revii la orarul inițial?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Da',
      cancelButtonText: 'Nu',
      confirmButtonColor: '#28a745',
      cancelButtonColor: '#dc3545',
      reverseButtons: true
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          const userData: UserData | null = apiService.getUserData();
          
          if (!userData?.student_id) {
            throw new Error('Nu s-au găsit date despre student');
          }
          
          const response: ApiResponse = await apiService.resetCourseSubscriptions(userData.student_id);
          
          if (response.status === 200) {
            await fetchCourses();
            Swal.fire({
              title: 'Resetat!',
              text: 'Orarul a fost resetat cu succes.',
              icon: 'success',
              confirmButtonText: 'OK',
              confirmButtonColor: '#28a745'
            });
          } else {
            Swal.fire({
              title: 'Eroare',
              text: 'Nu s-a putut reseta orarul: ' + (response.message || 'Eroare necunoscută'),
              icon: 'error',
              confirmButtonText: 'OK',
              confirmButtonColor: '#28a745'
            });
          }
        } catch (error) {
          console.error('Eroare la resetarea orarului:', error);
          Swal.fire({
            title: 'Eroare',
            text: 'A apărut o eroare la resetarea orarului. Vă rugăm încercați din nou.',
            icon: 'error',
            confirmButtonText: 'OK',
            confirmButtonColor: '#28a745'
          });
        }
      }
    });
  };
  
  const saveChanges = async (): Promise<void> => {
    try {
      const userData: UserData | null = apiService.getUserData();
      
      if (!userData?.student_id) {
        throw new Error('Nu s-au găsit date despre student');
      }
      
      const response: ApiResponse = await apiService.updateCourseSubscriptions(
        userData.student_id, 
        backendCourses
      );
      
      if (response.status === 200) {
        await fetchCourses();
        
        Swal.fire({
          title: 'Succes!',
          text: 'Orarul a fost actualizat cu succes.',
          icon: 'success',
          confirmButtonText: 'OK',
          confirmButtonColor: '#28a745'
        });
      } else {
        Swal.fire({
          title: 'Eroare',
          text: 'Nu s-a putut actualiza orarul: ' + (response.message || 'Eroare necunoscută'),
          icon: 'error',
          confirmButtonText: 'OK',
          confirmButtonColor: '#28a745'
        }).then(() => {
          window.location.reload();
        });
      }
    } catch (error) {
      console.error('Eroare la salvarea orarului:', error);
      
      Swal.fire({
        title: 'Eroare',
        text: 'A apărut o eroare la salvarea modificărilor. Vă rugăm încercați din nou.',
        icon: 'error',
        confirmButtonText: 'OK',
        confirmButtonColor: '#28a745'
      }).then(() => {
        window.location.reload();
      });
    } finally {
      setIsEditMode(false);
    }
  };
  
  const cancelEdit = (): void => {
    setCourses([...originalFormattedCourses]);
    setIsEditMode(false);
  };
 
  const handleAddCourse = (): void => {
    setAddingCourses(true);
    fetchUniqueNameCourses();
  };
  
  const handleCourseTypeChange = (courseType: string): void => {
    setSelectedCourseType(courseType);
  };
  
  const handleCourseNameChange = (courseName: string): void => {
    setSelectedCourseName(courseName);
  };

  const handleSearchCourses = async (): Promise<void> => {
    try {
      setSearchLoading(true);
      const userData: UserData | null = apiService.getUserData();
        
      if (!userData?.student_id || !userData?.subgroup_id) {
        throw new Error('Nu s-au găsit date despre student');
      }
      
      if (selectedCourseName && selectedCourseType) {
        console.log(`Căutare pentru: Curs=${selectedCourseName}, Tip=${selectedCourseType}`);
        
        const coursesData = await apiService.getWantedCourses(selectedCourseName, selectedCourseType, userData.subgroup_id);

        
        if (Array.isArray(coursesData) && coursesData.length > 0) {
          const formattedPossibleCourses = formatCoursesToEvents(coursesData);
         
          const filteredCourses = formattedPossibleCourses.filter(possibleCourse => 
            !courses.some(existingCourse => existingCourse.id === possibleCourse.id)
          );
          
          if (filteredCourses.length > 0) {
            setPossibleAddCourses(filteredCourses);
          } else {
            setPossibleAddCourses([]); 
            
            Swal.fire({
              title: 'Informație',
              text: 'Nu sunt alte sloturi disponibile pentru acest tip de căutare. Toate cursurile găsite există deja în orarul tău.',
              icon: 'info',
              confirmButtonText: 'OK',
              confirmButtonColor: '#28a745'
            });
          }
        } else {
          setPossibleAddCourses([]);
          
          Swal.fire({
            title: 'Informație',
            text: 'Nu au fost găsite cursuri care să corespundă criteriilor selectate.',
            icon: 'info',
            confirmButtonText: 'OK',
            confirmButtonColor: '#28a745'
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
        confirmButtonText: 'OK',
        confirmButtonColor: '#28a745'
      });
    } finally {
      setSearchLoading(false);
    }
  };

  useEffect(() => {
    const initializeData = async (): Promise<void> => {
      await fetchAcademicSchedule(); 
      await fetchCourses();
    };

    initializeData();
  }, []);

  const handleAddCourseToSchedule = (course_id: string): void => {
    const courseToAdd = possibleAddCourses.find(course => course.id === course_id);
    
    if (!courseToAdd) {
      console.error("Cursul cu ID-ul", course_id, "nu a fost găsit în possibleAddCourses");
      return;
    }
    
    setTempAddedCourses(prev => [...prev, courseToAdd]);

    setPossibleAddCourses(prev => prev.filter(c => c.id !== course_id));
  };

  const saveAddedCourses = async (): Promise<void> => {
    try {
      setCourses(prev => [...prev, ...tempAddedCourses]);
      
      const backendCoursesToAdd: Course[] = tempAddedCourses.map(course => ({
        course_id: course.id,
        name: course.title,
        course_type: course.courseType,
        day: course.day || '',
        start_time: `${String(course.startHour).padStart(2, '0')}:${String(course.startMinute).padStart(2, '0')}:00`,
        end_time: `${String(course.endHour).padStart(2, '0')}:${String(course.endMinute).padStart(2, '0')}:00`,
        professor_id: (course as any).professor_id || '',
        room_id: (course as any).room_id || null,
        professor_name: course.professor_name || '',
        room_name: course.room_name || '',
        study_year_id: (course as any).study_year_id || '',
        group_id: (course as any).group_id || null,
        subgroup_id: (course as any).subgroup_id || null,
        frequency: (course as any).frequency || 0,
        student_count: course.student_count || 0
      }));
      
      setBackendCourses(prev => [...prev, ...backendCoursesToAdd]);
      
      const userData: UserData | null = apiService.getUserData();
      
      if (!userData?.student_id) {
        throw new Error('Nu s-au găsit date despre student');
      }
      
      const updatedBackendCourses = [...backendCourses, ...backendCoursesToAdd];
      
      const response: ApiResponse = await apiService.updateCourseSubscriptions(
        userData.student_id, 
        updatedBackendCourses
      );
      
      if (response.status === 200) {
        await fetchCourses();
        
        Swal.fire({
          title: 'Succes!',
          text: 'Cursurile au fost adăugate în orarul tău.',
          icon: 'success',
          confirmButtonText: 'OK',
          confirmButtonColor: '#28a745'
        });
        
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
        confirmButtonText: 'OK',
        confirmButtonColor: '#28a745'
      });
    }
  };

  const cancelAddCourses = (): void => {
    setAddingCourses(false);
    setSelectedCourseType('');
    setSelectedCourseName('');
    setPossibleAddCourses([]);
    setTempAddedCourses([]);
  };

  
  const goToPrevious = (): void => {
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
  
  const goToNext = (): void => {
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
  
  const goToToday = (): void => {
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