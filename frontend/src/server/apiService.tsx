// src/services/ApiService.ts
interface ResponseCache {
  [key: string]: any;
}

interface CompleteStudentData {
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
interface StudyOptions {
  uniqueNames: string[];
  uniqueLanguages: string[];
  allSpecializations: {
    specialization_id: string;
    name: string;
    language: string;
  }[];
}
interface StudyYear {
  study_year_id: string;
  year: number;
  specialization_id: string;
}
interface Group {
  group_id: string;
  group_number: number;
  study_year_id: string;
}

interface Subgroup {
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
interface Student { 
  student_id: string;
  first_name: string;
  last_name: string;
  email: string;
  password: string;
  subgroup_id: number;}


  interface AcademicPeriod {
    id: string;
    start_date: string;
    end_date: string;
    period_type: string;
    semester: number;
    target: string | null;
  }
  
  interface Holiday {
    id: string;
    holiday_date: string;
    name: string;
  }
  
  interface AcademicSchedule {
    academic_periods: AcademicPeriod[];
    holidays: Holiday[];
    current_semester: number;
    is_terminal: boolean;
  }
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
    this.responses = {}; // Store responses
  }


  storeUserData(userData: Student) {
    if (!userData) return;
    localStorage.setItem('userData', JSON.stringify(userData));
  }
  
  /**
   * Get stored user data
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
  /**
   * Make an API call
   * @param endpoint - The API endpoint
   * @param method - HTTP method (GET, POST, etc.)
   * @param body - Request body for POST/PUT requests
   * @returns Response data
   */
  async callApi(endpoint: string, method: string = 'GET', body: any = null): Promise<any> {
    const url = `${this.baseUrl}/${endpoint}`;
    const token = localStorage.getItem('authToken');
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };
    
    // Add auth token if available
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    const options: RequestInit = {
      method,
      headers
    };
    
    // Add body for POST, PUT, etc.
    if (body) {
      options.body = JSON.stringify(body);
    }
    
    try {
      const response = await fetch(url, options);
      const data = await response.json();
      
      // Store the response with the endpoint as key
      this.responses[endpoint] = data;
      
      return data;
    } catch (error) {
      console.error(`API Error (${endpoint}):`, error);
      throw error;
    }
  }
  
  /**
   * Get stored response for an endpoint
   * @param endpoint - The API endpoint
   * @returns Stored response data
   */
  getResponse(endpoint: string): any {
    return this.responses[endpoint];
  }
  
  /**
   * Login a user
   * @param email - User email
   * @param password - User password
   * @returns Login response
   */
  async login(email: string, password: string): Promise<any> {
    const response = await this.callApi('login', 'POST', { email, password });
    
    // If login is successful and user data is included in the response
    if (response.status === 200 && response.data && response.data.user) {
      // Store user data in localStorage
      this.storeUserData(response.data.user);
      // Store auth token
      localStorage.setItem('authToken', response.data.token);
    }
    
    return response;
  }

  async getStudyOptions(): Promise<StudyOptions> {
    const response = await this.callApi('specializations');
    
    // Assuming the API returns data in the format: { data: [specialization objects] }
    const specializations = response.data || [];
    
    // Extract unique names and languages using Sets (no duplicates)
    const nameSet = new Set<string>();
    const languageSet = new Set<string>();
    
    specializations.forEach((spec: any) => {
      if (spec.name) nameSet.add(spec.name);
      if (spec.language) languageSet.add(spec.language);
    });
    
    // Convert sets to arrays
    const uniqueNames = Array.from(nameSet);
    const uniqueLanguages = Array.from(languageSet);
    
    return {
      uniqueNames,
      uniqueLanguages,
      allSpecializations: specializations
    };
  }

  // Add this method to your ApiService class
/**
 * Get all study years
 * @returns Study years data
 */
async getStudyYears(): Promise<StudyYear[]> {
  const response = await this.callApi('study_years');
  
  // Assuming the API returns data in the format: { data: [study year objects] }
  const studyYears = response.data || [];
  
  return studyYears;
}

