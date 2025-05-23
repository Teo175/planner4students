// src/components/Calendar/utils/dateUtils.js
export const dayMapping = {
  'Luni': 'Monday',
  'Marti': 'Tuesday',
  'Miercuri': 'Wednesday',
  'Joi': 'Thursday',
  'Vineri': 'Friday',
  'Sambata': 'Saturday',
  'Duminica': 'Sunday'
};

export const reverseMapping = {
  'Monday': 'Luni',
  'Tuesday': 'Marti',
  'Wednesday': 'Miercuri',
  'Thursday': 'Joi',
  'Friday': 'Vineri',
  'Saturday': 'Sambata',
  'Sunday': 'Duminica'
};

/**
 * Normalizează un text eliminând diacriticele
 * @param {string} text - Textul de normalizat
 * @returns {string} - Textul normalizat
 */

export const normalizeText = (text) => {
  return text.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
};
export const dayNames = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];
export const fullDayNames = ['Luni', 'Marți', 'Miercuri', 'Joi', 'Vineri', 'Sâmbătă', 'Duminică'];
export const normalizedFullDayNames = fullDayNames.map(day => normalizeText(day));

export const monthNames = [
  'Ianuarie', 'Februarie', 'Martie', 'Aprilie', 'Mai', 'Iunie',
  'Iulie', 'August', 'Septembrie', 'Octombrie', 'Noiembrie', 'Decembrie'
];

export const getDaysInMonth = (year, month) => {
  return new Date(year, month + 1, 0).getDate();
};

export const getFirstDayOfMonth = (year, month) => {
  return new Date(year, month, 1).getDay();
};

export const getDaysArray = (currentDate, onlyNeededWeeks = false) => {
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);
  
  // Adjust for Sunday as first day (0)
  const firstDayAdjusted = firstDay === 0 ? 6 : firstDay - 1;
  
  const daysArray = [];
  
  // Previous month days
  const prevMonthDays = getDaysInMonth(year, month - 1);
  for (let i = firstDayAdjusted - 1; i >= 0; i--) {
    daysArray.push({
      day: prevMonthDays - i,
      currentMonth: false,
      date: new Date(year, month - 1, prevMonthDays - i)
    });
  }
  
  // Current month days
  for (let i = 1; i <= daysInMonth; i++) {
    daysArray.push({
      day: i,
      currentMonth: true,
      date: new Date(year, month, i),
      today: new Date(year, month, i).toDateString() === new Date().toDateString()
    });
  }
  
  // Calculate how many weeks we need to show
  if (onlyNeededWeeks) {
    const totalDaysShown = daysArray.length;
    const lastDayOfMonth = new Date(year, month, daysInMonth);
    const lastDayOfWeekIndex = lastDayOfMonth.getDay() === 0 ? 6 : lastDayOfMonth.getDay() - 1;
    const daysToAdd = 6 - lastDayOfWeekIndex;
    
    // Add only the necessary days from next month
    for (let i = 1; i <= daysToAdd; i++) {
      daysArray.push({
        day: i,
        currentMonth: false,
        date: new Date(year, month + 1, i)
      });
    }
  } else {
    // Add days to complete 6 rows (original behavior)
    const remainingCells = 42 - daysArray.length; // 6 rows * 7 columns = 42 cells
    for (let i = 1; i <= remainingCells; i++) {
      daysArray.push({
        day: i,
        currentMonth: false,
        date: new Date(year, month + 1, i)
      });
    }
  }
  return daysArray;
};
export const getWeekDays = (currentDate) => {
  const weekDays = [];
  const startOfWeek = new Date(currentDate);
  
  // Find Monday of the current week
  const day = startOfWeek.getDay();
  const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1); // Adjust for Sunday
  startOfWeek.setDate(diff);
  
  for (let i = 0; i < 7; i++) {
    const date = new Date(startOfWeek);
    date.setDate(date.getDate() + i);
    weekDays.push(date);
  }
  
  return weekDays;
};

export const getHoursArray = () => {
  const hours = [];
  for (let i = 8; i < 20; i++) { // Show hours from 8 AM to 8 PM
    hours.push(i);
  }
  return hours;
};

