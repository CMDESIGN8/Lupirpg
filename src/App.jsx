// Cambia todas las importaciones de .js a .jsx
import AuthView from './components/Views/AuthView.jsx';
import CreateCharacterView from './components/Views/CreateCharacterView.jsx';
import DashboardView from './components/Views/DashboardView.jsx';
import LeaderboardView from './components/Views/LeaderboardView.jsx';
import InventoryView from './components/Views/InventoryView.jsx';
import MissionsView from './components/Views/MissionsView.jsx';
import TransferView from './components/Views/TransferView.jsx';
import MarketView from './components/Views/MarketView.jsx';
import SellItemView from './components/Views/SellItemView.jsx';
import ChatView from './components/Views/ChatView.jsx';
import ClubsView from './components/Views/ClubsView.jsx';
import CreateClubView from './components/Views/CreateClubView.jsx';
import ClubDetailsView from './components/Views/ClubDetailsView.jsx';
import LoadingScreen from './components/UI/LoadingScreen.jsx';
import React, { useState, useEffect, useRef } from 'react'; // Importación completa
import { positions, sports, skillNames, initialSkillPoints } from './constants'; // ¡Esta línea es crucial!
import { supabaseClient } from './services/supabase'; // Importación correcta
import LupiMiniGame from "./components/game/LupiMiniGame";
import RewardChest from "./components/game/RewardChest";

