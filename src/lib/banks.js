export const BANKS = [
  { id: 'VCB',  name: 'Vietcombank' },
  { id: 'TCB',  name: 'Techcombank' },
  { id: 'MB',   name: 'MB Bank' },
  { id: 'ACB',  name: 'ACB' },
  { id: 'VPB',  name: 'VPBank' },
  { id: 'BIDV', name: 'BIDV' },
  { id: 'VTB',  name: 'Vietinbank' },
  { id: 'TPB',  name: 'TPBank' },
  { id: 'STB',  name: 'Sacombank' },
  { id: 'HDB',  name: 'HDBank' },
  { id: 'OCB',  name: 'OCB' },
  { id: 'MSB',  name: 'MSB' },
  { id: 'SHB',  name: 'SHB' },
  { id: 'VIB',  name: 'VIB' },
  { id: 'EIB',  name: 'Eximbank' },
  { id: 'SABB', name: 'SeABank' },
  { id: 'ABB',  name: 'An Bình Bank' },
  { id: 'NAB',  name: 'Nam Á Bank' },
  { id: 'CAKE', name: 'CAKE' },
  { id: 'TIMO', name: 'Timo' },
];

export function bankDisplayName(id) {
  return BANKS.find((b) => b.id === id)?.name ?? id;
}

export function buildVietQrUrl({ bankId, accountNo, accountName, amount, addInfo }) {
  if (!bankId || !accountNo) return null;
  const params = new URLSearchParams();
  if (amount)      params.set('amount', String(Math.round(amount)));
  if (addInfo)     params.set('addInfo', addInfo);
  if (accountName) params.set('accountName', accountName);
  return `https://img.vietqr.io/image/${bankId}-${accountNo}-compact2.png?${params.toString()}`;
}
