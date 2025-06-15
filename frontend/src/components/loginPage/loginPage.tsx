import { Button, Field, Input } from "@fluentui/react-components";
import { Link, useNavigate } from 'react-router-dom';
import './loginPage.scss';
import { useEffect, useState } from "react";
import apiService from "../../api/server/apiService";
import { LOGIN_INVALID_CREDENTIALS, LOGIN_NETWORK_ERROR_PREFIX, LOGIN_EMAIL_LABEL, LOGIN_EMAIL_PLACEHOLDER, LOGIN_PASSWORD_LABEL, LOGIN_PASSWORD_PLACEHOLDER, LOGIN_BUTTON_LOADING, LOGIN_BUTTON_DEFAULT, LOGIN_NO_ACCOUNT_TEXT, LOGIN_REGISTER_LINK_TEXT } from "../../common/texts";
import Swal from "sweetalert2";

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [generalError, setGeneralError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  
  // Validare email
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

  // Validare parolă
  const validatePassword = (password:string):boolean => {
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

  // Handlers pentru input changes
  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setEmail(value);
    if (emailError) {
      validateEmail(value);
    }
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setPassword(value);
    if (passwordError) {
      validatePassword(value);
    }
  };

  const handleLogin = async () => {
    // Clear toate erorile
    setEmailError('');
    setPasswordError('');
    setGeneralError('');

    // Validare
    const isEmailValid = validateEmail(email);
    const isPasswordValid = validatePassword(password);

    if (!isEmailValid || !isPasswordValid) {
      return;
    }

    setLoading(true);

    try {
      const data = await apiService.login(email, password);
      
      if (data.status === 200) {
        if (data.data.user?.subgroup_id === null) {
           await Swal.fire({
            title: 'Actualizare necesara',
            text: 'Din cauza unor actualizari de sistem, te rugam sa iti reintroduci informatiile academice.',
            icon: 'info',
            confirmButtonText: 'Mergi la profil'
          });
          navigate("/editProfile");
        } else {
          navigate("/schedule");
        }
      } else {
        setGeneralError(data.message || LOGIN_INVALID_CREDENTIALS);
        setPassword('');
      }
    } catch (error) {
      setGeneralError(LOGIN_NETWORK_ERROR_PREFIX + (error instanceof Error ? error.message : String(error)));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('authToken');
    if (token) {
      navigate('/schedule');
    }
  }, []);

  return (
    <div className="login-wrapper">
      <div className="video-container">
        <video autoPlay loop muted playsInline>
          <source src="videos/robot-intro.mp4" type="video/mp4" />
        </video>
      </div>

      <div className="login-container">
        <div className="form-header">
          <img src="images/finalogo.png" alt="Planner 4 Students" className="form-logo" />
        </div>
        <div className="login-form">
          
          <Field label={LOGIN_EMAIL_LABEL} className="field-container">
            <Input 
              placeholder={LOGIN_EMAIL_PLACEHOLDER}
              value={email}
              onChange={handleEmailChange}
              disabled={loading}
              className={emailError ? 'input-error' : ''}
            />
            {emailError && <p className="field-error">{emailError}</p>}
          </Field>

          <Field label={LOGIN_PASSWORD_LABEL} className="field-container">
            <Input 
              placeholder={LOGIN_PASSWORD_PLACEHOLDER}
              type="password"
              value={password}
              onChange={handlePasswordChange}
              disabled={loading}
              className={passwordError ? 'input-error' : ''}
            />
            {passwordError && <p className="field-error">{passwordError}</p>}
          </Field>
        
          <Button onClick={handleLogin} disabled={loading}>
            {loading ? LOGIN_BUTTON_LOADING : LOGIN_BUTTON_DEFAULT}
          </Button>

          {generalError && <p className="general-error">{generalError}</p>}
          
          <p className="register-text">{LOGIN_NO_ACCOUNT_TEXT}<Link to="/signup">{LOGIN_REGISTER_LINK_TEXT}</Link></p>
        
        </div>
      </div>
    </div>
  );
};
  
export default Login;