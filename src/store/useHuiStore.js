import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

const DEFAULT_ADMIN_ID = 'admin-00000000-0000-0000-0000-000000000001';
const DEFAULT_ADMIN = {
  id: DEFAULT_ADMIN_ID,
  name: 'Quản trị viên',
  phone: '0931402139',
  email: '',
  address: '',
  joinedAt: '2025-01-01',
  status: 'active',
  isAdmin: true,
};
const DEFAULT_ADMIN_HASH = 'aHVpLTIwMjQ6VnVkYXRAMTU1Nw==';

function uid() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });
}

/** @typedef {'day'|'week'|'month'} Cycle */
/** @typedef {'dead'|'live'} HuiType */
/** @typedef {'active'|'warning'|'debt'|'left'} MemberStatus */
/** @typedef {'contribution'|'withdrawal'} TxKind */
/** @typedef {'completed'|'pending'|'failed'} TxStatus */

/**
 * @typedef {Object} Group
 * @property {string} id
 * @property {string} name
 * @property {number} expectedMemberCount
 * @property {number} contributionAmount
 * @property {Cycle} cycle
 * @property {string} startDate
 * @property {HuiType} type
 * @property {number} interestRateAnnual
 * @property {number} ownerCommissionPercent
 * @property {string} notes
 * @property {string} createdAt
 */

/**
 * @typedef {Object} Member
 * @property {string} id
 * @property {string} name
 * @property {string} phone
 * @property {string} [email]
 * @property {string} [address]
 * @property {string} joinedAt
 * @property {MemberStatus} status
 * @property {boolean} [isAdmin]
 */

/**
 * @typedef {Object} Membership
 * @property {string} id
 * @property {string} memberId
 * @property {string} groupId
 * @property {string} joinedAt
 */

/**
 * @typedef {Object} Transaction
 * @property {string} id
 * @property {string} groupId
 * @property {string} memberId
 * @property {TxKind} kind
 * @property {number} amount
 * @property {number} [periodNumber]
 * @property {string} date
 * @property {string} [receiptNo]
 * @property {string} [notes]
 * @property {TxStatus} status
 * @property {Record<string, number|string|undefined>} [meta]
 */

/**
 * @typedef {Object} Session
 * @property {string} id
 * @property {string} groupId
 * @property {number} periodNumber
 * @property {string} date
 * @property {Array<{memberId:string, bidRate:number}>} bids
 * @property {string|null} winnerId
 * @property {number|null} winnerBidRate
 * @property {number|null} winnerNetAmount
 * @property {string|null} transactionId
 * @property {'open'|'closed'} status
 * @property {string} createdAt
 * @property {string} [notes]
 */