// You might also want to add a method to get years for a specific specialization
/**
 * Get study years for a specific specialization
 * @param specializationId - ID of the specialization
 * @returns Filtered study years data
 */
async getStudyYearsBySpecialization(specializationId: string): Promise<StudyYear[]> {
  // First get all study years
  const allStudyYears = await this.getStudyYears();
  
  // Filter by the given specialization ID
  return allStudyYears.filter(year => year.specialization_id === specializationId);
}
  /**
 * Get all groups
 * @returns All groups data
 */
async getGroups(): Promise<Group[]> {
  const response = await this.callApi('groups');
  
  // Assuming the API returns data in the format: { data: [group objects] }
  const groups = response.data || [];
  
  return groups;
}

/**
 * Get all subgroups
 * @returns All subgroups data
 */
async getSubgroups(): Promise<Subgroup[]> {
  const response = await this.callApi('subgroups');
  
  // Assuming the API returns data in the format: { data: [subgroup objects] }
  const subgroups = response.data || [];
  
  return subgroups;
}

/**
 * Get the current user's subgroup and the associated group data
 * @returns Object containing the subgroup and group data
 */
async getUserSubgroupAndGroup(): Promise<{ subgroup: Subgroup | null, group: Group | null }> {
  try {
    // Get the user data from local storage
    const userData = this.getUserData();
    
    // Check if user data exists and if the subgroup_id is available
    if (!userData || !userData.subgroup_id) {
      console.error('User data or subgroup_id not found');
      return { subgroup: null, group: null };
    }
    
    // Make the API call to get the subgroup details
    const endpoint = `user-subgroup-group?subgroup_id=${userData.subgroup_id}`;
    const response = await this.callApi(endpoint);
    
    // Return the response data containing both subgroup and group
    return {
      subgroup: response.data?.subgroup || null,
      group: response.data?.group || null
    };
  } catch (error) {
    console.error('Error fetching user subgroup and group data:', error);
    return { subgroup: null, group: null };
  }
}
/**
 * Get all courses for a specific subgroup by ID
 * @param subgroupId - The ID of the subgroup
 * @returns List of courses for the subgroup
 */
async getCoursesByStudentId(studentId: string): Promise<Course[]> {
  // Construim endpoint-ul cu parametrul de query subgroup_id
  const endpoint = `courses/by-student-id?student_id=${studentId}`;
  
  try {
    const response = await this.callApi(endpoint);
    
    // Presupunând că API-ul returnează date în formatul: { data: [course objects] }
    return response.data || [];
  } catch (error) {
    console.error(`Error getting courses for student ${studentId}:`, error);
    throw error;
  }
}

