import { useEffect, useRef } from "react";

export default function AnimatedBackground() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    let animId;
    let lastRipple = 0;

    const isMobile = window.innerWidth < 768;
    const STAR_COUNT = isMobile ? 150 : 300;
    const NODE_COUNT = isMobile ? 10 : 20;

    function resize() {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    }
    resize();
    window.addEventListener("resize", resize);

    // ── Stars ──────────────────────────────────────────────────────────
    const stars = Array.from({ length: STAR_COUNT }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      r: Math.random() * 1.2 + 0.2,
      opacity: Math.random() * 0.7 + 0.1,
      speed: Math.random() * 0.08 + 0.02,
      drift: (Math.random() - 0.5) * 0.03,
    }));

    // ── Nodes ──────────────────────────────────────────────────────────
    const nodes = Array.from({ length: NODE_COUNT }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      pulse: Math.random() * Math.PI * 2,
      pulseSpeed: Math.random() * 0.015 + 0.005,
    }));

    // ── Connections (pairs within range) ──────────────────────────────
    const MAX_DIST = 220;
    const connections = [];
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const dx = nodes[i].x - nodes[j].x;
        const dy = nodes[i].y - nodes[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < MAX_DIST) {
          connections.push({
            a: i,
            b: j,
            phase: Math.random() * Math.PI * 2,
            speed: Math.random() * 0.008 + 0.003,
          });
        }
      }
    }

    // ── Ripples ────────────────────────────────────────────────────────
    const ripples = [];

    function spawnRipple() {
      const node = nodes[Math.floor(Math.random() * nodes.length)];
      ripples.push({ x: node.x, y: node.y, r: 0, alpha: 0.8 });
    }

    // ── Draw loop ──────────────────────────────────────────────────────
    function draw(ts) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Stars
      for (const s of stars) {
        s.y -= s.speed;
        s.x += s.drift;
        if (s.y < 0) { s.y = canvas.height; s.x = Math.random() * canvas.width; }
        if (s.x < 0 || s.x > canvas.width) { s.x = Math.random() * canvas.width; }
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(200,210,255,${s.opacity})`;
        ctx.fill();
      }

      // Connections
      for (const c of connections) {
        c.phase += c.speed;
        const opacity = (Math.sin(c.phase) * 0.5 + 0.5) * 0.35;
        if (opacity < 0.02) continue;
        const na = nodes[c.a], nb = nodes[c.b];
        ctx.beginPath();
        ctx.moveTo(na.x, na.y);
        ctx.lineTo(nb.x, nb.y);
        ctx.strokeStyle = `rgba(124,58,237,${opacity})`;
        ctx.lineWidth = 1;
        ctx.stroke();
      }

      // Nodes
      for (const n of nodes) {
        n.pulse += n.pulseSpeed;
        const glow = (Math.sin(n.pulse) * 0.5 + 0.5);
        const r = 3 + glow * 2;
        const alpha = 0.5 + glow * 0.5;
        const g = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, r * 3);
        g.addColorStop(0, `rgba(168,85,247,${alpha})`);
        g.addColorStop(1, "rgba(124,58,237,0)");
        ctx.beginPath();
        ctx.arc(n.x, n.y, r * 3, 0, Math.PI * 2);
        ctx.fillStyle = g;
        ctx.fill();
        ctx.beginPath();
        ctx.arc(n.x, n.y, r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(192,132,252,${alpha})`;
        ctx.fill();
      }

      // Ripples
      if (ts - lastRipple > 8000) { spawnRipple(); lastRipple = ts; }
      for (let i = ripples.length - 1; i >= 0; i--) {
        const rip = ripples[i];
        rip.r += 2.5;
        rip.alpha -= 0.012;
        if (rip.alpha <= 0) { ripples.splice(i, 1); continue; }
        ctx.beginPath();
        ctx.arc(rip.x, rip.y, rip.r, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(16,185,129,${rip.alpha})`;
        ctx.lineWidth = 2;
        ctx.stroke();
      }

      animId = requestAnimationFrame(draw);
    }

    animId = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "fixed",
        top: 0, left: 0,
        width: "100%", height: "100%",
        zIndex: -1,
        pointerEvents: "none",
      }}
    />
  );
}
