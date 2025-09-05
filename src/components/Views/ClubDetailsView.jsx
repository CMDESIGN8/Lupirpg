import { LogIn, LogOut, ChevronDown } from 'lucide-react';
import ThemedButton from '../UI/ThemedButton';
import MessageDisplay from '../UI/MessageDisplay';

import '../styles/ClubDetailsView.css';

const ClubDetailsView = ({ currentClub, clubMembers, handleLeaveClub, handleJoinClub, playerData, fetchClubs, loading, message, setView }) => (
  <div className="flex flex-col items-center min-h-screen bg-gray-100 p-4 font-sans">
    <div className="w-full max-w-4xl p-8 bg-white rounded-lg shadow-xl border border-gray-300">
      {currentClub ? (
        <>
          <h2 className="text-3xl font-bold text-center mb-2 text-blue-600">{currentClub.name}</h2>
          <p className="text-center text-gray-600 mb-6">{currentClub.description}</p>
          <h3 className="text-xl font-semibold mb-4 text-blue-600">Miembros</h3>
          <div className="bg-gray-100 p-4 rounded-lg shadow-inner border border-gray-300">
            {loading ? <p>Cargando miembros...</p> : (
              <ul className="space-y-2">
                {clubMembers.map(member => (
                  <li key={member.username} className="flex justify-between items-center bg-white p-2 rounded-md">
                    <span className="text-blue-800">{member.username}</span>
                    <span className="text-gray-500">Nivel: {member.level}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
          {playerData.club_id === currentClub.id ? (
            <div className="flex justify-center mt-6">
              <ThemedButton onClick={handleLeaveClub} disabled={loading} icon={<LogOut size={20} />} className="bg-red-600 hover:bg-red-500">Abandonar Club</ThemedButton>
            </div>
          ) : (
            <div className="flex justify-center mt-6">
              <ThemedButton onClick={() => handleJoinClub(currentClub.id)} disabled={loading} icon={<LogIn size={20} />} className="bg-green-600 hover:bg-green-500">Unirse al Club</ThemedButton>
            </div>
          )}
        </>
      ) : <p>Cargando detalles del club...</p>}
      <div className="flex justify-center mt-6">
        <ThemedButton onClick={() => { fetchClubs(); setView('clubs'); }} icon={<ChevronDown size={20} />}>Volver a Clubes</ThemedButton>
      </div>
    </div>
  </div>
);

export default ClubDetailsView; 