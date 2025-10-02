// src/game/CommonRoom.jsx
import React, { useEffect, useState, useRef, useCallback } from "react";
import { supabaseClient } from "../components/services/supabase";
import "../styles/CommonRoom.css";

/**
 * CommonRoom: sala común con avatares movibles y presencia en tiempo real.
 * Requisitos: tabla `room_users` en Supabase (schema que compartiste).
 *
 * Comportamiento:
 * - Al montar: obtiene user, upsert en room_users con posición inicial.
 * - Se subscribe a cambios en room_users (INSERT/UPDATE/DELETE) y mantiene players state.
 * - Movimiento optimista local + debounce update a Supabase.
 * - Heartbeat cada 10s para last_heartbeat/is_online.
 * - Al desmontar: borra row de room_users.
 */

const CELL_SIZE = 48;       // px por celda
const MAP_WIDTH = 20;       // celdas
const MAP_HEIGHT = 12;      // celdas
const DEBOUNCE_MS = 300;    // cuánto esperar antes de persistir pos

export default function CommonRoom() {
  const [players, setPlayers] = useState([]); // lista de room_users
  const [me, setMe] = useState(null);         // mi user (supabase auth)
  const [loading, setLoading] = useState(true);
  const localPosRef = useRef({ x: 1, y: 1 }); // posición optimista local
  const saveTimerRef = useRef(null);
  const channelRef = useRef(null);
  const heartbeatRef = useRef(null);

  // helper: upsert my row
  const upsertMe = useCallback(async (user, pos = null) => {
    if (!user) return;
    const payload = {
      user_id: user.id,
      name: user.user_metadata?.full_name || user.email || "Anon",
      username: user.user_metadata?.username || user.email?.split("@")[0],
      avatar_url: user.user_metadata?.avatar_url || null,
      x: pos?.x ?? localPosRef.current.x,
      y: pos?.y ?? localPosRef.current.y,
      is_online: true,
      last_activity: new Date().toISOString(),
      last_heartbeat: new Date().toISOString(),
      connection_id: Math.random().toString(36).slice(2, 9)
    };

    // Upsert (insert or update)
    await supabaseClient
      .from("room_users")
      .upsert(payload, { onConflict: "user_id" })
      .select();
  }, []);

  // init: get user, upsert, subscribe
  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      const { data: authData } = await supabaseClient.auth.getUser();
      const user = authData?.user;
      if (!user) {
        setLoading(false);
        return;
      }
      if (!mounted) return;

      setMe(user);

      // initial position simple: random near center
      const startX = Math.floor(MAP_WIDTH / 2 + (Math.random() * 3 - 1.5));
      const startY = Math.floor(MAP_HEIGHT / 2 + (Math.random() * 3 - 1.5));
      localPosRef.current = { x: Math.max(0, Math.min(MAP_WIDTH - 1, startX)), y: Math.max(0, Math.min(MAP_HEIGHT - 1, startY)) };

      await upsertMe(user, localPosRef.current);

      // get current room users
      const { data: existing } = await supabaseClient
        .from("room_users")
        .select("*");

      if (mounted) setPlayers(existing || []);

      // subscribe to postgres changes on room_users
      const channel = supabaseClient
        .channel("room-updates")
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "room_users" },
          (payload) => {
            const ev = payload.eventType; // INSERT / UPDATE / DELETE
            const row = payload.new ?? payload.old;
            setPlayers(prev => {
              const clone = [...prev];
              const idx = clone.findIndex(p => p.user_id === row.user_id);
              if (payload.eventType === "DELETE") {
                if (idx >= 0) clone.splice(idx, 1);
                return clone;
              }
              // INSERT or UPDATE
              if (idx >= 0) {
                clone[idx] = row;
              } else {
                clone.push(row);
              }
              return clone;
            });
          }
        )
        .subscribe();

      channelRef.current = channel;

      // heartbeat: cada 10s actualiza last_heartbeat e is_online
      heartbeatRef.current = setInterval(async () => {
        await supabaseClient
          .from("room_users")
          .update({ last_heartbeat: new Date().toISOString(), is_online: true })
          .eq("user_id", user.id);
      }, 10000);

      setLoading(false);
    })();

    // cleanup on unmount: remove subscription + delete my row
    return () => {
      mounted = false;
      if (channelRef.current) supabaseClient.removeChannel(channelRef.current);
      if (heartbeatRef.current) clearInterval(heartbeatRef.current);
      (async () => {
        const { data: authData } = await supabaseClient.auth.getUser();
        const user = authData?.user;
        if (user) {
          await supabaseClient.from("room_users").delete().eq("user_id", user.id);
        }
      })();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // save position debounced (persist to DB)
  const persistPosition = useCallback(async (pos) => {
    const currentUser = me;
    if (!currentUser) return;
    try {
      await supabaseClient
        .from("room_users")
        .update({ x: pos.x, y: pos.y, last_activity: new Date().toISOString() })
        .eq("user_id", currentUser.id);
    } catch (err) {
      console.error("persistPosition error", err);
    }
  }, [me]);

  const schedulePersist = useCallback((pos) => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      persistPosition(pos);
      saveTimerRef.current = null;
    }, DEBOUNCE_MS);
  }, [persistPosition]);

  // keyboard movement
  useEffect(() => {
    const handleKey = (e) => {
      if (!me) return;
      const key = e.key.toLowerCase();
      let dx = 0, dy = 0;
      if (key === "arrowup" || key === "w") dy = -1;
      if (key === "arrowdown" || key === "s") dy = 1;
      if (key === "arrowleft" || key === "a") dx = -1;
      if (key === "arrowright" || key === "d") dx = 1;
      if (dx === 0 && dy === 0) return;

      const np = { x: Math.max(0, Math.min(MAP_WIDTH - 1, localPosRef.current.x + dx)), y: Math.max(0, Math.min(MAP_HEIGHT - 1, localPosRef.current.y + dy)) };
      localPosRef.current = np;
      // optimistic UI update
      setPlayers(prev => {
        const clone = [...prev];
        const idx = clone.findIndex(p => p.user_id === me.id);
        const myRow = {
          user_id: me.id,
          name: me.user_metadata?.full_name || me.email,
          username: me.user_metadata?.username || me.email?.split("@")[0],
          avatar_url: me.user_metadata?.avatar_url || null,
          x: np.x,
          y: np.y,
          is_online: true
        };
        if (idx >= 0) clone[idx] = { ...clone[idx], ...myRow };
        else clone.push(myRow);
        return clone;
      });

      schedulePersist(np);
    };

    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [me, schedulePersist]);

  // click/tap to move
  const handleMapClick = async (e) => {
    if (!me) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;
    const cellX = Math.floor(clickX / CELL_SIZE);
    const cellY = Math.floor(clickY / CELL_SIZE);
    const np = { x: Math.max(0, Math.min(MAP_WIDTH - 1, cellX)), y: Math.max(0, Math.min(MAP_HEIGHT - 1, cellY)) };
    localPosRef.current = np;

    setPlayers(prev => {
      const clone = [...prev];
      const idx = clone.findIndex(p => p.user_id === me.id);
      const myRow = {
        user_id: me.id,
        name: me.user_metadata?.full_name || me.email,
        username: me.user_metadata?.username || me.email?.split("@")[0],
        avatar_url: me.user_metadata?.avatar_url || null,
        x: np.x,
        y: np.y,
        is_online: true
      };
      if (idx >= 0) clone[idx] = { ...clone[idx], ...myRow };
      else clone.push(myRow);
      return clone;
    });

    schedulePersist(np);
  };

  // utility render avatar
  const renderAvatar = (p) => {
    const left = p.x * CELL_SIZE;
    const top = p.y * CELL_SIZE;
    const isMe = me && p.user_id === me.id;

    return (
      <div
        key={p.user_id}
        className={`cr-avatar ${isMe ? "me" : ""} ${p.is_online ? "online" : "offline"}`}
        style={{ left: `${left}px`, top: `${top}px`, width: `${CELL_SIZE}px`, height: `${CELL_SIZE}px` }}
      >
        <div className="avatar-sprite" title={p.name}>
          {p.avatar_url ? <img src={p.avatar_url} alt={p.name} /> : <div className="avatar-fallback">{p.username?.charAt(0)?.toUpperCase() || "?"}</div>}
        </div>
        <div className="avatar-tag">{p.username}</div>
      </div>
    );
  };

  if (loading) {
    return <div className="cr-loading">Cargando sala...</div>;
  }

  return (
    <div className="cr-root">
      <div className="cr-left">
        <div className="cr-map" onClick={handleMapClick} style={{ width: `${MAP_WIDTH * CELL_SIZE}px`, height: `${MAP_HEIGHT * CELL_SIZE}px` }}>
          <div className="cr-map-grid" />
          {players.map(renderAvatar)}
        </div>
      </div>

      <div className="cr-right">
        <div className="cr-info">
          <h3>Sala Común</h3>
          <p>Usuarios online: <strong>{players.length}</strong></p>
          <p>Controles: Flechas / WASD — Click/Tap para moverte</p>
          <div className="cr-players-list">
            {players.map(p => (
              <div key={p.user_id} className="cr-player-row">
                <div className="cr-player-mini">
                  {p.avatar_url ? <img src={p.avatar_url} alt="" /> : <div className="mini-fallback">{p.username?.charAt(0)}</div>}
                </div>
                <div className="cr-player-meta">
                  <div className="cr-player-name">{p.username}</div>
                  <div className="cr-player-pos">x:{p.x} y:{p.y} {p.is_online ? "●" : "○"}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="cr-footer">
          <small>Optimizado para mínimo uso de escrituras a DB • Heartbeat activo</small>
        </div>
      </div>
    </div>
  );
}
