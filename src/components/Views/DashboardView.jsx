// src/components/Dashboard/DashboardView.jsx
import { useState, useEffect } from 'react';
import { Copy, ChevronUp } from 'lucide-react';
import MessageDisplay from '../UI/MessageDisplay';
import LoadingScreen from '../UI/LoadingScreen';
import InventoryView from '../Inventory/InventoryView';
import AvatarSelector from '../AvatarSelector/AvatarSelector';
import LupiMiniGame from '../game/LupiMiniGame';
import RewardChest from '../game/RewardChest';
import CommonRoom from '../game/CommonRoom';
import ClubChat from '../Clubs/ClubChat';
import MarketView from '../Views/MarketView';
import "../styles/DashboardView.css";
import { apiService } from '../../services/apiService';

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
  showMessage
}) => {
  if (!playerData) return <LoadingScreen />;

  const [copied, setCopied] = useState(false);
  const [equippedAvatar, setEquippedAvatar] = useState(null);
  const [showAvatarSelector, setShowAvatarSelector] = useState(false);
  const [inventory, setInventory] = useState([]);
  const [marketItems, setMarketItems] = useState([]);
  const [activeGame, setActiveGame] = useState(false);
  const [reward, setReward] = useState(null);
  const [gameLoading, setGameLoading] = useState(false);
  const [showCommonRoom, setShowCommonRoom] = useState(false);

  const nextLevelXp = playerData.level * 100;
  const xpPercentage = (playerData.experience / nextLevelXp) * 100;

  // === Cargar inventario
  const loadInventory = async () => {
    try {
      const data = await apiService.getInventory(playerData.id);
      setInventory(data || []);
    } catch (err) {
      console.error("Error cargando inventario:", err);
      showMessage("Error al cargar el inventario");
    }
  };

  useEffect(() => {
    loadInventory();
  }, [playerData]);

  // === Cargar avatar equipado
  const loadEquippedAvatar = async () => {
    try {
      const avatar = await apiService.getAvatars(playerData.id);
      if (avatar?.length) setEquippedAvatar(avatar.find(a => a.is_equipped) || avatar[0]);
    } catch (err) {
      console.error("Error cargando avatar:", err);
    }
  };

  useEffect(() => {
    loadEquippedAvatar();
  }, [playerData]);

  // === Cargar items del mercado
  const loadMarketItems = async () => {
    try {
      const { data, error } = await supabaseClient
        .from('market_listings')
        .select(`
          *,
          player_items:player_items!inner(items(*)),
          players(*)
        `);
      if (error) throw error;
      setMarketItems(data || []);
    } catch (err) {
      console.error("Error cargando mercado:", err);
      showMessage("Error al cargar el mercado");
    }
  };

  useEffect(() => {
    loadMarketItems();
  }, []);

  // === Funciones de acción sobre inventario
  const handleDropItem = async (itemId) => {
    try {
      const res = await supabaseClient
        .from('player_items')
        .delete()
        .eq('id', itemId);
      if (res.error) throw res.error;
      showMessage("Ítem eliminado del inventario");
      loadInventory();
    } catch (err) {
      console.error(err);
      showMessage("Error al eliminar el ítem");
    }
  };

  const toggleEquipItem = async (item) => {
    try {
      const res = await apiService.equipItem(item.id, !item.is_equipped);
      if (res.success) {
        showMessage(item.is_equipped ? "Ítem desequipado" : "Ítem equipado");
        loadInventory();
      } else {
        showMessage("Error al equipar/desequipar ítem");
      }
    } catch (err) {
      console.error(err);
      showMessage("Error al comunicar con el servidor");
    }
  };

  // === Copiar wallet
  const copyToClipboard = () => {
    navigator.clipboard.writeText(`${playerData.username}.lupi`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // === Manejar minijuego y recompensas
  const handleFindItem = () => setActiveGame(true);

  const handleGameFinish = async (gameReward) => {
    setGameLoading(true);
    try {
      const { data: allItems } = await supabaseClient.from("items").select("*");
      if (!allItems?.length) {
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
        supabaseClient.from("player_items").insert([{ player_id: session.user.id, item_id: item.id }]).select("*, items(*)").single()
      );

      const results = await Promise.all(insertPromises);
      const errors = results.filter(r => r.error);
      if (errors.length) throw new Error(`Error al guardar ${errors.length} objetos`);

      setInventory(prev => [...prev, ...results.map(r => r.data)]);
      setReward(randomItems);
      showMessage(`¡Has encontrado ${randomItems.length} objetos!`);
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
      <div className="game-header">
        <h1>LUPI SPORTS RPG</h1>
        <div className="title-underline"></div>
      </div>

      <MessageDisplay message={message} />

      <div className="dashboard-content">
        {/* Ficha del jugador */}
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
              <div className="avatar-container" onClick={() => setShowAvatarSelector(true)}>
                <img src={equippedAvatar?.image_url || '/default-avatar.png'} alt="Avatar" className="player-avatar"/>
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

            <div className="info-row wallet-row">
              <span className="info-label">Wallet:</span>
              <div className="wallet-address" onClick={copyToClipboard}>
                <span className="wallet-text">{playerData.username}.lupi</span>
                <button className="copy-btn" title="Copiar">
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

        {/* Inventario */}
        <InventoryView
          inventory={inventory}
          setInventory={setInventory}
          showMessage={showMessage}
          loadInventory={loadInventory}
          setView={setView}
          loading={loading}
          handleDropItem={handleDropItem}
        />

        {/* Acción rápida */}
        <div className="actions-card">
          <button className="action-btn primary" onClick={handleGainXp} disabled={loading}>Entrenar ⚡</button>
          <button className="action-btn secondary" onClick={handleFindItem} disabled={loading}>Buscar Objeto 🔍</button>
          <button className="action-btn primary" onClick={() => setView('sports_mmorpg')} disabled={loading}>MMORPG Deportivo 🏆</button>
          <button className="action-btn secondary" onClick={() => setShowCommonRoom(true)}>SALA COMÚN 🏠</button>
        </div>

        {/* Club */}
        {playerData.clubs && (
          <section className="club-section">
            <h2>{playerData.clubs.name}</h2>
            <ClubChat playerData={playerData} supabaseClient={supabaseClient} session={session} />
          </section>
        )}

        {/* Mercado */}
        <MarketView
          marketItems={marketItems}
          handleBuyItem={(listing) => console.log("Comprar item:", listing)}
          playerData={playerData}
          loading={loading}
          message={message}
          setView={setView}
        />
      </div>

      {/* Minijuego */}
      {activeGame && <LupiMiniGame onFinish={handleGameFinish} onCancel={() => setActiveGame(false)} />}
      {reward && <RewardChest items={reward} onClose={() => setReward(null)} />}
      {showCommonRoom && <CommonRoom currentUser={playerData} onClose={() => setShowCommonRoom(false)} supabaseClient={supabaseClient} />}
      {gameLoading && <LoadingScreen message="Guardando tus objetos..." />}
    </div>
  );
};

export default DashboardView;
