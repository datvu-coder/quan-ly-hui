import React, { useMemo, useState } from 'react';
import { LogOut, CheckCircle2, Clock, TrendingDown, TrendingUp, Users, Calendar } from 'lucide-react';
import { useHuiStore } from '../store/useHuiStore.js';
import { formatDate, formatVnd, cycleLabel } from '../lib/format.js';

const statusLabel = { active: 'Đang hoạt động', warning: 'Cần chú ý', debt: 'Đang nợ', left: 'Đã rời' };
const statusCls = { active: 'bg-green-100 text-green-700', warning: 'bg-amber-100 text-amber-700', debt: 'bg-red-100 text-red-700', left: 'bg-gray-100 text-gray-500' };

export default function MemberPortal({ memberId, onLogout }) {
  const memberById   = useHuiStore((s) => s.memberById);
  const groupsForMember = useHuiStore((s) => s.groupsForMember);
  const membersForGroup = useHuiStore((s) => s.membersForGroup);
  const sessions     = useHuiStore((s) => s.sessions);
  const transactions = useHuiStore((s) => s.transactions);

  const member = memberById(memberId);
  const [tab, setTab] = useState('groups'); // 'groups' | 'transactions'

  const myGroups = useMemo(() => groupsForMember(memberId), [memberId, groupsForMember]);

  // Per-group computed data
  const groupData = useMemo(() => myGroups.map((g) => {
    const groupSessions = sessions.filter((s) => s.groupId === g.id);
    const openSession   = groupSessions.find((s) => s.status === 'open') ?? null;
    const closedSessions = groupSessions
      .filter((s) => s.status === 'closed')
      .sort((a, b) => a.periodNumber - b.periodNumber);

    const iWonPeriod = closedSessions.find((s) => s.winnerId === memberId)?.periodNumber ?? null;

    // My contribution for the current open period
    const myPaidThisPeriod = openSession
      ? transactions.some(
          (t) => t.groupId === g.id && t.memberId === memberId
               && t.periodNumber === openSession.periodNumber
               && t.kind === 'contribution' && t.status === 'completed'
        )
      : null;

    // History: who won each closed period
    const history = closedSessions.map((s) => ({
      period: s.periodNumber,
      winnerId: s.winnerId,
      winnerName: s.winnerId ? memberById(s.winnerId)?.name ?? '—' : '—',
      isMe: s.winnerId === memberId,
      net: s.winnerNetAmount,
    }));

    // Eligible members still to win
    const wonIds = new Set(closedSessions.map((s) => s.winnerId).filter(Boolean));
    const groupMembers = membersForGroup(g.id);
    const remaining = groupMembers.filter((m) => !wonIds.has(m.id));
    const iAmEligible = remaining.some((m) => m.id === memberId);

    return { group: g, openSession, closedSessions, iWonPeriod, myPaidThisPeriod, history, remaining, iAmEligible };
  }), [myGroups, sessions, transactions, memberId, memberById, membersForGroup]);

  // My personal transactions
  const myTxs = useMemo(() =>
    transactions
      .filter((t) => t.memberId === memberId)
      .sort((a, b) => new Date(b.date) - new Date(a.date)),
    [transactions, memberId]
  );

  // Stats
  const totalContrib = myTxs.filter((t) => t.kind === 'contribution' && t.status === 'completed').reduce((s, t) => s + t.amount, 0);
  const totalReceived = myTxs.filter((t) => t.kind === 'withdrawal' && t.status === 'completed').reduce((s, t) => s + t.amount, 0);

  if (!member) return null;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-slate-900 text-white px-5 py-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shrink-0">
            <span className="text-white font-bold text-lg">H</span>
          </div>
          <div>
            <p className="text-xs text-slate-400">Xin chào,</p>
            <p className="font-bold text-white text-sm">{member.name}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${statusCls[member.status] ?? statusCls.active}`}>
            {statusLabel[member.status] ?? member.status}
          </span>
          <button
            type="button"
            onClick={onLogout}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs transition-colors"
          >
            <LogOut size={14} /> Đăng xuất
          </button>
        </div>
      </header>

      {/* Summary cards */}
      <div className="bg-slate-800 px-5 py-4 grid grid-cols-3 gap-3 text-white text-center">
        <div>
          <p className="text-xs text-slate-400 mb-0.5">Dây đang tham gia</p>
          <p className="text-xl font-bold text-amber-400">{myGroups.length}</p>
        </div>
        <div>
          <p className="text-xs text-slate-400 mb-0.5">Đã góp quỹ</p>
          <p className="text-xl font-bold text-orange-400">{formatVnd(totalContrib)}</p>
        </div>
        <div>
          <p className="text-xs text-slate-400 mb-0.5">Đã hốt</p>
          <p className="text-xl font-bold text-emerald-400">{formatVnd(totalReceived)}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-gray-200 flex px-4">
        {[
          { key: 'groups', label: 'Dây hụi của tôi' },
          { key: 'transactions', label: 'Giao dịch cá nhân' },
        ].map(({ key, label }) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key)}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              tab === key
                ? 'border-amber-400 text-amber-700'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Content */}
      <main className="flex-1 overflow-auto p-4 sm:p-6 space-y-4 max-w-2xl w-full mx-auto">

        {/* ── Groups tab ── */}
        {tab === 'groups' && (
          <>
            {groupData.length === 0 && (
              <p className="text-center text-sm text-gray-400 py-12">Bạn chưa tham gia dây hụi nào.</p>
            )}

            {groupData.map(({ group: g, openSession, iWonPeriod, myPaidThisPeriod, history, remaining, iAmEligible }) => (
              <div key={g.id} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                {/* Group header */}
                <div className="p-4 border-b border-gray-100">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-semibold text-gray-900">{g.name}</h3>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {g.type === 'live' ? 'Hụi sống' : 'Hụi chết'} · {cycleLabel(g.cycle)} · {g.expectedMemberCount} người
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-xs text-gray-400">Mệnh giá</p>
                      <p className="font-bold text-amber-600 text-sm">{formatVnd(g.contributionAmount)}/kỳ</p>
                    </div>
                  </div>
                </div>

                {/* Current period status */}
                <div className="p-4 space-y-3">
                  {openSession ? (
                    <div className={`flex items-center justify-between rounded-lg px-4 py-3 ${
                      myPaidThisPeriod
                        ? 'bg-green-50 border border-green-200'
                        : 'bg-amber-50 border border-amber-200'
                    }`}>
                      <div className="flex items-center gap-2">
                        {myPaidThisPeriod
                          ? <CheckCircle2 size={16} className="text-green-600" />
                          : <Clock size={16} className="text-amber-500" />
                        }
                        <div>
                          <p className="text-sm font-medium text-gray-800">
                            Kỳ {openSession.periodNumber} — {formatDate(openSession.date)}
                          </p>
                          <p className={`text-xs ${myPaidThisPeriod ? 'text-green-600' : 'text-amber-600'}`}>
                            {myPaidThisPeriod ? 'Bạn đã nộp quỹ kỳ này' : 'Bạn chưa nộp quỹ kỳ này'}
                          </p>
                        </div>
                      </div>
                      <span className="text-xs font-semibold text-gray-600">
                        {formatVnd(g.contributionAmount)}
                      </span>
                    </div>
                  ) : (
                    <p className="text-xs text-gray-400 italic">Chưa có phiên kêu hụi đang mở.</p>
                  )}

                  {/* My win status */}
                  {iWonPeriod != null ? (
                    <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-4 py-2.5">
                      <CheckCircle2 size={15} className="shrink-0" />
                      <span>Bạn đã hốt kỳ <strong>{iWonPeriod}</strong></span>
                    </div>
                  ) : iAmEligible ? (
                    <div className="flex items-center gap-2 text-sm text-blue-700 bg-blue-50 border border-blue-200 rounded-lg px-4 py-2.5">
                      <Calendar size={15} className="shrink-0" />
                      <span>Bạn còn <strong>đủ điều kiện hốt</strong> hụi trong dây này</span>
                    </div>
                  ) : null}

                  {/* Remaining eligible members */}
                  {remaining.length > 0 && (
                    <div>
                      <p className="text-xs font-medium text-gray-500 mb-2 flex items-center gap-1">
                        <Users size={12} /> Thành viên chưa hốt ({remaining.length})
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {remaining.map((m) => (
                          <span
                            key={m.id}
                            className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                              m.id === memberId
                                ? 'bg-amber-400 text-slate-900'
                                : 'bg-gray-100 text-gray-600'
                            }`}
                          >
                            {m.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* History */}
                  {history.length > 0 && (
                    <div>
                      <p className="text-xs font-medium text-gray-500 mb-2">Lịch sử kỳ đã chốt</p>
                      <div className="space-y-1">
                        {history.map((h) => (
                          <div
                            key={h.period}
                            className={`flex items-center justify-between text-xs px-3 py-2 rounded-lg ${
                              h.isMe
                                ? 'bg-amber-50 border border-amber-200'
                                : 'bg-gray-50 border border-gray-100'
                            }`}
                          >
                            <span className={h.isMe ? 'font-semibold text-amber-700' : 'text-gray-500'}>
                              Kỳ {h.period}
                            </span>
                            <span className={h.isMe ? 'font-bold text-amber-800' : 'text-gray-700'}>
                              {h.winnerName} {h.isMe && '(bạn)'}
                            </span>
                            {h.net != null && (
                              <span className={`font-medium ${h.isMe ? 'text-emerald-600' : 'text-gray-400'}`}>
                                {formatVnd(h.net)}
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </>
        )}

        {/* ── Transactions tab ── */}
        {tab === 'transactions' && (
          <>
            {myTxs.length === 0 && (
              <p className="text-center text-sm text-gray-400 py-12">Chưa có giao dịch nào.</p>
            )}
            <div className="space-y-2">
              {myTxs.map((t) => {
                const isContrib = t.kind === 'contribution';
                return (
                  <div key={t.id} className="bg-white rounded-xl border border-gray-200 px-4 py-3 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                        isContrib ? 'bg-red-50' : 'bg-green-50'
                      }`}>
                        {isContrib
                          ? <TrendingDown size={15} className="text-red-500" />
                          : <TrendingUp size={15} className="text-green-600" />
                        }
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-800 truncate">
                          {t.notes || (isContrib ? `Góp kỳ ${t.periodNumber}` : `Hốt kỳ ${t.periodNumber}`)}
                        </p>
                        <p className="text-xs text-gray-400">{formatDate(t.date)}</p>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className={`text-sm font-bold ${isContrib ? 'text-red-500' : 'text-emerald-600'}`}>
                        {isContrib ? '−' : '+'}{formatVnd(t.amount)}
                      </p>
                      <p className="text-xs text-gray-400">
                        {isContrib ? 'Góp quỹ' : 'Hốt hụi'}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
