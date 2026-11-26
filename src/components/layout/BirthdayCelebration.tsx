import React, { useCallback, useEffect, useRef, useState } from 'react';
import { claimBirthdayView } from '../../lib/birthday';

type Spark = { x: number; y: number; vx: number; vy: number; life: number; max: number; size: number; c: string; kind: 'dot' | 'conf'; rot: number; vr: number };
const GOLD = ['#f7e7b4', '#e8c872', '#d4af37', '#fff4d0', '#c9a24a'];

// Happy Birthday, notes as [MIDI-ish semitone offset from C4, beats]
const MELODY: [number, number][] = [
  [0, 0.75], [0, 0.25], [2, 1], [0, 1], [5, 1], [4, 2],
  [0, 0.75], [0, 0.25], [2, 1], [0, 1], [7, 1], [5, 2],
  [0, 0.75], [0, 0.25], [12, 1], [9, 1], [5, 1], [4, 1], [2, 2],
  [10, 0.75], [10, 0.25], [9, 1], [5, 1], [7, 1], [5, 2],
];

const makeMusic = () => {
  const AC: typeof AudioContext = (window as any).AudioContext || (window as any).webkitAudioContext;
  const ctx = new AC();
  const master = ctx.createGain();
  master.gain.value = 0.0001;
  master.connect(ctx.destination);
  let timer: number | undefined;
  let step = 0;
  const bpm = 92;
  const note = (semi: number, beats: number, when: number) => {
    const f = 261.63 * Math.pow(2, semi / 12);
    const dur = (60 / bpm) * beats;
    for (const [mult, vol] of [[1, 0.5], [2, 0.18]] as const) {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = 'triangle';
      o.frequency.value = f * mult;
      g.gain.setValueAtTime(0.0001, when);
      g.gain.linearRampToValueAtTime(vol, when + 0.02);
      g.gain.exponentialRampToValueAtTime(0.001, when + dur * 1.4);
      o.connect(g); g.connect(master);
      o.start(when); o.stop(when + dur * 1.5);
    }
  };
  const schedule = () => {
    const now = ctx.currentTime;
    let t = now + 0.05;
    for (let i = 0; i < 4; i++) {
      const [semi, beats] = MELODY[step % MELODY.length];
      note(semi, beats, t);
      t += (60 / bpm) * beats;
      step++;
      if (step % MELODY.length === 0) t += 1.2;
    }
    timer = window.setTimeout(schedule, Math.max(200, (t - ctx.currentTime - 0.4) * 1000));
  };
  const boom = () => {
    const t = ctx.currentTime;
    const o = ctx.createOscillator(); const g = ctx.createGain();
    o.type = 'sine'; o.frequency.setValueAtTime(130, t); o.frequency.exponentialRampToValueAtTime(40, t + 0.45);
    g.gain.setValueAtTime(0.5, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.7);
    o.connect(g); g.connect(master); o.start(t); o.stop(t + 0.8);
  };
  return {
    start() { void ctx.resume(); master.gain.cancelScheduledValues(ctx.currentTime); master.gain.linearRampToValueAtTime(0.3, ctx.currentTime + 0.4); if (timer === undefined) schedule(); },
    stop() { master.gain.cancelScheduledValues(ctx.currentTime); master.gain.linearRampToValueAtTime(0.0001, ctx.currentTime + 0.3); if (timer !== undefined) { clearTimeout(timer); timer = undefined; } },
    boom,
    close() { if (timer !== undefined) clearTimeout(timer); void ctx.close(); },
  };
};