const App = () => {
  const [session, setSession] = useState(null);
  const [view, setView] = useState('auth');
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [sport, setSport] = useState(sports[0]);
  const [position, setPosition] = useState(positions[0]);
  const [availablePoints, setAvailablePoints] = useState(initialSkillPoints);
  const [skills, setSkills] = useState(skillNames.reduce((acc, skill) => ({ ...acc, [skill]: 50 }), {}));
  const [message, setMessage] = useState('');
  const [isSupabaseReady, setIsSupabaseReady] = useState(false);
  const [playerData, setPlayerData] = useState(null);
  const [leaderboardData, setLeaderboardData] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [equippedItems, setEquippedItems] = useState({});
  const [missionsData, setMissionsData] = useState([]);
  const [lupiCoins, setLupiCoins] = useState(0);
  const [recipientAddress, setRecipientAddress] = useState('');
  const [transferAmount, setTransferAmount] = useState('');
  const [marketItems, setMarketItems] = useState([]);
  const [itemToSell, setItemToSell] = useState(null);
  const [sellPrice, setSellPrice] = useState('');
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef(null);
  const [clubs, setClubs] = useState([]);
  const [currentClub, setCurrentClub] = useState(null);
  const [clubMembers, setClubMembers] = useState([]);
  const [newClubName, setNewClubName] = useState('');
  const [newClubDescription, setNewClubDescription] = useState('');
  const [activeGame, setActiveGame] = useState(false);
  const [reward, setReward] = useState(null);

   // 1) función que abre el minijuego (esta la pasás a Dashboardview)
  const openFindItemGame = () => {
    setActiveGame(true);
  };

  // 2) función que se ejecuta cuando el jugador gana el minijuego
  const handleGameFinish = async () => {
    // cerrar el juego visualmente (se cierra igual en finally)
    setLoading(true);
    try {
      const { data: allItems, error: itemsError } = await supabaseClient
        .from("items")
        .select("*");

      if (itemsError) throw itemsError;
      if (!allItems || allItems.length === 0) {
        showMessage("No hay objetos disponibles para encontrar.");
        return;
      }

      const randomItem = allItems[Math.floor(Math.random() * allItems.length)];

      const { data, error } = await supabaseClient
        .from("player_items")
        .insert([{ player_id: session.user.id, item_id: randomItem.id }])
        .select("*, items(*)")
        .single();

      if (error) throw error;

      // actualizar inventario local
      setInventory(prev => [...prev, data]);

      // mostrar cofre con el item (puedes pasar el item simple o el objeto retornado)
      setReward(randomItem);

      showMessage(`¡Has encontrado: ${randomItem.name}!`);
    } catch (err) {
      console.error(err);
      showMessage(err.message || "Error al abrir el cofre.");
    } finally {
      setLoading(false);
      setActiveGame(false);
    }
  };

  const showMessage = (text) => {
    setMessage(text);
    setTimeout(() => setMessage(''), 3000);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    setIsSupabaseReady(true);
    
    const getSession = async () => {
      const { data: { session } } = await supabaseClient.auth.getSession();
      setSession(session);
      if (session) {
        await checkProfile(session.user.id);
      } else {
        setView('auth');
        setLoading(false);
      }
    };
    
    getSession();
    
    const { data: { subscription } } = supabaseClient.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) {
        checkProfile(session.user.id);
      } else {
        setView('auth');
        setLoading(false);
      }
    });
    
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (view !== 'chat' || !supabaseClient) return;
    
    const fetchMessages = async () => {
      setLoading(true);
      const { data, error } = await supabaseClient
        .from('messages')
        .select(`id, content, created_at, players (username)`)
        .order('created_at', { ascending: true })
        .limit(50);
      
      if (error) showMessage(error.message);
      else { 
        setMessages(data || []); 
        scrollToBottom(); 
      }
      setLoading(false);
    };
    
    fetchMessages();
    
    const subscription = supabaseClient
      .channel('public:messages')
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'messages' 
      }, payload => {
        const newMessage = { 
          ...payload.new, 
          players: { username: playerData?.username || 'Usuario' } 
        };
        setMessages(prevMessages => [...prevMessages, newMessage]);
        scrollToBottom();
      })
      .subscribe();
    
    return () => { 
      supabaseClient.removeChannel(subscription); 
    };
  }, [view, playerData]);

  const checkProfile = async (userId) => {
    setLoading(true);
    try {
      const { data: player, error: playerError } = await supabaseClient
        .from('players')
        .select('*, clubs(id, name, description)')
        .eq('id', userId)
        .single();

      if (playerError && playerError.code === "PGRST116") {
        setView('create_character');
        setLoading(false);
        return;
      }
      if (playerError) throw playerError;

      const { data: skills, error: skillsError } = await supabaseClient
        .from('player_skills')
        .select('*')
        .eq('player_id', userId);

      if (skillsError) throw skillsError;

      const { data: playerItems, error: itemsError } = await supabaseClient
        .from('player_items')
        .select('*, items(*)')
        .eq('player_id', userId);

      if (itemsError) throw itemsError;

      const equipped = {};
      (playerItems || []).forEach(item => {
        if (item.is_equipped) {
          equipped[item.items.skill_bonus] = item.items;
        }
      });
      setInventory(playerItems || []);
      setEquippedItems(equipped);

      setSkills((skills || []).reduce((acc, skill) => ({ ...acc, [skill.skill_name]: skill.skill_value }), {}));
      setAvailablePoints(player.skill_points);
      setLupiCoins(player.lupi_coins);
      setPlayerData({ ...player, skills: skills || [] });
      setCurrentClub(player.clubs);
      setView('dashboard');
    } catch (err) {
      showMessage(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchLeaderboard = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabaseClient
        .from('players')
        .select('username, level, experience')
        .order('level', { ascending: false })
        .order('experience', { ascending: false })
        .limit(10);
      
      if (error) throw error;
      setLeaderboardData(data);
    } catch (err) {
      showMessage(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchMissions = async () => {
    setLoading(true);
    try {
      const { data: missions, error: missionsError } = await supabaseClient
        .from('missions')
        .select('*');
      
      if (missionsError) throw missionsError;
      
      const { data: completedMissions, error: completedError } = await supabaseClient
        .from('player_missions')
        .select('mission_id')
        .eq('player_id', session.user.id);
      
      if (completedError) throw completedError;
      
      const completedIds = new Set(completedMissions.map(m => m.mission_id));
      const mergedMissions = missions.map(mission => ({ 
        ...mission, 
        is_completed: completedIds.has(mission.id) 
      }));
      
      setMissionsData(mergedMissions);
      showMessage('Misiones cargadas.');
    } catch (err) {
      showMessage(err.message);
    } finally {
      setLoading(false);
    }
  };

  const completeMission = async (mission) => {
  try {
    // 1. Registrar misión completada
    const { error: upsertError } = await supabaseClient
      .from('player_missions')
      .upsert(
        { 
          player_id: session.user.id, 
          mission_id: mission.id,
          progress: mission.goal_value || 1,
          completed_at: new Date().toISOString()
        },
        { onConflict: 'player_id,mission_id' }
      );
    
    if (upsertError) throw upsertError;

    // 2. Actualizar jugador (XP, skills, coins)
    const updateData = {
      experience: playerData.experience + mission.xp_reward, 
      skill_points: playerData.skill_points + mission.skill_points_reward,
      lupi_coins: playerData.lupi_coins + (mission.lupicoins_reward || 0)
    };

    const { data: updatedPlayer, error: updateError } = await supabaseClient
      .from('players')
      .update(updateData)
      .eq('id', session.user.id)
      .select();
    
    if (updateError) throw updateError;

    // 3. Actualizar contador diario (SI ES MISIÓN DIARIA)
    let newDailyCount = playerData.daily_missions_completed || 0;
    
    if (mission.reset_interval === 'daily') {
      // Actualizar campo simple en players (backup)
      const { error: dailyError } = await supabaseClient
        .from('players')
        .update({ 
          daily_missions_completed: (playerData.daily_missions_completed || 0) + 1 
        })
        .eq('id', session.user.id);
      
      if (dailyError) console.warn('Error updating daily count:', dailyError);
      
      // Actualizar tabla de tracking diario (sistema principal)
      const today = new Date().toISOString().split('T')[0];
      const { error: progressError } = await supabaseClient
        .from('player_daily_progress')
        .upsert(
          {
            player_id: session.user.id,
            date: today,
            daily_missions_completed: (playerData.daily_missions_completed || 0) + 1,
            last_updated: new Date().toISOString()
          },
          { onConflict: 'player_id,date' }
        );
      
      if (progressError) console.warn('Error updating daily progress:', progressError);
      
      newDailyCount += 1;
    }

    // 4. Actualizar estado local
    setPlayerData(prev => ({
      ...prev,
      experience: prev.experience + mission.xp_reward,
      skill_points: prev.skill_points + mission.skill_points_reward,
      lupi_coins: prev.lupi_coins + (mission.lupicoins_reward || 0),
      daily_missions_completed: newDailyCount
    }));
    
    setAvailablePoints(prev => prev + mission.skill_points_reward);
    setLupiCoins(prev => prev + (mission.lupicoins_reward || 0));
    
    // 5. Actualizar UI de misiones
    setMissionsData(prev => prev.map(m => 
      m.id === mission.id ? { ...m, is_completed: true, progress: mission.goal_value || 1 } : m 
    ));
    
    // 6. Mostrar mensaje de éxito
    let rewardMessage = `¡Misión completada! Ganaste ${mission.xp_reward} XP y ${mission.skill_points_reward} puntos de habilidad.`;
    if (mission.lupicoins_reward > 0) {
      rewardMessage += ` Además, recibiste ${mission.lupicoins_reward} LupiCoins.`;
    }
    
    showMessage(rewardMessage);
    
  } catch (error) {
    console.error('Error in completeMission:', error);
    throw error;
  }
};// Agrega esta función a tu App.jsx
const getDailyMissionsCompleted = async (playerId) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    
    // Intentar obtener de la tabla de tracking
    const { data: progressData, error: progressError } = await supabaseClient
      .from('player_daily_progress')
      .select('daily_missions_completed')
      .eq('player_id', playerId)
      .eq('date', today)
      .single();
    
    if (!progressError && progressData) {
      return progressData.daily_missions_completed;
    }
    
    // Fallback: obtener del campo legacy en players
    const { data: playerData, error: playerError } = await supabaseClient
      .from('players')
      .select('daily_missions_completed')
      .eq('id', playerId)
      .single();
    
    return playerError ? 0 : (playerData?.daily_missions_completed || 0);
    
  } catch (error) {
    return 0;
  }
};


  const handleSkillChange = (skill, value) => {
    const newPoints = availablePoints - value;
    if (newPoints >= 0) {
      setAvailablePoints(newPoints);
      setSkills(prev => ({ ...prev, [skill]: prev[skill] + value }));
    } else {
      showMessage('No tienes suficientes puntos de habilidad.');
    }
  };

  const handleUpgradeSkill = async (skill_name) => {
    if (!playerData || playerData.skill_points <= 0) { 
      showMessage('No tienes puntos de habilidad para gastar.'); 
      return; 
    }
    
    setLoading(true);
    try {
      const currentSkill = playerData.skills.find(s => s.skill_name === skill_name);
      if (!currentSkill) throw new Error("Habilidad no encontrada.");
      
      const { data: updatedSkill, error: skillError } = await supabaseClient
        .from('player_skills')
        .update({ skill_value: currentSkill.skill_value + 1 })
        .eq('player_id', session.user.id)
        .eq('skill_name', skill_name)
        .select();
      
      if (skillError) throw skillError;
      
      const { data: updatedPlayer, error: playerError } = await supabaseClient
        .from('players')
        .update({ skill_points: playerData.skill_points - 1 })
        .eq('id', session.user.id)
        .select();
      
      if (playerError) throw playerError;
      
      setPlayerData(prev => ({ 
        ...prev, 
        skill_points: prev.skill_points - 1, 
        skills: prev.skills.map(s => 
          s.skill_name === skill_name ? { ...s, skill_value: s.skill_value + 1 } : s
        ) 
      }));
      
      setAvailablePoints(prev => prev - 1);
      showMessage(`Habilidad "${skill_name}" mejorada con éxito.`);
    } catch (err) {
      showMessage(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGainXp = async () => {
    setLoading(true);
    try {
      const xpGained = 100, coinsGained = 150, currentXp = playerData.experience, nextLevelRequirement = playerData.level * 100;
      let newLevel = playerData.level, newSkillPoints = playerData.skill_points, newXp = currentXp + xpGained, newCoins = playerData.lupi_coins + coinsGained, levelUpMessage = '';
      
      if (newXp >= nextLevelRequirement) { 
        newLevel++; 
        newXp -= nextLevelRequirement; 
        newSkillPoints += 5; 
        levelUpMessage = `¡Felicidades! Subiste al nivel ${newLevel}. Ganaste 5 puntos de habilidad. `; 
      }
      
      const { data, error } = await supabaseClient
        .from('players')
        .update({ 
          level: newLevel, 
          experience: newXp, 
          skill_points: newSkillPoints, 
          lupi_coins: newCoins 
        })
        .eq('id', session.user.id)
        .select()
        .single();
      
      if (error) throw error;
      
      setPlayerData(prev => ({ ...prev, ...data }));
      setAvailablePoints(data.skill_points);
      setLupiCoins(data.lupi_coins);
      showMessage(`${levelUpMessage}Ganaste ${xpGained} XP y ${coinsGained} LupiCoins.`);
    } catch (err) {
      showMessage(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleFindItem = async () => {
    setLoading(true);
    try {
      const { data: allItems, error: itemsError } = await supabaseClient
        .from('items')
        .select('*');
      
      if (itemsError) throw itemsError;
      if (allItems.length === 0) { 
        showMessage("No hay objetos disponibles para encontrar."); 
        setLoading(false); 
        return; 
      }
      
      const randomItem = allItems[Math.floor(Math.random() * allItems.length)];
      
      const { data, error } = await supabaseClient
        .from('player_items')
        .insert([{ player_id: session.user.id, item_id: randomItem.id }])
        .select('*, items(*)')
        .single();
      
      if (error) throw error;
      
      setInventory(prev => [...prev, data]);
      showMessage(`¡Has encontrado un nuevo objeto: ${randomItem.name}!`);
    } catch (err) {
      showMessage(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEquipItem = async (playerItemId, skillBonus) => {
    setLoading(true);
    try {
      const currentEquippedItem = inventory.find(item => 
        item.is_equipped && item.items.skill_bonus === skillBonus
      );
      
      if (currentEquippedItem) {
        await supabaseClient
          .from('player_items')
          .update({ is_equipped: false })
          .eq('id', currentEquippedItem.id);
      }
      
      await supabaseClient
        .from('player_items')
        .update({ is_equipped: true })
        .eq('id', playerItemId);
      
      const updatedInventory = inventory.map(item => {
        if (item.id === playerItemId) return { ...item, is_equipped: true };
        if (currentEquippedItem && item.id === currentEquippedItem.id) return { ...item, is_equipped: false };
        return item;
      });
      
      const updatedEquipped = {};
      updatedInventory.forEach(item => { 
        if (item.is_equipped) updatedEquipped[item.items.skill_bonus] = item.items; 
      });
      
      setInventory(updatedInventory);
      setEquippedItems(updatedEquipped);
      showMessage("¡Objeto equipado con éxito!");
    } catch (err) {
      showMessage(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUnequipItem = async (playerItemId) => {
    setLoading(true);
    try {
      const { data, error } = await supabaseClient
        .from('player_items')
        .update({ is_equipped: false })
        .eq('id', playerItemId)
        .select('*, items(*)')
        .single();
      
      if (error) throw error;
      
      const updatedInventory = inventory.map(item => 
        item.id === playerItemId ? { ...item, is_equipped: false } : item
      );
      
      const updatedEquipped = { ...equippedItems };
      delete updatedEquipped[data.items.skill_bonus];
      
      setInventory(updatedInventory);
      setEquippedItems(updatedEquipped);
      showMessage("¡Objeto desequipado con éxito!");
    } catch (err) {
      showMessage(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleTransferCoins = async (e) => {
    e.preventDefault();
    setLoading(true);
    const amount = parseInt(transferAmount);
    
    if (isNaN(amount) || amount <= 0) { 
      showMessage('Por favor, ingresa una cantidad válida y positiva.'); 
      setLoading(false); 
      return; 
    }
    
    const recipientUsername = recipientAddress.endsWith('.lupi') ? 
      recipientAddress.slice(0, -5) : recipientAddress;
    
    if (recipientUsername === playerData.username) { 
      showMessage('No puedes transferirte monedas a ti mismo.'); 
      setLoading(false); 
      return; 
    }
    
    try {
      const { data: recipient, error: recipientError } = await supabaseClient
        .from('players')
        .select('id')
        .eq('username', recipientUsername)
        .single();
      
      if (recipientError) {
        if (recipientError.code === "PGRST116") showMessage('El usuario destinatario no existe.');
        else showMessage(recipientError.message);
        setLoading(false); 
        return;
      }
      
      const { error: rpcError } = await supabaseClient.rpc('transfer_lupicoins', { 
        sender_id: session.user.id, 
        receiver_id: recipient.id, 
        amount: amount 
      });
      
      if (rpcError) throw rpcError;
      
      const newLupiCoins = playerData.lupi_coins - amount;
      setLupiCoins(newLupiCoins);
      setPlayerData(prev => ({ ...prev, lupi_coins: newLupiCoins }));
      showMessage(`Transferencia de ${amount} LupiCoins a ${recipientUsername} exitosa.`);
      setRecipientAddress('');
      setTransferAmount('');
    } catch (err) {
      showMessage(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchMarketItems = async () => {
    setLoading(true);
    try {
      const { data: listings, error } = await supabaseClient
        .from('market_listings')
        .select(`id, price, seller_id, created_at, player_item_id, player_items (items (name, skill_bonus, bonus_value)), players (username)`)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setMarketItems(listings);
      showMessage('Objetos del mercado cargados.');
    } catch (err) {
      showMessage(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleBuyItem = async (listing) => {
    setLoading(true);
    if (playerData.lupi_coins < listing.price) { 
      showMessage('No tienes suficientes LupiCoins.'); 
      setLoading(false); 
      return; 
    }
    
    if (playerData.id === listing.seller_id) { 
      showMessage('No puedes comprar tu propio objeto.'); 
      setLoading(false); 
      return; 
    }
    
    try {
      const { error: transferError } = await supabaseClient.rpc('transfer_lupicoins', { 
        sender_id: session.user.id, 
        receiver_id: listing.seller_id, 
        amount: listing.price 
      });
      
      if (transferError) throw transferError;
      
      const { error: ownershipError } = await supabaseClient
        .from('player_items')
        .update({ player_id: session.user.id, is_equipped: false })
        .eq('id', listing.player_item_id);
      
      if (ownershipError) throw ownershipError;
      
      const { error: deleteError } = await supabaseClient
        .from('market_listings')
        .delete()
        .eq('id', listing.id);
      
      if (deleteError) throw deleteError;
      
      const newLupiCoins = playerData.lupi_coins - listing.price;
      setLupiCoins(newLupiCoins);
      setPlayerData(prev => ({ ...prev, lupi_coins: newLupiCoins }));
      await checkProfile(session.user.id);
      await fetchMarketItems();
      showMessage(`¡Has comprado ${listing.player_items.items.name} por ${listing.price} LupiCoins!`);
    } catch (err) {
      showMessage(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSellItem = async (e) => {
    e.preventDefault();
    setLoading(true);
    if (!itemToSell || !sellPrice) { 
      showMessage('Selecciona un objeto y un precio.'); 
      setLoading(false); 
      return; 
    }
    
    const price = parseInt(sellPrice);
    if (isNaN(price) || price <= 0) { 
      showMessage('El precio debe ser un número positivo.'); 
      setLoading(false); 
      return; 
    }
    
    try {
      const { error } = await supabaseClient
        .from('market_listings')
        .insert([{ 
          player_item_id: itemToSell.id, 
          seller_id: session.user.id, 
          price: price 
        }]);
      
      if (error) throw error;
      
      const updatedInventory = inventory.filter(item => item.id !== itemToSell.id);
      setInventory(updatedInventory);
      showMessage(`¡Objeto listado en el mercado por ${price} LupiCoins!`);
      setView('market');
      await fetchMarketItems();
    } catch (err) {
      showMessage(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !session) return;
    
    setLoading(true);
    try {
      const { error } = await supabaseClient
        .from('messages')
        .insert({ content: newMessage, sender_id: session.user.id });
      
      if (error) throw error;
      setNewMessage('');
    } catch (err) {
      showMessage(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchClubs = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabaseClient
        .from('clubs')
        .select('*');
      
      if (error) throw error;
      setClubs(data);
    } catch (err) {
      showMessage(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateClub = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data: newClub, error: clubError } = await supabaseClient
        .from('clubs')
        .insert({ 
          name: newClubName, 
          description: newClubDescription, 
          owner_id: session.user.id 
        })
        .select()
        .single();
      
      if (clubError) throw clubError;
      
      const { data: updatedPlayer, error: playerError } = await supabaseClient
        .from('players')
        .update({ club_id: newClub.id })
        .eq('id', session.user.id)
        .select()
        .single();
      
      if (playerError) throw playerError;
      
      setPlayerData(prev => ({...prev, ...updatedPlayer, clubs: newClub}));
      setCurrentClub(newClub);
      showMessage(`¡Club "${newClub.name}" creado con éxito!`);
      setView('dashboard');
    } catch (err) {
      showMessage(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleJoinClub = async (clubId) => {
    setLoading(true);
    try {
      const { data: updatedPlayer, error } = await supabaseClient
        .from('players')
        .update({ club_id: clubId })
        .eq('id', session.user.id)
        .select()
        .single();
      
      if (error) throw error;
      
      const { data: clubData, error: clubError } = await supabaseClient
        .from('clubs')
        .select('*')
        .eq('id', clubId)
        .single();
      
      if (clubError) throw clubError;
      
      setPlayerData(prev => ({...prev, ...updatedPlayer, clubs: clubData}));
      setCurrentClub(clubData);
      showMessage(`Te has unido al club "${clubData.name}"`);
      setView('dashboard');
    } catch (err) {
      showMessage(err.message);
    } finally {
      setLoading(false);
    }
  };
  
  const handleLeaveClub = async () => {
    setLoading(true);
    try {
      const { data: updatedPlayer, error } = await supabaseClient
        .from('players')
        .update({ club_id: null })
        .eq('id', session.user.id)
        .select()
        .single();
      
      if (error) throw error;
      
      setPlayerData(prev => ({...prev, ...updatedPlayer, clubs: null}));
      setCurrentClub(null);
      showMessage("Has abandonado el club.");
      setView('clubs');
      await fetchClubs();
    } catch (err) {
      showMessage(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
  try {
    await supabaseClient.auth.signOut();
    setView('auth');
    showMessage('Sesión cerrada correctamente');
  } catch (error) {
    showMessage('Error al cerrar sesión: ' + error.message);
  }
};

  const handleViewClubDetails = async (club) => {
    setLoading(true);
    try {
      const { data, error } = await supabaseClient
        .from('players')
        .select('username, level')
        .eq('club_id', club.id);
      
      if (error) throw error;
      
      setClubMembers(data);
      setCurrentClub(club);
      setView('club_details');
    } catch (err) {
      showMessage(err.message);
    } finally {
      setLoading(false);
    }
  };

  // En App.jsx, añade estas funciones antes del renderContent

const handleLogin = async (e) => {
  e.preventDefault();
  if (!supabaseClient) { 
    showMessage('Cliente de Supabase no disponible.'); 
    return; 
  }
  
  setLoading(true);
  try {
    const { error } = await supabaseClient.auth.signInWithPassword({ 
      email, 
      password 
    });
    
    if (error) {
      showMessage(error.message);
    } else {
      showMessage('Inicio de sesión exitoso. Redirigiendo...');
    }
  } catch (error) {
    showMessage('Error al iniciar sesión: ' + error.message);
  } finally {
    setLoading(false);
  }
};

const handleSignup = async (e) => {
  e.preventDefault();
  if (!supabaseClient) { 
    showMessage('Cliente de Supabase no disponible.'); 
    return; 
  }
  
  setLoading(true);
  try {
    const { error } = await supabaseClient.auth.signUp({ 
      email, 
      password 
    });
    
    if (error) {
      showMessage(error.message);
    } else {
      showMessage('Registro exitoso. Revisa tu correo para confirmar.');
    }
  } catch (error) {
    showMessage('Error al registrar: ' + error.message);
  } finally {
    setLoading(false);
  }
};

const handleCreateAccount = async (e) => {
  e.preventDefault();
  if (!supabaseClient || !session) { 
    showMessage('Cliente de Supabase o sesión no disponible.'); 
    return; 
  }
  
  setLoading(true);
  try {
    // Verificar si el usuario ya existe
    const { data: existingUser, error: userCheckError } = await supabaseClient
      .from('players')
      .select('username')
      .eq('username', username)
      .maybeSingle();
    
    if (existingUser) {
      showMessage('El nombre de usuario ya existe. Por favor, elige otro.');
      return;
    }
    
    if (userCheckError && userCheckError.code !== "PGRST116") {
      throw userCheckError;
    }
    
    // Crear nuevo jugador
    const { data: newPlayerData, error: playerError } = await supabaseClient
      .from('players')
      .insert([{ 
        id: session.user.id, 
        level: 1, 
        experience: 0, 
        position, 
        sport, 
        skill_points: availablePoints, 
        username, 
        lupi_coins: 100,
        daily_missions_completed: 0
      }])
      .select()
      .single();
    
    if (playerError) throw playerError;
    
    // Crear habilidades del jugador
    const skillInserts = Object.entries(skills).map(([skill_name, skill_value]) => ({ 
      player_id: session.user.id, 
      skill_name, 
      skill_value 
    }));
    
    const { error: skillsError } = await supabaseClient
      .from('player_skills')
      .insert(skillInserts);
    
    if (skillsError) throw skillsError;
    
    showMessage('Personaje creado con éxito. ¡Bienvenido a Lupi App!');
    setPlayerData({ ...newPlayerData, skills: skillInserts });
    setView('dashboard');
    
  } catch (err) {
    showMessage('Error al crear cuenta: ' + err.message);
  } finally {
    setLoading(false);
  }
};
const handleCompleteMission = async (mission) => {
  if (mission.is_completed) {
    showMessage('Esta misión ya ha sido completada.');
    return;
  }
  
  setLoading(true);
  try {
    await completeMission(mission);
  } catch (err) {
    showMessage('Error al completar misión: ' + err.message);
  } finally {
    setLoading(false);
  }
};

  const renderContent = () => {
    if (loading && !isSupabaseReady) return <LoadingScreen />;

    const props = {
        session, view, setView, loading, setLoading, message, showMessage,
        playerData, setPlayerData, email, setEmail, password, setPassword,
        handleLogin, handleSignup, handleCreateAccount, setUsername, setSport,
        setPosition, handleSkillChange, username, sport, position, skills,
        availablePoints, lupiCoins, equippedItems, handleUpgradeSkill, handleGainXp,
        handleFindItem, fetchMissions, fetchClubs, fetchLeaderboard, fetchMarketItems,
        leaderboardData, inventory, handleEquipItem, handleUnequipItem, setItemToSell,
        setSellPrice, missionsData, handleCompleteMission, handleTransferCoins, 
        recipientAddress, setRecipientAddress, transferAmount, setTransferAmount,
        marketItems, handleBuyItem, handleSellItem, itemToSell,
        messages, messagesEndRef, handleSendMessage, newMessage, setNewMessage,
        clubs, currentClub, clubMembers, handleViewClubDetails, handleJoinClub, handleLeaveClub,
        handleCreateClub, newClubName, setNewClubName, newClubDescription, setNewClubDescription, handleLogout, supabaseClient,
    };

    switch (view) {
      case 'auth': return <AuthView {...props} />;
      case 'create_character': return <CreateCharacterView {...props} />;
      case 'dashboard': return <DashboardView {...props} />;
      case 'leaderboard': return <LeaderboardView {...props} />;
      case 'inventory': return <InventoryView {...props} />;
      case 'missions': return <MissionsView {...props} />;
      case 'transfer': return <TransferView {...props} />;
      case 'market': return <MarketView {...props} />;
      case 'sell_item': return <SellItemView {...props} />;
      case 'chat': return <ChatView {...props} />;
      case 'clubs': return <ClubsView {...props} />;
      case 'create_club': return <CreateClubView {...props} />;
      case 'club_details': return <ClubDetailsView {...props} />;
      default: return <DashboardView {...props} />;
    }
  };

  return <div className="bg-gray-100 min-h-screen">{renderContent()}</div>;
};

export default App;