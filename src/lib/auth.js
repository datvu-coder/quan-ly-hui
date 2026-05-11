// Simple synchronous hash — works on HTTP (no crypto.subtle needed)
export function hashPassword(pw) {
  return btoa(unescape(encodeURIComponent('hui-2024:' + pw)));
}

export function verifyPassword(pw, storedHash) {
  return hashPassword(pw) === storedHash;
}
