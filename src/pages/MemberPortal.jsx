import React, { useMemo, useState } from 'react';
import {
  LogOut, CheckCircle2, Clock, TrendingDown, TrendingUp,
  Users, Calendar, Gavel, X, Edit2, AlertCircle,
} from 'lucide-react';
import { useHuiStore } from '../store/useHuiStore.js';
import { formatDate, formatVnd, cycleLabel } from '../lib/format.js';
import { calcSessionNet } from '../lib/period.js';

const statusLabel = { active: 'Đang hoạt động', warning: 'Cần chú ý', debt: 'Đang nợ', left: 'Đã rời' };
const statusCls   = { active: 'bg-green-100 text-green-700', warning: 'bg-amber-100 text-amber-700', debt: 'bg-red-100 text-red-700', left: 'bg-gray-100 text-gray-500' };

// ── Bid panel: member submits / edits / cancels their bid ─────────────────────
function BidPanel({ group, session, memberId }) {
  const updateSession = useHuiStore((s) => s.updateSession);
  const isLive = group.type === 'live';

  const [editing, setEditing]   = useState(false);
  const [bidRate, setBidRate]   = useState('');
  const [error, setError]       = useState('');

  const myBid    = session.bids.find((b) => b.memberId === memberId);
  const topRate  = isLive && session.bids.length
    ? Math.max(...session.bids.map((b) => b.bidRate))
    : null;
  const rivalCount = session.bids.filter((b) => b.memberId !== memberId).length;

  // Estimated pot when member types a rate
  const previewNet = isLive && bidRate !== ''
    ? calcSessionNet(group, Math.max(0, Number(bidRate) || 0)).net
    : null;

  const doSubmit = () => {
    setError('');
    const rate = isLive ? Number(bidRate) : 0;
    if (isLive) {
      if (isNaN(rate) || rate < 0 || rate > 50) {
        setError('Lãi kêu phải từ 0% đến 50%');
        return;
      }
    }
    const updated = myBid
      ? session.bids.map((b) => b.memberId === memberId ? { memberId, bidRate: rate } : b)
      : [...session.bids, { memberId, bidRate: rate }];
    updateSession(session.id, { bids: updated });
    setBidRate('');
    setEditing(false);
  };

  const doCancel = () => {
    updateSession(session.id, { bids: session.bids.filter((b) => b.memberId !== memberId) });
    setBidRate('');
    setEditing(false);
  };

  // ── Already bid, not editing ──────────────────────────────────────────────
  if (myBid && !editing) {
    const isLeading = isLive && myBid.bidRate >= (topRate ?? 0);
    return (
      <div className={`rounded-xl border p-4 space-y-3 ${
        isLeading && isLive
          ? 'bg-emerald-50 border-emerald-200'
          : 'bg-blue-50 border-blue-200'
      }`}>
        <div className="flex items-center justify-between">
          <p className={`text-sm font-semibold ${isLeading && isLive ? 'text-emerald-800' : 'text-blue-800'}`}>
            {isLive ? 'Lượt kêu của bạn' : 'Đăng ký hốt'}
          </p>
          {isLive && isLeading && (
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-200 text-emerald-800">
              ↑ Đang dẫn đầu
            </span>
          )}
        </div>

        {isLive ? (
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <p className="text-2xl font-bold text-gray-900">{myBid.bidRate}%</p>
              <p className="text-xs text-gray-500 mt-0.5">
                Nhận ≈ <span className="font-semibold text-gray-700">{formatVnd(calcSessionNet(group, myBid.bidRate).net)}</span>
                {rivalCount > 0 && ` · ${rivalCount} người cùng kêu`}
              </p>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => { setBidRate(String(myBid.bidRate)); setEditing(true); }}
                className="p-2 rounded-lg bg-white border border-gray-200 hover:bg-gray-50 text-gray-500 transition-colors"
              >
                <Edit2 size={15} />
              </button>
              <button
                type="button"
                onClick={doCancel}
                className="p-2 rounded-lg bg-white border border-red-200 hover:bg-red-50 text-red-400 transition-colors"
              >
                <X size={15} />
              </button>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-blue-700">
              <CheckCircle2 size={16} />
              <span className="text-sm font-medium">Đã đăng ký hốt kỳ {session.periodNumber}</span>
            </div>
            <button
              type="button"
              onClick={doCancel}
              className="text-xs text-red-400 hover:text-red-600 px-2 py-1 rounded-lg hover:bg-red-50 transition-colors"
            >
              Hủy
            </button>
          </div>
        )}
      </div>
    );
  }

  // ── Bid form ──────────────────────────────────────────────────────────────
  return (
    <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Gavel size={15} className="text-amber-600" />
          <p className="text-sm font-semibold text-amber-800">
            {isLive ? 'Kêu hụi kỳ này' : 'Đăng ký hốt kỳ này'}
          </p>
        </div>
        {editing && (
          <button
            type="button"
            onClick={() => { setEditing(false); setError(''); setBidRate(''); }}
            className="text-xs text-gray-400 hover:text-gray-600"
          >
            Hủy sửa
          </button>
        )}
      </div>

      {/* Context info */}
      {isLive && rivalCount > 0 && (
        <p className="text-xs text-amber-700 flex items-center gap-1">
          <AlertCircle size={12} />
          {rivalCount} người đã kêu · lãi cao nhất hiện tại: <strong>{topRate}%</strong>
        </p>
      )}

      {isLive ? (
        <div className="space-y-2">
          <div className="flex gap-2 items-start">
            <div className="flex-1 space-y-1">
              <label className="text-xs text-amber-700 font-medium">Lãi kêu (%/kỳ)</label>
              <input
                type="number"
                min={0}
                max={50}
                step={0.1}
                value={bidRate}
                onChange={(e) => { setBidRate(e.target.value); setError(''); }}
                placeholder="VD: 5.5"
                className={`w-full rounded-lg border bg-white px-3 py-2.5 text-gray-900 text-sm
                  focus:outline-none focus:ring-2 focus:ring-amber-400/30 transition-all
                  ${error ? 'border-red-400' : 'border-gray-200'}`}
              />
              {previewNet !== null && (
                <p className="text-xs text-gray-500">
                  Nếu trúng → nhận ≈ <span className="font-semibold text-emerald-600">{formatVnd(previewNet)}</span>
                </p>
              )}
              {error && <p className="text-xs text-red-500">{error}</p>}
            </div>
            <button
              type="button"
              onClick={doSubmit}
              disabled={bidRate === ''}
              className="mt-5 px-4 py-2.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-white font-semibold text-sm
                transition-colors disabled:opacity-40 disabled:pointer-events-none whitespace-nowrap"
            >
              {myBid ? 'Cập nhật' : 'Kêu hụi'}
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          <p className="text-xs text-amber-700">
            Hụi chết — nhận{' '}
            <strong>{formatVnd(calcSessionNet(group, 0).net)}</strong> nếu được chọn kỳ {session.periodNumber}.
          </p>
          <button
            type="button"
            onClick={doSubmit}
            className="w-full py-2.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-white font-semibold text-sm transition-colors"
          >
            Đăng ký hốt kỳ {session.periodNumber}
          </button>
        </div>
      )}
    </div>
  );
}

