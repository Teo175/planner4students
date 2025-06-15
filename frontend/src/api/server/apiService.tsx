import { LOGIN_ENDPOINT, SIGNUP_ENDPOINT, GET_STUDENT_PROFILE_ENDPOINT, UPDATE_STUDENT_PROFILE_ENDPOINT, GET_SPECIALIZATIONS_ENDPOINT, GET_STUDY_YEARS_ENDPOINT, GET_GROUPS_ENDPOINT, GET_SUBGROUPS_ENDPOINT, GET_USER_SUBGROUP_GROUP_ENDPOINT, GET_COURSES_BY_STUDENT_ENDPOINT, GET_AVAILABLE_COURSES_ENDPOINT, GET_WANTED_COURSES_ENDPOINT, UPDATE_COURSE_SUBSCRIPTIONS_ENDPOINT, RESET_COURSE_SUBSCRIPTIONS_ENDPOINT, GET_ACADEMIC_SCHEDULE_ENDPOINT, GET_ROOMS_ENDPOINT, PROFESSORS_ENDPOINT, CHATBOT_ENDPOINT } from "../endpoints";
import { AcademicSchedule,Professor, CompleteStudentData, Course, Group, ResponseCache, Room, Student, StudyOptions, StudyYear, Subgroup } from "../../common";


/**
 * API Service for handling HTTP requests
 */
class ApiService {
  private baseUrl: string;
  private responses: ResponseCache;

  /**
   * Create a new ApiService instance
   */
  constructor() {
    this.baseUrl = 'http://127.0.0.1:5000';
    this.responses = {}; 
  }

  // ============================================================================
  // CORE API METHODS
  // ============================================================================
  
updateUserProfile(profileData: {
  first_name?: string;
  last_name?: string;
  subgroup_id?: string; // FIXED: Only string type
  email?: string;
  student_id?: string;
}) {
  const userData = this.getUserData();
  if (!userData) {
    console.warn('No user data found in localStorage to update');
    return;
  }

  try {
    // Update only the provided fields
    if (profileData.first_name !== undefined) {
      userData.first_name = profileData.first_name;
    }
    if (profileData.last_name !== undefined) {
      userData.last_name = profileData.last_name;
    }
    if (profileData.subgroup_id !== undefined) {
      userData.subgroup_id = profileData.subgroup_id; // FIXED: No conversion, keep as string
    }
    if (profileData.email !== undefined) {
      userData.email = profileData.email;
    }
    if (profileData.student_id !== undefined) {
      userData.student_id = profileData.student_id;
    }
    
    // Store back to localStorage
    localStorage.setItem('userData', JSON.stringify(userData));
    
    console.log('Successfully updated user profile in localStorage:', profileData);
  } catch (error) {
    console.error('Error updating user profile in localStorage:', error);
  }
}
  /**
   * Make an API call to the backend
   * @param endpoint - The API endpoint
   * @param method - HTTP method (GET, POST, etc.)
   * @param body - Request body for POST/PUT requests
   * @returns Response data from server
   */
  async callApi(endpoint: string, method: string = 'GET', body: any = null): Promise<any> {
    const url = `${this.baseUrl}${endpoint}`;
    const token = localStorage.getItem('authToken');
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    const options: RequestInit = {
      method,
      headers
    };
    
    if (body) {
      options.body = JSON.stringify(body);
    }
    
    try {
      const response = await fetch(url, options);
      const data = await response.json();
      
      this.responses[endpoint] = data;
      
      return data;
    } catch (error) {
      console.error(`API Error (${endpoint}):`, error);
      throw error;
    }
  }
  
  /**
   * Get cached response for a specific endpoint
   * @param endpoint - The API endpoint
   * @returns Stored response data
   */
  getResponse(endpoint: string): any {
    return this.responses[endpoint];
  }

  /**
   * Clear cached API responses
   * @param endpoint - Specific endpoint to clear (optional, clears all if not provided)
   */
  clearResponses(endpoint?: string): void {
    if (endpoint) {
      delete this.responses[endpoint];
    } else {
      this.responses = {};
    }
  }

  // ============================================================================
  // LOCAL STORAGE MANAGEMENT
  // ============================================================================

  /**
   * Store user data in localStorage
   * @param userData - User data to store
   */
  storeUserData(userData: Student) {
    if (!userData) return;
    localStorage.setItem('userData', JSON.stringify(userData));
  }
  
