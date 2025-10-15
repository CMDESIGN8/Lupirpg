import { ChevronDown } from 'lucide-react';
import ThemedButton from '../UI/ThemedButton';
import MessageDisplay from '../UI/MessageDisplay';

const LeaderboardView = ({ leaderboardData, loading, message, setView }) => (
  <div className="flex flex-col items-center min-h-screen bg-gray-100 p-4 font-sans">
    <div className="w-full max-w-4xl p-8 bg-white rounded-lg shadow-xl border border-gray-300">
      <h2 className="text-3xl font-bold text-center mb-6 text-blue-600">Clasificación</h2>
      <MessageDisplay message={message} />
      {loading ? (
        <p className="text-center text-gray-500">Cargando clasificación...</p>
      ) : (
        <div>
          <table className="min-w-full bg-gray-100 border border-gray-300 rounded-md overflow-hidden">
            <thead className="bg-gray-200">
              <tr>
                <th className="py-2 px-4 border-b border-gray-300 text-left">#</th>
                <th className="py-2 px-4 border-b border-gray-300 text-left">Nombre</th>
                <th className="py-2 px-4 border-b border-gray-300 text-left">Nivel</th>
                <th className="py-2 px-4 border-b border-gray-300 text-left">XP</th>
              </tr>
            </thead>
            <tbody>
              {leaderboardData.length > 0 ? (
                leaderboardData.map((player, index) => (
                  <tr key={index} className="hover:bg-gray-200 transition duration-200">
                    <td className="py-2 px-4 border-b border-gray-300">{index + 1}</td>
                    <td className="py-2 px-4 border-b border-gray-300 text-blue-800">{player.username}</td>
                    <td className="py-2 px-4 border-b border-gray-300">{player.level}</td>
                    <td className="py-2 px-4 border-b border-gray-300">{player.experience}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4" className="text-center py-4 text-gray-500">No hay datos en la clasificación.</td>
                </tr>
              )}
            </tbody>
          </table>
          <div className="flex justify-center mt-4">
            <ThemedButton onClick={() => setView('dashboard')} icon={<ChevronDown size={20} />}>
              Volver
            </ThemedButton>
          </div>
        </div>
      )}
    </div>
  </div>
);

export default LeaderboardView;