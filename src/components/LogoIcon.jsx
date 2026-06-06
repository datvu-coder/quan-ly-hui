import React from 'react';

// Load logo.svg as an external image so gradient IDs are scoped to their own
// SVG document — avoids Android Chrome's bug where url(#id) references fail
// when the same inline SVG gradient appears multiple times in the HTML page.
export default function LogoIcon({ size = 40, className = '' }) {
  return (
    <img
      src="/logo.svg"
      width={size}
      height={size}
      alt="Hui Pro"
      draggable={false}
      style={{ display: 'block', flexShrink: 0 }}
      className={className}
    />
  );
}