async getAvailableCourses(subgroup_id) {
  try {
    // Construiește endpoint-ul cu parametrii de căutare și tip
    let endpoint = `filtered-courses?subgroup_id=${encodeURIComponent(subgroup_id)}`;
    
    // Efectuează cererea API
    const response = await this.callApi(endpoint);
    
    // Verifică dacă răspunsul este valid
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
 * Obține cursurile disponibile pentru adăugare în funcție de un termen de căutare și tipul de curs
 * @param courseName - Numele cursului selectat
 * @param courseType - Tipul de curs (Curs, Seminar, Laborator)
 * @returns Lista de cursuri care corespund criteriilor de căutare
 */
async getWantedCourses(courseName, courseType,subgroup_id) {
  try {
    // Construiește endpoint-ul cu parametrii de căutare și tip
    let endpoint = `wanted-courses?name=${encodeURIComponent(courseName)}&type=${encodeURIComponent(courseType)}&subgroup_id=${encodeURIComponent(subgroup_id)}`;
    
    // Efectuează cererea API
    const response = await this.callApi(endpoint);
    
    // Verifică dacă răspunsul este valid
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


/**
 * Update course subscriptions for a student
 * @param studentId - The ID of the student
 * @param courses - The updated list of courses
 * @returns Response from the API
 */
async updateCourseSubscriptions(studentId: string, courses: Course[]): Promise<any> {
  // Construim endpoint-ul pentru actualizarea cursurilor
  const endpoint = 'delete-courses';
  
  // Construim payload-ul pentru request
  const payload = {
    student_id: studentId,
    courses: courses
  };
  
  try {
    // Facem apelul API cu metoda PUT pentru actualizare
    const response = await this.callApi(endpoint, 'DELETE', payload);
    
    // Verificăm dacă apelul a fost cu succes
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
 * Register a new student
 * @param userData - User registration data
 * @returns Registration response
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
  return this.callApi('signup', 'POST', userData);
}
/**
 * Resetează orarul unui student la versiunea inițială
 * @param studentId - ID-ul studentului
 * @returns Răspunsul de la API
 */
async resetCourseSubscriptions(studentId: string): Promise<any> {
  // Construim endpoint-ul pentru resetarea orarului
  const endpoint = 'reset-courses';
  
  // Construim payload-ul pentru request
  const payload = {
    student_id: studentId
  };
  
  try {
    // Facem apelul API cu metoda POST pentru resetare
    const response = await this.callApi(endpoint, 'POST', payload);
    
    // Verificăm dacă apelul a fost cu succes
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
// Adaugă această metodă la clasa ApiService
/**
 * Obține structura anului academic folosind subgroup_id din datele utilizatorului
 * @returns Datele structurii anului academic sau null în caz de eroare
 */
async getAcademicSchedule(): Promise<AcademicSchedule | null> {
  try {
    // Obține datele utilizatorului
    const userData = this.getUserData();
    
    // Verifică dacă există date utilizator și subgroup_id
    if (!userData || !userData.subgroup_id) {
      console.error('Nu s-au găsit date utilizator sau subgroup_id');
      return null;
    }
    
    // Construiește endpoint-ul cu subgroup_id ca parametru de query
    const endpoint = `schedule?subgroup_id=${userData.subgroup_id}`;
    
    // Efectuează cererea API
    const response = await this.callApi(endpoint);
    
    // Verifică dacă răspunsul este valid
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
/**
 * Obține datele complete ale studentului pe baza student_id din localStorage
 * @returns Datele complete ale studentului sau null în caz de eroare
 */
async getCompleteStudentData(): Promise<CompleteStudentData | null> {
  try {
    // Obține datele utilizatorului din localStorage
    const userData = this.getUserData();
    
    // Verifică dacă există date utilizator și student_id
    if (!userData || !userData.student_id) {
      console.error('Nu s-au găsit date utilizator sau student_id');
      return null;
    }
    
    // Construiește endpoint-ul pentru obținerea datelor complete ale studentului
    const endpoint = `student-profile/${userData.student_id}`;
    
    // Efectuează cererea API
    const response = await this.callApi(endpoint);
    
    // Verifică dacă răspunsul este valid
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
logout() {
  localStorage.removeItem('userData');
  localStorage.removeItem('authToken');
}
/**
 * Actualizează profilul unui student
 * @param profileData - Datele profilului de actualizat
 * @returns Răspunsul de la API
 */
async updateStudentProfile(profileData: {
  student_id: string;
  first_name: string;
  last_name: string;
  subgroup_id: string;
}): Promise<any> {
  // Construim endpoint-ul pentru actualizarea profilului
  const endpoint = 'update-student-profile';
  
  // Construim payload-ul pentru request
  const payload = {
    student_id: profileData.student_id,
    first_name: profileData.first_name,
    last_name: profileData.last_name,
    subgroup_id: profileData.subgroup_id
  };
  
  try {
    // Facem apelul API cu metoda PUT pentru actualizare
    const response = await this.callApi(endpoint, 'PUT', payload);
    
    // Verificăm dacă apelul a fost cu succes
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
  /**
   * Clear stored responses
   * @param endpoint - Specific endpoint to clear (optional)
   */
  clearResponses(endpoint?: string): void {
    if (endpoint) {
      delete this.responses[endpoint];
    } else {
      this.responses = {};
    }
  }
}

// Create and export a singleton instance
const apiService = new ApiService();
export default apiService;