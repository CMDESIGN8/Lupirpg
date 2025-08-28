import { 
  Zap, ShoppingCart, CornerUpRight, Compass, CheckCircle, 
  Shield, Users, MessageCircle, LogOut, ChevronUp 
} from 'lucide-react';
import ThemedButton from '../UI/ThemedButton.jsx';
import MessageDisplay from '../UI/MessageDisplay.jsx';
import LoadingScreen from '../UI/LoadingScreen.jsx';

const DashboardView = ({ playerData, lupiCoins, equippedItems, handleUpgradeSkill, handleGainXp, handleFindItem, setView, fetchMissions, fetchClubs, fetchLeaderboard, fetchMarketItems, loading, handleLogout, message }) => {
  if (!playerData) return <LoadingScreen />;

  const nextLevelXp = playerData.level * 100;
  const xpPercentage = (playerData.experience / nextLevelXp) * 100;

  return (
    <div className="flex flex-col items-center min-h-screen bg-gradient-to-b from-green-700 to-green-900 p-4 font-sans">
      <div className="w-full max-w-4xl p-8 bg-white rounded-lg shadow-2xl border-4 border-yellow-500" style={{
        backgroundImage: 'radial-gradient(circle at center, #f0fdf4 0%, #dcfce7 100%)'
      }}>
        {/* Header con estilo de marcador */}
        <div className="bg-gray-800 text-yellow-400 py-3 px-6 rounded-t-lg flex justify-between items-center mb-6 border-b-4 border-yellow-500">
          <h2 className="text-3xl font-bold">⚽ LUPI FOOTBALL RPG ⚽</h2>
        </div>
        
        <MessageDisplay message={message} />
        
        <div className="space-y-6">
          {/* Información del Jugador con estilo de ficha técnica */}
          <div className="bg-gradient-to-r from-green-400 to-blue-400 p-4 rounded-lg shadow-inner border-2 border-white">
            <h3 className="text-xl font-semibold flex items-center gap-2 mb-2 text-white">
              <span className="bg-blue-600 p-1 rounded">👤</span> Ficha Técnica
            </h3>
            <div className="grid grid-cols-2 gap-4 text-white">
              <div>
                <p className="text-sm text-blue-100">Jugador:</p>
                <p className="text-lg font-bold text-white">{playerData.username}</p>
              </div>
              <div>
                <p className="text-sm text-blue-100">Nivel:</p>
                <p className="text-lg font-bold text-white">{playerData.level}</p>
              </div>
              <div className="flex items-center gap-2 bg-green-800 px-3 py-1 rounded-full">
            <span className="text-white font-bold">LupiCoins:</span>
            <span className="text-yellow-400 font-bold">{lupiCoins}</span>
          </div>
              <div>
                <p className="text-sm text-blue-100">Posición:</p>
                <p className="text-lg font-bold text-white">{playerData.position}</p>
              </div>
              <div>
                <p className="text-sm text-blue-100">Deporte:</p>
                <p className="text-lg font-bold text-white">{playerData.sport}</p>
              </div>
              {playerData.clubs && (
                <div className="col-span-2">
                  <p className="text-sm text-blue-100">Club:</p>
                  <p className="text-lg font-bold text-white">{playerData.clubs.name}</p>
                </div>
              )}
            </div>
            
            <div className="mt-4 bg-green-700 p-2 rounded">
              <p className="text-sm text-white">Experiencia ({playerData.experience}/{nextLevelXp})</p>
              <div className="w-full bg-gray-300 rounded-full h-3 mt-1">
                <div className="lupi-progress">
      <div className="lupi-progress-bar" style={{ width: `${xpPercentage}%` }}></div>
    </div>
              </div>
            </div>
          </div>

          {/* Habilidades con estilo de estadísticas de jugador */}
          <div className="bg-gradient-to-r from-blue-400 to-purple-500 p-4 rounded-lg shadow-inner border-2 border-white">
            <h3 className="text-xl font-semibold flex items-center gap-2 mb-2 text-white">
              <span className="bg-purple-600 p-1 rounded">📊</span> Estadísticas
            </h3>
            <p className="text-sm text-white mb-4">Puntos disponibles: <span className="text-yellow-400 font-bold">{playerData.skill_points}</span></p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {playerData.skills?.map(skill => {
                const bonusItem = equippedItems[skill.skill_name];
                const bonus = bonusItem ? bonusItem.bonus_value : 0;
                const totalValue = skill.skill_value + bonus;
                
                // Mapear nombres de habilidades a términos futbolísticos
                const skillNamesMap = {
                  "Fuerza": "⚽ Potencia de Tiro",
                  "Resistencia": "🏃 Resistencia",
                  "Técnica": "🌟 Técnica",
                  "Velocidad": "💨 Velocidad",
                  "Dribling": "🎯 Regate",
                  "Pase": "📨 Precisión de Pase",
                  "Tiro": "🥅 Precisión de Tiro",
                  "Defensa": "🛡️ Defensa",
                  "Liderazgo": "👑 Liderazgo",
                  "Estrategia": "🧠 Visión de Juego",
                  "Inteligencia": "📈 Inteligencia Táctica"
                };
                
                const skillDisplayName = skillNamesMap[skill.skill_name] || skill.skill_name;
                
                return (
                  <div key={skill.skill_name} className="flex justify-between items-center p-3 bg-white rounded-md shadow-sm border border-gray-200">
                    <span className="text-gray-800 font-medium">{skillDisplayName}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-blue-600 font-bold">{totalValue}</span>
                      {bonus > 0 && <span className="text-xs text-green-600">(+{bonus})</span>}
                      <button 
                        onClick={() => handleUpgradeSkill(skill.skill_name)} 
                        disabled={loading || playerData.skill_points <= 0} 
                        className="p-1 bg-green-600 text-white rounded-full hover:bg-green-500 disabled:bg-gray-400 disabled:text-gray-600 transition"
                        title="Mejorar habilidad"
                      >
                        <ChevronUp size={16} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Botones de acción con temática futbolística */}
          <div className="bg-gradient-to-r from-yellow-400 to-red-500 p-4 rounded-lg shadow-inner border-2 border-white">
            <h3 className="text-xl font-semibold flex items-center gap-2 mb-4 text-white">
              <span className="bg-red-600 p-1 rounded">⚽</span> Acciones
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
              <ThemedButton 
                onClick={handleGainXp} 
                disabled={loading} 
                icon={<span className="text-xl">⚽</span>} 
                className="bg-green-600 hover:bg-green-500 text-white font-bold"
              >
                Entrenar
              </ThemedButton>
              
              <ThemedButton 
                onClick={() => { fetchMarketItems(); setView('market'); }} 
                disabled={loading} 
                icon={<ShoppingCart size={18} />} 
                className="bg-yellow-600 hover:bg-yellow-500 text-white font-bold"
              >
                Mercado
              </ThemedButton>
              
              <ThemedButton 
                onClick={() => setView('transfer')} 
                disabled={loading} 
                icon={<CornerUpRight size={18} />} 
                className="bg-purple-600 hover:bg-purple-500 text-white font-bold"
              >
                Transferir
              </ThemedButton>
              
              <ThemedButton 
                onClick={handleFindItem} 
                disabled={loading} 
                icon={<Compass size={18} />} 
                className="bg-blue-600 hover:bg-blue-500 text-white font-bold"
              >
                Buscar Objeto
              </ThemedButton>
              
              <ThemedButton 
                onClick={() => { fetchMissions(); setView('missions'); }} 
                disabled={loading} 
                icon={<CheckCircle size={18} />} 
                className="bg-red-600 hover:bg-red-500 text-white font-bold"
              >
                Misiones
              </ThemedButton>
              
              <ThemedButton 
                onClick={() => { fetchClubs(); setView('clubs'); }} 
                disabled={loading} 
                icon={<Shield size={18} />} 
                className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold"
              >
                Clubes
              </ThemedButton>
              
              <ThemedButton 
                onClick={() => { fetchLeaderboard(); setView('leaderboard'); }} 
                disabled={loading} 
                icon={<Users size={18} />} 
                className="bg-gray-700 hover:bg-gray-600 text-white font-bold"
              >
                Clasificación
              </ThemedButton>
              
              <ThemedButton 
                onClick={() => setView('inventory')} 
                disabled={loading} 
                icon={<span className="text-xl">🎒</span>} 
                className="bg-amber-600 hover:bg-amber-500 text-white font-bold"
              >
                Inventario
              </ThemedButton>
              
              <ThemedButton 
                onClick={() => setView('chat')} 
                disabled={loading} 
                icon={<MessageCircle size={18} />} 
                className="bg-pink-600 hover:bg-pink-500 text-white font-bold"
              >
                Chat
              </ThemedButton>
              
              <button 
                onClick={handleLogout} 
                className="flex items-center justify-center gap-2 px-3 py-2 font-bold rounded-md transition duration-300 transform bg-red-700 text-white hover:bg-red-600 hover:scale-105 col-span-2 md:col-span-1"
              >
                <LogOut size={18} /> Salir
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardView;