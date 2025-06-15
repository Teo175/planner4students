import { Button, Combobox, Field, Input, Option } from '@fluentui/react-components';
import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './signupPage.scss';
import apiService from "../../api/server/apiService";
import { StudyYear, Specialization, Group, Subgroup } from "../../common";
import {
  SIGNUP_ALL_FIELDS_REQUIRED,
  SIGNUP_FAILED_ERROR,
  SIGNUP_NETWORK_ERROR,
  SIGNUP_LOADING_ERROR,
  SIGNUP_ALREADY_HAVE_ACCOUNT,
  SIGNUP_LOGIN_LINK_TEXT,
  SIGNUP_FIRST_NAME_LABEL,
  SIGNUP_LAST_NAME_LABEL,
  SIGNUP_EMAIL_LABEL,
  SIGNUP_PASSWORD_LABEL,
  SIGNUP_FIRST_NAME_PLACEHOLDER,
  SIGNUP_LAST_NAME_PLACEHOLDER,
  SIGNUP_EMAIL_PLACEHOLDER,
  SIGNUP_PASSWORD_PLACEHOLDER,
  SIGNUP_LOADING_SPECIALIZATIONS,
  SIGNUP_LOADING_LANGUAGES,
  SIGNUP_LOADING_YEARS,
  SIGNUP_LOADING_GROUPS,
  SIGNUP_LOADING_SUBGROUPS,
  SIGNUP_SELECT_SPECIALIZATION,
  SIGNUP_SELECT_LANGUAGE,
  SIGNUP_SELECT_YEAR,
  SIGNUP_NO_YEARS_AVAILABLE,
  SIGNUP_SELECT_YEAR_FIRST,
  SIGNUP_SELECT_GROUP,
  SIGNUP_SELECT_GROUP_FIRST,
  SIGNUP_SELECT_SUBGROUP,
  SIGNUP_YEAR_PREFIX,
  SIGNUP_GROUP_PREFIX,
  SIGNUP_SUBGROUP_PREFIX,
  SIGNUP_BUTTON_TEXT
} from "../../common/texts";

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
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');

  const navigate = useNavigate();

  const [studyOptions, setStudyOptions] = useState<string[]>([]);
  const [languageOptions, setLanguageOptions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [allSpecializations, setAllSpecializations] = useState<Specialization[]>([]);
  const [studyYears, setStudyYears] = useState<StudyYear[]>([]);
  const [allGroups, setAllGroups] = useState<Group[]>([]);
  const [allSubgroups, setAllSubgroups] = useState<Subgroup[]>([]);
  
  const [filteredYearOptions, setFilteredYearOptions] = useState<{id: string, year: number}[]>([]);
  const [filteredGroupOptions, setFilteredGroupOptions] = useState<{id: string, number: number}[]>([]);
  const [filteredSubgroupOptions, setFilteredSubgroupOptions] = useState<{id: string, number: number}[]>([]);

  const validateEmail = (email: string): boolean => {
    if (!email) {
      setEmailError("Email-ul este obligatoriu");
      return false;
    }
    if (!email.endsWith('@stud.ubbcluj.ro')) {
      setEmailError("Adresa de email trebuie să fie de forma @stud.ubbcluj.ro");
      return false;
    }
    setEmailError('');
    return true;
  };

  const validatePassword = (password: string): boolean => {
    if (!password) {
      setPasswordError("Parola este obligatorie");
      return false;
    }

    const minLength = password.length >= 8;
    const hasLowerCase = /[a-z]/.test(password);
    const hasUpperCase = /[A-Z]/.test(password);
    const hasDigit = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);

    if (!minLength || !hasLowerCase || !hasUpperCase || !hasDigit || !hasSpecialChar) {
      setPasswordError("Parola trebuie să conțină minim 8 caractere, o literă mică, o literă mare, o cifră și un caracter special");
      return false;
    }

    setPasswordError('');
    return true;
  };
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        const options = await apiService.getStudyOptions();
        setStudyOptions(options.uniqueNames);
        setLanguageOptions(options.uniqueLanguages);
        setAllSpecializations(options.allSpecializations);
        
        const years = await apiService.getStudyYears();
        setStudyYears(years);
        
        const groups = await apiService.getGroups();
        setAllGroups(groups);
        
        const subgroups = await apiService.getSubgroups();
        setAllSubgroups(subgroups);
        
        updateYearOptions(years, '', '');
        
        setError(null);
      } catch (err) {
        console.error('Eroare:', err);
        setError(SIGNUP_LOADING_ERROR);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);
  
  useEffect(() => {
    updateYearOptions(studyYears, selectedStudyField, selectedLanguage);
  }, [selectedStudyField, selectedLanguage, studyYears]);
  
  useEffect(() => {
    if (selectedYearId) {
      const yearGroups = allGroups.filter(group => group.study_year_id === selectedYearId);
      const uniqueGroups = yearGroups.map(group => ({
        id: group.group_id,
        number: group.group_number
      }));
      
      uniqueGroups.sort((a, b) => a.number - b.number);
      setFilteredGroupOptions(uniqueGroups);
    } else {
      setFilteredGroupOptions([]);
    }
    
    setSelectedGroupId(null);
    setSelectedGroupNumber(null);
    setSelectedSubgroupId(null);
    setSelectedSubgroupNumber(null);
  }, [selectedYearId, allGroups]);
  
  useEffect(() => {
    if (selectedGroupId) {
      const groupSubgroups = allSubgroups.filter(subgroup => subgroup.group_id === selectedGroupId);
      const uniqueSubgroups = groupSubgroups.map(subgroup => ({
        id: subgroup.subgroup_id,
        number: subgroup.subgroup_number
      }));
      
      uniqueSubgroups.sort((a, b) => a.number - b.number);
      setFilteredSubgroupOptions(uniqueSubgroups);
    } else {
      setFilteredSubgroupOptions([]);
    }
    
    setSelectedSubgroupId(null);
    setSelectedSubgroupNumber(null);
  }, [selectedGroupId, allSubgroups]);
  
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

  const handleSubmit = async () => {
    setError('');
    setEmailError('');
    setPasswordError('');

    const isEmailValid = validateEmail(email);
    const isPasswordValid = validatePassword(password);

   
      if (!firstName || !lastName || !email || !password || 
          !selectedStudyField || !selectedLanguage || 
          !selectedYear || !selectedGroupNumber || !selectedSubgroupNumber) {
        setError(SIGNUP_ALL_FIELDS_REQUIRED);
        return;
      }
    if (!isEmailValid || !isPasswordValid) return;
   
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
      const result = await apiService.signup(userData);
      
      if (result.status === 200) {
        if (result.data && result.data.token) {
          localStorage.setItem('authToken', result.data.token);
          apiService.storeUserData(result.data.user)
        }
        navigate("/schedule");
        console.log('Signup successful:', result);
      } else {
        setError(result.message || SIGNUP_FAILED_ERROR);
      }
    } catch (error) {
      console.error('Signup error:', error);
      setError(SIGNUP_NETWORK_ERROR);
    }
  };

  return (
     <div className="signup-wrapper">
    <div className="video-container">
      <video autoPlay loop muted playsInline>
        <source src="videos/robot-intro.mp4" type="video/mp4" />
      </video>
    </div>
    <div className="signup-container">
        <div className="form-header">
          <img src="images/finalogo.png" alt="Planner 4 Students" className="form-logo" />
        </div>
      <div className="signup-form">
       
        {error && <p className="error-message">{error}</p>}
        
        <div className="form-row">
          <Field label={SIGNUP_FIRST_NAME_LABEL} className="field-container">
            <Input 
              placeholder={SIGNUP_FIRST_NAME_PLACEHOLDER} 
              value={firstName} 
              onChange={(e) => setFirstName(e.target.value)} 
            />
          </Field>
          <Field label={SIGNUP_LAST_NAME_LABEL} className="field-container">
            <Input 
              placeholder={SIGNUP_LAST_NAME_PLACEHOLDER} 
              value={lastName} 
              onChange={(e) => setLastName(e.target.value)} 
            />
          </Field>
        </div>
        <div className="form-row-account">
          <Field label={SIGNUP_EMAIL_LABEL} className="field-container">
            <Input 
              placeholder={SIGNUP_EMAIL_PLACEHOLDER} 
              value={email} 
               onChange={(e) => {
                setEmail(e.target.value);
                if (emailError) validateEmail(e.target.value);
              }}
              className={emailError ? 'input-error' : ''}
            />
            {emailError && <p className="field-error" title={emailError}>{emailError}</p>}
          </Field>
          <Field label={SIGNUP_PASSWORD_LABEL} className="field-container">
            <Input 
              type="password" 
              placeholder={SIGNUP_PASSWORD_PLACEHOLDER} 
              value={password} 
              onChange={(e) => {
                setPassword(e.target.value);
                if (passwordError) validatePassword(e.target.value);
              }}
              className={passwordError ? 'input-error' : ''}
            />
            {passwordError && <p className="field-error" title={passwordError}>{passwordError}</p>}
        </Field>
        </div>
        <div className="selection-container">
          <Combobox 
            className="combobox" 
            placeholder={loading ? SIGNUP_LOADING_SPECIALIZATIONS : SIGNUP_SELECT_SPECIALIZATION} 
            onOptionSelect={(_, data) => setSelectedStudyField(data.optionValue ?? '')}
            disabled={loading}
          >
            {studyOptions.map((option) => (
              <Option key={option} text={option} value={option}>{option}</Option>
            ))}
          </Combobox>
          <Combobox 
            className="combobox" 
            placeholder={loading ? SIGNUP_LOADING_LANGUAGES : SIGNUP_SELECT_LANGUAGE} 
            onOptionSelect={(_, data) => setSelectedLanguage(data.optionValue ?? '')}
            disabled={loading}
          >
            {languageOptions.map((option) => (
              <Option key={option} text={option} value={option}>{option}</Option>
            ))}
          </Combobox>
          
          <Combobox
            className="combobox"
            placeholder={loading ? SIGNUP_LOADING_YEARS : filteredYearOptions.length === 0 ? SIGNUP_NO_YEARS_AVAILABLE : SIGNUP_SELECT_YEAR}
            onOptionSelect={(_, data) => {
              setSelectedYearId(data.optionValue || null);
              const yearOption = filteredYearOptions.find(y => y.id === data.optionValue);
              setSelectedYear(yearOption ? yearOption.year : null);
            }}
            disabled={loading || filteredYearOptions.length === 0}
          >
            {filteredYearOptions.map((option) => (
              <Option key={option.id} text={`${SIGNUP_YEAR_PREFIX}${option.year}`} value={option.id}>
                {SIGNUP_YEAR_PREFIX}{option.year}
              </Option>
            ))}
          </Combobox>
        </div>
        <div className="form-row">
          <Combobox
            placeholder={loading ? SIGNUP_LOADING_GROUPS : filteredGroupOptions.length === 0 ? SIGNUP_SELECT_YEAR_FIRST : SIGNUP_SELECT_GROUP}
            className="combobox2"
            onOptionSelect={(_, data) => {
              setSelectedGroupId(data.optionValue || null);
              const groupOption = filteredGroupOptions.find(g => g.id === data.optionValue);
              setSelectedGroupNumber(groupOption ? groupOption.number : null);
            }}
            disabled={loading || filteredGroupOptions.length === 0}
          >
            {filteredGroupOptions.map((option) => (
              <Option key={option.id} text={`${SIGNUP_GROUP_PREFIX}${option.number}`} value={option.id}>
                {SIGNUP_GROUP_PREFIX}{option.number}
              </Option>
            ))}
          </Combobox>
          <Combobox
            placeholder={loading ? SIGNUP_LOADING_SUBGROUPS : filteredSubgroupOptions.length === 0 ? SIGNUP_SELECT_GROUP_FIRST : SIGNUP_SELECT_SUBGROUP}
            className="combobox2"
            onOptionSelect={(_, data) => {
              setSelectedSubgroupId(data.optionValue || null);
              const subgroupOption = filteredSubgroupOptions.find(s => s.id === data.optionValue);
              setSelectedSubgroupNumber(subgroupOption ? subgroupOption.number : null);
            }}
            disabled={loading || filteredSubgroupOptions.length === 0}
          >
            {filteredSubgroupOptions.map((option) => (
              <Option key={option.id} text={`${SIGNUP_SUBGROUP_PREFIX}${option.number}`} value={option.id}>
                {SIGNUP_SUBGROUP_PREFIX}{option.number}
              </Option>
            ))}
          </Combobox>
        </div>
        <Button onClick={handleSubmit} disabled={loading}>{SIGNUP_BUTTON_TEXT}</Button>
        <p>{SIGNUP_ALREADY_HAVE_ACCOUNT}<Link to="/login">{SIGNUP_LOGIN_LINK_TEXT}</Link></p>
      </div>
    </div>
    </div>
  );
};

export default Signup;