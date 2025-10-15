// src/components/game/LupiMiniGame.jsx
import React, { useState, useEffect } from "react";
import '../styles/lupigame.css';

const LupiMiniGame = ({ onFinish, onCancel }) => {
  const [timeLeft, setTimeLeft] = useState(60);
  const [score, setScore] = useState(0);
  const [items, setItems] = useState([]);
  const [gameStatus, setGameStatus] = useState('playing'); // playing, won, lost

  // Elementos de fútbol para buscar
  const footballItems = [
    { id: 1, name: "Pelota", icon: "⚽", points: 10 },
    { id: 2, name: "Botines", icon: "👟", points: 15 },
    { id: 3, name: "Guantes", icon: "🧤", points: 12 },
    { id: 4, name: "Silbato", icon: "📣", points: 8 },
    { id: 5, name: "Red", icon: "🥅", points: 20 },
    { id: 6, name: "Trofeo", icon: "🏆", points: 25 },
    { id: 7, name: "Medalla", icon: "🎖️", points: 18 },
    { id: 8, name: "Bandera", icon: "🚩", points: 7 }
  ];

  // Inicializar el juego
  useEffect(() => {
    initializeGame();
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          setGameStatus('lost');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const initializeGame = () => {
    // Crear una cuadrícula de 5x5 con algunos elementos ocultos
    const gridSize = 25;
    const hiddenItemsCount = 8;
    const newItems = [];
    
    // Llenar con lugares vacíos
    for (let i = 0; i < gridSize; i++) {
      newItems.push({ type: 'empty', found: false });
    }
    
    // Colocar elementos aleatorios
    const usedPositions = new Set();
    for (let i = 0; i < hiddenItemsCount; i++) {
      let position;
      do {
        position = Math.floor(Math.random() * gridSize);
      } while (usedPositions.has(position));
      
      usedPositions.add(position);
      newItems[position] = { 
        ...footballItems[i], 
        type: 'item', 
        found: false 
      };
    }
    
    setItems(newItems);
  };

  const handleItemClick = (index) => {
    if (gameStatus !== 'playing') return;
    
    const newItems = [...items];
    if (newItems[index].type === 'item' && !newItems[index].found) {
      newItems[index].found = true;
      setItems(newItems);
      
      const points = newItems[index].points;
      setScore(prev => {
        const newScore = prev + points;
        
        // Verificar si ganó
        const allFound = newItems.filter(item => item.type === 'item')
                                .every(item => item.found);
        if (allFound) {
          setGameStatus('won');
        }
        
        return newScore;
      });
    }
  };

  const getGameMessage = () => {
    switch (gameStatus) {
      case 'won':
        return `¡Ganaste! Encontraste todos los objetos. Puntos: ${score}`;
      case 'lost':
        return `¡Tiempo agotado! Puntos: ${score}`;
      default:
        return `Encuentra todos los objetos de fútbol. Tiempo: ${timeLeft}s`;
    }
  };

  const handleFinish = () => {
    // Calcular recompensa basada en el puntaje
    const reward = {
      coins: Math.floor(score / 3),
      items: footballItems.filter((_, index) => index < Math.floor(score / 20))
    };
    
    onFinish(reward);
  };

  return (
    <div className="mini-game-container">
      <div className="game-header">
        <h2>Búsqueda de Objetos de Fútbol</h2>
        <div className="game-stats">
          <div className="stat">Tiempo: {timeLeft}s</div>
          <div className="stat">Puntos: {score}</div>
        </div>
        <button className="modal-close" onClick={onCancel}>×</button>
      </div>
      
      <div className="game-message">{getGameMessage()}</div>
      
      <div className="game-grid">
        {items.map((item, index) => (
          <div
            key={index}
            className={`grid-cell ${item.found ? 'found' : ''} ${item.type}`}
            onClick={() => handleItemClick(index)}
          >
            {item.found && item.type === 'item' ? (
              <div className="item-found">
                <span className="item-icon">{item.icon}</span>
                <span className="item-points">+{item.points}</span>
              </div>
            ) : (
              <div className="item-hidden">?</div>
            )}
          </div>
        ))}
      </div>
      
      <div className="game-controls">
        {gameStatus !== 'playing' ? (
          <button className="finish-button" onClick={handleFinish}>
            Reclamar Recompensa
          </button>
        ) : null}
        
        <button className="cancel-button" onClick={onCancel}>
          Salir del Juego
        </button>
      </div>
      
      <div className="items-to-find">
        <h3>Objetos por encontrar:</h3>
        <div className="items-list">
          {footballItems.map(item => (
            <div key={item.id} className="item-info">
              <span className="item-icon">{item.icon}</span>
              <span className="item-name">{item.name}</span>
              <span className="item-points">{item.points} pts</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default LupiMiniGame;