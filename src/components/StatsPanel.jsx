import React from 'react';

const StatsPanel = ({ character }) => {
  return (
    <div className="stats-panel">
      <h2>Estadísticas</h2>
      <div className="stats-grid">
        <div className="stat-item">
          <span className="stat-label">Fuerza:</span>
          <span className="stat-value">{character.stats?.strength || 10}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Destreza:</span>
          <span className="stat-value">{character.stats?.dexterity || 10}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Inteligencia:</span>
          <span className="stat-value">{character.stats?.intelligence || 10}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Constitución:</span>
          <span className="stat-value">{character.stats?.constitution || 10}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Sabiduría:</span>
          <span className="stat-value">{character.stats?.wisdom || 10}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Carisma:</span>
          <span className="stat-value">{character.stats?.charisma || 10}</span>
        </div>
      </div>
    </div>
  );
};

export default StatsPanel;