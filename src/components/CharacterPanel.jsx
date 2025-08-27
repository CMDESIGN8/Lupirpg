import React from 'react';

const CharacterPanel = ({ character, equipment, onEquipItem }) => {
  return (
    <div className="character-panel">
      <h2>Personaje</h2>
      <div className="character-info">
        <img src={character.avatar} alt={character.name} className="character-avatar" />
        <div className="character-details">
          <h3>{character.name}</h3>
          <p>Nivel: {character.level}</p>
          <p>Clase: {character.class}</p>
          <p>Vida: {character.health}/{character.maxHealth}</p>
          <p>Mana: {character.mana}/{character.maxMana}</p>
        </div>
      </div>
      
      <div className="equipment-slots">
        <h3>Equipamiento</h3>
        {/* Renderizar slots de equipamiento aquí */}
      </div>
    </div>
  );
};

export default CharacterPanel;