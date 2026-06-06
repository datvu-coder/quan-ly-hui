import React, { useState } from 'react';

// Load logo.svg as an external image so gradient IDs are scoped to their own
// SVG document — avoids Android Chrome's bug where url(#id) references fail
// when the same inline SVG gradient appears multiple times in the HTML page.
export default function LogoIcon({ size = 40, className = '' }) {
  const [spinning, setSpinning] = useState(false);

  const handleClick = () => {
    setSpinning(true);
    window.location.reload();
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      title="Tải lại trang"
      aria-label="Tải lại trang"
      style={{ display: 'block', padding: 0, border: 0, background: 'none', cursor: 'pointer', lineHeight: 0, flexShrink: 0 }}
    >
      <img
        src="/logo.svg"
        width={size}
        height={size}
        alt="Hui Pro"
        draggable={false}
        style={{ display: 'block' }}
        className={`${spinning ? 'animate-spin' : 'hover:rotate-12 transition-transform duration-200'} ${className}`}
      />
    </button>
  );
}
