import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Edit, Save, X } from 'lucide-react';
import { Combobox, Option } from '@fluentui/react-components';
import Swal from 'sweetalert2';
import './EditProfile.scss';
import apiService from '../../server/apiService';

interface UserData {
  student_id: string;
  first_name: string;
  last_name: string;
  email: string;
  subgroup_id: number;
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

// Define the interfaces for our data types (same as signup)
interface StudyYear {
  study_year_id: string;
  year: number;
  specialization_id: string;
}

interface Specialization {
  specialization_id: string;
  name: string;
  language: string;
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

const EditProfile: React.FC = () => {
  const [userData, setUserData] = useState<UserData | null>(null);
  const [originalUserData, setOriginalUserData] = useState<UserData | null>(null);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [isFormModified, setIsFormModified] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  
  // Dropdown states (similar to signup)
  const [selectedStudyField, setSelectedStudyField] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState('');
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [selectedYearId, setSelectedYearId] = useState<string | null>(null);
  const [selectedGroupNumber, setSelectedGroupNumber] = useState<number | null>(null);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [selectedSubgroupNumber, setSelectedSubgroupNumber] = useState<number | null>(null);
  const [selectedSubgroupId, setSelectedSubgroupId] = useState<string | null>(null);

  // State for options from API (same as signup)
  const [studyOptions, setStudyOptions] = useState<string[]>([]);
  const [languageOptions, setLanguageOptions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [dropdownsLoading, setDropdownsLoading] = useState(false);
  
  // Add new state for data (same as signup)
  const [allSpecializations, setAllSpecializations] = useState<Specialization[]>([]);
  const [studyYears, setStudyYears] = useState<StudyYear[]>([]);
  const [allGroups, setAllGroups] = useState<Group[]>([]);
  const [allSubgroups, setAllSubgroups] = useState<Subgroup[]>([]);
  
  // Filtered options for displaying in dropdowns (same as signup)
  const [filteredYearOptions, setFilteredYearOptions] = useState<{id: string, year: number}[]>([]);
  const [filteredGroupOptions, setFilteredGroupOptions] = useState<{id: string, number: number}[]>([]);
  const [filteredSubgroupOptions, setFilteredSubgroupOptions] = useState<{id: string, number: number}[]>([]);

  const navigate = useNavigate();

  // Effect pentru a gestiona back button din browser
  useEffect(() => {
    // Previne comportamentul default al back button și redirecționează la schedule
    const handlePopstate = () => {
      navigate('/schedule', { replace: true });
    };

    // Adaugă o intrare în history pentru a intercepta back button
    window.history.pushState(null, '', window.location.href);
    
    // Ascultă pentru popstate (back button)
    window.addEventListener('popstate', handlePopstate);

    return () => {
      window.removeEventListener('popstate', handlePopstate);
    };
  }, [navigate]);

  // Function to update year options (same as signup)
  const updateYearOptions = (years: StudyYear[], field: string, language: string) => {
    if (!field && !language) {
      const uniqueYears = Array.from(new Set(years.map(y => y.year)))
        .map(year => {
          const yearObj = years.find(y => y.year === year);
          return { id: yearObj?.study_year_id || '', year: year };
        });
      
      uniqueYears.sort((a, b) => a.year - b.year);
      setFilteredYearOptions(uniqueYears);
      return;
    }
    
    const matchingSpecs = allSpecializations.filter(spec => 
      (field ? spec.name === field : true) && 
      (language ? spec.language === language : true)
    );
    
    if (matchingSpecs.length === 0) {
      setFilteredYearOptions([]);
      return;
    }
    
    const matchingYears: {id: string, year: number}[] = [];
    matchingSpecs.forEach(spec => {
      const specYears = years.filter(y => y.specialization_id === spec.specialization_id);
      specYears.forEach(y => {
        if (!matchingYears.some(existing => existing.year === y.year)) {
          matchingYears.push({ id: y.study_year_id, year: y.year });
        }
      });
    });
    
    matchingYears.sort((a, b) => a.year - b.year);
    setFilteredYearOptions(matchingYears);
  };

  // Function to find the correct IDs based on current selections
  const findUserSelectionIds = () => {
    if (!selectedStudyField || !selectedLanguage || !selectedYear || 
        !selectedGroupNumber || !selectedSubgroupNumber) return;

    try {
      // Find specialization ID
      const specialization = allSpecializations.find(spec => 
        spec.name === selectedStudyField && spec.language === selectedLanguage
      );
      if (!specialization) return;

      // Find year ID
      const year = studyYears.find(y => 
        y.year === selectedYear && y.specialization_id === specialization.specialization_id
      );
      if (!year) return;
      setSelectedYearId(year.study_year_id);

      // Find group ID
      const group = allGroups.find(g => 
        g.group_number === selectedGroupNumber && g.study_year_id === year.study_year_id
      );
      if (!group) return;
      setSelectedGroupId(group.group_id);

      // Find subgroup ID
      const subgroup = allSubgroups.find(s => 
        s.subgroup_number === selectedSubgroupNumber && s.group_id === group.group_id
      );
      if (!subgroup) return;
      setSelectedSubgroupId(subgroup.subgroup_id);

    } catch (error) {
      console.error('Error finding selection IDs:', error);
    }
  };

  // Function to find IDs based on complete user data received from server
  const findUserSelectionIdsFromData = (specialization: string, language: string, year: number, groupNum: number, subgroupNum: number) => {
    console.log('Finding IDs for:', { specialization, language, year, groupNum, subgroupNum });
    
    try {
      // Find specialization ID
      const spec = allSpecializations.find(s => 
        s.name === specialization && s.language === language
      );
      if (!spec) {
        console.warn('Specialization not found:', { specialization, language });
        return;
      }
      console.log('Found specialization:', spec);

      // Find year ID
      const studyYear = studyYears.find(y => 
        y.year === year && y.specialization_id === spec.specialization_id
      );
      if (!studyYear) {
        console.warn('Study year not found:', { year, specialization_id: spec.specialization_id });
        return;
      }
      console.log('Found study year:', studyYear);
      setSelectedYearId(studyYear.study_year_id);

      // Find group ID
      const group = allGroups.find(g => 
        g.group_number === groupNum && g.study_year_id === studyYear.study_year_id
      );
      if (!group) {
        console.warn('Group not found:', { groupNum, study_year_id: studyYear.study_year_id });
        return;
      }
      console.log('Found group:', group);
      setSelectedGroupId(group.group_id);

      // Find subgroup ID
      const subgroup = allSubgroups.find(s => 
        s.subgroup_number === subgroupNum && s.group_id === group.group_id
      );
      if (!subgroup) {
        console.warn('Subgroup not found:', { subgroupNum, group_id: group.group_id });
        return;
      }
      console.log('Found subgroup:', subgroup);
      setSelectedSubgroupId(subgroup.subgroup_id);

      console.log('All IDs set successfully');
    } catch (error) {
      console.error('Error finding selection IDs from data:', error);
    }
  };

  // Fetch dropdown data
  const fetchDropdownData = async () => {
    if (dropdownsLoading) return;
    
    try {
      setDropdownsLoading(true);
      
      console.log('Fetching dropdown data...');
      
      // Fetch specializations
      const options = await apiService.getStudyOptions();
      setStudyOptions(options.uniqueNames);
      setLanguageOptions(options.uniqueLanguages);
      setAllSpecializations(options.allSpecializations);
      console.log('Loaded specializations:', options.allSpecializations.length);
      
      // Fetch study years
      const years = await apiService.getStudyYears();
      setStudyYears(years);
      console.log('Loaded study years:', years.length);
      
      // Fetch all groups
      const groups = await apiService.getGroups();
      setAllGroups(groups);
      console.log('Loaded groups:', groups.length);
      
      // Fetch all subgroups
      const subgroups = await apiService.getSubgroups();
      setAllSubgroups(subgroups);
      console.log('Loaded subgroups:', subgroups.length);
      
      console.log('All dropdown data loaded successfully');
      
    } catch (err) {
      console.error('Eroare la încărcarea datelor:', err);
      setMessage({ text: 'Eroare la încărcarea datelor pentru dropdownuri.', type: 'error' });
    } finally {
      setDropdownsLoading(false);
    }
  };

  useEffect(() => {
    const loadUserData = async () => {
      const basicUserData = apiService.getUserData();
      if (!basicUserData) {
        navigate('/login');
        return;
      }

      try {
        // Primul pas: încarcă datele pentru dropdownuri
        await fetchDropdownData();
        
        // Al doilea pas: încarcă datele complete ale studentului de la server
        const completeUserData = await apiService.getCompleteStudentData();
        
        if (completeUserData) {
          console.log('Complete user data received:', completeUserData);
          
          // Mapează datele de la server la interfața UserData locală
          const mappedUserData: UserData = {
            student_id: completeUserData.student_id,
            first_name: completeUserData.first_name,
            last_name: completeUserData.last_name,
            email: completeUserData.email,
            subgroup_id: completeUserData.subgroup_id,
            specialization: completeUserData.specialization,
            specialization_language: completeUserData.language,
            study_year: completeUserData.year,
            group: completeUserData.group,
            group_number: parseInt(completeUserData.group),
            subgroup: completeUserData.subgroup,
            subgroup_number: parseInt(completeUserData.subgroup),
            language: completeUserData.language,
            year: completeUserData.year
          };

          setUserData(mappedUserData);
          setOriginalUserData(mappedUserData);
          
          // Inițializează selecțiile pentru dropdownuri
          setSelectedStudyField(completeUserData.specialization);
          setSelectedLanguage(completeUserData.language);
          setSelectedYear(completeUserData.year);
          setSelectedGroupNumber(parseInt(completeUserData.group));
          setSelectedSubgroupNumber(parseInt(completeUserData.subgroup));
          
        } else {
          console.warn('Nu s-au putut încărca datele complete, se folosesc datele de bază');
          setUserData(basicUserData);
          setOriginalUserData(basicUserData);
          
          setSelectedStudyField(basicUserData.specialization || '');
          setSelectedLanguage(basicUserData.specialization_language || '');
          setSelectedYear(basicUserData.study_year || null);
          setSelectedGroupNumber(basicUserData.group_number || null);
          setSelectedSubgroupNumber(basicUserData.subgroup_number || null);
        }
        
      } catch (error) {
        console.error('Eroare la încărcarea datelor utilizatorului:', error);
        setMessage({ text: 'Eroare la încărcarea datelor profilului.', type: 'error' });
        
        // Fallback la datele de bază
        setUserData(basicUserData);
        setOriginalUserData(basicUserData);
        
        setSelectedStudyField(basicUserData.specialization || '');
        setSelectedLanguage(basicUserData.specialization_language || '');
        setSelectedYear(basicUserData.study_year || null);
        setSelectedGroupNumber(basicUserData.group_number || null);
        setSelectedSubgroupNumber(basicUserData.subgroup_number || null);
      } finally {
        setLoading(false);
      }
    };

    loadUserData();
  }, [navigate]);

  // Adaugă acest useEffect pentru a forța actualizarea opțiunilor când toate datele sunt disponibile
  useEffect(() => {
    if (allSpecializations.length > 0 && studyYears.length > 0 && allGroups.length > 0 && allSubgroups.length > 0 && 
        selectedStudyField && selectedLanguage && selectedYear && selectedGroupNumber && selectedSubgroupNumber &&
        !selectedSubgroupId) {
      // Găsește ID-urile după ce toate datele sunt încărcate
      console.log('All data loaded, finding IDs...');
      findUserSelectionIdsFromData(
        selectedStudyField,
        selectedLanguage, 
        selectedYear,
        selectedGroupNumber,
        selectedSubgroupNumber
      );
    }
  }, [allSpecializations, studyYears, allGroups, allSubgroups, selectedStudyField, selectedLanguage, selectedYear, selectedGroupNumber, selectedSubgroupNumber, selectedSubgroupId]);

  // Update year options when study field or language changes
  useEffect(() => {
    if (studyYears.length > 0 && allSpecializations.length > 0) {
      updateYearOptions(studyYears, selectedStudyField, selectedLanguage);
    }
  }, [selectedStudyField, selectedLanguage, studyYears, allSpecializations]);
  
  // Update group options when year changes
  useEffect(() => {
    console.log('Group effect triggered:', { selectedYearId, allGroupsLength: allGroups.length });
    
    if (selectedYearId && allGroups.length > 0) {
      const yearGroups = allGroups.filter(group => group.study_year_id === selectedYearId);
      console.log('Found year groups:', yearGroups);
      
      const uniqueGroups = yearGroups.map(group => ({
        id: group.group_id,
        number: group.group_number
      }));
      
      uniqueGroups.sort((a, b) => a.number - b.number);
      setFilteredGroupOptions(uniqueGroups);
      console.log('Set filtered group options:', uniqueGroups);
    } else {
      setFilteredGroupOptions([]);
    }
    
    // Reset dependent selections only when user manually changes year in edit mode
    if (isEditMode && selectedYearId && userData && originalUserData) {
      if (selectedYear !== originalUserData.study_year) {
        setSelectedGroupId(null);
        setSelectedGroupNumber(null);
        setSelectedSubgroupId(null);
        setSelectedSubgroupNumber(null);
      }
    }
  }, [selectedYearId, allGroups, isEditMode, selectedYear, userData, originalUserData]);
  
  // Update subgroup options when group changes
  useEffect(() => {
    console.log('Subgroup effect triggered:', { selectedGroupId, allSubgroupsLength: allSubgroups.length });
    
    if (selectedGroupId && allSubgroups.length > 0) {
      const groupSubgroups = allSubgroups.filter(subgroup => subgroup.group_id === selectedGroupId);
      console.log('Found group subgroups:', groupSubgroups);
      
      const uniqueSubgroups = groupSubgroups.map(subgroup => ({
        id: subgroup.subgroup_id,
        number: subgroup.subgroup_number
      }));
      
      uniqueSubgroups.sort((a, b) => a.number - b.number);
      setFilteredSubgroupOptions(uniqueSubgroups);
      console.log('Set filtered subgroup options:', uniqueSubgroups);
    } else {
      setFilteredSubgroupOptions([]);
    }
    
    // Reset dependent selections only when user manually changes group in edit mode
    if (isEditMode && selectedGroupId && userData && originalUserData) {
      if (selectedGroupNumber !== originalUserData.group_number) {
        setSelectedSubgroupId(null);
        setSelectedSubgroupNumber(null);
      }
    }
  }, [selectedGroupId, allSubgroups, isEditMode, selectedGroupNumber, userData, originalUserData]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (!userData) return;

    setUserData({
      ...userData,
      [name]: value
    });
    setIsFormModified(true);
  };

  const handleEditMode = () => {
    setIsEditMode(true);
  };

  const handleCancelEdit = () => {
    if (!originalUserData) return;
    
    setUserData(originalUserData);
    setSelectedStudyField(originalUserData.specialization || '');
    setSelectedLanguage(originalUserData.specialization_language || '');
    setSelectedYear(originalUserData.study_year || null);
    setSelectedGroupNumber(originalUserData.group_number || null);
    setSelectedSubgroupNumber(originalUserData.subgroup_number || null);
    setIsEditMode(false);
    setIsFormModified(false);
    setMessage(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userData) return;

    if (isEditMode) {
      // Validate dropdown selections
      if (!selectedStudyField || !selectedLanguage || !selectedYear || 
          !selectedGroupNumber || !selectedSubgroupNumber) {
        setMessage({ text: 'Completați toate câmpurile obligatorii.', type: 'error' });
        return;
      }

      // Validează că avem selectedSubgroupId (ID-ul calculat al subgrupei)
      if (!selectedSubgroupId) {
        setMessage({ text: 'Eroare la identificarea subgrupei. Vă rugăm încercați din nou.', type: 'error' });
        return;
      }

      // Verifică dacă subgrupa s-a schimbat față de cea inițială
      const originalSubgroupId = originalUserData?.subgroup_id?.toString();
      const newSubgroupId = selectedSubgroupId;
      
      if (originalSubgroupId && newSubgroupId && originalSubgroupId !== newSubgroupId) {
        // Afișează warning pentru schimbarea subgrupei folosind SweetAlert2
        const result = await Swal.fire({
          title: '⚠️ Atenție',
          html: `
            <p>Odată ce modifici informațiile academice, orarul se va modifica conform datelor selectate.</p>
            <p>Cursurile din vechea subgrupă vor fi înlocuite cu cele din noua subgrupă.</p>
          `,
          icon: 'warning',
          showCancelButton: true,
          confirmButtonText: 'Confirmă modificările',
          cancelButtonText: 'Anulează',
          confirmButtonColor: '#dc2626',
          cancelButtonColor: '#6b7280',
          reverseButtons: true
        });

        if (result.isConfirmed) {
          // Utilizatorul a confirmat, continuă cu salvarea
          await performSave();
        } else {
          // Utilizatorul a anulat, revino la datele inițiale
          handleWarningCancel();
        }
        return;
      }

      // Dacă nu s-a schimbat subgrupa sau nu avem date de comparație, continuă cu salvarea
      await performSave();
    } else {
      // Dacă nu suntem în edit mode, doar actualizează local (comportamentul original)
      apiService.storeUserData(userData);
      setMessage({ text: 'Profilul a fost actualizat local!', type: 'success' });
      setIsFormModified(false);
    }
  };

  const performSave = async () => {
    if (!userData || !selectedSubgroupId) return;

    try {
      // Setează loading message
      setMessage({ text: 'Se salvează modificările...', type: 'info' });

      // Pregătește datele pentru actualizarea profilului pe server
      const profileUpdateData = {
        student_id: userData.student_id,
        first_name: userData.first_name,
        last_name: userData.last_name,
        subgroup_id: selectedSubgroupId
      };

      // Trimite datele la server
      const response = await apiService.updateStudentProfile(profileUpdateData);

      if (response.status === 200) {
        // Update userData with dropdown selections pentru componenta locală
        const updatedUserData = {
          ...userData,
          specialization: selectedStudyField,
          specialization_language: selectedLanguage,
          study_year: selectedYear,
          group_number: selectedGroupNumber,
          subgroup_number: selectedSubgroupNumber,
          subgroup_id: parseInt(selectedSubgroupId) // Actualizează și subgroup_id local
        };

        setUserData(updatedUserData);
        setOriginalUserData(updatedUserData);

        // Actualizează localStorage cu datele din răspunsul serverului
        const currentUserData = apiService.getUserData();
        if (currentUserData && response.data && response.data.user) {
          const updatedStorageData = {
            ...currentUserData, // Păstrează toate datele existente (including password)
            first_name: response.data.user.first_name,
            last_name: response.data.user.last_name,
            subgroup_id: response.data.user.subgroup_id
          };
          
          apiService.storeUserData(updatedStorageData);
        }
        
        setMessage({ text: 'Profilul a fost actualizat cu succes!', type: 'success' });
        setIsFormModified(false);
        setIsEditMode(false);
      } else {
        setMessage({ 
          text: response.message || 'Eroare la actualizarea profilului pe server.', 
          type: 'error' 
        });
      }
    } catch (error) {
      console.error('Eroare la salvarea profilului:', error);
      setMessage({ 
        text: 'Eroare la comunicarea cu serverul. Vă rugăm încercați din nou.', 
        type: 'error' 
      });
    }
  };

  const handleWarningCancel = () => {
    if (!originalUserData) return;
    
    // Revino la datele inițiale
    setUserData(originalUserData);
    setSelectedStudyField(originalUserData.specialization || '');
    setSelectedLanguage(originalUserData.specialization_language || '');
    setSelectedYear(originalUserData.study_year || null);
    setSelectedGroupNumber(originalUserData.group_number || null);
    setSelectedSubgroupNumber(originalUserData.subgroup_number || null);
    
    // Resetează și ID-urile calculate
    setSelectedYearId(null);
    setSelectedGroupId(null);
    setSelectedSubgroupId(null);
    
    setIsFormModified(false);
    setMessage(null);
  };

  if (loading || !userData) {
    return (
      <div className="profile-page">
        <div className="edit-profile-container">
          <div className="loading-container">
            <p>Se încarcă datele profilului...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="profile-page">
      <div className="edit-profile-container">
        <div className="profile-header">
          <button className="back-button" onClick={() => navigate('/schedule')} title="Înapoi la orar">
            <ArrowLeft size={20} />
            <span>Înapoi la orar</span>
          </button>
          <div className="header-title-container">
            <h1>Editare Profil</h1>
            {!isEditMode ? (
              <button
                className="edit-mode-button"
                onClick={handleEditMode}
                title="Editează profilul"
              >
                <Edit size={18} />
                <span>Editează</span>
              </button>
            ) : (
              <div className="edit-mode-actions">
                <button
                  className="save-edit-button"
                  onClick={handleSubmit}
                  title="Salvează modificările"
                  disabled={!isFormModified || dropdownsLoading}
                >
                  <Save size={18} />
                  <span>Salvează</span>
                </button>
                <button
                  className="cancel-edit-button"
                  onClick={handleCancelEdit}
                  title="Anulează editarea"
                >
                  <X size={18} />
                  <span>Anulează</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {message && <div className={`message ${message.type}`}>{message.text}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-section">
            <h2>Informații Personale</h2>

            <div className="form-row">
              <div className="form-group half-width">
                <label htmlFor="first_name">Prenume</label>
                <input
                  type="text"
                  id="first_name"
                  name="first_name"
                  className='name-input'
                  value={userData?.first_name || ''}
                  onChange={handleInputChange}
                  required
                  disabled={!isEditMode}
                />
              </div>

              <div className="form-group half-width">
                <label htmlFor="last_name">Nume</label>
                <input
                  type="text"
                  id="last_name"
                  name="last_name"
                  className='name-input'
                  value={userData?.last_name || ''}
                  onChange={handleInputChange}
                  required
                  disabled={!isEditMode}
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                type="email"
                id="email"
                name="email"
                className='email-input'
                value={userData?.email || ''}
                onChange={handleInputChange}
                required
                disabled
              />
            </div>
          </div>

          <div className="form-section">
            <h2>Informații Academice</h2>

            <div className="dropdown-section">
              <div className="form-group">
                <label>Specializare</label>
                <Combobox 
                  className="combobox-edit" 
                  placeholder={dropdownsLoading ? "Încărcare specializări..." : !isEditMode ? (selectedStudyField || "Specializare") : "Selectează-ți specializarea"} 
                  onOptionSelect={(_, data) => {
                    if (isEditMode) {
                      setSelectedStudyField(data.optionValue ?? '');
                      setIsFormModified(true);
                    }
                  }}
                  value={selectedStudyField}
                  disabled={!isEditMode || dropdownsLoading}
                >
                  {studyOptions.map((option) => (
                    <Option key={option} text={option} value={option}>{option}</Option>
                  ))}
                </Combobox>
              </div>

              <div className="form-group">
                <label>Limba de predare</label>
                <Combobox 
                  className="combobox-edit" 
                  placeholder={dropdownsLoading ? "Încărcare limba de predare..." : !isEditMode ? (selectedLanguage || "Limba de predare") : "Selectează limba de predare"} 
                  onOptionSelect={(_, data) => {
                    if (isEditMode) {
                      setSelectedLanguage(data.optionValue ?? '');
                      setIsFormModified(true);
                    }
                  }}
                  value={selectedLanguage}
                  disabled={!isEditMode || dropdownsLoading}
                >
                  {languageOptions.map((option) => (
                    <Option key={option} text={option} value={option}>{option}</Option>
                  ))}
                </Combobox>
              </div>

              <div className="form-group">
                <label>An de studiu</label>
                <Combobox
                  className="combobox-edit"
                  placeholder={dropdownsLoading ? "Încărcare an studii..." : !isEditMode ? (selectedYear ? `Anul ${selectedYear}` : "An de studiu") : filteredYearOptions.length === 0 ? "Selectează specializarea și limba mai întâi" : "Selectează anul"}
                  onOptionSelect={(_, data) => {
                    if (isEditMode) {
                      setSelectedYearId(data.optionValue || null);
                      const yearOption = filteredYearOptions.find(y => y.id === data.optionValue);
                      setSelectedYear(yearOption ? yearOption.year : null);
                      setIsFormModified(true);
                    }
                  }}
                  value={selectedYear ? `${selectedYear}` : ''}
                  disabled={!isEditMode || dropdownsLoading}
                >
                  {filteredYearOptions.map((option) => (
                    <Option key={option.id} text={`Anul ${option.year}`} value={option.id}>
                      Anul {option.year}
                    </Option>
                  ))}
                </Combobox>
              </div>

              <div className="form-row">
                <div className="form-group half-width">
                  <label>Grupa</label>
                  <Combobox
                    placeholder={dropdownsLoading ? "Încărcare grupe..." : !isEditMode ? (selectedGroupNumber ? `Grupa ${selectedGroupNumber}` : "Grupa") : filteredGroupOptions.length === 0 ? "Selectează anul și specializarea mai întâi" : "Selectează grupa"}
                    className="combobox-edit"
                    onOptionSelect={(_, data) => {
                      if (isEditMode) {
                        setSelectedGroupId(data.optionValue || null);
                        const groupOption = filteredGroupOptions.find(g => g.id === data.optionValue);
                        setSelectedGroupNumber(groupOption ? groupOption.number : null);
                        setIsFormModified(true);
                      }
                    }}
                    value={selectedGroupNumber ? `${selectedGroupNumber}` : ''} 
                    disabled={!isEditMode || dropdownsLoading}
                  >
                    {filteredGroupOptions.map((option) => (
                      <Option key={option.id} text={`Grupa ${option.number}`} value={option.id}>
                        Grupa {option.number}
                      </Option>
                    ))}
                  </Combobox>
                </div>

                <div className="form-group half-width">
                  <label>Subgrupa</label>
                  <Combobox
                    placeholder={dropdownsLoading ? "Încărcare subgrupe..." : !isEditMode ? (selectedSubgroupNumber ? `Subgrupa ${selectedSubgroupNumber}` : "Subgrupa") : filteredSubgroupOptions.length === 0 ? "Selectează grupa mai întâi" : "Selectează subgrupa"}
                    className="combobox-edit"
                    onOptionSelect={(_, data) => {
                      if (isEditMode) {
                        setSelectedSubgroupId(data.optionValue || null);
                        const subgroupOption = filteredSubgroupOptions.find(s => s.id === data.optionValue);
                        setSelectedSubgroupNumber(subgroupOption ? subgroupOption.number : null);
                        setIsFormModified(true);
                      }
                    }}
                   value={selectedSubgroupNumber ? `${selectedSubgroupNumber}` : ''} 
                    disabled={!isEditMode || dropdownsLoading}
                  >
                    {filteredSubgroupOptions.map((option) => (
                      <Option key={option.id} text={`Subgrupa ${option.number}`} value={option.id}>
                        Subgrupa {option.number}
                      </Option>
                    ))}
                  </Combobox>
                </div>
              </div>
            </div>
          </div>

        </form>
      </div>
    </div>
  );
};

export default EditProfile;