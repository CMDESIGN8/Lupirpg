// src/components/Views/ClubsView.jsx
import { UserPlus, Users, LogIn, ArrowLeft, Plus } from 'lucide-react';
import ThemedButton from '../UI/ThemedButton';
import MessageDisplay from '../UI/MessageDisplay';
import '../styles/ClubsView.css';

const ClubsView = ({ 
  clubs, 
  handleViewClubDetails, 
  handleJoinClub, 
  playerData, 
  loading, 
  message, 
  setView,
  onBackToDashboard 
}) => {
  return (
    <div className="clubs-container">
      <div className="clubs-content">
        <div className="clubs-header">
          <div className="flex justify-between items-center mb-4">
            <ThemedButton 
              onClick={onBackToDashboard}
              icon={<ArrowLeft size={20} />}
              className="back-to-dashboard-btn"
            >
              Volver al Dashboard
            </ThemedButton>
            <h1 className="clubs-title">Clubes Deportivos</h1>
            <div style={{ width: '140px' }}></div> {/* Espaciador para equilibrar */}
          </div>
        </div>
        
        <MessageDisplay message={message} />
        
        {!playerData.club_id && (
          <div className="create-club-header">
            <ThemedButton 
              onClick={() => setView('create_club')} 
              icon={<Plus size={16} />} 
              className="create-club-button"
            >
              Crear Nuevo Club
            </ThemedButton>
          </div>
        )}

        <div className="clubs-grid">
          {loading ? (
            <p className="loading-clubs">Cargando clubes...</p>
          ) : clubs.length > 0 ? (
            clubs.map(club => (
              <div key={club.id} className="club-card">
                {playerData.club_id === club.id && (
                  <span className="current-club-badge">Tu Club</span>
                )}
                
                <div className="club-info">
                  <h3 className="club-name">
                    {club.name}
                    {club.average_level && (
                      <span className="level-badge">Nvl {club.average_level}</span>
                    )}
                  </h3>
                  <p className="club-desc">{club.description || "Sin descripción"}</p>
                  {club.member_count && (
                    <p className="member-count">
                      {club.member_count} miembro{club.member_count !== 1 ? 's' : ''}
                    </p>
                  )}
                </div>
                
                <div className="club-actions">
                  <ThemedButton 
                    onClick={() => handleViewClubDetails(club)} 
                    icon={<Users size={16} />}
                    className="view-button"
                  >
                    Ver Detalles
                  </ThemedButton>
                  
                  {!playerData.club_id && (
                    <ThemedButton 
                      onClick={() => handleJoinClub(club.id)} 
                      disabled={loading} 
                      icon={<LogIn size={16} />} 
                      className="join-button"
                    >
                      Unirse
                    </ThemedButton>
                  )}
                </div>
              </div>
            ))
          ) : (
            <p className="no-clubs">No hay clubes disponibles. ¡Sé el primero en crear uno!</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default ClubsView;