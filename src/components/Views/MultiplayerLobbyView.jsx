// src/components/Views/MultiplayerLobbyView.jsx
import React, { useState, useEffect, useRef } from "react";
import "../../styles/MultiplayerLobby.css";
import { supabaseClient } from "../../services/supabase";
import playerSprite from "../../assets/player.png";
import mapBackground from "../../assets/map.png";
import MessageDisplay from "../UI/MessageDisplay";
import { MessageCircle, X } from "lucide-react";

// Configuración de sprites y animación
const spriteWidth = 32;
const spriteHeight = 48;
const framesPerDirection = 3;
const animationSpeed = 120; // ms
const directionMap = { down: 0, left: 1, right: 2, up: 3 };

// Partículas de fondo
const generateParticles = (count, width, height) => {
  const particles = [];
  for (let i = 0; i < count; i++) {
    particles.push({
      x: Math.random() * width,
      y: Math.random() * height,
      radius: Math.random() * 3 + 1,
      dx: (Math.random() - 0.5) * 0.5,
      dy: (Math.random() - 0.5) * 0.5,
      color: `hsl(${Math.random()*360}, 100%, 50%)`
    });
  }
  return particles;
};

const MultiplayerLobbyView = ({ currentUser, playerData, onClose }) => {
  const [users, setUsers] = useState([]);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const canvasRef = useRef(null);
  const requestRef = useRef();
  const channelRef = useRef(null);
  const keysPressed = useRef({});
  const animationData = useRef({});
  const spriteImage = useRef(new Image());
  const mapImage = useRef(new Image());
  const particlesRef = useRef([]);

  // Cargar imágenes
  useEffect(() => {
    spriteImage.current.src = playerSprite;
    mapImage.current.src = mapBackground;
    const canvas = canvasRef.current;
    particlesRef.current = generateParticles(80, canvas.width, canvas.height);
  }, []);

  // Presencia de usuarios Supabase
  useEffect(() => {
    const channel = supabaseClient.channel("lupi_common_room", {
      config: { presence: { key: currentUser.id } }
    });
    channelRef.current = channel;

    channel.on("presence", { event: "sync" }, () => {
      const state = channel.presenceState();
      const allUsers = Object.values(state).map(u => u[0]);
      allUsers.forEach(user => {
        if (!animationData.current[user.id]) {
          animationData.current[user.id] = { frameIndex: 0, lastUpdate: Date.now(), moving: false, direction: "down" };
        }
      });
      setUsers(allUsers);
    }).subscribe(async status => {
      if (status === "SUBSCRIBED") {
        const x = Math.random() * 700 + 50;
        const y = Math.random() * 400 + 50;
        animationData.current[currentUser.id] = { frameIndex: 0, lastUpdate: Date.now(), moving: false, direction: "down" };
        await channel.track({ id: currentUser.id, name: currentUser.username, x, y, direction: "down", frameIndex: 0 });
      }
    });

    // Mensajes en tiempo real
    const messageChannel = supabaseClient
      .channel("room_messages")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "room_messages" }, payload => {
        setMessages(prev => [...prev, payload.new]);
      })
      .subscribe();

    return () => {
      channel.unsubscribe();
      messageChannel.unsubscribe();
      cancelAnimationFrame(requestRef.current);
    };
  }, [currentUser]);

  // Dibujar partículas
  const drawParticles = (ctx, canvas) => {
    particlesRef.current.forEach(p => {
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fillStyle = p.color;
      ctx.fill();
      p.x += p.dx; p.y += p.dy;
      if (p.x < 0 || p.x > canvas.width) p.dx *= -1;
      if (p.y < 0 || p.y > canvas.height) p.dy *= -1;
    });
  };

  // Dibujar cada avatar
  const drawAvatar = (ctx, user) => {
    const { x, y, name, id, direction = "down" } = user;
    const animData = animationData.current[id] || { frameIndex: 0 };
    const spriteX = animData.frameIndex * spriteWidth;
    const spriteY = directionMap[animData.direction || direction] * spriteHeight;

    // Brillo/neón
    ctx.shadowColor = "#0ff";
    ctx.shadowBlur = 10;
    ctx.drawImage(spriteImage.current, spriteX, spriteY, spriteWidth, spriteHeight, x - 32, y - 32, 64, 64);
    ctx.shadowBlur = 0;

    ctx.fillStyle = "#0ff";
    ctx.font = "bold 14px Arial";
    ctx.textAlign = "center";
    ctx.fillText(name, x, y - 40);
  };

  // Render de sala
  const drawRoom = ctx => {
    const w = ctx.canvas.width;
    const h = ctx.canvas.height;
    ctx.clearRect(0, 0, w, h);
    if (mapImage.current.complete) ctx.drawImage(mapImage.current, 0, 0, w, h);
    drawParticles(ctx, ctx.canvas);
    users.forEach(u => drawAvatar(ctx, u));
  };

  // Animación
  const animate = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const now = Date.now();

    users.forEach(user => {
      const anim = animationData.current[user.id];
      if (anim && anim.moving && now - anim.lastUpdate > animationSpeed) {
        anim.frameIndex = (anim.frameIndex + 1) % framesPerDirection;
        anim.lastUpdate = now;
      }
    });

    drawRoom(ctx);
    requestRef.current = requestAnimationFrame(animate);
  };

  useEffect(() => {
    requestRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(requestRef.current);
  }, [users]);

  // Movimiento con flechas
  useEffect(() => {
    const handleKeyDown = async e => {
      if (!["ArrowUp","ArrowDown","ArrowLeft","ArrowRight"].includes(e.key)) return;
      e.preventDefault();
      keysPressed.current[e.key] = true;
      const user = users.find(u => u.id === currentUser.id);
      if (!user) return;
      let { x, y } = user;
      let direction = user.direction;
      switch(e.key){
        case "ArrowUp": y-=4; direction="up"; break;
        case "ArrowDown": y+=4; direction="down"; break;
        case "ArrowLeft": x-=4; direction="left"; break;
        case "ArrowRight": x+=4; direction="right"; break;
      }
      animationData.current[currentUser.id].moving=true;
      animationData.current[currentUser.id].direction=direction;
      const updatedUser={...user,x,y,direction};
      setUsers(prev=>prev.map(u=>u.id===currentUser.id?updatedUser:u));
      if(channelRef.current) await channelRef.current.track(updatedUser);
    };
    const handleKeyUp = e => {
      if (!["ArrowUp","ArrowDown","ArrowLeft","ArrowRight"].includes(e.key)) return;
      keysPressed.current[e.key]=false;
      if(!Object.values(keysPressed.current).some(v=>v)){
        animationData.current[currentUser.id].moving=false;
        animationData.current[currentUser.id].frameIndex=0;
      }
    };
    window.addEventListener("keydown",handleKeyDown);
    window.addEventListener("keyup",handleKeyUp);
    return ()=>{window.removeEventListener("keydown",handleKeyDown);window.removeEventListener("keyup",handleKeyUp);}
  },[users,currentUser]);

  // Enviar mensaje
  const sendMessage = async e => {
    e.preventDefault();
    if(!newMessage.trim()) return;
    await supabaseClient.from("room_messages").insert({ user_id: currentUser.id, content:newMessage.trim() });
    setNewMessage("");
  };

  return (
    <div className="multiplayer-lobby-container">
      <div className="lobby-header neon-text">
        <h2>Lobby Deportivo Lupi</h2>
        <button onClick={onClose}><X/></button>
      </div>
      <div className="lobby-content">
        <canvas ref={canvasRef} width={1200} height={800} className="map-canvas"/>
        <div className="chat-panel">
          <MessageDisplay message={null} />
          <div className="messages">
            {messages.map(msg => (
              <div key={msg.id} className="message neon-text">
                <span className="user-name">{msg.user_id}</span>: {msg.content}
              </div>
            ))}
          </div>
          <form onSubmit={sendMessage} className="message-form">
            <input value={newMessage} onChange={e=>setNewMessage(e.target.value)} placeholder="Escribe un mensaje..." />
            <button type="submit"><MessageCircle/></button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default MultiplayerLobbyView;
