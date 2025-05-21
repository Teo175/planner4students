import { Button, Field, Input } from "@fluentui/react-components";
import { Link, useNavigate } from 'react-router-dom';
import './loginPage.scss';
import { useState } from "react";
import apiService from "../../server/apiService"; // Adjust this path as needed

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  
  const handleLogin = async () => {
    if (!email || !password) {
      setError("Email and password are required.");
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Use apiService instead of direct fetch
      const data = await apiService.login(email, password);
      
      if (data.status === 200) {
        console.log("Logged in successfully!");
        navigate("/schedule");
      } else {
        // Use the error message from the server
        setError(data.message || "Invalid credentials");
        setPassword(''); // Clear password field on failed login
      }
    } catch (error) {
      setError("Network error: " + (error instanceof Error ? error.message : String(error)));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-form">
        <p>Bine ai venit!</p><br></br>
        <p>Loghează-te pentru a intra în aplicație.</p>
        <Field label="Email" className="field-container">
            <Input 
            placeholder="IonPopescu@stud.ubbcluj.ro" 
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading}
            />
        </Field>
        <Field label="Parola">
            <Input 
            placeholder="parola"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={loading}
            />
        </Field>
        <Button onClick={handleLogin} disabled={loading}>
            {loading ? "Logare..." : "Loghează-te"}
        </Button>
        {error && <p className="error">{error}</p>}

        <p>Nu ai cont? <Link to="/signup">Înregistrează-te</Link></p>
      </div>
    </div>
  );
};
  
export default Login;