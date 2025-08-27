import React from 'react';

const Header = ({ gameTitle, onSave, onLoad, onSettings }) => {
  return (
    <header className="game-header">
      <h1>{gameTitle}</h1>
      <div className="header-buttons">
        <button onClick={onSave}>Guardar</button>
        <button onClick={onLoad}>Cargar</button>
        <button onClick={onSettings}>Ajustes</button>
      </div>
    </header>
  );
};

export default Header;