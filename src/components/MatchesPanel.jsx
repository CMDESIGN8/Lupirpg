import React, { useState } from 'react';
import { useMatches } from '../hooks/useSupabase';

const MatchesPanel = () => {
  const { matches, loading } = useMatches();
  const [selectedMatch, setSelectedMatch] = useState(null);

  if (loading) return <div>Cargando partidos...</div>;

  const simulateMatch = (match) => {
    // Simular resultado de partido
    const homeGoals = Math.floor(Math.random() * 5);
    const awayGoals = Math.floor(Math.random() * 4);
    
    return {
      ...match,
      home_goals: homeGoals,
      away_goals: awayGoals,
      played: true
    };
  };

  const handlePlayMatch = (match) => {
    const result = simulateMatch(match);
    setSelectedMatch(result);
  };

  return (
    <div className="matches-panel">
      <h2>Partidos</h2>
      
      <div className="matches-list">
        {matches.map(match => (
          <div key={match.id} className="match-item">
            <div className="teams">
              <span className="team">{match.home_team}</span>
              <span className="vs">vs</span>
              <span className="team">{match.away_team}</span>
            </div>
            
            <div className="match-details">
              <span className="date">{new Date(match.date).toLocaleDateString()}</span>
              <span className="competition">{match.competition}</span>
            </div>
            
            <button 
              onClick={() => handlePlayMatch(match)}
              className="play-button"
            >
              Jugar Partido
            </button>
          </div>
        ))}
      </div>
      
      {selectedMatch && (
        <div className="match-result">
          <h3>Resultado del Partido</h3>
          <div className="score">
            {selectedMatch.home_team} {selectedMatch.home_goals} - {selectedMatch.away_goals} {selectedMatch.away_team}
          </div>
          <button onClick={() => setSelectedMatch(null)}>Cerrar</button>
        </div>
      )}
    </div>
  );
};

export default MatchesPanel;