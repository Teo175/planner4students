import React, { useState, useEffect } from 'react';
import { Search, MapPin, ExternalLink, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import apiService from '../../api/server/apiService';
import { Room } from '../../common';
import './roomMaps.scss';

const RoomMaps: React.FC = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [allRooms, setAllRooms] = useState<Room[]>([]);
  const [filteredRooms, setFilteredRooms] = useState<Room[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingRooms, setIsLoadingRooms] = useState(true);

  // Încarcă sălile de pe server
  useEffect(() => {
    const fetchRooms = async () => {
      try {
        setIsLoadingRooms(true);
        const rooms = await apiService.getRooms();
        setAllRooms(rooms);
        setFilteredRooms(rooms);
      } catch (error) {
        console.error('Eroare la încărcarea sălilor:', error);
      } finally {
        setIsLoadingRooms(false);
      }
    };

    fetchRooms();
  }, []);

  // Filtrarea sălilor pe baza termenului de căutare
  useEffect(() => {
    const filtered = apiService.searchRooms(allRooms, searchTerm);
    setFilteredRooms(filtered);
  }, [searchTerm, allRooms]);

  // Funcția pentru deschiderea Google Maps
  const navigateToRoom = (room: Room) => {
    if (!room.google_maps_url) {
      return;
    }

    setIsLoading(true);
    setSelectedRoom(room);
    
    // Simulăm un delay pentru UX mai bun
    setTimeout(() => {
      window.open(room.google_maps_url, '_blank');
      setIsLoading(false);
    }, 500);
  };

  // Funcția pentru căutarea rapidă (Enter key)
  const handleQuickSearch = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && filteredRooms.length > 0) {
      navigateToRoom(filteredRooms[0]);
    }
  };

  // Funcția pentru resetarea căutării
  const clearSearch = () => {
    setSearchTerm('');
    setSelectedRoom(null);
  };

  // Funcția pentru navigarea înapoi la orar
  const handleBackToSchedule = () => {
    navigate('/schedule');
  };

  if (isLoadingRooms) {
    return (
      <div className="room-maps-container">
        <div className="room-maps-header">
          <div className="header-controls">
            <button 
              className="back-button" 
              onClick={handleBackToSchedule}
              title="Înapoi la orar"
            >
              <ArrowLeft size={20} />
              <span>Înapoi</span>
            </button>
          </div>
          
          <div className="header-content">
            <h2 className="room-maps-title">
              <MapPin className="title-icon" />
              Navigare Săli - Google Maps 360°
            </h2>
            <p className="room-maps-subtitle">
              Se încarcă sălile...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="room-maps-container">
      <div className="room-maps-header">
        <div className="header-controls">
          <button 
            className="back-button" 
            onClick={handleBackToSchedule}
            title="Înapoi la orar"
          >
            <ArrowLeft size={20} />
            <span>Înapoi</span>
          </button>
        </div>
        
        <div className="header-content">
          <h2 className="room-maps-title">
            <MapPin className="title-icon" />
            Navigare Săli - Google Maps 360°
          </h2>
          <p className="room-maps-subtitle">
            Caută și navighează către săli folosind vizualizarea 360° din Google Maps
          </p>
        </div>
      </div>

      <div className="search-section">
        <div className="search-input-container">
          <Search className="search-icon" />
          <input
            type="text"
            className="search-input"
            placeholder="Caută după numele sălii (ex: L321, A101, S205...)"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={handleQuickSearch}
          />
          {searchTerm && (
            <button className="clear-button" onClick={clearSearch}>
              ×
            </button>
          )}
        </div>
        
        {searchTerm && (
          <div className="search-results-info">
            {filteredRooms.length} rezultat{filteredRooms.length !== 1 ? 'e' : ''} găsit{filteredRooms.length !== 1 ? 'e' : ''}
            {filteredRooms.length > 0 && (
              <span className="quick-tip">
                Apasă Enter pentru navigare rapidă către primul rezultat
              </span>
            )}
          </div>
        )}
      </div>

      <div className="rooms-grid">
        {filteredRooms.length > 0 ? (
          filteredRooms.map((room) => (
            <div 
              key={room.room_id} 
              className={`room-card ${selectedRoom?.room_id === room.room_id ? 'selected' : ''}`}
            >
              <div className="room-card-header">
                <h3 className="room-id">{room.name || room.room_id}</h3>
                <div className="room-actions">
                  <button
                    className="navigate-button"
                    onClick={() => navigateToRoom(room)}
                    disabled={(isLoading && selectedRoom?.room_id === room.room_id) || !room.google_maps_url}
                  >
                    {isLoading && selectedRoom?.room_id === room.room_id ? (
                      <div className="loading-spinner" />
                    ) : (
                      <ExternalLink size={14} />
                    )}
                  </button>
                </div>
              </div>
              
              <div className="room-info">
                <div className="room-details">
                  <span className="room-location" title={room.location}>{room.location}</span>
                </div>
                {!room.google_maps_url && (
                  <p className="room-description text-warning">
                    Nu există URL Google Maps pentru această sală
                  </p>
                )}
              </div>

              <div className="room-card-footer">
                <button
                  className="view-in-maps-button"
                  onClick={() => navigateToRoom(room)}
                  disabled={(isLoading && selectedRoom?.room_id === room.room_id) || !room.google_maps_url}
                >
                  {isLoading && selectedRoom?.room_id === room.room_id ? (
                    'Se deschide Maps...'
                  ) : (
                    <>
                      <MapPin size={16} />
                      {room.google_maps_url ? 'Vezi în Google Maps 360°' : 'URL indisponibil'}
                    </>
                  )}
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="no-results">
            <Search size={48} className="no-results-icon" />
            <h3>Nicio sală găsită</h3>
            <p>
              {allRooms.length === 0 
                ? 'Nu s-au putut încărca sălile de pe server' 
                : 'Încearcă să cauți după codul sălii (ex: L321) sau numele complet'
              }
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default RoomMaps;