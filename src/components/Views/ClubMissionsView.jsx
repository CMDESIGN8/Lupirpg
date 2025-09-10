// src/components/Views/ClubMissionsView.jsx
import React, { useState, useEffect } from 'react';
// --- AJUSTADO A TU IMPORTACIÓN ---
// (Asegúrate que la ruta relativa sea la correcta desde este archivo)
import { supabaseClient } from '../../services/supabase'; 
import { ArrowLeft, Target } from 'lucide-react';
import { useClubMissions } from '../../hooks/useClubMissions';
import ThemedButton from '../UI/ThemedButton';
import MissionProgress from '../UI/MissionProgress'; 

const ClubMissionsView = ({ currentClub, setInternalView }) => {
  const { missions, loading, error, contributeToMission } = useClubMissions(currentClub?.id);
  const [currentPlayerId, setCurrentPlayerId] = useState(null);

  useEffect(() => {
    const fetchUser = async () => {
      // Se usa supabaseClient en lugar de supabase
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

  if (loading) return <p>Cargando misiones...</p>;
  if (error) return <p style={{ color: 'red' }}>{error}</p>;

  return (
    <div className="p-4">
      <ThemedButton onClick={() => setInternalView('club_details')} icon={<ArrowLeft size={20} />}>
        Volver al Club
      </ThemedButton>
      <h2 className="text-3xl font-bold my-4">Misiones de {currentClub?.name}</h2>
      
      <div className="space-y-6">
        {missions.length > 0 ? (
          missions.map(mission => (
            <div key={mission.id} className="bg-gray-800 p-5 rounded-lg shadow-lg border border-gray-700">
              <h3 className="text-xl font-semibold text-cyan-400 flex items-center">
                <Target size={18} className="mr-2" /> {mission.name}
              </h3>
              <p className="text-gray-400 mt-1">{mission.description}</p>
              
              <MissionProgress progress={mission.total_progress} goal={mission.goal} />
              
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
          <p>Este club no tiene misiones activas.</p>
        )}
      </div>
    </div>
  );
};

export default ClubMissionsView;