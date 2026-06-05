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

/**
 * Tính gross thực tế của một kỳ khi dây có hai mức đóng:
 * - Người đã hốt (chết): đóng contributionAmountDead
 * - Người chưa hốt (sống): đóng contributionAmount
 * Nếu contributionAmountDead = 0: tất cả đóng cùng mức.
 */
export function calcPeriodGross(group, sessions, memberIds, periodNumber) {
  const dead = group.contributionAmountDead || 0;
  if (!dead) return group.contributionAmount * memberIds.length;

  const deadIds = new Set(
    sessions
      .filter((s) => s.groupId === group.id && s.status === 'closed' && s.winnerId && s.periodNumber < periodNumber)
      .map((s) => s.winnerId)
  );
  const deadCount = memberIds.filter((id) => deadIds.has(id)).length;
  const liveCount = memberIds.length - deadCount;
  return deadCount * dead + liveCount * group.contributionAmount;
}

/** Tính tiền hốt trong phiên kêu hụi:
 *  - hụi chết: gross - commission
 *  - hụi sống: gross - commission - interest (gross × bidRate%)
 *  Truyền grossOverride để dùng gross thực tế thay vì gross danh nghĩa.
 */
export function calcSessionNet(group, bidRate = 0, grossOverride = null) {
  const gross = grossOverride ?? (group.contributionAmount * group.expectedMemberCount);
  // Ưu tiên hoa hồng cố định, fallback về % cho dữ liệu cũ
  const commission = (group.ownerCommissionAmount > 0)
    ? group.ownerCommissionAmount
    : Math.round(gross * ((group.ownerCommissionPercent || 0) / 100));
  const interest = group.type === 'live' ? gross * (bidRate / 100) : 0;
  return {
    gross,
    commission: Math.round(commission),
    interest: Math.round(interest),
    net: Math.round(gross - commission - interest),
  };
}
