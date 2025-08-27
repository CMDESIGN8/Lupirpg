import React, { useState } from 'react';
import { useTeams } from '../hooks/useSupabase';

const TeamPanel = () => {
  const { teams, loading } = useTeams();
  const [selectedTeam, setSelectedTeam] = useState(null);

  if (loading) return <div>Cargando equipos...</div>;

  return (
    <div className="team-panel">
      <h2>Mi Equipo</h2>
      
      {selectedTeam ? (
        <div className="team-details">
          <h3>{selectedTeam.name}</h3>
          <img src={selectedTeam.logo_url} alt={selectedTeam.name} />
          <p>Táctica: {selectedTeam.tactic}</p>
          <p>Formación: {selectedTeam.formation}</p>
          <button onClick={() => setSelectedTeam(null)}>Volver</button>
        </div>
      ) : (
        <div className="teams-list">
          {teams.map(team => (
            <div 
              key={team.id} 
              className="team-item"
              onClick={() => setSelectedTeam(team)}
            >
              <img src={team.logo_url} alt={team.name} />
              <span>{team.name}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TeamPanel;