function seedState() {
  // ── Date helpers ─────────────────────────────────────────────────────
  function ago(months = 0, weeks = 0) {
    const d = new Date();
    d.setMonth(d.getMonth() - months);
    d.setDate(d.getDate() - weeks * 7);
    return d.toISOString().slice(0, 10);
  }
  function isoAgo(months = 0, weeks = 0) {
    return new Date(ago(months, weeks) + 'T08:00:00.000Z').toISOString();
  }

  // ── IDs ──────────────────────────────────────────────────────────────
  const [g1, g2, g3, g4] = [uid(), uid(), uid(), uid()];
  const [m1, m2, m3, m4, m5, m6, m7, m8, m9, m10] = Array.from({ length: 10 }, uid);

  // ── Groups ───────────────────────────────────────────────────────────
  // g1: Hụi sống · tháng · 6 người · 2 tr/kỳ  → đang kỳ 4, có hòa lãi
  // g2: Hụi chết · tháng · 5 người · 3 tr/kỳ  → đang kỳ 3, nhiều ứng viên
  // g3: Hụi sống · tuần  · 4 người · 500 k/kỳ → đang kỳ 2, hòa lãi
  // g4: Hụi chết · tháng · 8 người · 5 tr/kỳ  → đang kỳ 4, ghi chú đặc biệt
  /** @type {Group[]} */
  const groups = [
    { id: g1, name: 'Hụi Phố Cổ',      expectedMemberCount: 6, contributionAmount: 2_000_000, cycle: 'month', startDate: ago(4),   type: 'live', interestRateAnnual: 18, ownerCommissionPercent: 2,   notes: 'Hụi sống 6 người xóm phố cổ.',        createdAt: isoAgo(4) },
    { id: g2, name: 'Hụi Gia Đình',     expectedMemberCount: 5, contributionAmount: 3_000_000, cycle: 'month', startDate: ago(3),   type: 'dead', interestRateAnnual: 0,  ownerCommissionPercent: 1.5, notes: 'Hụi chết họ hàng, không lãi.',         createdAt: isoAgo(3) },
    { id: g3, name: 'Hụi Đồng Nghiệp', expectedMemberCount: 4, contributionAmount: 500_000,   cycle: 'week',  startDate: ago(0, 2), type: 'live', interestRateAnnual: 10, ownerCommissionPercent: 2,   notes: 'Hụi tuần đồng nghiệp công ty.',        createdAt: isoAgo(0, 2) },
    { id: g4, name: 'Hụi Cuối Năm',    expectedMemberCount: 8, contributionAmount: 5_000_000, cycle: 'month', startDate: ago(5),   type: 'dead', interestRateAnnual: 0,  ownerCommissionPercent: 2,   notes: 'Hụi chết cuối năm 8 thành viên.',      createdAt: isoAgo(5) },
  ];

  // ── Members ──────────────────────────────────────────────────────────
  /** @type {Member[]} */
  const members = [
    { id: m1,  name: 'Chị Liên',  phone: '0901000001', email: 'lien@mail.com',  address: '12 Hàng Bông, HN',    joinedAt: ago(6), status: 'active'  },
    { id: m2,  name: 'Anh Minh',  phone: '0901000002', email: 'minh@mail.com',  address: '',                    joinedAt: ago(5), status: 'active'  },
    { id: m3,  name: 'Chị Hoa',   phone: '0901000003', email: '',               address: '45 Đinh Tiên Hoàng',  joinedAt: ago(4), status: 'warning' },
    { id: m4,  name: 'Anh Tuấn',  phone: '0901000004', email: 'tuan@mail.com',  address: '',                    joinedAt: ago(6), status: 'active'  },
    { id: m5,  name: 'Chị Mai',   phone: '0901000005', email: '',               address: '',                    joinedAt: ago(5), status: 'active'  },
    { id: m6,  name: 'Anh Hùng',  phone: '0901000006', email: '',               address: '',                    joinedAt: ago(3), status: 'active'  },
    { id: m7,  name: 'Chị Lan',   phone: '0901000007', email: '',               address: '78 Lê Lợi',           joinedAt: ago(5), status: 'debt'    },
    { id: m8,  name: 'Anh Phúc',  phone: '0901000008', email: 'phuc@mail.com',  address: '',                    joinedAt: ago(4), status: 'active'  },
    { id: m9,  name: 'Chị Ngọc',  phone: '0901000009', email: '',               address: '',                    joinedAt: ago(6), status: 'active'  },
    { id: m10, name: 'Anh Bình',  phone: '0901000010', email: '',               address: '',                    joinedAt: ago(4), status: 'active'  },
  ];

  // ── Memberships ──────────────────────────────────────────────────────
  // g1 (6): m1 m2 m3 m5 m8 m10
  // g2 (5): m1 m3 m4 m7 m9
  // g3 (4): m2 m6 m8 m9
  // g4 (8): m2 m3 m4 m5 m6 m7 m9 m10
  const ms = (gid, mids, d) => mids.map(mid => ({ id: uid(), memberId: mid, groupId: gid, joinedAt: d }));
  /** @type {Membership[]} */
  const memberships = [
    ...ms(g1, [m1, m2, m3, m5, m8, m10], ago(4)),
    ...ms(g2, [m1, m3, m4, m7, m9],       ago(3)),
    ...ms(g3, [m2, m6, m8, m9],            ago(0, 2)),
    ...ms(g4, [m2, m3, m4, m5, m6, m7, m9, m10], ago(5)),
  ];

  // ── Session & Transaction IDs ────────────────────────────────────────
  // g1 sessions
  const [t1a, t1b, t1c] = [uid(), uid(), uid()];
  const [s1a, s1b, s1c, s1d] = [uid(), uid(), uid(), uid()];
  // g2 sessions
  const [t2a, t2b] = [uid(), uid()];
  const [s2a, s2b, s2c] = [uid(), uid(), uid()];
  // g3 sessions
  const [t3a] = [uid()];
  const [s3a, s3b] = [uid(), uid()];
  // g4 sessions
  const [t4a, t4b, t4c] = [uid(), uid(), uid()];
  const [s4a, s4b, s4c, s4d] = [uid(), uid(), uid(), uid()];

  // ── Sessions ─────────────────────────────────────────────────────────
  /** @type {Session[]} */
  const sessions = [
    // === g1: Hụi Phố Cổ (live · 6 thành viên · 2 tr · gross=12tr · hoa hồng=240k) ===
    // Kỳ 1 — đã chốt: m1 hốt lãi 4% → net=11,280,000
    { id: s1a, groupId: g1, periodNumber: 1, date: ago(4), notes: 'Phiên khai mạc',
      bids: [{ memberId: m1, bidRate: 4 }, { memberId: m2, bidRate: 3.5 }, { memberId: m3, bidRate: 2 },
             { memberId: m5, bidRate: 1.5 }, { memberId: m8, bidRate: 3 }, { memberId: m10, bidRate: 2.5 }],
      winnerId: m1, winnerBidRate: 4, winnerNetAmount: 11_280_000, transactionId: t1a,
      status: 'closed', createdAt: isoAgo(4) },

    // Kỳ 2 — đã chốt: m2 hốt lãi 5.5% → net=11,100,000
    { id: s1b, groupId: g1, periodNumber: 2, date: ago(3), notes: '',
      bids: [{ memberId: m2, bidRate: 5.5 }, { memberId: m3, bidRate: 4 }, { memberId: m5, bidRate: 3.5 },
             { memberId: m8, bidRate: 5 }, { memberId: m10, bidRate: 4.5 }],
      winnerId: m2, winnerBidRate: 5.5, winnerNetAmount: 11_100_000, transactionId: t1b,
      status: 'closed', createdAt: isoAgo(3) },

    // Kỳ 3 — đã chốt: m10 hốt lãi 3% → net=11,400,000
    { id: s1c, groupId: g1, periodNumber: 3, date: ago(2), notes: '',
      bids: [{ memberId: m3, bidRate: 2.5 }, { memberId: m5, bidRate: 3 },
             { memberId: m8, bidRate: 2 }, { memberId: m10, bidRate: 3 }],
      winnerId: m10, winnerBidRate: 3, winnerNetAmount: 11_400_000, transactionId: t1c,
      status: 'closed', createdAt: isoAgo(2) },

    // Kỳ 4 — đang mở: m5 và m8 cùng kêu 6% → hòa → cần vòng quay!
    { id: s1d, groupId: g1, periodNumber: 4, date: ago(1), notes: 'Kỳ 4 — m5 và m8 cùng kêu 6%, cần bốc thăm!',
      bids: [{ memberId: m3, bidRate: 4.5 }, { memberId: m5, bidRate: 6 }, { memberId: m8, bidRate: 6 }],
      winnerId: null, winnerBidRate: null, winnerNetAmount: null, transactionId: null,
      status: 'open', createdAt: isoAgo(1) },

    // === g2: Hụi Gia Đình (dead · 5 thành viên · 3 tr · gross=15tr · net=14,775,000) ===
    // Kỳ 1 — đã chốt: m4 hốt
    { id: s2a, groupId: g2, periodNumber: 1, date: ago(3), notes: '',
      bids: [{ memberId: m4, bidRate: 0 }],
      winnerId: m4, winnerBidRate: 0, winnerNetAmount: 14_775_000, transactionId: t2a,
      status: 'closed', createdAt: isoAgo(3) },

    // Kỳ 2 — đã chốt: m9 hốt
    { id: s2b, groupId: g2, periodNumber: 2, date: ago(2), notes: '',
      bids: [{ memberId: m9, bidRate: 0 }],
      winnerId: m9, winnerBidRate: 0, winnerNetAmount: 14_775_000, transactionId: t2b,
      status: 'closed', createdAt: isoAgo(2) },

    // Kỳ 3 — đang mở: 3 ứng viên (m1, m3, m7) → dùng vòng quay may mắn
    { id: s2c, groupId: g2, periodNumber: 3, date: ago(1), notes: 'Có 3 người muốn hốt — quay may mắn!',
      bids: [],
      winnerId: null, winnerBidRate: null, winnerNetAmount: null, transactionId: null,
      status: 'open', createdAt: isoAgo(1) },

    // === g3: Hụi Đồng Nghiệp (live · tuần · 4 thành viên · 500k · gross=2tr · hoa hồng=40k) ===
    // Kỳ 1 — đã chốt: m8 hốt lãi 3% → net=1,900,000
    { id: s3a, groupId: g3, periodNumber: 1, date: ago(0, 2), notes: '',
      bids: [{ memberId: m8, bidRate: 3 }, { memberId: m2, bidRate: 2.5 },
             { memberId: m6, bidRate: 2 }, { memberId: m9, bidRate: 1.5 }],
      winnerId: m8, winnerBidRate: 3, winnerNetAmount: 1_900_000, transactionId: t3a,
      status: 'closed', createdAt: isoAgo(0, 2) },

    // Kỳ 2 — đang mở: m2 và m6 cùng kêu 4% → hòa → cần bốc thăm
    { id: s3b, groupId: g3, periodNumber: 2, date: ago(0, 1), notes: 'Tuần 2 — Anh Minh và Anh Hùng cùng kêu 4%',
      bids: [{ memberId: m2, bidRate: 4 }, { memberId: m6, bidRate: 4 }, { memberId: m9, bidRate: 2 }],
      winnerId: null, winnerBidRate: null, winnerNetAmount: null, transactionId: null,
      status: 'open', createdAt: isoAgo(0, 1) },

    // === g4: Hụi Cuối Năm (dead · 8 thành viên · 5 tr · gross=40tr · net=39,200,000) ===
    // Kỳ 1 — đã chốt: m9 hốt
    { id: s4a, groupId: g4, periodNumber: 1, date: ago(5), notes: '',
      bids: [{ memberId: m9, bidRate: 0 }],
      winnerId: m9, winnerBidRate: 0, winnerNetAmount: 39_200_000, transactionId: t4a,
      status: 'closed', createdAt: isoAgo(5) },

    // Kỳ 2 — đã chốt: m10 hốt
    { id: s4b, groupId: g4, periodNumber: 2, date: ago(4), notes: '',
      bids: [{ memberId: m10, bidRate: 0 }],
      winnerId: m10, winnerBidRate: 0, winnerNetAmount: 39_200_000, transactionId: t4b,
      status: 'closed', createdAt: isoAgo(4) },

    // Kỳ 3 — đã chốt: m6 hốt
    { id: s4c, groupId: g4, periodNumber: 3, date: ago(3), notes: '',
      bids: [{ memberId: m6, bidRate: 0 }],
      winnerId: m6, winnerBidRate: 0, winnerNetAmount: 39_200_000, transactionId: t4c,
      status: 'closed', createdAt: isoAgo(3) },

    // Kỳ 4 — đang mở: chị Lan (nợ) và chị Hoa (cảnh báo) chưa nộp quỹ
    { id: s4d, groupId: g4, periodNumber: 4, date: ago(2), notes: 'Kỳ 4 — ưu tiên thành viên lâu năm. Chị Lan & Chị Hoa chưa nộp.',
      bids: [],
      winnerId: null, winnerBidRate: null, winnerNetAmount: null, transactionId: null,
      status: 'open', createdAt: isoAgo(2) },
  ];

  // ── Transactions ─────────────────────────────────────────────────────
  const tx = [];

  // Helper tạo nhanh contribution
  const contrib = (gid, mids, amount, period, date) =>
    mids.map(mid => ({ id: uid(), groupId: gid, memberId: mid, kind: 'contribution',
      amount, periodNumber: period, date, status: 'completed', notes: `Góp kỳ ${period}` }));

  // Withdrawals (hốt hụi)
  tx.push({ id: t1a, groupId: g1, memberId: m1,  kind: 'withdrawal', amount: 11_280_000, periodNumber: 1, date: ago(4), status: 'completed', notes: 'Hốt hụi kỳ 1 — lãi kêu 4%',   meta: { gross: 12_000_000, commission: 240_000, interest: 480_000, bidRate: 4   } });
  tx.push({ id: t1b, groupId: g1, memberId: m2,  kind: 'withdrawal', amount: 11_100_000, periodNumber: 2, date: ago(3), status: 'completed', notes: 'Hốt hụi kỳ 2 — lãi kêu 5.5%', meta: { gross: 12_000_000, commission: 240_000, interest: 660_000, bidRate: 5.5 } });
  tx.push({ id: t1c, groupId: g1, memberId: m10, kind: 'withdrawal', amount: 11_400_000, periodNumber: 3, date: ago(2), status: 'completed', notes: 'Hốt hụi kỳ 3 — lãi kêu 3%',   meta: { gross: 12_000_000, commission: 240_000, interest: 360_000, bidRate: 3   } });
  tx.push({ id: t2a, groupId: g2, memberId: m4,  kind: 'withdrawal', amount: 14_775_000, periodNumber: 1, date: ago(3), status: 'completed', notes: 'Hốt hụi kỳ 1',                 meta: { gross: 15_000_000, commission: 225_000, bidRate: 0 } });
  tx.push({ id: t2b, groupId: g2, memberId: m9,  kind: 'withdrawal', amount: 14_775_000, periodNumber: 2, date: ago(2), status: 'completed', notes: 'Hốt hụi kỳ 2',                 meta: { gross: 15_000_000, commission: 225_000, bidRate: 0 } });
  tx.push({ id: t3a, groupId: g3, memberId: m8,  kind: 'withdrawal', amount: 1_900_000,  periodNumber: 1, date: ago(0, 2), status: 'completed', notes: 'Hốt hụi tuần 1 — lãi kêu 3%', meta: { gross: 2_000_000, commission: 40_000, interest: 60_000, bidRate: 3 } });
  tx.push({ id: t4a, groupId: g4, memberId: m9,  kind: 'withdrawal', amount: 39_200_000, periodNumber: 1, date: ago(5), status: 'completed', notes: 'Hốt hụi kỳ 1',                 meta: { gross: 40_000_000, commission: 800_000, bidRate: 0 } });
  tx.push({ id: t4b, groupId: g4, memberId: m10, kind: 'withdrawal', amount: 39_200_000, periodNumber: 2, date: ago(4), status: 'completed', notes: 'Hốt hụi kỳ 2',                 meta: { gross: 40_000_000, commission: 800_000, bidRate: 0 } });
  tx.push({ id: t4c, groupId: g4, memberId: m6,  kind: 'withdrawal', amount: 39_200_000, periodNumber: 3, date: ago(3), status: 'completed', notes: 'Hốt hụi kỳ 3',                 meta: { gross: 40_000_000, commission: 800_000, bidRate: 0 } });

  // Góp quỹ — g1 (kỳ 1-3 đầy đủ, kỳ 4 thiếu m3/m8/m10)
  tx.push(...contrib(g1, [m1, m2, m3, m5, m8, m10], 2_000_000, 1, ago(4)));
  tx.push(...contrib(g1, [m1, m2, m3, m5, m8, m10], 2_000_000, 2, ago(3)));
  tx.push(...contrib(g1, [m1, m2, m3, m5, m8, m10], 2_000_000, 3, ago(2)));
  tx.push(...contrib(g1, [m1, m2, m5],               2_000_000, 4, ago(1))); // m3 warning, m8 m10 chưa nộp

  // Góp quỹ — g2 (kỳ 1-2 đầy đủ, kỳ 3 thiếu m1/m3/m7)
  tx.push(...contrib(g2, [m1, m3, m4, m7, m9], 3_000_000, 1, ago(3)));
  tx.push(...contrib(g2, [m1, m3, m4, m7, m9], 3_000_000, 2, ago(2)));
  tx.push(...contrib(g2, [m4, m9],              3_000_000, 3, ago(1))); // m1 m3(warning) m7(debt) chưa nộp

  // Góp quỹ — g3 (tuần 1 đầy đủ, tuần 2 thiếu m2/m8)
  tx.push(...contrib(g3, [m2, m6, m8, m9], 500_000, 1, ago(0, 2)));
  tx.push(...contrib(g3, [m6, m9],          500_000, 2, ago(0, 1))); // m2 m8 chưa nộp

  // Góp quỹ — g4 (kỳ 1-3 đầy đủ, kỳ 4 thiếu m3/m7)
  [1, 2, 3].forEach(p => tx.push(...contrib(g4, [m2, m3, m4, m5, m6, m7, m9, m10], 5_000_000, p, ago(6 - p))));
  tx.push(...contrib(g4, [m2, m4, m5, m6, m9, m10], 5_000_000, 4, ago(2))); // m3(warning) m7(debt) chưa nộp

  return { groups, members, memberships, transactions: tx, sessions };
}

