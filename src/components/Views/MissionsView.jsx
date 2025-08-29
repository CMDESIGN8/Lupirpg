import '../styles/Missions.css';
import { CheckCircle, ChevronDown, Target, Calendar, Award, Coins, Zap, Heart, Shield, Brain, Users, Castle } from 'lucide-react';
import ThemedButton from '../UI/ThemedButton';
import MessageDisplay from '../UI/MessageDisplay';
import ProgressBar from '../UI/ProgressBar';

const MissionsView = ({ 
  missionsData, 
  handleCompleteMission, 
  loading, 
  message, 
  setView, playerData,
  inventory = [] // ← Valor por defecto para evitar undefined
}) => {
  // Función para determinar si se debe mostrar la misión
  const shouldShowMission = (mission) => {
    return true; // Mostrar todas las misiones siempre
  };

  // Función para verificar requisitos de misiones
  const canCompleteMission = (mission) => {
    if (mission.is_completed) {
      return { canComplete: false, requirements: [] };
    }
    
    const requirements = [];
    
    // Verificar misión requerida
    if (mission.required_mission_id) {
      const requiredMission = missionsData.find(m => m.id === mission.required_mission_id);
      if (!requiredMission || !requiredMission.is_completed) {
        requirements.push(`Completar misión: ${requiredMission?.name || 'Previa'}`);
      }
    }
    
    // Verificar número de misiones completadas requeridas
    if (mission.required_completion_count > 0) {
      let completedCount = 0;
      let targetType = '';
      
      if (mission.reset_interval === 'weekly') {
        completedCount = missionsData.filter(m => 
          m.reset_interval === 'daily' && m.is_completed
        ).length;
        targetType = 'diarias';
      } 
      else if (mission.reset_interval === 'monthly') {
        completedCount = missionsData.filter(m => 
          m.reset_interval === 'weekly' && m.is_completed
        ).length;
        targetType = 'semanales';
      }
      else {
        completedCount = missionsData.filter(m => 
          m.quest_chain_id === mission.quest_chain_id && m.is_completed
        ).length;
        targetType = 'de esta cadena';
      }
      
      if (completedCount < mission.required_completion_count) {
        requirements.push(`Completar ${mission.required_completion_count} misiones ${targetType} (${completedCount}/${mission.required_completion_count})`);
      }
    }
    
    // Verificar nivel requerido (si existe el campo)
    if (mission.required_level && playerData?.level < mission.required_level) {
      requirements.push(`Nivel ${mission.required_level} requerido (Nivel ${playerData?.level})`);
    }
    
    // Verificar items requeridos (si existe el campo)
    if (mission.required_items && mission.required_items.length > 0) {
      const missingItems = mission.required_items.filter(itemId => 
        !inventory.some(invItem => invItem.item_id === itemId)
      );
      if (missingItems.length > 0) {
        requirements.push(`Items requeridos: ${missingItems.length} items necesarios`);
      }
    }
    
    return {
      canComplete: requirements.length === 0,
      requirements: requirements
    };
  };

  // Agrupar misiones por categoría
  const groupedMissions = (missionsData || [])
    .filter(mission => shouldShowMission(mission))
    .reduce((acc, mission) => {
      let category = 'general';
      
      if (mission.type === 'intelligence') category = 'intelligence';
      else if (mission.type === 'skill') category = 'skill';
      else if (mission.type === 'strength') category = 'strength';
      else if (mission.type === 'social') category = 'social';
      else if (mission.type === 'club') category = 'club';
      else if (mission.reset_interval === 'daily') category = 'daily';
      else if (mission.reset_interval === 'weekly') category = 'weekly';
      else if (mission.reset_interval === 'monthly') category = 'monthly';
      else category = mission.category || 'general';
      
      if (!acc[category]) acc[category] = [];
      acc[category].push(mission);
      return acc;
    }, {});

  // Orden de las categorías
  const categoryOrder = ['daily', 'weekly', 'monthly', 'intelligence', 'skill', 'strength', 'social', 'club', 'general'];

  // Función auxiliar para obtener títulos de categoría
  const getCategoryTitle = (category) => {
    switch(category) {
      case 'daily': return 'Misiones Diarias';
      case 'weekly': return 'Misiones Semanales';
      case 'monthly': return 'Misiones Mensuales';
      case 'intelligence': return 'Inteligencia';
      case 'skill': return 'Habilidad Técnica';
      case 'strength': return 'Fuerza y Resistencia';
      case 'social': return 'Misiones Sociales';
      case 'club': return 'Misiones de Club';
      default: return 'Misiones Generales';
    }
  };

  // Función auxiliar para obtener iconos de categoría
  const getCategoryIcon = (category) => {
    switch(category) {
      case 'daily': return <Calendar size={20} />;
      case 'weekly': return <Calendar size={20} />;
      case 'monthly': return <Calendar size={20} />;
      case 'intelligence': return <Brain size={20} />;
      case 'skill': return <Target size={20} />;
      case 'strength': return <Zap size={20} />;
      case 'social': return <Users size={20} />;
      case 'club': return <Castle size={20} />;
      default: return <Award size={20} />;
    }
  };

  return (
    <div className="missions-container">
      <div className="missions-box">
        <div className="missions-header">
          <h2 className="missions-title">
            <span className="neon-text">SISTEMA DE MISIONES - {playerData?.sport || 'Sin deporte'}</span>
          </h2>
          
          <div className="missions-stats">
            <div className="stat-item">
              <Award className="stat-icon" size={20} />
              <span className="stat-value">{playerData?.skill_points || 0}</span>
              <span className="stat-label">Puntos de Habilidad</span>
            </div>
            <div className="stat-item">
              <Coins className="stat-icon" size={20} />
              <span className="stat-value">{playerData?.lupi_coins || 0}</span>
              <span className="stat-label">LupiCoins</span>
            </div>
            <div className="stat-item">
              <Calendar className="stat-icon" size={20} />
              <span className="stat-value">{playerData?.daily_missions_completed || 0}/7</span>
              <span className="stat-label">Misiones Diarias</span>
            </div>
          </div>
        </div>
        
        <div className="missions-info">
          <p>Completa 7 misiones diarias para desbloquear una semanal y 4 semanales para una mensual</p>
          <p className="sport-info">Mostrando misiones para: <strong>{playerData?.sport || 'Todos'} - {playerData?.position || 'Todas'}</strong></p>
        </div>
        
        <MessageDisplay message={message} />
        
        {loading ? (
          <p className="loading-text">Cargando misiones...</p>
        ) : (
          <div className="missions-content">
            {categoryOrder.map(category => (
              groupedMissions[category] && groupedMissions[category].length > 0 && (
                <div key={category} className="mission-category">
                  <h3 className="category-title">
                    {getCategoryIcon(category)}
                    {getCategoryTitle(category)}
                  </h3>
                  
                  <div className="missions-list">
                    {groupedMissions[category].map(mission => (
                      <MissionCard 
                        key={mission.id} 
                        mission={mission} 
                        handleCompleteMission={handleCompleteMission} 
                        loading={loading}
                        missionsData={missionsData}
                        inventory={inventory}
                        playerData={playerData}
                      />
                    ))}
                  </div>
                </div>
              )
            ))}
            
            {Object.keys(groupedMissions).length === 0 && (
              <div className="no-missions">
                <p>No hay misiones disponibles.</p>
              </div>
            )}
            
            <div className="missions-footer">
              <ThemedButton 
                onClick={() => setView('dashboard')} 
                icon={<ChevronDown size={20} />}
                className="back-button"
              >
                Volver al Dashboard
              </ThemedButton>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Componente de tarjeta de misión
const MissionCard = ({ mission, handleCompleteMission, loading, missionsData, inventory = [], playerData }) => {
  const { canComplete, requirements } = canCompleteMission(mission);
  
  const getMissionIcon = (type) => {
    switch (type) {
      case 'strength': return <Zap size={18} className="mission-icon" />;
      case 'skill': return <Target size={18} className="mission-icon" />;
      case 'intelligence': return <Brain size={18} className="mission-icon" />;
      case 'social': return <Users size={18} className="mission-icon" />;
      case 'club': return <Castle size={18} className="mission-icon" />;
      case 'endurance': return <Heart size={18} className="mission-icon" />;
      default: return <Award size={18} className="mission-icon" />;
    }
  };

  const getMissionBadge = (resetInterval) => {
    switch (resetInterval) {
      case 'daily': return 'Diaria';
      case 'weekly': return 'Semanal';
      case 'monthly': return 'Mensual';
      default: return null;
    }
  };

  return (
    <div className={`mission-card ${!canComplete && !mission.is_completed ? 'locked' : ''}`}>
      <div className="mission-header">
        <div className="mission-title-container">
          {getMissionIcon(mission.type)}
          <h3 className="mission-title">{mission.name}</h3>
        </div>
        {mission.reset_interval && (
          <span className={`mission-badge ${mission.reset_interval}`}>
            {getMissionBadge(mission.reset_interval)}
          </span>
        )}
        {mission.is_completed && (
          <span className="mission-badge completed">✓ Completada</span>
        )}
      </div>
      
      <p className="mission-description">{mission.description}</p>
      
      {mission.sport && (
        <div className="mission-sport-info">
          <span>Deporte: {mission.sport}</span>
          {mission.position && <span>Posición: {mission.position}</span>}
        </div>
      )}
      
      {/* REQUISITOS DE DESBLOQUEO */}
      {!canComplete && !mission.is_completed && requirements.length > 0 && (
        <div className="mission-requirements">
          <h4>Requisitos para desbloquear:</h4>
          <ul>
            {requirements.map((req, index) => (
              <li key={index} className="requirement-item">• {req}</li>
            ))}
          </ul>
        </div>
      )}
      
      {/* PROGRESO */}
      {mission.progress !== undefined && mission.goal_value > 1 && (
        <div className="mission-progress">
          <div className="progress-text">
            <span>Progreso</span>
            <span>{mission.progress}/{mission.goal_value}</span>
          </div>
          <ProgressBar 
            value={mission.progress} 
            max={mission.goal_value} 
          />
        </div>
      )}
      
      {/* RECOMPENSAS */}
      <div className="mission-rewards">
        <span className="rewards-label">Recompensa:</span>
        <div className="rewards-container">
          <span className="reward-xp">{mission.xp_reward} XP</span>
          {mission.skill_points_reward > 0 && (
            <span className="reward-skill">+{mission.skill_points_reward} Puntos</span>
          )}
          {mission.lupicoins_reward > 0 && (
            <span className="reward-coins">+{mission.lupicoins_reward} LupiCoins</span>
          )}
        </div>
      </div>
      
      {/* BOTÓN */}
      <ThemedButton 
        onClick={() => handleCompleteMission(mission)} 
        disabled={mission.is_completed || loading || !canComplete}
        icon={mission.is_completed ? <CheckCircle size={20} /> : null}
        className={`mission-button ${mission.is_completed ? 'completed' : ''} ${!canComplete ? 'locked' : ''}`}
      >
        {mission.is_completed ? 'Completada' : 
         !canComplete ? 'Bloqueada' : 'Completar Misión'}
      </ThemedButton>
    </div>
  );
};

export default MissionsView;