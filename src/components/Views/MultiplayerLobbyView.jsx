// src/components/Views/MultiplayerLobbyView.jsx

import React, { useState, useEffect, useCallback, useRef } from 'react';
import LoadingScreen from '../UI/LoadingScreen';
import '../styles/MultiplayerLobby.css';

const MultiplayerLobbyView = ({ currentUser, setView, supabaseClient, playerData, showMessage }) => {
  const [loading, setLoading] = useState(true);
  const [players, setPlayers] = useState({});
  const [equippedAvatar, setEquippedAvatar] = useState(null);
  const [showMobileControls, setShowMobileControls] = useState(false);

  const playerPositionRef = useRef({ x: 0, y: 0 });
  const channelRef = useRef(null);
  const cleanupIntervalRef = useRef(null);
  const heartbeatIntervalRef = useRef(null);
  const moveTimeoutRef = useRef(null);
  const touchStartRef = useRef({ x: 0, y: 0 });
  const particlesRef = useRef([]);

  const userToUse = currentUser || playerData;
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

  // ============================
  // Partículas de fondo estilo neón
  // ============================
  const generateParticles = (count, width, height) => {
    const particles = [];
    for (let i = 0; i < count; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        radius: Math.random() * 3 + 1,
        dx: (Math.random() - 0.5) * 0.5,
        dy: (Math.random() - 0.5) * 0.5,
        color: `hsl(${Math.random() * 360}, 100%, 50%)`
      });
    }
    return particles;
  };

  useEffect(() => {
    const canvas = document.getElementById('particles-canvas');
    if (canvas) {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      particlesRef.current = generateParticles(80, canvas.width, canvas.height);
    }
  }, []);

  const animateParticles = () => {
    const canvas = document.getElementById('particles-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    particlesRef.current.forEach(p => {
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fillStyle = p.color;
      ctx.shadowColor = p.color;
      ctx.shadowBlur = 10;
      ctx.fill();

      p.x += p.dx;
      p.y += p.dy;

      if (p.x < 0 || p.x > canvas.width) p.dx *= -1;
      if (p.y < 0 || p.y > canvas.height) p.dy *= -1;
    });

    requestAnimationFrame(animateParticles);
  };
  useEffect(() => animateParticles(), []);

  // ============================
  // Fetch avatar equipado
  // ============================
  useEffect(() => {
    const fetchEquippedAvatar = async () => {
      if (!userToUse?.id) return;
      try {
        const { data, error } = await supabaseClient
          .from('player_avatars')
          .select(`avatar_id, avatars(image_url, name)`)
          .eq('player_id', userToUse.id)
          .eq('is_equipped', true)
          .single();

        if (!error && data) setEquippedAvatar(data.avatars);
      } catch (err) {
        console.error('Error fetching avatar:', err);
      }
    };
    fetchEquippedAvatar();
  }, [supabaseClient, userToUse]);

  // ============================
  // Movimiento jugador
  // ============================
  const movePlayer = useCallback(async (dx, dy) => {
    if (!userToUse?.id) return;
    const currentPos = playerPositionRef.current;
    const newX = Math.max(0, Math.min(14, currentPos.x + dx));
    const newY = Math.max(0, Math.min(14, currentPos.y + dy));
    if (newX === currentPos.x && newY === currentPos.y) return;
    playerPositionRef.current = { x: newX, y: newY };

    setPlayers(prev => {
      const currentPlayer = prev[userToUse.id]?.[0];
      if (!currentPlayer) return prev;
      return {
        ...prev,
        [userToUse.id]: [{ ...currentPlayer, x: newX, y: newY, last_activity: new Date().toISOString() }]
      };
    });

    try {
      const { error } = await supabaseClient
        .from('room_players')
        .update({ x: newX, y: newY, last_activity: new Date().toISOString() })
        .eq('user_id', userToUse.id);
      if (error) console.error('Move error:', error);
    } catch (error) {
      console.error('Move error:', error);
    }
  }, [supabaseClient, userToUse]);

  // ============================
  // Teclado y touch
  // ============================
  const handleKeyDown = useCallback((e) => {
    if (!['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','w','a','s','d'].includes(e.key.toLowerCase())) return;
    e.preventDefault();
    if (moveTimeoutRef.current) return;

    let dx = 0, dy = 0;
    switch(e.key.toLowerCase()){
      case 'arrowup': case 'w': dy=-1; break;
      case 'arrowdown': case 's': dy=1; break;
      case 'arrowleft': case 'a': dx=-1; break;
      case 'arrowright': case 'd': dx=1; break;
    }
    movePlayer(dx, dy);
    moveTimeoutRef.current = setTimeout(()=> moveTimeoutRef.current=null, 150);
  }, [movePlayer]);

  const handleTouchStart = useCallback((e)=>{touchStartRef.current={x:e.touches[0].clientX,y:e.touches[0].clientY};},[]);
  const handleTouchEnd = useCallback((e)=>{
    const start = touchStartRef.current; if(!start) return;
    const touch = e.changedTouches[0];
    const dx = touch.clientX - start.x;
    const dy = touch.clientY - start.y;
    if(Math.abs(dx) > Math.abs(dy) && Math.abs(dx)>30) movePlayer(dx>0?1:-1,0);
    if(Math.abs(dy) > Math.abs(dx) && Math.abs(dy)>30) movePlayer(0,dy>0?1:-1);
    touchStartRef.current=null;
  },[movePlayer]);

  useEffect(()=>{
    window.addEventListener('keydown',handleKeyDown);
    if(isMobile){
      window.addEventListener('touchstart',handleTouchStart,{passive:true});
      window.addEventListener('touchend',handleTouchEnd,{passive:true});
    }
    return ()=>{
      window.removeEventListener('keydown',handleKeyDown);
      if(isMobile){
        window.removeEventListener('touchstart',handleTouchStart);
        window.removeEventListener('touchend',handleTouchEnd);
      }
    };
  },[handleKeyDown,handleTouchStart,handleTouchEnd,isMobile]);

  // ============================
  // Join room & Realtime setup
  // ============================
  const joinRoom = useCallback(async () => {
    if (!userToUse?.id) return false;
    const avatarUrl = equippedAvatar?.image_url || '/default-avatar.png';
    const x = Math.floor(Math.random()*15), y=Math.floor(Math.random()*15);
    playerPositionRef.current={x,y};

    const { error: upsertError } = await supabaseClient.from('room_players')
      .upsert({ user_id:userToUse.id, username:userToUse.username||'Jugador', avatar_url:avatarUrl, x, y, last_activity:new Date().toISOString() }, { onConflict:'user_id' });
    if(upsertError) { showMessage('Error al unirse: '+upsertError.message); return false; }

    const cutoff = new Date(Date.now()-2*60*1000).toISOString();
    const { data, error } = await supabaseClient.from('room_players').select('*').gte('last_activity',cutoff);
    if(!error && data){
      const obj={};
      data.forEach(p=>obj[p.user_id]=[p]);
      setPlayers(obj);
    }
    return true;
  },[supabaseClient,userToUse,equippedAvatar,showMessage]);

  // ============================
  // Render mapa con animación de avatares
  // ============================
  const classifyPlayers = useCallback(()=>{
    const now=new Date();
    const all=Object.values(players).flat();
    return {
      activePlayers: all.filter(p=>p.last_activity && (now-new Date(p.last_activity))<60000),
      inactivePlayers: all.filter(p=>p.last_activity && (now-new Date(p.last_activity))>=60000 && (now-new Date(p.last_activity))<120000)
    };
  },[players]);

  const renderMapCell=(x,y)=>{
    const {activePlayers}=classifyPlayers();
    const playersInCell = activePlayers.filter(p=>p.x===x && p.y===y);
    return (
      <div key={`${x}-${y}`} className={`lobby-map-cell ${playersInCell.length>0?'occupied':''}`}>
        {playersInCell.map(player=>(
          <div key={player.user_id} className={`lobby-player-marker ${player.user_id===userToUse?.id?'my-player':'other-player'}`}>
            {player.avatar_url ? <img src={player.avatar_url} alt={player.username} className="lobby-player-avatar"/> :
              <div className="lobby-player-initial">{player.username?.charAt(0)?.toUpperCase()||'?'}</div>}
          </div>
        ))}
      </div>
    );
  };

  if(loading) return <LoadingScreen message="Conectando al Mundo Lupi..." />;
  if(!userToUse) return <div>Error cargando usuario</div>;
  const {activePlayers,inactivePlayers}=classifyPlayers();

  return (
    <div className="lobby-container">
      {/* Partículas de fondo */}
      <canvas id="particles-canvas" className="particles-background"></canvas>

      <div className="lobby-header">
        <h1>🏟️ Mundo Lupi</h1>
        <p>¡Muévete con flechas o WASD y encuentra a otros jugadores!</p>
      </div>

      <div className="lobby-map-container">
        <div className="lobby-game-map">
          {Array.from({length:15},(_,y)=>(
            <div key={y} className="lobby-map-row">
              {Array.from({length:15},(_,x)=>renderMapCell(x,y))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default MultiplayerLobbyView;
