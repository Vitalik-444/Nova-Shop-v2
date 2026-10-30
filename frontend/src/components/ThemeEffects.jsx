import { useEffect, useRef } from "react";

const SAKURA_COLORS = ["#ffc4d6", "#ffb0c8", "#ffd9e4", "#ff9fbd"];
const GREEN_COLORS = ["#3f9a2b", "#2f7d22", "#5cb83f", "#7acb55", "#287a3a", "#4aa84a"];
const SAND_COLORS = ["#b8863b", "#c9974f", "#a8712a", "#d9a95f", "#9c6420"];
const HEART_COLORS = ["#ff3d74", "#ff6b9b", "#ff8fb3", "#ffc2d6", "#e11d48", "#ff5c8a"];
const AUTUMN_COLORS = ["#e8832a", "#c4501b", "#d9a21b", "#a63a17", "#b9772e", "#8f2d12"];

function rand(min, max) {
  return min + Math.random() * (max - min);
}

function spawn(kind, width, height, initial) {
  const base = {
    x: rand(0, width),
    y: initial ? rand(-height * 0.1, height) : rand(-60, -10),
    size: 1,
    speed: 1,
    drift: 0,
    sway: rand(10, 40),
    swayPhase: rand(0, Math.PI * 2),
    angle: rand(0, Math.PI * 2),
    spin: rand(-0.02, 0.02),
    flip: rand(0, Math.PI * 2),
    flipSpeed: rand(0.01, 0.04),
    hue: 0,
    alpha: rand(0.55, 0.95),
    variant: Math.floor(Math.random() * 6),
  };
  if (kind === "sakura") {
    base.size = rand(7, 14);
    base.speed = rand(0.5, 1.2);
    base.drift = rand(0.1, 0.5);
  } else if (kind === "autumn" || kind === "leaves") {
    base.size = rand(10, 20);
    base.speed = rand(0.7, 1.6);
    base.drift = rand(-0.3, 0.5);
    base.spin = rand(-0.03, 0.03);
  } else if (kind === "desert") {
    const roll = Math.random();
    if (roll < 0.035) {
      base.variant = 2;
      base.size = rand(22, 34);
      base.speed = 0;
      base.drift = rand(1.1, 1.9);
      base.alpha = 0.9;
      base.spin = 0;
      base.flipSpeed = 0;
      base.flip = height - rand(26, 64);
      base.x = initial ? rand(0, width) : -50;
      base.y = base.flip;
      base.sway = 0;
    } else if (roll < 0.2) {
      base.variant = 1;
      base.size = rand(1.6, 3.4);
      base.speed = rand(-0.05, 0.1);
      base.drift = rand(0.05, 0.3);
      base.sway = rand(6, 18);
      base.alpha = rand(0.5, 1);
      base.flipSpeed = rand(0.03, 0.08);
      base.spin = rand(-0.01, 0.01);
      base.y = rand(0, height * 0.9);
    } else {
      base.variant = 0;
      base.size = rand(0.9, 2.3);
      base.speed = rand(0.25, 0.95);
      base.drift = rand(1.2, 3.6);
      base.sway = rand(10, 30);
      base.alpha = rand(0.45, 0.9);
      base.hue = Math.floor(Math.random() * SAND_COLORS.length);
      base.spin = 0;
      if (!initial) {
        if (Math.random() < 0.65) {
          base.x = rand(-45, -5);
          base.y = rand(-20, height * 0.8);
        } else {
          base.y = rand(-40, -5);
        }
      }
    }
  } else if (kind === "love") {
    base.size = rand(8, 26);
    base.speed = -rand(0.4, 1.3);
    base.drift = rand(-0.2, 0.2);
    base.sway = rand(10, 34);
    base.alpha = rand(0.45, 0.9);
    base.spin = rand(-0.01, 0.01);
    base.angle = rand(-0.4, 0.4);
    base.variant = Math.floor(Math.random() * HEART_COLORS.length);
    base.flipSpeed = rand(0.03, 0.07);
    base.y = initial ? rand(0, height) : height + rand(10, 60);
  } else if (kind === "snow") {
    const depth = Math.random();
    base.size = 1.4 + depth * depth * 4.2;
    base.speed = 0.35 + depth * 1.1;
    base.drift = rand(-0.15, 0.35);
    base.sway = rand(8, 28);
    base.alpha = 0.45 + depth * 0.5;
    base.spin = rand(-0.015, 0.015);
    base.variant = base.size > 3.4 ? 1 : 0;
  } else if (kind === "newyear") {
    const roll = Math.random();
    base.variant = roll < 0.42 ? 0 : roll < 0.68 ? 1 : roll < 0.86 ? 2 : 3;
    base.size = base.variant === 0 ? rand(2, 5) : base.variant === 3 ? rand(5, 9) : rand(11, 20);
    base.speed = base.variant === 0 ? rand(0.5, 1.2) : rand(0.6, 1.4);
    base.drift = rand(-0.15, 0.4);
    base.alpha = base.variant === 0 ? rand(0.55, 0.95) : rand(0.8, 1);
    base.hue = Math.random() < 0.5 ? 0 : 1;
    base.spin = rand(-0.025, 0.025);
  } else {
    // halloween: embers rise, bats cross the screen
    const bat = Math.random() < 0.18;
    base.variant = bat ? 100 : 0;
    if (bat) {
      base.size = rand(10, 18);
      base.speed = rand(-0.25, 0.25);
      base.drift = rand(0.9, 1.7) * (Math.random() < 0.5 ? 1 : -1);
      base.x = base.drift > 0 ? -30 : width + 30;
      base.y = rand(height * 0.05, height * 0.6);
      base.sway = rand(14, 36);
      base.alpha = 0.8;
    } else {
      base.size = rand(1.2, 3.2);
      base.speed = -rand(0.3, 0.9);
      base.drift = rand(-0.2, 0.2);
      base.y = initial ? rand(0, height) : height + rand(10, 60);
      base.hue = Math.random() < 0.6 ? 28 : 275;
      base.alpha = rand(0.3, 0.8);
    }
  }
  return base;
}

