import React, { useState, useEffect } from 'react';
import { Search, MapPin,  ArrowLeft } from 'lucide-react';
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
  useEffect(() => {
    const filtered = apiService.searchRooms(allRooms, searchTerm);
    setFilteredRooms(filtered);
  }, [searchTerm, allRooms]);

  const navigateToRoom = (room: Room) => {
    if (!room.google_maps_url) {
      return;
    }

    setIsLoading(true);
    setSelectedRoom(room);
    
    setTimeout(() => {
      window.open(room.google_maps_url, '_blank');
      setIsLoading(false);
    }, 500);
  };

const getGoogleMapsUrlForRoom = (room: Room): string | null => {
  const location = room.location?.toLowerCase() || '';

  if (location.includes('ntt data')) {
    return 'https://www.google.com/maps/place/NTT+DATA/@46.7756433,23.593346,18.7z/data=!4m6!3m5!1s0x47490ea773657215:0xd5a08ae7ed21e379!8m2!3d46.7756967!4d23.5941116!16s%2Fg%2F1tfs9mgs?entry=ttu';
  }

  if (location.includes('campus') || location.includes('str. t. mihali')) {
    return 'https://www.google.com/maps/place/Facultatea+de+%C5%9Etiin%C5%A3e+Economice+%C5%9Fi+Gestiunea+Afacerilor/@46.7731783,23.6188191,17z/data=!3m1!4b1!4m6!3m5!1s0x47490c15a18e8af9:0xcc357d4dedcf12a0!8m2!3d46.7731747!4d23.621394!16s%2Fg%2F1yglpxyfs?entry=ttu';
  }

  if (
    location.includes('clădirea centrală') ||
    location.includes('cladirea centrala') ||
    location.includes('str. m. kogălniceanu') ||
    location.includes('str. m. kogalniceanu')
  ) {
    return 'https://www.google.com/maps/place/UBB+Facultatea+de+Istorie+%C8%99i+Filosofie/@46.7676174,23.5888777,17z/data=!3m1!4b1!4m6!3m5!1s0x47490c28706c8277:0x35848bac5458e3ca!8m2!3d46.7676138!4d23.5914526!16s%2Fg%2F1z0spl9w9?entry=ttu';
  }

  if (location.includes('fizică') || location.includes('fizica')) {
    return 'https://www.google.com/maps/place/UBB+Facultatea+de+Fizic%C4%83/@46.7675632,23.5888434,17z/data=!3m1!4b1!4m6!3m5!1s0x47490c28706c8277:0x2bd129b166f01f51!8m2!3d46.7675596!4d23.5914183!16s%2Fg%2F1hc4yhzkm?entry=ttu';
  }

  if (
    location.includes('str. ploiesti') ||
    location.includes('mathematica') ||
    location.includes('mathematicum')
  ) {
    return 'https://www.google.com/maps/place/Mathematica/@46.7763082,23.5945944,17z/data=!4m6!3m5!1s0x47490e9fec68af87:0x421b462ac259993!8m2!3d46.7765106!4d23.5950743!16s%2Fg%2F11c6ty4sql?entry=ttu';
  }

  if (
    location.includes('str. cireșilor') ||
    location.includes('str. ciresilor') ||
    location.includes('observatorul astronomic')
  ) {
    return 'https://www.google.com/maps/place/Observatorul+Astronomic/@46.7579194,23.5840047,17z/data=!3m1!4b1!4m6!3m5!1s0x47490dd4bdea1097:0x2e061bcaad43ed42!8m2!3d46.7579158!4d23.5865796!16s%2Fg%2F1tf14nmb?entry=ttu';
  }

  if (location.includes('avram iancu')) {
    return 'https://www.google.com/maps/place/Facultatea+de+Drept/@46.7664845,23.5872371,17z/data=!3m1!4b1!4m6!3m5!1s0x47490c28385b365f:0xf914bc2a41306978!8m2!3d46.7664809!4d23.589812!16s%2Fg%2F1v_z33cc?entry=ttu';
  }

  return null;
};



const navigateToLocation = (room: Room) => {
  const url = getGoogleMapsUrlForRoom(room);
  if (url) {
    window.open(url, '_blank');
  }
};

  const handleQuickSearch = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && filteredRooms.length > 0) {
      navigateToRoom(filteredRooms[0]);
    }
  };

  const clearSearch = () => {
    setSearchTerm('');
    setSelectedRoom(null);
  };

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
                    title="Deschide Google Maps pentru a vedea locatia"
                    disabled={!getGoogleMapsUrlForRoom(room)}
                    onClick={() => navigateToLocation(room)}
                  >
                    {isLoading && selectedRoom?.room_id === room.room_id ? (
                      <div className="loading-spinner" />
                    ) : (
                      <MapPin size={16} />
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
                    Nu există imagini pentru această sală
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