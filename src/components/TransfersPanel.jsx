import React, { useState } from 'react';
import { usePlayers } from '../hooks/useSupabase';
import { supabase } from '../utils/supabaseClient';

const TransfersPanel = ({ budget }) => {
  const { players, loading, refetch } = usePlayers();
  const [transferList, setTransferList] = useState([]);

  const handleBuyPlayer = async (player) => {
    if (budget < player.value) {
      alert('No tienes suficiente presupuesto');
      return;
    }
    
    try {
      // Aquí iría la lógica para comprar el jugador
      const { error } = await supabase
        .from('transfers')
        .insert({
          player_id: player.id,
          from_team: player.team,
          to_team: 'Tu Equipo',
          amount: player.value,
          date: new Date().toISOString()
        });
      
      if (error) throw error;
      
      alert(`¡Has comprado a ${player.name} por $${player.value}!`);
      refetch();
    } catch (error) {
      console.error('Error en la transferencia:', error.message);
    }
  };

  if (loading) return <div>Cargando mercado de fichajes...</div>;

  return (
    <div className="transfers-panel">
      <h2>Mercado de Fichajes</h2>
      <div className="budget">Presupuesto: ${budget}</div>
      
      <div className="transfer-list">
        {players.map(player => (
          <div key={player.id} className="transfer-item">
            <img src={player.photo_url} alt={player.name} />
            <div className="player-info">
              <h3>{player.name}</h3>
              <p>{player.position} | {player.team}</p>
              <p>Valor: ${player.value}</p>
            </div>
            <button 
              onClick={() => handleBuyPlayer(player)}
              disabled={budget < player.value}
            >
              Fichar
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TransfersPanel;