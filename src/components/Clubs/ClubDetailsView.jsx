import { LogIn, LogOut, ChevronDown, Target, Trophy, Swords, Crown } from 'lucide-react';
import ThemedButton from '../UI/ThemedButton';
import MessageDisplay from '../UI/MessageDisplay';

const ClubDetailsView = ({ currentClub, clubMembers, handleLeaveClub, handleJoinClub, playerData, fetchClubs, loading, message, setView }) => (
  <div className="flex flex-col items-center min-h-screen bg-gray-100 p-4 font-sans">
    <div className="w-full max-w-4xl p-8 bg-white rounded-lg shadow-xl border border-gray-300">
      {currentClub ? (
        <>
          <h2 className="text-3xl font-bold text-center mb-2 text-blue-600">{currentClub.name}</h2>
          <p className="text-center text-gray-600 mb-6">{currentClub.description}</p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-blue-100 p-4 rounded-lg text-center">
              <p className="text-2xl font-bold text-blue-800">{currentClub.members}</p>
              <p className="text-blue-600">Miembros</p>
            </div>
            <div className="bg-green-100 p-4 rounded-lg text-center">
              <p className="text-2xl font-bold text-green-800">{currentClub.level}</p>
              <p className="text-green-600">Nivel</p>
            </div>
            <div className="bg-purple-100 p-4 rounded-lg text-center">
              <p className="text-2xl font-bold text-purple-800">{currentClub.score}</p>
              <p className="text-purple-600">Puntuación</p>
            </div>
          </div>

          <div className="flex justify-center gap-4 mb-6">
            <ThemedButton 
              onClick={() => setView('club_missions')} 
              icon={<Target size={16} />}
              className="bg-indigo-600 hover:bg-indigo-500"
            >
              Misiones
            </ThemedButton>
            <ThemedButton 
              onClick={() => setView('club_rankings')} 
              icon={<Trophy size={16} />}
              className="bg-yellow-600 hover:bg-yellow-500"
            >
              Rankings
            </ThemedButton>
            <ThemedButton 
              onClick={() => setView('club_matches')} 
              icon={<Swords size={16} />}
              className="bg-red-600 hover:bg-red-500"
            >
              Partidos
            </ThemedButton>
          </div>

          <h3 className="text-xl font-semibold mb-4 text-blue-600">Miembros</h3>
          <div className="bg-gray-100 p-4 rounded-lg shadow-inner border border-gray-300 mb-6">
            {loading ? <p>Cargando miembros...</p> : (
              <ul className="space-y-2">
                {clubMembers.map((member, index) => (
                  <li key={index} className="flex justify-between items-center bg-white p-3 rounded-md">
                    <div className="flex items-center">
                      <span className="text-blue-800 font-medium">{member.username}</span>
                      {member.role === 'Líder' && <Crown size={16} className="ml-2 text-yellow-500" />}
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-gray-500">Nivel: {member.level}</span>
                      <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm">{member.role}</span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {playerData.club_id === currentClub.id ? (
            <div className="flex justify-center mt-6">
              <ThemedButton 
                onClick={handleLeaveClub} 
                disabled={loading} 
                icon={<LogOut size={20} />} 
                className="bg-red-600 hover:bg-red-500"
              >
                Abandonar Club
              </ThemedButton>
            </div>
          ) : (
            <div className="flex justify-center mt-6">
              <ThemedButton 
                onClick={() => handleJoinClub(currentClub.id)} 
                disabled={loading} 
                icon={<LogIn size={20} />} 
                className="bg-green-600 hover:bg-green-500"
              >
                Unirse al Club
              </ThemedButton>
            </div>
          )}
        </>
      ) : <p>Cargando detalles del club...</p>}
      <div className="flex justify-center mt-6">
        <ThemedButton 
          onClick={() => { fetchClubs(); setView('clubs'); }} 
          icon={<ChevronDown size={20} />}
        >
          Volver a Clubes
        </ThemedButton>
      </div>
    </div>
  </div>
);

export default ClubDetailsView;