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
    avatar: 'https://placehold.co/100x100?text=Lupi',
    stats: {
      strength: 15,
      dexterity: 12,
      intelligence: 8,
      constitution: 14,
      wisdom: 10,
      charisma: 13
    },
    skills: [
      { name: 'Espadas', level: 5 },
      { name: 'Arquería', level: 3 },
      { name: 'Magia', level: 2 },
      { name: 'Sigilo', level: 4 }
    ]
  });
  
  const [inventory, setInventory] = useState([
    { id: 1, name: 'Poción de vida', description: 'Restaura 50 puntos de salud', count: 3 },
    { id: 2, name: 'Poción de maná', description: 'Restaura 30 puntos de maná', count: 2 },
    { id: 3, name: 'Espada de hierro', description: 'Arma cuerpo a cuerpo', count: 1 },
    { id: 4, name: 'Arco corto', description: 'Arma a distancia', count: 1 },
    { id: 5, name: 'Flechas', description: 'Munición para arco', count: 20 }
  ]);
  
  const [enemies, setEnemies] = useState([
    { id: 1, name: 'Goblin', health: 30, maxHealth: 30, image: 'https://placehold.co/80x80?text=Goblin' },
    { id: 2, name: 'Orco', health: 50, maxHealth: 50, image: 'https://placehold.co/80x80?text=Orco' }
  ]);
  
  const handleSaveGame = () => {
    console.log('Juego guardado');
  };
  
  const handleLoadGame = () => {
    console.log('Juego cargado');
  };
  
  const handleSettings = () => {
    console.log('Ajustes abiertos');
  };
  
  const handleUseItem = (item) => {
    console.log('Usando item:', item);
    // Lógica para usar el item
  };
  
  const handleEquipItem = (item) => {
    console.log('Equipando item:', item);
    // Lógica para equipar el item
  };
  
  const handleDropItem = (item) => {
    console.log('Tirando item:', item);
    // Lógica para tirar el item
    setInventory(prev => prev.filter(i => i.id !== item.id));
  };
  
  const handleAttack = (enemy) => {
    console.log('Atacando a:', enemy);
    // Lógica de ataque
    setEnemies(prev => prev.map(e => 
      e.id === enemy.id ? {...e, health: Math.max(0, e.health - 10)} : e
    ));
  };
  
  const handleFlee = () => {
    console.log('Huyendo del combate');
    setCurrentView('character');
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
                 onDropItem={handleDropItem}
               />;
      case 'combat':
        return <CombatPanel 
                 enemies={enemies} 
                 onAttack={handleAttack}
                 onFlee={handleFlee}
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