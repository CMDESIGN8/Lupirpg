import '../styles/Missions.css';
import { CheckCircle, ChevronDown, Target, Calendar, Award, Coins, Zap, Heart, Shield } from 'lucide-react';
import ThemedButton from '../UI/ThemedButton';
import MessageDisplay from '../UI/MessageDisplay';
import ProgressBar from '../UI/ProgressBar';

const MissionsView = ({ missionsData, handleCompleteMission, loading, message, setView, playerData }) => {
  // Agrupar misiones por categoría mejorada
  const groupedMissions = missionsData.reduce((acc, mission) => {
    let category = 'general';
    
    // Determinar categoría basada en el tipo de misión
    if (mission.type === 'strength') category = 'strength';
    else if (mission.type === 'skill') category = 'skill';
    else if (mission.type === 'endurance') category = 'endurance';
    else if (mission.reset_interval === 'daily') category = 'daily';
    else if (mission.reset_interval === 'weekly') category = 'weekly';
    else if (mission.reset_interval === 'monthly') category = 'monthly';
    else category = mission.category || 'general';
    
    if (!acc[category]) acc[category] = [];
    acc[category].push(mission);
    return acc;
  }, {});

  // Orden de las categorías para mostrarlas
  const categoryOrder = ['daily', 'weekly', 'monthly', 'strength', 'skill', 'endurance', 'general'];

  return (
    <div className="missions-container">
      <div className="missions-box">
        <div className="missions-header">
          <h2 className="missions-title">
            <span className="neon-text">SISTEMA DE MISIONES</span>
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
                    {getCategoryTitle(category)}
                  </h3>
                  
                  <div className="missions-list">
                    {groupedMissions[category].map(mission => (
                      <MissionCard 
                        key={mission.id} 
                        mission={mission} 
                        handleCompleteMission={handleCompleteMission} 
                        loading={loading}
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
    case 'strength': return 'Mejora de Fuerza';
    case 'skill': return 'Mejora de Habilidad';
    case 'endurance': return 'Mejora de Resistencia';
    default: return 'Misiones Generales';
  }
};

// Componente de tarjeta de misión
const MissionCard = ({ mission, handleCompleteMission, loading }) => {
  const getMissionIcon = (type) => {
    switch (type) {
      case 'strength': return <Zap size={18} className="mission-icon" />;
      case 'skill': return <Target size={18} className="mission-icon" />;
      case 'endurance': return <Heart size={18} className="mission-icon" />;
      case 'distance': return <Shield size={18} className="mission-icon" />;
      case 'economy': return <Coins size={18} className="mission-icon" />;
      case 'daily': return <Calendar size={18} className="mission-icon" />;
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
    <div className="mission-card">
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
        disabled={mission.is_completed || loading}
        icon={mission.is_completed ? <CheckCircle size={20} /> : null}
        className={`mission-button ${mission.is_completed ? 'completed' : ''}`}
      >
        {mission.is_completed ? 'Completada' : 'Completar Misión'}
      </ThemedButton>
    </div>
  );
};

export default MissionsView;