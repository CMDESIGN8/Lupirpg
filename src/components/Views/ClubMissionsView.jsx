// src/components/Views/ClubMissionsView.jsx
import { Target, Users, Gift, Plus, ArrowLeft, AlertCircle } from 'lucide-react';
import ThemedButton from '../UI/ThemedButton';
import MissionProgress from '../UI/MissionProgress';
import { useClubMissions } from '../../hooks/useClubMissions';
import CreateMissionModal from '../Clubs/CreateMissionModal';
import { useState } from 'react';

const ClubMissionsView = ({ currentClub, setView, isLeader, onBackToClubDetails }) => {
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

  const handleBackToClub = () => {
    if (onBackToClubDetails) {
      onBackToClubDetails(); // Usa la función específica para volver
    } else if (setView) {
      setView('club_details');
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center min-h-screen bg-gray-100 p-4 font-sans">
        <div className="w-full max-w-4xl p-8 bg-white rounded-lg shadow-xl border border-gray-300">
          <p className="text-center text-gray-500">Cargando misiones...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center min-h-screen bg-gray-100 p-4 font-sans">
      <div className="w-full max-w-4xl p-8 bg-white rounded-lg shadow-xl border border-gray-300">
        <div className="flex justify-between items-center mb-6">
          <ThemedButton 
            onClick={handleBackToClub}
            icon={<ArrowLeft size={20} />}
            className="bg-gray-600 hover:bg-gray-500"
          >
            Volver al Club
          </ThemedButton>
          <h2 className="text-3xl font-bold text-center text-blue-600">Misiones del Club</h2>
          <div style={{ width: '140px' }}></div>
        </div>
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {isLeader && (
          <div className="flex justify-end mb-6">
            <ThemedButton 
              onClick={() => setShowCreateModal(true)}
              icon={<Plus size={16} />}
              className="bg-green-600 hover:bg-green-500"
            >
              Crear Misión
            </ThemedButton>
          </div>
        )}
        
        <div className="mb-6 bg-blue-50 p-4 rounded-lg border border-blue-200">
          <h3 className="text-lg font-semibold text-blue-700 flex items-center">
            <Users className="mr-2" size={20} />
            Misiones Colaborativas
          </h3>
          <p className="text-blue-600 mt-1">
            ¡Trabajen juntos para completar misiones y desbloquear recompensas para todo el club!
          </p>
        </div>
        
        <div className="space-y-6">
          {missions && missions.length > 0 ? missions.map(mission => (
            <div key={mission.id} className="bg-gray-50 p-5 rounded-lg shadow-inner border border-gray-300">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="text-xl font-semibold text-blue-600 flex items-center">
                    <Target size={18} className="mr-2" />
                    {mission.name}
                  </h3>
                  <p className="text-gray-700 mt-1">{mission.description}</p>
                  <p className="text-sm text-gray-500 mt-1">
                    Tipo: {mission.mission_type === 'daily' ? 'Diaria' : 
                          mission.mission_type === 'weekly' ? 'Semanal' : 'Mensual'}
                  </p>
                </div>
                {mission.completed && (
                  <span className="bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                    Completada
                  </span>
                )}
              </div>
              
              <MissionProgress 
                progress={mission.progress} 
                goal={mission.goal} 
              />
              
              <div className="flex justify-between items-center mt-4">
                <div className="text-sm text-gray-600">
                  <p><span className="font-medium">{mission.member_progress}</span> miembros han contribuido</p>
                  <p className="mt-1 flex items-center">
                    <Gift size={14} className="mr-1" />
                    Recompensa: <span className="font-semibold ml-1">{mission.reward}</span>
                  </p>
                </div>
                
                {!mission.completed && (
                  <ThemedButton 
                    onClick={() => handleContribute(mission.id)}
                    className="bg-green-600 hover:bg-green-500"
                  >
                    Contribuir (+1)
                  </ThemedButton>
                )}
              </div>
            </div>
          )) : (
            <p className="text-center text-gray-500">No hay misiones disponibles actualmente.</p>
          )}
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