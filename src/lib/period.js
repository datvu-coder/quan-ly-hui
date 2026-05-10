/** Số kỳ hiện tại tính từ ngày bắt đầu */
export function currentPeriodNumber(startDate, cycle) {
  const start = new Date(startDate);
  const now = new Date();
  if (now <= start) return 1;
  if (cycle === 'month') {
    const m =
      (now.getFullYear() - start.getFullYear()) * 12 +
      (now.getMonth() - start.getMonth());
    return Math.max(1, m + 1);
  }
  if (cycle === 'week') {
    const days = Math.floor((now - start) / (7 * 24 * 60 * 60 * 1000));
    return Math.max(1, days + 1);
  }
  const days = Math.floor((now - start) / (24 * 60 * 60 * 1000));
  return Math.max(1, days + 1);
}

/** Ngày đến hạn của kỳ thứ period */
export function periodDueDate(startDate, cycle, period) {
  const start = new Date(startDate);
  if (cycle === 'month') {
    return new Date(start.getFullYear(), start.getMonth() + period - 1, start.getDate());
  }
  if (cycle === 'week') {
    const d = new Date(start);
    d.setDate(d.getDate() + (period - 1) * 7);
    return d;
  }
  const d = new Date(start);
  d.setDate(d.getDate() + period - 1);
  return d;
}

/** Tính tiền hốt trong phiên kêu hụi:
 *  - hụi chết: gross - commission
 *  - hụi sống: gross - commission - interest (gross × bidRate%)
 */
export function calcSessionNet(group, bidRate = 0) {
  const gross = group.contributionAmount * group.expectedMemberCount;
  const commission = gross * (group.ownerCommissionPercent / 100);
  const interest = group.type === 'live' ? gross * (bidRate / 100) : 0;
  return {
    gross,
    commission: Math.round(commission),
    interest: Math.round(interest),
    net: Math.round(gross - commission - interest),
  };
}
