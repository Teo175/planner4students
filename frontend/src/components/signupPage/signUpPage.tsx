import { Button, Combobox, Field, Input, Option } from '@fluentui/react-components';
import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './signupPage.scss';
import apiService from "../../server/apiService"; // Adjust this path as needed

// Define the interfaces for our data types
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

const Signup = () => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [selectedStudyField, setSelectedStudyField] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState('');
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [selectedYearId, setSelectedYearId] = useState<string | null>(null);
  const [selectedGroupNumber, setSelectedGroupNumber] = useState<number | null>(null);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [selectedSubgroupNumber, setSelectedSubgroupNumber] = useState<number | null>(null);
  const [selectedSubgroupId, setSelectedSubgroupId] = useState<string | null>(null);
  const navigate = useNavigate();

  // State for options from API
  const [studyOptions, setStudyOptions] = useState<string[]>([]);
  const [languageOptions, setLanguageOptions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Add new state for data
  const [allSpecializations, setAllSpecializations] = useState<Specialization[]>([]);
  const [studyYears, setStudyYears] = useState<StudyYear[]>([]);
  const [allGroups, setAllGroups] = useState<Group[]>([]);
  const [allSubgroups, setAllSubgroups] = useState<Subgroup[]>([]);
  
  // Filtered options for displaying in dropdowns
  const [filteredYearOptions, setFilteredYearOptions] = useState<{id: string, year: number}[]>([]);
  const [filteredGroupOptions, setFilteredGroupOptions] = useState<{id: string, number: number}[]>([]);
  const [filteredSubgroupOptions, setFilteredSubgroupOptions] = useState<{id: string, number: number}[]>([]);

  // Fetch all data when component mounts
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch specializations
        const options = await apiService.getStudyOptions();
        setStudyOptions(options.uniqueNames);
        setLanguageOptions(options.uniqueLanguages);
        setAllSpecializations(options.allSpecializations);
        
        // Fetch study years
        const years = await apiService.getStudyYears();
        setStudyYears(years);
        
        // Fetch all groups
        const groups = await apiService.getGroups();
        setAllGroups(groups);
        
        // Fetch all subgroups
        const subgroups = await apiService.getSubgroups();
        setAllSubgroups(subgroups);
        
        // Initialize with all years if no filters are applied
        updateYearOptions(years, '', '');
        
        setError(null);
      } catch (err) {
        console.error('Eroare:', err);
        setError('Eroare. Încearcă mai târziu.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);
  
  // Update year options when study field or language changes
  useEffect(() => {
    updateYearOptions(studyYears, selectedStudyField, selectedLanguage);
  }, [selectedStudyField, selectedLanguage, studyYears]);
  
  // Update group options when year changes
  useEffect(() => {
    if (selectedYearId) {
      // Filter groups by selected year ID
      const yearGroups = allGroups.filter(group => group.study_year_id === selectedYearId);
      const uniqueGroups = yearGroups.map(group => ({
        id: group.group_id,
        number: group.group_number
      }));
      
      // Sort by group number
      uniqueGroups.sort((a, b) => a.number - b.number);
      setFilteredGroupOptions(uniqueGroups);
    } else {
      setFilteredGroupOptions([]);
    }
    
    // Clear selected group when year changes
    setSelectedGroupId(null);
    setSelectedGroupNumber(null);
    setSelectedSubgroupId(null);
    setSelectedSubgroupNumber(null);
  }, [selectedYearId, allGroups]);
  
  // Update subgroup options when group changes
  useEffect(() => {
    if (selectedGroupId) {
      // Filter subgroups by selected group ID
      const groupSubgroups = allSubgroups.filter(subgroup => subgroup.group_id === selectedGroupId);
      const uniqueSubgroups = groupSubgroups.map(subgroup => ({
        id: subgroup.subgroup_id,
        number: subgroup.subgroup_number
      }));
      
      // Sort by subgroup number
      uniqueSubgroups.sort((a, b) => a.number - b.number);
      setFilteredSubgroupOptions(uniqueSubgroups);
    } else {
      setFilteredSubgroupOptions([]);
    }
    
    // Clear selected subgroup when group changes
    setSelectedSubgroupId(null);
    setSelectedSubgroupNumber(null);
  }, [selectedGroupId, allSubgroups]);
  
  // Function to update year options based on selected field and language
  const updateYearOptions = (years: StudyYear[], field: string, language: string) => {
    if (!field && !language) {
      // If no field and language selected, show all years
      const uniqueYears = Array.from(new Set(years.map(y => y.year)))
        .map(year => {
          // Find first study_year_id for this year number
          const yearObj = years.find(y => y.year === year);
          return { id: yearObj?.study_year_id || '', year: year };
        });
      
      // Sort by year
      uniqueYears.sort((a, b) => a.year - b.year);
      setFilteredYearOptions(uniqueYears);
      return;
    }
    
    // Find matching specializations based on selected field and language
    const matchingSpecs = allSpecializations.filter(spec => 
      (field ? spec.name === field : true) && 
      (language ? spec.language === language : true)
    );
    
    if (matchingSpecs.length === 0) {
      setFilteredYearOptions([]);
      return;
    }
    
    // Get years for the matching specializations
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

  const handleSubmit = async () => {
    if (!firstName || !lastName || !email || !password || 
        !selectedStudyField || !selectedLanguage || 
        !selectedYear || !selectedGroupNumber || !selectedSubgroupNumber) {
      setError('Completați toate câmpurile obligatorii.');
      return;
    }

    const userData = {
      first_name: firstName,
      last_name: lastName,
      email,
      password,
      specialization_name: selectedStudyField,
      specialization_language: selectedLanguage,
      study_year: selectedYear,
      group_number: selectedGroupNumber,
      subgroup_number: selectedSubgroupNumber
    };
    
    try {
      // Use apiService for signup
      const result = await apiService.signup(userData);
      
      if (result.status === 200) {
        // Store token if provided
        if (result.data && result.data.token) {
          localStorage.setItem('authToken', result.data.token);
          apiService.storeUserData(result.data.user)
        }
        navigate("/schedule");
        console.log('Signup successful:', result);
      } else {
        setError(result.message || 'Signup failed');
      }
    } catch (error) {
      console.error('Signup error:', error);
      setError('Network error during signup');
    }
  };

  return (
    <div className="signup-container">
      <div className="signup-form">
        <p>Înregistrează-te pe Planner4Students!</p>
        {error && <p className="error-message">{error}</p>}
        
        <div className="form-row">
          <Field label="Prenume" className="field-container">
            <Input placeholder="Ion" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
          </Field>
          <Field label="Nume" className="field-container">
            <Input placeholder="Popescu" value={lastName} onChange={(e) => setLastName(e.target.value)} />
          </Field>
        </div>
        <div>
          <Field label="Email" className="field-container">
            <Input placeholder="johndoe@stud.ubbcluj.ro" value={email} onChange={(e) => setEmail(e.target.value)} />
          </Field>
          <Field label="Parola" className="field-container">
            <Input type="password" placeholder="parola" value={password} onChange={(e) => setPassword(e.target.value)} />
          </Field>
        </div>
        <div className="selection-container">
          <Combobox 
            className="combobox" 
            placeholder={loading ? "Încărcare specializări..." : "Selectează-ți specializarea"} 
            onOptionSelect={(_, data) => setSelectedStudyField(data.optionValue ?? '')}
            disabled={loading}
          >
            {studyOptions.map((option) => (
              <Option key={option} text={option} value={option}>{option}</Option>
            ))}
          </Combobox>
          <Combobox 
            className="combobox" 
            placeholder={loading ? "Încărcare limba de predare..." : "Selectează limba de predare"} 
            onOptionSelect={(_, data) => setSelectedLanguage(data.optionValue ?? '')}
            disabled={loading}
          >
            {languageOptions.map((option) => (
              <Option key={option} text={option} value={option}>{option}</Option>
            ))}
          </Combobox>
          
          <Combobox
            className="combobox"
            placeholder={loading ? "Încărcare an studii..." : filteredYearOptions.length === 0 ? "Nu există ani de studiu" : "Selectează anul"}
            onOptionSelect={(_, data) => {
              setSelectedYearId(data.optionValue || null);
              const yearOption = filteredYearOptions.find(y => y.id === data.optionValue);
              setSelectedYear(yearOption ? yearOption.year : null);
            }}
            disabled={loading || filteredYearOptions.length === 0}
          >
            {filteredYearOptions.map((option) => (
              <Option key={option.id} text={`Anul ${option.year}`} value={option.id}>
                Anul {option.year}
              </Option>
            ))}
          </Combobox>
        </div>
        <div className="form-row">
          <Combobox
            placeholder={loading ? "Încărcare grupe..." : filteredGroupOptions.length === 0 ? "Selectează anul mai întâi" : "Selectează grupa"}
            className="combobox2"
            onOptionSelect={(_, data) => {
              setSelectedGroupId(data.optionValue || null);
              const groupOption = filteredGroupOptions.find(g => g.id === data.optionValue);
              setSelectedGroupNumber(groupOption ? groupOption.number : null);
            }}
            disabled={loading || filteredGroupOptions.length === 0}
          >
            {filteredGroupOptions.map((option) => (
              <Option key={option.id} text={`Grupa ${option.number}`} value={option.id}>
                Grupa {option.number}
              </Option>
            ))}
          </Combobox>
          <Combobox
            placeholder={loading ? "Încărcare subgrupe..." : filteredSubgroupOptions.length === 0 ? "Selectează grupa mai întâi" : "Selectează subgrupa"}
            className="combobox2"
            onOptionSelect={(_, data) => {
              setSelectedSubgroupId(data.optionValue || null);
              const subgroupOption = filteredSubgroupOptions.find(s => s.id === data.optionValue);
              setSelectedSubgroupNumber(subgroupOption ? subgroupOption.number : null);
            }}
            disabled={loading || filteredSubgroupOptions.length === 0}
          >
            {filteredSubgroupOptions.map((option) => (
              <Option key={option.id} text={`Subgrupa ${option.number}`} value={option.id}>
                Subgrupa {option.number}
              </Option>
            ))}
          </Combobox>
        </div>
        <Button onClick={handleSubmit} disabled={loading}>Creează-ți cont</Button>
        <p>Ai deja un cont? <Link to="/login">Loghează-te</Link></p>
      </div>
    </div>
  );
};

export default Signup;