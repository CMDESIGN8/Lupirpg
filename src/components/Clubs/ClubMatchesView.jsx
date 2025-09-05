import { ChevronDown, Calendar } from 'lucide-react';
import ThemedButton from '../UI/ThemedButton';

const ClubMatchesView = ({ scheduledMatches, loading, setView }) => (
  <div className="flex flex-col items-center min-h-screen bg-gray-100 p-4 font-sans">
    <div className="w-full max-w-4xl p-8 bg-white rounded-lg shadow-xl border border-gray-300">
      <h2 className="text-3xl font-bold text-center mb-6 text-blue-600">Partidos del Club</h2>
      
      <div className="flex justify-center mb-6">
        <ThemedButton 
          icon={<Calendar size={16} />}
          className="bg-green-600 hover:bg-green-500"
        >
          Programar Partido
        </ThemedButton>
      </div>
      
      {loading ? <p className="text-center text-gray-500">Cargando partidos...</p> : (
        <div className="space-y-4">
          {scheduledMatches.length > 0 ? scheduledMatches.map(match => (
            <div key={match.id} className="bg-gray-100 p-4 rounded-lg shadow-inner border border-gray-300">
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-xl font-semibold text-blue-600">vs {match.opponent}</h3>
                <span className={`px-3 py-1 rounded-full text-sm ${
                  match.status === 'Programado' ? 'bg-yellow-100 text-yellow-800' : 
                  match.status === 'En progreso' ? 'bg-blue-100 text-blue-800' : 
                  'bg-gray-100 text-gray-800'
                }`}>
                  {match.status}
                </span>
              </div>
              
              <div className="flex justify-between text-gray-700 mb-4">
                <div className="flex items-center">
                  <Calendar size={16} className="mr-2" />
                  <span>{match.date}</span>
                </div>
                <div className="flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>{match.time}</span>
                </div>
              </div>
              
              <div className="flex gap-2">
                <ThemedButton className="flex-1 bg-blue-600 hover:bg-blue-500">
                  Ver detalles
                </ThemedButton>
                <ThemedButton className="flex-1 bg-green-600 hover:bg-green-500">
                  Unirse
                </ThemedButton>
              </div>
            </div>
          )) : <p className="text-center text-gray-500">No hay partidos programados.</p>}
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

export default ClubMatchesView;