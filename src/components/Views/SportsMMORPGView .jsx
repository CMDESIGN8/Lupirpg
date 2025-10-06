// SportsMMORPGView.jsx
import React, { useState, useEffect, useRef } from 'react';
import '../styles/SportsMMORPGView.css';

const SportsMMORPGView = ({ playerData, setView, supabaseClient, showMessage }) => {
  const [gameState, setGameState] = useState('lobby'); // lobby, training, match, tournament
  const [players, setPlayers] = useState([]);
  const [currentStadium, setCurrentStadium] = useState('main');
  const [selectedSport, setSelectedSport] = useState(playerData?.sport || 'fútbol');
  const [matchmaking, setMatchmaking] = useState(false);
  const [trainingProgress, setTrainingProgress] = useState(0);
  const [activeMinigame, setActiveMinigame] = useState(null);
  
  const gameCanvasRef = useRef(null);
  const animationRef = useRef(null);

  // Deportes disponibles
  const sports = [
    { id: 'fútbol', name: '⚽ Fútbol', color: '#2E8B57' },
    { id: 'baloncesto', name: '🏀 Baloncesto', color: '#FF6B35' },
    { id: 'tenis', name: '🎾 Tenis', color: '#4ECDC4' },
    { id: 'atletismo', name: '🏃 Atletismo', color: '#45B7D1' },
    { id: 'natación', name: '🏊 Natación', color: '#96CEB4' }
  ];

  // Estadios disponibles
  const stadiums = [
    { id: 'main', name: '🏟️ Estadio Central', sport: 'all' },
    { id: 'soccer', name: '⚽ Cancha de Fútbol', sport: 'fútbol' },
    { id: 'basketball', name: '🏀 Cancha de Baloncesto', sport: 'baloncesto' },
    { id: 'tennis', name: '🎾 Cancha de Tenis', sport: 'tenis' },
    { id: 'track', name: '🏃 Pista de Atletismo', sport: 'atletismo' },
    { id: 'pool', name: '🏊 Piscina Olímpica', sport: 'natación' }
  ];

  // Minijuegos de entrenamiento
  const minigames = [
    {
      id: 'penalty',
      name: '⚽ Tiros Penales',
      sport: 'fútbol',
      description: 'Anota 5 penales seguidos',
      difficulty: 'medium'
    },
    {
      id: 'free_throw',
      name: '🏀 Tiros Libres',
      sport: 'baloncesto',
      description: 'Encesta 10 tiros libres',
      difficulty: 'easy'
    },
    {
      id: 'serve',
      name: '🎾 Saques de Tenis',
      sport: 'tenis',
      description: 'Realiza 8 saques perfectos',
      difficulty: 'hard'
    },
    {
      id: 'sprint',
      name: '🏃 Carrera de Velocidad',
      sport: 'atletismo',
      description: 'Completa 100m en tiempo récord',
      difficulty: 'medium'
    },
    {
      id: 'swim',
      name: '🏊 Estilo Libre',
      sport: 'natación',
      description: 'Nada 50m lo más rápido posible',
      difficulty: 'hard'
    }
  ];

  useEffect(() => {
    loadOnlinePlayers();
    setupGameCanvas();
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  const loadOnlinePlayers = async () => {
    try {
      const { data, error } = await supabaseClient
        .from('players')
        .select('*')
        .eq('online', true)
        .limit(20);

      if (!error && data) {
        setPlayers(data);
      }
    } catch (error) {
      console.error('Error loading players:', error);
    }
  };

  const setupGameCanvas = () => {
    const canvas = gameCanvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    
    const render = () => {
      // Limpiar canvas
      ctx.fillStyle = '#1a1a2e';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Dibujar estadio según el deporte seleccionado
      drawStadium(ctx, canvas.width, canvas.height);

      // Dibujar jugadores
      drawPlayers(ctx, canvas.width, canvas.height);

      animationRef.current = requestAnimationFrame(render);
    };

    render();
  };

  const drawStadium = (ctx, width, height) => {
    switch(currentStadium) {
      case 'soccer':
        // Dibujar cancha de fútbol
        ctx.fillStyle = '#2E8B57';
        ctx.fillRect(50, 50, width - 100, height - 100);
        
        // Líneas de la cancha
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.strokeRect(50, 50, width - 100, height - 100);
        
        // Círculo central
        ctx.beginPath();
        ctx.arc(width / 2, height / 2, 60, 0, Math.PI * 2);
        ctx.stroke();
        break;

      case 'basketball':
        // Dibujar cancha de baloncesto
        ctx.fillStyle = '#FF6B35';
        ctx.fillRect(50, 50, width - 100, height - 100);
        break;

      default:
        // Estadio genérico
        ctx.fillStyle = '#16213e';
        ctx.fillRect(0, 0, width, height);
        
        // Gradas
        ctx.fillStyle = '#333';
        ctx.fillRect(30, 30, width - 60, 40);
        ctx.fillRect(30, height - 70, width - 60, 40);
    }
  };

  const drawPlayers = (ctx, width, height) => {
    players.forEach((player, index) => {
      const x = 100 + (index % 4) * 150;
      const y = 150 + Math.floor(index / 4) * 120;

      // Dibujar avatar del jugador
      ctx.fillStyle = player.id === playerData.id ? '#00ff88' : '#4ECDC4';
      ctx.beginPath();
      ctx.arc(x, y, 20, 0, Math.PI * 2);
      ctx.fill();

      // Nombre del jugador
      ctx.fillStyle = '#ffffff';
      ctx.font = '12px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(player.username, x, y + 40);
    });
  };

  const startMatchmaking = () => {
    setMatchmaking(true);
    showMessage('Buscando oponentes...');

    // Simular búsqueda de partida
    setTimeout(() => {
      setMatchmaking(false);
      setGameState('match');
      showMessage('¡Partida encontrada! Preparándose...');
    }, 3000);
  };

  const startTraining = (minigame) => {
    setActiveMinigame(minigame);
    setTrainingProgress(0);

    const interval = setInterval(() => {
      setTrainingProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          completeTraining(minigame);
          return 100;
        }
        return prev + 10;
      });
    }, 500);
  };

  const completeTraining = (minigame) => {
    showMessage(`¡Completaste ${minigame.name}! +50 EXP`);
    setTimeout(() => {
      setActiveMinigame(null);
      setTrainingProgress(0);
    }, 2000);
  };

  const joinTournament = () => {
    showMessage('Uniéndote al torneo...');
    setTimeout(() => {
      setGameState('tournament');
      showMessage('¡Bienvenido al Torneo Deportivo!');
    }, 1500);
  };

  const renderLobby = () => (
    <div className="mmorpg-lobby">
      <div className="lobby-header">
        <h2>🏆 MMORPG Deportivo</h2>
        <p>Elige tu actividad en el mundo deportivo</p>
      </div>

      <div className="sport-selection">
        <h3>Selecciona tu Deporte</h3>
        <div className="sports-grid">
          {sports.map(sport => (
            <button
              key={sport.id}
              className={`sport-btn ${selectedSport === sport.id ? 'active' : ''}`}
              onClick={() => setSelectedSport(sport.id)}
              style={{ borderColor: sport.color }}
            >
              {sport.name}
            </button>
          ))}
        </div>
      </div>

      <div className="stadium-selection">
        <h3>Estadios Disponibles</h3>
        <div className="stadiums-grid">
          {stadiums
            .filter(stadium => stadium.sport === 'all' || stadium.sport === selectedSport)
            .map(stadium => (
              <button
                key={stadium.id}
                className={`stadium-btn ${currentStadium === stadium.id ? 'active' : ''}`}
                onClick={() => setCurrentStadium(stadium.id)}
              >
                {stadium.name}
              </button>
            ))}
        </div>
      </div>

      <div className="game-actions">
        <button 
          className="action-btn primary"
          onClick={startMatchmaking}
          disabled={matchmaking}
        >
          {matchmaking ? 'Buscando rival...' : '🎯 Partida Rápida'}
        </button>

        <button 
          className="action-btn secondary"
          onClick={() => setGameState('training')}
        >
          🏋️ Entrenamiento
        </button>

        <button 
          className="action-btn tournament"
          onClick={joinTournament}
        >
          🏆 Torneo
        </button>
      </div>

      <div className="online-players">
        <h3>👥 Jugadores en Línea ({players.length})</h3>
        <div className="players-list">
          {players.map(player => (
            <div key={player.id} className="player-item">
              <span className={`player-status ${player.id === playerData.id ? 'you' : ''}`}>
                {player.username} {player.id === playerData.id && '(Tú)'}
              </span>
              <span className="player-level">Nvl {player.level}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderTraining = () => (
    <div className="training-view">
      <div className="training-header">
        <h2>🏋️ Centro de Entrenamiento</h2>
        <button 
          className="back-btn"
          onClick={() => setGameState('lobby')}
        >
          ← Volver al Lobby
        </button>
      </div>

      {activeMinigame ? (
        <div className="active-minigame">
          <h3>{activeMinigame.name}</h3>
          <p>{activeMinigame.description}</p>
          
          <div className="training-progress">
            <div 
              className="progress-bar"
              style={{ width: `${trainingProgress}%` }}
            >
              <span>{trainingProgress}%</span>
            </div>
          </div>

          <div className="minigame-instructions">
            <p>💡 Mantén presionado el botón para cargar potencia</p>
            <p>🎯 Apunta cuidadosamente antes de soltar</p>
          </div>
        </div>
      ) : (
        <div className="minigames-grid">
          {minigames
            .filter(game => game.sport === selectedSport)
            .map(game => (
              <div key={game.id} className="minigame-card">
                <h4>{game.name}</h4>
                <p>{game.description}</p>
                <span className={`difficulty ${game.difficulty}`}>
                  Dificultad: {game.difficulty}
                </span>
                <button
                  className="start-minigame"
                  onClick={() => startTraining(game)}
                >
                  Comenzar
                </button>
              </div>
            ))}
        </div>
      )}
    </div>
  );

  const renderMatch = () => (
    <div className="match-view">
      <div className="match-header">
        <h2>⚽ Partida en Progreso</h2>
        <div className="match-score">
          <span className="score">0 - 0</span>
          <span className="timer">05:00</span>
        </div>
      </div>

      <div className="match-field">
        <canvas 
          ref={gameCanvasRef}
          width={800}
          height={500}
          className="game-canvas"
        />
      </div>

      <div className="match-controls">
        <button className="control-btn">⬆️ Pase</button>
        <button className="control-btn">⬇️ Defensa</button>
        <button className="control-btn">⬅️ Izquierda</button>
        <button className="control-btn">➡️ Derecha</button>
        <button className="control-btn shoot">🎯 Disparo</button>
      </div>

      <div className="match-actions">
        <button 
          className="action-btn"
          onClick={() => setGameState('lobby')}
        >
          🏃 Abandonar Partida
        </button>
      </div>
    </div>
  );

  const renderTournament = () => (
    <div className="tournament-view">
      <div className="tournament-header">
        <h2>🏆 Torneo Deportivo</h2>
        <button 
          className="back-btn"
          onClick={() => setGameState('lobby')}
        >
          ← Volver al Lobby
        </button>
      </div>

      <div className="tournament-bracket">
        <div className="bracket-round">
          <h3>Cuartos de Final</h3>
          <div className="bracket-match">
            <div className="team">Equipo A vs Equipo B</div>
            <div className="score">2 - 1</div>
          </div>
          <div className="bracket-match">
            <div className="team">Tu Equipo vs Rival X</div>
            <div className="score upcoming">Próximo</div>
          </div>
        </div>

        <div className="bracket-round">
          <h3>Semifinales</h3>
          <div className="bracket-match">
            <div className="team">Por definir</div>
            <div className="score">-</div>
          </div>
        </div>

        <div className="bracket-round">
          <h3>Final</h3>
          <div className="bracket-match champion">
            <div className="team">🏆 Campeón</div>
            <div className="score">-</div>
          </div>
        </div>
      </div>

      <div className="tournament-info">
        <h3>Premios del Torneo</h3>
        <ul>
          <li>🥇 1er Lugar: 1000 LupiCoins + Item Épico</li>
          <li>🥈 2do Lugar: 500 LupiCoins + Item Raro</li>
          <li>🥉 3er Lugar: 250 LupiCoins</li>
        </ul>
      </div>

      <button className="action-btn primary">
        🎯 Comenzar Partida del Torneo
      </button>
    </div>
  );

  return (
    <div className="sports-mmorpg-view">
      <div className="mmorpg-container">
        {gameState === 'lobby' && renderLobby()}
        {gameState === 'training' && renderTraining()}
        {gameState === 'match' && renderMatch()}
        {gameState === 'tournament' && renderTournament()}
      </div>

      <div className="mmorpg-footer">
        <button 
          className="back-to-dashboard"
          onClick={() => setView('dashboard')}
        >
          ← Volver al Dashboard
        </button>
      </div>
    </div>
  );
};

export default SportsMMORPGView;