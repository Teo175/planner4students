import { ReactNode, useEffect } from "react";
import { useNavigate } from "react-router-dom";


interface ProtectedRouteProps {
    children: ReactNode;
  }
  
  export const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
    const navigate = useNavigate();
    
    useEffect(() => {
      if (isTokenExpired()) {
        removeToken();
        navigate('/login');
      }
    }, [navigate]);
  
    return isTokenExpired() ? null : children;
  };

  export const isTokenExpired = () => {
    const token = localStorage.getItem('authToken');
    if (!token) return true;
    
    // Option 1: Parse JWT to check expiration (client-side)
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.exp * 1000 < Date.now();
    } catch (error) {
      return true;
    }
  };
  
export const removeToken = () => {
    localStorage.removeItem('authToken');
  };