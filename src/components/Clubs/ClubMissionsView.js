import { ChevronDown } from 'lucide-react';
import ThemedButton from '../UI/ThemedButton';

const ClubMissionsView = ({ clubMissions, loading, setView }) => (
  <div className="flex flex-col items-center min-h-screen bg-gray-100 p-4 font-sans">
    <div className="w-full max-w-4xl p-8 bg-white rounded-lg shadow-xl border border-gray-300">
      <h2 className="text-3xl font-bold text-center mb-6 text-blue-600">Misiones del Club</h2>
      
      {loading ? <p className="text-center text-gray-500">Cargando misiones...</p> : (
        <div className="space-y-4">
          {clubMissions.length > 0 ? clubMissions.map(mission => (
            <div key={mission.id} className="bg-gray-100 p-4 rounded-lg shadow-inner border border-gray-300">
              <h3 className="text-xl font-semibold text-blue-600 mb-2">{mission.name}</h3>
              <p className="text-gray-700 mb-3">{mission.description}</p>
              
              <div className="w-full bg-gray-300 rounded-full h-2.5 mb-2">
                <div 
                  className="bg-green-600 h-2.5 rounded-full" 
                  style={{ width: `${(mission.progress / mission.goal) * 100}%` }}
                ></div>
              </div>
              
              <div className="flex justify-between text-sm text-gray-500 mb-3">
                <span>Progreso: {mission.progress}/{mission.goal}</span>
                <span>Recompensa: {mission.reward} puntos</span>
              </div>
              
              <ThemedButton className="w-full bg-green-600 hover:bg-green-500">
                Contribuir
              </ThemedButton>
            </div>
          )) : <p className="text-center text-gray-500">No hay misiones disponibles.</p>}
        </div>
      )}
      
      <div className="flex justify-center mt-6">
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