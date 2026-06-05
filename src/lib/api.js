const TIMEOUT_MS = 8000;

function abortAfter(ms) {
  const ac = new AbortController();
  const t = setTimeout(() => ac.abort(), ms);
  return { signal: ac.signal, clear: () => clearTimeout(t) };
}

/**
 * Fetch saved bundle from server.
 * Returns: parsed bundle object | null (server empty) | undefined (server unreachable)
 */
export async function fetchServerData() {
  const { signal, clear } = abortAfter(TIMEOUT_MS);
  try {
    const res = await fetch('/api/data', { signal });
    clear();
    if (!res.ok) return undefined;
    return await res.json(); // null if server has no data yet
  } catch {
    clear();
    return undefined; // network error or timeout
  }
}

/**
 * Push full bundle to server.
 * Returns true if saved successfully, false otherwise.
 */
export async function pushToServer(bundle) {
  const { signal, clear } = abortAfter(TIMEOUT_MS);
  try {
    const res = await fetch('/api/data', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(bundle),
      signal,
    });
    clear();
    return res.ok;
  } catch {
    clear();
    return false;
  }
}
