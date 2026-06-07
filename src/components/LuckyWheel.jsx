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

// Cubic ease-out: gentler deceleration — wheel stays visibly spinning longer
function easeOutCubic(t) {
  return 1 - Math.pow(1 - t, 3);
}

// Cryptographically secure random — không thể đoán/dự đoán được
function rand() {
  const buf = new Uint32Array(1);
  crypto.getRandomValues(buf);
  return buf[0] / 0x100000000; // [0, 1)
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

// Victory fanfare khi có người thắng
function playFanfare(ctx) {
  if (!ctx) return;
  try {
    ctx.resume?.();
    // ta-ta-ta-TAAAA! (C5 E5 G5 C6 – G5 – C6)
    const notes = [
      [523.25, 0.00, 0.11],
      [659.25, 0.10, 0.11],
      [783.99, 0.20, 0.11],
      [1046.5, 0.31, 0.52],
      [783.99, 0.57, 0.09],
      [1046.5, 0.68, 0.65],
    ];
    notes.forEach(([freq, start, dur]) => {
      // Square wave (brightness) + sine (warmth) = trumpet-like
      ['square', 'sine'].forEach((type, i) => {
        const osc = ctx.createOscillator();
        const g   = ctx.createGain();
        osc.connect(g); g.connect(ctx.destination);
        osc.type = type;
        osc.frequency.value = freq;
        const vol = i === 0 ? 0.13 : 0.07;
        const t   = ctx.currentTime + start;
        g.gain.setValueAtTime(0, t);
        g.gain.linearRampToValueAtTime(vol, t + 0.018);
        g.gain.setValueAtTime(vol, t + dur - 0.04);
        g.gain.linearRampToValueAtTime(0, t + dur);
        osc.start(t); osc.stop(t + dur + 0.01);
      });
    });
  } catch {}
}

// Canvas confetti burst
function launchConfetti(canvas) {
  if (!canvas) return () => {};
  const ctx = canvas.getContext('2d');
  const W = canvas.width; const H = canvas.height;
  const particles = Array.from({ length: 95 }, (_, i) => ({
    x: W * 0.5 + (rand() - 0.5) * W * 0.45,
    y: H * 0.32,
    vx: (rand() - 0.5) * 10,
    vy: -rand() * 15 - 2,
    w: rand() * 8 + 3,
    h: rand() * 5 + 2,
    color: PALETTE[i % PALETTE.length][rand() > 0.45 ? 0 : 1],
    rot: rand() * Math.PI * 2,
    rv: (rand() - 0.5) * 0.28,
    gravity: 0.36 + rand() * 0.24,
    alpha: 1,
    circle: rand() > 0.55,
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
  const [spinning, setSpinning]     = useState(false);
  const [winnerIdx, setWinnerIdx]   = useState(null);
  const [ptrBounce, setPtrBounce]   = useState(false);
  const [isCharging, setIsCharging] = useState(false);
  const rotRef           = useRef(0);
  const rafRef           = useRef(null);
  const wheelGRef        = useRef(null);
  const audioRef         = useRef(null);
  const lastSegRef       = useRef(-1);
  const lastWinnerIdxRef = useRef(-1); // tránh trúng cùng 1 người 2 lần liên tiếp
  const canvasRef     = useRef(null);
  const stopConfetti  = useRef(null);
  // Charge (hold-to-spin) refs
  const chargeRef      = useRef(0);      // current power 0-1
  const chargeStartRef = useRef(0);      // timestamp khi bắt đầu giữ
  const chargeRafRef   = useRef(null);   // RAF cho power bar
  const isChargingRef  = useRef(false);  // mirror isCharging, tránh stale closure
  const spinFnRef      = useRef(null);   // ref tới spinWithPower để releaseCharge dùng
  const powerBarRef    = useRef(null);   // DOM ref → cập nhật trực tiếp (không re-render)
  const powerLabelRef  = useRef(null);

  const n   = members.length;
  const seg = n > 0 ? 360 / n : 360;

  useEffect(() => () => {
    cancelAnimationFrame(rafRef.current);
    cancelAnimationFrame(chargeRafRef.current);
    stopConfetti.current?.();
  }, []);

  // power: 0–1, điều khiển số vòng và thời gian quay
  const spinWithPower = useCallback((power = 0.7) => {
    if (spinning || n < 2) return;
    if (!audioRef.current) audioRef.current = createAudioCtx();
    audioRef.current?.resume?.();
    stopConfetti.current?.(); stopConfetti.current = null;
    cancelAnimationFrame(rafRef.current);
    setWinnerIdx(null); setPtrBounce(false); setSpinning(true);

    // Loại trừ người vừa trúng ở lần quay trước (n-1 slot còn lại, phân phối đều)
    const excluded = lastWinnerIdxRef.current;
    let idx;
    if (excluded >= 0 && n >= 2) {
      const r = Math.floor(rand() * (n - 1));
      idx = r >= excluded ? r + 1 : r;
    } else {
      idx = Math.floor(rand() * n);
    }
    const landOffset = (rand() - 0.5) * seg * 0.6;
    const baseTarget = -(idx * seg + seg / 2 + landOffset);
    const diff       = ((baseTarget - rotRef.current) % 360 + 360) % 360 || 360;
    // power 0→1 : 3→14 vòng, 3→10 giây
    const extraSpins = (2 + Math.round(power * 11 + rand() * 1.5)) * 360;
    const totalDelta = diff + extraSpins;
    const startRot   = rotRef.current;
    const duration   = 3000 + power * 7000 + rand() * 800;
    const startTime  = performance.now();

    const animate = (now) => {
      const t   = Math.min((now - startTime) / duration, 1);
      const rot = startRot + totalDelta * easeOutCubic(t);

      if (wheelGRef.current)
        wheelGRef.current.setAttribute('transform', `rotate(${rot} ${CX} ${CY})`);

      const norm   = ((-rot % 360) + 360) % 360;
      const curSeg = Math.floor(norm / seg) % n;
      if (curSeg !== lastSegRef.current) {
        const speed = Math.max(0, 1 - t);
        playTick(audioRef.current, 500 + speed * 700);
        lastSegRef.current = curSeg;
      }

      if (t < 1) {
        rafRef.current = requestAnimationFrame(animate);
      } else {
        rotRef.current = startRot + totalDelta;
        lastWinnerIdxRef.current = idx;
        setSpinning(false); setWinnerIdx(idx);
        setPtrBounce(true); setTimeout(() => setPtrBounce(false), 850);
        stopConfetti.current = launchConfetti(canvasRef.current);
        playFanfare(audioRef.current);
      }
    };
    rafRef.current = requestAnimationFrame(animate);
  }, [spinning, n, seg]);

  // Cập nhật ref mỗi khi spinWithPower thay đổi (để releaseCharge dùng mà không stale)
  useEffect(() => { spinFnRef.current = spinWithPower; }, [spinWithPower]);

  const startCharge = useCallback(() => {
    if (spinning || n < 2 || isChargingRef.current) return;
    if (!audioRef.current) audioRef.current = createAudioCtx();
    audioRef.current?.resume?.();
    chargeRef.current = 0;
    chargeStartRef.current = performance.now();
    isChargingRef.current = true;
    setIsCharging(true);

    const update = (now) => {
      if (!isChargingRef.current) return;
      const c = Math.min((now - chargeStartRef.current) / 2500, 1);
      chargeRef.current = c;
      // Cập nhật DOM trực tiếp — không gây re-render
      if (powerBarRef.current) {
        powerBarRef.current.style.width = `${c * 100}%`;
        powerBarRef.current.style.background =
          c < 0.4 ? '#22c55e' : c < 0.75 ? '#f59e0b' : '#ef4444';
      }
      if (powerLabelRef.current) {
        const labels = ['🌀 Nhẹ', '💨 Vừa', '⚡ Mạnh', '🔥 Tối đa!'];
        powerLabelRef.current.textContent = labels[c < 0.3 ? 0 : c < 0.6 ? 1 : c < 0.88 ? 2 : 3];
      }
      if (c < 1) chargeRafRef.current = requestAnimationFrame(update);
    };
    chargeRafRef.current = requestAnimationFrame(update);
  }, [spinning, n]);

  const releaseCharge = useCallback(() => {
    if (!isChargingRef.current) return;
    cancelAnimationFrame(chargeRafRef.current);
    isChargingRef.current = false;
    const elapsed = performance.now() - chargeStartRef.current;
    // Nhấn nhanh (< 200ms) → tự động random lực vừa-mạnh
    const power = elapsed < 200 ? 0.4 + rand() * 0.4 : chargeRef.current;
    chargeRef.current = 0;
    setIsCharging(false);
    spinFnRef.current?.(power);
  }, []);

  const reset = () => { setWinnerIdx(null); stopConfetti.current?.(); stopConfetti.current = null; };
  const winner = winnerIdx !== null ? members[winnerIdx] : null;

  if (n === 0)
    return <p className="text-sm text-gray-400 text-center py-8">Không có thành viên nào.</p>;

  return (
    <>
      <style>{`
        @keyframes wglow {
          0%,100% { filter: drop-shadow(0 0 7px rgba(251,191,36,.45)); }
          50%      { filter: drop-shadow(0 0 22px rgba(251,191,36,.85)); }
        }
        @keyframes wpop {
          0%   { opacity:0; transform:scale(.7) translateY(20px); }
          60%  { transform:scale(1.08) translateY(-5px); }
          80%  { transform:scale(.96) translateY(2px); }
          100% { opacity:1; transform:scale(1) translateY(0); }
        }
        @keyframes ptridle {
          0%,100% { transform: rotate(0deg); }
          40%     { transform: rotate(-2deg); }
          80%     { transform: rotate(2deg); }
        }
        @keyframes ptrbounce {
          0%  { transform: rotate(0deg); }
          18% { transform: rotate(-24deg); }
          40% { transform: rotate(15deg); }
          58% { transform: rotate(-8deg); }
          73% { transform: rotate(4deg); }
          86% { transform: rotate(-2deg); }
          100%{ transform: rotate(0deg); }
        }
        @keyframes wsegpulse { 0%,100%{opacity:.12} 50%{opacity:.44} }
        @keyframes shimmer   { 0%{transform:translateX(-100%)} 100%{transform:translateX(200%)} }
        @keyframes chargepulse {
          0%,100% { box-shadow: 0 0 0 0 rgba(251,191,36,0); }
          50%     { box-shadow: 0 0 0 6px rgba(251,191,36,.35); }
        }
        .wglow         { animation: wglow 1.1s ease-in-out infinite; }
        .charge-pulse  { animation: chargepulse .7s ease-in-out infinite; }
        .wpop        { animation: wpop .6s cubic-bezier(.22,1,.36,1) forwards; }
        .ptr-idle    { animation: ptridle 2.6s ease-in-out infinite; transform-origin: 50% 0; }
        .ptr-bounce  { animation: ptrbounce .85s cubic-bezier(.22,1,.36,1) forwards; transform-origin: 50% 0; }
        .wseg-pulse  { animation: wsegpulse 1.25s ease-in-out infinite; }
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

          {/* ── Pointer: gem on top (pivot), sharp tip points DOWN into wheel ── */}
          <div
            className={`absolute z-20 pointer-events-none ${
              ptrBounce ? 'ptr-bounce' : spinning ? '' : 'ptr-idle'
            }`}
            style={{ top: -10, left: '50%', marginLeft: '-19px' }}
          >
            <svg width={38} height={58} viewBox="0 0 38 58" overflow="visible">
              <defs>
                <linearGradient id="pg" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%"   stopColor="#FEE2E2"/>
                  <stop offset="45%"  stopColor="#F87171"/>
                  <stop offset="100%" stopColor="#991B1B"/>
                </linearGradient>
                <filter id="psh" x="-80%" y="-40%" width="260%" height="250%">
                  <feDropShadow dx="0" dy="3" stdDeviation="4" floodColor="#7f1d1d" floodOpacity=".6"/>
                </filter>
              </defs>
              {/* Gem at TOP — this is the hinge/pivot point (transform-origin: 50% 0) */}
              <circle cx="19" cy="9" r="8" fill="white" stroke="#DC2626" strokeWidth="2.5" filter="url(#psh)"/>
              <circle cx="19" cy="9" r="4"  fill="#FCA5A5"/>
              <circle cx="17" cy="7" r="1.5" fill="white" opacity=".75"/>
              {/* Arrow body: wide at top (y≈14), narrow tip at bottom (y=54) */}
              <polygon points="19,54 4,14 19,22 34,14" fill="url(#pg)" filter="url(#psh)"/>
              <polygon points="19,54 4,14 19,22 34,14" fill="none" stroke="rgba(255,255,255,.8)" strokeWidth="1.4" strokeLinejoin="round"/>
              {/* Shoulder highlight */}
              <polygon points="4,14 19,14 34,14 19,20" fill="rgba(255,255,255,.4)"/>
            </svg>
          </div>

          {/* ── SVG Wheel ── */}
          <svg
            style={{
              width: '100%', height: 'auto',
              ...(spinning ? { filter: 'drop-shadow(0 0 18px rgba(251,191,36,.7))' } : {}),
            }}
            viewBox={`0 0 ${SIZE} ${SIZE}`}
            overflow="visible"
            className={!spinning && !winner ? 'wglow' : ''}
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

              {/* Hub logo gradient — defined here so it works on all browsers/Android */}
              <linearGradient id="hlbg" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%"   stopColor="#fbbf24"/>
                <stop offset="100%" stopColor="#ea580c"/>
              </linearGradient>
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
                <g key={i}>
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
                // Hướng kính: text từ trung tâm ra viền
                // Vùng hiển thị từ hub (r≈0.3R) đến gần viền (r≈0.88R), midpoint ≈ 0.59R
                const textR    = R * 0.59;
                const tx       = CX + textR * Math.cos(toRad(midDeg));
                const ty       = CY + textR * Math.sin(toRad(midDeg));
                const isWinner = winner && m.id === winner.id;
                const dimmed   = winner && !isWinner;
                // Chiều dài tối đa ước theo pixel: (R*0.88 - R*0.3) / fs ≈ 94/fs ký tự
                const fs       = n > 10 ? 7.5 : n > 7 ? 9 : n > 5 ? 10.5 : 12.5;
                const maxLen   = Math.floor((R * 0.58) / (fs * 0.62));
                const label    = m.name.length > maxLen ? m.name.slice(0, maxLen - 1) + '…' : m.name;
                // rotate(midDeg) = hướng kính; flip nửa trái để chữ không bị ngược
                const needFlip = midDeg > 90 || midDeg < -90;
                const rot      = needFlip
                  ? `rotate(${midDeg + 180},${tx},${ty})`
                  : `rotate(${midDeg},${tx},${ty})`;
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
              {/* Hub logo — scaled to 56×56, centered; gradient defined in main <defs> */}
              <g transform={`translate(${CX - 28},${CY - 28}) scale(${56 / 120})`}>
                <rect width="120" height="120" rx="26" ry="26" fill="url(#hlbg)"/>
                <rect x="24" y="24" width="20" height="72" rx="7" ry="7" fill="white" fillOpacity="0.95"/>
                <rect x="76" y="24" width="20" height="72" rx="7" ry="7" fill="white" fillOpacity="0.95"/>
                <rect x="24" y="50" width="72" height="20" rx="7" ry="7" fill="white" fillOpacity="0.95"/>
              </g>
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
          <div className="flex flex-col items-center gap-3 w-full max-w-[280px]">

            {/* Power bar — hiện khi đang giữ nút */}
            {isCharging && (
              <div className="w-full space-y-1.5 px-1">
                <div className="flex justify-between items-center text-xs font-bold">
                  <span className="text-gray-500">Lực quay</span>
                  <span ref={powerLabelRef} className="text-green-600">🌀 Nhẹ</span>
                </div>
                <div className="h-5 bg-gray-100 rounded-full overflow-hidden border border-gray-200 shadow-inner">
                  <div
                    ref={powerBarRef}
                    className="h-full rounded-full transition-colors duration-300"
                    style={{ width: '0%', background: '#22c55e' }}
                  />
                </div>
                <p className="text-[10px] text-center text-gray-400">Thả tay để quay</p>
              </div>
            )}

            <button
              type="button"
              onPointerDown={startCharge}
              onPointerUp={releaseCharge}
              onPointerLeave={releaseCharge}
              disabled={spinning || n < 2}
              className={`relative overflow-hidden w-full py-4 rounded-2xl font-black text-lg
                transition-all duration-150 select-none touch-none ${
                  spinning
                    ? 'bg-gradient-to-r from-amber-300 to-orange-400 text-white/80 cursor-not-allowed'
                    : isCharging
                    ? 'bg-gradient-to-r from-amber-500 to-orange-600 text-white scale-95 charge-pulse'
                    : n < 2
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-gradient-to-r from-amber-400 via-orange-400 to-orange-500 text-white ' +
                      'shadow-xl shadow-amber-400/45 hover:shadow-2xl hover:shadow-amber-500/55 ' +
                      'active:scale-95'
                }`}
            >
              {!spinning && !isCharging && n >= 2 && (
                <span className="btn-shimmer absolute inset-0 bg-gradient-to-r from-transparent via-white/25 to-transparent pointer-events-none"/>
              )}
              {spinning ? (
                <span className="flex items-center justify-center gap-2.5">
                  <svg className="animate-spin w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" stroke="white" strokeWidth="3" opacity=".3"/>
                    <path fill="white" d="M4 12a8 8 0 018-8V0C5.4 0 0 5.4 0 12h4z"/>
                  </svg>
                  Đang quay...
                </span>
              ) : isCharging ? (
                <span className="flex items-center justify-center gap-2">⚡ Thả để quay!</span>
              ) : (
                <span className="flex items-center justify-center gap-2">🎰 Giữ để quay!</span>
              )}
            </button>

            {n < 2 && (
              <p className="text-xs text-gray-400">Cần ít nhất 2 thành viên để quay.</p>
            )}
            {!spinning && !isCharging && n >= 2 && (
              <p className="text-[10px] text-gray-400 text-center">
                Giữ lâu hơn = quay mạnh hơn
              </p>
            )}
          </div>
        )}

      </div>
    </>
  );
}
