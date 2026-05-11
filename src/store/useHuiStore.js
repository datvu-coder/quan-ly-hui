import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

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
 */

function seedState() {
  const g1 = uid();
  const g2 = uid();
  const m1 = uid();
  const m2 = uid();
  const m3 = uid();
  const now = new Date().toISOString().slice(0, 10);

  /** @type {Group[]} */
  const groups = [
    {
      id: g1,
      name: 'Hụi Phố Cổ',
      expectedMemberCount: 12,
      contributionAmount: 2_000_000,
      cycle: 'month',
      startDate: now,
      type: 'live',
      interestRateAnnual: 18,
      ownerCommissionPercent: 2,
      notes: 'Ví dụ hụi sống — chỉnh sửa theo thỏa thuận thực tế.',
      createdAt: new Date().toISOString(),
    },
    {
      id: g2,
      name: 'Hụi Phát Tài',
      expectedMemberCount: 10,
      contributionAmount: 1_000_000,
      cycle: 'month',
      startDate: now,
      type: 'dead',
      interestRateAnnual: 0,
      ownerCommissionPercent: 2,
      notes: 'Hụi chết — không lãi.',
      createdAt: new Date().toISOString(),
    },
  ];

  /** @type {Member[]} */
  const members = [
    {
      id: m1,
      name: 'Chị Liên',
      phone: '0914123456',
      email: '',
      address: '',
      joinedAt: now,
      status: 'active',
    },
    {
      id: m2,
      name: 'Anh Minh',
      phone: '0987654321',
      joinedAt: now,
      status: 'active',
    },
    {
      id: m3,
      name: 'Chị Hoa',
      phone: '0901234567',
      joinedAt: now,
      status: 'warning',
    },
  ];

  /** @type {Membership[]} */
  const memberships = [
    { id: uid(), memberId: m1, groupId: g1, joinedAt: now },
    { id: uid(), memberId: m2, groupId: g1, joinedAt: now },
    { id: uid(), memberId: m2, groupId: g2, joinedAt: now },
    { id: uid(), memberId: m3, groupId: g2, joinedAt: now },
  ];

  /** @type {Transaction[]} */
  const transactions = [
    {
      id: uid(),
      groupId: g1,
      memberId: m1,
      kind: 'contribution',
      amount: 2_000_000,
      periodNumber: 1,
      date: now,
      status: 'completed',
      notes: 'Góp kỳ 1',
    },
    {
      id: uid(),
      groupId: g2,
      memberId: m2,
      kind: 'withdrawal',
      amount: 98_000_000,
      periodNumber: 10,
      date: now,
      status: 'completed',
      meta: { gross: 100_000_000, commission: 2_000_000 },
      notes: 'Hốt kỳ 10 (ví dụ)',
    },
  ];

  const s1 = uid();
  const s2 = uid();

  /** @type {Session[]} */
  const sessions = [
    {
      id: s1,
      groupId: g1,
      periodNumber: 1,
      date: now,
      bids: [
        { memberId: m1, bidRate: 3.5 },
        { memberId: m2, bidRate: 5 },
      ],
      winnerId: null,
      winnerBidRate: null,
      winnerNetAmount: null,
      transactionId: null,
      status: 'open',
      createdAt: new Date().toISOString(),
    },
    {
      id: s2,
      groupId: g2,
      periodNumber: 10,
      date: now,
      bids: [{ memberId: m2, bidRate: 0 }],
      winnerId: m2,
      winnerBidRate: 0,
      winnerNetAmount: 9_800_000,
      transactionId: null,
      status: 'closed',
      createdAt: new Date().toISOString(),
    },
  ];

  return { groups, members, memberships, transactions, sessions };
}

export const useHuiStore = create(
  persist(
    (set, get) => ({
      groups: /** @type {Group[]} */ ([]),
      members: /** @type {Member[]} */ ([]),
      memberships: /** @type {Membership[]} */ ([]),
      transactions: /** @type {Transaction[]} */ ([]),
      sessions: /** @type {Session[]} */ ([]),
      initialized: false,

      seedDemo: () => set({ ...seedState(), initialized: true }),

      importBundle: (bundle) => {
        const g = bundle?.groups ?? [];
        const m = bundle?.members ?? [];
        const ms = bundle?.memberships ?? [];
        const t = bundle?.transactions ?? [];
        const sess = bundle?.sessions ?? [];
        set({
          groups: Array.isArray(g) ? g : [],
          members: Array.isArray(m) ? m : [],
          memberships: Array.isArray(ms) ? ms : [],
          transactions: Array.isArray(t) ? t : [],
          sessions: Array.isArray(sess) ? sess : [],
          initialized: true,
        });
      },

      exportBundle: () => {
        const { groups, members, memberships, transactions, sessions } = get();
        return { groups, members, memberships, transactions, sessions, exportedAt: new Date().toISOString() };
      },

      resetAll: () =>
        set({
          groups: [],
          members: [],
          memberships: [],
          transactions: [],
          sessions: [],
          initialized: true,
        }),

      addGroup: (partial) => {
        const row = {
          id: uid(),
          name: partial.name,
          expectedMemberCount: Number(partial.expectedMemberCount) || 1,
          contributionAmount: Number(partial.contributionAmount) || 0,
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
        initialized: s.initialized,
      }),
    }
  )
);
