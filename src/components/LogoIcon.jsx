import React from 'react';

// Hui Pro logo — inline SVG so it renders identically everywhere.
// Uses geometric rects (no text/font dependency) for crisp display at all sizes.
// viewBox 0 0 120 120, corner radius ≈22% (Apple-style squircle)
export default function LogoIcon({ size = 40, className = '' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 120 120"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="Hui Pro"
    >
      <defs>
        <linearGradient id="lgi-bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%"   stopColor="#fbbf24" />
          <stop offset="100%" stopColor="#ea580c" />
        </linearGradient>
        <linearGradient id="lgi-sh" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%"  stopColor="white" stopOpacity="0.28" />
          <stop offset="70%" stopColor="white" stopOpacity="0"    />
        </linearGradient>
        <clipPath id="lgi-clip">
          <rect width="120" height="120" rx="26" />
        </clipPath>
      </defs>

      {/* Background */}
      <rect width="120" height="120" rx="26" fill="url(#lgi-bg)" />

      {/* Top-shine gloss */}
      <rect width="120" height="68" fill="url(#lgi-sh)" clipPath="url(#lgi-clip)" />

      {/* ── H letter (3 rounded rects) ── */}
      {/* left vertical bar */}
      <rect x="18" y="20" width="22" height="80" rx="7" fill="white" fillOpacity="0.95" />
      {/* right vertical bar */}
      <rect x="80" y="20" width="22" height="80" rx="7" fill="white" fillOpacity="0.95" />
      {/* horizontal crossbar */}
      <rect x="18" y="50" width="84" height="21" rx="7" fill="white" fillOpacity="0.95" />

      {/* Subtle bottom-right depth shadow */}
      <rect width="120" height="120" rx="26"
        fill="none" stroke="black" strokeOpacity="0.08" strokeWidth="2" />
    </svg>
  );
}
