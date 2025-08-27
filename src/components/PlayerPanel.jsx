import React from 'react';
import { usePlayers } from '../hooks/useSupabase';

const PlayerPanel = ({ onSelectPlayer }) => {
  const { players, loading } = usePlayers();

  if (loading) return <div>Cargando jugadores...</div>;

  return (
    <div className="player-panel">
      <h2>Jugadores</h2>
      <div className="players-grid">
        {players.map(player => (
          <div 
            key={player.id} 
            className="player-card"
            onClick={() => onSelectPlayer(player)}
          >
            <img src={player.photo_url || 'https://placehold.co/80x80?text=Jugador'} alt={player.name} />
            <div className="player-info">
              <h3>{player.name}</h3>
              <p>Posición: {player.position}</p>
              <p>Edad: {player.age}</p>
              <p>Overall: {player.overall_rating}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PlayerPanel;