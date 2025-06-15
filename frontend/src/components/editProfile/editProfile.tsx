import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Edit, Save, X } from 'lucide-react';
import { Combobox, Option } from '@fluentui/react-components';
import Swal from 'sweetalert2';
import './EditProfile.scss';
import apiService from '../../api/server/apiService';
import { UserData, Specialization, StudyYear, Group, Subgroup } from '../../common';

const EditProfile: React.FC = () => {
  const [userData, setUserData] = useState<UserData | undefined>();
  const [originalUserData, setOriginalUserData] = useState<UserData | null>(null);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [isFormModified, setIsFormModified] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  
  const [selectedStudyField, setSelectedStudyField] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState('');
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [selectedYearId, setSelectedYearId] = useState<string | null>(null);
  const [selectedGroupNumber, setSelectedGroupNumber] = useState<number | null>(null);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [selectedSubgroupNumber, setSelectedSubgroupNumber] = useState<number | null>(null);
  const [selectedSubgroupId, setSelectedSubgroupId] = useState<string | null>(null);

  const [studyOptions, setStudyOptions] = useState<string[]>([]);
  const [languageOptions, setLanguageOptions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [dropdownsLoading, setDropdownsLoading] = useState(false);
  
  const [allSpecializations, setAllSpecializations] = useState<Specialization[]>([]);
  const [studyYears, setStudyYears] = useState<StudyYear[]>([]);
  const [allGroups, setAllGroups] = useState<Group[]>([]);
  const [allSubgroups, setAllSubgroups] = useState<Subgroup[]>([]);
  
  const [filteredYearOptions, setFilteredYearOptions] = useState<{id: string, year: number}[]>([]);
  const [filteredGroupOptions, setFilteredGroupOptions] = useState<{id: string, number: number}[]>([]);
  const [filteredSubgroupOptions, setFilteredSubgroupOptions] = useState<{id: string, number: number}[]>([]);

  const navigate = useNavigate();

  const canNavigateBack = userData?.subgroup_id !== null;

  useEffect(() => {
    if (!canNavigateBack) {
      const handlePopstate = (event: PopStateEvent) => {
        window.history.pushState(null, '', window.location.href);
      };

      window.history.pushState(null, '', window.location.href);
      
      window.addEventListener('popstate', handlePopstate);

      return () => {
        window.removeEventListener('popstate', handlePopstate);
      };
    } else {
      const handlePopstate = () => {
        navigate('/schedule', { replace: true });
      };

      window.history.pushState(null, '', window.location.href);
      
      window.addEventListener('popstate', handlePopstate);

      return () => {
        window.removeEventListener('popstate', handlePopstate);
      };
    }
  }, [navigate, canNavigateBack]);

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

  const findUserSelectionIdsFromData = (specialization: string, language: string, year: number, groupNum: number, subgroupNum: number) => {
    console.log('Finding IDs for:', { specialization, language, year, groupNum, subgroupNum });
    
    try {
      const spec = allSpecializations.find(s => 
        s.name === specialization && s.language === language
      );
      if (!spec) {
        console.warn('Specialization not found:', { specialization, language });
        return;
      }
      console.log('Found specialization:', spec);

      const studyYear = studyYears.find(y => 
        y.year === year && y.specialization_id === spec.specialization_id
      );
      if (!studyYear) {
        console.warn('Study year not found:', { year, specialization_id: spec.specialization_id });
        return;
      }
      console.log('Found study year:', studyYear);
      setSelectedYearId(studyYear.study_year_id);

      const group = allGroups.find(g => 
        g.group_number === groupNum && g.study_year_id === studyYear.study_year_id
      );
      if (!group) {
        console.warn('Group not found:', { groupNum, study_year_id: studyYear.study_year_id });
        return;
      }
      console.log('Found group:', group);
      setSelectedGroupId(group.group_id);

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

  const fetchDropdownData = async () => {
    if (dropdownsLoading) return;
    
    try {
      setDropdownsLoading(true);
      
      console.log('Fetching dropdown data...');
      
      const options = await apiService.getStudyOptions();
      setStudyOptions(options.uniqueNames);
      setLanguageOptions(options.uniqueLanguages);
      setAllSpecializations(options.allSpecializations);
      console.log('Loaded specializations:', options.allSpecializations.length);
      
      const years = await apiService.getStudyYears();
      setStudyYears(years);
      console.log('Loaded study years:', years.length);
      
      const groups = await apiService.getGroups();
      setAllGroups(groups);
      console.log('Loaded groups:', groups.length);
      
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
        await fetchDropdownData();
        
        const completeUserData = await apiService.getCompleteStudentData();
        
        if (completeUserData) {
          console.log('Complete user data received:', completeUserData);
          
          const mappedUserData: UserData = {
            student_id: completeUserData.student_id,
            first_name: completeUserData.first_name,
            last_name: completeUserData.last_name,
            email: completeUserData.email,
            subgroup_id: completeUserData.subgroup_id,
            specialization: completeUserData.specialization,
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

  useEffect(() => {
    if (allSpecializations.length > 0 && studyYears.length > 0 && allGroups.length > 0 && allSubgroups.length > 0 && 
        selectedStudyField && selectedLanguage && selectedYear && selectedGroupNumber && selectedSubgroupNumber &&
        !selectedSubgroupId) {
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

  useEffect(() => {
    if (studyYears.length > 0 && allSpecializations.length > 0) {
      updateYearOptions(studyYears, selectedStudyField, selectedLanguage);
    }
  }, [selectedStudyField, selectedLanguage, studyYears, allSpecializations]);
  
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
    
    if (isEditMode && selectedYearId && userData && originalUserData) {
      if (selectedYear !== originalUserData.study_year) {
        setSelectedGroupId(null);
        setSelectedGroupNumber(null);
        setSelectedSubgroupId(null);
        setSelectedSubgroupNumber(null);
      }
    }
  }, [selectedYearId, allGroups, isEditMode, selectedYear, userData, originalUserData]);
  
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

    if (!userData.first_name?.trim() || !userData.last_name?.trim()) {
      setMessage({ 
        text: 'Prenumele și numele sunt obligatorii și nu pot fi goale.', 
        type: 'error' 
      });
      return;
    }

    if (isEditMode) {
      if (!selectedStudyField || !selectedLanguage || !selectedYear || 
          !selectedGroupNumber || !selectedSubgroupNumber) {
        setMessage({ text: 'Completați toate câmpurile obligatorii.', type: 'error' });
        return;
      }

      if (!selectedSubgroupId) {
        setMessage({ text: 'Eroare la identificarea subgrupei. Vă rugăm încercați din nou.', type: 'error' });
        return;
      }

      const originalSubgroupId = originalUserData?.subgroup_id?.toString();
      const newSubgroupId = selectedSubgroupId;
      
      if (originalSubgroupId && newSubgroupId && originalSubgroupId !== newSubgroupId) {
       const result = await Swal.fire({
          title: 'Atenție',
          html: `
            <p>Odată ce modifici informațiile academice, orarul se va modifica conform datelor selectate.</p>
            <p>Cursurile din vechea subgrupă vor fi înlocuite cu cele din noua subgrupă.</p>
          `,
          icon: 'warning',
          showCancelButton: true,
          confirmButtonText: 'Confirmă modificările',
          cancelButtonText: 'Anulează',
          confirmButtonColor: '#4CAF50',  
          cancelButtonColor: '#f44336',   
          reverseButtons: true
        });

        if (result.isConfirmed) {
          await performSave();
        } else {
          handleWarningCancel();
        }
        return;
      }

      await performSave();
    } else {
      // Update localStorage with profile changes (first_name, last_name, subgroup_id)
      apiService.updateUserProfile({
        first_name: userData.first_name,
        last_name: userData.last_name,
        subgroup_id: userData.subgroup_id,
        email: userData.email,
        student_id: userData.student_id
      });
      setMessage({ text: 'Profilul a fost actualizat local!', type: 'success' });
      setIsFormModified(false);
    }
  };
const performSave = async () => {
  if (!userData || !selectedSubgroupId) return;

  try {
    setMessage({ text: 'Se salvează modificările...', type: 'info' });

    const profileUpdateData = {
      student_id: userData.student_id,
      first_name: userData.first_name,
      last_name: userData.last_name,
      subgroup_id: selectedSubgroupId
    };

    const response = await apiService.updateStudentProfile(profileUpdateData);

    if (response.status === 200) {
      const updatedUserData: UserData = {
        ...userData,
        specialization: selectedStudyField,
        specialization_language: selectedLanguage,
        study_year: selectedYear ?? undefined, // Convert null to undefined
        group_number: selectedGroupNumber ?? undefined, // Convert null to undefined
        subgroup_number: selectedSubgroupNumber ?? undefined, // Convert null to undefined
        subgroup_id: selectedSubgroupId, // FIXED: Keep as string, no parseInt
        language: selectedLanguage,
        year: selectedYear ?? undefined // Convert null to undefined
      };

      setUserData(updatedUserData);
      setOriginalUserData(updatedUserData);

      // Update localStorage with new profile data using the new function
      if (response.data && response.data.user) {
        apiService.updateUserProfile({
          first_name: response.data.user.first_name || userData.first_name,
          last_name: response.data.user.last_name || userData.last_name,
          subgroup_id: response.data.user.subgroup_id || selectedSubgroupId, // FIXED: Keep as string
          email: response.data.user.email || userData.email,
          student_id: response.data.user.student_id || userData.student_id
        });
      } else {
        apiService.updateUserProfile({
          first_name: userData.first_name,
          last_name: userData.last_name,
          subgroup_id: selectedSubgroupId, // FIXED: Keep as string
          email: userData.email,
          student_id: userData.student_id
        });
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
    
    setUserData(originalUserData);
    setSelectedStudyField(originalUserData.specialization || '');
    setSelectedLanguage(originalUserData.specialization_language || '');
    setSelectedYear(originalUserData.study_year || null);
    setSelectedGroupNumber(originalUserData.group_number || null);
    setSelectedSubgroupNumber(originalUserData.subgroup_number || null);
    
    setSelectedYearId(null);
    setSelectedGroupId(null);
    setSelectedSubgroupId(null);
    
    setIsFormModified(false);
    setMessage(null);
  };

  const handleBackClick = () => {
    if (canNavigateBack) {
      navigate('/schedule');
    }
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
        <div className="profile-content">
          <div className="profile-header">
            {canNavigateBack && (
              <button className="back-button" onClick={handleBackClick} title="Înapoi la orar">
                <ArrowLeft size={20} />
                <span>Înapoi la orar</span>
              </button>
            )}
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

          {message && <div className={`message-container ${message.type}`}>{message.text}</div>}

          <div className="form-sections-container">
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

              <div className="selection-container">
                <div>
                  <label>Specializare</label>
                  <Combobox
                    className={`combobox ${isEditMode ? 'combobox-edit-mode' : 'combobox-view-mode'}`}
                    placeholder={
                      dropdownsLoading
                        ? "Încărcare specializări..."
                        : !isEditMode
                          ? selectedStudyField || "Specializare"
                          : "Selectează-ți specializarea"
                    }
                    value={selectedStudyField}
                    onOptionSelect={(_, data) => {
                      if (isEditMode) {
                        setSelectedStudyField(data.optionValue ?? '');
                        setIsFormModified(true);
                      }
                    }}
                    disabled={!isEditMode || dropdownsLoading}
                  >
                    {studyOptions.map((option) => (
                      <Option key={option} text={option} value={option}>{option}</Option>
                    ))}
                  </Combobox>
                </div>

                <div>
                  <label>Limba de predare</label>
                  <Combobox
                    className={`combobox ${isEditMode ? 'combobox-edit-mode' : 'combobox-view-mode'}`}
                    placeholder={
                      dropdownsLoading
                        ? "Încărcare limba de predare..."
                        : !isEditMode
                          ? selectedLanguage || "Limba de predare"
                          : "Selectează limba de predare"
                    }
                    value={selectedLanguage}
                    onOptionSelect={(_, data) => {
                      if (isEditMode) {
                        setSelectedLanguage(data.optionValue ?? '');
                        setIsFormModified(true);
                      }
                    }}
                    disabled={!isEditMode || dropdownsLoading}
                  >
                    {languageOptions.map((option) => (
                      <Option key={option} text={option} value={option}>{option}</Option>
                    ))}
                  </Combobox>
                </div>

                <div>
                  <label>Anul</label>
                  <Combobox
                   className={`combobox ${isEditMode ? 'combobox-edit-mode' : 'combobox-view-mode'}`}
                    placeholder={
                      dropdownsLoading
                        ? "Încărcare an studii..."
                        : !isEditMode
                          ? (selectedYear ? `Anul ${selectedYear}` : "An de studiu")
                          : filteredYearOptions.length === 0
                            ? "Selectează specializarea și limba mai întâi"
                            : "Selectează anul"
                    }
                    value={selectedYear ? `Anul ${selectedYear}` : ''}
                    onOptionSelect={(_, data) => {
                      if (isEditMode) {
                        const match = data.optionText?.match(/\d+/);
                        const year = match ? parseInt(match[0]) : null;
                        setSelectedYearId(data.optionValue || null);
                        setSelectedYear(year);
                        setIsFormModified(true);
                      }
                    }}
                    disabled={!isEditMode || dropdownsLoading}
                  >
                    {filteredYearOptions.map((option) => (
                      <Option key={option.id} text={`Anul ${option.year}`} value={option.id}>
                         {option.year}
                      </Option>
                    ))}
                  </Combobox>
                </div>

                <div>
                  <label>Grupa</label>
                  <Combobox
                    className={`combobox ${isEditMode ? 'combobox-edit-mode' : 'combobox-view-mode'}`}
                    placeholder={
                      dropdownsLoading
                        ? "Încărcare grupe..."
                        : !isEditMode
                          ? selectedGroupNumber ? `Grupa ${selectedGroupNumber}` : "Grupa"
                          : filteredGroupOptions.length === 0
                            ? "Selectează anul mai întâi"
                            : "Selectează grupa"
                    }
                    value={selectedGroupNumber ? `Grupa ${selectedGroupNumber}` : ''}
                    onOptionSelect={(_, data) => {
                      if (isEditMode) {
                        const match = data.optionText?.match(/\d+/);
                        const group = match ? parseInt(match[0]) : null;
                        setSelectedGroupId(data.optionValue || null);
                        setSelectedGroupNumber(group);
                        setIsFormModified(true);
                      }
                    }}
                    disabled={!isEditMode || dropdownsLoading}
                  >
                    {filteredGroupOptions.map((option) => (
                      <Option key={option.id} text={`Grupa ${option.number}`} value={option.id}>
                        Grupa {option.number}
                      </Option>
                    ))}
                  </Combobox>
                </div>

                <div>
                  <label>Semigrupa</label>
                  <Combobox
                    className={`combobox ${isEditMode ? 'combobox-edit-mode' : 'combobox-view-mode'}`}
                    placeholder={
                      dropdownsLoading
                        ? "Încărcare subgrupe..."
                        : !isEditMode
                          ? selectedSubgroupNumber ? `Subgrupa ${selectedSubgroupNumber}` : "Subgrupa"
                          : filteredSubgroupOptions.length === 0
                            ? "Selectează grupa mai întâi"
                            : "Selectează subgrupa"
                    }
                    value={selectedSubgroupNumber ? `Subgrupa ${selectedSubgroupNumber}` : ''}
                    onOptionSelect={(_, data) => {
                      if (isEditMode) {
                        const match = data.optionText?.match(/\d+/);
                        const subgroup = match ? parseInt(match[0]) : null;
                        setSelectedSubgroupId(data.optionValue || null);
                        setSelectedSubgroupNumber(subgroup);
                        setIsFormModified(true);
                      }
                    }}
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
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditProfile;