import { useEffect, useRef } from "react";

export function useGameLoop(canvasRef, users, currentUser, channelRef) {
  const requestRef = useRef();
  const keysPressed = useRef({});
  const animationData = useRef({});

  useEffect(() => {
    users.forEach(u => {
      if (!animationData.current[u.id]) {
        animationData.current[u.id] = {
          ...u,
          x: u.x || Math.random() * 400,
          y: u.y || Math.random() * 300,
          frame: 0,
          moving: false,
        };
      }
    });
  }, [users]);

  useEffect(() => {
    const handleKeyDown = (e) => { keysPressed.current[e.key] = true; };
    const handleKeyUp = (e) => { keysPressed.current[e.key] = false; };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    let lastFrame = Date.now();

    const draw = () => {
      const now = Date.now();
      const delta = (now - lastFrame) / 1000;
      lastFrame = now;

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = "#1a1a1a";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const me = animationData.current[currentUser.id];
      if (me) {
        let speed = 150;
        if (keysPressed.current["ArrowUp"]) { me.y -= speed * delta; me.moving = true; }
        if (keysPressed.current["ArrowDown"]) { me.y += speed * delta; me.moving = true; }
        if (keysPressed.current["ArrowLeft"]) { me.x -= speed * delta; me.moving = true; }
        if (keysPressed.current["ArrowRight"]) { me.x += speed * delta; me.moving = true; }

        if (channelRef.current && me.moving) {
          channelRef.current.track({ user: { ...me, id: currentUser.id } });
        }
      }

      Object.values(animationData.current).forEach(u => {
        ctx.fillStyle = "cyan";
        ctx.beginPath();
        ctx.arc(u.x, u.y, 12, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "white";
        ctx.fillText(u.username || u.email, u.x - 20, u.y - 16);
      });

      requestRef.current = requestAnimationFrame(draw);
    };

    draw();
    return () => cancelAnimationFrame(requestRef.current);
  }, [canvasRef, currentUser, channelRef]);

  return animationData;
}