export const BirthdayCelebration: React.FC = () => {
  const [open, setOpen] = useState<boolean>(() => claimBirthdayView());
  const [leaving, setLeaving] = useState(false);
  const [sound, setSound] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const musicRef = useRef<ReturnType<typeof makeMusic> | null>(null);
  const soundRef = useRef(false);
  const btnRef = useRef<HTMLButtonElement>(null);
  const reduced = useRef(typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches);

  const dismiss = useCallback(() => {
    setLeaving(true);
    window.setTimeout(() => setOpen(false), reduced.current ? 0 : 600);
  }, []);

  // Lock page scroll while open only; always restore.
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    btnRef.current?.focus();
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') dismiss(); };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', onKey);
      musicRef.current?.close();
      musicRef.current = null;
    };
  }, [open, dismiss]);

  // Particles (gold dust, confetti, soft firework bursts). Static dots when reduced motion is on.
  useEffect(() => {
    if (!open) return;
    const cv = canvasRef.current;
    if (!cv) return;
    const ctx = cv.getContext('2d');
    if (!ctx) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let w = 0, h = 0, raf = 0;
    const resize = () => {
      w = window.innerWidth; h = window.innerHeight;
      cv.width = w * dpr; cv.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener('resize', resize);
    const pick = () => GOLD[Math.floor(Math.random() * GOLD.length)];
    const sparks: Spark[] = [];
    const dust = (n: number) => {
      for (let i = 0; i < n; i++) sparks.push({ x: Math.random() * w, y: h + 10, vx: (Math.random() - 0.5) * 12, vy: -(15 + Math.random() * 30), life: 0, max: 8 + Math.random() * 6, size: 1 + Math.random() * 2, c: pick(), kind: 'dot', rot: 0, vr: 0 });
    };
    if (reduced.current) {
      ctx.clearRect(0, 0, w, h);
      for (let i = 0; i < 70; i++) { ctx.globalAlpha = 0.25 + Math.random() * 0.5; ctx.fillStyle = pick(); ctx.beginPath(); ctx.arc(Math.random() * w, Math.random() * h, 1 + Math.random() * 2, 0, 7); ctx.fill(); }
      return () => window.removeEventListener('resize', resize);
    }
    const confetti = (n: number) => {
      for (let i = 0; i < n; i++) sparks.push({ x: Math.random() * w, y: -10, vx: (Math.random() - 0.5) * 40, vy: 40 + Math.random() * 70, life: 0, max: 9 + Math.random() * 5, size: 4 + Math.random() * 5, c: pick(), kind: 'conf', rot: Math.random() * 6, vr: (Math.random() - 0.5) * 6 });
    };
    const burst = () => {
      const x = w * (0.15 + Math.random() * 0.7), y = h * (0.12 + Math.random() * 0.4);
      const n = 46;
      for (let i = 0; i < n; i++) { const a = (i / n) * Math.PI * 2, v = 70 + Math.random() * 90; sparks.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: 0, max: 1.3 + Math.random() * 0.8, size: 1.6 + Math.random() * 1.4, c: pick(), kind: 'dot', rot: 0, vr: 0 }); }
      if (soundRef.current) musicRef.current?.boom();
    };
    dust(60); confetti(40);
    let last = performance.now(), tDust = 0, tConf = 0, tBurst = 0.8;
    const frame = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.05); last = now;
      tDust += dt; tConf += dt; tBurst -= dt;
      if (tDust > 0.25) { tDust = 0; dust(3); }
      if (tConf > 0.6) { tConf = 0; confetti(4); }
      if (tBurst <= 0) { tBurst = 1.6 + Math.random() * 1.6; burst(); }
      ctx.clearRect(0, 0, w, h);
      for (let i = sparks.length - 1; i >= 0; i--) {
        const s = sparks[i];
        s.life += dt;
        if (s.life > s.max || s.y > h + 20) { sparks.splice(i, 1); continue; }
        if (s.kind === 'dot' && s.max < 3) s.vy += 80 * dt;
        s.x += s.vx * dt; s.y += s.vy * dt; s.rot += s.vr * dt;
        const fade = s.kind === 'dot' && s.max < 3 ? 1 - s.life / s.max : Math.min(1, s.life / 1.5, (s.max - s.life) / 1.5);
        ctx.globalAlpha = Math.max(0, fade) * 0.9;
        ctx.fillStyle = s.c;
        if (s.kind === 'conf') { ctx.save(); ctx.translate(s.x, s.y); ctx.rotate(s.rot); ctx.fillRect(-s.size / 2, -s.size / 4, s.size, s.size / 2); ctx.restore(); }
        else { ctx.beginPath(); ctx.arc(s.x, s.y, s.size, 0, 7); ctx.fill(); }
      }
      ctx.globalAlpha = 1;
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', resize); };
  }, [open]);

  const toggleSound = () => {
    const next = !soundRef.current;
    soundRef.current = next;
    setSound(next);
    if (next) { if (!musicRef.current) musicRef.current = makeMusic(); musicRef.current.start(); }
    else musicRef.current?.stop();
  };

  if (!open) return null;

  const fade = reduced.current ? 'none' : 'bdayFade 0.9s ease both';
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="bday-title"
      dir="ltr"
      style={{
        position: 'fixed', inset: 0, zIndex: 2147483000, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'auto',
        background: 'radial-gradient(ellipse at 50% 30%, #14284f 0%, #0a1530 55%, #050b1c 100%)',
        opacity: leaving ? 0 : 1, transition: reduced.current ? 'none' : 'opacity 0.6s ease',
        fontFamily: "'Cormorant Garamond', 'Playfair Display', Georgia, 'Times New Roman', serif", color: '#f7e7b4',
      }}
    >
      <style>{`
        @keyframes bdayFade { from { opacity: 0; transform: translateY(18px); } to { opacity: 1; transform: none; } }
        @keyframes bdayGlow { 0%,100% { box-shadow: 0 0 40px rgba(232,200,114,.35); } 50% { box-shadow: 0 0 70px rgba(232,200,114,.6); } }
        .bday-btn:focus-visible, .bday-icon:focus-visible { outline: 3px solid #fff4d0; outline-offset: 3px; }
        .bday-btn:hover { background: linear-gradient(135deg,#fff4d0,#e8c872); }
      `}</style>
      <canvas ref={canvasRef} aria-hidden="true" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }} />
      <div aria-hidden="true" style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle at 50% 38%, rgba(232,200,114,.16), transparent 55%)', pointerEvents: 'none' }} />

      <button type="button" className="bday-icon" onClick={dismiss} aria-label="Close birthday greeting" style={{ ...iconBtn, top: 16, right: 16 }}>
        <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true"><path d="M4 4l12 12M16 4L4 16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
      </button>
      <button type="button" className="bday-icon" onClick={toggleSound} aria-pressed={sound} aria-label={sound ? 'Turn music off' : 'Turn music on'} style={{ ...iconBtn, top: 16, left: 16 }}>
        {sound ? (
          <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9v6h4l5 4V5L8 9H4z" fill="currentColor" /><path d="M16 8.5a5 5 0 010 7M18.5 6a8.5 8.5 0 010 12" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" /></svg>
        ) : (
          <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9v6h4l5 4V5L8 9H4z" fill="currentColor" /><path d="M16 9l6 6M22 9l-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
        )}
      </button>

      <div style={{ position: 'relative', textAlign: 'center', padding: '72px 24px 48px', maxWidth: 760, animation: fade }}>
        <div style={{ width: 96, height: 96, margin: '0 auto 28px', borderRadius: '50%', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', animation: reduced.current ? 'none' : 'bdayGlow 3.5s ease-in-out infinite', boxShadow: '0 0 40px rgba(232,200,114,.4)' }}>
          <img src="/brand/clinic-logo.png" alt="" width={84} height={84} style={{ borderRadius: '50%' }} />
        </div>
        <div style={{ width: 120, height: 1, background: 'linear-gradient(90deg,transparent,#d4af37,transparent)', margin: '0 auto 24px' }} />
        <h1 id="bday-title" style={{ margin: 0, fontWeight: 600, lineHeight: 1.15, fontSize: 'clamp(34px, 7.5vw, 68px)', letterSpacing: '0.01em', background: 'linear-gradient(180deg,#fff4d0 0%,#e8c872 55%,#c9a24a 100%)', WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent', textShadow: 'none' }}>
          Happy Birthday,<br />Dr. Mohammed
        </h1>
        <div style={{ width: 120, height: 1, background: 'linear-gradient(90deg,transparent,#d4af37,transparent)', margin: '26px auto 20px' }} />
        <p style={{ margin: 0, fontSize: 'clamp(18px, 3.6vw, 28px)', fontStyle: 'italic', letterSpacing: '0.06em', color: '#e8dcb8' }}>A Special Day for a Special Doctor</p>
        <button ref={btnRef} type="button" className="bday-btn" onClick={dismiss} style={{ marginTop: 44, padding: '16px 40px', minHeight: 52, borderRadius: 999, border: '1px solid #fff4d0', background: 'linear-gradient(135deg,#e8c872,#c9a24a)', color: '#0a1530', fontSize: 'clamp(17px, 3.4vw, 20px)', fontWeight: 700, letterSpacing: '0.04em', cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 8px 30px rgba(212,175,55,.35)' }}>
          Continue to Website
        </button>
      </div>
    </div>
  );
};

const iconBtn: React.CSSProperties = { position: 'absolute', width: 44, height: 44, borderRadius: '50%', border: '1px solid rgba(232,200,114,.55)', background: 'rgba(10,21,48,.6)', color: '#e8c872', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', zIndex: 2 };
