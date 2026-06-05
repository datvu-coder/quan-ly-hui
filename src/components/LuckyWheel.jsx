import React, { useRef, useState, useCallback, useEffect } from 'react';

const SIZE = 400;
const CX   = SIZE / 2;
const CY   = SIZE / 2;
const R    = 162;
const toRad = (d) => (d * Math.PI) / 180;

// Each entry: [dark/base, light/highlight]
const PALETTE = [
  ['#DC2626', '#FCA5A5'],
  ['#2563EB', '#93C5FD'],
  ['#16A34A', '#86EFAC'],
  ['#D97706', '#FDE68A'],
  ['#7C3AED', '#C4B5FD'],
  ['#0891B2', '#67E8F9'],
  ['#DB2777', '#F9A8D4'],
  ['#0284C7', '#7DD3FC'],
  ['#EA580C', '#FDBA74'],
  ['#059669', '#6EE7B7'],
  ['#9333EA', '#E9D5FF'],
  ['#475569', '#CBD5E1'],
];

// Quintic ease-out: fast start → natural deceleration
function easeOutQuint(t) {
  return 1 - Math.pow(1 - t, 5);
}

function segPath(startDeg, endDeg, r = R) {
  const x1 = CX + r * Math.cos(toRad(startDeg));
  const y1 = CY + r * Math.sin(toRad(startDeg));
  const x2 = CX + r * Math.cos(toRad(endDeg));
  const y2 = CY + r * Math.sin(toRad(endDeg));
  const large = endDeg - startDeg > 180 ? 1 : 0;
  return `M${CX},${CY} L${x1},${y1} A${r},${r} 0 ${large} 1 ${x2},${y2} Z`;
}

// Web Audio tick — created on first user gesture
function createAudioCtx() {
  try { return new (window.AudioContext || window.webkitAudioContext)(); } catch { return null; }
}
function playTick(ctx, freq = 900) {
  if (!ctx) return;
  try {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain); gain.connect(ctx.destination);
    osc.type = 'triangle';
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.09, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.042);
    osc.start(); osc.stop(ctx.currentTime + 0.042);
  } catch {}
}

// Canvas confetti burst
function launchConfetti(canvas) {
  if (!canvas) return () => {};
  const ctx = canvas.getContext('2d');
  const W = canvas.width; const H = canvas.height;
  const particles = Array.from({ length: 95 }, (_, i) => ({
    x: W * 0.5 + (Math.random() - 0.5) * W * 0.45,
    y: H * 0.32,
    vx: (Math.random() - 0.5) * 10,
    vy: -Math.random() * 15 - 2,
    w: Math.random() * 8 + 3,
    h: Math.random() * 5 + 2,
    color: PALETTE[i % PALETTE.length][Math.random() > 0.45 ? 0 : 1],
    rot: Math.random() * Math.PI * 2,
    rv: (Math.random() - 0.5) * 0.28,
    gravity: 0.36 + Math.random() * 0.24,
    alpha: 1,
    circle: Math.random() > 0.55,
  }));
  let raf;
  const draw = () => {
    ctx.clearRect(0, 0, W, H);
    let alive = false;
    particles.forEach((p) => {
      p.x += p.vx; p.y += p.vy; p.vy += p.gravity; p.vx *= 0.988;
      p.rot += p.rv; p.alpha -= 0.012;
      if (p.alpha <= 0) return;
      alive = true;
      ctx.save();
      ctx.globalAlpha = Math.max(0, p.alpha);
      ctx.translate(p.x, p.y); ctx.rotate(p.rot);
      ctx.fillStyle = p.color;
      if (p.circle) {
        ctx.beginPath(); ctx.arc(0, 0, p.w * 0.45, 0, Math.PI * 2); ctx.fill();
      } else {
        ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
      }
      ctx.restore();
    });
    if (alive) raf = requestAnimationFrame(draw);
    else ctx.clearRect(0, 0, W, H);
  };
  draw();
  return () => { cancelAnimationFrame(raf); ctx.clearRect(0, 0, W, H); };
}

