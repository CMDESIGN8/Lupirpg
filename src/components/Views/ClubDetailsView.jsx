// src/components/Views/ClubDetailsView.jsx
import { LogIn, LogOut, Users, ArrowLeft, Target, Users as UsersIcon, Star, AlertCircle } from 'lucide-react';
import ThemedButton from '../UI/ThemedButton';
import MessageDisplay from '../UI/MessageDisplay';
import '../styles/ClubDetailsView.css';
import { useClubMissions } from '../../hooks/useClubMissions';
import { useState, useEffect } from 'react';

const ClubDetailsView = ({ 
  currentClub, 
  clubMembers, 
  handleLeaveClub, 
  handleJoinClub, 
  playerData, 
  fetchClubs, 
  loading, 
  message, 
  setView 
}) => {
  const [activeMissions, setActiveMissions] = useState([]);
  const { missions: allMissions, loading: missionsLoading, error: missionsError } = useClubMissions(currentClub?.id);

  useEffect(() => {
    if (allMissions && allMissions.length > 0) {
      const active = allMissions.filter(mission => !mission.completed);
      setActiveMissions(active);
    }
  }, [allMissions]);

  const handleViewMissions = () => {
    console.log('Navigating to club missions');
    if (setView) {
      setView('club_missions');
    } else {
      console.error('setView function is not available');
    }
  };

  const handleBackToClubs = () => {
    if (setView) {
      setView('clubs_list');
    } else {
      console.error('setView function is not available');
    }
  };

  return (
    <div className="club-details-container">
      <div className="club-details-card">
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

            <div className="missions-preview">
              <h3 className="missions-preview-title">
                <Target className="mr-2" size={24} />
                Misiones Activas
              </h3>
              
              {missionsError && (
                <div className="missions-error">
                  <AlertCircle size={16} className="mr-2" />
                  Error al cargar misiones: {missionsError}
                </div>
              )}
              
              {missionsLoading ? (
                <div className="missions-loading">
                  <div className="loading-spinner"></div>
                  <p>Cargando misiones...</p>
                </div>
              ) : activeMissions && activeMissions.length > 0 ? (
                <>
                  {activeMissions.slice(0, 2).map(mission => (
                    <div key={mission.id} className="mission-preview-item">
                      <div className="mission-preview-header">
                        <span className="mission-preview-name">{mission.name}</span>
                        <span className="mission-preview-progress-text">{mission.progress}/{mission.goal}</span>
                      </div>
                      <div className="mission-preview-bar">
                        <div 
                          className="mission-preview-progress" 
                          style={{ width: `${Math.max(5, (mission.progress / mission.goal) * 100)}%` }}
                        ></div>
                      </div>
                      <div className="mission-preview-reward">
                        <span className="reward-text">Recompensa: {mission.reward}</span>
                      </div>
                    </div>
                  ))}
                  <ThemedButton 
                    onClick={handleViewMissions}
                    className="view-all-missions-btn"
                  >
                    <Target size={16} className="mr-2" />
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
                    <Target size={16} className="mr-2" />
                    Ver Misiones del Club
                  </ThemedButton>
                </>
              )}
            </div>

            {/* ... resto del componente ... */}
          </>
        ) : (
          <p className="loading-text">Cargando detalles del club...</p>
        )}
      </div>
    </div>
  );
};

export default ClubDetailsView;