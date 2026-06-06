import React, { useState, useEffect, useRef } from 'react';

const SPIN_KEY = 'hui-logo-spinning';

// Load logo.svg as an external image so gradient IDs are scoped to their own
// SVG document — avoids Android Chrome's bug where url(#id) references fail
// when the same inline SVG gradient appears multiple times in the HTML page.
export default function LogoIcon({ size = 40, className = '' }) {
  const [spinning, setSpinning] = useState(() => sessionStorage.getItem(SPIN_KEY) === '1');
  const spinStartMs = useRef(spinning ? Date.now() : null);

  useEffect(() => {
    if (!spinning) return;

    let stopped = false;
    let stopTimer = null;

    const doStop = () => {
      if (stopped) return;
      stopped = true;
      // Ensure minimum visible spin time from page-start
      const elapsed = spinStartMs.current != null ? Date.now() - spinStartMs.current : 0;
      const delay = Math.max(0, 600 - elapsed);
      stopTimer = setTimeout(() => {
        sessionStorage.removeItem(SPIN_KEY);
        setSpinning(false);
      }, delay);
    };

    // Server sync already completed before this component mounted
    if (window.__huiReady) {
      doStop();
      return () => clearTimeout(stopTimer);
    }

    // Wait for server sync to finish — data is truly fresh at this point
    window.addEventListener('hui-ready', doStop, { once: true });
    // Fallback: stop after 8 s in case the event never fires (offline / error)
    const fallback = setTimeout(doStop, 8000);

    return () => {
      window.removeEventListener('hui-ready', doStop);
      clearTimeout(fallback);
      clearTimeout(stopTimer);
    };
  }, [spinning]);

  const handleClick = () => {
    if (spinning) return;
    window.__huiReady = false; // Reset — will be set again after next server sync
    window.__huiReloading = true;
    sessionStorage.setItem(SPIN_KEY, '1');
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
