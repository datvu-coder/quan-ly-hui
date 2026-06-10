/** @param {number} n */
export function formatVnd(n) {
  if (n === null || n === undefined || Number.isNaN(n)) return '—';
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(Math.round(n));
}

/** Rút gọn: triệu / tỷ */
export function formatVndCompact(n) {
  if (n === null || n === undefined || Number.isNaN(n)) return '—';
  const abs = Math.abs(n);
  if (abs >= 1e9) return `${(n / 1e9).toFixed(2)} tỷ`;
  if (abs >= 1e6) return `${(n / 1e6).toFixed(1)}M`;
  if (abs >= 1e3) return `${(n / 1e3).toFixed(0)}K`;
  return formatVnd(n);
}

export function formatDate(iso) {
  if (!iso) return '—';
  try {
    return new Intl.DateTimeFormat('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

export function cycleLabel(c) {
  const m = { day: 'Ngày', week: 'Tuần', month: 'Tháng' };
  return m[c] || c;
}

/** Đọc số tiền bằng chữ tiếng Việt */
export function numberToWords(n) {
  if (!n || n === 0) return 'Không đồng';
  n = Math.round(n);
  const u = ['', 'một', 'hai', 'ba', 'bốn', 'năm', 'sáu', 'bảy', 'tám', 'chín'];

  function readBlock(x, isFirst) {
    const h = Math.floor(x / 100);
    const t = Math.floor((x % 100) / 10);
    const d = x % 10;
    let s = '';
    if (h > 0) s += u[h] + ' trăm';
    else if (!isFirst) s += 'không trăm';
    if (t === 0 && d === 0) return s;
    if (t === 0) { s += ' linh ' + u[d]; }
    else if (t === 1) { s += (s ? ' ' : '') + 'mười' + (d === 5 ? ' lăm' : d > 0 ? ' ' + u[d] : ''); }
    else {
      s += (s ? ' ' : '') + u[t] + ' mươi';
      if (d === 1) s += ' mốt';
      else if (d === 5) s += ' lăm';
      else if (d > 0) s += ' ' + u[d];
    }
    return s.trim();
  }

  const ty  = Math.floor(n / 1_000_000_000);
  const tr  = Math.floor((n % 1_000_000_000) / 1_000_000);
  const ng  = Math.floor((n % 1_000_000) / 1_000);
  const rem = n % 1_000;

  const parts = [];
  if (ty  > 0) parts.push(readBlock(ty,  parts.length === 0) + ' tỷ');
  if (tr  > 0) parts.push(readBlock(tr,  parts.length === 0) + ' triệu');
  if (ng  > 0) parts.push(readBlock(ng,  parts.length === 0) + ' nghìn');
  if (rem > 0) parts.push(readBlock(rem, parts.length === 0));

  const str = parts.join(' ').trim();
  return str.charAt(0).toUpperCase() + str.slice(1) + ' đồng';
}
