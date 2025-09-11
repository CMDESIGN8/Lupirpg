// src/components/Views/ClubDetailsView.jsx
import { LogIn, LogOut, Users, ArrowLeft, Target, Users as UsersIcon, Star } from 'lucide-react';
import ThemedButton from '../UI/ThemedButton';
import MessageDisplay from '../UI/MessageDisplay';
import '../styles/ClubDetailsView.css';
import { useClubMissions } from '../../hooks/useClubMissions';
import { useState, useEffect } from 'react';

console.log('ClubDetailsView props:', {
  setInternalView: typeof setInternalView,
  onBackToClubs: typeof onBackToClubs
});

const ClubDetailsView = ({ 
  currentClub, 
  clubMembers, 
  handleLeaveClub, 
  handleJoinClub, 
  playerData, 
  fetchClubs, 
  loading, 
  message, 
  setInternalView, // Recibir setInternalView en lugar de setView
  onBackToClubs,
  onViewMissions 
}) => {
  const [activeMissions, setActiveMissions] = useState([]);
  const { missions: allMissions, loading: missionsLoading } = useClubMissions(currentClub?.id);

  useEffect(() => {
    if (allMissions && allMissions.length > 0) {
      const active = allMissions.filter(mission => !mission.completed);
      setActiveMissions(active);
    }
  }, [allMissions]);

  const handleViewMissions = () => {
    console.log('Navigating to club missions');
    if (setInternalView) {
      setInternalView('club_missions');
    } else if (onViewMissions) {
      onViewMissions();
    } else {
      console.error('No navigation method available');
    }
  };

  const handleBackToClubs = () => {
    if (onBackToClubs) {
      onBackToClubs();
    } else if (setInternalView) {
      setInternalView('clubs_list');
    }
  };

  return (
    <div className="club-details-container">
      <div className="club-details-card">
        <div className="navigation-header">
          <ThemedButton 
            onClick={handleBackToClubs}
            icon={<ArrowLeft size={20} />}
            className="back-button"
          >
            Volver a Clubes
          </ThemedButton>
        </div>
        
        <MessageDisplay message={message} />
        
        {currentClub ? (
          <>
            <div className="club-header">
              <h1 className="club-title">
                {currentClub.name}
                {currentClub.average_level && (
                  <span className="level-badge">Nvl {currentClub.average_level}</span>
                )}
              </h1>
              <p className="club-description">{currentClub.description}</p>
            </div>

            {currentClub.average_level && (
              <div className="club-stats">
                <div className="stat-item">
                  <div className="stat-value">{currentClub.average_level}</div>
                  <div className="stat-label">
                    <Target size={16} style={{ display: 'inline', marginRight: '5px' }} />
                    Nivel Promedio
                  </div>
                </div>
                
                <div className="stat-item">
                  <div className="stat-value">{currentClub.member_count || 0}</div>
                  <div className="stat-label">
                    <UsersIcon size={16} style={{ display: 'inline', marginRight: '5px' }} />
                    Miembros
                  </div>
                </div>
                
                <div className="stat-item">
                  <div className="stat-value">
                    {currentClub.total_experience ? Math.floor(currentClub.total_experience / 1000) : 0}K
                  </div>
                  <div className="stat-label">
                    <Star size={16} style={{ display: 'inline', marginRight: '5px' }} />
                    EXP Total
                  </div>
                </div>
              </div>
            )}

            {currentClub.average_level && (
              <div className="level-progress">
                <div className="progress-header">
                  <span>Progreso del Club</span>
                  <span>{currentClub.average_level} / 100</span>
                </div>
                <div className="progress-bar">
                  <div 
                    className="progress-fill" 
                    style={{ width: `${Math.min(currentClub.average_level, 100)}%` }}
                  >
                    <div className="progress-glow"></div>
                  </div>
                </div>
              </div>
            )}

            <div className="members-section">
              <h2 className="members-title">
                <Users size={20} style={{ display: 'inline', marginRight: '10px' }} />
                Miembros del Club ({clubMembers.length})
              </h2>
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

            <div className="missions-preview">
              <h3 className="missions-preview-title">
                <Target className="mr-2" size={24} />
                Misiones Activas
              </h3>
              
              {missionsLoading ? (
                <p className="loading-missions">Cargando misiones...</p>
              ) : activeMissions && activeMissions.length > 0 ? (
                <>
                  {activeMissions.slice(0, 2).map(mission => (
                    <div key={mission.id} className="mission-preview-item">
                      <div className="mission-preview-header">
                        <span className="mission-preview-name">{mission.name}</span>
                        <span>{mission.progress}/{mission.goal}</span>
                      </div>
                      <div className="mission-preview-bar">
                        <div 
                          className="mission-preview-progress" 
                          style={{ width: `${Math.max(5, (mission.progress / mission.goal) * 100)}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                  <ThemedButton 
                    onClick={handleViewMissions}
                    className="view-all-missions-btn"
                  >
                    Ver Todas las Misiones
                  </ThemedButton>
                </>
              ) : (
                <>
                  <p className="no-missions-text">No hay misiones activas actualmente.</p>
                  <ThemedButton 
                    onClick={handleViewMissions}
                    className="view-missions-btn"
                  >
                    Ver Misiones del Club
                  </ThemedButton>
                </>
              )}
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
            </div>
          </>
        ) : (
          <p className="loading-text">Cargando detalles del club...</p>
        )}
      </div>
    </div>
  );
};

export default ClubDetailsView;