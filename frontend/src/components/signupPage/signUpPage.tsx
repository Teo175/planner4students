import { Button, Combobox, Field, Input, Option } from '@fluentui/react-components';
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './signUpPage.scss';

const SignUp = () => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [selectedStudyField, setSelectedStudyField] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState('');
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const navigate = useNavigate();


  const studyOptions = ["Matematica", "Informatica", "Matematica-Informatica"];
  const languageOptions = ["Romana", "Engleza", "Maghiara", "Germana"];
  const yearOptions = ["1","2","3"];

  const handleSubmit = async () => {
    const userData = {
      first_name:firstName,
      last_name: lastName,
      email,
      password,
      field: selectedStudyField,
      language: selectedLanguage,
      year_of_study: selectedYear
    };
    
    try {
      const response = await fetch('http://127.0.0.1:5000/signUp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData)
      });
      const result = await response.json();
      navigate("/dashboard");
      console.log('Signup successful:', result);
    } catch (error) {
      console.error('Signup error:', error);
    }
  };

  return (
    <div className="signup-container">
      <div className="signup-form">
        <p>Sign up for Planner4Students!</p>
        <div className="form-row">
          <Field label="First name" className="field-container">
            <Input placeholder="John" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
          </Field>
          <Field label="Last name" className="field-container">
            <Input placeholder="Doe" value={lastName} onChange={(e) => setLastName(e.target.value)} />
          </Field>
        </div>
        <div>
          <Field label="Email" className="field-container">
            <Input placeholder="johndoe@stud.ubbcluj.ro" value={email} onChange={(e) => setEmail(e.target.value)} />
          </Field>
          <Field label="Password" className="field-container">
            <Input type="password" placeholder="password" value={password} onChange={(e) => setPassword(e.target.value)} />
          </Field>
        </div>
        <div className="selection-container">
          <Combobox className="combobox" placeholder="Select study field" onOptionSelect={(_, data) => setSelectedStudyField(data.optionValue ?? '')}>
            {studyOptions.map((option) => (
              <Option key={option} value={option}>{option}</Option>
            ))}
          </Combobox>
          <Combobox className="combobox" placeholder="Select language" onOptionSelect={(_, data) => setSelectedLanguage(data.optionValue ?? '')}>
            {languageOptions.map((option) => (
              <Option key={option} value={option}>{option}</Option>
            ))}
          </Combobox>
          <Combobox
            className="combobox"
            placeholder="Select year"
            onOptionSelect={(_, data) => setSelectedYear(data.optionValue ? Number(data.optionValue) : null)}
          >
          {yearOptions.map((option, index) => (
            <Option key={index} value={(index + 1).toString()}>
              {option}
            </Option>
          ))}
        </Combobox>
        </div>
        <Button onClick={handleSubmit}>Sign up</Button>
        <p>Already have an account? <Link to="/logIn">Log in</Link></p>
      </div>
    </div>
  );
};

export default SignUp;
