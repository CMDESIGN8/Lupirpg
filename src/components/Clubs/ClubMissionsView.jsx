import React, { useState, useEffect } from 'react';
import { supabaseClient } from '../../services/supabase'; 
import { ArrowLeft, Target, Sword, Shield, Zap, Crown } from 'lucide-react';
import { useClubMissions } from '../../hooks/useClubMissions';
import ThemedButton from '../UI/ThemedButton';
import CreateMissionModal from './CreateMissionModal';
import '../styles/ClubMissionsView.css'; // ← CSS con prefijos únicos

// Progress Bar RPG personalizada para no usar el componente principal
const ClubMissionProgress = ({ progress, goal }) => {
  const percentage = Math.min(100, (progress / goal) * 100);
  
  return (
    <div className="club-rpg-progress-container">
      <div className="club-rpg-progress-info">
        <span>Progreso: {progress}/{goal}</span>
        <span>{Math.round(percentage)}%</span>
      </div>
      
      <div className="club-rpg-progress-bar">
        <div 
          className="club-rpg-progress-fill"
          style={{ width: `${percentage}%` }}
        ></div>
      </div>
    </div>
  );
};

const ClubMissionsView = ({ 
  currentClub, 
  setView, 
  isLeader, 
  onBackToClubDetails 
}) => {
  const { missions, loading, error, contributeToMission, createMission } = useClubMissions(currentClub?.id);
  const [currentPlayerId, setCurrentPlayerId] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabaseClient.auth.getUser();
      if (user) {
        setCurrentPlayerId(user.id);
      }
    };
    fetchUser();
  }, []);

  const handleContribute = async (missionId) => {
    if (!currentPlayerId) {
      alert("¡Se requiere identificación de guerrero! Por favor, recarga la página.");
      return;
    }
    const success = await contributeToMission(missionId, currentPlayerId);
    if (success) {
      console.log('¡Contribución exitosa!');
    }
  };

  const handleCreateMission = async (missionData) => {
    if (!currentClub?.id) return false;
    return await createMission(currentClub.id, missionData);
  };

  const getMissionIcon = (missionType) => {
    switch (missionType) {
      case 'combat': return <Sword className="club-rpg-mission-icon" />;
      case 'defense': return <Shield className="club-rpg-mission-icon" />;
      case 'speed': return <Zap className="club-rpg-mission-icon" />;
      case 'royal': return <Crown className="club-rpg-mission-icon" />;
      default: return <Target className="club-rpg-mission-icon" />;
    }
  };

  if (loading) return <p className="club-rpg-loading">🛡️ Cargando misiones épicas...</p>;
  if (error) return <p className="club-rpg-error">⚡ {error}</p>;

  return (
    <div className="club-rpg-container">
      <div className="club-rpg-header">
        <h2 className="club-rpg-title">🛡️ Misiones de {currentClub?.name}</h2>
        
        {isLeader && (
          <ThemedButton 
            onClick={() => setShowCreateModal(true)}
            className="club-rpg-create-btn"
          >
            🎯 Crear Misión Épica
          </ThemedButton>
        )}
      </div>
      
      <div className="club-rpg-content">
        <div className="club-rpg-grid">
          {missions && missions.length > 0 ? (
            missions.map(mission => (
              <div key={mission.id} className="club-rpg-card">
                <div className="club-rpg-card-header">
                  {getMissionIcon(mission.mission_type)}
                  <h3 className="club-rpg-card-title">{mission.name}</h3>
                </div>
                
                <p className="club-rpg-description">"{mission.description}"</p>
                
                <ClubMissionProgress 
                  progress={mission.total_progress || mission.progress || 0} 
                  goal={mission.goal} 
                />
                
                <div className="club-rpg-reward">
                  <span className="club-rpg-reward-text">Recompensa:</span>
                  <span className="club-rpg-reward-value">🏆 {mission.reward}</span>
                </div>
                
                <div className="club-rpg-actions">
                  {mission.is_active ? (
                    <ThemedButton 
                      onClick={() => handleContribute(mission.id)}
                      className="club-rpg-contribute-btn"
                    >
                      ⚔️ Contribuir (+1)
                    </ThemedButton>
                  ) : (
                    <span className="club-rpg-completed">✅ ¡Misión Completada!</span>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="club-rpg-empty">
              🏰 Este clan no tiene misiones activas. ¡Sé el primero en crear una!
            </div>
          )}
        </div>
      </div>

      <ThemedButton 
        onClick={onBackToClubDetails || (() => setView('club_details'))}
        className="club-rpg-back-btn"
      >
        🏠 Volver al Club
      </ThemedButton>

      <CreateMissionModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSubmit={handleCreateMission}
      />
    </div>
  );
};

export default ClubMissionsView;