// ── Main portal ───────────────────────────────────────────────────────────────
export default function MemberPortal({ memberId, onLogout }) {
  const memberById      = useHuiStore((s) => s.memberById);
  const groupsForMember = useHuiStore((s) => s.groupsForMember);
  const membersForGroup = useHuiStore((s) => s.membersForGroup);
  const sessions        = useHuiStore((s) => s.sessions);
  const transactions    = useHuiStore((s) => s.transactions);

  const member   = memberById(memberId);
  const [tab, setTab] = useState('groups');

  const myGroups = useMemo(() => groupsForMember(memberId), [memberId, groupsForMember]);

  const groupData = useMemo(() => myGroups.map((g) => {
    const groupSessions  = sessions.filter((s) => s.groupId === g.id);
    const openSession    = groupSessions.find((s) => s.status === 'open') ?? null;
    const closedSessions = groupSessions
      .filter((s) => s.status === 'closed')
      .sort((a, b) => a.periodNumber - b.periodNumber);

    const iWonPeriod = closedSessions.find((s) => s.winnerId === memberId)?.periodNumber ?? null;

    const myPaidThisPeriod = openSession
      ? transactions.some(
          (t) => t.groupId === g.id && t.memberId === memberId
               && t.periodNumber === openSession.periodNumber
               && t.kind === 'contribution' && t.status === 'completed'
        )
      : null;

    const history = closedSessions.map((s) => ({
      period: s.periodNumber,
      winnerName: s.winnerId ? memberById(s.winnerId)?.name ?? '—' : '—',
      isMe: s.winnerId === memberId,
      net: s.winnerNetAmount,
    }));

    const wonIds    = new Set(closedSessions.map((s) => s.winnerId).filter(Boolean));
    const remaining = membersForGroup(g.id).filter((m) => !wonIds.has(m.id));
    const iAmEligible = remaining.some((m) => m.id === memberId);

    return { group: g, openSession, iWonPeriod, myPaidThisPeriod, history, remaining, iAmEligible };
  }), [myGroups, sessions, transactions, memberId, memberById, membersForGroup]);

  const myTxs = useMemo(() =>
    transactions
      .filter((t) => t.memberId === memberId)
      .sort((a, b) => new Date(b.date) - new Date(a.date)),
    [transactions, memberId]
  );

  const totalContrib   = myTxs.filter((t) => t.kind === 'contribution' && t.status === 'completed').reduce((s, t) => s + t.amount, 0);
  const totalReceived  = myTxs.filter((t) => t.kind === 'withdrawal'   && t.status === 'completed').reduce((s, t) => s + t.amount, 0);
  const openBidCount   = groupData.filter(({ openSession, iAmEligible, iWonPeriod }) => openSession && iAmEligible && iWonPeriod === null).length;

  if (!member) return null;

  const tabs = [
    { key: 'groups',       label: 'Dây hụi của tôi', badge: null },
    { key: 'keu-hui',      label: 'Kêu hụi', badge: openBidCount || null },
    { key: 'transactions', label: 'Giao dịch',        badge: null },
  ];

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

      {/* Summary */}
      <div className="bg-slate-800 px-5 py-4 grid grid-cols-3 gap-3 text-white text-center">
        <div>
          <p className="text-xs text-slate-400 mb-0.5">Dây tham gia</p>
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
        {tabs.map(({ key, label, badge }) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key)}
            className={`relative px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              tab === key
                ? 'border-amber-400 text-amber-700'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {label}
            {badge != null && (
              <span className="ml-1.5 inline-flex items-center justify-center w-4 h-4 rounded-full bg-red-500 text-white text-[10px] font-bold">
                {badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      <main className="flex-1 overflow-auto p-4 sm:p-6 space-y-4 max-w-2xl w-full mx-auto">

        {/* ── Dây hụi tab ── */}
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

                <div className="p-4 space-y-3">
                  {/* Contribution status */}
                  {openSession ? (
                    <div className={`flex items-center justify-between rounded-lg px-4 py-3 ${
                      myPaidThisPeriod ? 'bg-green-50 border border-green-200' : 'bg-amber-50 border border-amber-200'
                    }`}>
                      <div className="flex items-center gap-2">
                        {myPaidThisPeriod
                          ? <CheckCircle2 size={16} className="text-green-600" />
                          : <Clock size={16} className="text-amber-500" />}
                        <div>
                          <p className="text-sm font-medium text-gray-800">
                            Kỳ {openSession.periodNumber} — {formatDate(openSession.date)}
                          </p>
                          <p className={`text-xs ${myPaidThisPeriod ? 'text-green-600' : 'text-amber-600'}`}>
                            {myPaidThisPeriod ? 'Bạn đã nộp quỹ kỳ này' : 'Bạn chưa nộp quỹ kỳ này'}
                          </p>
                        </div>
                      </div>
                      <span className="text-xs font-semibold text-gray-600">{formatVnd(g.contributionAmount)}</span>
                    </div>
                  ) : (
                    <p className="text-xs text-gray-400 italic">Chưa có phiên kêu hụi đang mở.</p>
                  )}

                  {/* Win status */}
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

                  {/* Remaining */}
                  {remaining.length > 0 && (
                    <div>
                      <p className="text-xs font-medium text-gray-500 mb-2 flex items-center gap-1">
                        <Users size={12} /> Thành viên chưa hốt ({remaining.length})
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {remaining.map((m) => (
                          <span key={m.id} className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                            m.id === memberId ? 'bg-amber-400 text-slate-900' : 'bg-gray-100 text-gray-600'
                          }`}>
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
                          <div key={h.period} className={`flex items-center justify-between text-xs px-3 py-2 rounded-lg ${
                            h.isMe ? 'bg-amber-50 border border-amber-200' : 'bg-gray-50 border border-gray-100'
                          }`}>
                            <span className={h.isMe ? 'font-semibold text-amber-700' : 'text-gray-500'}>Kỳ {h.period}</span>
                            <span className={h.isMe ? 'font-bold text-amber-800' : 'text-gray-700'}>{h.winnerName}{h.isMe && ' (bạn)'}</span>
                            {h.net != null && (
                              <span className={`font-medium ${h.isMe ? 'text-emerald-600' : 'text-gray-400'}`}>{formatVnd(h.net)}</span>
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

        {/* ── Kêu hụi tab ── */}
        {tab === 'keu-hui' && (
          <>
            {groupData.filter(({ openSession }) => openSession).length === 0 && (
              <div className="text-center py-16 space-y-2">
                <Gavel size={32} className="text-gray-300 mx-auto" />
                <p className="text-sm text-gray-400">Chưa có phiên kêu hụi nào đang mở.</p>
              </div>
            )}

            {groupData
              .filter(({ openSession }) => !!openSession)
              .map(({ group: g, openSession, iWonPeriod, iAmEligible }) => (
                <div key={g.id} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                  {/* Header */}
                  <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-gray-900 text-sm">{g.name}</p>
                      <p className="text-xs text-gray-400">
                        Kỳ {openSession.periodNumber} · {formatDate(openSession.date)} · {g.type === 'live' ? 'Hụi sống' : 'Hụi chết'}
                      </p>
                    </div>
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-100 text-amber-700">
                      Đang mở
                    </span>
                  </div>

                  <div className="p-4 space-y-4">
                    {/* Bid stats */}
                    <div className="grid grid-cols-3 gap-3 text-center text-xs">
                      <div className="rounded-lg bg-gray-50 border border-gray-100 py-2.5">
                        <p className="text-gray-400 mb-0.5">Tổng quỹ</p>
                        <p className="font-bold text-gray-900">{formatVnd(g.contributionAmount * g.expectedMemberCount)}</p>
                      </div>
                      <div className="rounded-lg bg-gray-50 border border-gray-100 py-2.5">
                        <p className="text-gray-400 mb-0.5">Nhận được</p>
                        <p className="font-bold text-emerald-600">{formatVnd(calcSessionNet(g, 0).net)}</p>
                      </div>
                      <div className="rounded-lg bg-gray-50 border border-gray-100 py-2.5">
                        <p className="text-gray-400 mb-0.5">Đã kêu</p>
                        <p className="font-bold text-amber-600">{openSession.bids.length} người</p>
                      </div>
                    </div>

                    {/* Bid panel or status */}
                    {iWonPeriod != null ? (
                      <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 border border-green-200 rounded-xl px-4 py-3">
                        <CheckCircle2 size={15} className="shrink-0" />
                        <span>Bạn đã hốt kỳ <strong>{iWonPeriod}</strong> trong dây này — không thể kêu thêm.</span>
                      </div>
                    ) : !iAmEligible ? (
                      <p className="text-sm text-gray-400 text-center py-2">Bạn không còn đủ điều kiện hốt kỳ này.</p>
                    ) : (
                      <BidPanel group={g} session={openSession} memberId={memberId} />
                    )}

                    {/* Live hui: leaderboard */}
                    {g.type === 'live' && openSession.bids.length > 0 && (
                      <div>
                        <p className="text-xs font-medium text-gray-500 mb-2">Bảng kêu hiện tại</p>
                        <div className="space-y-1.5">
                          {[...openSession.bids]
                            .sort((a, b) => b.bidRate - a.bidRate)
                            .map((bid, idx) => {
                              const isMe = bid.memberId === memberId;
                              return (
                                <div key={bid.memberId} className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs border ${
                                  idx === 0 ? 'bg-amber-50 border-amber-200' : 'bg-gray-50 border-gray-100'
                                }`}>
                                  <span className={`font-medium ${idx === 0 ? 'text-amber-700' : 'text-gray-600'}`}>
                                    {idx === 0 && '↑ '}Người {idx + 1}{isMe ? ' (bạn)' : ''}
                                  </span>
                                  <span className={`font-bold ${idx === 0 ? 'text-amber-800' : 'text-gray-700'}`}>
                                    {bid.bidRate}%
                                  </span>
                                </div>
                              );
                            })}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
          </>
        )}

        {/* ── Giao dịch tab ── */}
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
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${isContrib ? 'bg-red-50' : 'bg-green-50'}`}>
                        {isContrib
                          ? <TrendingDown size={15} className="text-red-500" />
                          : <TrendingUp size={15} className="text-green-600" />}
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
                      <p className="text-xs text-gray-400">{isContrib ? 'Góp quỹ' : 'Hốt hụi'}</p>
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