export const useHuiStore = create(
  persist(
    (set, get) => ({
      groups: /** @type {Group[]} */ ([]),
      members: /** @type {Member[]} */ ([DEFAULT_ADMIN]),
      memberships: /** @type {Membership[]} */ ([]),
      transactions: /** @type {Transaction[]} */ ([]),
      sessions: /** @type {Session[]} */ ([]),
      bankSettings: { bankId: '', accountNo: '', accountName: '', qrImageDataUrl: '' },
      paymentRequests: /** @type {Array} */ ([]),
      initialized: false,
      adminPasswordHash: '',
      memberPasswords: /** @type {Record<string,string>} */ ({ [DEFAULT_ADMIN_ID]: DEFAULT_ADMIN_HASH }),

      seedDemo: () => set((s) => {
        const seed = seedState();
        return {
          ...seed,
          members: [DEFAULT_ADMIN, ...seed.members.filter((m) => m.phone !== DEFAULT_ADMIN.phone)],
          memberPasswords: { ...s.memberPasswords, [DEFAULT_ADMIN_ID]: DEFAULT_ADMIN_HASH },
          initialized: true,
        };
      }),

      importBundle: (bundle) => {
        const g = bundle?.groups ?? [];
        const m = bundle?.members ?? [];
        const ms = bundle?.memberships ?? [];
        const t = bundle?.transactions ?? [];
        const sess = bundle?.sessions ?? [];
        const pr = bundle?.paymentRequests ?? [];
        set({
          groups: Array.isArray(g) ? g : [],
          members: Array.isArray(m) ? m : [],
          memberships: Array.isArray(ms) ? ms : [],
          transactions: Array.isArray(t) ? t : [],
          sessions: Array.isArray(sess) ? sess : [],
          paymentRequests: Array.isArray(pr) ? pr : [],
          initialized: true,
        });
      },

      exportBundle: () => {
        const { groups, members, memberships, transactions, sessions, paymentRequests } = get();
        return { groups, members, memberships, transactions, sessions, paymentRequests, exportedAt: new Date().toISOString() };
      },

      resetAll: () =>
        set({
          groups: [],
          members: [DEFAULT_ADMIN],
          memberships: [],
          transactions: [],
          sessions: [],
          paymentRequests: [],
          initialized: true,
          memberPasswords: { [DEFAULT_ADMIN_ID]: DEFAULT_ADMIN_HASH },
          adminPasswordHash: '',
        }),

      setAdminPasswordHash: (hash) => set({ adminPasswordHash: hash }),

      setMemberPassword: (memberId, hash) =>
        set((s) => ({ memberPasswords: { ...s.memberPasswords, [memberId]: hash } })),

      addGroup: (partial) => {
        const row = {
          id: uid(),
          name: partial.name,
          expectedMemberCount: Number(partial.expectedMemberCount) || 1,
          contributionAmount: Number(partial.contributionAmount) || 0,
          contributionAmountDead: Number(partial.contributionAmountDead) || 0,
          ownerCommissionAmount: Number(partial.ownerCommissionAmount) || 0,
          cycle: partial.cycle || 'month',
          startDate: partial.startDate || new Date().toISOString().slice(0, 10),
          type: partial.type || 'dead',
          interestRateAnnual: Number(partial.interestRateAnnual) || 0,
          ownerCommissionPercent: Number(partial.ownerCommissionPercent) || 0,
          notes: partial.notes || '',
          createdAt: new Date().toISOString(),
        };
        set((s) => ({ groups: [...s.groups, row], initialized: true }));
        return row.id;
      },

      updateGroup: (id, partial) => {
        set((s) => ({
          groups: s.groups.map((g) => (g.id === id ? { ...g, ...partial } : g)),
        }));
      },

      deleteGroup: (id) => {
        set((s) => ({
          groups: s.groups.filter((g) => g.id !== id),
          memberships: s.memberships.filter((x) => x.groupId !== id),
          transactions: s.transactions.filter((x) => x.groupId !== id),
          sessions: s.sessions.filter((x) => x.groupId !== id),
        }));
      },

      addMember: (partial) => {
        const row = {
          id: uid(),
          name: partial.name,
          phone: partial.phone || '',
          email: partial.email || '',
          address: partial.address || '',
          joinedAt: partial.joinedAt || new Date().toISOString().slice(0, 10),
          status: partial.status || 'active',
          isAdmin: partial.isAdmin ?? false,
        };
        set((s) => ({ members: [...s.members, row], initialized: true }));
        return row.id;
      },

      updateMember: (id, partial) => {
        set((s) => ({
          members: s.members.map((m) => (m.id === id ? { ...m, ...partial } : m)),
        }));
      },

      deleteMember: (id) => {
        set((s) => ({
          members: s.members.filter((m) => m.id !== id),
          memberships: s.memberships.filter((x) => x.memberId !== id),
          transactions: s.transactions.filter((x) => x.memberId !== id),
        }));
      },

      addMembership: (memberId, groupId) => {
        const exists = get().memberships.some((x) => x.memberId === memberId && x.groupId === groupId);
        if (exists) return;
        set((s) => ({
          memberships: [
            ...s.memberships,
            {
              id: uid(),
              memberId,
              groupId,
              joinedAt: new Date().toISOString().slice(0, 10),
            },
          ],
        }));
      },

      removeMembership: (memberId, groupId) => {
        set((s) => ({
          memberships: s.memberships.filter((x) => !(x.memberId === memberId && x.groupId === groupId)),
        }));
      },

      addTransaction: (partial) => {
        const row = {
          id: uid(),
          groupId: partial.groupId,
          memberId: partial.memberId,
          kind: partial.kind,
          amount: Number(partial.amount) || 0,
          periodNumber: partial.periodNumber != null ? Number(partial.periodNumber) : undefined,
          date: partial.date || new Date().toISOString().slice(0, 10),
          receiptNo: partial.receiptNo || '',
          notes: partial.notes || '',
          status: partial.status || 'completed',
          meta: partial.meta,
        };
        set((s) => ({ transactions: [row, ...s.transactions], initialized: true }));
        return row.id;
      },

      updateTransaction: (id, partial) => {
        set((s) => ({
          transactions: s.transactions.map((t) => (t.id === id ? { ...t, ...partial } : t)),
        }));
      },

      deleteTransaction: (id) => {
        set((s) => ({ transactions: s.transactions.filter((t) => t.id !== id) }));
      },

      addSession: (partial) => {
        const row = /** @type {Session} */ ({
          id: uid(),
          groupId: partial.groupId,
          periodNumber: Number(partial.periodNumber) || 1,
          date: partial.date || new Date().toISOString().slice(0, 10),
          bids: partial.bids || [],
          winnerId: null,
          winnerBidRate: null,
          winnerNetAmount: null,
          transactionId: null,
          status: 'open',
          notes: partial.notes ?? '',
          createdAt: new Date().toISOString(),
        });
        set((s) => ({ sessions: [row, ...s.sessions] }));
        return row.id;
      },

      updateSession: (id, partial) => {
        set((s) => ({
          sessions: s.sessions.map((sess) => (sess.id === id ? { ...sess, ...partial } : sess)),
        }));
      },

      deleteSession: (id) => {
        set((s) => ({ sessions: s.sessions.filter((sess) => sess.id !== id) }));
      },

      setBankSettings: (settings) =>
        set((s) => ({ bankSettings: { ...s.bankSettings, ...settings } })),

      addPaymentRequest: (partial) => {
        const row = {
          id: uid(),
          memberId: partial.memberId,
          groupId: partial.groupId,
          periodNumber: Number(partial.periodNumber),
          amount: Number(partial.amount),
          note: partial.note || '',
          transferRef: partial.transferRef || '',
          status: 'pending',
          createdAt: new Date().toISOString(),
        };
        set((s) => ({ paymentRequests: [row, ...s.paymentRequests] }));
        return row.id;
      },

      confirmPaymentRequest: (id) => {
        const state = get();
        const req = state.paymentRequests.find((r) => r.id === id);
        if (!req || req.status !== 'pending') return;
        const alreadyPaid = state.transactions.some(
          (t) => t.memberId === req.memberId && t.groupId === req.groupId
            && t.periodNumber === req.periodNumber && t.kind === 'contribution' && t.status === 'completed'
        );
        if (!alreadyPaid) {
          state.addTransaction({
            groupId: req.groupId,
            memberId: req.memberId,
            kind: 'contribution',
            amount: req.amount,
            periodNumber: req.periodNumber,
            date: new Date().toISOString().slice(0, 10),
            notes: `Góp kỳ ${req.periodNumber}${req.transferRef ? ` · CK: ${req.transferRef}` : ''}`,
            status: 'completed',
          });
        }
        set((s) => ({
          paymentRequests: s.paymentRequests.map((r) =>
            r.id === id ? { ...r, status: 'confirmed', reviewedAt: new Date().toISOString() } : r
          ),
        }));
      },

      rejectPaymentRequest: (id, reviewNote = '') => {
        set((s) => ({
          paymentRequests: s.paymentRequests.map((r) =>
            r.id === id ? { ...r, status: 'rejected', reviewedAt: new Date().toISOString(), reviewNote } : r
          ),
        }));
      },

      sessionsForGroup: (groupId) => get().sessions.filter((s) => s.groupId === groupId),

      memberById: (id) => get().members.find((m) => m.id === id),

      groupById: (id) => get().groups.find((g) => g.id === id),

      membersForGroup: (groupId) => {
        const { members, memberships } = get();
        const ids = new Set(memberships.filter((x) => x.groupId === groupId).map((x) => x.memberId));
        return members.filter((m) => ids.has(m.id));
      },

      groupsForMember: (memberId) => {
        const { groups, memberships } = get();
        const gids = memberships.filter((x) => x.memberId === memberId).map((x) => x.groupId);
        return groups.filter((g) => gids.includes(g.id));
      },

      contributionTotalForMember: (memberId) => {
        return get()
          .transactions.filter((t) => t.memberId === memberId && t.kind === 'contribution' && t.status === 'completed')
          .reduce((a, t) => a + t.amount, 0);
      },

      dashboardStats: () => {
        const { groups, members, transactions } = get();
        const contrib = transactions.filter((t) => t.kind === 'contribution' && t.status === 'completed');
        const withd = transactions.filter((t) => t.kind === 'withdrawal' && t.status === 'completed');

        const totalContrib = contrib.reduce((a, t) => a + t.amount, 0);
        const totalWithdraw = withd.reduce((a, t) => a + t.amount, 0);

        const commissionEst = groups.reduce((acc, g) => {
          const txs = transactions.filter((x) => x.groupId === g.id && x.kind === 'withdrawal' && x.status === 'completed');
          const fromMeta = txs.reduce((s, x) => s + (Number(x.meta?.commission) || 0), 0);
          return acc + fromMeta;
        }, 0);

        const fundBalance = totalContrib - totalWithdraw;

        return {
          groupCount: groups.length,
          memberCount: members.length,
          totalContrib,
          totalWithdraw,
          commissionEst,
          fundBalance,
        };
      },
    }),
    {
      name: 'hui-pro-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({
        groups: s.groups,
        members: s.members,
        memberships: s.memberships,
        transactions: s.transactions,
        sessions: s.sessions,
        bankSettings: s.bankSettings,
        paymentRequests: s.paymentRequests,
        initialized: s.initialized,
        adminPasswordHash: s.adminPasswordHash,
        memberPasswords: s.memberPasswords,
      }),
      merge: (persisted, current) => {
        const state = { ...current, ...persisted };
        if (!state.members.some((m) => m.id === DEFAULT_ADMIN_ID)) {
          state.members = [DEFAULT_ADMIN, ...state.members.filter((m) => m.phone !== DEFAULT_ADMIN.phone)];
        }
        state.memberPasswords = { ...state.memberPasswords, [DEFAULT_ADMIN_ID]: DEFAULT_ADMIN_HASH };
        if (!state.bankSettings) state.bankSettings = { bankId: '', accountNo: '', accountName: '', qrImageDataUrl: '' };
        // Migrate old bankName → bankId
        if ('bankName' in state.bankSettings && !state.bankSettings.bankId) {
          state.bankSettings.bankId = '';
          delete state.bankSettings.bankName;
        }
        if (!Array.isArray(state.paymentRequests)) state.paymentRequests = [];
        return state;
      },
    }
  )
);
