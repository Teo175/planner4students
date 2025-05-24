export interface ResponseCache {
  [key: string]: any;
}

export interface CompleteStudentData {
  student_id: string;
  first_name: string;
  last_name: string;
  email: string;
  subgroup_id: number;
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
  
  // Optional fields for related entities if your API returns them
  professor?: any;
  study_year?: any;
  group?: any;
  subgroup?: any;
}

export interface Student { 
  student_id: string;
  first_name: string;
  last_name: string;
  email: string;
  password: string;
  subgroup_id: number;
}

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

export interface Room {
  room_id: string;
  name: string;
  location: string;
  google_maps_url: string;
}