import { LogIn, LogOut, ChevronDown, Users, ArrowLeft } from 'lucide-react';
import ThemedButton from '../UI/ThemedButton';
import MessageDisplay from '../UI/MessageDisplay';
import '../styles/ClubDetailsView.css';

const ClubDetailsView = ({ currentClub, clubMembers, handleLeaveClub, handleJoinClub, playerData, fetchClubs, loading, message, setView }) => (
  <div className="club-details-container">
    <div className="club-details-card">
      <MessageDisplay message={message} />
      
      {currentClub ? (
        <>
          <div className="club-header">
            <h1 className="club-title">{currentClub.name}</h1>
            <p className="club-description">{currentClub.description}</p>
          </div>

          <div className="members-section">
            <h2 className="members-title">Miembros del Club</h2>
            <div className="members-container">
              {loading ? (
                <p className="loading-text">Cargando miembros...</p>
              ) : clubMembers.length > 0 ? (
                <ul className="members-list">
                  {clubMembers.map(member => (
                    <li key={member.username} className="member-item">
                      <span className="member-name">{member.username}</span>
                      <span className="member-level">Nivel {member.level}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="empty-members">No hay miembros en este club</p>
              )}
            </div>
          </div>

          <div className="club-actions">
            {playerData.club_id === currentClub.id ? (
              <ThemedButton 
                onClick={handleLeaveClub} 
                disabled={loading} 
                icon={<LogOut size={20} />} 
                className="action-button leave-button"
              >
                Abandonar Club
              </ThemedButton>
            ) : (
              <ThemedButton 
                onClick={() => handleJoinClub(currentClub.id)} 
                disabled={loading} 
                icon={<LogIn size={20} />} 
                className="action-button join-button"
              >
                Unirse al Club
              </ThemedButton>
            )}
            
            <ThemedButton 
              onClick={() => { fetchClubs(); setView('clubs'); }} 
              icon={<ArrowLeft size={20} />} 
              className="action-button back-button"
            >
              Volver a Clubes
            </ThemedButton>
          </div>
        </>
      ) : (
        <p className="loading-text">Cargando detalles del club...</p>
      )}
    </div>
  </div>
);

export default ClubDetailsView;