export const formatHour = (hour) => {
  return `${hour}:00`;
};

/**
 * Verifică dacă o dată se află într-o perioadă academică
 * @param {Date} date - Data de verificat
 * @param {Array} academicPeriods - Lista de perioade academice
 * @returns {Boolean} - True dacă data se află într-o perioadă academică
 */
export const isInAcademicPeriod = (date, academicPeriods) => {
  if (!academicPeriods || !Array.isArray(academicPeriods) || academicPeriods.length === 0) {
    return false;
  }

  const checkDate = new Date(date);
  checkDate.setHours(0, 0, 0, 0);
  
  for (const period of academicPeriods) {
    const startDate = new Date(period.start_date);
    const endDate = new Date(period.end_date);
    
    startDate.setHours(0, 0, 0, 0);
    endDate.setHours(0, 0, 0, 0);
    
    if (checkDate >= startDate && checkDate <= endDate) {
      return true;
    }
  }
  
  return false;
};

/**
 * Verifică dacă o dată este o zi liberă
 * @param {Date} date - Data de verificat
 * @param {Array} holidays - Lista de zile libere
 * @returns {Object|null} - Obiectul zilei libere sau null dacă nu este zi liberă
 */
export const isHoliday = (date, holidays) => {
  if (!holidays || !Array.isArray(holidays) || holidays.length === 0) {
    return null;
  }
  
  // Formatăm data manual folosind data locală
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const dateStr = `${year}-${month}-${day}`;
  
  // Folosim find în loc de some pentru a returna obiectul zilei libere
  return holidays.find(holiday => holiday.holiday_date === dateStr) || null;
};
/**
 * Obține data de început a semestrului din perioadele academice
 * @param {Array} academicPeriods - Lista de perioade academice
 * @param {Number} semesterNumber - Numărul semestrului (1 sau 2)
 * @returns {Date|null} - Data de început a semestrului sau null
 */
export const getSemesterStartDate = (academicPeriods, semesterNumber) => {
  if (!academicPeriods || !Array.isArray(academicPeriods) || academicPeriods.length === 0) {
    return null;
  }
  
  // Filtrează perioadele pentru semestrul specificat
  const semesterPeriods = academicPeriods.filter(period => period.semester === semesterNumber);
  
  if (semesterPeriods.length === 0) {
    return null;
  }
  
  // Sortează perioadele după data de început și ia prima
  semesterPeriods.sort((a, b) => new Date(a.start_date) - new Date(b.start_date));
  
  return new Date(semesterPeriods[0].start_date);
};

/**
 * Calculează numărul săptămânii continuu între perioadele academice
 * @param {Date} date - Data pentru care se calculează
 * @param {Array} academicPeriods - Lista de perioade academice
 * @returns {Object} - Obiect care conține perioada academică și numărul săptămânii
 */
