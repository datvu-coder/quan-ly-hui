import React, { useRef, useState } from 'react';

const COLORS = [
  '#f59e0b','#3b82f6','#10b981','#ef4444',
  '#8b5cf6','#f97316','#06b6d4','#84cc16',
  '#ec4899','#14b8a6','#a78bfa','#fb923c',
];

const CX = 150, CY = 150, R = 128;
const toRad = (d) => (d * Math.PI) / 180;

function arcPath(startDeg, endDeg) {
  const x1 = CX + R * Math.cos(toRad(startDeg));
  const y1 = CY + R * Math.sin(toRad(startDeg));
  const x2 = CX + R * Math.cos(toRad(endDeg));
  const y2 = CY + R * Math.sin(toRad(endDeg));
  const large = endDeg - startDeg > 180 ? 1 : 0;
  return `M${CX} ${CY}L${x1} ${y1}A${R} ${R} 0 ${large} 1 ${x2} ${y2}Z`;
}

// members: [{id, name}]  onSelect: (id) => void
export default function LuckyWheel({ members, onSelect }) {
  const [totalRot, setTotalRot] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [winnerIdx, setWinnerIdx] = useState(null);
  const rotRef = useRef(0);

  const n = members.length;
  const seg = n > 0 ? 360 / n : 360;

  const spin = () => {
    if (spinning || n < 2) return;
    setWinnerIdx(null);
    setSpinning(true);

    const idx = Math.floor(Math.random() * n);
    // Segment idx center (in group frame at R=0): idx*seg + seg/2 - 90°
    // After total rotation R, it lands at: idx*seg + seg/2 - 90 + R
    // Pointer is at top (-90°). Want that value ≡ -90 (mod 360)
    // → R ≡ -(idx*seg + seg/2) (mod 360)
    const baseTarget = -(idx * seg + seg / 2);
    const diff = ((baseTarget - rotRef.current) % 360 + 360) % 360 || 360;
    const extraSpins = (4 + Math.floor(Math.random() * 3)) * 360;
    const finalRot = rotRef.current + diff + extraSpins;
    rotRef.current = finalRot;
    setTotalRot(finalRot);

    setTimeout(() => {
      setSpinning(false);
      setWinnerIdx(idx);
    }, 4500);
  };

  const reset = () => {
    setWinnerIdx(null);
    setTotalRot(0);
    rotRef.current = 0;
  };

  const winner = winnerIdx !== null ? members[winnerIdx] : null;

  if (n === 0) return <p className="text-sm text-gray-400 text-center py-8">Không có thành viên nào.</p>;

  return (
    <div className="flex flex-col items-center gap-5 select-none py-2">
      {/* Wheel */}
      <div className="relative">
        {/* Pointer */}
        <div className="absolute left-1/2 -translate-x-1/2 z-10" style={{ top: -6 }}>
          <svg width={22} height={30} viewBox="0 0 22 30">
            <polygon points="11,2 20,28 2,28" fill="#ef4444" stroke="white" strokeWidth={1.5} />
          </svg>
        </div>

        <svg width={300} height={300} viewBox="0 0 300 300">
          <circle cx={CX} cy={CY} r={R + 6} fill="none" stroke="#f3f4f6" strokeWidth={12} />
          <g
            style={{
              transform: `rotate(${totalRot}deg)`,
              transformOrigin: `${CX}px ${CY}px`,
              transition: spinning
                ? 'transform 4.5s cubic-bezier(0.15, 0.5, 0.08, 1.0)'
                : 'none',
            }}
          >
            {members.map((m, i) => {
              const startDeg = i * seg - 90;
              const endDeg = (i + 1) * seg - 90;
              const midDeg = (startDeg + endDeg) / 2;
              const textR = R * 0.62;
              const tx = CX + textR * Math.cos(toRad(midDeg));
              const ty = CY + textR * Math.sin(toRad(midDeg));
              const dimmed = winner && m.id !== winner.id;
              const label = m.name.length > 7 ? m.name.slice(0, 6) + '…' : m.name;
              const fontSize = n > 9 ? 8 : n > 6 ? 10 : 12;
              return (
                <g key={m.id}>
                  <path
                    d={arcPath(startDeg, endDeg)}
                    fill={COLORS[i % COLORS.length]}
                    stroke="white"
                    strokeWidth={2}
                    opacity={dimmed ? 0.28 : 1}
                  />
                  <text
                    x={tx}
                    y={ty}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fill="white"
                    fontSize={fontSize}
                    fontWeight="bold"
                    transform={`rotate(${midDeg + 90},${tx},${ty})`}
                    style={{ pointerEvents: 'none' }}
                  >
                    {label}
                  </text>
                </g>
              );
            })}
            {/* Hub */}
            <circle cx={CX} cy={CY} r={26} fill="white" stroke="#e5e7eb" strokeWidth={2} />
            <text
              x={CX} y={CY}
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize={9}
              fill="#9ca3af"
              fontWeight="bold"
            >
              HỤI
            </text>
          </g>
        </svg>
      </div>

      {/* Winner */}
      {winner && !spinning && (
        <div className="text-center space-y-3">
          <p className="text-4xl">🎉</p>
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-widest mb-1">Người được chọn</p>
            <p className="text-2xl font-bold text-amber-600">{winner.name}</p>
          </div>
          <div className="flex gap-2 justify-center">
            <button
              type="button"
              onClick={reset}
              className="px-4 py-2 rounded-lg bg-gray-100 text-gray-600 text-sm hover:bg-gray-200"
            >
              Quay lại
            </button>
            <button
              type="button"
              onClick={() => onSelect(winner.id)}
              className="px-6 py-2 rounded-lg bg-gradient-to-r from-amber-400 to-orange-500 text-slate-900 font-semibold text-sm"
            >
              Chọn người này ✓
            </button>
          </div>
        </div>
      )}

      {!winner && (
        <>
          <button
            type="button"
            onClick={spin}
            disabled={spinning || n < 2}
            className="px-10 py-3 rounded-xl bg-gradient-to-r from-amber-400 to-orange-500 text-slate-900 font-bold text-lg shadow-md hover:shadow-lg hover:shadow-amber-400/30 transition-all disabled:opacity-50"
          >
            {spinning ? '🌀 Đang quay...' : '🎰 Quay ngay!'}
          </button>
          {n < 2 && (
            <p className="text-xs text-gray-400">Cần ít nhất 2 thành viên để quay.</p>
          )}
        </>
      )}
    </div>
  );
}
