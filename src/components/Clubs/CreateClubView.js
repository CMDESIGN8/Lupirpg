import ThemedButton from '../UI/ThemedButton';

const CreateClubView = ({ setView }) => (
  <div className="flex flex-col items-center min-h-screen bg-gray-100 p-4 font-sans">
    <div className="w-full max-w-2xl p-8 bg-white rounded-lg shadow-xl border border-gray-300">
      <h2 className="text-3xl font-bold text-center mb-6 text-blue-600">Crear Nuevo Club</h2>
      
      <form className="space-y-4">
        <div>
          <label className="block text-gray-700 mb-2" htmlFor="clubName">Nombre del Club</label>
          <input
            type="text"
            id="clubName"
            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Ingresa el nombre de tu club"
          />
        </div>
        
        <div>
          <label className="block text-gray-700 mb-2" htmlFor="clubDescription">Descripción</label>
          <textarea
            id="clubDescription"
            rows="3"
            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Describe el propósito de tu club"
          ></textarea>
        </div>
        
        <div>
          <label className="block text-gray-700 mb-2" htmlFor="clubType">Tipo de Club</label>
          <select
            id="clubType"
            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="casual">Casual</option>
            <option value="competitive">Competitivo</option>
            <option value="training">Entrenamiento</option>
            <option value="social">Social</option>
          </select>
        </div>
        
        <div className="flex gap-4 pt-4">
          <ThemedButton 
            type="button"
            onClick={() => setView('clubs')} 
            className="bg-gray-600 hover:bg-gray-500 flex-1"
          >
            Cancelar
          </ThemedButton>
          <ThemedButton 
            type="submit"
            className="bg-green-600 hover:bg-green-500 flex-1"
          >
            Crear Club
          </ThemedButton>
        </div>
      </form>
    </div>
  </div>
);

export default CreateClubView;