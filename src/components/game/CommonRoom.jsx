import React, { useState, useEffect, useRef } from "react";
import "../styles/CommonRoom.css";

// Asegurate de tener estos assets en la ruta indicada
import playerSprite from "../assets/player.png";
import mapBackground from "../assets/map.png";

/**
 * Props:
 * - currentUser: { id, username }
 * - onClose: () => void
 * - supabaseClient: instancia de Supabase (v2)
 */
const CommonRoom = ({ currentUser, onClose, supabaseClient }) => {
  // UI state
  const [users, setUsers] = useState([]);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [activeTab, setActiveTab] = useState("feed"); // feed | events | raffles | stats | chat

  // Data widgets
  const [feedItems, setFeedItems] = useState([]);
  const [events, setEvents] = useState([]);
  const [raffles, setRaffles] = useState([]);
  const [clubStats, setClubStats] = useState({ totalMembers: 0, online: 0 });

  // Refs para canvas/animación/presence
  const canvasRef = useRef(null);
  const requestRef = useRef();
  const channelRef = useRef(null);
  const keysPressed = useRef({});
  const animationData = useRef({}); // { [userId]: { frameIndex, lastUpdate, moving, direction } }
  const spriteImage = useRef(new Image());
  const mapImage = useRef(new Image());

  // Spritesheet config
  const spriteWidth = 32;
  const spriteHeight = 48;
  const framesPerDirection = 3;
  const animationSpeed = 120; // ms entre frames
  const directionMap = { down: 0, left: 1, right: 2, up: 3 };

  // ---------- Helpers ----------
  const clamp = (v, a, b) => Math.max(a, Math.min(v, b));

  // Obtiene bounds dinámicos del canvas
  const getBounds = () => {
    const canvas = canvasRef.current;
    if (!canvas) return { w: 800, h: 500 };
    return { w: canvas.width, h: canvas.height };
  };

  // ---------- Fetch inicial de datos (feed, events, raffles, stats, messages) ----------
  useEffect(() => {
    let mounted = true;

    const fetchInitial = async () => {
      try {
        // Feed (ej: tabla "club_feed")
        const { data: feedData, error: feedErr } = await supabaseClient
          .from("club_feed")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(20);

        // Events (ej: tabla "events")
        const { data: eventsData, error: eventsErr } = await supabaseClient
          .from("events")
          .select("*")
          .order("start_time", { ascending: true })
          .limit(20);

        // Raffles (ej: tabla "raffles")
        const { data: rafflesData, error: rafflesErr } = await supabaseClient
          .from("raffles")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(10);

        // Messages (ej: tabla "room_messages")
        const { data: messagesData, error: messagesErr } = await supabaseClient
          .from("room_messages")
          .select("*")
          .order("created_at", { ascending: true })
          .limit(200);

        // Stats: conteo de miembros (ej: tabla "members")
        const { data: membersData, error: membersErr, count } = await supabaseClient
          .from("members")
          .select("id", { count: "exact", head: false });

        if (!mounted) return;

        if (!feedErr && feedData) setFeedItems(feedData);
        if (!eventsErr && eventsData) setEvents(eventsData);
        if (!rafflesErr && rafflesData) setRaffles(rafflesData);
        if (!messagesErr && messagesData) setMessages(messagesData);
        if (!membersErr && membersData) {
          setClubStats((s) => ({ ...s, totalMembers: membersData.length }));
        }
      } catch (err) {
        console.error("Error fetching initial data:", err);
      }
    };

    fetchInitial();

    return () => {
      mounted = false;
    };
  }, [supabaseClient]);

  // ---------- Supabase presence + realtime listeners ----------
  useEffect(() => {
    if (!supabaseClient || !currentUser) return;
    const presenceChannel = supabaseClient.channel("lupi_common_room", {
      config: { presence: { key: currentUser.id } },
    });
    channelRef.current = presenceChannel;

    // presence sync
    presenceChannel.on("presence", { event: "sync" }, () => {
      const state = presenceChannel.presenceState();
      const allUsers = Object.values(state).map((arr) => arr[0]); // supabase stores arrays of metas
      // Inicializar animData para cada user
      allUsers.forEach((u) => {
        if (!animationData.current[u.id]) {
          animationData.current[u.id] = {
            frameIndex: u.frameIndex || 0,
            lastUpdate: Date.now(),
            moving: false,
            direction: u.direction || "down",
          };
        }
      });
      setUsers(allUsers);
      // actualizar online count
      setClubStats((s) => ({ ...s, online: allUsers.length }));
    });

    // subscribe & track current user position randomly
    presenceChannel.subscribe(async (status) => {
      if (status === "SUBSCRIBED") {
        // pos aleatoria dentro de canvas
        const canvas = canvasRef.current;
        const cw = canvas ? canvas.width : 800;
        const ch = canvas ? canvas.height : 500;
        const x = Math.round(Math.random() * (cw - 120) + 60);
        const y = Math.round(Math.random() * (ch - 120) + 60);

        animationData.current[currentUser.id] = {
          frameIndex: 0,
          lastUpdate: Date.now(),
          moving: false,
          direction: "down",
        };

        // track presence meta (puede contener x,y,direction)
        await presenceChannel.track({
          id: currentUser.id,
          name: currentUser.username || "Usuario",
          x,
          y,
          direction: "down",
          frameIndex: 0,
          lastFrameUpdate: Date.now(),
        });
      }
    });

    // Mensajes en tiempo real desde la tabla room_messages
    const messageChannel = supabaseClient
      .channel("room_messages_channel")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "room_messages" },
        (payload) => {
          setMessages((prev) => [...prev, payload.new]);
        }
      )
      .subscribe();

    // Opcional: listeners para updates sobre eventos/raffles si querés realtime
    // Ejemplo para eventos: subscribe a INSERT/UPDATE/DELETE en tabla "events"
    const eventsChannel = supabaseClient
      .channel("events_channel")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "events" },
        (payload) => {
          // simplificado: refrescamos la lista completa (podés optimizar)
          supabaseClient
            .from("events")
            .select("*")
            .order("start_time", { ascending: true })
            .limit(50)
            .then(({ data }) => {
              if (data) setEvents(data);
            });
        }
      )
      .subscribe();

    // Cleanup
    return () => {
      try {
        presenceChannel.unsubscribe();
      } catch (e) {}
      try {
        messageChannel.unsubscribe();
      } catch (e) {}
      try {
        eventsChannel.unsubscribe();
      } catch (e) {}
      cancelAnimationFrame(requestRef.current);
    };
  }, [supabaseClient, currentUser]);

  // ---------- Imágenes sprites/map ----------
  useEffect(() => {
    spriteImage.current.src = playerSprite;
    mapImage.current.src = mapBackground;
  }, []);

  // ---------- Canvas resize: set canvas internal resolution al tamaño del contenedor ----------
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resize = () => {
      // dpr para evitar blur
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      canvas.width = Math.floor(rect.width * dpr);
      canvas.height = Math.floor(rect.height * dpr);
      const ctx = canvas.getContext("2d");
      ctx.scale(dpr, dpr);
    };

    resize();
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, []);

  // ---------- Dibujado ----------
  const drawAvatar = (ctx, user) => {
    const { x = 100, y = 100, name = "Usuario", direction = "down", id } = user;
    const animData = animationData.current[id] || { frameIndex: 0, direction };
    const frameIndex = animData.frameIndex || 0;
    const spriteX = frameIndex * spriteWidth;
    const spriteY = directionMap[animData.direction || direction] * spriteHeight;

    // convert coords because canvas may be scaled by dpr - but we used ctx.scale(dpr,dpr) so drawing uses CSS pixels
    // dibujar sprite escalado a 64x64 (ajustable)
    const drawW = 64;
    const drawH = 64;
    ctx.drawImage(
      spriteImage.current,
      spriteX,
      spriteY,
      spriteWidth,
      spriteHeight,
      x - drawW / 2,
      y - drawH / 2,
      drawW,
      drawH
    );

    // Nombre
    ctx.fillStyle = "#fff";
    ctx.font = "14px Arial";
    ctx.textAlign = "center";
    ctx.fillText(name, x, y - drawH / 2 - 8);
  };

  const drawRoom = (ctx) => {
    const { w, h } = { w: ctx.canvas.clientWidth, h: ctx.canvas.clientHeight };
    // limpiar
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

    // background map (dibujar a tamaño del canvas en CSS pixels)
    if (mapImage.current.complete) {
      // mapImage está en pixeles reales; dibujamos a escala CSS (ctx está escalado)
      ctx.drawImage(mapImage.current, 0, 0, ctx.canvas.clientWidth, ctx.canvas.clientHeight);
    } else {
      ctx.fillStyle = "#12253a";
      ctx.fillRect(0, 0, ctx.canvas.clientWidth, ctx.canvas.clientHeight);
    }

    // dibujar todos los usuarios
    users.forEach((u) => drawAvatar(ctx, u));
  };

  // anim loop
  const animate = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    const now = Date.now();

    // actualizar frames para usuarios que se mueven
    users.forEach((user) => {
      const anim = animationData.current[user.id];
      if (anim && anim.moving && now - anim.lastUpdate > animationSpeed) {
        anim.frameIndex = (anim.frameIndex + 1) % framesPerDirection;
        anim.lastUpdate = now;

        // actualizar frameIndex en el usuario local para consistencia (no forzamos re-render globalmente)
        if (user.id === currentUser.id) {
          setUsers((prev) =>
            prev.map((u) => (u.id === currentUser.id ? { ...u, frameIndex: anim.frameIndex } : u))
          );
        }
      }
    });

    drawRoom(ctx);

    requestRef.current = requestAnimationFrame(animate);
  };

  useEffect(() => {
    requestRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(requestRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [users]);

  // ---------- Movimiento con teclado ----------
  useEffect(() => {
    const handleKeyDown = async (e) => {
      if (!["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key)) return;
      e.preventDefault();
      keysPressed.current[e.key] = true;
      const user = users.find((u) => u.id === currentUser.id);
      if (!user) return;

      const canvas = canvasRef.current;
      const cw = canvas ? canvas.width / (window.devicePixelRatio || 1) : 800;
      const ch = canvas ? canvas.height / (window.devicePixelRatio || 1) : 500;

      let { x = cw / 2, y = ch / 2 } = user;
      let direction = user.direction || "down";
      const step = 4;

      switch (e.key) {
        case "ArrowUp":
          y -= step;
          direction = "up";
          break;
        case "ArrowDown":
          y += step;
          direction = "down";
          break;
        case "ArrowLeft":
          x -= step;
          direction = "left";
          break;
        case "ArrowRight":
          x += step;
          direction = "right";
          break;
        default:
          break;
      }

      // limites basados en CSS pixels (tenemos ctx.scale para dpr)
      const drawHalf = 32;
      x = clamp(x, drawHalf, cw - drawHalf);
      y = clamp(y, drawHalf, ch - drawHalf);

      // actualizar animData
      if (!animationData.current[currentUser.id]) {
        animationData.current[currentUser.id] = {
          frameIndex: 0,
          lastUpdate: Date.now(),
          moving: true,
          direction,
        };
      } else {
        animationData.current[currentUser.id].moving = true;
        animationData.current[currentUser.id].direction = direction;
      }

      // updated user meta
      const updatedUser = {
        ...user,
        x,
        y,
        direction,
        lastFrameUpdate: Date.now(),
      };

      // local state
      setUsers((prev) => prev.map((u) => (u.id === currentUser.id ? updatedUser : u)));

      // track en Supabase presence
      try {
        if (channelRef.current) {
          await channelRef.current.track(updatedUser);
        }
      } catch (err) {
        console.error("Error tracking presence:", err);
      }
    };

    const handleKeyUp = (e) => {
      if (!["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key)) return;
      keysPressed.current[e.key] = false;

      const noKeysPressed = !Object.values(keysPressed.current).some(Boolean);
      if (noKeysPressed && animationData.current[currentUser.id]) {
        animationData.current[currentUser.id].moving = false;
        animationData.current[currentUser.id].frameIndex = 0;
        // reset local user frame
        setUsers((prev) =>
          prev.map((u) => (u.id === currentUser.id ? { ...u, frameIndex: 0 } : u))
        );
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [users, currentUser]);

  // ---------- Chat: enviar mensaje ----------
  const sendMessage = async (e) => {
    if (e) e.preventDefault();
    const content = newMessage?.trim();
    if (!content) return;

    try {
      const { error } = await supabaseClient.from("room_messages").insert({
        user_id: currentUser.id,
        username: currentUser.username || "Usuario",
        content,
      });
      if (error) console.error("Error sending message:", error);
      setNewMessage("");
      // no hacemos push local (llega por realtime)
    } catch (err) {
      console.error("Send message failed:", err);
    }
  };

  // ---------- UI: tabs content components ----------
  const FeedTab = () => (
    <div className="feed-section">
      {feedItems.length === 0 && <div className="empty">No hay posteos aún.</div>}
      {feedItems.map((f) => (
        <div key={f.id} className="feed-card">
          <div className="feed-title">{f.title || f.text}</div>
          <div className="feed-meta">{f.subtitle || ""}</div>
        </div>
      ))}
    </div>
  );

  const EventsTab = () => (
    <div className="feed-section">
      {events.length === 0 && <div className="empty">No hay eventos próximos.</div>}
      {events.map((ev) => (
        <div key={ev.id} className="event-card">
          <div className="event-title">{ev.title || ev.name}</div>
          <div className="event-time">{ev.start_time ? new Date(ev.start_time).toLocaleString() : ""}</div>
          <div className="event-desc">{ev.description}</div>
        </div>
      ))}
    </div>
  );

  const RafflesTab = () => (
    <div className="feed-section">
      {raffles.length === 0 && <div className="empty">No hay rifas activas.</div>}
      {raffles.map((r) => (
        <div key={r.id} className="raffle-card">
          <div className="raffle-title">{r.title}</div>
          <div className="raffle-info">{r.info || r.prize}</div>
        </div>
      ))}
    </div>
  );

  const StatsTab = () => (
    <div className="feed-section">
      <div className="stats-card">
        <div>Total miembros: <strong>{clubStats.totalMembers}</strong></div>
        <div>En línea ahora: <strong>{clubStats.online}</strong></div>
      </div>
    </div>
  );

  const ChatTab = () => (
    <div className="chat-full">
      <div className="messages messages-full">
        {messages.map((msg) => (
          <div key={msg.id || `${msg.user_id}-${msg.created_at}`} className="message">
            <span className="user-name">{msg.username || msg.user_id}:</span>
            <span className="message-content">{msg.content}</span>
          </div>
        ))}
      </div>

      <form onSubmit={sendMessage} className="message-form">
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Escribe un mensaje..."
        />
        <button type="submit" disabled={!newMessage.trim()}>
          Enviar
        </button>
      </form>
    </div>
  );

  // ---------- Render ----------
  return (
    <div className="common-room-modal">
      <div className="common-room-content">
        <div className="common-room-header">
          <h2>Arena Deportiva Lupi</h2>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <div className="header-stats">
              <span>{clubStats.online} online</span>
            </div>
            <button className="close-btn" onClick={onClose}>
              X
            </button>
          </div>
        </div>

        <div className="room-container">
          {/* Left: canvas room */}
          <div className="canvas-container">
            <canvas
              ref={canvasRef}
              width={1200}
              height={800}
              style={{ width: "100%", height: "100%" }}
            />
            <div className="sport-elements">
              <div className="sport-icon">⚽</div>
              <div className="sport-icon">🏀</div>
              <div className="sport-icon">🏈</div>
            </div>
            <div className="rpg-stats">
              <div>Nivel: <span className="stat-value">15</span></div>
              <div>EXP: <span className="stat-value">1200/2000</span></div>
              <div>Oro: <span className="stat-value">5,430</span></div>
            </div>
          </div>

          {/* Right: Dashboard */}
          <div className="dashboard-container">
            <div className="dashboard-tabs">
              <button className={activeTab === "feed" ? "active" : ""} onClick={() => setActiveTab("feed")}>Feed</button>
              <button className={activeTab === "events" ? "active" : ""} onClick={() => setActiveTab("events")}>Eventos</button>
              <button className={activeTab === "raffles" ? "active" : ""} onClick={() => setActiveTab("raffles")}>Rifas</button>
              <button className={activeTab === "stats" ? "active" : ""} onClick={() => setActiveTab("stats")}>Stats</button>
              <button className={activeTab === "chat" ? "active" : ""} onClick={() => setActiveTab("chat")}>Chat</button>
            </div>

            <div className="dashboard-content">
              {activeTab === "feed" && (
                <>
                  <FeedTab />
                  {/* Mini widgets debajo del feed */}
                  <div className="mini-widgets">
                    <div className="mini-card">
                      <h4>Próximo partido</h4>
                      {events[0] ? (
                        <div>{events[0].title || events[0].name} — {events[0].start_time ? new Date(events[0].start_time).toLocaleString() : ""}</div>
                      ) : (
                        <div>No hay partidos próximos</div>
                      )}
                    </div>
                    <div className="mini-card">
                      <h4>Rifas activas</h4>
                      <div>{raffles.length} rifas</div>
                    </div>
                  </div>
                </>
              )}

              {activeTab === "events" && <EventsTab />}
              {activeTab === "raffles" && <RafflesTab />}
              {activeTab === "stats" && <StatsTab />}
              {activeTab === "chat" && <ChatTab />}

            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CommonRoom;
