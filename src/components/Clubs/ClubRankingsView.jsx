import { ChevronDown, Swords } from 'lucide-react';
import ThemedButton from '../UI/ThemedButton';

const ClubRankingsView = ({ clubRankings, playerData, handleChallengeClub, loading, setView }) => (
  <div className="flex flex-col items-center min-h-screen bg-gray-100 p-4 font-sans">
    <div className="w-full max-w-4xl p-8 bg-white rounded-lg shadow-xl border border-gray-300">
      <h2 className="text-3xl font-bold text-center mb-6 text-blue-600">Ranking de Clubes</h2>
      
      {loading ? <p className="text-center text-gray-500">Cargando rankings...</p> : (
        <div className="space-y-3">
          {clubRankings.length > 0 ? clubRankings.map(club => (
            <div key={club.position} className={`p-4 rounded-lg border flex justify-between items-center ${
              club.position === 1 ? 'bg-yellow-100 border-yellow-300' : 
              club.position === 2 ? 'bg-gray-100 border-gray-300' : 
              club.position === 3 ? 'bg-orange-100 border-orange-300' : 'bg-white border-gray-200'
            }`}>
              <div className="flex items-center">
                <span className={`text-xl font-bold mr-4 ${
                  club.position === 1 ? 'text-yellow-600' : 
                  club.position === 2 ? 'text-gray-600' : 
                  club.position === 3 ? 'text-orange-600' : 'text-blue-600'
                }`}>
                  #{club.position}
                </span>
                <div>
                  <h3 className="text-lg font-semibold">{club.name}</h3>
                  <p className="text-sm text-gray-500">{club.members} miembros</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold">{club.score} pts</p>
                {playerData.club_id && club.position > 3 && (
                  <ThemedButton 
                    onClick={() => handleChallengeClub(club.id)} 
                    icon={<Swords size={14} />}
                    className="mt-2 bg-red-600 hover:bg-red-500 text-xs py-1"
                  >
                    Desafiar
                  </ThemedButton>
                )}
              </div>
            </div>
          )) : <p className="text-center text-gray-500">No hay datos de ranking disponibles.</p>}
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

export default ClubRankingsView;