export const calculateAcademicWeek = (date, academicPeriods) => {
  if (!date || !academicPeriods || !Array.isArray(academicPeriods) || academicPeriods.length === 0) {
    return { period: null, weekNumber: 0 };
  }
  
  const checkDate = new Date(date);
  checkDate.setHours(12, 0, 0, 0);
  
  // Sortăm perioadele academice după data de început
  const sortedPeriods = [...academicPeriods].sort((a, b) => 
    new Date(a.start_date) - new Date(b.start_date)
  );
  
  // Găsim perioada academică curentă
  let currentPeriod = null;
  let currentPeriodIndex = -1;
  
  for (let i = 0; i < sortedPeriods.length; i++) {
    const period = sortedPeriods[i];
    const startDate = new Date(period.start_date);
    const endDate = new Date(period.end_date);
    
    startDate.setHours(0, 0, 0, 0);
    endDate.setHours(0, 0, 0, 0);
    
    if (checkDate >= startDate && checkDate <= endDate) {
      currentPeriod = period;
      currentPeriodIndex = i;
      break;
    }
  }
  
  if (!currentPeriod) {
    return { period: null, weekNumber: 0 };
  }
  
  // Prima perioadă din semestru
  const firstPeriod = sortedPeriods[0];
  const firstSemesterStart = new Date(firstPeriod.start_date);
  firstSemesterStart.setHours(0, 0, 0, 0);
  
  // Numărul de săptămâni acumulate în perioadele anterioare
  let accumulatedWeeks = 0;
  
  // Calculăm săptămânile acumulate din perioadele anterioare
  for (let i = 0; i < currentPeriodIndex; i++) {
    const prevPeriod = sortedPeriods[i];
    const prevStart = new Date(prevPeriod.start_date);
    const prevEnd = new Date(prevPeriod.end_date);
    
    // Găsim prima zi de luni a perioadei (sau ziua de început dacă e luni)
    const startDayOfWeek = prevStart.getDay(); // 0 = Duminică, 1 = Luni, ..., 6 = Sâmbătă
    let periodFirstMonday = new Date(prevStart);
    
    if (startDayOfWeek !== 1) { // Dacă nu e luni
      if (startDayOfWeek === 0) { // Duminică
        periodFirstMonday.setDate(prevStart.getDate() + 1);
      } else { // Marți-Sâmbătă
        periodFirstMonday.setDate(prevStart.getDate() - (startDayOfWeek - 1));
      }
    }
    
    // Calculăm numărul de săptămâni complete în această perioadă
    const diffTime = prevEnd - periodFirstMonday;
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    const periodWeeks = Math.ceil((diffDays + 1) / 7);
    
    accumulatedWeeks += periodWeeks;
  }
  
  // Calculăm numărul săptămânii în cadrul perioadei curente
  const periodStartDate = new Date(currentPeriod.start_date);
  periodStartDate.setHours(0, 0, 0, 0);
  
  // Găsim prima zi de luni a perioadei curente
  const dayOfWeek = periodStartDate.getDay(); // 0 = Duminică, 1 = Luni, ..., 6 = Sâmbătă
  let firstMonday = new Date(periodStartDate);
  
  if (dayOfWeek !== 1) { // Dacă nu e luni
    if (dayOfWeek === 0) { // Duminică
      firstMonday.setDate(periodStartDate.getDate() + 1);
    } else { // Marți-Sâmbătă
      firstMonday.setDate(periodStartDate.getDate() - (dayOfWeek - 1));
    }
  }
  
  // Calculăm diferența în zile între data curentă și prima zi de luni
  const diffTime = checkDate - firstMonday;
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  
  // Săptămâna în cadrul perioadei curente (indexată de la 0)
  const currentPeriodWeek = Math.floor(diffDays / 7);
  
  // Numărul total al săptămânii (prima săptămână = 1)
  const weekNumber = accumulatedWeeks + currentPeriodWeek + 1;
  
  return { period: currentPeriod, weekNumber };
};

/**
 * Calculează paritatea săptămânii pentru o dată specificată în cadrul perioadelor academice
 * @param {Date} date - Data pentru care se calculează
 * @param {Array} academicPeriods - Lista de perioade academice
 * @returns {Number} - 0 dacă nu este în perioadă academică, 1 pentru săptămâni impare, 2 pentru săptămâni pare
 */
