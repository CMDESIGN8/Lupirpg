import '../styles/Missions.css';
import { CheckCircle, ChevronDown, Target, Calendar, Award, Coins, Zap, Heart, Shield, Brain, Users, Castle } from 'lucide-react';
import ThemedButton from '../UI/ThemedButton';
import MessageDisplay from '../UI/MessageDisplay';
import ProgressBar from '../UI/ProgressBar';
import { sports, positions } from '../../constants';

const MissionsView = ({ missionsData, handleCompleteMission, loading, message, setView, playerData }) => {
  // Agrupar misiones por categoría y filtrar por deporte/posición del jugador
  const filterMissionsByPlayer = (missions) => {
    return missions.filter(mission => {
      // Si la misión no tiene deporte específico, está disponible para todos
      if (!mission.sport) return true;
      
      // Verificar si coincide con el deporte del jugador
      if (mission.sport !== playerData.sport) return false;
      
      // Si tiene posición específica, verificar coincidencia
      if (mission.position && mission.position !== playerData.position) return false;
      
      return true;
    });
  };

  // Agrupar misiones por categoría
  const groupedMissions = filterMissionsByPlayer(missionsData).reduce((acc, mission) => {
    let category = 'general';
    
    // Determinar categoría basada en el tipo de misión
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

  // Orden de las categorías para mostrarlas
  const categoryOrder = ['daily', 'weekly', 'monthly', 'intelligence', 'skill', 'strength', 'social', 'club', 'general'];

  // Verificar requisitos de misiones
  const canCompleteMission = (mission) => {
    if (mission.is_completed) return false;
    
    // Verificar si requiere otra misión completada primero
    if (mission.required_mission_id) {
      const requiredMission = missionsData.find(m => m.id === mission.required_mission_id);
      if (!requiredMission || !requiredMission.is_completed) return false;
    }
    
    // Verificar si requiere un número específico de completadas en una cadena
    if (mission.required_completion_count > 0) {
      const chainMissions = missionsData.filter(m => m.quest_chain_id === mission.quest_chain_id);
      const completedInChain = chainMissions.filter(m => m.is_completed).length;
      if (completedInChain < mission.required_completion_count) return false;
    }
    
    return true;
  };

  return (
    <div className="missions-container">
      <div className="missions-box">
        <div className="missions-header">
          <h2 className="missions-title">
            <span className="neon-text">SISTEMA DE MISIONES - {playerData?.sport}</span>
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
          <p className="sport-info">Mostrando misiones para: <strong>{playerData?.sport} - {playerData?.position}</strong></p>
        </div>
        
        <MessageDisplay message={message} />
        
        {loading ? (
          <p className="loading-text">Cargando misiones...</p>
        ) : (
          <div className="missions-content">
            {categoryOrder.map(category => (
              groupedMissions[category] && (
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
                        canComplete={canCompleteMission(mission)}
                      />
                    ))}
                  </div>
                </div>
              )
            ))}
            
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

// Componente de tarjeta de misión
const MissionCard = ({ mission, handleCompleteMission, loading, canComplete }) => {
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

  const getRequirementText = () => {
    if (mission.required_mission_id) {
      return "Requiere completar otra misión primero";
    }
    
    if (mission.required_completion_count > 0) {
      return `Requiere completar ${mission.required_completion_count} misiones de esta cadena`;
    }
    
    return null;
  };

  const requirementText = getRequirementText();

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
      </div>
      
      <p className="mission-description">{mission.description}</p>
      
      {mission.sport && (
        <div className="mission-sport-info">
          <span>Deporte: {mission.sport}</span>
          {mission.position && <span>Posición: {mission.position}</span>}
        </div>
      )}
      
      {requirementText && !mission.is_completed && (
        <div className="mission-requirement">
          <span className="requirement-text">{requirementText}</span>
        </div>
      )}
      
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
      
      <div className="mission-rewards">
        <span className="rewards-label">Recompensa:</span>
        <div className="rewards-container">
          <span className="reward-xp">
            {mission.xp_reward} XP
          </span>
          {mission.skill_points_reward > 0 && (
            <span className="reward-skill">
              +{mission.skill_points_reward} Puntos de Habilidad
            </span>
          )}
          {mission.lupicoins_reward > 0 && (
            <span className="reward-coins">
              +{mission.lupicoins_reward} LupiCoins
            </span>
          )}
        </div>
      </div>
      
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