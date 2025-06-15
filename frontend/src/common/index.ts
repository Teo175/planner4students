export interface ResponseCache {
  [key: string]: any;
}

export interface CompleteStudentData {
  student_id: string;
  first_name: string;
  last_name: string;
  email: string;
  subgroup_id: string;
  subgroup: string;
  group: string;
  year: number;
  language: string;
  specialization: string;
}

export interface StudyOptions {
  uniqueNames: string[];
  uniqueLanguages: string[];
  allSpecializations: {
    specialization_id: string;
    name: string;
    language: string;
  }[];
}

export interface StudyYear {
  study_year_id: string;
  year: number;
  specialization_id: string;
}

export interface Specialization {
  specialization_id: string;
  name: string;
  language: string;
}

export interface Group {
  group_id: string;
  group_number: number;
  study_year_id: string;
}

export interface Subgroup {
  subgroup_id: string;
  subgroup_number: number;
  group_id: string;
}

export interface Student { 
  student_id: string;
  first_name: string;
  last_name: string;
  email: string;
  password: string;
  subgroup_id: number;
}

// Calendar and Date Types
export interface DayInfo {
  day: number;
  currentMonth: boolean;
  date: Date;
  today?: boolean;
}

// Academic Schedule Types
export interface AcademicPeriod {
  id: string;
  start_date: string;
  end_date: string;
  period_type: string;
  semester: number;
  target: string | null;
}

export interface Holiday {
  id: string;
  holiday_date: string;
  name: string;
}

export interface AcademicSchedule {
  academic_periods: AcademicPeriod[];
  holidays: Holiday[];
  current_semester: number;
  is_terminal: boolean;
}

export interface AcademicWeekResult {
  period: AcademicPeriod | null;
  weekNumber: number;
}

// Course Types - Unified interface
export interface Course {
  course_id: string;
  name: string;
  professor_id: string;
  course_type: string; // curs/seminar/lab
  study_year_id: string;
  group_id: string | null;
  subgroup_id: string | null;
  day: string;
  start_time: string; // Time would be represented as a string in the format "HH:MM:SS"
  end_time: string;
  room_id: string | null;
  frequency: number;
  student_count: number;
  professor_name?: string;
  room_name?: string;
  
  // Optional fields for related entities if your API returns them
  professor?: any;
  study_year?: any;
  group?: any;
  subgroup?: any;
}

// Event Types - Unified interface for calendar display
export interface EventData {
  id: string;
  title: string;
  color: string;
  courseType: string;
  day: string;
  dayOfWeek: string;
  start_time: string;
  end_time: string;
  startHour: number;
  startMinute: number;
  endHour: number;
  endMinute: number;
  professor_id?: string;
  room_id?: string | null;
  room_name?: string;
  professor_name?: string;
  student_count?: number;
  frequency: number;
  study_year_id?: string;
  group_id?: string | null;
  subgroup_id?: string | null;
  
  // Layout properties for calendar display
  column?: number;
  columnCount?: number;
}

// Room and Professor Types
export interface Room {
  room_id: string;
  name: string;
  location: string;
  google_maps_url: string;
}

export interface Professor {
  professor_id: number;
  first_name: string;
  last_name: string;
  title: string;
  email?: string;
  web_page?: string;
  department?: string;
  image_url?: string;
  details?: string;
  domains?: any[];
}

// Component Props Types
export interface EventItemProps {
  event: EventData;
  topPosition: number;
  duration: number;
  columnCount: number;
  column: number;
  isDayView?: boolean;
  isEditMode?: boolean;
  isPossibleAdd?: boolean;
  onDeleteCourse?: (id: string) => void;
  onAddCourse?: (id: string) => void;
}

export interface EventPopupProps {
  event: EventData | null;
  isVisible: boolean;
  onClose: () => void;
  isEditMode?: boolean;
  isPossibleAdd?: boolean;
  onDeleteCourse?: (id: string) => void;
  onAddCourse?: (id: string) => void;
}

export interface EventDialogProps {
  isOpen: boolean;
  onClose: () => void;
  date: Date | null;
  courses: EventData[];
  academicSchedule: AcademicSchedule;
}

export interface CalendarHeaderProps {
  isWeekView: boolean;
  isEditMode?: boolean;
  isAddingCourses?: boolean;
  onEdit: () => void;
  onSave: () => void;
  onCancel: () => void;
  onUndo: () => void;
  onAddCourses: () => void;
  onCancelAddCourse: () => void;
  onCourseTypeChange: (courseType: string) => void;
  onCourseSelect: (courseName: string) => void;
  onSearchCourses: () => void;
  onSaveAddedCourses: () => void;
  hasTempAddedCourses?: boolean;
  availableCourses?: string[];
  searchLoading?: boolean;
}

export interface WeekViewProps {
  currentDate: Date;
  courses: EventData[];
  isEditMode?: boolean;
  onDeleteCourse?: (courseId: string) => void;
  academicSchedule: AcademicSchedule | null;
  possibleAddCourses?: EventData[];
  isAddingCourses?: boolean;
  onAddCourse?: (courseId: string) => void;
}

export interface MonthViewProps {
  currentDate: Date;
  courses: EventData[];
  academicSchedule: AcademicSchedule | null;
}

export interface DayViewProps {
  currentDate: Date;
  courses: EventData[];
  academicSchedule: AcademicSchedule | null;
}



export interface UserData {
  student_id: string;
  first_name: string;
  last_name: string;
  email: string;
  subgroup_id: string ; 
  specialization?: string;
  group?: string;
  subgroup?: string;
  specialization_language?: string;
  study_year?: number;
  group_number?: number;
  subgroup_number?: number;
  language?: string;
  year?: number;
}

export interface StudyYear {
  study_year_id: string;
  year: number;
  specialization_id: string;
}

export interface Specialization {
  specialization_id: string;
  name: string;
  language: string;
}

export interface Group {
  group_id: string;
  group_number: number;
  study_year_id: string;
}

export interface Subgroup {
  subgroup_id: string;
  subgroup_number: number;
  group_id: string;
}