import { AcademicPeriod, AcademicSchedule, AcademicWeekResult, Course, DayInfo, Holiday, EventData } from "../../../common";

// Mappings
export const dayMapping: Record<string, string> = {
  'Luni': 'Monday',
  'Marti': 'Tuesday',
  'Miercuri': 'Wednesday',
  'Joi': 'Thursday',
  'Vineri': 'Friday',
  'Sambata': 'Saturday',
  'Duminica': 'Sunday'
};

export const reverseMapping: Record<string, string> = {
  'Monday': 'Luni',
  'Tuesday': 'Marti',
  'Wednesday': 'Miercuri',
  'Thursday': 'Joi',
  'Friday': 'Vineri',
  'Saturday': 'Sambata',
  'Sunday': 'Duminica'
};

export const normalizeText = (text: string): string => {
  return text.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
};

export const dayNames: string[] = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];
export const fullDayNames: string[] = ['Luni', 'Marți', 'Miercuri', 'Joi', 'Vineri', 'Sâmbătă', 'Duminică'];
export const normalizedFullDayNames: string[] = fullDayNames.map(day => normalizeText(day));

export const monthNames: string[] = [
  'Ianuarie', 'Februarie', 'Martie', 'Aprilie', 'Mai', 'Iunie',
  'Iulie', 'August', 'Septembrie', 'Octombrie', 'Noiembrie', 'Decembrie'
];

export const getDaysInMonth = (year: number, month: number): number => {
  return new Date(year, month + 1, 0).getDate();
};

export const getFirstDayOfMonth = (year: number, month: number): number => {
  return new Date(year, month, 1).getDay();
};