export const calculateWeekParity = (date, academicPeriods) => {
  if (!date || !academicPeriods || !Array.isArray(academicPeriods) || academicPeriods.length === 0) {
    return 0;
  }
  
  const { period, weekNumber } = calculateAcademicWeek(date, academicPeriods);
  
  if (!period) {
    return 0; // Nu este în perioadă academică
  }
  
  // Săptămâna 1 este impară (1), săptămâna 2 este pară (2), etc.
  return (weekNumber % 2 === 1) ? 1 : 2;
};
export const getEventsForDate = (date, courses, academicSchedule = null) => {
  // Verifică dacă există cursuri
  if (!courses || !Array.isArray(courses) || courses.length === 0) {
    return [];
  }
  
  // Get the Romanian day name for this date
  const dayIndex = date.getDay() === 0 ? 6 : date.getDay() - 1;
  const dayOfWeek = fullDayNames[dayIndex];
  
  // Normalizare nume zi (eliminare diacritice)
  const normalizeDay = (day) => day.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const normalizedDayOfWeek = normalizeDay(dayOfWeek);
  
  // Dacă avem date despre structura academică, le folosim pentru filtrare avansată
  if (academicSchedule && academicSchedule.academic_periods && academicSchedule.holidays) {
    const { academic_periods, holidays } = academicSchedule;
    
    // 1. Verifică dacă data este o zi liberă
    if (isHoliday(date, holidays)) {
      
      console.log(date);
      return []; 
    }
    
    // 2. Verifică dacă data este într-o perioadă academică
    if (!isInAcademicPeriod(date, academic_periods)) {
      return []; // Nu afișăm cursuri în afara perioadelor academice
    }
    
    // 3. Calculează paritatea săptămânii în cadrul perioadei academice
    const weekParity = calculateWeekParity(date, academic_periods);
    
    if (weekParity === 0) {
      return []; // Nu suntem într-o perioadă academică
    }
    
    // 4. Filtrează cursurile pentru ziua și paritatea curentă
    return courses.filter(course => {
      // Verifică dacă cursul are loc în această zi a săptămânii
      const courseDay = course.dayOfWeek || course.day || '';
      const normalizedCourseDay = normalizeDay(courseDay);
      
      if (normalizedCourseDay === normalizedDayOfWeek) {
        // Verifică frecvența:
        // 0 = săptămânal (în fiecare săptămână)
        // 1 = săptămâni impare
        // 2 = săptămâni pare
        if (course.frequency === 0) {
          return true; // Cursul are loc în fiecare săptămână
        } else {
          // Verifică dacă paritatea săptămânii coincide cu frecvența cursului
          return course.frequency === weekParity;
        }
      }
      return false;
    });
  } else {
    // Folosim implementarea originală dacă nu avem date academice
    // Define semester start date (24.02.2025)
    const semesterStartDate = new Date(2025, 1, 24); // Month is 0-indexed, so 1 = February
    
    // Calculate how many weeks have passed since the semester start
    const weeksSinceSemesterStart = Math.floor((date - semesterStartDate) / (7 * 24 * 60 * 60 * 1000));
    const weekParity = (weeksSinceSemesterStart % 2) + 1; // Will be 1 or 2
    
    // Filter courses that occur on this day of the week
    return courses.filter(course => {
      // First check if the day matches
      const courseDay = course.dayOfWeek || course.day || '';
      const normalizedCourseDay = normalizeDay(courseDay);
      
      if (normalizedCourseDay === normalizedDayOfWeek) {
        // Check frequency:
        // 0 = weekly (every week)
        // 1 = odd weeks from start date
        // 2 = even weeks from start date
        if (course.frequency === 0) {
          return true; // Course happens every week
        } else if (course.frequency === 1 || course.frequency === 2) {
          // Check if current week parity matches the frequency
          return course.frequency === weekParity;
        }
      }
      return false;
    });
  }
};
// src/components/Calendar/utils/eventUtils.js
export const formatCoursesToEvents = (coursesData) => {
  if (!coursesData || !Array.isArray(coursesData)) return [];
  
  // console.log("Raw course data for formatting:", coursesData);
  
  return coursesData.map(course => {
    // Generate color based on course type
    let color;
    const courseTypeStr = course.course_type || course.courseType || '';
    const courseType = courseTypeStr.toLowerCase();
    
    switch (courseType) {
      case 'curs':
        color = '#4285F4'; // Blue
        break;
      case 'seminar':
        color = '#0F9D58'; // Green
        break;
      case 'laborator':
      case 'lab':
        color = '#DB4437'; // Red
        break;
      default:
        color = '#F4B400'; // Yellow
    }

    // Parse times (assuming format "HH:MM:SS")
    const startTime = course.start_time || "00:00:00";
    const endTime = course.end_time || "00:00:00";
    
    const startTimeParts = startTime.split(':').map(Number);
    const endTimeParts = endTime.split(':').map(Number);
    
    // Get day name consistently
    const dayName = course.day || course.dayOfWeek || '';
    
    // For frequency, use the provided value - 0 = weekly, 1 = odd weeks, 2 = even weeks
    const frequency = typeof course.frequency !== 'undefined' ? parseInt(course.frequency) : 0;
    
    // Create event object for the calendar
    return {
      id: course.course_id || course.id || Math.random().toString(),
      title: course.name || course.title || 'Unnamed Course',
      courseType: course.course_type || course.courseType || 'Unknown',
      day: dayName,
      dayOfWeek: dayName, // For consistency, use the same value for both properties
      start_time: startTime,
      end_time: endTime,
      professorId: course.professor_id || course.professorId || '',
      roomId: course.room_id || course.roomId || '',
      room_name: course.room_name,
      professor_name: course.professor_name,
      frequency: frequency, // 0 = weekly, 1 = odd weeks, 2 = even weeks
      color: color,
      // These properties are needed for the calendar's event rendering
      startHour: startTimeParts[0] || 0,
      startMinute: startTimeParts[1] || 0,
      endHour: endTimeParts[0] || 0,
      endMinute: endTimeParts[1] || 0
    };
  });
};

