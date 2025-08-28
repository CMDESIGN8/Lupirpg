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
    <div className="flex flex-col items-center min-h-screen lupi-bg-darker p-4 font-sans">
      <div className="w-full max-w-4xl p-8 lupi-card rounded-lg shadow-2xl">
        {/* Header con estilo de marcador LUPI */}
        <div className="lupi-bg-card text-lupi-secondary py-4 px-6 rounded-t-lg flex justify-between items-center mb-6 neon-border">
          <h2 className="text-3xl font-bold neon-text">⚽ LUPI FOOTBALL RPG ⚽</h2>
          <div className="flex items-center gap-2 bg-lupi-card px-4 py-2 rounded-full lupi-border-glow">
            <span className="text-lupi-text-secondary font-bold">LupiCoins:</span>
            <span className="text-lupi-accent font-bold">{lupiCoins}</span>
          </div>
        </div>
        
        <MessageDisplay message={message} />
        
        <div className="space-y-6">
          {/* Información del Jugador con estilo LUPI */}
          <div className="stats-card">
            <h3 className="text-xl font-semibold flex items-center gap-2 mb-4 text-lupi-secondary neon-text">
              <span className="bg-lupi-primary p-2 rounded-full">👤</span> Ficha Técnica
            </h3>
            <div className="grid grid-cols-2 gap-4 text-lupi-text">
              <div className="bg-lupi-dark p-3 rounded-lg">
                <p className="text-sm text-lupi-text-secondary">Jugador:</p>
                <p className="text-lg font-bold text-gradient">{playerData.username}</p>
              </div>
              <div className="bg-lupi-dark p-3 rounded-lg">
                <p className="text-sm text-lupi-text-secondary">Nivel:</p>
                <p className="text-lg font-bold text-lupi-primary">{playerData.level}</p>
              </div>
              <div className="bg-lupi-dark p-3 rounded-lg">
                <p className="text-sm text-lupi-text-secondary">Posición:</p>
                <p className="text-lg font-bold text-lupi-secondary">{playerData.position}</p>
              </div>
              <div className="bg-lupi-dark p-3 rounded-lg">
                <p className="text-sm text-lupi-text-secondary">Deporte:</p>
                <p className="text-lg font-bold text-lupi-accent">{playerData.sport}</p>
              </div>
              {playerData.clubs && (
                <div className="col-span-2 bg-lupi-dark p-3 rounded-lg">
                  <p className="text-sm text-lupi-text-secondary">Club:</p>
                  <p className="text-lg font-bold text-lupi-primary">{playerData.clubs.name}</p>
                </div>
              )}
            </div>
            
            <div className="mt-6 bg-lupi-card p-4 rounded-lg lupi-border">
              <p className="text-sm text-lupi-text-secondary mb-2">Experiencia ({playerData.experience}/{nextLevelXp})</p>
              <div className="lupi-progress">
                <div className="lupi-progress-bar" style={{ width: `${xpPercentage}%` }}></div>
              </div>
            </div>
          </div>

          {/* Habilidades con estilo LUPI */}
          <div className="stats-card">
            <h3 className="text-xl font-semibold flex items-center gap-2 mb-4 text-lupi-secondary neon-text">
              <span className="bg-lupi-primary p-2 rounded-full">📊</span> Estadísticas
            </h3>
            <p className="text-sm text-lupi-text mb-4">Puntos disponibles: <span className="text-lupi-accent font-bold">{playerData.skill_points}</span></p>
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
                  <div key={skill.skill_name} className="flex justify-between items-center p-4 bg-lupi-dark rounded-md lupi-border">
                    <span className="text-lupi-text font-medium">{skillDisplayName}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-lupi-primary font-bold">{totalValue}</span>
                      {bonus > 0 && <span className="text-xs text-lupi-secondary">(+{bonus})</span>}
                      <button 
                        onClick={() => handleUpgradeSkill(skill.skill_name)} 
                        disabled={loading || playerData.skill_points <= 0} 
                        className="p-2 bg-lupi-primary text-white rounded-full hover:bg-lupi-accent disabled:bg-gray-600 disabled:text-gray-400 transition-all duration-300 lupi-border-glow"
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

          {/* Botones de acción con estilo LUPI */}
          <div className="stats-card">
            <h3 className="text-xl font-semibold flex items-center gap-2 mb-4 text-lupi-secondary neon-text">
              <span className="bg-lupi-primary p-2 rounded-full">⚽</span> Acciones
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
              <button 
                onClick={handleGainXp} 
                disabled={loading} 
                className="lupi-btn flex items-center justify-center gap-2"
              >
                <Zap size={18} />
                Entrenar
              </button>
              
              <button 
                onClick={() => { fetchMarketItems(); setView('market'); }} 
                disabled={loading} 
                className="lupi-btn flex items-center justify-center gap-2"
              >
                <ShoppingCart size={18} />
                Mercado
              </button>
              
              <button 
                onClick={() => setView('transfer')} 
                disabled={loading} 
                className="lupi-btn flex items-center justify-center gap-2"
              >
                <CornerUpRight size={18} />
                Transferir
              </button>
              
              <button 
                onClick={handleFindItem} 
                disabled={loading} 
                className="lupi-btn flex items-center justify-center gap-2"
              >
                <Compass size={18} />
                Buscar
              </button>
              
              <button 
                onClick={() => { fetchMissions(); setView('missions'); }} 
                disabled={loading} 
                className="lupi-btn flex items-center justify-center gap-2"
              >
                <CheckCircle size={18} />
                Misiones
              </button>
              
              <button 
                onClick={() => { fetchClubs(); setView('clubs'); }} 
                disabled={loading} 
                className="lupi-btn flex items-center justify-center gap-2"
              >
                <Shield size={18} />
                Clubes
              </button>
              
              <button 
                onClick={() => { fetchLeaderboard(); setView('leaderboard'); }} 
                disabled={loading} 
                className="lupi-btn flex items-center justify-center gap-2"
              >
                <Users size={18} />
                Ranking
              </button>
              
              <button 
                onClick={() => setView('inventory')} 
                disabled={loading} 
                className="lupi-btn flex items-center justify-center gap-2"
              >
                <span className="text-xl">🎒</span>
                Inventario
              </button>
              
              <button 
                onClick={() => setView('chat')} 
                disabled={loading} 
                className="lupi-btn flex items-center justify-center gap-2"
              >
                <MessageCircle size={18} />
                Chat
              </button>
              
              <button 
                onClick={handleLogout} 
                className="action-button flex items-center justify-center gap-2 bg-gradient-to-r from-red-600 to-red-800 col-span-2 md:col-span-1"
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