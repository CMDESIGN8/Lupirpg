import React, { useState } from 'react';
import Header from './components/Header';
import PlayerPanel from './components/PlayerPanel';
import TeamPanel from './components/TeamPanel';
import TrainingPanel from './components/TrainingPanel';
import MatchesPanel from './components/MatchesPanel';
import TransfersPanel from './components/TransfersPanel';
import StatsPanel from './components/StatsPanel';
import SkillsPanel from './components/SkillsPanel';
import './App.css';

function App() {
  const [currentView, setCurrentView] = useState('team');
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [budget, setBudget] = useState(10000000); // 10M de presupuesto inicial

  const handleSelectPlayer = (player) => {
    setSelectedPlayer(player);
    setCurrentView('training');
  };

  const renderCurrentView = () => {
    switch(currentView) {
      case 'players':
        return <PlayerPanel onSelectPlayer={handleSelectPlayer} />;
      case 'team':
        return <TeamPanel />;
      case 'training':
        return <TrainingPanel player={selectedPlayer} />;
      case 'matches':
        return <MatchesPanel />;
      case 'transfers':
        return <TransfersPanel budget={budget} />;
      case 'stats':
        return <StatsPanel player={selectedPlayer} />;
      case 'skills':
        return <SkillsPanel player={selectedPlayer} />;
      default:
        return <TeamPanel />;
    }
  };

  return (
    <div className="App">
      <Header 
        gameTitle="Fútbol RPG" 
        budget={budget}
      />
      
      <div className="main-container">
        <nav className="navigation">
          <button 
            className={currentView === 'team' ? 'active' : ''}
            onClick={() => setCurrentView('team')}
          >
            Mi Equipo
          </button>
          <button 
            className={currentView === 'players' ? 'active' : ''}
            onClick={() => setCurrentView('players')}
          >
            Jugadores
          </button>
          <button 
            className={currentView === 'training' ? 'active' : ''}
            onClick={() => setCurrentView('training')}
          >
            Entrenamiento
          </button>
          <button 
            className={currentView === 'matches' ? 'active' : ''}
            onClick={() => setCurrentView('matches')}
          >
            Partidos
          </button>
          <button 
            className={currentView === 'transfers' ? 'active' : ''}
            onClick={() => setCurrentView('transfers')}
          >
            Fichajes
          </button>
          <button 
            className={currentView === 'stats' ? 'active' : ''}
            onClick={() => setCurrentView('stats')}
          >
            Estadísticas
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