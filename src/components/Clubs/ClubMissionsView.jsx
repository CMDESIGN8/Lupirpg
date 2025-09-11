// src/components/Clubs/ClubMissionsView.jsx
import React, { useState, useEffect } from 'react';
import { supabaseClient } from '../../services/supabase'; 
import { ArrowLeft, Target } from 'lucide-react';
import { useClubMissions } from '../../hooks/useClubMissions';
import ThemedButton from '../UI/ThemedButton';
import MissionProgress from '../UI/MissionProgress'; 
import CreateMissionModal from './CreateMissionModal';

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
    <div className="p-4">
      <ThemedButton 
        onClick={onBackToClubDetails || (() => setView('club_details'))}
        icon={<ArrowLeft size={20} />}
      >
        Volver al Club
      </ThemedButton>

      <div className="flex justify-between items-center my-4">
        <h2 className="text-3xl font-bold">Misiones de {currentClub?.name}</h2>
        {isLeader && (
          <ThemedButton onClick={() => setShowCreateModal(true)}>
            Crear Misión
          </ThemedButton>
        )}
      </div>
      
      <div className="space-y-6">
        {missions && missions.length > 0 ? (
          missions.map(mission => (
            <div key={mission.id} className="bg-gray-800 p-5 rounded-lg shadow-lg border border-gray-700">
              <h3 className="text-xl font-semibold text-cyan-400 flex items-center">
                <Target size={18} className="mr-2" /> {mission.name}
              </h3>
              <p className="text-gray-400 mt-1">{mission.description}</p>
              
              <MissionProgress 
                progress={mission.total_progress || mission.progress || 0} 
                goal={mission.goal} 
              />
              
              <div className="flex justify-between items-center mt-4">
                <p className="text-sm text-gray-300">Recompensa: {mission.reward}</p>
                
                {mission.is_active ? (
                  <ThemedButton onClick={() => handleContribute(mission.id)}>
                    Contribuir (+1)
                  </ThemedButton>
                ) : (
                  <span className="text-green-400 font-bold">¡Completada!</span>
                )}
              </div>
            </div>
          ))
        ) : (
          <p className="text-gray-400">Este club no tiene misiones activas.</p>
        )}
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