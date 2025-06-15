// ============ AUTHENTICATION ENDPOINTS ============
export const LOGIN_ENDPOINT = '/login';
export const SIGNUP_ENDPOINT = '/signup';

// ============ STUDENT ENDPOINTS ============
export const GET_STUDENT_PROFILE_ENDPOINT = (studentId: string) => `/student-profile/${studentId}`;
export const UPDATE_STUDENT_PROFILE_ENDPOINT = '/update-student-profile';

// ============ ACADEMIC DATA ENDPOINTS ============
export const GET_SPECIALIZATIONS_ENDPOINT = '/specializations';
export const GET_STUDY_YEARS_ENDPOINT = '/study_years';
export const GET_GROUPS_ENDPOINT = '/groups';
export const GET_SUBGROUPS_ENDPOINT = '/subgroups';
export const GET_USER_SUBGROUP_GROUP_ENDPOINT = (subgroupId: string) => `/user-subgroup-group?subgroup_id=${subgroupId}`;

// ============ COURSE ENDPOINTS ============
export const GET_COURSES_BY_STUDENT_ENDPOINT = (studentId: string) => `/courses/by-student-id?student_id=${studentId}`;
export const GET_AVAILABLE_COURSES_ENDPOINT = (subgroupId: string) => `/filtered-courses?subgroup_id=${encodeURIComponent(subgroupId)}`;
export const GET_WANTED_COURSES_ENDPOINT = (courseName: string, courseType: string, subgroupId: string) => 
  `/wanted-courses?name=${encodeURIComponent(courseName)}&type=${encodeURIComponent(courseType)}&subgroup_id=${encodeURIComponent(subgroupId)}`;

// ============ COURSE MANAGEMENT ENDPOINTS ============
export const UPDATE_COURSE_SUBSCRIPTIONS_ENDPOINT = '/delete-courses';
export const RESET_COURSE_SUBSCRIPTIONS_ENDPOINT = '/reset-courses';

// ============ SCHEDULE ENDPOINTS ============
export const GET_ACADEMIC_SCHEDULE_ENDPOINT = (subgroupId: string) => `/schedule?subgroup_id=${subgroupId}`;

// ============ ROOM ENDPOINTS ============
export const GET_ROOMS_ENDPOINT = '/rooms';

// ============ PROFESSORS ENDPOINTS ============
export const PROFESSORS_ENDPOINT = (department: string) =>
  `/professors?department=${encodeURIComponent(department)}`;

// ============ CHATBOT ENDPOINTS ============
export const CHATBOT_ENDPOINT = '/chat';