export const arrangeOverlappingEvents = (events, firstHour) => {
  if (!events.length) return events;
  
  // Sortăm evenimentele după ora de început
  events.sort((a, b) => {
    const aStart = a.startHour * 60 + a.startMinute;
    const bStart = b.startHour * 60 + b.startMinute;
    return aStart - bStart;
  });
  
  // Creăm un array de evenimente procesate
  const processedEvents = [...events];
  
  // Structură pentru a ține evidența intervalelor ocupate
  const timeSlots = [];
  
  // Grupăm evenimentele care se suprapun în timp
  const overlapGroups = [];
  let currentGroup = [];
  
  for (let i = 0; i < processedEvents.length; i++) {
    const event = processedEvents[i];
    const eventStart = event.startHour * 60 + event.startMinute;
    const eventEnd = event.endHour * 60 + event.endMinute;
    
    // Dacă e primul eveniment sau se suprapune cu grupul curent
    if (currentGroup.length === 0) {
      currentGroup.push(event);
    } else {
      // Verificăm dacă acest eveniment se suprapune cu ultima adăugare în grup
      const lastEvent = currentGroup[currentGroup.length - 1];
      const lastEventEnd = lastEvent.endHour * 60 + lastEvent.endMinute;
      
      if (eventStart < lastEventEnd) {
        // Se suprapune, adaugă la grupul curent
        currentGroup.push(event);
      } else {
        // Nu se suprapune, finalizează grupul curent și începe unul nou
        if (currentGroup.length > 0) {
          overlapGroups.push([...currentGroup]);
        }
        currentGroup = [event];
      }
    }
  }
  
  // Adaugă ultimul grup dacă există
  if (currentGroup.length > 0) {
    overlapGroups.push(currentGroup);
  }
  
  // Pentru fiecare grup, calculează layout-ul
  for (const group of overlapGroups) {
    // Dacă există doar un eveniment în grup, va ocupa tot spațiul
    if (group.length === 1) {
      group[0].column = 0;
      group[0].columnCount = 1;
      continue;
    }
    
    // Algoritm de layout pentru evenimente suprapuse
    const columns = [];
    
    for (const event of group) {
      const eventStart = event.startHour * 60 + event.startMinute;
      const eventEnd = event.endHour * 60 + event.endMinute;
      
      // Găsește prima coloană disponibilă
      let columnIndex = 0;
      let placed = false;
      
      while (!placed) {
        if (!columns[columnIndex]) {
          // Creează o nouă coloană
          columns[columnIndex] = [event];
          event.column = columnIndex;
          placed = true;
        } else {
          // Verifică dacă se poate adăuga în această coloană
          let canPlace = true;
          
          for (const colEvent of columns[columnIndex]) {
            const colEventStart = colEvent.startHour * 60 + colEvent.startMinute;
            const colEventEnd = colEvent.endHour * 60 + colEvent.endMinute;
            
            // Dacă se suprapune cu vreun eveniment din coloană
            if (eventStart < colEventEnd && eventEnd > colEventStart) {
              canPlace = false;
              break;
            }
          }
          
          if (canPlace) {
            columns[columnIndex].push(event);
            event.column = columnIndex;
            placed = true;
          } else {
            columnIndex++;
          }
        }
      }
    }
    
    // Actualizează numărul de coloane pentru toate evenimentele din grup
    const totalColumns = columns.length;
    for (const event of group) {
      event.columnCount = totalColumns;
    }
  }
  
  return processedEvents;
};