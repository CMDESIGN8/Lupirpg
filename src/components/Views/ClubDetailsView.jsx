import { LogIn, LogOut, ChevronDown, Users, ArrowLeft, Trophy, Users as UsersIcon, Star, Target } from 'lucide-react';
import ThemedButton from '../UI/ThemedButton';
import MessageDisplay from '../UI/MessageDisplay';
import '../styles/ClubDetailsView.css';
import { useClubMissions } from '../../hooks/useClubMissions';
import { useState, useEffect } from 'react';

const ClubDetailsView = ({ currentClub, clubMembers, handleLeaveClub, handleJoinClub, playerData, fetchClubs, loading, message, setView }) => {
  const [activeMissions, setActiveMissions] = useState([]);
  const { missions: allMissions, loading: missionsLoading } = useClubMissions(currentClub?.id);

  useEffect(() => {
    if (allMissions && allMissions.length > 0) {
      // Filtrar misiones activas (no completadas)
      const active = allMissions.filter(mission => !mission.completed);
      setActiveMissions(active);
    }
  }, [allMissions]);

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

            {/* Estadísticas del Club */}
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

            {/* Vista previa de misiones - CORREGIDO */}
            <div className="missions-preview">
              <h3 className="text-lg font-semibold text-blue-700 mb-3 flex items-center">
                <Target className="mr-2" size={18} />
                Misiones Activas
              </h3>
              
              {missionsLoading ? (
                <p className="text-sm text-blue-600">Cargando misiones...</p>
              ) : activeMissions && activeMissions.length > 0 ? (
                <>
                  {activeMissions.slice(0, 2).map(mission => (
                    <div key={mission.id} className="mission-item">
                      <div className="mission-header">
                        <span className="mission-name">{mission.name}</span>
                        <span>{mission.progress}/{mission.goal}</span>
                      </div>
                      <div className="mission-progress">
                        <div 
                          className="mission-progress-fill" 
                          style={{ width: `${(mission.progress / mission.goal) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                  <ThemedButton 
                    onClick={() => setView('club_missions')}
                    className="mt-3 w-full bg-blue-600 hover:bg-blue-500 text-sm"
                  >
                    Ver Todas las Misiones
                  </ThemedButton>
                </>
              ) : (
                <>
                  <p className="no-missions">No hay misiones activas actualmente.</p>
                  <ThemedButton 
                    onClick={() => setView('club_missions')}
                    className="mt-3 w-full bg-blue-600 hover:bg-blue-500 text-sm"
                  >
                    Ver Misiones
                  </ThemedButton>
                </>
              )}
            </div>

            {/* Barra de progreso de nivel (opcional) */}
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
};

export default ClubDetailsView;