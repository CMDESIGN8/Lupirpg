// src/components/Views/ClubDetailsView.jsx
import { 
  LogIn, LogOut, Users, ArrowLeft, Target, Users as UsersIcon, Star, Trophy 
} from 'lucide-react';
import ThemedButton from '../UI/ThemedButton';
import MessageDisplay from '../UI/MessageDisplay';
import '../styles/ClubDetailsView.css';
import { useClubMissions } from '../../hooks/useClubMissions';
import { useState, useEffect } from 'react';

// Sub-vistas
import ClubRankingsView from '../Clubs/ClubRankingsView';
import ClubMissionsView from '../Clubs/ClubMissionsView';
import ClubMatchesView from '../Clubs/ClubMatchesView';

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
  onBackToClubs
}) => {
  const [activeTab, setActiveTab] = useState('info');
  const [activeMissions, setActiveMissions] = useState([]);
  const { missions: allMissions, loading: missionsLoading } = useClubMissions(currentClub?.id);

  useEffect(() => {
    if (allMissions && allMissions.length > 0) {
      const active = allMissions.filter(mission => !mission.completed);
      setActiveMissions(active);
    }
  }, [allMissions]);

  const handleBackToClubs = () => {
    if (onBackToClubs) onBackToClubs();
    else if (setView) setView('clubs');
  };

  return (
    <div className="club-details-container">
      <div className="club-details-card">
        
        {/* 🔙 Botón volver */}
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
            {/* 🏷️ Encabezado con stats */}
            <div className="club-header">
              <h1 className="club-title">
                {currentClub.name}
                {currentClub.average_level && (
                  <span className="level-badge">Nvl {currentClub.average_level}</span>
                )}
              </h1>
              <p className="club-description">{currentClub.description}</p>
            </div>

            <div className="club-stats">
              <div className="stat-item">
                <div className="stat-value">{currentClub.average_level}</div>
                <div className="stat-label">
                  <Target size={16} style={{ marginRight: '5px' }} /> Nivel Promedio
                </div>
              </div>
              <div className="stat-item">
                <div className="stat-value">{currentClub.member_count || 0}</div>
                <div className="stat-label">
                  <UsersIcon size={16} style={{ marginRight: '5px' }} /> Miembros
                </div>
              </div>
              <div className="stat-item">
                <div className="stat-value">
                  {currentClub.total_experience ? Math.floor(currentClub.total_experience / 1000) : 0}K
                </div>
                <div className="stat-label">
                  <Star size={16} style={{ marginRight: '5px' }} /> EXP Total
                </div>
              </div>
            </div>

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

            {/* 📌 Layout: menú lateral + contenido */}
            <div className="club-layout">
              <aside className="club-sidebar">
                <button onClick={() => setActiveTab('info')} className={activeTab === 'info' ? 'active' : ''}>Info</button>
                <button onClick={() => setActiveTab('members')} className={activeTab === 'members' ? 'active' : ''}>Miembros</button>
                <button onClick={() => setActiveTab('ranking')} className={activeTab === 'ranking' ? 'active' : ''}>Ranking</button>
                <button onClick={() => setActiveTab('missions')} className={activeTab === 'missions' ? 'active' : ''}>Misiones</button>
                <button onClick={() => setActiveTab('matches')} className={activeTab === 'matches' ? 'active' : ''}>Próximo Partido</button>
              </aside>

              <section className="club-content">
                {activeTab === 'info' && (
                  <div>
                    <h2>Información del Club</h2>
                    <p>{currentClub.description || "Este club aún no tiene descripción."}</p>
                  </div>
                )}

                {activeTab === 'members' && (
                  <div>
                    <h2>Miembros ({clubMembers.length})</h2>
                    {loading ? (
                      <p>Cargando miembros...</p>
                    ) : clubMembers.length > 0 ? (
                      <ul>
                        {clubMembers.map(member => (
                          <li key={member.username}>
                            {member.username} - Nivel {member.level}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p>No hay miembros en este club</p>
                    )}
                  </div>
                )}

                {activeTab === 'ranking' && <ClubRankingsView currentClub={currentClub} />}
                {activeTab === 'missions' && <ClubMissionsView currentClub={currentClub} />}
                {activeTab === 'matches' && <ClubMatchesView currentClub={currentClub} />}
              </section>
            </div>

            {/* ⚡ Acciones */}
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
