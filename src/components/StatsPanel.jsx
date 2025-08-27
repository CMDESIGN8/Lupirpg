import React from 'react';

const StatsPanel = ({ player }) => {
  if (!player) {
    return (
      <div className="stats-panel">
        <h2>Estadísticas del Jugador</h2>
        <p>Selecciona un jugador para ver sus estadísticas</p>
      </div>
    );
  }

  return (
    <div className="stats-panel">
      <h2>Estadísticas de {player.name}</h2>
      <div className="player-stats">
        <div className="stat-row">
          <span className="stat-label">Overall:</span>
          <span className="stat-value">{player.overall_rating || 0}</span>
        </div>
        <div className="stat-row">
          <span className="stat-label">Velocidad:</span>
          <span className="stat-value">{player.pace || 0}</span>
        </div>
        <div className="stat-row">
          <span className="stat-label">Tiro:</span>
          <span className="stat-value">{player.shooting || 0}</span>
        </div>
        <div className="stat-row">
          <span className="stat-label">Pase:</span>
          <span className="stat-value">{player.passing || 0}</span>
        </div>
        <div className="stat-row">
          <span className="stat-label">Regate:</span>
          <span className="stat-value">{player.dribbling || 0}</span>
        </div>
        <div className="stat-row">
          <span className="stat-label">Defensa:</span>
          <span className="stat-value">{player.defending || 0}</span>
        </div>
        <div className="stat-row">
          <span className="stat-label">Físico:</span>
          <span className="stat-value">{player.physical || 0}</span>
        </div>
      </div>
    </div>
  );
};

export default StatsPanel;