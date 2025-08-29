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
import { positionsBySport, sports, skillNames, initialSkillPoints } from './constants';
import { supabaseClient } from './services/supabase'; // Importación correcta

const App = () => {
  const [session, setSession] = useState(null);
  const [view, setView] = useState('auth');
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [sport, setSport] = useState(sports[0]);
const [position, setPosition] = useState(
  positionsBySport[sports[0]] && positionsBySport[sports[0]][0] 
    ? positionsBySport[sports[0]][0] 
    : 'Selecciona posición'
);  const [availablePoints, setAvailablePoints] = useState(initialSkillPoints);
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

  const showMessage = (text) => {
    setMessage(text);
    setTimeout(() => setMessage(''), 3000);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Función para manejar errores de Supabase
  const handleSupabaseError = (error) => {
    console.error('Supabase Error:', error);
    if (error.code === '406') {
      return 'Error de formato en la solicitud. Por favor, intenta nuevamente.';
    } else if (error.code === 'PGRST116') {
      return 'Recurso no encontrado.';
    } else if (error.code === '425') {
      return 'Demasiadas solicitudes. Por favor, espera un momento.';
    }
    return error.message || 'Error desconocido';
  };

  // REEMPLAZA tu useEffect principal con este
// App.jsx - Modifica el useEffect principal
useEffect(() => {
  const initializeApp = async () => {
    try {
      setIsSupabaseReady(true);
      console.log("Initializing app...");
      
      // No intentamos obtener sesión persistente
      setView('auth');
      setLoading(false);
      
    } catch (error) {
      console.error("Error initializing app:", error);
      setView('auth');
      setLoading(false);
    }
  };

  initializeApp();
  
  // Suscripción a cambios de estado de autenticación
  const { data: { subscription } } = supabaseClient.auth.onAuthStateChange(
    async (event, session) => {
      console.log("Auth state changed:", event, session);
      setSession(session);
      
      if (session && event === 'SIGNED_IN') {
        await checkProfile(session.user.id);
      } else {
        setView('auth');
        setLoading(false);
      }
    }
  );
  
  return () => subscription.unsubscribe();
}, []);

// Agrega este useEffect para prevenir loops infinitos
useEffect(() => {
  const timeout = setTimeout(() => {
    if (loading) {
      console.warn("Loading timeout - forcing state change");
      setLoading(false);
      if (!playerData && session) {
        setView('create_character');
      } else if (!session) {
        setView('auth');
      }
    }
  }, 10000); // 10 segundos timeout

  return () => clearTimeout(timeout);
}, [loading, session, playerData]);

  useEffect(() => {
    if (view !== 'chat' || !supabaseClient) return;
    
    const fetchMessages = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabaseClient
          .from('messages')
          .select(`id, content, created_at, players (username)`)
          .order('created_at', { ascending: true })
          .limit(50);
        
        if (error) {
          showMessage(handleSupabaseError(error));
        } else { 
          setMessages(data || []); 
          scrollToBottom(); 
        }
      } catch (error) {
        showMessage('Error al cargar mensajes: ' + error.message);
      } finally {
        setLoading(false);
      }
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

  // Función para obtener estadísticas del jugador
  const getPlayerStats = async (playerId) => {
    try {
      const { data, error } = await supabaseClient
        .from('player_stats')
        .select('*')
        .eq('player_id', playerId)
        .single();
      
      return error ? {} : data;
    } catch (error) {
      console.error('Error fetching player stats:', error);
      return {};
    }
  };

  // Función para calcular el progreso de la misión
  const calculateMissionProgress = (mission, playerStats) => {
    if (!playerStats) return 0;
    
    switch (mission.type) {
      case 'distance':
        return Math.min(playerStats.total_distance || 0, mission.goal_value);
      case 'training':
        return Math.min(playerStats.training_sessions || 0, mission.goal_value);
      case 'strength':
        return Math.min(playerStats.strength_exercises || 0, mission.goal_value);
      case 'intelligence':
        return Math.min(playerStats.puzzles_completed || 0, mission.goal_value);
      case 'skill':
        return Math.min(playerStats.skill_drills_completed || 0, mission.goal_value);
      default:
        return 0;
    }
  };

  // Función para verificar el perfil del usuario
 // REEMPLAZA tu función checkProfile con esta versión mejorada
const checkProfile = async (userId) => {
  setLoading(true);
  try {
    console.log("Checking profile for user:", userId);
    
    const { data: player, error: playerError } = await supabaseClient
      .from('players')
      .select('*, clubs(id, name, description)')
      .eq('id', userId)
      .maybeSingle();  // Cambia de single() a maybeSingle()

    if (playerError) {
      console.error("Error fetching player:", playerError);
      // Si hay error o no existe el perfil, vamos a create_character
      setView('create_character');
      setLoading(false);
      return;
    }

    if (!player) {
      console.log("No player profile found, going to create character");
      setView('create_character');
      setLoading(false);
      return;
    }

    console.log("Player found:", player);

    // Cargar habilidades
    const { data: skills, error: skillsError } = await supabaseClient
      .from('player_skills')
      .select('*')
      .eq('player_id', userId);

    if (skillsError) {
      console.error("Error fetching skills:", skillsError);
      throw skillsError;
    }

    // Cargar items
    const { data: playerItems, error: itemsError } = await supabaseClient
      .from('player_items')
      .select('*, items(*)')
      .eq('player_id', userId);

    if (itemsError) {
      console.error("Error fetching items:", itemsError);
      throw itemsError;
    }

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
    
    console.log("Profile loaded successfully, going to dashboard");
    setView('dashboard');

  } catch (err) {
    console.error("Error in checkProfile:", err);
    showMessage('Error al cargar perfil: ' + err.message);
    setView('create_character'); // En caso de error, ir a crear personaje
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
      showMessage(handleSupabaseError(err));
    } finally {
      setLoading(false);
    }
  };

  // Función para obtener misiones
  const fetchMissions = async () => {
    setLoading(true);
    try {
      const { data: missions, error: missionsError } = await supabaseClient
        .from('missions')
        .select('*');
      
      if (missionsError) throw missionsError;

      const { data: completedMissions, error: completedError } = await supabaseClient
        .from('player_missions')
        .select('mission_id, progress, completed_at')
        .eq('player_id', session.user.id);
      
      if (completedError) throw completedError;

      // Obtener estadísticas del jugador para el progreso
      const playerStats = await getPlayerStats(session.user.id);
      
      const mergedMissions = missions.map(mission => {
        const completed = completedMissions.find(m => m.mission_id === mission.id);
        let progress = 0;
        let is_completed = false;
        
        if (completed) {
          is_completed = true;
          progress = completed.progress || mission.goal_value;
        } else if (mission.goal_value > 1) {
          // Calcular progreso basado en estadísticas del jugador
          progress = calculateMissionProgress(mission, playerStats);
          is_completed = progress >= mission.goal_value;
        }
        
        return {
          ...mission,
          is_completed,
          progress
        };
      });

      setMissionsData(mergedMissions);
    } catch (err) {
      showMessage(handleSupabaseError(err));
    } finally {
      setLoading(false);
    }
  };

  // Función auxiliar para completar misiones
  const completeMission = async (mission) => {
    try {
      const { error: insertError } = await supabaseClient
        .from('player_missions')
        .insert([{ 
          player_id: session.user.id, 
          mission_id: mission.id,
          progress: mission.goal_value || 1,
          completed_at: new Date().toISOString()
        }]);
      
      if (insertError) throw insertError;

      // Para misiones diarias, incrementar el contador
      let dailyMissionsCompleted = playerData.daily_missions_completed || 0;
      if (mission.reset_interval === 'daily') {
        dailyMissionsCompleted += 1;
      }

      // Actualizar XP, puntos de habilidad Y LupiCoins
      const { data: updatedPlayer, error: updateError } = await supabaseClient
        .from('players')
        .update({ 
          experience: playerData.experience + mission.xp_reward, 
          skill_points: playerData.skill_points + mission.skill_points_reward,
          lupi_coins: playerData.lupi_coins + (mission.lupicoins_reward || 0),
          daily_missions_completed: dailyMissionsCompleted
        })
        .eq('id', session.user.id)
        .select();
      
      if (updateError) throw updateError;

      setPlayerData(prev => ({
        ...prev,
        experience: prev.experience + mission.xp_reward,
        skill_points: prev.skill_points + mission.skill_points_reward,
        lupi_coins: prev.lupi_coins + (mission.lupicoins_reward || 0),
        daily_missions_completed: dailyMissionsCompleted
      }));
      
      setAvailablePoints(prev => prev + mission.skill_points_reward);
      setLupiCoins(prev => prev + (mission.lupicoins_reward || 0));
      
      // Actualizar la misión como completada pero mantenerla visible
      setMissionsData(prev => prev.map(m => 
        m.id === mission.id ? { 
          ...m, 
          is_completed: true, 
          progress: mission.goal_value || 1 
        } : m 
      ));
      
      // Mensaje con todas las recompensas
      let rewardMessage = `¡Misión completada! Ganaste ${mission.xp_reward} XP y ${mission.skill_points_reward} puntos de habilidad.`;
      if (mission.lupicoins_reward > 0) {
        rewardMessage += ` Además, recibiste ${mission.lupicoins_reward} LupiCoins.`;
      }
      
      // Mensaje especial para misiones semanales
      if (mission.reset_interval === 'weekly') {
        rewardMessage += " ¡Misión semanal completada!";
      }
      
      showMessage(rewardMessage);
      
      // Verificar si se completaron suficientes misiones diarias para desbloquear semanales
      if (mission.reset_interval === 'daily' && dailyMissionsCompleted >= 7) {
        showMessage('¡Felicidades! Has completado 7 misiones diarias. Ahora puedes completar misiones semanales.');
      }
      
      // Verificar si se completaron suficientes misiones semanales para desbloquear mensuales
      if (mission.reset_interval === 'weekly') {
        const completedWeeklyMissions = missionsData.filter(m => 
          m.reset_interval === 'weekly' && m.is_completed
        ).length;
        
        if (completedWeeklyMissions + 1 >= 4) {
          showMessage('¡Felicidades! Has completado 4 misiones semanales. Ahora puedes completar misiones mensuales.');
        }
      }
    } catch (error) {
      throw error;
    }
  };

  const handleCompleteMission = async (mission) => {
    if (mission.is_completed) {
      showMessage('Esta misión ya ha sido completada.');
      return;
    }
    
    // Verificar requisitos
    if (mission.required_mission_id) {
      const requiredMission = missionsData.find(m => m.id === mission.required_mission_id);
      if (!requiredMission || !requiredMission.is_completed) {
        showMessage('Debes completar la misión requerida primero.');
        return;
      }
    }
    
    if (mission.required_completion_count > 0) {
      const chainMissions = missionsData.filter(m => m.quest_chain_id === mission.quest_chain_id);
      const completedInChain = chainMissions.filter(m => m.is_completed).length;
      if (completedInChain < mission.required_completion_count) {
        showMessage(`Necesitas completar ${mission.required_completion_count} misiones de esta cadena primero.`);
        return;
      }
    }
    
    setLoading(true);
    try {
      // Para misiones con progreso, actualizar el progreso
      if (mission.progress !== undefined && mission.progress < mission.goal_value) {
        const newProgress = mission.progress + 1;
        const isNowCompleted = newProgress >= mission.goal_value;
        
        if (isNowCompleted) {
          // Completar la misión y dar recompensa
          await completeMission(mission);
        } else {
          // Solo actualizar progreso
          const { error: upsertError } = await supabaseClient
            .from('player_missions')
            .upsert({ 
              player_id: session.user.id, 
              mission_id: mission.id,
              progress: newProgress
            });
          
          if (upsertError) throw upsertError;
          showMessage(`Progreso actualizado: ${newProgress}/${mission.goal_value}`);
          
          // Actualizar UI
          setMissionsData(prev => prev.map(m => 
            m.id === mission.id ? { 
              ...m, 
              progress: newProgress
            } : m 
          ));
        }
      } else {
        // Para misiones sin progreso (completar directamente)
        await completeMission(mission);
      }
    } catch (err) {
      showMessage(handleSupabaseError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e) => {
  e.preventDefault();
  if (!supabaseClient) { 
    showMessage('Cliente de Supabase no disponible.'); 
    return; 
  }
  
  setLoading(true);
  try {
    console.log("Attempting login with:", email);
    
    // Cerrar cualquier sesión existente primero
    await supabaseClient.auth.signOut();
    
    const { data, error } = await supabaseClient.auth.signInWithPassword({ 
      email, 
      password 
    });

    if (error) {
      console.error("Login error:", error);
      showMessage(handleSupabaseError(error));
      setLoading(false);
      return;
    }

    console.log("Login successful:", data);
    showMessage('Inicio de sesión exitoso. Redirigiendo...');
    
  } catch (error) {
    console.error("Unexpected login error:", error);
    showMessage('Error inesperado al iniciar sesión: ' + error.message);
    setLoading(false);
  }
};

// Agrega este useEffect para limpiar la sesión al recargar
useEffect(() => {
  const handleBeforeUnload = () => {
    // Limpiar sesión al recargar la página
    if (supabaseClient) {
      supabaseClient.auth.signOut().catch(() => {});
    }
  };

  window.addEventListener('beforeunload', handleBeforeUnload);
  
  return () => {
    window.removeEventListener('beforeunload', handleBeforeUnload);
  };
}, []);

  const handleSignup = async (e) => {
    e.preventDefault();
    if (!supabaseClient) { 
      showMessage('Supabase client not available.'); 
      return; 
    }
    
    setLoading(true);
    try {
      const { error } = await supabaseClient.auth.signUp({ email, password });
      if (error) {
        showMessage(handleSupabaseError(error));
      } else {
        showMessage('Registro exitoso. Revisa tu correo electrónico para confirmar.');
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
      showMessage('Supabase client or session not available.'); 
      return; 
    }
    
    setLoading(true);
    try {
      const { data: existingUser, error: userCheckError } = await supabaseClient
        .from('players')
        .select('username')
        .eq('username', username)
        .maybeSingle();
      
      if (existingUser) throw new Error('El nombre de usuario ya existe. Por favor, elige otro.');
      if (userCheckError && userCheckError.code !== "PGRST116") throw userCheckError;
      
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
          lupi_coins: 100 
        }])
        .select()
        .single();
      
      if (playerError) throw playerError;
      
      const skillInserts = Object.entries(skills).map(([skill_name, skill_value]) => ({ 
        player_id: session.user.id, 
        skill_name, 
        skill_value 
      }));
      
      const { data: skillsData, error: skillsError } = await supabaseClient
        .from('player_skills')
        .insert(skillInserts)
        .select();
      
      if (skillsError) throw skillsError;
      
      showMessage('Personaje creado con éxito. ¡Bienvenido a Lupi App!');
      setPlayerData({ ...newPlayerData, skills: skillsData || [] });
      setView('dashboard');
    } catch (err) {
      showMessage(handleSupabaseError(err));
    } finally {
      setLoading(false);
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
      showMessage(handleSupabaseError(err));
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
      showMessage(handleSupabaseError(err));
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
      showMessage(handleSupabaseError(err));
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
      showMessage(handleSupabaseError(err));
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
      showMessage(handleSupabaseError(err));
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
        else showMessage(handleSupabaseError(recipientError));
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
      showMessage(handleSupabaseError(err));
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
      showMessage(handleSupabaseError(err));
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
      showMessage(handleSupabaseError(err));
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
      showMessage(handleSupabaseError(err));
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
      showMessage(handleSupabaseError(err));
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
      showMessage(handleSupabaseError(err));
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
      showMessage(handleSupabaseError(err));
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
      showMessage(handleSupabaseError(err));
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
      showMessage(handleSupabaseError(err));
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
      showMessage(handleSupabaseError(err));
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