  /**
   * Get stored user data from localStorage
   * @returns User data object or null if not found
   */
  getUserData() {
    const userData = localStorage.getItem('userData');
    if (!userData) return null;
    try {
      return JSON.parse(userData);
    } catch (e) {
      console.error('Error parsing user data:', e);
      return null;
    }
  }

  // ============================================================================
  // AUTHENTICATION METHODS
  // ============================================================================

  /**
   * Authenticate user with email and password
   * @param email - User email
   * @param password - User password
   * @returns Login response with user data and token
   */
  async login(email: string, password: string): Promise<any> {
    const response = await this.callApi(LOGIN_ENDPOINT, 'POST', { email, password });
    
    if (response.status === 200 && response.data && response.data.user) {
      this.storeUserData(response.data.user);
      localStorage.setItem('authToken', response.data.token);
    }
    
    return response;
  }

  /**
   * Register a new student account
   * @param userData - Student registration data
   * @returns Registration response from server
   */
  async signup(userData: {
    first_name: string;
    last_name: string;
    email: string;
    password: string;
    specialization_name: string;
    specialization_language: string;
    study_year: number;
    group_number: number;
    subgroup_number: number;
  }): Promise<any> {
    return this.callApi(SIGNUP_ENDPOINT, 'POST', userData);
  }

  /**
   * Logout user and clear stored data
   */
  logout() {
    localStorage.removeItem('userData');
    localStorage.removeItem('authToken');
  }

  // ============================================================================
  // STUDENT PROFILE METHODS
  // ============================================================================

  /**
   * Get complete student profile data from server
   * @returns Complete student data or null if error
   */
  async getCompleteStudentData(): Promise<CompleteStudentData | null> {
    try {
      const userData = this.getUserData();
      
      if (!userData || !userData.student_id) {
        console.error('Nu s-au găsit date utilizator sau student_id');
        return null;
      }
      
      const response = await this.callApi(GET_STUDENT_PROFILE_ENDPOINT(userData.student_id));
      
      if (response && response.status === 200 && response.data) {
        return response.data as CompleteStudentData;
      } else {
        console.error('Răspuns invalid de la API pentru datele complete ale studentului:', response);
        return null;
      }
    } catch (error) {
      console.error('Eroare la obținerea datelor complete ale studentului:', error);
      return null;
    }
  }

  /**
   * Update student profile information
   * @param profileData - Profile data to update
   * @returns Response from server
   */
  async updateStudentProfile(profileData: {
    student_id: string;
    first_name: string;
    last_name: string;
    subgroup_id: string;
  }): Promise<any> {
    const payload = {
      student_id: profileData.student_id,
      first_name: profileData.first_name,
      last_name: profileData.last_name,
      subgroup_id: profileData.subgroup_id
    };
    
    try {
      const response = await this.callApi(UPDATE_STUDENT_PROFILE_ENDPOINT, 'PUT', payload);
      
      if (response.status === 200) {
        console.log('Profilul a fost actualizat cu succes pe server');
      } else {
        console.error('Eroare la actualizarea profilului:', response.message || 'Eroare necunoscută');
      }
      
      return response;
    } catch (error) {
      console.error('Eroare la trimiterea datelor către server:', error);
      throw error;
    }
  }

  // ============================================================================
  // ACADEMIC DATA METHODS
  // ============================================================================

  /**
   * Get available study options (specializations and languages)
   * @returns Object with unique names, languages and all specializations
   */
  async getStudyOptions(): Promise<StudyOptions> {
    const response = await this.callApi(GET_SPECIALIZATIONS_ENDPOINT);
    
    const specializations = response.data || [];
    
    const nameSet = new Set<string>();
    const languageSet = new Set<string>();
    
    specializations.forEach((spec: any) => {
      if (spec.name) nameSet.add(spec.name);
      if (spec.language) languageSet.add(spec.language);
    });
    
    const uniqueNames = Array.from(nameSet);
    const uniqueLanguages = Array.from(languageSet);
    
    return {
      uniqueNames,
      uniqueLanguages,
      allSpecializations: specializations
    };
  }

  /**
   * Get all available study years
   * @returns Array of study year objects
   */
  async getStudyYears(): Promise<StudyYear[]> {
    const response = await this.callApi(GET_STUDY_YEARS_ENDPOINT);
    
    const studyYears = response.data || [];
    
    return studyYears;
  }

