// src/components/Club/ClubMissionsView.jsx
import { ChevronDown, Target, Users, Gift } from 'lucide-react';
import ThemedButton from '../UI/ThemedButton';
import MissionProgress from '../UI/MissionProgress';

const ClubMissionsView = ({ clubMissions, loading, setView, onContribute }) => (
  <div className="flex flex-col items-center min-h-screen bg-gray-100 p-4 font-sans">
    <div className="w-full max-w-4xl p-8 bg-white rounded-lg shadow-xl border border-gray-300">
      <h2 className="text-3xl font-bold text-center mb-6 text-blue-600">Misiones del Club</h2>
      
      <div className="mb-6 bg-blue-50 p-4 rounded-lg border border-blue-200">
        <h3 className="text-lg font-semibold text-blue-700 flex items-center">
          <Users className="mr-2" size={20} />
          Misiones Colaborativas
        </h3>
        <p className="text-blue-600 mt-1">
          ¡Trabajen juntos para completar misiones y desbloquear recompensas para todo el club!
        </p>
      </div>
      
      {loading ? (
        <p className="text-center text-gray-500">Cargando misiones...</p>
      ) : (
        <div className="space-y-6">
          {clubMissions.length > 0 ? clubMissions.map(mission => (
            <div key={mission.id} className="bg-gray-50 p-5 rounded-lg shadow-inner border border-gray-300">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="text-xl font-semibold text-blue-600 flex items-center">
                    <Target size={18} className="mr-2" />
                    {mission.name}
                  </h3>
                  <p className="text-gray-700 mt-1">{mission.description}</p>
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
                type={mission.type}
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
                    onClick={() => onContribute(mission.id)}
                    className="bg-green-600 hover:bg-green-500"
                  >
                    Contribuir
                  </ThemedButton>
                )}
              </div>
            </div>
          )) : (
            <p className="text-center text-gray-500">No hay misiones disponibles actualmente.</p>
          )}
        </div>
      )}
      
      <div className="flex justify-center mt-8">
        <ThemedButton 
          onClick={() => setView('club_details')} 
          icon={<ChevronDown size={20} />}
        >
          Volver al Club
        </ThemedButton>
      </div>
    </div>
  </div>
);

export default ClubMissionsView;