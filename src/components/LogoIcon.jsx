import React, { useState, useEffect, useRef } from 'react';
import { useHuiStore } from '../store/useHuiStore.js';

const SPIN_KEY = 'hui-logo-spinning';

// Load logo.svg as an external image so gradient IDs are scoped to their own
// SVG document — avoids Android Chrome's bug where url(#id) references fail
// when the same inline SVG gradient appears multiple times in the HTML page.
export default function LogoIcon({ size = 40, className = '' }) {
  // On new page load after logo-click reload, sessionStorage still has the flag
  const [spinning, setSpinning] = useState(() => sessionStorage.getItem(SPIN_KEY) === '1');
  // Record when this page instance started so we can enforce a minimum spin time
  const spinStartMs = useRef(spinning ? Date.now() : null);

  // Track IDB hydration — "app is ready" signal
  const [hydrated, setHydrated] = useState(() => useHuiStore.persist.hasHydrated());
  useEffect(() => {
    if (hydrated) return;
    return useHuiStore.persist.onFinishHydration(() => setHydrated(true));
  }, [hydrated]);

  // Stop spinning once hydrated, but ensure at least 600 ms of visible spin
  useEffect(() => {
    if (!spinning || !hydrated) return;
    const elapsed = spinStartMs.current != null ? Date.now() - spinStartMs.current : 0;
    const delay = Math.max(0, 600 - elapsed);
    const t = setTimeout(() => {
      sessionStorage.removeItem(SPIN_KEY);
      setSpinning(false);
    }, delay);
    return () => clearTimeout(t);
  }, [spinning, hydrated]);

  const handleClick = () => {
    if (spinning) return; // Prevent double-click during reload
    sessionStorage.setItem(SPIN_KEY, '1');
    window.__huiReloading = true;
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