  /**
   * Get study years filtered by specialization
   * @param specializationId - ID of the specialization to filter by
   * @returns Filtered study years data
   */
  async getStudyYearsBySpecialization(specializationId: string): Promise<StudyYear[]> {
    const allStudyYears = await this.getStudyYears();
    
    return allStudyYears.filter(year => year.specialization_id === specializationId);
  }

  /**
   * Get all available groups
   * @returns Array of group objects
   */
  async getGroups(): Promise<Group[]> {
    const response = await this.callApi(GET_GROUPS_ENDPOINT);
    
    const groups = response.data || [];
    
    return groups;
  }

  /**
   * Get all available subgroups
   * @returns Array of subgroup objects
   */
  async getSubgroups(): Promise<Subgroup[]> {
    const response = await this.callApi(GET_SUBGROUPS_ENDPOINT);
    
    const subgroups = response.data || [];
    
    return subgroups;
  }

  /**
   * Get current user's subgroup and associated group information
   * @returns Object containing subgroup and group data
   */
  async getUserSubgroupAndGroup(): Promise<{ subgroup: Subgroup | null, group: Group | null }> {
    try {
      const userData = this.getUserData();
      
      if (!userData || !userData.subgroup_id) {
        console.error('User data or subgroup_id not found');
        return { subgroup: null, group: null };
      }
      
      const response = await this.callApi(GET_USER_SUBGROUP_GROUP_ENDPOINT(userData.subgroup_id));
      
      return {
        subgroup: response.data?.subgroup || null,
        group: response.data?.group || null
      };
    } catch (error) {
      console.error('Error fetching user subgroup and group data:', error);
      return { subgroup: null, group: null };
    }
  }
 // ============================================================================
  // PROFESSORS METHODS
  // ============================================================================

  /**
   * Get all professors for a specific department
   * @param department - The department name 
   * @returns Array of professors objects 
   */
  async getProfessorsFromDepartment(department: string): Promise<Professor[]> {
  try {
    const response = await this.callApi(PROFESSORS_ENDPOINT(department));

    if (response && response.status === 200 && Array.isArray(response.data)) {
      return response.data as Professor[];
    } else {
      console.error('Eroare la incărcarea profesorilor:', response.message || 'Raspuns invalid');
      return [];
    }
  } catch (error) {
    console.error('Eroare la fetch pentru profesori:', error);
    return [];
  }
}
  // ============================================================================
  // COURSE METHODS
  // ============================================================================

  /**
   * Get all courses for a specific student
   * @param studentId - The ID of the student
   * @returns Array of course objects assigned to the student
   */
  async getCoursesByStudentId(studentId: string): Promise<Course[]> {
    try {
      const response = await this.callApi(GET_COURSES_BY_STUDENT_ENDPOINT(studentId));
      
      return response.data || [];
    } catch (error) {
      console.error(`Error getting courses for student ${studentId}:`, error);
      throw error;
    }
  }

  /**
   * Get available courses for a specific subgroup
   * @param subgroup_id - The ID of the subgroup
   * @returns Array of available course objects
   */
  async getAvailableCourses(subgroup_id: string) {
    try {
      const response = await this.callApi(GET_AVAILABLE_COURSES_ENDPOINT(subgroup_id));
      
      if (response && response.status === 200 && response.data) {
        return response.data;
      } else {
        console.error('Răspuns invalid de la API pentru cursurile disponibile:', response);
        return [];
      }
    } catch (error) {
      console.error('Eroare la obținerea cursurilor disponibile:', error);
      return [];
    }
  }

  /**
   * Search for specific courses by name and type
   * @param courseName - Name of the course to search for
   * @param courseType - Type of course (Curs, Seminar, Laborator)
   * @param subgroup_id - ID of the subgroup
   * @returns Array of courses matching search criteria
   */
  async getWantedCourses(courseName: string, courseType: string, subgroup_id: string) {
    try {
      const response = await this.callApi(GET_WANTED_COURSES_ENDPOINT(courseName, courseType, subgroup_id));
      
      if (response && response.status === 200 && response.data) {
        return response.data;
      } else {
        console.error('Răspuns invalid de la API pentru cursurile dorite:', response);
        return [];
      }
    } catch (error) {
      console.error('Eroare la obținerea cursurilor dorite:', error);
      return [];
    }
  }

