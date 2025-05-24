import { Button, Field, Input } from "@fluentui/react-components";
import { Link, useNavigate } from 'react-router-dom';
import './loginPage.scss';
import { useState } from "react";
import apiService from "../../api/server/apiService";
import { LOGIN_EMAIL_REQUIRED_ERROR, LOGIN_SUCCESS_MESSAGE, LOGIN_INVALID_CREDENTIALS, LOGIN_NETWORK_ERROR_PREFIX, LOGIN_WELCOME_MESSAGE, LOGIN_SUBTITLE, LOGIN_EMAIL_LABEL, LOGIN_EMAIL_PLACEHOLDER, LOGIN_PASSWORD_LABEL, LOGIN_PASSWORD_PLACEHOLDER, LOGIN_BUTTON_LOADING, LOGIN_BUTTON_DEFAULT, LOGIN_NO_ACCOUNT_TEXT, LOGIN_REGISTER_LINK_TEXT } from "../../common/texts";


const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  
  const handleLogin = async () => {
    if (!email || !password) {
      setError(LOGIN_EMAIL_REQUIRED_ERROR);
      return;
    }

    setLoading(true);
    setError('');

    try {
      const data = await apiService.login(email, password);
      
      if (data.status === 200) {
        console.log(LOGIN_SUCCESS_MESSAGE);
        navigate("/schedule");
      } else {
        setError(data.message || LOGIN_INVALID_CREDENTIALS);
        setPassword('');
      }
    } catch (error) {
      setError(LOGIN_NETWORK_ERROR_PREFIX + (error instanceof Error ? error.message : String(error)));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-form">
        <p>{LOGIN_WELCOME_MESSAGE}</p><br></br>
        <p>{LOGIN_SUBTITLE}</p>
        <Field label={LOGIN_EMAIL_LABEL} className="field-container">
            <Input 
            placeholder={LOGIN_EMAIL_PLACEHOLDER}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading}
            />
        </Field>
        <Field label={LOGIN_PASSWORD_LABEL}>
            <Input 
            placeholder={LOGIN_PASSWORD_PLACEHOLDER}
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={loading}
            />
        </Field>
        <Button onClick={handleLogin} disabled={loading}>
            {loading ? LOGIN_BUTTON_LOADING : LOGIN_BUTTON_DEFAULT}
        </Button>
        {error && <p className="error">{error}</p>}

        <p>{LOGIN_NO_ACCOUNT_TEXT}<Link to="/signup">{LOGIN_REGISTER_LINK_TEXT}</Link></p>
      </div>
    </div>
  );
};
  
export default Login;