import '../styles/Missions.css'   // 👈 acá importás tu CSS
import { CheckCircle, ChevronDown, Target, Calendar, Award, Coins } from 'lucide-react';
import ThemedButton from '../UI/ThemedButton';
import MessageDisplay from '../UI/MessageDisplay';
import ProgressBar from '../UI/ProgressBar';

const MissionsView = ({ missionsData, handleCompleteMission, loading, message, setView, playerData }) => {
  // Agrupar misiones por categoría
  const groupedMissions = missionsData.reduce((acc, mission) => {
    const category = mission.category || 'general';
    if (!acc[category]) acc[category] = [];
    acc[category].push(mission);
    return acc;
  }, {});

  return (
    <div className="missions-container">
      <div className="missions-box">
        <div className="missions-header">
          <h2 className="missions-title">
            <span className="neon-text">MISIONES</span>
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
          </div>
        </div>
        
        <MessageDisplay message={message} />
        
        {loading ? (
          <p className="loading-text">Cargando misiones...</p>
        ) : (
          <div className="missions-content">
            {Object.keys(groupedMissions).length > 0 ? (
              Object.entries(groupedMissions).map(([category, missions]) => (
                <div key={category} className="mission-category">
                  <h3 className="category-title">
                    {category === 'daily' ? 'Misiones Diarias' : 
                     category === 'training' ? 'Entrenamiento' : 
                     category === 'distance' ? 'Carreras' : 
                     category === 'general' ? 'Misiones Generales' : 
                     category === 'economy' ? 'Economía' : 
                     category === 'social' ? 'Social' : 
                     category.charAt(0).toUpperCase() + category.slice(1)}
                  </h3>
                  
                  <div className="missions-list">
                    {missions.map(mission => (
                      <MissionCard 
                        key={mission.id} 
                        mission={mission} 
                        handleCompleteMission={handleCompleteMission} 
                        loading={loading}
                      />
                    ))}
                  </div>
                </div>
              ))
            ) : (
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
const MissionCard = ({ mission, handleCompleteMission, loading }) => {
  const getMissionIcon = (type) => {
    switch (type) {
      case 'distance': return <Target size={18} className="mission-icon" />;
      case 'daily': return <Calendar size={18} className="mission-icon" />;
      case 'economy': return <Coins size={18} className="mission-icon" />;
      default: return <Award size={18} className="mission-icon" />;
    }
  };

  return (
    <div className="mission-card">
      <div className="mission-header">
        <div className="mission-title-container">
          {getMissionIcon(mission.type)}
          <h3 className="mission-title">{mission.name}</h3>
        </div>
        {mission.is_daily && (
          <span className="mission-daily-badge">
            Diaria
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