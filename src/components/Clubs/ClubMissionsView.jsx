import { ChevronDown, Target, Users, Gift, Plus } from 'lucide-react';
import ThemedButton from '../UI/ThemedButton';
import MissionProgress from '../UI/MissionProgress';
import { useClubMissions } from '../../hooks/useClubMissions';
import CreateMissionModal from './CreateMissionModal';
import { useState } from 'react';

const ClubMissionsView = ({ currentClub, setView, isLeader }) => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const { missions, loading, error, contributeToMission, createMission } = useClubMissions(currentClub?.id);

  const handleContribute = async (missionId) => {
    const success = await contributeToMission(missionId, 1);
    if (success) {
      console.log('Contribución exitosa');
    }
  };

  const handleCreateMission = async (missionData) => {
    const success = await createMission(missionData);
    if (success) {
      setShowCreateModal(false);
    }
  };

  if (loading) {
    return (
      <div className="club-missions-container">
        <div className="club-missions-card">
          <p className="loading-text">Cargando misiones...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="club-missions-container">
      <div className="club-missions-card">
        <h2 className="club-missions-title">Misiones del Club</h2>
        
        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        {isLeader && (
          <div className="create-mission-button-container">
            <ThemedButton 
              onClick={() => setShowCreateModal(true)}
              icon={<Plus size={16} />}
              className="create-mission-button"
            >
              Crear Misión
            </ThemedButton>
          </div>
        )}
        
        <div className="missions-info">
          <h3 className="missions-info-title">
            <Users className="mr-2" size={20} />
            Misiones Colaborativas
          </h3>
          <p className="missions-info-description">
            ¡Trabajen juntos para completar misiones y desbloquear recompensas para todo el club!
          </p>
        </div>
        
        <div className="missions-list">
          {missions && missions.length > 0 ? missions.map(mission => (
            <div key={mission.id} className="mission-card">
              <div className="mission-header">
                <div>
                  <h3 className="mission-name">
                    <Target size={18} className="mr-2" />
                    {mission.name}
                  </h3>
                  <p className="mission-description">{mission.description}</p>
                  <p className="mission-type">
                    Tipo: {mission.mission_type === 'daily' ? 'Diaria' : 
                          mission.mission_type === 'weekly' ? 'Semanal' : 'Mensual'}
                  </p>
                </div>
                {mission.completed && (
                  <span className="mission-completed-badge">
                    Completada
                  </span>
                )}
              </div>
              
              <MissionProgress 
                progress={mission.progress} 
                goal={mission.goal} 
              />
              
              <div className="mission-footer">
                <div className="mission-stats">
                  <p><span className="font-medium">{mission.member_progress}</span> miembros han contribuido</p>
                  <p className="mission-reward">
                    <Gift size={14} className="mr-1" />
                    Recompensa: <span className="font-semibold ml-1">{mission.reward}</span>
                  </p>
                </div>
                
                {!mission.completed && (
                  <ThemedButton 
                    onClick={() => handleContribute(mission.id)}
                    className="contribute-button"
                  >
                    Contribuir (+1)
                  </ThemedButton>
                )}
              </div>
            </div>
          )) : (
            <p className="no-missions">No hay misiones disponibles actualmente.</p>
          )}
        </div>
        
        <div className="back-button-container">
          <ThemedButton 
            onClick={() => setView('club_details')} 
            icon={<ChevronDown size={20} />}
            className="back-button"
          >
            Volver al Club
          </ThemedButton>
        </div>
      </div>

      <CreateMissionModal 
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSubmit={handleCreateMission}
      />
    </div>
  );
};

export default ClubMissionsView;