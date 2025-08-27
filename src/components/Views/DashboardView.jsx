import { 
  Star, Wallet, DollarSign, Zap, ShoppingCart, CornerUpRight, 
  Compass, CheckCircle, Shield, Users, Backpack, MessageCircle, 
  LogOut, ChevronUp, Trophy 
} from 'lucide-react';
import ThemedButton from '../UI/ThemedButton.jsx';
import MessageDisplay from '../UI/MessageDisplay.jsx';
import LoadingScreen from '../UI/LoadingScreen.jsx';

const DashboardView = ({ playerData, lupiCoins, equippedItems, handleUpgradeSkill, handleGainXp, handleFindItem, setView, fetchMissions, fetchClubs, fetchLeaderboard, fetchMarketItems, loading, supabaseClient, handleLogout, message }) => {
  if (!playerData) return <LoadingScreen />;

  const nextLevelXp = playerData.level * 100;
  const xpPercentage = (playerData.experience / nextLevelXp) * 100;

  return (
    <div className="stadium-container">
      <div className="field-header">
        <h2 className="scoreboard-title">⚽ LUPI FOOTBALL RPG ⚽</h2>
        <div className="player-stats">
          <span className="stat-badge">Nivel {playerData.level}</span>
          <span className="stat-badge">⭐ {lupiCoins}</span>
        </div>
      </div>

      <div className="soccer-field">
        {/* Secciones del campo */}
        <div className="field-section goalkeeper">
          <div className="position-title">Portero</div>
        </div>
        
        <div className="field-section defense">
          <div className="position-title">Defensa</div>
        </div>

        <div className="field-section midfield">
          <div className="position-title">Mediocampo</div>
          <div className="team-formation">4-3-3</div>
        </div>

        <div className="field-section attack">
          <div className="position-title">Ataque</div>
        </div>
      </div>

      {/* Botones con estilo deportivo */}
      <div className="training-buttons">
        <button className="btn-training" onClick={handleGainXp}>
          ⚽ Entrenar Tiro
        </button>
        <button className="btn-training" onClick={handleFindItem}>
          🔍 Buscar Equipamiento
        </button>
      </div>
    </div>
  );
};

export default DashboardView;