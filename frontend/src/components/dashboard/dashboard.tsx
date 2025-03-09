import React from 'react';
import { useNavigate } from 'react-router-dom';
import './dashboard.scss';  

const Dashboard = () => {
  const navigate = useNavigate();

  const authToken = localStorage.getItem('authToken');
  if (!authToken) {
    navigate('/logIn'); 
  }

  return (
    <div className="dashboard-container">
      <h1>Welcome to the Dashboard!</h1>
      <p>This is an empty dashboard page. You can add your content here.</p>
      <button onClick={() => navigate('/profile')}>Go to Profile</button>
    </div>
  );
};

export default Dashboard;
