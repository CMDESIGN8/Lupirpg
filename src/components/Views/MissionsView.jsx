import '../styles/Missions.css';
import { CheckCircle, ChevronDown, Target, Calendar, Award, Coins, Zap, Heart, Shield, Brain, Users, Castle, X } from 'lucide-react';
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
  // Ahora useState estará disponible
  const [selectedMission, setSelectedMission] = useState(null);
  const [activeCategory, setActiveCategory] = useState('all');

  // Función para determinar si se debe mostrar la misión
  const shouldShowMission = (mission) => {
    return true;
  };

  // Categorías de misiones
  const missionCategories = [
    { id: 'all', name: 'Todas', icon: <Award size={16} /> },
    { id: 'daily', name: 'Diarias', icon: <Calendar size={16} /> },
    { id: 'weekly', name: 'Semanales', icon: <Calendar size={16} /> },
    { id: 'monthly', name: 'Mensuales', icon: <Calendar size={16} /> },
    { id: 'strength', name: 'Fuerza', icon: <Zap size={16} /> },
    { id: 'skill', name: 'Habilidad', icon: <Target size={16} /> },
    { id: 'intelligence', name: 'Inteligencia', icon: <Brain size={16} /> },
    { id: 'social', name: 'Sociales', icon: <Users size={16} /> },
    { id: 'club', name: 'Club', icon: <Castle size={16} /> }
  ];

  // Filtrar misiones por categoría
  const filteredMissions = (missionsData || [])
    .filter(mission => {
      if (activeCategory === 'all') return true;
      if (activeCategory === 'daily') return mission.reset_interval === 'daily';
      if (activeCategory === 'weekly') return mission.reset_interval === 'weekly';
      if (activeCategory === 'monthly') return mission.reset_interval === 'monthly';
      return mission.type === activeCategory;
    })
    .filter(mission => shouldShowMission(mission));

  // Agrupar misiones por tipo
  const groupedMissions = filteredMissions.reduce((acc, mission) => {
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

  // Orden de categorías
  const categoryOrder = ['daily', 'weekly', 'monthly', 'intelligence', 'skill', 'strength', 'social', 'club', 'general'];

  // Función para verificar requisitos
  const checkMissionRequirements = (mission) => {
    if (mission.is_completed) {
      return { canComplete: false, requirements: [] };
    }
    
    const requirements = [];
    
    if (mission.required_mission_id) {
      const requiredMission = missionsData.find(m => m.id === mission.required_mission_id);
      if (!requiredMission || !requiredMission.is_completed) {
        requirements.push(`Completar misión: ${requiredMission?.name || 'Previa'}`);
      }
    }
    
    if (mission.required_completion_count > 0) {
      let completedCount = 0;
      let targetType = '';
      
      if (mission.reset_interval === 'weekly') {
        completedCount = missionsData.filter(m => m.reset_interval === 'daily' && m.is_completed).length;
        targetType = 'diarias';
      } 
      else if (mission.reset_interval === 'monthly') {
        completedCount = missionsData.filter(m => m.reset_interval === 'weekly' && m.is_completed).length;
        targetType = 'semanales';
      }
      else {
        completedCount = missionsData.filter(m => m.quest_chain_id === mission.quest_chain_id && m.is_completed).length;
        targetType = 'de esta cadena';
      }
      
      if (completedCount < mission.required_completion_count) {
        requirements.push(`Completar ${mission.required_completion_count} misiones ${targetType} (${completedCount}/${mission.required_completion_count})`);
      }
    }
    
    if (mission.required_level && playerData?.level < mission.required_level) {
      requirements.push(`Nivel ${mission.required_level} requerido (Nivel ${playerData?.level})`);
    }
    
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