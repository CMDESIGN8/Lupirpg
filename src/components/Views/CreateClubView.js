import { UserPlus, ChevronDown } from 'lucide-react';
import ThemedButton from '../UI/ThemedButton';
import MessageDisplay from '../UI/MessageDisplay';

const CreateClubView = ({ handleCreateClub, newClubName, setNewClubName, newClubDescription, setNewClubDescription, loading, message, setView }) => (
  <div className="flex flex-col items-center min-h-screen bg-gray-100 p-4 font-sans">
    <div className="w-full max-w-md p-8 bg-white rounded-lg shadow-xl border border-gray-300">
      <h2 className="text-3xl font-bold text-center mb-6 text-blue-600">Crear un Club</h2>
      <MessageDisplay message={message} />
      <form onSubmit={handleCreateClub} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Nombre del Club</label>
          <input type="text" placeholder="Nombre del Club" value={newClubName} onChange={(e) => setNewClubName(e.target.value)} className="mt-1 w-full p-2 bg-gray-50 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800" required />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Descripción</label>
          <textarea placeholder="Descripción del Club" value={newClubDescription} onChange={(e) => setNewClubDescription(e.target.value)} className="mt-1 w-full p-2 bg-gray-50 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800" rows="3"></textarea>
        </div>
        <ThemedButton type="submit" disabled={loading} icon={<UserPlus size={20} />} className="w-full bg-green-600 hover:bg-green-500">
          {loading ? 'Creando...' : 'Crear Club'}
        </ThemedButton>
      </form>
      <div className="flex justify-center mt-6">
        <ThemedButton onClick={() => setView('clubs')} icon={<ChevronDown size={20} />}>Cancelar</ThemedButton>
      </div>
    </div>
  </div>
);

export default CreateClubView;