function drawPetal(ctx, p) {
  const s = p.size;
  const squash = 0.35 + Math.abs(Math.cos(p.flip)) * 0.65;
  ctx.save();
  ctx.translate(p.x, p.y);
  ctx.rotate(p.angle);
  ctx.scale(1, squash);
  ctx.globalAlpha = p.alpha;
  ctx.fillStyle = SAKURA_COLORS[p.variant % SAKURA_COLORS.length];
  ctx.beginPath();
  ctx.moveTo(0, -s * 0.6);
  ctx.bezierCurveTo(s * 0.8, -s * 0.9, s * 0.9, s * 0.3, 0, s * 0.7);
  ctx.bezierCurveTo(-s * 0.9, s * 0.3, -s * 0.8, -s * 0.9, 0, -s * 0.6);
  ctx.fill();
  ctx.globalAlpha = p.alpha * 0.9;
  ctx.fillStyle = "#fff1f5";
  ctx.beginPath();
  ctx.moveTo(-s * 0.12, -s * 0.62);
  ctx.lineTo(0, -s * 0.38);
  ctx.lineTo(s * 0.12, -s * 0.62);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function drawLeaf(ctx, p, palette, vein) {
  const s = p.size;
  const squash = 0.45 + Math.abs(Math.cos(p.flip)) * 0.55;
  ctx.save();
  ctx.translate(p.x, p.y);
  ctx.rotate(p.angle);
  ctx.scale(squash, 1);
  ctx.globalAlpha = p.alpha;
  ctx.fillStyle = palette[p.variant % palette.length];
  ctx.beginPath();
  if (p.variant % 2 === 0) {
    const spikes = 5;
    for (let i = 0; i < spikes * 2; i++) {
      const r = i % 2 === 0 ? s * 0.62 : s * 0.28;
      const a = (Math.PI * i) / spikes - Math.PI / 2;
      const x = Math.cos(a) * r;
      const y = Math.sin(a) * r;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
  } else {
    ctx.moveTo(0, -s * 0.6);
    ctx.quadraticCurveTo(s * 0.55, -s * 0.05, 0, s * 0.6);
    ctx.quadraticCurveTo(-s * 0.55, -s * 0.05, 0, -s * 0.6);
  }
  ctx.closePath();
  ctx.fill();
  ctx.globalAlpha = p.alpha * 0.55;
  ctx.strokeStyle = vein;
  ctx.lineWidth = 0.8;
  ctx.beginPath();
  ctx.moveTo(0, -s * 0.5);
  ctx.lineTo(0, s * 0.75);
  ctx.stroke();
  ctx.restore();
}

function drawSand(ctx, p) {
  ctx.save();
  ctx.translate(p.x, p.y);
  if (p.variant === 2) {
    const s = p.size;
    ctx.rotate(p.angle);
    ctx.globalAlpha = p.alpha;
    ctx.strokeStyle = "#8a5a22";
    ctx.lineWidth = 1.2;
    ctx.lineCap = "round";
    for (let i = 0; i < 7; i++) {
      ctx.save();
      ctx.rotate(i * 0.9);
      ctx.beginPath();
      ctx.ellipse(0, 0, s * 0.5, s * (0.18 + (i % 3) * 0.12), 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }
    ctx.globalAlpha = p.alpha * 0.5;
    ctx.beginPath();
    ctx.arc(0, 0, s * 0.5, 0, Math.PI * 2);
    ctx.stroke();
  } else if (p.variant === 1) {
    const pulse = 0.35 + Math.abs(Math.sin(p.flip)) * 0.65;
    const r = p.size * (1.5 + pulse * 2.2);
    ctx.globalAlpha = p.alpha * pulse;
    const glow = ctx.createRadialGradient(0, 0, 0, 0, 0, r);
    glow.addColorStop(0, "rgba(255, 244, 205, 1)");
    glow.addColorStop(0.35, "rgba(255, 196, 92, 0.75)");
    glow.addColorStop(1, "rgba(255, 170, 60, 0)");
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.fill();
  } else {
    ctx.globalAlpha = p.alpha;
    ctx.rotate(Math.atan2(p.speed, p.drift));
    ctx.fillStyle = SAND_COLORS[p.hue % SAND_COLORS.length];
    ctx.beginPath();
    ctx.ellipse(0, 0, p.size * (1.4 + p.drift * 0.7), p.size * 0.65, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawHeart(ctx, p) {
  const beat = 1 + Math.max(0, Math.sin(p.flip)) * 0.14;
  const s = p.size * beat;
  const color = HEART_COLORS[p.variant % HEART_COLORS.length];
  ctx.save();
  ctx.translate(p.x, p.y);
  ctx.rotate(p.angle);
  ctx.globalAlpha = p.alpha;
  ctx.fillStyle = color;
  ctx.shadowColor = color;
  ctx.shadowBlur = Math.min(14, s * 0.7);
  ctx.beginPath();
  ctx.moveTo(0, s * 0.35);
  ctx.bezierCurveTo(s * 0.9, -s * 0.2, s * 0.55, -s * 0.85, 0, -s * 0.38);
  ctx.bezierCurveTo(-s * 0.55, -s * 0.85, -s * 0.9, -s * 0.2, 0, s * 0.35);
  ctx.closePath();
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.globalAlpha = p.alpha * 0.55;
  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  ctx.ellipse(-s * 0.3, -s * 0.38, s * 0.14, s * 0.08, -0.6, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawSnow(ctx, p) {
  const s = p.size;
  ctx.save();
  ctx.translate(p.x, p.y);
  ctx.globalAlpha = p.alpha;
  if (p.variant === 1) {
    ctx.rotate(p.angle);
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = Math.max(0.8, s * 0.16);
    ctx.lineCap = "round";
    for (let i = 0; i < 6; i++) {
      ctx.rotate(Math.PI / 3);
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(0, -s * 1.5);
      ctx.moveTo(0, -s * 0.9);
      ctx.lineTo(s * 0.45, -s * 1.25);
      ctx.moveTo(0, -s * 0.9);
      ctx.lineTo(-s * 0.45, -s * 1.25);
      ctx.stroke();
    }
  } else {
    const glow = ctx.createRadialGradient(0, 0, 0, 0, 0, s * 1.6);
    glow.addColorStop(0, "rgba(255,255,255,1)");
    glow.addColorStop(0.45, "rgba(235,246,255,0.85)");
    glow.addColorStop(1, "rgba(220,240,255,0)");
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(0, 0, s * 1.6, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawCandy(ctx, p) {
  const s = p.size;
  ctx.save();
  ctx.translate(p.x, p.y);
  ctx.globalAlpha = p.alpha;
  if (p.variant === 0) {
    const glow = ctx.createRadialGradient(0, 0, 0, 0, 0, s * 1.6);
    glow.addColorStop(0, "rgba(255,255,255,1)");
    glow.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(0, 0, s * 1.6, 0, Math.PI * 2);
    ctx.fill();
  } else if (p.variant === 1) {
    ctx.rotate(p.angle);
    const r = s * 0.5;
    ctx.save();
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.clip();
    ctx.fillStyle = "#fff7f7";
    ctx.fillRect(-r, -r, r * 2, r * 2);
    ctx.fillStyle = "#e3173e";
    for (let i = 0; i < 4; i++) {
      const a = (Math.PI / 2) * i;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, r * 1.6, a, a + Math.PI / 4);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
    ctx.strokeStyle = "rgba(255,255,255,0.9)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = "rgba(255,255,255,0.55)";
    ctx.beginPath();
    ctx.ellipse(-r * 0.35, -r * 0.4, r * 0.28, r * 0.16, -0.6, 0, Math.PI * 2);
    ctx.fill();
  } else if (p.variant === 2) {
    ctx.rotate(p.angle);
    const w = Math.max(2.4, s * 0.2);
    const len = s * 0.9;
    ctx.lineCap = "round";
    ctx.strokeStyle = "#fffafa";
    ctx.lineWidth = w;
    ctx.beginPath();
    ctx.moveTo(0, len);
    ctx.lineTo(0, -len * 0.45);
    ctx.arc(len * 0.4, -len * 0.45, len * 0.4, Math.PI, 0, false);
    ctx.stroke();
    ctx.strokeStyle = "#e3173e";
    ctx.lineWidth = w * 0.46;
    ctx.setLineDash([w * 0.9, w * 0.9]);
    ctx.beginPath();
    ctx.moveTo(0, len);
    ctx.lineTo(0, -len * 0.45);
    ctx.arc(len * 0.4, -len * 0.45, len * 0.4, Math.PI, 0, false);
    ctx.stroke();
    ctx.setLineDash([]);
  } else {
    ctx.rotate(p.angle * 0.5);
    const pulse = 0.7 + Math.abs(Math.sin(p.flip)) * 0.5;
    ctx.fillStyle = p.hue === 0 ? "#ffd9de" : "#ffffff";
    ctx.shadowColor = "rgba(255, 60, 90, 0.9)";
    ctx.shadowBlur = 8;
    ctx.beginPath();
    for (let i = 0; i < 8; i++) {
      const r = (i % 2 === 0 ? s : s * 0.22) * pulse;
      const a = (Math.PI * i) / 4 - Math.PI / 2;
      const x = Math.cos(a) * r;
      const y = Math.sin(a) * r;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
}

function drawBat(ctx, p) {
  const s = p.size;
  const flap = Math.sin(p.flip * 6) * 0.55;
  ctx.save();
  ctx.translate(p.x, p.y);
  ctx.scale(p.drift > 0 ? 1 : -1, 1);
  ctx.globalAlpha = p.alpha;
  ctx.fillStyle = "#07030d";
  ctx.strokeStyle = "rgba(255, 122, 0, 0.35)";
  ctx.lineWidth = 0.8;
  ctx.beginPath();
  ctx.moveTo(0, -s * 0.15);
  ctx.quadraticCurveTo(s * 0.5, -s * (0.7 + flap), s * 1.3, -s * (0.25 + flap));
  ctx.quadraticCurveTo(s * 1.0, s * 0.05, s * 0.75, s * 0.15);
  ctx.quadraticCurveTo(s * 0.5, s * 0.02, s * 0.3, s * 0.3);
  ctx.quadraticCurveTo(s * 0.12, s * 0.12, 0, s * 0.35);
  ctx.quadraticCurveTo(-s * 0.12, s * 0.12, -s * 0.3, s * 0.3);
  ctx.quadraticCurveTo(-s * 0.5, s * 0.02, -s * 0.75, s * 0.15);
  ctx.quadraticCurveTo(-s * 1.0, s * 0.05, -s * 1.3, -s * (0.25 + flap));
  ctx.quadraticCurveTo(-s * 0.5, -s * (0.7 + flap), 0, -s * 0.15);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(-s * 0.12, -s * 0.15);
  ctx.lineTo(-s * 0.08, -s * 0.38);
  ctx.lineTo(0, -s * 0.2);
  ctx.lineTo(s * 0.08, -s * 0.38);
  ctx.lineTo(s * 0.12, -s * 0.15);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function drawEmber(ctx, p) {
  const color = p.hue === 28 ? "255, 140, 30" : "176, 106, 255";
  const glow = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * 4);
  glow.addColorStop(0, `rgba(${color}, ${p.alpha})`);
  glow.addColorStop(1, `rgba(${color}, 0)`);
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(p.x, p.y, p.size * 4, 0, Math.PI * 2);
  ctx.fill();
}

export default function ThemeEffects({ theme, enabled = true }) {
  const canvasRef = useRef(null);
  const baseTheme = (theme || "").replace(/-light$|-dark$/, "");
  const kind = !enabled
    ? null
    : baseTheme === "sakura" ||
      baseTheme === "autumn" ||
      baseTheme === "halloween" ||
      baseTheme === "newyear" ||
      baseTheme === "snow" ||
      baseTheme === "desert" ||
      baseTheme === "love" ||
      baseTheme === "leaves"
    ? baseTheme
    : null;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!kind || !canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    let width = 0;
    let height = 0;
    let frame = 0;
    let last = 0;
    let particles = [];

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const target = Math.round(Math.min(70, Math.max(18, (width * height) / 22000)));
      const count =
        kind === "halloween"
          ? Math.round(target * 0.8)
          : kind === "snow"
          ? Math.round(target * 2.2)
          : kind === "desert"
          ? Math.round(target * 2)
          : kind === "love"
          ? Math.round(target * 0.8)
          : kind === "newyear"
          ? Math.round(target * 1.2)
          : target;
      while (particles.length < count) particles.push(spawn(kind, width, height, true));
      particles.length = Math.min(particles.length, count);
    };

    const step = (time) => {
      frame = requestAnimationFrame(step);
      const dt = Math.min(2.5, last ? (time - last) / 16.67 : 1);
      last = time;
      ctx.clearRect(0, 0, width, height);
      const gust = kind === "desert" ? 1 + 0.55 * Math.sin(time / 2400) + 0.2 * Math.sin(time / 900) : 1;
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        p.swayPhase += 0.012 * dt;
        p.flip += p.flipSpeed * dt;
        p.angle += p.spin * dt;
        const isBat = p.variant === 100;
        if (kind === "desert" && p.variant === 2) {
          p.x += p.drift * gust * dt;
          p.angle += p.drift * gust * 0.05 * dt;
          p.y = p.flip - Math.abs(Math.sin(p.angle * 0.8)) * 12;
        } else if (isBat) {
          p.x += p.drift * dt;
          p.y += (Math.sin(p.swayPhase * 2) * 0.6 + p.speed) * dt;
        } else {
          p.y += p.speed * dt;
          p.x += (p.drift * gust + Math.sin(p.swayPhase) * (p.sway / 80)) * dt;
        }

        if (kind === "sakura") drawPetal(ctx, p);
        else if (kind === "autumn") drawLeaf(ctx, p, AUTUMN_COLORS, "rgba(60, 20, 5, 0.8)");
        else if (kind === "leaves") drawLeaf(ctx, p, GREEN_COLORS, "rgba(15, 50, 10, 0.8)");
        else if (kind === "desert") drawSand(ctx, p);
        else if (kind === "love") drawHeart(ctx, p);
        else if (kind === "snow") drawSnow(ctx, p);
        else if (kind === "newyear") drawCandy(ctx, p);
        else if (isBat) drawBat(ctx, p);
        else drawEmber(ctx, p);

        const margin = 50;
        const gone = isBat
          ? p.x < -margin * 2 || p.x > width + margin * 2
          : p.speed >= 0
          ? p.y > height + margin
          : p.y < -margin;
        if (gone || (!isBat && (p.x < -margin || p.x > width + margin))) {
          particles[i] = spawn(kind, width, height, false);
        }
      }
    };

    const stop = () => {
      cancelAnimationFrame(frame);
      frame = 0;
      last = 0;
    };

    const start = () => {
      stop();
      if (reduce.matches || document.hidden) return;
      frame = requestAnimationFrame(step);
    };

    const drawStill = () => {
      ctx.clearRect(0, 0, width, height);
      for (const p of particles) {
        if (kind === "sakura") drawPetal(ctx, p);
        else if (kind === "autumn") drawLeaf(ctx, p, AUTUMN_COLORS, "rgba(60, 20, 5, 0.8)");
        else if (kind === "leaves") drawLeaf(ctx, p, GREEN_COLORS, "rgba(15, 50, 10, 0.8)");
        else if (kind === "desert") drawSand(ctx, p);
        else if (kind === "love") drawHeart(ctx, p);
        else if (kind === "snow") drawSnow(ctx, p);
        else if (kind === "newyear") drawCandy(ctx, p);
        else if (p.variant !== 100) drawEmber(ctx, p);
      }
    };

    const onMotionChange = () => {
      if (reduce.matches) {
        stop();
        drawStill();
      } else {
        start();
      }
    };

    particles = [];
    resize();
    if (reduce.matches) drawStill();
    else start();

    window.addEventListener("resize", resize);
    document.addEventListener("visibilitychange", start);
    reduce.addEventListener("change", onMotionChange);
    return () => {
      stop();
      window.removeEventListener("resize", resize);
      document.removeEventListener("visibilitychange", start);
      reduce.removeEventListener("change", onMotionChange);
    };
  }, [kind]);

  if (!kind) return null;
  return <canvas ref={canvasRef} className="theme-effects" aria-hidden="true" />;
}
