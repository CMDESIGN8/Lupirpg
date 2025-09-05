import { UserPlus, Users, LogIn, ChevronDown, Shield } from 'lucide-react';
import ThemedButton from '../UI/ThemedButton';
import MessageDisplay from '../UI/MessageDisplay';

import '../styles/ClubsView.css';

const ClubsView = ({ clubs, handleViewClubDetails, handleJoinClub, playerData, loading, message, setView }) => (
  <div className="flex flex-col items-center min-h-screen bg-gray-100 p-4 font-sans">
    <div className="w-full max-w-4xl p-8 bg-white rounded-lg shadow-xl border border-gray-300">
      <h2 className="text-3xl font-bold text-center mb-6 text-blue-600">Clubes</h2>
      <MessageDisplay message={message} />
      {!playerData.club_id && (
        <div className="flex justify-end mb-4">
          <ThemedButton onClick={() => setView('create_club')} icon={<UserPlus size={16} />} className="bg-green-600 hover:bg-green-500">Crear Club</ThemedButton>
        </div>
      )}
      {loading ? <p className="text-center text-gray-500">Cargando clubes...</p> : (
        <div className="space-y-4">
          {clubs.length > 0 ? clubs.map(club => (
            <div key={club.id} className="bg-gray-100 p-4 rounded-lg shadow-inner border border-gray-300 flex justify-between items-center">
              <div>
                <h3 className="text-xl font-semibold text-blue-600">{club.name}</h3>
                <p className="text-gray-700">{club.description}</p>
              </div>
              <div className="flex gap-2">
                <ThemedButton onClick={() => handleViewClubDetails(club)} icon={<Users size={16} />}>Ver</ThemedButton>
                {!playerData.club_id && (
                  <ThemedButton onClick={() => handleJoinClub(club.id)} disabled={loading} icon={<LogIn size={16} />} className="bg-green-600 hover:bg-green-500">Unirse</ThemedButton>
                )}
              </div>
            </div>
          )) : <p className="text-center text-gray-500">No hay clubes disponibles.</p>}
        </div>
      )}
      <div className="flex justify-center mt-6">
        <ThemedButton onClick={() => setView('dashboard')} icon={<ChevronDown size={20} />}>Volver</ThemedButton>
      </div>
    </div>
  </div>
);

export default ClubsView;