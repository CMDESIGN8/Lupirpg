import { 
  Zap, ShoppingCart, CornerUpRight, Compass, CheckCircle, 
  Shield, Users, MessageCircle, LogOut, ChevronUp , Copy
} from 'lucide-react';
import MessageDisplay from '../UI/MessageDisplay.jsx';
import LoadingScreen from '../UI/LoadingScreen.jsx';
import { useState, useEffect } from 'react';
import { Settings } from 'lucide-react';
import { avatarService } from '../../services/avatarService';
import AvatarSelector from '../AvatarSelector/AvatarSelector';


const DashboardView = ({ playerData, lupiCoins, equippedItems, handleUpgradeSkill, handleGainXp, handleFindItem, setView, fetchMissions, fetchClubs, fetchLeaderboard, fetchMarketItems, loading, handleLogout, message }) => {
  if (!playerData) return <LoadingScreen />;

  const [copied, setCopied] = useState(false);
  const nextLevelXp = playerData.level * 100;
  const xpPercentage = (playerData.experience / nextLevelXp) * 100;
  const [equippedAvatar, setEquippedAvatar] = useState(null);
  const [showAvatarSelector, setShowAvatarSelector] = useState(false);

  useEffect(() => {
    loadEquippedAvatar();
  }, [playerData]);

  const loadEquippedAvatar = async () => {
    if (playerData?.id) {
      try {
        const avatar = await avatarService.getEquippedAvatar(playerData.id);
        setEquippedAvatar(avatar);
      } catch (error) {
        console.error('Error loading avatar:', error);
      }
    }
  };

  const handleAvatarClick = () => {
    setShowAvatarSelector(true);
  };

   // Función para copiar la dirección al portapapeles
  const copyToClipboard = () => {
    navigator.clipboard.writeText(`${playerData.username}.lupi`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };


  return (
    <div className="game-dashboard">
      {/* Header tipo videojuego */}
      <div className="game-header">
        <div className="game-title">
          <h1>LUPI FOOTBALL RPG</h1>
          <div className="title-underline"></div>
        </div>
      </div>

      <MessageDisplay message={message} />
      
      <div className="dashboard-content">
        {/* Sección izquierda - Información del jugador */}
        <div className="player-card">
          <div className="card-header">
            <h2>FICHA TÉCNICA</h2>
            <div className="header-line"></div>
          </div>
          <div className="player-info">
            <div className="info-row">
              <span className="info-label">Jugador:</span>
              <span className="info-value neon-text">{playerData.username}</span>
            </div>
            {/* Avatar interactivo */}
            <div className="avatar-section">
              <div className="avatar-container" onClick={handleAvatarClick}>
                <img 
                  src={equippedAvatar?.avatars?.image_url || '/default-avatar.png'} 
                  alt={`Avatar de ${playerData.username}`}
                  className="player-avatar"
                />
                <div className="avatar-overlay">
                  <p className="avatar-name">
                {equippedAvatar?.avatars?.name || 'Lupi'}
              </p>
                </div>
              </div>
              
              {showAvatarSelector && (
        <AvatarSelector
          playerId={playerData.id}
          currentAvatar={equippedAvatar}
          onClose={() => setShowAvatarSelector(false)}
          onAvatarChange={loadEquippedAvatar}
        />
      )}
            </div>
            <div className="info-row">
              <span className="resource-icon">💰</span>
              <span className="resource-value">{lupiCoins}</span>
              <span className="resource-icon">🌟 LVL</span>
              <span className="resource-value">{playerData.level}</span>
            </div>
            <div className="info-row">
              <span className="info-label">Posición:</span>
              <span className="info-value">{playerData.position}</span>
            </div>
            <div className="info-row">
              <span className="info-label">Deporte:</span>
              <span className="info-value">{playerData.sport}</span>
            </div>
            {playerData.clubs && (
              <div className="info-row">
                <span className="info-label">Club:</span>
                <span className="info-value highlight-text">{playerData.clubs.name}</span>
              </div>
            )}
             {/* Dirección de Wallet */}
            <div className="info-row wallet-row">
              <span className="info-label">Wallet:</span>
              <div className="wallet-address" onClick={copyToClipboard}>
                <span className="wallet-text">{playerData.username}.lupi</span>
                <button className="copy-btn" title="Copiar dirección">
                  <Copy size={14} />
                </button>
                {copied && <span className="copy-tooltip">¡Copiado!</span>}
              </div>
            </div>
          </div>
          
          <div className="xp-section">
            <div className="xp-header">
              <span>EXPERIENCIA</span>
              <span>{playerData.experience}/{nextLevelXp}</span>
            </div>
            <div className="xp-bar">
              <div className="xp-progress" style={{ width: `${xpPercentage}%` }}></div>
              <div className="xp-glow"></div>
            </div>
          </div>
        </div>
        {/* Sección central - Habilidades */}
        <div className="skills-card">
          <div className="card-header">
            <h2>ESTADÍSTICAS</h2>
            <div className="header-line"></div>
            <div className="skill-points">
              Puntos disponibles: <span className="points-count">{playerData.skill_points}</span>
            </div>
          </div>
          
          <div className="skills-grid">
            {playerData.skills?.map(skill => {
              const bonusItem = equippedItems[skill.skill_name];
              const bonus = bonusItem ? bonusItem.bonus_value : 0;
              const totalValue = skill.skill_value + bonus;
              
              const skillNamesMap = {
                "Fuerza": "⚽ Potencia",
                "Resistencia": "🏃 Resistencia",
                "Técnica": "🔧 Técnica",
                "Velocidad": "💨 Velocidad",
                "Dribling": "🎯 Regate",
                "Pase": "📨 Pase",
                "Tiro": "🥅 Tiro",
                "Defensa": "🛡️ Defensa",
                "Liderazgo": "👑 Liderazgo",
                "Estrategia": "🧠 Estrategia",
                "Inteligencia": "📈 Inteligencia"
              };
              
              const skillDisplayName = skillNamesMap[skill.skill_name] || skill.skill_name;
              
              return (
                <div key={skill.skill_name} className="skill-item">
                  <div className="skill-info">
                    <span className="skill-name">{skillDisplayName}</span>
                    <span className="skill-value">
                      {totalValue}
                      {bonus > 0 && <span className="skill-bonus">+{bonus}</span>}
                    </span>
                  </div>
                  <button 
                    onClick={() => handleUpgradeSkill(skill.skill_name)} 
                    disabled={loading || playerData.skill_points <= 0} 
                    className="skill-upgrade-btn"
                    title="Mejorar habilidad"
                  >
                    <ChevronUp size={16} />
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Sección derecha - Acciones rápidas */}
        <div className="actions-card">
          <div className="card-header">
            <h2>ACCIÓN RÁPIDA</h2>
            <div className="header-line"></div>
          </div>
          
          <div className="action-buttons">
            <button className="action-btn primary" onClick={handleGainXp} disabled={loading}>
             <span className="nav-icon">⚡</span>
              <span>Entrenar</span>
            </button>
            
            <button className="action-btn secondary" onClick={handleFindItem} disabled={loading}>
              <span className="nav-icon">🔍</span>
              <span>Buscar Objeto</span>
            </button>
          </div>
        </div>
      </div>

      {/* Panel de navegación inferior */}
      <div className="nav-panel">
        <div className="nav-grid">
          <button className="nav-btn" onClick={() => { fetchMarketItems(); setView('market'); }} disabled={loading}>
            <span className="nav-icon">🛒</span>
            <span>Mercado</span>
          </button>
          
          <button className="nav-btn" onClick={() => setView('transfer')} disabled={loading}>
            <span className="nav-icon">➡️</span>
            <span>Transferir</span>
          </button>
          
          <button className="nav-btn" onClick={() => { fetchMissions(); setView('missions'); }} disabled={loading}>
            <span className="nav-icon">⚽</span>
            <span>Misiones</span>
          </button>
          
          <button className="nav-btn" onClick={() => { fetchClubs(); setView('clubs'); }} disabled={loading}>
            <span className="nav-icon">🏟️</span>
            <span>Clubes</span>
          </button>
          
          <button className="nav-btn" onClick={() => { fetchLeaderboard(); setView('leaderboard'); }} disabled={loading}>
            <span className="nav-icon">📊</span>
            <span>Ranking</span>
          </button>
          
          <button className="nav-btn" onClick={() => setView('inventory')} disabled={loading}>
            <span className="nav-icon">🎒</span>
            <span>Inventario</span>
          </button>
          
          <button className="nav-btn" onClick={() => setView('chat')} disabled={loading}>
            <span className="nav-icon">💬</span>
            <span>Chat</span>
          </button>
          
          <button className="nav-btn logout" onClick={handleLogout}>
            <span className="nav-icon">📲</span>
            <span>Salir</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default DashboardView;