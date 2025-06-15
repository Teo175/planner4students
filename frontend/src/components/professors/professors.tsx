import React, { useEffect, useState } from 'react';
import './professors.scss';
import { Professor } from '../../common';
import apiService from '../../api/server/apiService';
import ChatBot from '../chatBot/chatBot';

const Professors: React.FC = () => {
  const [selectedDepartment, setSelectedDepartment] = useState<string>('Departamentul de Matematică');
  const [professors, setProfessors] = useState<Professor[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>(''); // 🔍 search state

  const departments = [
    { value: 'Departamentul de Matematică', label: 'Departamentul de Matematică' },
    { value: 'Departamentul de Informatică', label: 'Departamentul de Informatică' },
    { value: 'Departamentul de Matematică şi Informatică al Liniei Maghiare', label: 'Departamentul de Matematică și Informatică al Liniei Maghiare' }
  ];

  useEffect(() => {
    const fetchProfessors = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await apiService.getProfessorsFromDepartment(selectedDepartment);
        setProfessors(data);
      } catch (err) {
        setError('Eroare la încărcarea profesorilor.');
      } finally {
        setLoading(false);
      }
    };

    fetchProfessors();
  }, [selectedDepartment]);

  const handleGoBack = () => {
    window.history.back();
  };

  // 🔍 Filtrare locală
  const filteredProfessors = professors.filter(prof =>
    `${prof.first_name} ${prof.last_name}`.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="professors-container">
      <div className="back-button-container">
        <button className="back-button" onClick={handleGoBack}>
          <svg className="back-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M19 12H5M12 19L5 12L12 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Înapoi
        </button>
      </div>

      <div className="professors-header">
        <h1 className="professors-title">Cadre didactice titulare</h1>
      
        <div className="department-selector">
          <select
            value={selectedDepartment}
            onChange={(e) => setSelectedDepartment(e.target.value)}
            className="department-select"
          >
            {departments.map(dept => (
              <option key={dept.value} value={dept.value}>
                {dept.label}
              </option>
            ))}
          </select>
        </div>

        {/* 🔍 Search input */}
        <div className="search-bar">
          <div className="search-input-container">
            <svg className="search-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2"/>
              <path d="m21 21-4.35-4.35" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <input
              type="text"
              className="search-input"
              placeholder="Caută după nume..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button className="clear-button" onClick={() => setSearchQuery('')}>
                ×
              </button>
            )}
          </div>
        </div>
      </div>

      {loading && <p>Se încarcă...</p>}
      {error && <p className="error">{error}</p>}
      {!loading && !error && filteredProfessors.length === 0 && (
        <p>Nu s-au găsit profesori pentru căutarea curentă.</p>
      )}

      {!loading && !error && (
        <div className="professors-list">
          {filteredProfessors.map(professor => (
            <div key={professor.professor_id} className="professor-card">
              <div className="professor-image">
                <img src={professor.image_url} alt={`${professor.first_name} ${professor.last_name}`} />
              </div>
              <div className="professor-info">
                <h3 className="professor-name">
                  {professor.title && professor.title !== '-' && `${professor.title} `}{professor.last_name} {professor.first_name}
                </h3>
                <p className="professor-details">{professor.details}</p>

                <div className="professor-contact">
                  <p><strong>Email:</strong> {professor.email}</p>
                  {professor.web_page && (
                    <p>
                      <strong>Web:</strong>{' '}
                      <a href={professor.web_page} target="_blank" rel="noopener noreferrer">
                        {professor.web_page}
                      </a>
                    </p>
                  )}
                </div>
                {professor.domains && professor.domains.length > 0 && (
                  <div className="professor-domains">
                    <strong>Domenii de cercetare:</strong>{' '}
                    <span 
                      className="domains-text"
                      title={professor.domains.join(', ')}
                    >
                      {professor.domains.join(', ')}
                    </span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
<div className="chatbot-section">
      <ChatBot />
    </div>
    

    </div>
    
  );
};

export default Professors;