// src/components/game/CommonRoom.jsx
import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import "../style/CommonRoom.css";

/**
 Props expected:
 - currentUser: { id, username }
 - onClose: () => void
 - supabaseClient: Supabase client (v2)
*/
const CommonRoom = ({ currentUser, onClose, supabaseClient }) => {
  // UI state
  const [activeTab, setActiveTab] = useState("feed");
  const [feedItems, setFeedItems] = useState([]);
  const [events, setEvents] = useState([]);
  const [raffles, setRaffles] = useState([]);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [clubStats, setClubStats] = useState({ totalMembers: 0, online: 0 });

  // Refs for three
  const mountRef = useRef(null);
  const rendererRef = useRef(null);
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const animationIdRef = useRef(null);
  const lastTrackRef = useRef(0);
  const presenceChannelRef = useRef(null);

  // Map of userId -> { meta, mesh, labelEl }
  const usersRef = useRef({});

  // Local player state
  const localStateRef = useRef({
    id: currentUser?.id,
    x: 0,
    y: 0,
    z: 0,
    speed: 180, // px per second in world units (tweak)
    moving: false,
    dir: "down",
  });

  const trackThrottleMs = 100;

  // ---------- Fetch initial dashboard data ----------
  useEffect(() => {
    if (!supabaseClient) return;
    let mounted = true;

    const fetchAll = async () => {
      try {
        const [{ data: feedData }, { data: eventsData }, { data: rafflesData }, { data: messagesData }, { count }] =
          await Promise.all([
            supabaseClient.from("club_feed").select("*").order("created_at", { ascending: false }).limit(50),
            supabaseClient.from("events").select("*").order("start_time", { ascending: true }).limit(50),
            supabaseClient.from("raffles").select("*").order("created_at", { ascending: false }).limit(20),
            supabaseClient.from("room_messages").select("*").order("created_at", { ascending: true }).limit(200),
            // players count fallback: query count separately
            supabaseClient.from("players").select("id", { count: "exact", head: false })
          ]);

        if (!mounted) return;

        if (feedData) setFeedItems(feedData);
        if (eventsData) setEvents(eventsData);
        if (rafflesData) setRaffles(rafflesData);
        if (messagesData) setMessages(messagesData);
        if (count && typeof count === "number") {
          setClubStats((s) => ({ ...s, totalMembers: count }));
        } else {
          // fallback
          const { count: fallbackCount } = await supabaseClient.from("players").select("id", { count: "exact", head: false });
          if (typeof fallbackCount === "number") setClubStats((s) => ({ ...s, totalMembers: fallbackCount }));
        }
      } catch (err) {
        console.error("fetch dashboard error", err);
      }
    };

    fetchAll();
    return () => (mounted = false);
  }, [supabaseClient]);

  // ---------- Chat realtime listener ----------
  useEffect(() => {
    if (!supabaseClient) return;
    const ch = supabaseClient
      .channel("room_messages_react_component")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "room_messages" }, (payload) => {
        setMessages((prev) => [...prev, payload.new]);
      })
      .subscribe();

    return () => {
      try { ch.unsubscribe(); } catch (e) {}
    };
  }, [supabaseClient]);

  // ---------- Send message handler ----------
  const sendMessage = async (e) => {
    if (e) e.preventDefault();
    const content = (newMessage || "").trim();
    if (!content || !supabaseClient) return;
    try {
      await supabaseClient.from("room_messages").insert({
        user_id: currentUser.id,
        content,
      });
      setNewMessage("");
    } catch (err) {
      console.error("sendMessage error", err);
    }
  };

  // ---------- THREE: init scene ----------
  useEffect(() => {
    if (!mountRef.current) return;
    const mount = mountRef.current;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(window.devicePixelRatio || 1);
    renderer.setSize(mount.clientWidth, mount.clientHeight);
    renderer.domElement.style.display = "block";
    mount.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0f2138);
    sceneRef.current = scene;

    // Camera (orthographic-ish feel for 2.5D lobby)
    const aspect = mount.clientWidth / mount.clientHeight;
    const camera = new THREE.PerspectiveCamera(60, aspect, 0.1, 2000);
    camera.position.set(0, 200, 400); // elevated camera looking down
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;

    // Lights
    const hemi = new THREE.HemisphereLight(0xffffff, 0x444444, 0.9);
    hemi.position.set(0, 200, 0);
    scene.add(hemi);
    const dir = new THREE.DirectionalLight(0xffffff, 0.6);
    dir.position.set(100, 300, 200);
    scene.add(dir);

    // Ground plane
    const groundGeo = new THREE.PlaneGeometry(2000, 2000);
    const groundMat = new THREE.MeshStandardMaterial({ color: 0x23354a, roughness: 0.9, metalness: 0.1 });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = 0;
    scene.add(ground);

    // Local player mesh
    const localGeometry = new THREE.SphereGeometry(18, 24, 24);
    const localMaterial = new THREE.MeshStandardMaterial({ color: 0xffd700, emissive: 0x442200 });
    const localMesh = new THREE.Mesh(localGeometry, localMaterial);
    localMesh.position.set(0, 18, 0);
    scene.add(localMesh);
    usersRef.current[currentUser.id] = {
      meta: { id: currentUser.id, name: currentUser.username || "Usuario", x: 0, y: 0, z: 0 },
      mesh: localMesh,
      labelEl: null,
    };

    // Simple ambient particles / decorations (optional)
    const box = new THREE.BoxGeometry(48, 48, 48);
    const boxMat = new THREE.MeshStandardMaterial({ color: 0x1dd1a1, opacity: 0.08, transparent: true });
    const deco = new THREE.Mesh(box, boxMat);
    deco.position.set(-200, 24, -120);
    scene.add(deco);

    // Resize handling
    const handleResize = () => {
      const w = mount.clientWidth;
      const h = mount.clientHeight;
      renderer.setSize(w, h);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };
    window.addEventListener("resize", handleResize);

    // Controls state
    const keys = { ArrowUp: false, ArrowDown: false, ArrowLeft: false, ArrowRight: false, w: false, a: false, s: false, d: false };

    const onKeyDown = (ev) => {
      if (keys.hasOwnProperty(ev.key)) keys[ev.key] = true;
    };
    const onKeyUp = (ev) => {
      if (keys.hasOwnProperty(ev.key)) keys[ev.key] = false;
    };
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);

    // Touch drag: simple: drag on canvas to move local player directly
    let isDragging = false;
    let lastTouch = null;
    const onPointerDown = (ev) => {
      isDragging = true;
      lastTouch = getPointerWorld(ev);
    };
    const onPointerMove = (ev) => {
      if (!isDragging) return;
      lastTouch = getPointerWorld(ev);
    };
    const onPointerUp = () => {
      isDragging = false;
      lastTouch = null;
    };
    renderer.domElement.addEventListener("pointerdown", onPointerDown);
    renderer.domElement.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);

    // Raycaster helper -> converts pointer to world coords on ground plane y=0
    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    function getPointerWorld(ev) {
      const rect = renderer.domElement.getBoundingClientRect();
      const clientX = ev.clientX !== undefined ? ev.clientX : (ev.touches && ev.touches[0]?.clientX) || 0;
      const clientY = ev.clientY !== undefined ? ev.clientY : (ev.touches && ev.touches[0]?.clientY) || 0;
      pointer.x = ((clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(pointer, camera);
      const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
      const intersectPoint = new THREE.Vector3();
      raycaster.ray.intersectPlane(plane, intersectPoint);
      return intersectPoint;
    }

    // Movement helper: moves local mesh toward target point smoothly
    let moveTarget = null;
    function updateMovement(deltaSec) {
      const local = usersRef.current[currentUser.id];
      if (!local || !local.mesh) return;
      const mesh = local.mesh;
      // keyboard movement priority
      const moveVec = new THREE.Vector3();
      if (keys.ArrowUp || keys.w) moveVec.z -= 1;
      if (keys.ArrowDown || keys.s) moveVec.z += 1;
      if (keys.ArrowLeft || keys.a) moveVec.x -= 1;
      if (keys.ArrowRight || keys.d) moveVec.x += 1;

      if (moveVec.lengthSq() > 0) {
        moveVec.normalize();
        const sp = localStateRef.current.speed;
        mesh.position.x += moveVec.x * sp * deltaSec;
        mesh.position.z += moveVec.z * sp * deltaSec;
        localStateRef.current.moving = true;
        moveTarget = null; // cancel pointer move if keyboard used
      } else if (isDragging && lastTouch) {
        // pointer world: move toward lastTouch
        const dir = new THREE.Vector3(lastTouch.x - mesh.position.x, 0, lastTouch.z - mesh.position.z);
        const dist = dir.length();
        if (dist > 6) {
          dir.normalize();
          const sp = localStateRef.current.speed * 0.9;
          mesh.position.x += dir.x * sp * deltaSec;
          mesh.position.z += dir.z * sp * deltaSec;
          localStateRef.current.moving = true;
        } else {
          localStateRef.current.moving = false;
        }
      } else if (moveTarget) {
        const dir = new THREE.Vector3(moveTarget.x - mesh.position.x, 0, moveTarget.z - mesh.position.z);
        const dist = dir.length();
        if (dist > 6) {
          dir.normalize();
          const sp = localStateRef.current.speed * 0.95;
          mesh.position.x += dir.x * sp * deltaSec;
          mesh.position.z += dir.z * sp * deltaSec;
          localStateRef.current.moving = true;
        } else {
          localStateRef.current.moving = false;
          moveTarget = null;
        }
      } else {
        localStateRef.current.moving = false;
      }

      // clamp within a large area (adjust as desired)
      mesh.position.x = THREE.MathUtils.clamp(mesh.position.x, -900, 900);
      mesh.position.z = THREE.MathUtils.clamp(mesh.position.z, -900, 900);
    }

    // click to move (pointerup sets a move target)
    const onCanvasClick = (ev) => {
      const p = getPointerWorld(ev);
      if (p) moveTarget = p;
    };
    renderer.domElement.addEventListener("click", onCanvasClick);

    // ---------- Supabase Presence setup ----------
    const setupPresence = async () => {
      if (!supabaseClient || !currentUser) return;
      const channel = supabaseClient.channel("lupi_common_room", {
        config: { presence: { key: currentUser.id } },
      });
      presenceChannelRef.current = channel;

      channel.on("presence", { event: "sync" }, () => {
        try {
          const state = channel.presenceState(); // { key: [meta,...] }
          const allUsers = Object.values(state).map((arr) => arr[0]).filter(Boolean);

          // update usersRef map: add/update entries
          const map = {};
          allUsers.forEach((meta) => {
            const id = meta.id;
            map[id] = meta;
            // ensure numeric coords
            meta.x = typeof meta.x === "number" ? meta.x : Number(meta.x) || 0;
            meta.z = typeof meta.z === "number" ? meta.z : Number(meta.z) || 0;
            meta.y = typeof meta.y === "number" ? meta.y : Number(meta.y) || 0;
          });

          // update online count
          setClubStats((s) => ({ ...s, online: allUsers.length }));

          // add/update meshes for each meta
          allUsers.forEach((meta) => {
            if (!usersRef.current[meta.id]) {
              // create sphere for remote user
              const geom = new THREE.SphereGeometry(16, 20, 20);
              const mat = new THREE.MeshStandardMaterial({ color: 0x4ecdc4 });
              const mesh = new THREE.Mesh(geom, mat);
              mesh.position.set(meta.x || 0, 16, meta.z || 0);
              scene.add(mesh);

              // create label element (DOM) and append to mount
              const label = document.createElement("div");
              label.className = "avatar-label";
              label.innerText = meta.name || "Usuario";
              label.style.position = "absolute";
              label.style.pointerEvents = "none";
              label.style.transform = "translate(-50%, -50%)";
              label.style.whiteSpace = "nowrap";
              label.style.fontSize = "13px";
              label.style.color = "#fff";
              mount.appendChild(label);

              usersRef.current[meta.id] = { meta, mesh, labelEl: label };
            } else {
              // update meta
              usersRef.current[meta.id].meta = meta;
            }
          });

          // remove disconnected users
          Object.keys(usersRef.current).forEach((id) => {
            if (!map[id]) {
              const entry = usersRef.current[id];
              if (entry.mesh) scene.remove(entry.mesh);
              if (entry.labelEl && entry.labelEl.parentNode) entry.labelEl.parentNode.removeChild(entry.labelEl);
              delete usersRef.current[id];
            }
          });
        } catch (err) {
          console.error("presence sync err", err);
        }
      });

      // subscribe and track initial meta for current user
      channel.subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          // pick start pos (center)
          const startX = 0;
          const startZ = 0;

          // set local mesh pos accordingly
          const local = usersRef.current[currentUser.id];
          if (local && local.mesh) {
            local.mesh.position.set(startX, 18, startZ);
          }

          // track presence meta (x,z)
          try {
            await channel.track({
              id: currentUser.id,
              name: currentUser.username || "Usuario",
              x: startX,
              z: startZ,
              y: 0,
              direction: "down",
              lastFrameUpdate: Date.now()
            });
          } catch (err) {
            console.error("presence track error", err);
          }
        }
      });
    };

    setupPresence();

    // ---------- Animation loop ----------
    let lastTime = performance.now();
    const tick = (now) => {
      const deltaMs = now - lastTime;
      const deltaSec = deltaMs / 1000;
      lastTime = now;

      // movement update for local player
      updateMovement(deltaSec);

      // update usersRef positions based on their meta (interpolate for smoothness)
      Object.entries(usersRef.current).forEach(([id, entry]) => {
        if (!entry || !entry.mesh) return;
        if (id === currentUser.id) {
          // local mesh already moved by controls
        } else {
          // lerp remote meta -> visual mesh for smoothing
          const meta = entry.meta;
          if (meta) {
            const targetX = meta.x || 0;
            const targetZ = meta.z || 0;
            entry.mesh.position.x += (targetX - entry.mesh.position.x) * Math.min(1, deltaSec * 8);
            entry.mesh.position.z += (targetZ - entry.mesh.position.z) * Math.min(1, deltaSec * 8);
          }
        }
        // update label world->screen pos
        if (entry.labelEl) {
          const pos = entry.mesh.position.clone();
          pos.y += 36; // lift label above head
          const vector = pos.project(camera);
          const halfWidth = mount.clientWidth / 2;
          const halfHeight = mount.clientHeight / 2;
          const x = (vector.x * halfWidth) + halfWidth;
          const y = -(vector.y * halfHeight) + halfHeight;
          entry.labelEl.style.left = `${Math.round(x)}px`;
          entry.labelEl.style.top = `${Math.round(y)}px`;
        }
      });

      // update localStateRef pos into usersRef.meta for tracking
      const localEntry = usersRef.current[currentUser.id];
      if (localEntry && localEntry.mesh) {
        localEntry.meta.x = Math.round(localEntry.mesh.position.x);
        localEntry.meta.z = Math.round(localEntry.mesh.position.z);
      }

      // render
      renderer.render(scene, camera);

      // throttle presence.track to supabase
      const nowTs = Date.now();
      if (presenceChannelRef.current && usersRef.current[currentUser.id]) {
        if (nowTs - lastTrackRef.current >= trackThrottleMs) {
          lastTrackRef.current = nowTs;
          const meta = usersRef.current[currentUser.id].meta;
          // send track (no await)
          presenceChannelRef.current.track({
            id: currentUser.id,
            name: meta.name,
            x: Math.round(meta.x),
            z: Math.round(meta.z),
            y: 0,
            direction: localStateRef.current.dir,
            lastFrameUpdate: nowTs,
          }).catch(() => {});
        }
      }

      animationIdRef.current = requestAnimationFrame(tick);
    };

    animationIdRef.current = requestAnimationFrame(tick);

    // ---------- Presence channel reference: keep local pointer updated ----------
    // subscribe to the same channel object we created in setupPresence (presenceChannelRef)
    // but we set it inside setupPresence after subscribe returns. To let the animation loop
    // access it, poll until existence (handled by checking presenceChannelRef.current in loop).

    // ---------- Cleanup on unmount ----------
    return () => {
      // unsubscribe supabase channel
      try {
        if (presenceChannelRef.current) presenceChannelRef.current.unsubscribe();
      } catch (e) {}
      // remove label elements
      Object.values(usersRef.current).forEach((entry) => {
        if (entry.labelEl && entry.labelEl.parentNode) entry.labelEl.parentNode.removeChild(entry.labelEl);
        if (entry.mesh) scene.remove(entry.mesh);
      });
      usersRef.current = {};

      // event listeners
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      renderer.domElement.removeEventListener("pointerdown", onPointerDown);
      renderer.domElement.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
      renderer.domElement.removeEventListener("click", onCanvasClick);

      // cancel animation and dispose
      cancelAnimationFrame(animationIdRef.current);
      try {
        renderer.dispose();
        renderer.forceContextLoss();
        if (renderer.domElement && renderer.domElement.parentNode) renderer.domElement.parentNode.removeChild(renderer.domElement);
      } catch (e) {}
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mountRef.current, supabaseClient, currentUser]);

  // ---------- Effect: subscribe presence channel object to ref for track usage ----------
  useEffect(() => {
    if (!supabaseClient || !currentUser) return;
    const channel = supabaseClient.channel("lupi_common_room", { config: { presence: { key: currentUser.id } } });

    // We just subscribe here so the channel object exists and presenceState will be synced in the scene's setupPresence as well.
    channel.subscribe((status) => {
      // store ref for usage in animation loop (track)
      presenceChannelRef.current = channel;
    });

    // Also listen for presence state here and keep a lightweight sync for label/online count update
    channel.on("presence", { event: "sync" }, () => {
      try {
        const state = channel.presenceState();
        const allUsers = Object.values(state).map((a) => a[0]).filter(Boolean);
        setClubStats((s) => ({ ...s, online: allUsers.length }));
      } catch (e) {}
    });

    return () => {
      try { channel.unsubscribe(); } catch (e) {}
    };
  }, [supabaseClient, currentUser]);

  // ---------- Dashboard JSX ----------
  return (
    <div className="common-room-modal">
      <div className="common-room-content">
        <div className="common-room-header">
          <h2>Arena Deportiva Lupi (3D)</h2>
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <div className="header-stats">{clubStats.online} online</div>
            <button className="close-btn" onClick={onClose}>X</button>
          </div>
        </div>

        <div className="room-container">
          {/* Left: 3D canvas mount */}
          <div className="canvas-container-3d" ref={mountRef} />

          {/* Right: dashboard */}
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
                  {feedItems.length === 0 && <div className="empty">No hay posteos.</div>}
                  {feedItems.map((f) => (
                    <div key={f.id} className="feed-card">
                      <div className="feed-title">{(f.content || "").slice(0, 120)}</div>
                      <div className="feed-meta">{new Date(f.created_at).toLocaleString()}</div>
                    </div>
                  ))}
                </>
              )}

              {activeTab === "events" && (
                <>
                  {events.length === 0 && <div className="empty">No hay eventos.</div>}
                  {events.map((ev) => (
                    <div key={ev.id} className="event-card">
                      <div className="event-title">{ev.title || ev.name}</div>
                      <div className="event-time">{ev.start_time ? new Date(ev.start_time).toLocaleString() : ""}</div>
                    </div>
                  ))}
                </>
              )}

              {activeTab === "raffles" && (
                <>
                  {raffles.length === 0 && <div className="empty">No hay rifas.</div>}
                  {raffles.map((r) => (
                    <div key={r.id} className="raffle-card">
                      <div className="raffle-title">{r.title}</div>
                      <div className="raffle-info">{r.info || r.prize}</div>
                    </div>
                  ))}
                </>
              )}

              {activeTab === "stats" && (
                <div className="feed-section">
                  <div className="stats-card">Total miembros: <strong>{clubStats.totalMembers}</strong></div>
                  <div className="stats-card">En línea: <strong>{clubStats.online}</strong></div>
                </div>
              )}

              {activeTab === "chat" && (
                <div className="chat-full">
                  <div className="messages messages-full">
                    {messages.map((m) => (
                      <div key={m.id || `${m.user_id}-${m.created_at}`} className="message">
                        <span className="user-name">{m.username || m.user_id}:</span>
                        <span className="message-content">{m.content}</span>
                      </div>
                    ))}
                  </div>

                  <form onSubmit={sendMessage} className="message-form">
                    <input value={newMessage} onChange={(e) => setNewMessage(e.target.value)} placeholder="Escribe un mensaje..." />
                    <button type="submit" disabled={!newMessage.trim()}>Enviar</button>
                  </form>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CommonRoom;
