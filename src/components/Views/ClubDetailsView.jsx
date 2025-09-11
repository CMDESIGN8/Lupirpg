// src/components/Views/ClubDetailsView.jsx
import { LogIn, LogOut, Users, ArrowLeft, Target, Star, Trophy, ShoppingCart, ScrollText, Crown, Award } from 'lucide-react';
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
  setView,
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
    if (setView) {
      setView('club_missions');
    } else {
      console.error('setView function is not available');
    }
  };

  const handleBackToClubs = () => {
    if (onBackToClubs) {
      onBackToClubs();
    } else if (setView) {
      setView('clubs');
    }
  };

  // Datos de ejemplo para las secciones (deberías reemplazarlos con datos reales)
  const clanStats = {
    basic: 28,
    expert: 30,
    elite: 30,
    questsAvailable: 2,
    questTitle: "Get 10 Rare Champions",
    questProgress: "0/10",
    questReward: 100
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

            {/* Sección Info (como en la imagen) */}
            <div className="clan-info-section">
              <h2 className="clan-section-title">Clan</h2>
              
              <div className="info-grid">
                <div className="info-item">
                  <Users size={18} />
                  <span>Members</span>
                </div>
                <div className="info-item">
                  <Trophy size={18} />
                  <span>Rankings</span>
                </div>
                <div className="info-item">
                  <ScrollText size={18} />
                  <span>Clan Quests</span>
                </div>
                <div className="info-item">
                  <ShoppingCart size={18} />
                  <span>Clan Shop</span>
                </div>
                <div className="info-item">
                  <Crown size={18} />
                  <span>Clan League</span>
                </div>
              </div>
              
              <div className="separator"></div>
              
              {/* Stats Section */}
              <div className="clan-stats-grid">
                <div className="clan-stat">
                  <span className="stat-value">{clanStats.basic}</span>
                  <span className="stat-label">Basic</span>
                </div>
                <div className="clan-stat expert">
                  <span className="stat-value">{clanStats.expert}</span>
                  <span className="stat-label">Expert</span>
                </div>
                <div className="clan-stat elite">
                  <span className="stat-value">{clanStats.elite}</span>
                  <span className="stat-label">Elite</span>
                </div>
              </div>
              
              <div className="separator"></div>
              
              {/* Timer Section */}
              <div className="timer-section">
                <div className="timer">
                  <span className="timer-value">60</span>
                  <span className="timer-unit">22h</span>
                </div>
              </div>
              
              <div className="separator"></div>
              
              {/* Quest Section */}
              <div className="quest-section">
                <div className="quest-item">
                  <div className="quest-header">
                    <span className="quest-reward">50</span>
                    <span className="quest-player">Player 123809</span>
                  </div>
                  <p className="quest-description">Win a total of ten Rank 5 or Rank 6 Accessories from the Spider's Den</p>
                  <div className="quest-progress">
                    <span>110/10</span>
                  </div>
                </div>
                
                <div className="quest-item">
                  <div className="quest-header">
                    <span className="quest-reward">50</span>
                    <span className="quest-player">Player 123809</span>
                  </div>
                  <p className="quest-description">Upgrade a Rank 3 or higher Amulet Accessory to Level 16</p>
                  <div className="quest-progress">
                    <span>0/1</span>
                  </div>
                </div>
                
                <div className="quest-item">
                  <div className="quest-header">
                    <span className="quest-reward">50</span>
                    <span className="quest-player">Player 123809</span>
                  </div>
                  <p className="quest-description">Fill the Turn Meters of all allies 20 times in Classic Arena Offense Battles (wins only)</p>
                  <div className="quest-progress">
                    <span>0/20</span>
                  </div>
                </div>
              </div>
              
              <div className="separator"></div>
              
              {/* Available Quest */}
              <div className="available-quest">
                <div className="available-quest-header">
                  <span className="quests-available">{clanStats.questsAvailable} Quest Available</span>
                </div>
                <p className="quest-description">{clanStats.questTitle}</p>
                <div className="quest-progress">
                  <span>{clanStats.questProgress}</span>
                </div>
                
                <ThemedButton className="take-quest-btn">
                  <Award size={16} />
                  Take Quest ({clanStats.questReward})
                </ThemedButton>
              </div>
            </div>

            {/* Sección de miembros (mantenida de tu código original) */}
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

            {/* Botones de acción (mantenidos de tu código original) */}
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