  // ============================================================================
  // COURSE MANAGEMENT METHODS
  // ============================================================================

  /**
   * Update student's course subscriptions
   * @param studentId - ID of the student
   * @param courses - Updated list of courses
   * @returns Response from server
   */
  async updateCourseSubscriptions(studentId: string, courses: Course[]): Promise<any> {
    const payload = {
      student_id: studentId,
      courses: courses
    };
    
    try {
      const response = await this.callApi(UPDATE_COURSE_SUBSCRIPTIONS_ENDPOINT, 'DELETE', payload);
      
      if (response.status === 200) {
        console.log('Cursurile au fost actualizate cu succes');
      } else {
        console.error('Eroare la actualizarea cursurilor:', response.message || 'Eroare necunoscută');
      }
      
      return response;
    } catch (error) {
      console.error('Eroare la trimiterea datelor către server:', error);
      throw error;
    }
  }

  /**
   * Reset student's schedule to default/initial state
   * @param studentId - ID of the student
   * @returns Response from server
   */
  async resetCourseSubscriptions(studentId: string): Promise<any> {
    const payload = {
      student_id: studentId
    };
    
    try {
      const response = await this.callApi(RESET_COURSE_SUBSCRIPTIONS_ENDPOINT, 'POST', payload);
      
      if (response.status === 200) {
        console.log('Orarul a fost resetat cu succes');
      } else {
        console.error('Eroare la resetarea orarului:', response.message || 'Eroare necunoscută');
      }
      
      return response;
    } catch (error) {
      console.error('Eroare la trimiterea datelor către server:', error);
      throw error;
    }
  }

  // ============================================================================
  // SCHEDULE METHODS
  // ============================================================================

  /**
   * Get academic schedule structure (periods, holidays, etc.)
   * @returns Academic schedule data or null if error
   */
  async getAcademicSchedule(): Promise<AcademicSchedule | null> {
    try {
      const userData = this.getUserData();
      
      if (!userData || !userData.subgroup_id) {
        console.error('Nu s-au găsit date utilizator sau subgroup_id');
        return null;
      }
      
      const response = await this.callApi(GET_ACADEMIC_SCHEDULE_ENDPOINT(userData.subgroup_id));
      
      if (response && response.status === 200 && response.data) {
        return response.data as AcademicSchedule;
      } else {
        console.error('Răspuns invalid de la API pentru structura anului academic:', response);
        return null;
      }
    } catch (error) {
      console.error('Eroare la obținerea structurii anului academic:', error);
      return null;
    }  
  }


// ============================================================================
// ROOM METHODS
// ============================================================================

/**
 * Get all available rooms with Google Maps URLs
 * @returns Array of room objects
 */
async getRooms(): Promise<Room[]> {
  try {
    const response = await this.callApi(GET_ROOMS_ENDPOINT);
    
    if (response && response.status === 200 && response.data) {
      return response.data as Room[];
    } else {
      console.error('Răspuns invalid de la API pentru săli:', response);
      return [];
    }
  } catch (error) {
    console.error('Eroare la obținerea sălilor:', error);
    return [];
  }
}

/**
 * Search rooms by name or location
 * @param searchTerm - Term to search for
 * @returns Filtered array of rooms
 */
searchRooms(rooms: Room[], searchTerm: string): Room[] {
  if (!searchTerm.trim()) {
    return rooms;
  }
  
  return rooms.filter(room =>
    room.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    room.location?.toLowerCase().includes(searchTerm.toLowerCase())
  );
}
// ============================================================================
// CHATBOT METHODS
// ============================================================================
/**
 * Trimite un mesaj către chatbot și primește un răspuns
 * @param message - mesajul utilizatorului
 * @returns răspunsul generat de AI
 */
async chatWithBot(message: string): Promise<string> {
  try {
    const response = await this.callApi(CHATBOT_ENDPOINT, 'POST', { message });
     if (response && response.data && response.data.reply) {
      return response.data.reply;
    } else {
      console.error('Chatbot: răspuns invalid', response);
      return 'Eroare: nu am putut genera un răspuns.';
    }
  } catch (error) {
    console.error('Eroare la chatbot:', error);
    return 'Eroare la comunicarea cu serverul.';
  }
}
}

// Create and export a singleton instance
const apiService = new ApiService();
export default apiService;