export const getDaysArray = (currentDate: Date, onlyNeededWeeks: boolean = false): DayInfo[] => {
  const year: number = currentDate.getFullYear();
  const month: number = currentDate.getMonth();
  
  const daysInMonth: number = getDaysInMonth(year, month);
  const firstDay: number = getFirstDayOfMonth(year, month);
  
  const firstDayAdjusted: number = firstDay === 0 ? 6 : firstDay - 1;
  
  const daysArray: DayInfo[] = [];
  
  const prevMonthDays: number = getDaysInMonth(year, month - 1);
  for (let i = firstDayAdjusted - 1; i >= 0; i--) {
    daysArray.push({
      day: prevMonthDays - i,
      currentMonth: false,
      date: new Date(year, month - 1, prevMonthDays - i)
    });
  }
  
  for (let i = 1; i <= daysInMonth; i++) {
    daysArray.push({
      day: i,
      currentMonth: true,
      date: new Date(year, month, i),
      today: new Date(year, month, i).toDateString() === new Date().toDateString()
    });
  }
  
  if (onlyNeededWeeks) {
    const lastDayOfMonth: Date = new Date(year, month, daysInMonth);
    const lastDayOfWeekIndex: number = lastDayOfMonth.getDay() === 0 ? 6 : lastDayOfMonth.getDay() - 1;
    const daysToAdd: number = 6 - lastDayOfWeekIndex;
    
    for (let i = 1; i <= daysToAdd; i++) {
      daysArray.push({
        day: i,
        currentMonth: false,
        date: new Date(year, month + 1, i)
      });
    }
  } else {
    const remainingCells: number = 42 - daysArray.length;
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

export const getWeekDays = (currentDate: Date): Date[] => {
  const weekDays: Date[] = [];
  const startOfWeek: Date = new Date(currentDate);
  
  const day: number = startOfWeek.getDay();
  const diff: number = startOfWeek.getDate() - day + (day === 0 ? -6 : 1);
  startOfWeek.setDate(diff);
  
  for (let i = 0; i < 7; i++) {
    const date: Date = new Date(startOfWeek);
    date.setDate(date.getDate() + i);
    weekDays.push(date);
  }
  
  return weekDays;
};

export const getHoursArray = (): number[] => {
  const hours: number[] = [];
  for (let i = 8; i < 20; i++) {
    hours.push(i);
  }
  return hours;
};

export const formatHour = (hour: number): string => {
  return `${hour}:00`;
};

export const isInAcademicPeriod = (date: Date, academicPeriods: AcademicPeriod[]): boolean => {
  if (!academicPeriods || !Array.isArray(academicPeriods) || academicPeriods.length === 0) {
    return false;
  }

  const checkDate: Date = new Date(date);
  checkDate.setHours(0, 0, 0, 0);
  
  for (const period of academicPeriods) {
    const startDate: Date = new Date(period.start_date);
    const endDate: Date = new Date(period.end_date);
    
    startDate.setHours(0, 0, 0, 0);
    endDate.setHours(0, 0, 0, 0);
    
    if (checkDate >= startDate && checkDate <= endDate) {
      return true;
    }
  }
  
  return false;
};

export const isHoliday = (date: Date, holidays: Holiday[]): Holiday | null => {
  if (!holidays || !Array.isArray(holidays) || holidays.length === 0) {
    return null;
  }
  
  const year: number = date.getFullYear();
  const month: string = String(date.getMonth() + 1).padStart(2, '0');
  const day: string = String(date.getDate()).padStart(2, '0');
  const dateStr: string = `${year}-${month}-${day}`;
  
  return holidays.find(holiday => holiday.holiday_date === dateStr) || null;
};

export const getSemesterStartDate = (academicPeriods: AcademicPeriod[], semesterNumber: number): Date | null => {
  if (!academicPeriods || !Array.isArray(academicPeriods) || academicPeriods.length === 0) {
    return null;
  }
  
  const semesterPeriods: AcademicPeriod[] = academicPeriods.filter(period => period.semester === semesterNumber);
  
  if (semesterPeriods.length === 0) {
    return null;
  }
  
  semesterPeriods.sort((a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime());
  
  return new Date(semesterPeriods[0].start_date);
};

export const calculateAcademicWeek = (date: Date, academicPeriods: AcademicPeriod[]): AcademicWeekResult => {
  if (!date || !academicPeriods || !Array.isArray(academicPeriods) || academicPeriods.length === 0) {
    return { period: null, weekNumber: 0 };
  }
  
  const checkDate: Date = new Date(date);
  checkDate.setHours(12, 0, 0, 0);
  
  const sortedPeriods: AcademicPeriod[] = [...academicPeriods].sort((a, b) => 
    new Date(a.start_date).getTime() - new Date(b.start_date).getTime()
  );
  
  let currentPeriod: AcademicPeriod | null = null;
  let currentPeriodIndex: number = -1;
  
  for (let i = 0; i < sortedPeriods.length; i++) {
    const period: AcademicPeriod = sortedPeriods[i];
    const startDate: Date = new Date(period.start_date);
    const endDate: Date = new Date(period.end_date);
    
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
  
  const firstPeriod: AcademicPeriod = sortedPeriods[0];
  const firstSemesterStart: Date = new Date(firstPeriod.start_date);
  firstSemesterStart.setHours(0, 0, 0, 0);
  
  let accumulatedWeeks: number = 0;
  
  for (let i = 0; i < currentPeriodIndex; i++) {
    const prevPeriod: AcademicPeriod = sortedPeriods[i];
    const prevStart: Date = new Date(prevPeriod.start_date);
    const prevEnd: Date = new Date(prevPeriod.end_date);
    
    const startDayOfWeek: number = prevStart.getDay();
    let periodFirstMonday: Date = new Date(prevStart);
    
    if (startDayOfWeek !== 1) {
      if (startDayOfWeek === 0) {
        periodFirstMonday.setDate(prevStart.getDate() + 1);
      } else {
        periodFirstMonday.setDate(prevStart.getDate() - (startDayOfWeek - 1));
      }
    }
    
    const diffTime: number = prevEnd.getTime() - periodFirstMonday.getTime();
    const diffDays: number = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    const periodWeeks: number = Math.ceil((diffDays + 1) / 7);
    
    accumulatedWeeks += periodWeeks;
  }
  
  const periodStartDate: Date = new Date(currentPeriod.start_date);
  periodStartDate.setHours(0, 0, 0, 0);
  
  const dayOfWeek: number = periodStartDate.getDay();
  let firstMonday: Date = new Date(periodStartDate);
  
  if (dayOfWeek !== 1) {
    if (dayOfWeek === 0) {
      firstMonday.setDate(periodStartDate.getDate() + 1);
    } else {
      firstMonday.setDate(periodStartDate.getDate() - (dayOfWeek - 1));
    }
  }
  
  const diffTime: number = checkDate.getTime() - firstMonday.getTime();
  const diffDays: number = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  
  const currentPeriodWeek: number = Math.floor(diffDays / 7);
  
  const weekNumber: number = accumulatedWeeks + currentPeriodWeek + 1;
  
  return { period: currentPeriod, weekNumber };
};

export const calculateWeekParity = (date: Date, academicPeriods: AcademicPeriod[]): number => {
  if (!date || !academicPeriods || !Array.isArray(academicPeriods) || academicPeriods.length === 0) {
    return 0;
  }
  
  const { period, weekNumber }: AcademicWeekResult = calculateAcademicWeek(date, academicPeriods);
  
  if (!period) {
    return 0;
  }
  
  return (weekNumber % 2 === 1) ? 1 : 2;
};
export const getEventsForDate = (date: Date, events: EventData[], academicSchedule: AcademicSchedule | null = null): EventData[] => {
  if (!events || !Array.isArray(events) || events.length === 0) {
    return [];
  }
  
  const dayIndex: number = date.getDay() === 0 ? 6 : date.getDay() - 1;
  const dayOfWeek: string = fullDayNames[dayIndex];
  
  const normalizeDay = (day: string): string => day.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const normalizedDayOfWeek: string = normalizeDay(dayOfWeek);
  
  if (academicSchedule && academicSchedule.academic_periods && academicSchedule.holidays) {
    const { academic_periods, holidays }: AcademicSchedule = academicSchedule;
    
    if (isHoliday(date, holidays)) {
      return []; 
    }
    
    if (!isInAcademicPeriod(date, academic_periods)) {
      return [];
    }
    
    const weekParity: number = calculateWeekParity(date, academic_periods);
    
    if (weekParity === 0) {
      return [];
    }
    
    return events.filter(event => {
      const eventDay: string = event.day || '';
      const normalizedEventDay: string = normalizeDay(eventDay);
      
      if (normalizedEventDay === normalizedDayOfWeek) {
        if (event.frequency === 0) {
          return true;
        } else {
          return event.frequency === weekParity;
        }
      }
      return false;
    });
  } else {
    const semesterStartDate: Date = new Date(2025, 1, 24);
    
    const weeksSinceSemesterStart: number = Math.floor((date.getTime() - semesterStartDate.getTime()) / (7 * 24 * 60 * 60 * 1000));
    const weekParity: number = (weeksSinceSemesterStart % 2) + 1;
    
    return events.filter(event => {
      const eventDay: string = event.day || '';
      const normalizedEventDay: string = normalizeDay(eventDay);
      
      if (normalizedEventDay === normalizedDayOfWeek) {
        if (event.frequency === 0) {
          return true;
        } else if (event.frequency === 1 || event.frequency === 2) {
          return event.frequency === weekParity;
        }
      }
      return false;
    });
  }
};

// Main function for converting Course[] to EventData[] - FIXED
export const formatCoursesToEvents = (coursesData: Course[]): EventData[] => {
  if (!coursesData || !Array.isArray(coursesData)) return [];
  
  return coursesData.map(course => {
    let color: string;
    const courseTypeStr: string = course.course_type || '';
    const courseType: string = courseTypeStr.toLowerCase();
    
    switch (courseType) {
      case 'curs':
        color = '#4285F4';
        break;
      case 'seminar':
        color = '#0F9D58';
        break;
      case 'laborator':
      case 'lab':
        color = '#DB4437';
        break;
      default:
        color = '#F4B400';
    }

    const startTime: string = course.start_time || "00:00:00";
    const endTime: string = course.end_time || "00:00:00";
    
    const startTimeParts: number[] = startTime.split(':').map(Number);
    const endTimeParts: number[] = endTime.split(':').map(Number);
    
    const dayName: string = course.day || '';
    
    const frequency: number = typeof course.frequency !== 'undefined' ? parseInt(course.frequency.toString()) : 0;
    
    return {
      id: course.course_id || Math.random().toString(),
      title: course.name || 'Unnamed Course',
      courseType: course.course_type || 'Unknown',
      day: dayName,
      dayOfWeek: dayName,
      start_time: startTime,
      end_time: endTime,
      professor_id: course.professor_id || '',
      room_id: course.room_id || null,
      room_name: course.room_name,
      professor_name: course.professor_name,
      frequency: frequency,
      color: color,
      student_count: course.student_count,
      startHour: startTimeParts[0] || 0,
      startMinute: startTimeParts[1] || 0,
      endHour: endTimeParts[0] || 0,
      endMinute: endTimeParts[1] || 0,
      study_year_id: course.study_year_id,
      group_id: course.group_id,
      subgroup_id: course.subgroup_id
    };
  });
};

export const arrangeOverlappingEvents = (events: EventData[]): EventData[] => {
  if (!events.length) return events;
  
  events.sort((a, b) => {
    const aStart: number = a.startHour * 60 + a.startMinute;
    const bStart: number = b.startHour * 60 + b.startMinute;
    return aStart - bStart;
  });
  
  const processedEvents: EventData[] = [...events];
  
  const overlapGroups: EventData[][] = [];
  let currentGroup: EventData[] = [];
  
  for (let i = 0; i < processedEvents.length; i++) {
    const event: EventData = processedEvents[i];
    const eventStart: number = event.startHour * 60 + event.startMinute;
    
    if (currentGroup.length === 0) {
      currentGroup.push(event);
    } else {
      const lastEvent: EventData = currentGroup[currentGroup.length - 1];
      const lastEventEnd: number = lastEvent.endHour * 60 + lastEvent.endMinute;
      
      if (eventStart < lastEventEnd) {
        currentGroup.push(event);
      } else {
        if (currentGroup.length > 0) {
          overlapGroups.push([...currentGroup]);
        }
        currentGroup = [event];
      }
    }
  }
  
  if (currentGroup.length > 0) {
    overlapGroups.push(currentGroup);
  }
  
  for (const group of overlapGroups) {
    if (group.length === 1) {
      group[0].column = 0;
      group[0].columnCount = 1;
      continue;
    }
    
    const columns: EventData[][] = [];
    
    for (const event of group) {
      const eventStart: number = event.startHour * 60 + event.startMinute;
      const eventEnd: number = event.endHour * 60 + event.endMinute;
      
      let columnIndex: number = 0;
      let placed: boolean = false;
      
      while (!placed) {
        if (!columns[columnIndex]) {
          columns[columnIndex] = [event];
          event.column = columnIndex;
          placed = true;
        } else {
          let canPlace: boolean = true;
          
          for (const colEvent of columns[columnIndex]) {
            const colEventStart: number = colEvent.startHour * 60 + colEvent.startMinute;
            const colEventEnd: number = colEvent.endHour * 60 + colEvent.endMinute;
            
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
    
    const totalColumns: number = columns.length;
    for (const event of group) {
      event.columnCount = totalColumns;
    }
  }
  
  return processedEvents;
};