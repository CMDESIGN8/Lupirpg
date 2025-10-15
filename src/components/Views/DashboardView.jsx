import { Wallet, Zap, ShoppingCart, CornerUpRight, Compass, CheckCircle, Shield, Users, MessageCircle, LogOut, ChevronUp, Copy } from 'lucide-react';
import MessageDisplay from '../UI/MessageDisplay.jsx';
import LoadingScreen from '../UI/LoadingScreen.jsx';
import { useState, useEffect } from 'react';
import { avatarService } from '../../services/avatarService';
import AvatarSelector from '../AvatarSelector/AvatarSelector';
import LupiMiniGame from '../game/LupiMiniGame.jsx';
import RewardChest from '../game/RewardChest.jsx';
import CommonRoom from '../game/CommonRoom.jsx';
import ClubChat from '../Clubs/ClubChat.jsx';
import MarketView from '../Views/MarketView.jsx';
import "../styles/DashboardView.css";
import CommonRoomModal from "./CommonRoomModal";

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
  showMessage,
  inventory
}) => {
  if (!playerData) return <LoadingScreen />;

  const [copied, setCopied] = useState(false);
  const [equippedAvatar, setEquippedAvatar] = useState(null);
  const [showAvatarSelector, setShowAvatarSelector] = useState(false);
  const [activeGame, setActiveGame] = useState(false);
  const [reward, setReward] = useState(null);
  const [gameLoading, setGameLoading] = useState(false);
  const [showCommonRoom, setShowCommonRoom] = useState(false);

  const nextLevelXp = playerData.level * 100;
  const xpPercentage = (playerData.experience / nextLevelXp) * 100;

  // Datos para el gráfico radar
  const radarStats = [
    { name: "Fuerza", value: playerData.skills?.find(s => s.skill_name === "Fuerza")?.skill_value || 0 },
    { name: "Velocidad", value: playerData.skills?.find(s => s.skill_name === "Velocidad")?.skill_value || 0 },
    { name: "Técnica", value: playerData.skills?.find(s => s.skill_name === "Técnica")?.skill_value || 0 },
    { name: "Resistencia", value: playerData.skills?.find(s => s.skill_name === "Resistencia")?.skill_value || 0 },
    { name: "Tiro", value: playerData.skills?.find(s => s.skill_name === "Tiro")?.skill_value || 0 },
    { name: "Defensa", value: playerData.skills?.find(s => s.skill_name === "Defensa")?.skill_value || 0 }
  ];

  const maxStatValue = 100;

  // Función para calcular posición en el radar
  const calculateRadarPoint = (stat, index, totalStats) => {
    const angle = (2 * Math.PI * index) / totalStats - Math.PI / 2;
    const radius = (stat.value / maxStatValue) * 90;
    const x = 100 + radius * Math.cos(angle);
    const y = 100 + radius * Math.sin(angle);
    return { x, y };
  };

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

  const [marketItems, setMarketItems] = useState([]);
  useEffect(() => {
    loadMarketItems();
    loadEquippedAvatar();
  }, []);

  const loadMarketItems = async () => {
    try {
      const { data, error } = await supabaseClient
        .from('market_listings')
        .select(`
          *,
          player_items:player_items!inner(
            items(*)
          ),
          players(*)
        `);
      
      if (error) throw error;
      
      console.log('Market items data:', data);
      setMarketItems(data || []);
    } catch (error) {
      console.error('Error fetching market items:', error);
      showMessage('Error al cargar el mercado');
    }
  };

  const handleBuyItem = async (listing) => {
    try {
      const { error: deleteError } = await supabaseClient
        .from('market_listings')
        .delete()
        .eq('id', listing.id);
      
      if (deleteError) throw deleteError;

      const { error: updateError } = await supabaseClient
        .from('player_items')
        .update({ player_id: session.user.id })
        .eq('id', listing.player_items.id);
      
      if (updateError) throw updateError;

      const { error: coinsError } = await supabaseClient
        .from('players')
        .update({ lupi_coins: playerData.lupi_coins - listing.price })
        .eq('id', session.user.id);
      
      if (coinsError) throw coinsError;

      const { error: sellerError } = await supabaseClient
        .from('players')
        .update({ lupi_coins: listing.players.lupi_coins + listing.price })
        .eq('id', listing.seller_id);
      
      if (sellerError) throw sellerError;

      setMarketItems(prev => prev.filter(item => item.id !== listing.id));
      setInventory(prev => [...prev, listing.player_items]);
      
      showMessage('¡Compra exitosa!');
    } catch (error) {
      console.error('Error buying item:', error);
      showMessage('Error al realizar la compra');
    }
  };

  const handleAvatarClick = () => setShowAvatarSelector(true);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(`${playerData.username}.lupi`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleFindItem = () => {
    setActiveGame(true);
  };

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

      const randomItems = [];
      const itemsCopy = [...allItems];
      
      const itemsToGet = gameReward?.items?.length || 3;
      
      for (let i = 0; i < itemsToGet && itemsCopy.length > 0; i++) {
        const randomIndex = Math.floor(Math.random() * itemsCopy.length);
        randomItems.push(itemsCopy[randomIndex]);
        itemsCopy.splice(randomIndex, 1);
      }

      const insertPromises = randomItems.map(item => 
        supabaseClient
          .from("player_items")
          .insert([{ player_id: session.user.id, item_id: item.id }])
          .select("*, items(*)")
          .single()
      );

      const results = await Promise.all(insertPromises);
      
      const errors = results.filter(result => result.error);
      if (errors.length > 0) {
        throw new Error(`Error al guardar ${errors.length} objetos`);
      }

      const newItems = results.map(result => result.data);
      setInventory(prev => [...prev, ...newItems]);

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

      {/* Header */}
      <div className="game-header">
        <div className="game-title">
          <h1>LUPI SPORTS RPG</h1>
          <div className="title-underline"></div>
        </div>
        <div className="player-resources">
          <div className="resource-chip">
            <span className="resource-icon">💰</span>
            <span className="resource-value">{lupiCoins} LUPI</span>
          </div>
          <div className="resource-chip">
            <span className="resource-icon">🌟</span>
            <span className="resource-value">Nvl {playerData.level}</span>
          </div>
        </div>
      </div>

      <MessageDisplay message={message} />

      <div className="dashboard-content">
        {/* Columna izquierda - Ficha del personaje */}
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

        {/* Columna derecha - Inventario y Estadísticas */}
        <div className="dashboard-right-column">
          {/* Inventario */}
          <div className="inventory-card">
            <div className="card-header">
              <h2>INVENTARIO</h2>
              <div className="header-line"></div>
            </div>
            
            <div className="inventory-grid">
              {inventory && inventory.length > 0 ? (
                inventory.map((item, index) => (
                  <div key={index} className="inventory-item">
                    <div className="item-icon">🎯</div>
                    <div className="item-name">{item.items?.name || 'Item'}</div>
                    {item.items?.bonus_value && (
                      <div className="item-bonus">+{item.items.bonus_value}</div>
                    )}
                  </div>
                ))
              ) : (
                <div className="no-items">No hay items en el inventario</div>
              )}
            </div>

            {/* Acciones rápidas debajo del inventario */}
            <div className="quick-actions-panel">
              <button className="quick-action-btn" onClick={handleGainXp}>
                <span className="quick-action-icon">⚡</span>
                <span className="quick-action-label">Entrenar</span>
              </button>
              <button className="quick-action-btn" onClick={handleFindItem}>
                <span className="quick-action-icon">🔍</span>
                <span className="quick-action-label">Buscar</span>
              </button>
              <button className="quick-action-btn" onClick={() => { fetchMissions(); setView('missions'); }}>
                <span className="quick-action-icon">⚽</span>
                <span className="quick-action-label">Misiones</span>
              </button>
              <button className="quick-action-btn" onClick={() => setShowCommonRoom(true)}>
                <span className="quick-action-icon">🏠</span>
                <span className="quick-action-label">Sala Común</span>
              </button>
              <button className="quick-action-btn" onClick={() => setView('transfer')}>
                <span className="quick-action-icon">➡️</span>
                <span className="quick-action-label">Transferir</span>
              </button>
            </div>
          </div>

          {/* Estadísticas en 2 columnas */}
          <div className="stats-container">
            {/* Columna izquierda - Lista de estadísticas */}
            <div className="stats-column">
              <div className="card-header">
                <h2>ESTADÍSTICAS</h2>
                <div className="header-line"></div>
                <div className="skill-points">
                  Puntos disponibles: <span className="points-count">{playerData.skill_points}</span>
                </div>
              </div>
              
              <div className="stats-list">
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
                    <div key={skill.skill_name} className="stat-item">
                      <span className="stat-name">{skillDisplayName}</span>
                      <div>
                        <span className="stat-value">
                          {totalValue} 
                          {bonus > 0 && <span className="stat-bonus">+{bonus}</span>}
                        </span>
                        <button 
                          onClick={() => handleUpgradeSkill(skill.skill_name)} 
                          disabled={loading || playerData.skill_points <= 0} 
                          className="skill-upgrade-btn" 
                          title="Mejorar habilidad"
                        >
                          <ChevronUp size={14} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Columna derecha - Gráfico FIFA */}
            <div className="stats-column">
              <div className="card-header">
                <h2>PERFIL DE JUGADOR</h2>
                <div className="header-line"></div>
              </div>
              
              <div className="fifa-radar-chart">
                <div className="radar-container">
                  {/* Grid del radar */}
                  <div className="radar-grid"></div>
                  <div className="radar-grid"></div>
                  <div className="radar-grid"></div>
                  
                  {/* Ejes */}
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="radar-axis"></div>
                  ))}
                  
                  {/* Polígono del radar */}
                  <svg viewBox="0 0 200 200" className="radar-polygon">
                    <polygon points={radarStats.map((stat, i) => {
                      const point = calculateRadarPoint(stat, i, radarStats.length);
                      return `${point.x},${point.y}`;
                    }).join(' ')} />
                  </svg>
                  
                  {/* Puntos del radar */}
                  {radarStats.map((stat, i) => {
                    const point = calculateRadarPoint(stat, i, radarStats.length);
                    return (
                      <div 
                        key={i}
                        className="radar-point"
                        style={{ left: `${point.x}%`, top: `${point.y}%` }}
                      ></div>
                    );
                  })}
                </div>
                
                {/* Leyenda */}
                <div className="radar-legend">
                  {radarStats.map((stat, i) => (
                    <div key={i} className="legend-item">
                      <span className="legend-dot"></span>
                      <span className="legend-name">{stat.name}: {stat.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Nueva sección: Club */}
      {playerData.clubs && (
        <section className="club-section">
          <h2 className="club-title">TU CLUB</h2>
          <div className="header-line"></div>
          <p className="club-description">
            Aquí representas a tu club de barrio. El éxito en los partidos depende de la colaboración de todos los miembros. 
            Participa en los desafíos cooperativos durante los encuentros para darle a tu equipo la ventaja necesaria para ganar.
            ¡Comunícate con tus compañeros a través del chat del club!
          </p>
          
          <div className="club-container">
            {/* Chat del Club */}
            <ClubChat 
              playerData={playerData} 
              supabaseClient={supabaseClient}
              session={session}
            />
            
            {/* Próximo Partido y Desafíos */}
            <div className="player-card">
              <h3 className="match-title">
                Próximo Partido: {playerData.clubs.name} vs Rival FC
              </h3>
              
              <p className="match-description">
                ¡La colaboración es clave! Completa estos desafíos con tu club.
              </p>
              
              <div className="challenges-container">
                <div className="challenge-item">
                  <div className="challenge-name">Realizar 250 pases de club</div>
                  <div className="challenge-progress">
                    <span>0/250</span>
                  </div>
                  <div className="progress-bar">
                    <div className="progress-fill" style={{ width: "0%" }}></div>
                  </div>
                  <button className="contribute-btn">Contribuir +10</button>
                </div>
                
                <div className="challenge-item">
                  <div className="challenge-name">Correr 100km acumulados</div>
                  <div className="challenge-progress">
                    <span>0/100</span>
                  </div>
                  <div className="progress-bar">
                    <div className="progress-fill" style={{ width: "0%" }}></div>
                  </div>
                  <button className="contribute-btn">Contribuir +5</button>
                </div>

                <div className="challenge-item">
                  <div className="challenge-name">Lograr 50 recuperaciones</div>
                  <div className="challenge-progress">
                    <span>0/50</span>
                  </div>
                  <div className="progress-bar">
                    <div className="progress-fill" style={{ width: "0%" }}></div>
                  </div>
                  <button className="contribute-btn">Contribuir +2</button>
                </div>
              </div>
            </div>
          </div>
          <div className="salacomun">
            <button className="action-btn secondary" onClick={() => setShowCommonRoom(true)} disabled={loading}>
              <span className="nav-icon">🏠</span>
              <span>SALA COMUN</span>
            </button>
          </div>
        </section>
      )}

      {/* Market Section */}
      <section className="Market-section">
        <div className="Market-line"></div>
        <MarketView 
          marketItems={marketItems}
          handleBuyItem={handleBuyItem}
          playerData={playerData} 
          loading={loading} 
          message={message} 
          setView={setView}
        />
      </section>

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

      {/* Minijuego */}
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

      {/* Common Room */}
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
