import React, { useMemo, useState } from 'react';
import LogoIcon from '../components/LogoIcon.jsx';
import {
  LogOut, CheckCircle2, Clock, TrendingDown, TrendingUp,
  Users, Calendar, Gavel, X, Edit2, AlertCircle,
  QrCode, Send, Copy, XCircle,
} from 'lucide-react';
import { useHuiStore } from '../store/useHuiStore.js';
import { formatDate, formatVnd, formatVndCompact, cycleLabel } from '../lib/format.js';
import { bankDisplayName, buildVietQrUrl } from '../lib/banks.js';
import { calcSessionNet, calcPeriodGross } from '../lib/period.js';

const statusLabel = { active: 'Đang hoạt động', warning: 'Cần chú ý', debt: 'Đang nợ', left: 'Đã rời' };
const statusCls   = { active: 'bg-green-100 text-green-700', warning: 'bg-amber-100 text-amber-700', debt: 'bg-red-100 text-red-700', left: 'bg-gray-100 text-gray-500' };

// ── Bid panel: member submits / edits / cancels their bid ─────────────────────
function BidPanel({ group, session, memberId, memberIds }) {
  const updateSession = useHuiStore((s) => s.updateSession);
  const sessions      = useHuiStore((s) => s.sessions);
  const isLive = group.type === 'live';

  const [editing, setEditing]   = useState(false);
  const [bidRate, setBidRate]   = useState('');
  const [error, setError]       = useState('');

  // Gross thực tế của kỳ này (tính đúng số người đã hốt, mức đóng chết/sống)
  const gross = useMemo(
    () => calcPeriodGross(group, sessions, memberIds ?? [], session.periodNumber),
    [group, sessions, memberIds, session.periodNumber]
  );

  const myBid    = session.bids.find((b) => b.memberId === memberId);
  const topRate  = isLive && session.bids.length
    ? Math.max(...session.bids.map((b) => b.bidRate))
    : null;
  const rivalCount = session.bids.filter((b) => b.memberId !== memberId).length;

  // Estimated pot when member types a rate
  const previewNet = isLive && bidRate !== ''
    ? calcSessionNet(group, Math.max(0, Number(bidRate) || 0), gross).net
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
                Nhận ≈ <span className="font-semibold text-gray-700">{formatVnd(calcSessionNet(group, myBid.bidRate, gross).net)}</span>
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
            <strong>{formatVnd(calcSessionNet(group, 0, gross).net)}</strong> nếu được chọn kỳ {session.periodNumber}.
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

// ── Payment / QR section ────────────────────────────────────────────────────
function PaymentSection({ group, session, memberId, iWonPeriod }) {
  const bankSettings      = useHuiStore((s) => s.bankSettings);
  const paymentRequests   = useHuiStore((s) => s.paymentRequests);
  const addPaymentRequest = useHuiStore((s) => s.addPaymentRequest);

  const existingReq = paymentRequests.find(
    (r) => r.memberId === memberId && r.groupId === group.id && r.periodNumber === session.periodNumber
  );

  const [open, setOpen]           = useState(false);
  const [note, setNote]           = useState('');
  const [transferRef, setTranRef] = useState('');
  const [copied, setCopied]       = useState(false);
  const [qrError, setQrError]     = useState(false);

  // Số tiền đóng phụ thuộc vào trạng thái: đã hốt → mức chết, chưa hốt → mức sống
  const isDeadMember = iWonPeriod != null;
  const amountToPay = isDeadMember && group.contributionAmountDead
    ? group.contributionAmountDead
    : group.contributionAmount;

  // Build dynamic VietQR URL (preferred) or fall back to uploaded image
  const addInfo  = `Gop hui ky ${session.periodNumber}`;
  const dynamicQr = buildVietQrUrl({
    bankId:      bankSettings.bankId,
    accountNo:   bankSettings.accountNo,
    accountName: bankSettings.accountName,
    amount:      amountToPay,
    addInfo,
  });
  const qrSrc = dynamicQr ?? (bankSettings.qrImageDataUrl || null);

  const hasBankInfo = dynamicQr || bankSettings.qrImageDataUrl || bankSettings.accountNo;
  if (!hasBankInfo && !existingReq) return null;

  const doCopy = () => {
    navigator.clipboard.writeText(bankSettings.accountNo).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const doSubmit = () => {
    addPaymentRequest({
      memberId,
      groupId: group.id,
      periodNumber: session.periodNumber,
      amount: amountToPay,
      note,
      transferRef,
    });
    setOpen(false);
    setNote('');
    setTranRef('');
  };

  if (existingReq?.status === 'pending') {
    return (
      <div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 flex items-start gap-3">
        <Clock size={16} className="text-blue-500 shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-semibold text-blue-800">Đang chờ admin xác nhận</p>
          <p className="text-xs text-blue-600 mt-0.5">
            Bạn đã báo chuyển khoản {formatDate(existingReq.createdAt)}
            {existingReq.transferRef && ` · Ref: ${existingReq.transferRef}`}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-amber-200 bg-amber-50 overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 pt-4 pb-2">
        <QrCode size={15} className="text-amber-600" />
        <p className="text-sm font-semibold text-amber-800">Thanh toán</p>
        {dynamicQr && (
          <span className="ml-auto text-[10px] px-1.5 py-0.5 rounded bg-amber-200 text-amber-800 font-semibold">VietQR</span>
        )}
      </div>

      {/* Rejected notice */}
      {existingReq?.status === 'rejected' && (
        <div className="mx-4 mb-2 flex items-start gap-2 rounded-lg bg-red-50 border border-red-200 px-3 py-2">
          <XCircle size={14} className="text-red-500 shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-semibold text-red-700">Lệnh bị từ chối</p>
            {existingReq.reviewNote && <p className="text-xs text-red-600">{existingReq.reviewNote}</p>}
            <p className="text-xs text-red-500 mt-0.5">Bạn có thể gửi lại bên dưới.</p>
          </div>
        </div>
      )}

      {/* QR image — dynamic or static */}
      {qrSrc && !qrError && (
        <div className="px-4 pb-3 flex justify-center">
          <img
            src={qrSrc}
            alt="QR thanh toán"
            onError={() => setQrError(true)}
            className={`object-contain rounded-xl border border-amber-200 ${dynamicQr ? 'w-full max-w-[220px]' : 'w-32 h-32'}`}
          />
        </div>
      )}

      {/* Bank info text */}
      <div className="px-4 pb-3 space-y-1.5">
        {bankSettings.bankId && (
          <div className="flex items-center justify-between">
            <p className="text-[10px] text-amber-600 font-medium uppercase tracking-wide">Ngân hàng</p>
            <p className="text-sm font-semibold text-gray-900">{bankDisplayName(bankSettings.bankId)}</p>
          </div>
        )}
        {bankSettings.accountNo && (
          <div className="flex items-center justify-between">
            <p className="text-[10px] text-amber-600 font-medium uppercase tracking-wide">Số tài khoản</p>
            <div className="flex items-center gap-1.5">
              <p className="text-sm font-bold text-gray-900 tracking-wider">{bankSettings.accountNo}</p>
              <button type="button" onClick={doCopy} className="p-1 rounded hover:bg-amber-200 transition-colors">
                <Copy size={13} className={copied ? 'text-green-600' : 'text-amber-600'} />
              </button>
            </div>
          </div>
        )}
        {bankSettings.accountName && (
          <div className="flex items-center justify-between">
            <p className="text-[10px] text-amber-600 font-medium uppercase tracking-wide">Chủ tài khoản</p>
            <p className="text-sm text-gray-800">{bankSettings.accountName}</p>
          </div>
        )}
        <div className="flex items-center justify-between pt-1 border-t border-amber-200">
          <p className="text-xs text-amber-700">
            {isDeadMember && group.contributionAmountDead ? 'Góp (đã hốt)' : 'Số tiền'} · Kỳ {session.periodNumber}
          </p>
          <p className="text-sm font-bold text-amber-700">{formatVnd(amountToPay)}</p>
        </div>
        {dynamicQr && (
          <p className="text-[10px] text-amber-600">Nội dung CK đã điền sẵn trong QR</p>
        )}
      </div>

      {/* Submit / form */}
      {!open ? (
        <div className="px-4 pb-4">
          <button type="button" onClick={() => setOpen(true)}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-semibold text-sm transition-colors">
            <Send size={15} />
            {existingReq?.status === 'rejected' ? 'Gửi lại lệnh' : 'Báo đã chuyển khoản'}
          </button>
        </div>
      ) : (
        <div className="px-4 pb-4 pt-2 space-y-2 border-t border-amber-200">
          <p className="text-xs font-medium text-amber-700">Xác nhận đã chuyển khoản</p>
          <input
            className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400"
            placeholder="Mã giao dịch / nội dung CK (tuỳ chọn)"
            value={transferRef}
            onChange={(e) => setTranRef(e.target.value)}
          />
          <textarea
            rows={2}
            className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 resize-none"
            placeholder="Ghi chú thêm (tuỳ chọn)"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
          <div className="flex gap-2">
            <button type="button" onClick={() => setOpen(false)}
              className="flex-1 py-2 rounded-xl border border-gray-200 bg-white text-gray-600 text-sm font-medium hover:bg-gray-50">
              Hủy
            </button>
            <button type="button" onClick={doSubmit}
              className="flex-1 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold transition-colors">
              Gửi xác nhận
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main portal ───────────────────────────────────────────────────────────────
export default function MemberPortal({ memberId, onLogout }) {
  const members         = useHuiStore((s) => s.members);
  const groups          = useHuiStore((s) => s.groups);
  const memberships     = useHuiStore((s) => s.memberships);
  const sessions        = useHuiStore((s) => s.sessions);
  const transactions    = useHuiStore((s) => s.transactions);
  const memberById      = useHuiStore((s) => s.memberById);      // calls get() → always fresh
  const membersForGroup = useHuiStore((s) => s.membersForGroup); // calls get() → always fresh
  const bankSettings    = useHuiStore((s) => s.bankSettings);

  const member   = memberById(memberId);
  const [tab, setTab] = useState('groups');

  const myGroups = useMemo(() => {
    const gids = new Set(memberships.filter((x) => x.memberId === memberId).map((x) => x.groupId));
    return groups.filter((g) => gids.has(g.id));
  }, [memberId, groups, memberships]);

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

    const lastClosedSession = closedSessions[closedSessions.length - 1] ?? null;
    const myPaidLastClosed = lastClosedSession
      ? transactions.some(
          (t) => t.groupId === g.id && t.memberId === memberId
               && t.periodNumber === lastClosedSession.periodNumber
               && t.kind === 'contribution' && t.status === 'completed'
        )
      : true;

    const history = closedSessions.map((s) => ({
      period: s.periodNumber,
      winnerName: s.winnerId ? memberById(s.winnerId)?.name ?? '—' : '—',
      isMe: s.winnerId === memberId,
      net: s.winnerNetAmount,
    }));

    const wonIds    = new Set(closedSessions.map((s) => s.winnerId).filter(Boolean));
    const remaining = membersForGroup(g.id).filter((m) => !wonIds.has(m.id));
    const iAmEligible = remaining.some((m) => m.id === memberId);

    // memberIds dùng cho BidPanel và calcPeriodGross (luôn fresh vì membersForGroup gọi get())
    const memberIds = membersForGroup(g.id).map((m) => m.id);
    const openGross = openSession
      ? calcPeriodGross(g, sessions, memberIds, openSession.periodNumber)
      : null;

    return { group: g, openSession, lastClosedSession, myPaidLastClosed, iWonPeriod, myPaidThisPeriod, history, remaining, iAmEligible, openGross, memberIds };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [myGroups, sessions, transactions, memberId, members, memberships]);

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
    <div className="min-h-screen bg-gray-50">

      {/* Header + Summary + Tabs — sticky khi cuộn */}
      <div className="sticky top-0 z-10">

        {/* Header */}
        <header className="bg-slate-900 text-white px-4 py-3 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <LogoIcon size={36} className="shrink-0" />
            <div className="min-w-0">
              <p className="text-[10px] text-slate-400 uppercase tracking-wide">Xin chào</p>
              <p className="font-bold text-white text-sm truncate">{member.name}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${statusCls[member.status] ?? statusCls.active}`}>
              {statusLabel[member.status] ?? member.status}
            </span>
            <button
              type="button"
              onClick={onLogout}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs transition-colors"
            >
              <LogOut size={13} /> <span className="hidden sm:inline">Đăng xuất</span>
            </button>
          </div>
        </header>

        {/* Summary */}
        <div className="bg-slate-800 px-5 py-4 grid grid-cols-3 gap-2 text-white text-center">
          <div>
            <p className="text-[10px] text-slate-400 mb-0.5 uppercase tracking-wide">Dây tham gia</p>
            <p className="text-2xl font-bold text-amber-400">{myGroups.length}</p>
          </div>
          <div>
            <p className="text-[10px] text-slate-400 mb-0.5 uppercase tracking-wide">Đã góp</p>
            <p className="text-lg font-bold text-orange-400 leading-tight">{formatVndCompact(totalContrib)}</p>
          </div>
          <div>
            <p className="text-[10px] text-slate-400 mb-0.5 uppercase tracking-wide">Đã hốt</p>
            <p className="text-lg font-bold text-emerald-400 leading-tight">{formatVndCompact(totalReceived)}</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white border-b border-gray-200 flex px-2 overflow-x-auto">
          {tabs.map(({ key, label, badge }) => (
            <button
              key={key}
              type="button"
              onClick={() => setTab(key)}
              className={`relative shrink-0 whitespace-nowrap px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
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

      </div>{/* end sticky */}

      {/* Content */}
      <main className="p-4 sm:p-6 space-y-4 max-w-2xl w-full mx-auto" style={{ paddingBottom: 'max(1.5rem, env(safe-area-inset-bottom))' }}>

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
                      <p className="text-[10px] text-gray-400 uppercase tracking-wide">Mệnh giá</p>
                      <p className="font-bold text-amber-600 text-sm">{formatVndCompact(g.contributionAmount)}/kỳ</p>
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
                      <span className="text-xs font-semibold text-gray-600">{formatVndCompact(g.contributionAmount)}</span>
                    </div>
                  ) : (
                    <p className="text-xs text-gray-400 italic">Chưa có phiên kêu hụi đang mở.</p>
                  )}

                  {/* QR / Payment section — only when unpaid */}
                  {openSession && !myPaidThisPeriod && (
                    <PaymentSection group={g} session={openSession} memberId={memberId} iWonPeriod={iWonPeriod} />
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
                            <span className={`shrink-0 ${h.isMe ? 'font-semibold text-amber-700' : 'text-gray-500'}`}>Kỳ {h.period}</span>
                            <span className={`truncate mx-2 ${h.isMe ? 'font-bold text-amber-800' : 'text-gray-700'}`}>{h.winnerName}{h.isMe && ' (bạn)'}</span>
                            {h.net != null && (
                              <span className={`shrink-0 font-semibold ${h.isMe ? 'text-emerald-600' : 'text-gray-400'}`}>{formatVndCompact(h.net)}</span>
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
            {groupData.filter(({ openSession, lastClosedSession, myPaidLastClosed }) =>
              openSession || (lastClosedSession && !myPaidLastClosed && lastClosedSession.winnerId !== memberId)
            ).length === 0 && (
              <div className="text-center py-16 space-y-2">
                <Gavel size={32} className="text-gray-300 mx-auto" />
                <p className="text-sm text-gray-400">Chưa có phiên kêu hụi nào đang mở.</p>
              </div>
            )}

            {/* Closed sessions awaiting payment */}
            {groupData
              .filter(({ lastClosedSession, myPaidLastClosed }) =>
                lastClosedSession && !myPaidLastClosed && lastClosedSession.winnerId !== memberId
              )
              .map(({ group: g, lastClosedSession, iWonPeriod }) => {
                const prevWonIds = new Set(
                  sessions
                    .filter((s) => s.groupId === g.id && s.status === 'closed' && s.winnerId && s.periodNumber < lastClosedSession.periodNumber)
                    .map((s) => s.winnerId)
                );
                const contrib = g.contributionAmountDead > 0 && prevWonIds.has(memberId)
                  ? g.contributionAmountDead
                  : g.contributionAmount;
                const winnerName = lastClosedSession.winnerId ? memberById(lastClosedSession.winnerId)?.name ?? '—' : '—';
                const qrUrl = buildVietQrUrl({
                  bankId: bankSettings?.bankId,
                  accountNo: bankSettings?.accountNo,
                  accountName: bankSettings?.accountName,
                  amount: contrib,
                  addInfo: `Gop ky ${lastClosedSession.periodNumber} ${g.name}`,
                });
                return (
                  <div key={`closed-${g.id}`} className="bg-white rounded-xl border border-orange-200 shadow-sm overflow-hidden">
                    <div className="px-4 py-3 border-b border-orange-100 flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-gray-900 text-sm">{g.name}</p>
                        <p className="text-xs text-gray-400">
                          Kỳ {lastClosedSession.periodNumber} · {formatDate(lastClosedSession.date)} · {g.type === 'live' ? 'Hụi sống' : 'Hụi chết'}
                        </p>
                      </div>
                      <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-orange-100 text-orange-700">
                        Chờ đóng tiền
                      </span>
                    </div>
                    <div className="p-4 space-y-3">
                      {/* Winner info */}
                      <div className="flex items-center gap-2 text-sm text-blue-700 bg-blue-50 border border-blue-200 rounded-lg px-3 py-2">
                        <CheckCircle2 size={14} className="shrink-0 text-blue-500" />
                        <span>Kỳ này <strong>{winnerName}</strong> hốt hụi</span>
                      </div>

                      {/* Amount */}
                      <div className="flex items-center justify-between px-3 py-2.5 rounded-lg bg-orange-50 border border-orange-200">
                        <span className="text-sm text-orange-700 font-medium">Số tiền cần đóng</span>
                        <span className="text-lg font-black text-orange-700">{formatVnd(contrib)}</span>
                      </div>

                      {/* QR code */}
                      {qrUrl ? (
                        <div className="rounded-xl border border-amber-200 bg-amber-50 overflow-hidden">
                          <div className="flex items-center gap-2 px-4 pt-3 pb-2">
                            <QrCode size={14} className="text-amber-600" />
                            <p className="text-sm font-semibold text-amber-800">Quét QR để chuyển khoản</p>
                            <span className="ml-auto text-[10px] px-1.5 py-0.5 rounded bg-amber-200 text-amber-800 font-semibold">VietQR</span>
                          </div>
                          <div className="px-4 pb-3 flex gap-4 items-center">
                            <img
                              src={qrUrl}
                              alt="QR thanh toán"
                              className="w-32 h-32 rounded-lg border border-amber-200 shrink-0 object-contain"
                            />
                            <div className="min-w-0 space-y-1.5">
                              {bankSettings.bankId && (
                                <div>
                                  <p className="text-[10px] text-amber-600 font-medium uppercase tracking-wide">Ngân hàng</p>
                                  <p className="text-sm font-semibold text-gray-900">{bankDisplayName(bankSettings.bankId)}</p>
                                </div>
                              )}
                              {bankSettings.accountNo && (
                                <div>
                                  <p className="text-[10px] text-amber-600 font-medium uppercase tracking-wide">Số tài khoản</p>
                                  <p className="text-sm font-bold text-gray-900 tracking-wider">{bankSettings.accountNo}</p>
                                </div>
                              )}
                              {bankSettings.accountName && (
                                <div>
                                  <p className="text-[10px] text-amber-600 font-medium uppercase tracking-wide">Chủ tài khoản</p>
                                  <p className="text-sm text-gray-800">{bankSettings.accountName}</p>
                                </div>
                              )}
                              <p className="text-[10px] text-amber-600 pt-1">Nội dung CK đã điền sẵn trong QR</p>
                            </div>
                          </div>
                        </div>
                      ) : (
                        bankSettings?.accountNo && (
                          <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 space-y-1.5 text-sm">
                            {bankSettings.accountName && <p className="font-semibold text-gray-800">{bankSettings.accountName}</p>}
                            <p className="text-gray-600">STK: <span className="font-bold tracking-wider">{bankSettings.accountNo}</span></p>
                          </div>
                        )
                      )}
                    </div>
                  </div>
                );
              })}

            {groupData
              .filter(({ openSession }) => !!openSession)
              .map(({ group: g, openSession, iWonPeriod, iAmEligible, openGross, memberIds }) => (
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
                      <div className="rounded-lg bg-gray-50 border border-gray-100 py-2.5 px-1">
                        <p className="text-gray-400 mb-0.5 whitespace-nowrap">Tổng quỹ</p>
                        <p className="font-bold text-gray-900">{formatVndCompact(openGross ?? 0)}</p>
                      </div>
                      <div className="rounded-lg bg-gray-50 border border-gray-100 py-2.5 px-1">
                        <p className="text-gray-400 mb-0.5 whitespace-nowrap">Nhận được</p>
                        <p className="font-bold text-emerald-600">{formatVndCompact(calcSessionNet(g, 0, openGross).net)}</p>
                      </div>
                      <div className="rounded-lg bg-gray-50 border border-gray-100 py-2.5 px-1">
                        <p className="text-gray-400 mb-0.5 whitespace-nowrap">Đã kêu</p>
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
                      <BidPanel group={g} session={openSession} memberId={memberId} memberIds={memberIds} />
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
                  <div key={t.id} className={`bg-white rounded-xl border px-4 py-3 flex items-center justify-between gap-3 ${
                    t.status === 'pending' ? 'border-amber-200' : t.status === 'rejected' ? 'border-red-200' : 'border-gray-200'
                  }`}>
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                        isContrib ? 'bg-red-50' : 'bg-green-50'
                      }`}>
                        {isContrib
                          ? <TrendingDown size={15} className="text-red-500" />
                          : <TrendingUp size={15} className="text-green-600" />}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-800 truncate">
                          {t.notes || (isContrib ? `Góp kỳ ${t.periodNumber}` : `Hốt kỳ ${t.periodNumber}`)}
                        </p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <p className="text-xs text-gray-400">{formatDate(t.date)}</p>
                          {t.status === 'pending' && (
                            <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700">Chờ xác nhận</span>
                          )}
                          {t.status === 'rejected' && (
                            <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-red-100 text-red-600">Bị từ chối</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className={`text-sm font-bold ${
                        t.status === 'rejected' ? 'text-gray-400 line-through' : isContrib ? 'text-red-500' : 'text-emerald-600'
                      }`}>
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
