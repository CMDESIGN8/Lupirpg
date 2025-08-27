import React from 'react';

const SkillsPanel = ({ player }) => {
  if (!player) {
    return (
      <div className="skills-panel">
        <h2>Habilidades del Jugador</h2>
        <p>Selecciona un jugador para ver sus habilidades</p>
      </div>
    );
  }

  const skills = [
    { name: 'Disparo lejano', value: player.long_shots || 0 },
    { name: 'Visión de juego', value: player.vision || 0 },
    { name: 'Centros', value: player.crossing || 0 },
    { name: 'Fuerza', value: player.strength || 0 },
    { name: 'Agresividad', value: player.aggression || 0 },
    { name: 'Posicionamiento', value: player.positioning || 0 },
  ];

  return (
    <div className="skills-panel">
      <h2>Habilidades de {player.name}</h2>
      <div className="skills-list">
        {skills.map((skill, index) => (
          <div key={index} className="skill-item">
            <span className="skill-name">{skill.name}</span>
            <div className="skill-bar-container">
              <div 
                className="skill-bar" 
                style={{width: `${skill.value}%`}}
              ></div>
              <span className="skill-value">{skill.value}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SkillsPanel;