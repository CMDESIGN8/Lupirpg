import React from 'react';

const SkillsPanel = ({ character }) => {
  const skills = character.skills || [
    { name: 'Espadas', level: 5 },
    { name: 'Arquería', level: 3 },
    { name: 'Magia', level: 2 },
    { name: 'Sigilo', level: 4 }
  ];

  return (
    <div className="skills-panel">
      <h2>Habilidades</h2>
      <div className="skills-list">
        {skills.map((skill, index) => (
          <div key={index} className="skill-item">
            <span className="skill-name">{skill.name}</span>
            <div className="skill-level-container">
              <div 
                className="skill-level-bar" 
                style={{width: `${(skill.level / 10) * 100}%`}}
              ></div>
              <span className="skill-level-text">Nivel {skill.level}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SkillsPanel;