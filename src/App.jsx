import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import CharacterPanel from './components/CharacterPanel';
import Inventory from './components/Inventory';
import CombatPanel from './components/CombatPanel';
import StatsPanel from './components/StatsPanel';
import SkillsPanel from './components/SkillsPanel';
import QuestLog from './components/QuestLog';
import './App.css';

function App() {
  const [currentView, setCurrentView] = useState('character');
  const [character, setCharacter] = useState({
    name: 'Lupi',
    level: 1,
    class: 'Guerrero',
    health: 100,
    maxHealth: 100,
    mana: 50,
    maxMana: 50,
    avatar: '/path/to/avatar.png'
  });
  
  const [inventory, setInventory] = useState([]);
  const [enemies, setEnemies] = useState([]);
  
  // Efectos para cargar datos iniciales
  useEffect(() => {
    // Cargar datos del personaje, inventario, etc.
  }, []);
  
  const handleSaveGame = () => {
    // Lógica para guardar el juego
    console.log('Juego guardado');
  };
  
  const handleLoadGame = () => {
    // Lógica para cargar el juego
    console.log('Juego cargado');
  };
  
  const handleSettings = () => {
    // Lógica para ajustes
    console.log('Ajustes abiertos');
  };
  
  const handleUseItem = (item) => {
    // Lógica para usar un item
    console.log('Usando item:', item);
  };
  
  const handleEquipItem = (item) => {
    // Lógica para equipar un item
    console.log('Equipando item:', item);
  };
  
  const handleAttack = (enemy) => {
    // Lógica para atacar a un enemigo
    console.log('Atacando a:', enemy);
  };
  
  const renderCurrentView = () => {
    switch(currentView) {
      case 'character':
        return <CharacterPanel character={character} />;
      case 'inventory':
        return <Inventory 
                 items={inventory} 
                 onUseItem={handleUseItem}
                 onEquipItem={handleEquipItem}
               />;
      case 'combat':
        return <CombatPanel 
                 enemies={enemies} 
                 onAttack={handleAttack} 
               />;
      case 'stats':
        return <StatsPanel character={character} />;
      case 'skills':
        return <SkillsPanel character={character} />;
      case 'quests':
        return <QuestLog />;
      default:
        return <CharacterPanel character={character} />;
    }
  };

  return (
    <div className="App">
      <Header 
        gameTitle="Lupirpg" 
        onSave={handleSaveGame}
        onLoad={handleLoadGame}
        onSettings={handleSettings}
      />
      
      <div className="main-container">
        <nav className="navigation">
          <button 
            className={currentView === 'character' ? 'active' : ''}
            onClick={() => setCurrentView('character')}
          >
            Personaje
          </button>
          <button 
            className={currentView === 'inventory' ? 'active' : ''}
            onClick={() => setCurrentView('inventory')}
          >
            Inventario
          </button>
          <button 
            className={currentView === 'combat' ? 'active' : ''}
            onClick={() => setCurrentView('combat')}
          >
            Combate
          </button>
          <button 
            className={currentView === 'stats' ? 'active' : ''}
            onClick={() => setCurrentView('stats')}
          >
            Estadísticas
          </button>
          <button 
            className={currentView === 'skills' ? 'active' : ''}
            onClick={() => setCurrentView('skills')}
          >
            Habilidades
          </button>
          <button 
            className={currentView === 'quests' ? 'active' : ''}
            onClick={() => setCurrentView('quests')}
          >
            Misiones
          </button>
        </nav>
        
        <main className="content">
          {renderCurrentView()}
        </main>
      </div>
    </div>
  );
}

export default App;