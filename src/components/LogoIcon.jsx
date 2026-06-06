import React, { useId } from 'react';

// Hui Pro logo rendered as inline SVG.
// Uses useId() to guarantee unique gradient/clipPath IDs per instance —
// avoids the Safari/WebKit bug where duplicate SVG IDs in the same
// document drop the gradient reference entirely.
export default function LogoIcon({ size = 40, className = '' }) {
  const uid = useId().replace(/:/g, '_');

  const bgId   = `logo_bg_${uid}`;
  const shId   = `logo_sh_${uid}`;
  const clipId = `logo_clip_${uid}`;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 120 120"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="Hui Pro"
      style={{ display: 'block', flexShrink: 0 }}
    >
      <defs>
        {/* Amber → orange-red diagonal gradient */}
        <linearGradient id={bgId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%"   stopColor="#fbbf24" />
          <stop offset="100%" stopColor="#ea580c" />
        </linearGradient>

        {/* Top-gloss shine: white → transparent */}
        <linearGradient id={shId} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%"  stopColor="#ffffff" stopOpacity="0.30" />
          <stop offset="75%" stopColor="#ffffff" stopOpacity="0"    />
        </linearGradient>

        {/* Clip to the same rounded shape as the background */}
        <clipPath id={clipId}>
          <rect width="120" height="120" rx="26" ry="26" />
        </clipPath>
      </defs>

      {/* Rounded background */}
      <rect width="120" height="120" rx="26" ry="26" fill={`url(#${bgId})`} />

      {/* Gloss shine overlay (clipped so it respects rounded corners) */}
      <rect
        width="120" height="70"
        fill={`url(#${shId})`}
        clipPath={`url(#${clipId})`}
      />

      {/* ── H letter — 3 rounded rectangles ── */}
      {/* Left vertical bar */}
      <rect x="18" y="20" width="22" height="80" rx="7" ry="7"
        fill="#ffffff" fillOpacity="0.95" />
      {/* Right vertical bar */}
      <rect x="80" y="20" width="22" height="80" rx="7" ry="7"
        fill="#ffffff" fillOpacity="0.95" />
      {/* Horizontal crossbar */}
      <rect x="18" y="50" width="84" height="21" rx="7" ry="7"
        fill="#ffffff" fillOpacity="0.95" />

      {/* Subtle inner shadow border */}
      <rect width="120" height="120" rx="26" ry="26"
        fill="none" stroke="#000000" strokeOpacity="0.10" strokeWidth="2" />
    </svg>
  );
}
