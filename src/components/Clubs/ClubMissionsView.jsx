// src/components/Clubs/ClubMissionsView.jsx
import React, { useState, useEffect } from 'react';
import { supabaseClient } from '../../services/supabase'; 
import { ArrowLeft, Target } from 'lucide-react';
import { useClubMissions } from '../../hooks/useClubMissions';
import ThemedButton from '../UI/ThemedButton';
import MissionProgress from '../UI/MissionProgress'; 
import CreateMissionModal from './CreateMissionModal';
import '../styles/ClubMissionsView.css'; // ← Importa el CSS

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
      alert("No se pudo identificar al jugador. Por favor, recarga la página.");
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

  if (loading) return <p className="p-4">Cargando misiones...</p>;
  if (error) return <p className="p-4 text-red-500">{error}</p>;

  // ✅ CORRECCIÓN: Cambié "eturn" por "return"
  return (
  <div className="club-missions-container">
    <div className="club-missions-header">
      <h2 className="club-missions-title">Misiones de {currentClub?.name}</h2>
      
      {isLeader && (
        <ThemedButton 
          onClick={() => setShowCreateModal(true)}
          className="create-mission-btn"
        >
          Crear Misión
        </ThemedButton>
      )}
    </div>
    
    <div className="club-missions-content">
      <div className="missions-grid">
        {missions && missions.length > 0 ? (
          missions.map(mission => (
            <div key={mission.id} className="mission-card">
              <div className="mission-header">
                <Target size={24} className="mission-icon" />
                <h3 className="mission-name">{mission.name}</h3>
              </div>
              
              <p className="mission-description">{mission.description}</p>
              
              <div className="mission-progress-container">
                <MissionProgress 
                  progress={mission.total_progress || mission.progress || 0} 
                  goal={mission.goal} 
                />
              </div>
              
              <div className="mission-reward">
                <span className="reward-text">Recompensa:</span>
                <span className="reward-value">{mission.reward}</span>
              </div>
              
              <div className="mission-actions">
                {mission.is_active ? (
                  <ThemedButton 
                    onClick={() => handleContribute(mission.id)}
                    className="contribute-btn"
                  >
                    Contribuir (+1)
                  </ThemedButton>
                ) : (
                  <span className="mission-completed">¡Completada!</span>
                )}
              </div>
            </div>
          ))
        ) : (
          <p className="empty-missions">Este club no tiene misiones activas.</p>
        )}
      </div>
    </div>

    <ThemedButton 
        onClick={onBackToClubDetails || (() => setView('club_details'))}
        icon={<ArrowLeft size={20} />}
        className="club-missions-back-btn"
      >
        Volver al Club
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