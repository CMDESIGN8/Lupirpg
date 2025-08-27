import { CheckCircle, ChevronDown } from 'lucide-react'; // Cambia CheckCircle a CheckCircle
import ThemedButton from '../UI/ThemedButton';
import MessageDisplay from '../UI/MessageDisplay';

const MissionsView = ({ missionsData, handleCompleteMission, loading, message, setView }) => (
  <div className="flex flex-col items-center min-h-screen bg-gray-100 p-4 font-sans">
    <div className="w-full max-w-4xl p-8 bg-white rounded-lg shadow-xl border border-gray-300">
      <h2 className="text-3xl font-bold text-center mb-6 text-blue-600">Misiones</h2>
      <MessageDisplay message={message} />
      {loading ? <p className="text-center text-gray-500">Cargando misiones...</p> : (
        <div className="space-y-4">
          {missionsData.length > 0 ? missionsData.map(mission => (
            <div key={mission.id} className="bg-gray-100 p-4 rounded-lg shadow-inner border border-gray-300">
              <h3 className="text-xl font-semibold text-blue-600">{mission.name}</h3>
              <p className="text-gray-700">{mission.description}</p>
              <p className="text-sm text-gray-500 mt-2">Recompensa: <span className="text-green-600">{mission.xp_reward} XP</span> y <span className="text-green-600">{mission.skill_points_reward} puntos de habilidad</span></p>
              <ThemedButton onClick={() => handleCompleteMission(mission)} disabled={mission.is_completed || loading} icon={<CheckCircle size={20} />} className={`mt-4 w-full ${mission.is_completed ? 'bg-green-600 hover:bg-green-500' : 'bg-blue-600 hover:bg-blue-500'}`}>
                {mission.is_completed ? 'Misión Completada' : 'Completar Misión'}
              </ThemedButton>
            </div>
          )) : <div className="text-center py-8"><p className="text-gray-500">No hay misiones disponibles.</p></div>}
          <div className="flex justify-center mt-6">
            <ThemedButton onClick={() => setView('dashboard')} icon={<ChevronDown size={20} />}>Volver</ThemedButton>
          </div>
        </div>
      )}
    </div>
  </div>
);

export default MissionsView;