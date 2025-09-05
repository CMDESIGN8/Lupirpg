import { UserPlus, Users, LogIn, ChevronDown, Shield, ArrowLeft } from 'lucide-react';
import ThemedButton from '../UI/ThemedButton';
import MessageDisplay from '../UI/MessageDisplay';
import '../styles/ClubsView.css';

const ClubsView = ({ clubs, handleViewClubDetails, handleJoinClub, playerData, loading, message, setView }) => (
  <div className="clubs-container">
    <div className="clubs-content">
      <div className="clubs-header">
        <h1 className="clubs-title">Clubes Deportivos</h1>
      </div>
      
      <MessageDisplay message={message} />
      
      {!playerData.club_id && (
        <div className="create-club-header">
          <ThemedButton 
            onClick={() => setView('create_club')} 
            icon={<UserPlus size={16} />} 
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
          <span style={{ 
            fontSize: '0.8rem', 
            color: '#00ffcc', 
            marginLeft: '10px',
            background: 'rgba(0, 255, 204, 0.1)',
            padding: '2px 8px',
            borderRadius: '10px',
            border: '1px solid #00ffcc'
          }}>
            Nvl {club.average_level}
          </span>
        )}
      </h3>
      <p className="club-desc">{club.description || "Sin descripción"}</p>
      {club.member_count && (
        <p style={{ color: '#88ddff', fontSize: '0.9rem', marginTop: '5px' }}>
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

      <div className="flex justify-center mt-6">
        <ThemedButton 
          onClick={() => setView('dashboard')} 
          icon={<ArrowLeft size={20} />} 
          className="back-button"
        >
          Volver al Dashboard
        </ThemedButton>
      </div>
    </div>
  </div>
);

export default ClubsView;