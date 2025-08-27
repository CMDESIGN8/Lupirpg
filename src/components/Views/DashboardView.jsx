import { 
  Star, Wallet, DollarSign, Zap, ShoppingCart, CornerUpRight, 
  Compass, CheckCircle, Shield, Users, Backpack, MessageCircle, 
  LogOut, ChevronUp, Trophy 
} from 'lucide-react';
import ThemedButton from '../UI/ThemedButton.jsx';
import MessageDisplay from '../UI/MessageDisplay.jsx';
import LoadingScreen from '../UI/LoadingScreen.jsx';

const DashboardView = ({ playerData, lupiCoins, equippedItems, handleUpgradeSkill, handleGainXp, handleFindItem, setView, fetchMissions, fetchClubs, fetchLeaderboard, fetchMarketItems, loading, message }) => {
  if (!playerData) return <LoadingScreen />;

  const nextLevelXp = playerData.level * 100;
  const xpPercentage = (playerData.experience / nextLevelXp) * 100;

  return (
    <div className="flex flex-col items-center min-h-screen bg-gray-100 p-4 font-sans">
      <div className="w-full max-w-4xl p-8 bg-white rounded-lg shadow-xl border border-gray-300">
        <h2 className="text-3xl font-bold text-center mb-6 text-blue-600">Dashboard</h2>
        <MessageDisplay message={message} />
        <div className="space-y-6">
          <div className="bg-gray-100 p-4 rounded-lg shadow-inner border border-gray-300">
            <h3 className="text-xl font-semibold flex items-center gap-2 mb-2 text-blue-600"><Star size={20} /> Información del Jugador</h3>
            <p>Usuario: <span className="text-blue-800">{playerData.username}</span></p>
            <p>Nivel: <span className="text-blue-800">{playerData.level}</span></p>
            {playerData.clubs && <p>Club: <span className="text-blue-800">{playerData.clubs.name}</span></p>}
            <div className="flex items-center gap-2 mt-1">
              <Wallet size={16} className="text-blue-800" />
              <span className="text-gray-700">Dirección: {playerData.username}.lupi</span>
              <span className="ml-auto text-amber-500 flex items-center gap-1"><DollarSign size={16} />{lupiCoins}</span>
            </div>
            <div className="mt-4">
              <p className="text-sm text-gray-500">Experiencia ({playerData.experience}/{nextLevelXp})</p>
              <div className="w-full bg-gray-300 rounded-full h-2 mt-1">
                <div className="bg-blue-500 h-2 rounded-full" style={{ width: `${xpPercentage}%` }}></div>
              </div>
            </div>
          </div>
          <div className="bg-gray-100 p-4 rounded-lg shadow-inner border border-gray-300">
            <h3 className="text-xl font-semibold flex items-center gap-2 mb-2 text-blue-600"><Trophy size={20} /> Habilidades</h3>
            <p className="text-sm text-gray-500 mb-4">Puntos disponibles: <span className="text-green-600">{playerData.skill_points}</span></p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {playerData.skills?.map(skill => {
                const bonusItem = equippedItems[skill.skill_name];
                const bonus = bonusItem ? bonusItem.bonus_value : 0;
                const totalValue = skill.skill_value + bonus;
                return (
                  <div key={skill.skill_name} className="flex justify-between items-center p-2 bg-white rounded-md shadow-sm border border-gray-200">
                    <span className="text-gray-800">{skill.skill_name}:</span>
                    <div className="flex items-center gap-2">
                      <span className="text-blue-600 font-bold">{totalValue}</span>
                      {bonus > 0 && <span className="text-xs text-green-600">(+{bonus})</span>}
                      <button onClick={() => handleUpgradeSkill(skill.skill_name)} disabled={loading || playerData.skill_points <= 0} className="p-1 bg-blue-600 text-white rounded-full hover:bg-blue-500 disabled:bg-gray-400 disabled:text-gray-600 transition">
                        <ChevronUp size={16} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="flex flex-wrap justify-center mt-6 gap-2">
            <ThemedButton onClick={handleGainXp} disabled={loading} icon={<Zap size={20} />} className="bg-green-600 hover:bg-green-500">Entrenar</ThemedButton>
            <ThemedButton onClick={() => { fetchMarketItems(); setView('market'); }} disabled={loading} icon={<ShoppingCart size={20} />} className="bg-amber-500 hover:bg-amber-400">Mercado</ThemedButton>
            <ThemedButton onClick={() => setView('transfer')} disabled={loading} icon={<CornerUpRight size={20} />} className="bg-purple-600 hover:bg-purple-500">Transferir</ThemedButton>
            <ThemedButton onClick={handleFindItem} disabled={loading} icon={<Compass size={20} />}>Buscar Objeto</ThemedButton>
            <ThemedButton onClick={() => { fetchMissions(); setView('missions'); }} disabled={loading} icon={<CheckCircle size={20} />}>Misiones</ThemedButton>
            <ThemedButton onClick={() => { fetchClubs(); setView('clubs'); }} disabled={loading} icon={<Shield size={20} />}>Clubes</ThemedButton>
            <ThemedButton onClick={() => { fetchLeaderboard(); setView('leaderboard'); }} disabled={loading} icon={<Users size={20} />}>Clasificación</ThemedButton>
            <ThemedButton onClick={() => setView('inventory')} disabled={loading} icon={<Backpack size={20} />}>Inventario</ThemedButton>
            <ThemedButton onClick={() => setView('chat')} disabled={loading} icon={<MessageCircleMore size={20} />}>Chat</ThemedButton>
            <button onClick={() => supabaseClient.auth.signOut()} className="...">
  <LogOut size={20} /> Salir
</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardView;