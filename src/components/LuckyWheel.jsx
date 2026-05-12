import React, { useRef, useState, useCallback, useEffect } from 'react';

const SIZE = 360;
const CX = SIZE / 2;
const CY = SIZE / 2;
const R = 148;
const toRad = (d) => (d * Math.PI) / 180;

const COLORS = [
  '#E74C3C','#3498DB','#2ECC71','#F39C12',
  '#9B59B6','#1ABC9C','#E91E63','#2196F3',
  '#FF5722','#4CAF50','#FF9800','#607D8B',
];

// Quintic ease-out — fast start, very gradual stop (natural deceleration)
function easeOutQuint(t) {
  return 1 - Math.pow(1 - t, 5);
}

function segPath(startDeg, endDeg) {
  const x1 = CX + R * Math.cos(toRad(startDeg));
  const y1 = CY + R * Math.sin(toRad(startDeg));
  const x2 = CX + R * Math.cos(toRad(endDeg));
  const y2 = CY + R * Math.sin(toRad(endDeg));
  const large = endDeg - startDeg > 180 ? 1 : 0;
  return `M${CX},${CY} L${x1},${y1} A${R},${R} 0 ${large} 1 ${x2},${y2} Z`;
}

export default function LuckyWheel({ members, onSelect }) {
  const [spinning, setSpinning]     = useState(false);
  const [winnerIdx, setWinnerIdx]   = useState(null);
  const rotRef      = useRef(0);       // current final rotation (persists across spins)
  const rafRef      = useRef(null);
  const wheelGRef   = useRef(null);    // ref to the rotating <g> — DOM-direct for perf

  const n   = members.length;
  const seg = n > 0 ? 360 / n : 360;

  useEffect(() => () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); }, []);

  const spin = useCallback(() => {
    if (spinning || n < 2) return;
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    setWinnerIdx(null);
    setSpinning(true);

    // Pick winner and compute how far we need to rotate to land on it
    const idx        = Math.floor(Math.random() * n);
    const baseTarget = -(idx * seg + seg / 2);
    const diff       = ((baseTarget - rotRef.current) % 360 + 360) % 360 || 360;
    const extraSpins = (6 + Math.floor(Math.random() * 4)) * 360;
    const totalDelta = diff + extraSpins;
    const startRot   = rotRef.current;
    const endRot     = startRot + totalDelta;
    const duration   = 6200 + Math.random() * 1400; // 6.2 – 7.6 s
    const startTime  = performance.now();

    const animate = (now) => {
      const t          = Math.min((now - startTime) / duration, 1);
      const currentRot = startRot + totalDelta * easeOutQuint(t);

      // Directly mutate DOM — zero React render overhead during animation
      if (wheelGRef.current) {
        wheelGRef.current.style.transform = `rotate(${currentRot}deg)`;
      }

      if (t < 1) {
        rafRef.current = requestAnimationFrame(animate);
      } else {
        rotRef.current = endRot;
        setSpinning(false);
        setWinnerIdx(idx);
      }
    };
    rafRef.current = requestAnimationFrame(animate);
  }, [spinning, n, seg]);

  const reset  = () => setWinnerIdx(null);
  const winner = winnerIdx !== null ? members[winnerIdx] : null;

  if (n === 0) {
    return <p className="text-sm text-gray-400 text-center py-8">Không có thành viên nào.</p>;
  }

  return (
    <>
      <style>{`
        @keyframes wglow {
          0%,100% { filter: drop-shadow(0 0 6px rgba(251,191,36,.35)); }
          50%      { filter: drop-shadow(0 0 22px rgba(251,191,36,.75)); }
        }
        @keyframes wpop {
          0%  { opacity:0; transform:scale(.82) translateY(10px); }
          65% { transform:scale(1.05) translateY(-3px); }
          100%{ opacity:1; transform:scale(1) translateY(0); }
        }
        @keyframes ptr-tap {
          0%,100% { transform:translateX(-50%) translateY(0) rotate(0deg); }
          40%     { transform:translateX(-50%) translateY(-3px) rotate(-6deg); }
          70%     { transform:translateX(-50%) translateY(-1px) rotate(4deg); }
        }
        .wglow { animation: wglow 0.9s ease-in-out infinite; }
        .wpop  { animation: wpop .48s cubic-bezier(.22,1,.36,1) forwards; }
        .ptr-spinning { animation: ptr-tap 0.22s ease-in-out infinite; }
      `}</style>

      <div className="flex flex-col items-center gap-6 select-none py-2">

        {/* ── Wheel ─────────────────────────────────────────────── */}
        <div className="relative">

          {/* Pointer */}
          <div
            className={`absolute left-1/2 -translate-x-1/2 z-20 pointer-events-none ${spinning ? 'ptr-spinning' : ''}`}
            style={{ top: -1 }}
          >
            <svg width={30} height={44} viewBox="0 0 30 44" overflow="visible">
              <defs>
                <linearGradient id="pg" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#fca5a5"/>
                  <stop offset="100%" stopColor="#b91c1c"/>
                </linearGradient>
                <filter id="pshadow" x="-60%" y="-30%" width="220%" height="220%">
                  <feDropShadow dx="0" dy="3" stdDeviation="3" floodColor="#7f1d1d" floodOpacity=".5"/>
                </filter>
              </defs>
              <polygon points="15,3 28,40 2,40" fill="url(#pg)" filter="url(#pshadow)"/>
              <polygon points="15,3 28,40 2,40" fill="none" stroke="white" strokeWidth="1.5" strokeLinejoin="round"/>
              <circle cx="15" cy="40" r="4" fill="white" stroke="#dc2626" strokeWidth="1.5"/>
            </svg>
          </div>

          {/* SVG Wheel */}
          <svg
            width={SIZE} height={SIZE}
            viewBox={`0 0 ${SIZE} ${SIZE}`}
            overflow="visible"
            className={spinning ? 'wglow' : ''}
          >
            <defs>
              {/* Gold rim gradient */}
              <radialGradient id="rim-g" cx="38%" cy="32%" r="70%">
                <stop offset="0%"   stopColor="#FDE68A"/>
                <stop offset="55%"  stopColor="#F59E0B"/>
                <stop offset="100%" stopColor="#78350F"/>
              </radialGradient>
              {/* Dark hub gradient */}
              <radialGradient id="hub-g" cx="35%" cy="28%" r="72%">
                <stop offset="0%"   stopColor="#475569"/>
                <stop offset="100%" stopColor="#0f172a"/>
              </radialGradient>
              {/* Glossy sheen — rendered outside rotating group so it stays fixed */}
              <radialGradient id="sheen" cx="34%" cy="27%" r="60%">
                <stop offset="0%"   stopColor="white" stopOpacity=".22"/>
                <stop offset="60%"  stopColor="white" stopOpacity=".05"/>
                <stop offset="100%" stopColor="white" stopOpacity="0"/>
              </radialGradient>
            </defs>

            {/* Outer decorative ring */}
            <circle cx={CX} cy={CY} r={R+19} fill="none" stroke="#FDE68A" strokeWidth={0.8} opacity={0.35}/>
            {/* Gold rim body */}
            <circle cx={CX} cy={CY} r={R+14} fill="url(#rim-g)"/>
            {/* Rim inner highlight */}
            <circle cx={CX} cy={CY} r={R+2}  fill="none" stroke="rgba(255,255,255,.45)" strokeWidth={1}/>

            {/* ── Rotating group (direct DOM transform via ref) ── */}
            <g
              ref={wheelGRef}
              style={{ transform: `rotate(${rotRef.current}deg)`, transformOrigin: `${CX}px ${CY}px` }}
            >
              {members.map((m, i) => {
                const startDeg = i * seg - 90;
                const endDeg   = (i + 1) * seg - 90;
                const midDeg   = (startDeg + endDeg) / 2;
                const textR    = R * 0.63;
                const tx       = CX + textR * Math.cos(toRad(midDeg));
                const ty       = CY + textR * Math.sin(toRad(midDeg));
                const dimmed   = winner && m.id !== winner.id;
                const maxLen   = n > 10 ? 5 : n > 7 ? 6 : 8;
                const label    = m.name.length > maxLen ? m.name.slice(0, maxLen - 1) + '…' : m.name;
                const fontSize = n > 10 ? 8 : n > 7 ? 9.5 : n > 5 ? 11 : 13;
                const rot      = `rotate(${midDeg + 90},${tx},${ty})`;

                return (
                  <g key={m.id} style={{ opacity: dimmed ? 0.16 : 1, transition: 'opacity 0.55s ease' }}>
                    <path
                      d={segPath(startDeg, endDeg)}
                      fill={COLORS[i % COLORS.length]}
                      stroke="rgba(255,255,255,.62)"
                      strokeWidth={1.5}
                    />
                    {/* Text drop-shadow */}
                    <text x={tx} y={ty} textAnchor="middle" dominantBaseline="middle"
                      fill="rgba(0,0,0,.3)" fontSize={fontSize} fontWeight="800"
                      transform={rot} dx={0.6} dy={0.9}
                    >{label}</text>
                    {/* Text */}
                    <text x={tx} y={ty} textAnchor="middle" dominantBaseline="middle"
                      fill="white" fontSize={fontSize} fontWeight="800"
                      transform={rot} style={{ pointerEvents: 'none' }}
                    >{label}</text>
                  </g>
                );
              })}

              {/* Hub */}
              <circle cx={CX} cy={CY} r={38} fill="url(#hub-g)"/>
              <circle cx={CX} cy={CY} r={35} fill="none" stroke="#FCD34D" strokeWidth={2}/>
              <circle cx={CX} cy={CY} r={32} fill="none" stroke="#FDE68A" strokeWidth={0.6} opacity={0.5}/>
              <text x={CX} y={CY - 9} textAnchor="middle" dominantBaseline="middle"
                fontSize={13} fontWeight="900" fill="#FCD34D">HỤI</text>
              <text x={CX} y={CY + 9} textAnchor="middle" dominantBaseline="middle"
                fontSize={9} fontWeight="700" fill="#F59E0B">PRO</text>
            </g>

            {/* Sheen overlay — outside rotating group so it stays fixed (realistic lighting) */}
            <circle cx={CX} cy={CY} r={R} fill="url(#sheen)" style={{ pointerEvents: 'none' }}/>
          </svg>
        </div>

        {/* ── Winner card ─────────────────────────────────────── */}
        {winner && !spinning && (
          <div className="wpop w-full max-w-[280px] text-center space-y-4">
            <p className="text-[32px] leading-none">🎊</p>
            <div className="bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 border border-amber-200/80 rounded-2xl px-6 py-5 shadow-xl shadow-amber-100/60">
              <p className="text-[10px] font-bold text-amber-500 uppercase tracking-[0.18em] mb-3">
                🎯 Người được hốt hụi
              </p>
              <p className="text-[30px] font-black leading-tight bg-gradient-to-r from-amber-500 to-orange-500 bg-clip-text text-transparent">
                {winner.name}
              </p>
            </div>
            <div className="flex gap-3 justify-center">
              <button type="button" onClick={reset}
                className="px-5 py-2.5 rounded-xl bg-white border border-gray-200 text-gray-600 text-sm font-semibold hover:bg-gray-50 shadow-sm transition-all active:scale-95"
              >
                Quay lại
              </button>
              <button type="button" onClick={() => onSelect(winner.id)}
                className="px-7 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 to-orange-500 text-white font-bold text-sm shadow-md hover:shadow-lg hover:shadow-amber-300/40 hover:-translate-y-0.5 transition-all active:scale-95"
              >
                Xác nhận ✓
              </button>
            </div>
          </div>
        )}

        {/* ── Spin button ──────────────────────────────────────── */}
        {!winner && (
          <div className="flex flex-col items-center gap-2">
            <button
              type="button"
              onClick={spin}
              disabled={spinning || n < 2}
              className={`px-12 py-3.5 rounded-2xl font-black text-[17px] transition-all duration-150 ${
                spinning
                  ? 'bg-gradient-to-r from-amber-300 to-orange-400 text-white opacity-80 cursor-not-allowed'
                  : n < 2
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-amber-400 to-orange-500 text-white shadow-lg shadow-amber-400/40 hover:shadow-xl hover:shadow-amber-400/55 hover:-translate-y-0.5 active:scale-95 active:translate-y-0'
              }`}
            >
              {spinning
                ? <span className="flex items-center gap-2.5"><span className="animate-spin inline-block">⚙️</span> Đang quay...</span>
                : '🎰 Quay ngay!'
              }
            </button>
            {n < 2 && (
              <p className="text-xs text-gray-400 mt-1">Cần ít nhất 2 thành viên để quay.</p>
            )}
          </div>
        )}

      </div>
    </>
  );
}
