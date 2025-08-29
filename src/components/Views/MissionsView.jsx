// src/views/MissionsView.jsx
import React, { useState } from 'react';
import '../styles/Missions.css';
import { CheckCircle, ChevronDown, Target, Calendar, Award, Coins, Zap, Heart, Shield, Brain, Users, Castle } from 'lucide-react';
import ThemedButton from '../UI/ThemedButton';
import MessageDisplay from '../UI/MessageDisplay';
import ProgressBar from '../UI/ProgressBar';

/**
 * Helper en scope de módulo: recibe todo lo necesario y devuelve { canComplete, requirements }
 */
const canCompleteMission = (mission, missionsData = [], playerData = {}, inventory = []) => {
  if (!mission) return { canComplete: false, requirements: ['Misión inválida'] };
  if (mission.is_completed) return { canComplete: false, requirements: [] };

  const requirements = [];

  // Misión previa requerida
  if (mission.required_mission_id) {
    const requiredMission = missionsData.find(m => m.id === mission.required_mission_id);
    if (!requiredMission || !requiredMission.is_completed) {
      requirements.push(`Completar misión: ${requiredMission?.name || 'Previa'}`);
    }
  }

  // Conteo de misiones completadas requeridas (si aplica)
  if (mission.required_completion_count && mission.required_completion_count > 0) {
    let completedCount = 0;
    let targetType = '';

    if (mission.reset_interval === 'weekly') {
      completedCount = missionsData.filter(m => m.reset_interval === 'daily' && m.is_completed).length;
      targetType = 'diarias';
    } else if (mission.reset_interval === 'monthly') {
      completedCount = missionsData.filter(m => m.reset_interval === 'weekly' && m.is_completed).length;
      targetType = 'semanales';
    } else {
      completedCount = missionsData.filter(m => m.quest_chain_id === mission.quest_chain_id && m.is_completed).length;
      targetType = 'de esta cadena';
    }

    if (completedCount < mission.required_completion_count) {
      requirements.push(`Completar ${mission.required_completion_count} misiones ${targetType} (${completedCount}/${mission.required_completion_count})`);
    }
  }

  // Nivel requerido
  if (mission.required_level && (playerData?.level ?? 0) < mission.required_level) {
    requirements.push(`Nivel ${mission.required_level} requerido (Nivel ${playerData?.level ?? 0})`);
  }

  // Items requeridos
  if (Array.isArray(mission.required_items) && mission.required_items.length > 0) {
    const missingItems = mission.required_items.filter(itemId =>
      !inventory.some(invItem => invItem.item_id === itemId)
    );
    if (missingItems.length > 0) {
      requirements.push(`Items requeridos: ${missingItems.length} item(s) faltante(s)`);
    }
  }

  return {
    canComplete: requirements.length === 0,
    requirements
  };
};

const MissionsView = ({
  missionsData = [],
  handleCompleteMission = () => {},
  loading = false,
  message = null,
  setView = () => {},
  playerData = {},
  inventory = []
}) => {
  const [activeCategory, setActiveCategory] = useState('all');

  const shouldShowMission = (mission) => {
    return true; // Mostrar todas por ahora
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

  // Agrupar misiones por tipo (manteniendo la estructura original)
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

        {/* Filtros de categoría */}
        <div className="missions-categories">
          <h3>Filtrar por categoría:</h3>
          <div className="categories-list">
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
                    {getCategoryTitle(category)} ({groupedMissions[category].length})
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

            {filteredMissions.length === 0 && !loading && (
              <div className="no-missions">
                <p>No hay misiones disponibles en esta categoría.</p>
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

// MissionCard (fuera de MissionsView pero en el mismo archivo)
const MissionCard = ({ mission, handleCompleteMission, loading, missionsData = [], inventory = [], playerData = {} }) => {
  const { canComplete, requirements } = canCompleteMission(mission, missionsData, playerData, inventory);

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
          <span className="reward-xp">{mission.xp_reward} XP</span>
          {mission.skill_points_reward > 0 && (
            <span className="reward-skill">+{mission.skill_points_reward} Puntos</span>
          )}
          {mission.lupicoins_reward > 0 && (
            <span className="reward-coins">+{mission.lupicoins_reward} LupiCoins</span>
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