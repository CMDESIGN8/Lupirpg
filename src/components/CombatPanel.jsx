import React from 'react';

const CombatPanel = ({ enemies, onAttack, onUseSkill, onFlee }) => {
  return (
    <div className="combat-panel">
      <h2>Combate</h2>
      <div className="enemies-container">
        {enemies.map((enemy, index) => (
          <div key={index} className="enemy">
            <img src={enemy.image} alt={enemy.name} />
            <div className="enemy-health">
              <div 
                className="health-bar" 
                style={{width: `${(enemy.health / enemy.maxHealth) * 100}%`}}
              ></div>
            </div>
            <button onClick={() => onAttack(enemy)}>Atacar</button>
          </div>
        ))}
      </div>
      
      <div className="combat-actions">
        <button onClick={onFlee}>Huir</button>
        {/* Aquí irían los botones de habilidades */}
      </div>
    </div>
  );
};

export default CombatPanel;