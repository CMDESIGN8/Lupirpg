import { Zap, ShoppingCart, CornerUpRight, Compass, CheckCircle, Shield, Users, MessageCircle, LogOut, ChevronUp, Copy } from 'lucide-react';
import MessageDisplay from '../UI/MessageDisplay.jsx';
import LoadingScreen from '../UI/LoadingScreen.jsx';
import { useState, useEffect } from 'react';
import { avatarService } from '../../services/avatarService';
import AvatarSelector from '../AvatarSelector/AvatarSelector';
import LupiMiniGame from '../game/LupiMiniGame.jsx';
import RewardChest from '../game/RewardChest.jsx';
import CommonRoom from '../game/CommonRoom.jsx';
import "../styles/DashboardView.css";


const DashboardView = ({ 
  playerData, 
  lupiCoins, 
  equippedItems, 
  handleUpgradeSkill, 
  handleGainXp, 
  setView, 
  fetchMissions, 
  fetchClubs, 
  fetchLeaderboard, 
  fetchMarketItems, 
  loading, 
  handleLogout, 
  message,
  supabaseClient,
  session,
  setInventory,
  showMessage
}) => {
  if (!playerData) return <LoadingScreen />;

  const [copied, setCopied] = useState(false);
  const [equippedAvatar, setEquippedAvatar] = useState(null);
  const [showAvatarSelector, setShowAvatarSelector] = useState(false);
  const [activeGame, setActiveGame] = useState(false);
  const [reward, setReward] = useState(null);
  const [gameLoading, setGameLoading] = useState(false);
  
  const nextLevelXp = playerData.level * 100;
  const xpPercentage = (playerData.experience / nextLevelXp) * 100;
  const [showCommonRoom, setShowCommonRoom] = useState(false);

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

  const handleAvatarClick = () => setShowAvatarSelector(true);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(`${playerData.username}.lupi`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Función que abre el minijuego
  const handleFindItem = () => {
    setActiveGame(true);
  };

  // Función que se ejecuta cuando el jugador gana el minijuego
 const handleGameFinish = async (gameReward) => {
  setGameLoading(true);
  try {
    const { data: allItems, error: itemsError } = await supabaseClient
      .from("items")
      .select("*");

    if (itemsError) throw itemsError;
    if (!allItems || allItems.length === 0) {
      showMessage("No hay objetos disponibles para encontrar.");
      return;
    }

    // Seleccionar objetos aleatorios basados en la recompensa del juego
    const randomItems = [];
    const itemsCopy = [...allItems];
    
    // Usar la recompensa del juego para determinar cuántos objetos dar
    const itemsToGet = gameReward?.items?.length || 3;
    
    for (let i = 0; i < itemsToGet && itemsCopy.length > 0; i++) {
      const randomIndex = Math.floor(Math.random() * itemsCopy.length);
      randomItems.push(itemsCopy[randomIndex]);
      itemsCopy.splice(randomIndex, 1);
    }

    // Guardar los objetos en el inventario del jugador
    const insertPromises = randomItems.map(item => 
      supabaseClient
        .from("player_items")
        .insert([{ player_id: session.user.id, item_id: item.id }])
        .select("*, items(*)")
        .single()
    );

    const results = await Promise.all(insertPromises);
    
    // Verificar errores
    const errors = results.filter(result => result.error);
    if (errors.length > 0) {
      throw new Error(`Error al guardar ${errors.length} objetos`);
    }

    // Actualizar inventario local
    const newItems = results.map(result => result.data);
    setInventory(prev => [...prev, ...newItems]);

    // Mostrar cofre con los items después de un breve delay para la animación
    setTimeout(() => {
      setReward(randomItems);
      showMessage(`¡Has encontrado ${randomItems.length} objetos!`);
    }, 500);
    
  } catch (err) {
    console.error(err);
    showMessage(err.message || "Error al abrir el cofre.");
  } finally {
    setGameLoading(false);
    setActiveGame(false);
  }
};

  return (
    <div className="game-dashboard">
      {/* Header */}
      <div className="game-header">
        <div className="game-title">
          <h1>LUPI SPORTS RPG</h1>
          <div className="title-underline"></div>
        </div>
      </div>

      <MessageDisplay message={message} />

      <div className="dashboard-content">
        {/* Partículas globales */}
  <div className="particles">
    {[...Array(40)].map((_, i) => (
      <div
        key={i}
        className="particle"
        style={{
          left: `${Math.random() * 100}%`,
          animationDelay: `${Math.random() * 3}s`,
          animationDuration: `${3 + Math.random() * 4}s`
        }}
      />
    ))}
  </div>
        {/* Izquierda - Ficha del jugador */}
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
            
            <div className="avatar-section">
              <div className="avatar-container" onClick={handleAvatarClick}>
                <img 
                  src={equippedAvatar?.avatars?.image_url || '/default-avatar.png'} 
                  alt={`Avatar de ${playerData.username}`} 
                  className="player-avatar" 
                />
                <div className="avatar-overlay">
                  <p className="avatar-name">{equippedAvatar?.avatars?.name || 'Lupi'}</p>
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

        {/* Centro - Habilidades */}
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
                      {totalValue} {bonus > 0 && <span className="skill-bonus">+{bonus}</span>}
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

        {/* Derecha - Acciones rápidas */}
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
            
            <button className="action-btn secondary" onClick={() => { 
              fetchMissions(); 
              setView('missions'); 
            }} disabled={loading}>
              <span className="nav-icon">⚽</span>
              <span>Misiones</span>
            </button>

           <button className="action-btn secondary" onClick={() => setShowCommonRoom(true)} disabled={loading}>
  <span className="nav-icon">🏠</span>
  <span>SALA COMUN</span>
</button>
          </div>
        </div>
      </div>

  {/* Nueva sección: Club */}
       {playerData.clubs && (
  <div className="club-card">
    <div className="card-header">
      <h2>TU CLUB</h2>
      <div className="header-line"></div>
    </div>
    
    <div className="club-info">
      <div className="club-banner">
        <h3 className="club-name">{playerData.clubs.name}</h3>
        <div className="club-level">Nivel de Club: {playerData.clubs.level || 8}</div>
      </div>
      
      <div className="club-description">
        <p>Aquí representas a tu club de barrio. El éxito en los partidos depende de la colaboración de todos los miembros. Participa en los desafíos cooperativos durante los encuentros para darle a tu equipo la ventaja necesaria para ganar.</p>
      </div>
      
      <div className="club-members">
        <h4>Miembros Conectados: {playerData.clubs.member_count || 12}</h4>
        <div className="members-list">
          <div className="member-item">
            <span className="member-name">1. {playerData.username} (Tú)</span>
          </div>
          <div className="member-item">
            <span className="member-name">2. Pérez</span>
          </div>
          <div className="member-item">
            <span className="member-name">3. González</span>
          </div>
          <div className="member-item">
            <span className="member-name">4. Rodríguez</span>
          </div>
          <div className="member-item">
            <span className="member-name">5. Fernandez</span>
          </div>
        </div>
      </div>
      
      <div className="next-match">
        <h4>Próximo Partido: {playerData.clubs.name} vs Rivales FC</h4>
        <p>¡La colaboración es clave! Completa estos desafíos con tu club durante el partido.</p>
        
        <div className="challenges-table">
          <div className="challenge-row">
  <div className="challenge-info">
    <span className="challenge-name">Realizar 250 pases de club</span>
    <span className="challenge-progress">112/250</span>
  </div>
  <div className="challenge-progress-bar">
    <div className="challenge-progress-fill" style={{ width: "45%" }}></div>
  </div>
  <button className="contribute-btn">Contribuir +10</button>
</div>
          
          <div className="challenge-row">
            <div className="challenge-info">
              <span className="challenge-name">Correr 100km acumulados</span>
              <span className="challenge-progress">45/100</span>
            </div>
            <button className="contribute-btn">Contribuir +5</button>
          </div>
          
          <div className="challenge-row">
            <div className="challenge-info">
              <span className="challenge-name">Lograr 50 recuperaciones</span>
              <span className="challenge-progress">15/50</span>
            </div>
            <button className="contribute-btn">Contribuir +2</button>
          </div>
        </div>
      </div>
    </div>
  </div>
)}    
    
     {/* Panel de navegación inferior */}
      <div className="nav-panel">
        <div className="nav-grid">
          <button className="nav-btn" onClick={() => { 
            fetchMarketItems(); 
            setView('market'); 
          }} disabled={loading}>
            <span className="nav-icon">🛒</span>
            <span>Mercado</span>
          </button>
          
          <button className="nav-btn" onClick={() => setView('transfer')} disabled={loading}>
            <span className="nav-icon">➡️</span>
            <span>Transferir</span>
          </button>
          
          <button className="nav-btn" onClick={() => { 
            fetchMissions(); 
            setView('missions'); 
          }} disabled={loading}>
            <span className="nav-icon">⚽</span>
            <span>Misiones</span>
          </button>
          
          <button className="nav-btn" onClick={() => { 
            fetchClubs(); 
            setView('clubs'); 
          }} disabled={loading}>
            <span className="nav-icon">🏟️</span>
            <span>Clubes</span>
          </button>
          
          <button className="nav-btn" onClick={() => { 
            fetchLeaderboard(); 
            setView('leaderboard'); 
          }} disabled={loading}>
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

      {/* Minijuego - MODAL CORREGIDO */}
      {activeGame && (
  <div className="game-modal-overlay">
    <LupiMiniGame 
      onFinish={handleGameFinish} 
      onCancel={() => setActiveGame(false)} 
    />
  </div>
)}

      {/* Cofre de recompensas */}
      {reward && Array.isArray(reward) && (
  <div className="modal-overlay">
    <div className="modal-content">
      <RewardChest 
        items={reward} 
        onClose={() => {
          setReward(null);
        }}
      />
    </div>
  </div>
)}
{showCommonRoom && (
  <CommonRoom 
    currentUser={playerData} 
    onClose={() => setShowCommonRoom(false)}
    supabaseClient={supabaseClient}
  />
)}
      {/* Loading durante el juego */}
      {gameLoading && (
        <div className="modal-overlay">
          <div className="modal-content">
            <LoadingScreen message="Guardando tus objetos..." />
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardView;