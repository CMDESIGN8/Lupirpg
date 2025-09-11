// src/components/Views/ClubDetailsView.jsx
import { LogIn, LogOut, Users, ArrowLeft, Target, Star, Trophy, ShoppingCart, ScrollText, Crown, Award, Clock, Shield, Zap, Sword } from 'lucide-react';
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

  // Datos de ejemplo para el club
  const clubData = {
    name: "LUPI FC",
    tag: "SVK+",
    members: 8,
    status: "Open Source",
    rotation: "Rotation",
    statusOk: true,
    timer: "0 to 1:44",
    idleMembers: [12, 13, 14, 15, 16]
  };

  return (
    <div className="lupi-app-container">
      <div className="lupi-app-header">
        <div className="lupi-app-title">
          <h1>LUPI APP</h1>
          <p className="lupi-app-url">lupiirpg.onrender.com</p>
        </div>
        
        <div className="lupi-app-subtitles">
          <p className="lupi-subtitle">SIG CUTOFF DOC EVER...</p>
          <p className="lupi-subtitle">SALIDAS EVERGREEN</p>
        </div>
      </div>

      <div className="lupi-app-content">
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
        
        <div className="lupi-main-content">
          {/* Sección de información del club */}
          <div className="lupi-club-card">
            <div className="club-header-section">
              <div className="club-badge">
                <Shield size={32} />
              </div>
              <div className="club-info">
                <h2 className="club-name">{clubData.name}</h2>
                <p className="club-tag">{clubData.tag}</p>
              </div>
            </div>
            
            <div className="club-details-grid">
              <div className="club-detail-item">
                <span className="detail-label">Status</span>
                <span className="detail-value">{clubData.status}</span>
              </div>
              
              <div className="club-detail-item">
                <span className="detail-label">Rotation</span>
                <span className="detail-value">{clubData.rotation}</span>
              </div>
              
              <div className="club-detail-item">
                <span className="detail-label">Status</span>
                <span className={`detail-value status ${clubData.statusOk ? 'ok' : 'not-ok'}`}>
                  {clubData.statusOk ? 'OK' : 'NOT OK'}
                </span>
              </div>
              
              <div className="club-detail-item">
                <span className="detail-label">Timer</span>
                <span className="detail-value timer">
                  <Clock size={14} />
                  {clubData.timer}
                </span>
              </div>
            </div>
            
            <div className="save-token-section">
              <Zap size={16} />
              <span>Save a Token</span>
            </div>
          </div>
          
          {/* Sección de miembros */}
          <div className="lupi-members-card">
            <div className="card-header">
              <h3>Altrahms dd Club ({clubData.members})</h3>
            </div>
            
            <div className="idle-members-section">
              <div className="idle-header">
                <span>Idle</span>
              </div>
              
              <div className="idle-members-grid">
                {clubData.idleMembers.map((id, index) => (
                  <div key={index} className="idle-member-item">
                    <div className="member-avatar"></div>
                    <span className="member-id">{id}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          {/* Sección de firma */}
          <div className="lupi-signature-card">
            <div className="signature-content">
              <ScrollText size={20} />
              <span>SIGNATURE</span>
            </div>
          </div>
        </div>

        {/* Botones de acción */}
        <div className="lupi-actions">
          {playerData.club_id === currentClub?.id ? (
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
              onClick={() => currentClub && handleJoinClub(currentClub.id)} 
              disabled={loading} 
              icon={<LogIn size={20} />} 
              className="action-button join-button"
            >
              Unirse al Club
            </ThemedButton>
          )}
        </div>
      </div>
    </div>
  );
};

export default ClubDetailsView;