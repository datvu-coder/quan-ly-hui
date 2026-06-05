/**
 * Hụi chết: tiền nhận kỳ M = quỹ kỳ đó (A × N) − hoa hồng cố định.
 */
export function estimateDeadWithdrawal(contributionPerPeriod, memberCount, periodM, commissionAmount) {
  const gross = contributionPerPeriod * memberCount;
  const commission = commissionAmount || 0;
  return {
    gross,
    commission,
    net: Math.round(gross - commission),
  };
}

/**
 * Hụi sống — mô hình gợi ý (ước lượng):
 * - Khấu trừ khi hốt sớm: gross × (lãi tháng) × (N − M)
 * - Cộng thêm khi hốt muộn (M > N/2): gross × (lãi tháng) × (M − N/2) × hệ số
 * Người dùng có thể sửa tay số tiền thực nhận khi ghi giao dịch.
 */
export function estimateLiveWithdrawal(
  contributionPerPeriod,
  memberCount,
  periodM,
  annualInterestPercent,
  commissionAmount
) {
  const gross = contributionPerPeriod * memberCount;
  const commission = commissionAmount || 0;
  const monthlyRate = annualInterestPercent / 100 / 12;
  const N = memberCount;
  const M = periodM;

  const monthsEarlyWeight = Math.max(0, N - M);
  const earlyPenalty = M <= N / 2 ? gross * monthlyRate * monthsEarlyWeight : 0;

  const lateBonus =
    M > N / 2 ? gross * monthlyRate * Math.max(0, M - N / 2) * 0.35 : 0;

  const net = Math.round(gross - commission - earlyPenalty + lateBonus);

  return {
    gross,
    commission,
    earlyPenalty: Math.round(earlyPenalty),
    lateBonus: Math.round(lateBonus),
    net,
  };
}

export function monthlyRateFromAnnual(annualPercent) {
  return annualPercent / 100 / 12;
}

/** Cảnh báo pháp lý: lãi vượt 20%/năm */
export function isInterestRateIllegal(annualPercent) {
  return annualPercent > 20;
}

/** Gợi ý: quỹ ≥ 100 triệu — thông báo UBND (theo tài liệu dự án) */
export function isLargeFundWarning(totalFundVnd) {
  return totalFundVnd >= 100_000_000;
}
