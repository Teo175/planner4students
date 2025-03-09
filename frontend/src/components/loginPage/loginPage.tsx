import { Button, Field, Input} from "@fluentui/react-components";
import { Link, useNavigate } from 'react-router-dom';
import './loginPage.scss';
import { useState } from "react";
const LogIn = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  
  const handleLogin = async () => {
    if (!email || !password) {
      setError("Email and password are required.");
      return;
    }

    try {
      const response = await fetch(`http://127.0.0.1:5000/logIn?email=${email}`, {
        method: 'GET',
      });

      const data = await response.json();
      if (data.data) {
        if ( data.data.password === password) {
          console.log("Logged in successfully!");
          localStorage.setItem('authToken', data.data.user_id); 
  
          navigate("/dashboard");
        } else {
          setError("Incorrect password.");
        }
      } else {
        setError(data.error || "An error occurred.");
        setEmail('');
        setPassword('');
      }
    } catch (error) {
      setError("Network error: " + error);
    }
  };

    return (
      <div className="login-container">
        <div className="login-form">
          <p>Welcome!</p>
          <p>Sign in to continue.</p>
          <Field label="Email" className="field-container">
              <Input 
              placeholder="johndoe@stud.ubbcluj.ro" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}/>
          </Field>
          <Field label="Password">
              <Input 
              placeholder="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)} />
          </Field>
          <Button onClick={handleLogin}>
              Log in
          </Button>
          {error && <p className="error">{error}</p>}

          <p>Don&apos;t have an account? <Link to="/signUp">Sign up</Link></p>
      </div>
      </div>
    );
  };
  
  export default LogIn;