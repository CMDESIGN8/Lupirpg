import { ChevronUp } from 'lucide-react';
import ThemedButton from '../UI/ThemedButton';
import MessageDisplay from '../UI/MessageDisplay';
import { sports, positions } from '../../constants';

const CreateCharacterView = ({ handleCreateAccount, setUsername, setSport, setPosition, handleSkillChange, username, sport, position, skills, availablePoints, loading, message }) => (
  <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4 font-sans">
    <div className="w-full max-w-lg p-8 bg-white rounded-lg shadow-xl border border-gray-300">
      <h2 className="text-3xl font-bold text-center mb-6 text-blue-600">Crea Tu Personaje</h2>
      <MessageDisplay message={message} />
      <form onSubmit={handleCreateAccount} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Nombre de Usuario</label>
          <input type="text" placeholder="Nombre de Usuario" value={username} onChange={(e) => setUsername(e.target.value)} className="mt-1 w-full p-2 bg-gray-50 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800" required />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Deporte</label>
          <select value={sport} onChange={(e) => setSport(e.target.value)} className="mt-1 w-full p-2 bg-gray-50 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800">
            {sports.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Posición</label>
          <select value={position} onChange={(e) => setPosition(e.target.value)} className="mt-1 w-full p-2 bg-gray-50 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800">
            {positions.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>
        <div className="bg-gray-100 p-4 rounded-md border border-gray-300">
          <h4 className="font-semibold mb-2 text-blue-600">Asignar Puntos de Habilidad</h4>
          <p className="text-sm text-gray-500 mb-4">Puntos disponibles: {availablePoints}</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.entries(skills).map(([skillName, skillValue]) => (
              <div key={skillName} className="flex items-center justify-between p-2 rounded-md bg-white">
                <span className="text-gray-800">{skillName}: <span className="text-blue-600">{skillValue}</span></span>
                <button type="button" onClick={() => handleSkillChange(skillName, 1)} disabled={availablePoints <= 0} className="ml-2 p-1 bg-blue-600 text-white rounded-full hover:bg-blue-500 disabled:bg-gray-400 disabled:text-gray-600 transition">
                  <ChevronUp size={16} />
                </button>
              </div>
            ))}
          </div>
        </div>
        <ThemedButton type="submit" disabled={loading || availablePoints > 0} className="w-full bg-green-600 hover:bg-green-500">
          {loading ? 'Cargando...' : 'Crear Personaje'}
        </ThemedButton>
      </form>
    </div>
  </div>
);

export default CreateCharacterView;