import React, { useState, useEffect } from 'react';
import { MapPin, Users, Trophy, Calendar, Sword, Shield, Zap } from 'lucide-react';
import '../styles/MMORPGPortal.css';

const MMORPGPortal = ({ playerData, supabaseClient, session, setView }) => {
  const [activeTab, setActiveTab] = useState('world');
  const [currentLocation, setCurrentLocation] = useState('estadio_central');
  const [nearbyPlayers, setNearbyPlayers] = useState([]);
  const [availableMatches, setAvailableMatches] = useState([]);
  const [playerStats, setPlayerStats] = useState(null);

  // Lugares del mundo MMORPG
  const locations = {
    estadio_central: {
      name: '🏟️ Estadio Central',
      description: 'El corazón del deporte Lupi. Encuentra partidos rápidos y desafíos.',
      activities: ['partido_rapido', 'entrenamiento', 'socializar'],
      players: 24
    },
    cancha_barrio: {
      name: '⚽ Cancha de Barrio',
      description: 'Donde nacen las leyendas. Partidos informales pero intensos.',
      activities: ['partido_amistoso', 'practicar_tiros', 'reclutar'],
      players: 12
    },
    gimnasio_elite: {
      name: '💪 Gimnasio de Élite',
      description: 'Mejora tus habilidades con entrenamiento especializado.',
      activities: ['entrenar_fuerza', 'mejorar_tecnica', 'competir'],
      players: 8
    },
    bosque_entrenamiento: {
      name: '🌲 Bosque de Entrenamiento',
      description: 'Rutas de obstáculos y desafíos de resistencia.',
      activities: ['carrera_obstaculos', 'entrenar_resistencia', 'explorar'],
      players: 6
    },
    playa_deportiva: {
      name: '🏖️ Playa Deportiva',
      description: 'Deportes playeros y ambiente relajado.',
      activities: ['voley_playa', 'futbol_playa', 'descansar'],
      players: 15
    }
  };

  useEffect(() => {
    loadNearbyPlayers();
    loadAvailableMatches();
    loadPlayerStats();
  }, [currentLocation]);

  const loadNearbyPlayers = async () => {
    try {
      // Simular jugadores cercanos (en una implementación real, usarías geolocalización)
      const mockPlayers = [
        { id: 1, username: 'Leyenda23', level: 25, sport: 'Fútbol', distance: '50m' },
        { id: 2, username: 'Campeona7', level: 18, sport: 'Vóley', distance: '120m' },
        { id: 3, username: 'Veloz99', level: 22, sport: 'Atletismo', distance: '80m' },
        { id: 4, username: 'Titan45', level: 30, sport: 'Rugby', distance: '200m' }
      ];
      setNearbyPlayers(mockPlayers);
    } catch (error) {
      console.error('Error loading nearby players:', error);
    }
  };

  const loadAvailableMatches = async () => {
    try {
      const mockMatches = [
        {
          id: 1,
          type: '⚽ Fútbol Rápido',
          location: 'Cancha 3',
          playersNeeded: 4,
          skillLevel: 'Intermedio',
          duration: '30 min'
        },
        {
          id: 2,
          type: '🏀 3x3 Básquet',
          location: 'Cancha Central',
          playersNeeded: 2,
          skillLevel: 'Principiante',
          duration: '20 min'
        },
        {
          id: 3,
          type: '🎾 Dobles Tenis',
          location: 'Cancha 2',
          playersNeeded: 1,
          skillLevel: 'Avanzado',
          duration: '45 min'
        }
      ];
      setAvailableMatches(mockMatches);
    } catch (error) {
      console.error('Error loading matches:', error);
    }
  };

  const loadPlayerStats = () => {
    setPlayerStats({
      matchesPlayed: 47,
      wins: 32,
      winRate: '68%',
      currentStreak: 5,
      bestStreak: 8,
      favoriteSport: 'Fútbol'
    });
  };

  const handleJoinMatch = (matchId) => {
    // Aquí implementarías la lógica para unirse a un partido
    alert(`Uniéndote al partido ${matchId}`);
  };

  const handleTravel = (newLocation) => {
    setCurrentLocation(newLocation);
  };

  const handleChallengePlayer = (playerId) => {
    // Lógica para desafiar a otro jugador
    alert(`Desafiando al jugador ${playerId}`);
  };

  return (
    <div className="mmorpg-portal">
      {/* Header del MMORPG */}
      <div className="portal-header">
        <h1>🎮 MUNDO LUPI MMORPG</h1>
        <div className="portal-subtitle">
          Explora, compite y conviértete en una leyenda del deporte
        </div>
      </div>

      <div className="portal-layout">
        {/* Panel izquierdo - Navegación y ubicación */}
        <div className="left-panel">
          {/* Ubicación actual */}
          <div className="location-card">
            <div className="location-header">
              <MapPin size={20} />
              <h3>Ubicación Actual</h3>
            </div>
            <div className="current-location">
              <h4>{locations[currentLocation].name}</h4>
              <p>{locations[currentLocation].description}</p>
              <div className="location-stats">
                <Users size={16} />
                <span>{locations[currentLocation].players} jugadores aquí</span>
              </div>
            </div>
          </div>

          {/* Navegación rápida */}
          <div className="quick-travel">
            <h4>Viaje Rápido</h4>
            {Object.keys(locations).map(locationKey => (
              <button
                key={locationKey}
                onClick={() => handleTravel(locationKey)}
                className={`travel-btn ${currentLocation === locationKey ? 'active' : ''}`}
              >
                {locations[locationKey].name}
              </button>
            ))}
          </div>

          {/* Estadísticas rápidas */}
          {playerStats && (
            <div className="quick-stats">
              <h4>Tus Estadísticas</h4>
              <div className="stat-grid">
                <div className="stat-item">
                  <span>Partidos</span>
                  <span className="stat-value">{playerStats.matchesPlayed}</span>
                </div>
                <div className="stat-item">
                  <span>Victorias</span>
                  <span className="stat-value">{playerStats.wins}</span>
                </div>
                <div className="stat-item">
                  <span>% Victorias</span>
                  <span className="stat-value">{playerStats.winRate}</span>
                </div>
                <div className="stat-item">
                  <span>Racha</span>
                  <span className="stat-value streak">{playerStats.currentStreak}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Contenido principal */}
        <div className="main-content">
          {/* Pestañas de navegación */}
          <div className="portal-tabs">
            <button 
              className={`portal-tab ${activeTab === 'world' ? 'active' : ''}`}
              onClick={() => setActiveTab('world')}
            >
              🌍 Mundo Abierto
            </button>
            <button 
              className={`portal-tab ${activeTab === 'matches' ? 'active' : ''}`}
              onClick={() => setActiveTab('matches')}
            >
              ⚽ Partidos
            </button>
            <button 
              className={`portal-tab ${activeTab === 'players' ? 'active' : ''}`}
              onClick={() => setActiveTab('players')}
            >
              👥 Jugadores
            </button>
            <button 
              className={`portal-tab ${activeTab === 'events' ? 'active' : ''}`}
              onClick={() => setActiveTab('events')}
            >
              🏆 Eventos
            </button>
          </div>

          {/* Contenido de las pestañas */}
          <div className="tab-content">
            {activeTab === 'world' && (
              <div className="world-view">
                <h3>Actividades en {locations[currentLocation].name}</h3>
                <div className="activities-grid">
                  {locations[currentLocation].activities.map((activity, index) => (
                    <div key={index} className="activity-card">
                      <div className="activity-icon">
                        {activity.includes('partido') && '⚽'}
                        {activity.includes('entrenar') && '💪'}
                        {activity.includes('socializar') && '💬'}
                        {activity.includes('practicar') && '🎯'}
                        {activity.includes('competir') && '🏆'}
                        {activity.includes('explorar') && '🗺️'}
                        {activity.includes('descansar') && '😌'}
                      </div>
                      <h4>{activity.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}</h4>
                      <button className="activity-btn">
                        Participar
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'matches' && (
              <div className="matches-view">
                <h3>Partidos Disponibles</h3>
                <div className="matches-list">
                  {availableMatches.map(match => (
                    <div key={match.id} className="match-card">
                      <div className="match-info">
                        <h4>{match.type}</h4>
                        <p>📍 {match.location}</p>
                        <div className="match-details">
                          <span>👥 {match.playersNeeded} jugadores necesarios</span>
                          <span>📊 Nivel: {match.skillLevel}</span>
                          <span>⏱️ {match.duration}</span>
                        </div>
                      </div>
                      <button 
                        onClick={() => handleJoinMatch(match.id)}
                        className="join-match-btn"
                      >
                        Unirse
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'players' && (
              <div className="players-view">
                <h3>Jugadores Cercanos</h3>
                <div className="players-list">
                  {nearbyPlayers.map(player => (
                    <div key={player.id} className="player-card">
                      <div className="player-info">
                        <div className="player-avatar">
                          {player.username.charAt(0).toUpperCase()}
                        </div>
                        <div className="player-details">
                          <h4>{player.username}</h4>
                          <p>Nivel {player.level} • {player.sport}</p>
                          <span className="distance">{player.distance}</span>
                        </div>
                      </div>
                      <div className="player-actions">
                        <button 
                          onClick={() => handleChallengePlayer(player.id)}
                          className="challenge-btn"
                        >
                          Desafiar
                        </button>
                        <button className="message-btn">
                          Mensaje
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'events' && (
              <div className="events-view">
                <h3>Eventos Especiales</h3>
                <div className="events-grid">
                  <div className="event-card featured">
                    <div className="event-badge">🔥 EN VIVO</div>
                    <h4>Torneo del Sol</h4>
                    <p>Competición de fútbol playero</p>
                    <div className="event-details">
                      <span>🏆 Premio: 5000 LupiCoins</span>
                      <span>👥 32/64 equipos</span>
                      <span>⏰ 2 horas restantes</span>
                    </div>
                    <button className="join-event-btn">
                      Unirse al Torneo
                    </button>
                  </div>
                  
                  <div className="event-card">
                    <h4>Maratón Nocturna</h4>
                    <p>Carrera de resistencia en el bosque</p>
                    <div className="event-details">
                      <span>🏆 Premio: 2000 LupiCoins</span>
                      <span>👥 45 participantes</span>
                      <span>⏰ Comienza en 3 horas</span>
                    </div>
                    <button className="join-event-btn">
                      Inscribirse
                    </button>
                  </div>
                  
                  <div className="event-card">
                    <h4>Clínica de Tenis</h4>
                    <p>Mejora tu técnica con profesionales</p>
                    <div className="event-details">
                      <span>🎯 +50 EXP garantizado</span>
                      <span>👥 8/12 plazas</span>
                      <span>⏰ Mañana 10:00</span>
                    </div>
                    <button className="join-event-btn">
                      Reservar Plaza
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Botón de volver */}
      <div className="portal-footer">
        <button 
          onClick={() => setView('dashboard')}
          className="back-to-dashboard-btn"
        >
          ← Volver al Dashboard
        </button>
      </div>
    </div>
  );
};

export default MMORPGPortal;