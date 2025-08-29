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
  setView, 
  playerData,
  inventory = []
}) => {
  // Función para determinar si se debe mostrar la misión
  const shouldShowMission = (mission) => {
    return true; // Mostrar todas las misiones siempre
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
    <div className="missions-dashboard">
      {/* Header */}
      <div className="missions-header">
        <h2 className="missions-title">
          <span className="neon-text">PANEL DE MISIONES</span>
        </h2>
        
        <div className="missions-stats">
          <div className="stat-item">
            <Award className="stat-icon" size={18} />
            <span className="stat-value">{playerData?.skill_points || 0}</span>
            <span className="stat-label">Puntos</span>
          </div>
          <div className="stat-item">
            <Coins className="stat-icon" size={18} />
            <span className="stat-value">{playerData?.lupi_coins || 0}</span>
            <span className="stat-label">LupiCoins</span>
          </div>
          <div className="stat-item">
            <Calendar className="stat-icon" size={18} />
            <span className="stat-value">{playerData?.daily_missions_completed || 0}/7</span>
            <span className="stat-label">Diarias</span>
          </div>
        </div>
      </div>

      <MessageDisplay message={message} />

      <div className="missions-layout">
        {/* Panel lateral de categorías */}
        <div className="missions-sidebar">
          <div className="categories-list">
            <h3>Categorías</h3>
            {missionCategories.map(category => (
              <button
                key={category.id}
                className={`category-btn ${activeCategory === category.id ? 'active' : ''}`}
                onClick={() => setActiveCategory(category.id)}
              >
                {category.icon}
                <span>{category.name}</span>
              </button>
            ))}
          </div>

          {/* Lista de misiones */}
          <div className="missions-list-container">
            <h3>Misiones ({filteredMissions.length})</h3>
            <div className="missions-scrollable">
              {categoryOrder.map(category => (
                groupedMissions[category] && groupedMissions[category].length > 0 && (
                  <div key={category} className="mission-category">
                    <h4 className="category-title">
                      {getCategoryIcon(category)}
                      {getCategoryName(category)}
                    </h4>
                    
                    {groupedMissions[category].map(mission => (
                      <MissionItem
                        key={mission.id}
                        mission={mission}
                        isSelected={selectedMission?.id === mission.id}
                        onSelect={() => setSelectedMission(mission)}
                      />
                    ))}
                  </div>
                )
              ))}
              
              {filteredMissions.length === 0 && (
                <div className="no-missions">
                  <p>No hay misiones en esta categoría</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Panel principal de detalles */}
        <div className="missions-detail-panel">
          {selectedMission ? (
            <MissionDetail
              mission={selectedMission}
              onComplete={handleCompleteMission}
              loading={loading}
              missionsData={missionsData}
              inventory={inventory}
              playerData={playerData}
              onClose={() => setSelectedMission(null)}
            />
          ) : (
            <div className="mission-placeholder">
              <Award size={64} className="placeholder-icon" />
              <h3>Selecciona una misión</h3>
              <p>Elige una misión del panel lateral para ver sus detalles y recompensas</p>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
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
  );
};

// Componente de item de misión en la lista
const MissionItem = ({ mission, isSelected, onSelect }) => {
  const getMissionIcon = (type) => {
    switch (type) {
      case 'strength': return <Zap size={14} />;
      case 'skill': return <Target size={14} />;
      case 'intelligence': return <Brain size={14} />;
      case 'social': return <Users size={14} />;
      case 'club': return <Castle size={14} />;
      default: return <Award size={14} />;
    }
  };

  return (
    <div 
      className={`mission-item ${isSelected ? 'selected' : ''} ${mission.is_completed ? 'completed' : ''}`}
      onClick={onSelect}
    >
      <div className="mission-item-header">
        {getMissionIcon(mission.type)}
        <span className="mission-item-name">{mission.name}</span>
      </div>
      <div className="mission-item-meta">
        {mission.reset_interval && (
          <span className={`mission-badge ${mission.reset_interval}`}>
            {mission.reset_interval === 'daily' ? 'D' : mission.reset_interval === 'weekly' ? 'S' : 'M'}
          </span>
        )}
        {mission.is_completed && (
          <CheckCircle size={14} className="completed-icon" />
        )}
      </div>
    </div>
  );
};

// Componente de detalle de misión
const MissionDetail = ({ mission, onComplete, loading, missionsData, inventory, playerData, onClose }) => {
  const { canComplete, requirements } = checkMissionRequirements(mission);
  
  const getMissionIcon = (type) => {
    switch (type) {
      case 'strength': return <Zap size={20} />;
      case 'skill': return <Target size={20} />;
      case 'intelligence': return <Brain size={20} />;
      case 'social': return <Users size={20} />;
      case 'club': return <Castle size={20} />;
      default: return <Award size={20} />;
    }
  };

  return (
    <div className="mission-detail">
      <div className="mission-detail-header">
        <div className="mission-title-section">
          {getMissionIcon(mission.type)}
          <h2>{mission.name}</h2>
        </div>
        <button className="close-btn" onClick={onClose}>
          <X size={20} />
        </button>
      </div>

      <div className="mission-detail-content">
        {/* Información básica */}
        <div className="mission-info-section">
          <h3>Descripción</h3>
          <p className="mission-description">{mission.description}</p>
        </div>

        {/* Deporte y posición */}
        {mission.sport && (
          <div className="mission-info-section">
            <h3>Requerimientos</h3>
            <div className="mission-requirements-info">
              <span>Deporte: {mission.sport}</span>
              {mission.position && <span>Posición: {mission.position}</span>}
            </div>
          </div>
        )}

        {/* Requisitos de desbloqueo */}
        {!canComplete && !mission.is_completed && requirements.length > 0 && (
          <div className="mission-info-section">
            <h3>Requisitos para desbloquear</h3>
            <ul className="requirements-list">
              {requirements.map((req, index) => (
                <li key={index} className="requirement-item">• {req}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Progreso */}
        {mission.progress !== undefined && mission.goal_value > 1 && (
          <div className="mission-info-section">
            <h3>Progreso</h3>
            <div className="progress-container">
              <div className="progress-text">
                <span>{mission.progress}/{mission.goal_value}</span>
              </div>
              <ProgressBar value={mission.progress} max={mission.goal_value} />
            </div>
          </div>
        )}

        {/* Recompensas */}
        <div className="mission-info-section">
          <h3>Recompensas</h3>
          <div className="rewards-grid">
            <div className="reward-item">
              <Award size={18} />
              <span>{mission.xp_reward} XP</span>
            </div>
            {mission.skill_points_reward > 0 && (
              <div className="reward-item">
                <Target size={18} />
                <span>+{mission.skill_points_reward} Puntos</span>
              </div>
            )}
            {mission.lupicoins_reward > 0 && (
              <div className="reward-item">
                <Coins size={18} />
                <span>+{mission.lupicoins_reward} LupiCoins</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Botón de acción */}
      <div className="mission-detail-actions">
        <ThemedButton 
          onClick={() => onComplete(mission)} 
          disabled={mission.is_completed || loading || !canComplete}
          icon={mission.is_completed ? <CheckCircle size={20} /> : null}
          className={`mission-complete-btn ${mission.is_completed ? 'completed' : ''} ${!canComplete ? 'locked' : ''}`}
        >
          {mission.is_completed ? 'Completada' : 
           !canComplete ? 'Bloqueada' : 'Completar Misión'}
        </ThemedButton>
      </div>
    </div>
  );
};

// Funciones auxiliares
const getCategoryIcon = (category) => {
  switch(category) {
    case 'daily': return <Calendar size={16} />;
    case 'weekly': return <Calendar size={16} />;
    case 'monthly': return <Calendar size={16} />;
    case 'intelligence': return <Brain size={16} />;
    case 'skill': return <Target size={16} />;
    case 'strength': return <Zap size={16} />;
    case 'social': return <Users size={16} />;
    case 'club': return <Castle size={16} />;
    default: return <Award size={16} />;
  }
};

const getCategoryName = (category) => {
  switch(category) {
    case 'daily': return 'Misiones Diarias';
    case 'weekly': return 'Misiones Semanales';
    case 'monthly': return 'Misiones Mensuales';
    case 'intelligence': return 'Inteligencia';
    case 'skill': return 'Habilidad';
    case 'strength': return 'Fuerza';
    case 'social': return 'Sociales';
    case 'club': return 'Club';
    default: return 'Generales';
  }
};

export default MissionsView;