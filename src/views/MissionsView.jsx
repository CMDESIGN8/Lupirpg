import React from 'react';
import ThemedButton from '../components/ThemedButton';

export default function MissionsView({ missionsData, handleCompleteMission, loading, setView, message }) {
  return (
    <div className="app-container">
      <h2>Misiones</h2>
      {message && <div className="message-box">{message}</div>}
      {loading ? <p>Cargando misiones...</p> : (
        missionsData.length > 0 ? (
          missionsData.map(mission => (
            <div key={mission.id}>
              <h3>{mission.name}</h3>
              <p>{mission.description}</p>
              <p>Recompensa: {mission.xp_reward} XP + {mission.skill_points_reward} puntos</p>
              <ThemedButton
                onClick={() => handleCompleteMission(mission)}
                disabled={mission.is_completed || loading}
              >
                {mission.is_completed ? 'Misión Completada' : 'Completar Misión'}
              </ThemedButton>
            </div>
          ))
        ) : <p>No hay misiones disponibles.</p>
      )}
      <button onClick={() => setView('dashboard')}>Volver</button>
    </div>
  );
}