export default function LuckyWheel({ members, onSelect }) {
  const [spinning, setSpinning]   = useState(false);
  const [winnerIdx, setWinnerIdx] = useState(null);
  const [ptrBounce, setPtrBounce] = useState(false);
  const rotRef       = useRef(0);
  const rafRef       = useRef(null);
  const wheelGRef    = useRef(null);
  const audioRef     = useRef(null);
  const lastSegRef   = useRef(-1);
  const canvasRef    = useRef(null);
  const stopConfetti = useRef(null);

  const n   = members.length;
  const seg = n > 0 ? 360 / n : 360;

  useEffect(() => () => {
    cancelAnimationFrame(rafRef.current);
    stopConfetti.current?.();
  }, []);

  const spin = useCallback(() => {
    if (spinning || n < 2) return;
    // Initialise audio on first user gesture
    if (!audioRef.current) audioRef.current = createAudioCtx();
    audioRef.current?.resume?.();
    stopConfetti.current?.(); stopConfetti.current = null;
    cancelAnimationFrame(rafRef.current);
    setWinnerIdx(null); setPtrBounce(false); setSpinning(true);

    const idx        = Math.floor(Math.random() * n);
    const baseTarget = -(idx * seg + seg / 2);
    const diff       = ((baseTarget - rotRef.current) % 360 + 360) % 360 || 360;
    const extraSpins = (6 + Math.floor(Math.random() * 5)) * 360;
    const totalDelta = diff + extraSpins;
    const startRot   = rotRef.current;
    const duration   = 5800 + Math.random() * 1600; // 5.8 – 7.4 s
    const startTime  = performance.now();

    const animate = (now) => {
      const t   = Math.min((now - startTime) / duration, 1);
      const rot = startRot + totalDelta * easeOutQuint(t);

      if (wheelGRef.current)
        wheelGRef.current.setAttribute('transform', `rotate(${rot} ${CX} ${CY})`);

      // Detect segment crossing for tick sound
      const norm   = ((-rot % 360) + 360) % 360;
      const curSeg = Math.floor(norm / seg) % n;
      if (curSeg !== lastSegRef.current) {
        const speed = Math.max(0, 1 - t); // 1 = fast, 0 = stopped
        playTick(audioRef.current, 500 + speed * 700);
        lastSegRef.current = curSeg;
      }

      if (t < 1) {
        rafRef.current = requestAnimationFrame(animate);
      } else {
        rotRef.current = startRot + totalDelta;
        setSpinning(false); setWinnerIdx(idx);
        setPtrBounce(true); setTimeout(() => setPtrBounce(false), 850);
        stopConfetti.current = launchConfetti(canvasRef.current);
      }
    };
    rafRef.current = requestAnimationFrame(animate);
  }, [spinning, n, seg]);

  const reset  = () => { setWinnerIdx(null); stopConfetti.current?.(); stopConfetti.current = null; };
  const winner = winnerIdx !== null ? members[winnerIdx] : null;

  if (n === 0)
    return <p className="text-sm text-gray-400 text-center py-8">Không có thành viên nào.</p>;

  return (
    <>
      <style>{`
        @keyframes wglow {
          0%,100% { filter: drop-shadow(0 0 8px rgba(251,191,36,.5)); }
          50%      { filter: drop-shadow(0 0 34px rgba(251,191,36,.95)) drop-shadow(0 0 60px rgba(251,191,36,.35)); }
        }
        @keyframes wpop {
          0%   { opacity:0; transform:scale(.7) translateY(20px); }
          60%  { transform:scale(1.08) translateY(-5px); }
          80%  { transform:scale(.96) translateY(2px); }
          100% { opacity:1; transform:scale(1) translateY(0); }
        }
        @keyframes ptridle {
          0%,100% { transform:translateX(-50%) translateY(0); }
          50%     { transform:translateX(-50%) translateY(-3px); }
        }
        @keyframes ptrbounce {
          0%  { transform:translateX(-50%) rotate(0deg); }
          20% { transform:translateX(-50%) rotate(-20deg); }
          45% { transform:translateX(-50%) rotate(13deg); }
          65% { transform:translateX(-50%) rotate(-7deg); }
          80% { transform:translateX(-50%) rotate(4deg); }
          92% { transform:translateX(-50%) rotate(-2deg); }
          100%{ transform:translateX(-50%) rotate(0deg); }
        }
        @keyframes wsegpulse { 0%,100%{opacity:.12} 50%{opacity:.44} }
        @keyframes rimdotblink { 0%,100%{opacity:.45} 50%{opacity:1} }
        @keyframes shimmer { 0%{transform:translateX(-100%)} 100%{transform:translateX(200%)} }
        .wglow       { animation: wglow .72s ease-in-out infinite; }
        .wpop        { animation: wpop .6s cubic-bezier(.22,1,.36,1) forwards; }
        .ptr-idle    { animation: ptridle 2.3s ease-in-out infinite; }
        .ptr-bounce  { animation: ptrbounce .82s cubic-bezier(.22,1,.36,1) forwards; }
        .wseg-pulse  { animation: wsegpulse 1.25s ease-in-out infinite; }
        .rim-blink   { animation: rimdotblink .55s ease-in-out infinite; }
        .btn-shimmer { animation: shimmer 2.4s ease-in-out infinite; }
      `}</style>

      <div className="flex flex-col items-center gap-5 select-none py-2">

        {/* ── Wheel wrapper ─────────────────────────────────────────── */}
        <div className="relative w-full max-w-[390px] mx-auto">

          {/* Confetti canvas — same size as rendered wheel area */}
          <canvas
            ref={canvasRef}
            className="absolute inset-0 pointer-events-none z-30"
            style={{ width: '100%', height: '100%' }}
            width={780} height={780}
          />

          {/* ── Pointer ── */}
          <div
            className={`absolute left-1/2 z-20 pointer-events-none ${
              ptrBounce ? 'ptr-bounce' : spinning ? '' : 'ptr-idle'
            }`}
            style={{ top: -5, transform: 'translateX(-50%)' }}
          >
            <svg width={38} height={56} viewBox="0 0 38 56" overflow="visible">
              <defs>
                <linearGradient id="pg" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%"   stopColor="#FEE2E2"/>
                  <stop offset="40%"  stopColor="#F87171"/>
                  <stop offset="100%" stopColor="#991B1B"/>
                </linearGradient>
                <filter id="psh" x="-60%" y="-30%" width="220%" height="220%">
                  <feDropShadow dx="0" dy="5" stdDeviation="4.5" floodColor="#7f1d1d" floodOpacity=".65"/>
                </filter>
              </defs>
              {/* Arrow body */}
              <polygon points="19,5 34,49 19,40 4,49" fill="url(#pg)" filter="url(#psh)"/>
              <polygon points="19,5 34,49 19,40 4,49" fill="none" stroke="rgba(255,255,255,.85)" strokeWidth="1.5" strokeLinejoin="round"/>
              {/* Tip highlight */}
              <polygon points="19,5 25,21 19,19 13,21" fill="rgba(255,255,255,.55)"/>
              {/* Base gem */}
              <circle cx="19" cy="49" r="6.5" fill="white" stroke="#DC2626" strokeWidth="2.5"/>
              <circle cx="19" cy="49" r="3.2" fill="#FCA5A5"/>
              <circle cx="17" cy="47" r="1.2" fill="white" opacity=".7"/>
            </svg>
          </div>

          {/* ── SVG Wheel ── */}
          <svg
            style={{ width: '100%', height: 'auto' }}
            viewBox={`0 0 ${SIZE} ${SIZE}`}
            overflow="visible"
            className={spinning ? 'wglow' : ''}
          >
            <defs>
              {/* Per-segment radial gradients for 3-D depth */}
              {PALETTE.map(([dark, light], i) => (
                <radialGradient key={i} id={`sg${i}`} cx="38%" cy="28%" r="78%">
                  <stop offset="0%"   stopColor={light} stopOpacity=".75"/>
                  <stop offset="100%" stopColor={dark}/>
                </radialGradient>
              ))}

              {/* Gold rim gradient */}
              <linearGradient id="rim" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%"   stopColor="#FFFBEB"/>
                <stop offset="22%"  stopColor="#FDE047"/>
                <stop offset="58%"  stopColor="#D97706"/>
                <stop offset="100%" stopColor="#78350F"/>
              </linearGradient>

              {/* Hub gradient */}
              <radialGradient id="hub" cx="37%" cy="29%" r="72%">
                <stop offset="0%"   stopColor="#64748B"/>
                <stop offset="100%" stopColor="#020617"/>
              </radialGradient>

              {/* Fixed gloss sheen */}
              <radialGradient id="sheen" cx="30%" cy="23%" r="62%">
                <stop offset="0%"   stopColor="white" stopOpacity=".32"/>
                <stop offset="52%"  stopColor="white" stopOpacity=".07"/>
                <stop offset="100%" stopColor="white" stopOpacity="0"/>
              </radialGradient>
            </defs>

            {/* Outer halo rings */}
            <circle cx={CX} cy={CY} r={R+30} fill="none" stroke="#FDE68A" strokeWidth="1.1" opacity="0.22"/>
            <circle cx={CX} cy={CY} r={R+24} fill="none" stroke="#FCD34D" strokeWidth="0.7" opacity="0.16"/>

            {/* Gold rim */}
            <circle cx={CX} cy={CY} r={R+19} fill="url(#rim)"/>
            {/* Rim inner highlight line */}
            <circle cx={CX} cy={CY} r={R+17} fill="none" stroke="rgba(255,255,255,.6)" strokeWidth="1.5"/>
            <circle cx={CX} cy={CY} r={R+4}  fill="none" stroke="rgba(255,255,255,.28)" strokeWidth="1"/>

            {/* Decorative gem dots at each segment boundary */}
            {Array.from({ length: n }).map((_, i) => {
              const a  = i * seg - 90;
              const cx = CX + (R + 11) * Math.cos(toRad(a));
              const cy = CY + (R + 11) * Math.sin(toRad(a));
              return (
                <g key={i} className={spinning ? 'rim-blink' : ''}
                  style={spinning ? { animationDelay: `${(i * 0.07).toFixed(2)}s` } : {}}>
                  <circle cx={cx} cy={cy} r={4.5} fill="#FEF3C7" stroke="#B45309" strokeWidth="1.3"/>
                  <circle cx={cx - 1} cy={cy - 1} r={1.5} fill="rgba(255,255,255,.7)"/>
                </g>
              );
            })}

            {/* ── Rotating group (DOM-direct for perf) ── */}
            <g ref={wheelGRef} transform={`rotate(${rotRef.current} ${CX} ${CY})`}>
              {members.map((m, i) => {
                const startDeg = i * seg - 90;
                const endDeg   = (i + 1) * seg - 90;
                const midDeg   = (startDeg + endDeg) / 2;
                const textR    = R * 0.6;
                const tx       = CX + textR * Math.cos(toRad(midDeg));
                const ty       = CY + textR * Math.sin(toRad(midDeg));
                const isWinner = winner && m.id === winner.id;
                const dimmed   = winner && !isWinner;
                const maxLen   = n > 10 ? 5 : n > 7 ? 6 : 8;
                const label    = m.name.length > maxLen ? m.name.slice(0, maxLen - 1) + '…' : m.name;
                const fs       = n > 10 ? 8 : n > 7 ? 10 : n > 5 ? 11.5 : 13.5;
                const rot      = `rotate(${midDeg + 90},${tx},${ty})`;
                const ci       = i % PALETTE.length;

                return (
                  <g key={m.id} style={{ opacity: dimmed ? 0.13 : 1, transition: 'opacity .65s ease' }}>
                    {/* Gradient fill */}
                    <path d={segPath(startDeg, endDeg)} fill={`url(#sg${ci})`}/>
                    {/* Segment border */}
                    <path d={segPath(startDeg, endDeg)} fill="none" stroke="rgba(255,255,255,.7)" strokeWidth="2"/>
                    {/* Winner glow overlay */}
                    {isWinner && (
                      <path d={segPath(startDeg, endDeg)} fill="white" className="wseg-pulse"/>
                    )}
                    {/* Text shadow */}
                    <text x={tx} y={ty} textAnchor="middle" dominantBaseline="middle"
                      fill="rgba(0,0,0,.38)" fontSize={fs} fontWeight="800"
                      transform={rot} dx={0.8} dy={1}>{label}</text>
                    {/* Text */}
                    <text x={tx} y={ty} textAnchor="middle" dominantBaseline="middle"
                      fill="white" fontSize={fs} fontWeight="800" fontFamily="system-ui,sans-serif"
                      transform={rot} style={{ pointerEvents: 'none' }}>{label}</text>
                  </g>
                );
              })}

              {/* Hub center */}
              <circle cx={CX} cy={CY} r={45} fill="url(#hub)"/>
              <circle cx={CX} cy={CY} r={41} fill="none" stroke="#FCD34D" strokeWidth="2.8"/>
              <circle cx={CX} cy={CY} r={37} fill="none" stroke="#F59E0B" strokeWidth="0.9" opacity="0.55"/>
              <circle cx={CX} cy={CY} r={32} fill="none" stroke="#FDE68A" strokeWidth="0.5" opacity="0.3"/>
              {/* Hub text */}
              <text x={CX} y={CY - 11} textAnchor="middle" dominantBaseline="middle"
                fontSize={14.5} fontWeight="900" fill="#FCD34D" fontFamily="system-ui,sans-serif"
                letterSpacing="2">HỤI</text>
              <text x={CX} y={CY + 11} textAnchor="middle" dominantBaseline="middle"
                fontSize={10} fontWeight="700" fill="#F59E0B" fontFamily="system-ui,sans-serif"
                letterSpacing="1">PRO</text>
            </g>

            {/* Fixed gloss sheen — stays in place while wheel rotates */}
            <circle cx={CX} cy={CY} r={R} fill="url(#sheen)" style={{ pointerEvents: 'none' }}/>
          </svg>
        </div>

        {/* ── Winner card ─────────────────────────────────────────── */}
        {winner && !spinning && (
          <div className="wpop w-full max-w-[300px] text-center space-y-4 relative z-10">
            <p className="text-4xl leading-none">🎊</p>
            <div className="relative bg-gradient-to-br from-amber-50 via-yellow-50 to-orange-50 border-2 border-amber-300/80 rounded-2xl px-6 py-5 shadow-2xl shadow-amber-200/70">
              {/* Badge */}
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 whitespace-nowrap
                bg-gradient-to-r from-amber-500 to-orange-500 text-white
                text-[10px] font-black px-4 py-1 rounded-full tracking-widest uppercase shadow-md">
                🎯 Người hốt hụi
              </div>
              <p className="text-[30px] font-black mt-1 leading-tight
                bg-gradient-to-br from-amber-500 via-orange-500 to-red-500 bg-clip-text text-transparent">
                {winner.name}
              </p>
            </div>
            <div className="flex gap-3 justify-center">
              <button type="button" onClick={reset}
                className="px-5 py-2.5 rounded-xl bg-white border-2 border-gray-200 text-gray-600
                  text-sm font-semibold hover:bg-gray-50 shadow-sm transition-all active:scale-95">
                Quay lại
              </button>
              <button type="button" onClick={() => onSelect(winner.id)}
                className="px-7 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 to-orange-500
                  text-white font-bold text-sm shadow-lg shadow-amber-300/50
                  hover:shadow-xl hover:shadow-amber-400/60 hover:-translate-y-0.5
                  transition-all active:scale-95">
                Xác nhận ✓
              </button>
            </div>
          </div>
        )}

        {/* ── Spin button ─────────────────────────────────────────── */}
        {!winner && (
          <div className="flex flex-col items-center gap-2">
            <button
              type="button"
              onClick={spin}
              disabled={spinning || n < 2}
              className={`relative overflow-hidden px-14 py-4 rounded-2xl font-black text-lg
                transition-all duration-150 ${
                  spinning
                    ? 'bg-gradient-to-r from-amber-300 to-orange-400 text-white/80 cursor-not-allowed'
                    : n < 2
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-gradient-to-r from-amber-400 via-orange-400 to-orange-500 text-white ' +
                      'shadow-xl shadow-amber-400/45 hover:shadow-2xl hover:shadow-amber-500/55 ' +
                      'hover:-translate-y-1 active:scale-95 active:translate-y-0'
                }`}
            >
              {/* Shimmer sweep on idle button */}
              {!spinning && n >= 2 && (
                <span className="btn-shimmer absolute inset-0 bg-gradient-to-r from-transparent via-white/25 to-transparent pointer-events-none"/>
              )}
              {spinning ? (
                <span className="flex items-center gap-2.5">
                  <svg className="animate-spin w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" stroke="white" strokeWidth="3" opacity=".3"/>
                    <path fill="white" d="M4 12a8 8 0 018-8V0C5.4 0 0 5.4 0 12h4z"/>
                  </svg>
                  Đang quay...
                </span>
              ) : '🎰 Quay ngay!'}
            </button>
            {n < 2 && (
              <p className="text-xs text-gray-400">Cần ít nhất 2 thành viên để quay.</p>
            )}
          </div>
        )}

      </div>
    </>
  );
}
