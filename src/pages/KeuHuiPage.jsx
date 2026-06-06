import React, { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Trash2, CheckCircle2, Users, AlertCircle, Zap, CalendarClock, Shuffle } from 'lucide-react';
import { useHuiStore } from '../store/useHuiStore.js';
import { Modal } from '../components/Modal.jsx';
import LuckyWheel from '../components/LuckyWheel.jsx';
import { formatDate, formatVnd, cycleLabel } from '../lib/format.js';
import { currentPeriodNumber, calcSessionNet, calcPeriodGross } from '../lib/period.js';

const createSchema = z.object({
  groupId: z.string().min(1, 'Chọn dây hụi'),
  periodNumber: z.coerce.number().min(1),
  date: z.string(),
  notes: z.string().optional(),
});

const statusBadge = {
  open: { label: 'Đang mở', cls: 'bg-amber-100 text-amber-700' },
  closed: { label: 'Đã chốt', cls: 'bg-green-100 text-green-700' },
};

export default function KeuHuiPage() {
  const groups = useHuiStore((s) => s.groups);
  const sessions = useHuiStore((s) => s.sessions);
  const addSession = useHuiStore((s) => s.addSession);
  const updateSession = useHuiStore((s) => s.updateSession);
  const deleteSession = useHuiStore((s) => s.deleteSession);
  const transactions = useHuiStore((s) => s.transactions);
  const addTransaction = useHuiStore((s) => s.addTransaction);
  const deleteTransaction = useHuiStore((s) => s.deleteTransaction);
  const membersForGroup = useHuiStore((s) => s.membersForGroup);
  const memberById = useHuiStore((s) => s.memberById);
  const groupById = useHuiStore((s) => s.groupById);

  const [filterGroup, setFilterGroup] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [detailId, setDetailId] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [confirmWinnerId, setConfirmWinnerId] = useState('');
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [wheelOpen, setWheelOpen] = useState(false);
  const [wheelMembers, setWheelMembers] = useState([]);

  // bid form state inside detail modal
  const [bidMemberId, setBidMemberId] = useState('');
  const [bidRate, setBidRate] = useState('0');
  const [bidRateError, setBidRateError] = useState('');

  // active schedule tab in detail modal
  const [detailTab, setDetailTab] = useState('session'); // 'session' | 'schedule'

  const createForm = useForm({
    resolver: zodResolver(createSchema),
    defaultValues: {
      groupId: '',
      periodNumber: 1,
      date: new Date().toISOString().slice(0, 10),
      notes: '',
    },
  });

  const watchGroup  = createForm.watch('groupId');
  const watchPeriod = createForm.watch('periodNumber');

  // Auto-fill period number when group changes
  const onGroupChange = (gid) => {
    const g = groups.find((x) => x.id === gid);
    if (g) {
      createForm.setValue('periodNumber', currentPeriodNumber(g.startDate, g.cycle));
    }
  };

  const onCreateSubmit = (vals) => {
    addSession({ groupId: vals.groupId, periodNumber: vals.periodNumber, date: vals.date, notes: vals.notes ?? '' });
    setCreateOpen(false);
    createForm.reset();
  };

  // ---------- Detail modal ----------
  const detailSession = useMemo(() => sessions.find((s) => s.id === detailId), [sessions, detailId]);
  const detailGroup = detailSession ? groupById(detailSession.groupId) : null;

  // Actual gross for the current session period (accounts for two-tier dead/live rates)
  const detailPeriodGross = useMemo(() => {
    if (!detailGroup || !detailSession) return 0;
    const mids = membersForGroup(detailGroup.id).map((m) => m.id);
    return calcPeriodGross(detailGroup, sessions, mids, detailSession.periodNumber);
  }, [detailGroup, detailSession, sessions, membersForGroup]);

  // Members who haven't won yet in this group (eligible to bid/win)
  const eligibleMembers = useMemo(() => {
    if (!detailGroup) return [];
    const wonIds = new Set(
      sessions
        .filter((s) => s.groupId === detailGroup.id && s.status === 'closed' && s.winnerId)
        .map((s) => s.winnerId)
    );
    return membersForGroup(detailGroup.id).filter((m) => !wonIds.has(m.id));
  }, [detailGroup, sessions, membersForGroup]);

  // Members not yet in the bids list
  const unbidMembers = useMemo(() => {
    if (!detailSession) return [];
    const bidSet = new Set(detailSession.bids.map((b) => b.memberId));
    return eligibleMembers.filter((m) => !bidSet.has(m.id));
  }, [eligibleMembers, detailSession]);

  const addBid = () => {
    if (!detailSession || !bidMemberId) return;
    setBidRateError('');
    if (detailGroup?.type === 'live') {
      const rate = Number(bidRate);
      if (isNaN(rate) || rate < 0 || rate > 50) {
        setBidRateError('Lãi kêu phải từ 0% đến 50%');
        return;
      }
    }
    const newBids = [...detailSession.bids, { memberId: bidMemberId, bidRate: Number(bidRate) || 0 }];
    updateSession(detailSession.id, { bids: newBids });
    setBidMemberId('');
    setBidRate('0');
    setBidRateError('');
  };

  const removeBid = (memberId) => {
    const newBids = detailSession.bids.filter((b) => b.memberId !== memberId);
    updateSession(detailSession.id, { bids: newBids });
  };

  // Sorted bids: highest bidRate first
  const sortedBids = useMemo(() => {
    if (!detailSession) return [];
    return [...detailSession.bids].sort((a, b) => b.bidRate - a.bidRate);
  }, [detailSession]);

  // Live hui: bidders tied at the top rate
  const tiedBidders = useMemo(() => {
    if (!detailSession || detailGroup?.type !== 'live' || sortedBids.length < 2) return [];
    const topRate = sortedBids[0].bidRate;
    return sortedBids.filter((b) => b.bidRate === topRate);
  }, [detailSession, detailGroup, sortedBids]);

  // Schedule: remaining periods → suggested members (by name order)
  const scheduleRows = useMemo(() => {
    if (!detailGroup || !detailSession) return [];
    const closedPeriods = new Set(
      sessions
        .filter((s) => s.groupId === detailGroup.id && s.status === 'closed')
        .map((s) => s.periodNumber)
    );
    const remaining = [];
    for (let i = 1; i <= detailGroup.expectedMemberCount; i++) {
      if (!closedPeriods.has(i)) remaining.push(i);
    }
    const sorted = [...eligibleMembers].sort((a, b) => a.name.localeCompare(b.name));
    return remaining.map((period, idx) => ({
      period,
      member: sorted[idx] ?? null,
      isCurrent: period === detailSession.periodNumber,
    }));
  }, [detailGroup, detailSession, sessions, eligibleMembers]);

  const openConfirm = () => {
    if (!detailSession) return;
    // default winner = highest bidder (or first eligible if no bids yet for dead hui)
    const topBid = sortedBids[0];
    setConfirmWinnerId(topBid?.memberId ?? eligibleMembers[0]?.id ?? '');
    setConfirmOpen(true);
  };

  const openWheel = (mems) => {
    setWheelMembers(mems);
    setWheelOpen(true);
  };

  const closeSession = () => {
    if (!detailSession || !detailGroup || !confirmWinnerId) return;
    const winnerBid = detailSession.bids.find((b) => b.memberId === confirmWinnerId);
    const winnerBidRate = detailGroup.type === 'dead' ? 0 : (winnerBid?.bidRate ?? 0);
    const { gross, commission, interest, net } = calcSessionNet(detailGroup, winnerBidRate, detailPeriodGross);

    const txId = addTransaction({
      groupId: detailGroup.id,
      memberId: confirmWinnerId,
      kind: 'withdrawal',
      amount: net,
      periodNumber: detailSession.periodNumber,
      date: detailSession.date,
      notes: `Hốt hụi kỳ ${detailSession.periodNumber}${
        detailGroup.type === 'live' ? ` — lãi kêu ${winnerBidRate}%` : ''
      }`,
      status: 'completed',
      meta: { gross, commission, interest, bidRate: winnerBidRate },
    });

    updateSession(detailSession.id, {
      winnerId: confirmWinnerId,
      winnerBidRate,
      winnerNetAmount: net,
      transactionId: txId,
      status: 'closed',
    });
    setConfirmOpen(false);
    setDetailId(null);
  };

  // ---------- List ----------
  const filtered = useMemo(() => {
    const list = filterGroup ? sessions.filter((s) => s.groupId === filterGroup) : sessions;
    return [...list].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }, [sessions, filterGroup]);

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-1">Kêu hụi</h2>
          <p className="text-sm text-gray-500">
            Quản lý phiên đấu thầu, chọn người hốt &amp; tự động tạo giao dịch
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            createForm.reset({
              groupId: groups[0]?.id ?? '',
              periodNumber: groups[0]
                ? currentPeriodNumber(groups[0].startDate, groups[0].cycle)
                : 1,
              date: new Date().toISOString().slice(0, 10),
            });
            setCreateOpen(true);
          }}
          disabled={groups.length === 0}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-gradient-to-r from-amber-400 to-orange-500 text-slate-900 font-semibold hover:shadow-lg hover:shadow-amber-500/25 transition-all disabled:opacity-40 disabled:pointer-events-none"
        >
          <Plus size={20} />
          Kêu hụi mới
        </button>
      </div>

      {/* Filter */}
      <div className="flex flex-wrap gap-2 items-center">
        <select
          value={filterGroup}
          onChange={(e) => setFilterGroup(e.target.value)}
          className="rounded-lg bg-white border border-gray-300 px-3 py-2 text-gray-900 text-sm min-w-[180px]"
        >
          <option value="">Tất cả dây</option>
          {groups.map((g) => (
            <option key={g.id} value={g.id}>
              {g.name}
            </option>
          ))}
        </select>
      </div>

      {/* Session list */}
      <div className="rounded-xl bg-white border border-gray-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px]">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Dây hụi</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Kỳ</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Ngày</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Trạng thái</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Người hốt</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Tiền nhận</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600"> </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map((sess) => {
                const g = groupById(sess.groupId);
                const winner = sess.winnerId ? memberById(sess.winnerId) : null;
                const badge = statusBadge[sess.status] ?? statusBadge.open;
                return (
                  <tr key={sess.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <p className="text-sm font-medium text-gray-900">{g?.name ?? '—'}</p>
                      <p className="text-xs text-gray-400">
                        {g ? (g.type === 'live' ? 'Hụi sống' : 'Hụi chết') : ''}
                      </p>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700 font-medium">Kỳ {sess.periodNumber}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">{formatDate(sess.date)}</td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${badge.cls}`}>
                        {badge.label}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-800">{winner?.name ?? '—'}</td>
                    <td className="px-6 py-4 text-sm font-semibold text-amber-600">
                      {sess.winnerNetAmount != null ? formatVnd(sess.winnerNetAmount) : '—'}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setBidMemberId('');
                            setBidRate('0');
                            setDetailId(sess.id);
                          }}
                          className="px-3 py-1.5 text-xs rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium"
                        >
                          {sess.status === 'open' ? 'Quản lý' : 'Xem'}
                        </button>
                        {sess.status === 'open' && (
                          <button
                            type="button"
                            onClick={() => setDeleteId(sess.id)}
                            className="p-1.5 rounded-lg hover:bg-red-50 text-red-400"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <p className="p-8 text-center text-sm text-gray-400">
            Chưa có phiên kêu hụi nào. Nhấn &quot;Kêu hụi mới&quot; để bắt đầu.
          </p>
        )}
      </div>

      {/* ===== Create Modal ===== */}
      <Modal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Tạo phiên kêu hụi"
        footer={
          <>
            <button
              type="button"
              onClick={() => setCreateOpen(false)}
              className="px-4 py-2 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 text-sm"
            >
              Hủy
            </button>
            <button
              type="button"
              onClick={createForm.handleSubmit(onCreateSubmit)}
              className="px-5 py-2 rounded-lg bg-gradient-to-r from-amber-400 to-orange-500 text-slate-900 font-semibold text-sm"
            >
              Tạo phiên
            </button>
          </>
        }
      >
        <form className="space-y-4" onSubmit={createForm.handleSubmit(onCreateSubmit)}>
          <label className="block space-y-1">
            <span className="text-xs text-gray-600">Dây hụi</span>
            <select
              className="w-full rounded-lg bg-white border border-gray-300 px-3 py-2 text-gray-900 text-sm"
              {...createForm.register('groupId', {
                onChange: (e) => onGroupChange(e.target.value),
              })}
            >
              <option value="">— Chọn dây hụi —</option>
              {groups.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name} ({g.type === 'live' ? 'Hụi sống' : 'Hụi chết'} · {cycleLabel(g.cycle)})
                </option>
              ))}
            </select>
            {createForm.formState.errors.groupId && (
              <span className="text-xs text-red-500">{createForm.formState.errors.groupId.message}</span>
            )}
          </label>

          <div className="grid grid-cols-2 gap-4">
            <label className="block space-y-1">
              <span className="text-xs text-gray-600">Kỳ số</span>
              <input
                type="number"
                min={1}
                className="w-full rounded-lg bg-white border border-gray-300 px-3 py-2 text-gray-900 text-sm"
                {...createForm.register('periodNumber')}
              />
            </label>
            <label className="block space-y-1">
              <span className="text-xs text-gray-600">Ngày tổ chức</span>
              <input
                type="date"
                className="w-full rounded-lg bg-white border border-gray-300 px-3 py-2 text-gray-900 text-sm"
                {...createForm.register('date')}
              />
            </label>
          </div>

          <label className="block space-y-1">
            <span className="text-xs text-gray-600">Ghi chú (tùy chọn)</span>
            <textarea
              rows={2}
              placeholder="Ghi chú cho phiên này..."
              className="w-full rounded-lg bg-white border border-gray-300 px-3 py-2 text-gray-900 text-sm resize-none"
              {...createForm.register('notes')}
            />
          </label>

          {watchGroup && (() => {
            const g = groups.find((x) => x.id === watchGroup);
            if (!g) return null;
            const memberIds = membersForGroup(g.id).map((m) => m.id);
            const gross = calcPeriodGross(g, sessions, memberIds, Number(watchPeriod));
            const { commission, net } = calcSessionNet(g, 0, gross);
            const hasTwoTier = g.contributionAmountDead > 0;
            return (
              <div className="rounded-lg bg-amber-50 border border-amber-200 p-3 text-xs text-gray-600 space-y-1">
                <p className="font-medium text-amber-700">Thông tin dây ({g.expectedMemberCount} người)</p>
                {hasTwoTier && (
                  <div className="flex justify-between text-amber-700">
                    <span>Góp chưa hốt / đã hốt</span>
                    <span className="font-medium">{formatVnd(g.contributionAmount)} / {formatVnd(g.contributionAmountDead)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Tổng tiền góp kỳ {watchPeriod}</span>
                  <span className="font-medium">{formatVnd(gross)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Hoa hồng / kỳ</span>
                  <span>{formatVnd(commission)}</span>
                </div>
                {g.type === 'dead' && (
                  <div className="flex justify-between text-gray-900 font-semibold border-t border-amber-200 pt-1">
                    <span>Ước tính kỳ {watchPeriod}</span>
                    <span>{formatVnd(net)}</span>
                  </div>
                )}
                {g.type === 'live' && (
                  <p className="text-amber-600">Hụi sống — tiền hốt thực tế phụ thuộc vào lãi kêu.</p>
                )}
              </div>
            );
          })()}
        </form>
      </Modal>

      {/* ===== Session Detail Modal ===== */}
      <Modal
        open={!!detailId && !!detailSession}
        onClose={() => setDetailId(null)}
        title={
          detailGroup
            ? `${detailGroup.name} — Kỳ ${detailSession?.periodNumber}`
            : ''
        }
        wide
        footer={
          <div className="flex justify-between w-full items-center gap-2">
            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
              detailSession?.status === 'closed'
                ? 'bg-green-100 text-green-700'
                : 'bg-amber-100 text-amber-700'
            }`}>
              {detailSession?.status === 'closed' ? '✓ Đã chốt' : '⏳ Đang mở'}
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setDetailId(null)}
                className="px-4 py-2 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 text-sm"
              >
                Đóng
              </button>
              {detailSession?.status === 'open' && (
                <button
                  type="button"
                  onClick={openConfirm}
                  disabled={detailSession.bids.length === 0 && detailGroup?.type === 'live'}
                  className="px-5 py-2 rounded-lg bg-gradient-to-r from-amber-400 to-orange-500 text-slate-900 font-semibold text-sm disabled:opacity-40"
                >
                  Chốt phiên
                </button>
              )}
            </div>
          </div>
        }
      >
        {detailGroup && detailSession ? (
          <div className="space-y-5">
            {/* Tabs */}
            <div className="flex gap-1 border-b border-gray-200">
              {['session', 'schedule'].map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setDetailTab(tab)}
                  className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                    detailTab === tab
                      ? 'border-amber-400 text-amber-700'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {tab === 'session' ? 'Phiên kêu hụi' : (
                    <span className="flex items-center gap-1"><CalendarClock size={14} /> Lịch dự kiến</span>
                  )}
                </button>
              ))}
            </div>

            {/* Schedule tab */}
            {detailTab === 'schedule' && (
              <div className="space-y-3">
                <p className="text-xs text-gray-500">
                  Thứ tự dự kiến dựa trên thành viên chưa hốt — sắp xếp theo tên. Chỉ mang tính tham khảo.
                </p>
                <div className="space-y-1.5">
                  {scheduleRows.map(({ period, member, isCurrent }) => (
                    <div
                      key={period}
                      className={`flex items-center justify-between px-4 py-2.5 rounded-lg border text-sm ${
                        isCurrent
                          ? 'bg-amber-50 border-amber-300 font-semibold'
                          : 'bg-gray-50 border-gray-200'
                      }`}
                    >
                      <span className={isCurrent ? 'text-amber-700' : 'text-gray-500'}>
                        Kỳ {period} {isCurrent && '← kỳ này'}
                      </span>
                      <span className={member ? (isCurrent ? 'text-amber-800' : 'text-gray-800') : 'text-gray-400'}>
                        {member?.name ?? '(chưa xác định)'}
                      </span>
                    </div>
                  ))}
                  {scheduleRows.length === 0 && (
                    <p className="text-sm text-gray-400 py-4 text-center">Tất cả kỳ đã được chốt.</p>
                  )}
                </div>
              </div>
            )}

            {/* Session tab content */}
            {detailTab === 'session' && <>

            {/* Info bar */}
            <div className="flex flex-wrap gap-4 text-sm">
              <div className="flex items-center gap-2 text-gray-600">
                <Users size={15} />
                <span>{detailGroup.expectedMemberCount} người · {cycleLabel(detailGroup.cycle)}</span>
              </div>
              <div className="text-gray-500">{formatDate(detailSession.date)}</div>
              <span className={`px-2 py-0.5 rounded text-xs font-semibold ${
                detailGroup.type === 'live' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'
              }`}>
                {detailGroup.type === 'live' ? 'Hụi sống (đấu thầu lãi)' : 'Hụi chết'}
              </span>
            </div>
            {detailSession.notes && (
              <p className="text-xs text-gray-500 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">
                📝 {detailSession.notes}
              </p>
            )}

            {/* Tính tổng tiền góp */}
            {(() => {
              const topRate = sortedBids[0]?.bidRate ?? 0;
              const memberIds = membersForGroup(detailGroup.id).map((m) => m.id);
              const gross = calcPeriodGross(detailGroup, sessions, memberIds, detailSession.periodNumber);
              const { commission, interest, net } = calcSessionNet(detailGroup, topRate, gross);
              const hasTwoTier = detailGroup.contributionAmountDead > 0;
              return (
                <div className="rounded-lg bg-gray-50 border border-gray-200 p-4 space-y-2 text-xs">
                  {hasTwoTier && (
                    <div className="flex justify-between text-amber-700 font-medium pb-1.5 border-b border-gray-200">
                      <span>Góp chưa hốt / đã hốt</span>
                      <span>{formatVnd(detailGroup.contributionAmount)} / {formatVnd(detailGroup.contributionAmountDead)}</span>
                    </div>
                  )}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div>
                      <p className="text-gray-500 mb-0.5">Tổng tiền góp</p>
                      <p className="font-semibold text-gray-900">{formatVnd(gross)}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 mb-0.5">Hoa hồng</p>
                      <p className="font-semibold text-red-500">−{formatVnd(commission)}</p>
                    </div>
                    {detailGroup.type === 'live' && (
                      <div>
                        <p className="text-gray-500 mb-0.5">
                          Lãi kêu{sortedBids[0] ? ` (${topRate}%)` : ''}
                        </p>
                        <p className="font-semibold text-orange-500">−{formatVnd(interest)}</p>
                      </div>
                    )}
                    <div>
                      <p className="text-gray-500 mb-0.5">
                        {detailGroup.type === 'live'
                          ? 'Tiền nhận (bid cao nhất)'
                          : 'Tiền nhận kỳ này'}
                      </p>
                      <p className="font-bold text-emerald-600">{formatVnd(net)}</p>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* All-periods withdrawal estimate */}
            {(() => {
              const memberIds = membersForGroup(detailGroup.id).map((m) => m.id);
              const N = detailGroup.expectedMemberCount;
              const closedMap = sessions
                .filter((s) => s.groupId === detailGroup.id && s.status === 'closed')
                .reduce((acc, s) => { acc[s.periodNumber] = s; return acc; }, {});

              const rows = Array.from({ length: N }, (_, i) => {
                const period = i + 1;
                const gross = calcPeriodGross(detailGroup, sessions, memberIds, period);
                const { commission, net } = calcSessionNet(detailGroup, 0, gross);
                const closed = closedMap[period];
                const isCurrent = period === detailSession.periodNumber;
                return { period, gross, commission, net, closed, isCurrent };
              });

              return (
                <div className="rounded-lg border border-gray-200 overflow-hidden">
                  <div className="bg-gray-50 px-4 py-2.5 border-b border-gray-200 flex items-center justify-between">
                    <p className="text-sm font-semibold text-gray-800">Ước tính tiền hốt theo từng kỳ</p>
                    <span className="text-xs text-gray-400">Theo tình trạng dây hụi</span>
                  </div>
                  <div className="overflow-y-auto max-h-60">
                    <table className="w-full text-xs">
                      <thead className="sticky top-0 bg-gray-50 border-b border-gray-100">
                        <tr className="text-gray-500">
                          <th className="text-left px-4 py-2 font-medium">Kỳ</th>
                          <th className="text-right px-4 py-2 font-medium">Quỹ kỳ</th>
                          <th className="text-right px-4 py-2 font-medium">Hoa hồng</th>
                          <th className="text-right px-4 py-2 font-medium">Tiền nhận</th>
                        </tr>
                      </thead>
                      <tbody>
                        {rows.map(({ period, gross, commission, net, closed, isCurrent }) => (
                          <tr
                            key={period}
                            className={`border-t border-gray-100 ${
                              isCurrent ? 'bg-amber-50' : closed ? 'bg-green-50/60' : ''
                            }`}
                          >
                            <td className={`px-4 py-2 font-medium ${
                              isCurrent ? 'text-amber-700' : closed ? 'text-green-700' : 'text-gray-700'
                            }`}>
                              Kỳ {period}
                              {isCurrent && <span className="ml-1.5 text-[10px] text-amber-500 font-normal">← đang xem</span>}
                              {closed && !isCurrent && <span className="ml-1 text-green-500">✓</span>}
                            </td>
                            <td className="px-4 py-2 text-right text-gray-500">{formatVnd(gross)}</td>
                            <td className="px-4 py-2 text-right text-red-400">−{formatVnd(commission)}</td>
                            <td className={`px-4 py-2 text-right font-semibold ${
                              closed ? 'text-green-700' : 'text-emerald-600'
                            }`}>
                              {closed
                                ? formatVnd(closed.winnerNetAmount ?? net)
                                : detailGroup.type === 'dead'
                                ? formatVnd(net)
                                : `~${formatVnd(net)}`}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {detailGroup.type === 'live' && (
                    <p className="text-[10px] text-gray-400 px-4 py-2 border-t border-gray-100 bg-gray-50">
                      * Hụi sống: tiền nhận ước tính chưa bao gồm lãi kêu thực tế
                    </p>
                  )}
                </div>
              );
            })()}

            {/* Contribution payment status */}
            {(() => {
              const groupMembers = membersForGroup(detailGroup.id);
              if (groupMembers.length === 0) return null;
              const paidTxs = transactions.filter(
                (t) =>
                  t.groupId === detailGroup.id &&
                  t.periodNumber === detailSession.periodNumber &&
                  t.kind === 'contribution' &&
                  t.status === 'completed'
              );
              const paidSet = new Set(paidTxs.map((t) => t.memberId));
              const paidCount = paidSet.size;
              const needToPay = groupMembers.filter((m) => m.id !== detailSession.winnerId).length;
              return (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-semibold text-gray-800">
                      Góp quỹ kỳ {detailSession.periodNumber}
                    </p>
                    <span className="text-xs text-gray-500">
                      {paidCount}/{needToPay} đã nộp
                    </span>
                  </div>
                  <div className="space-y-1.5">
                    {groupMembers.map((m) => {
                      const paid = paidSet.has(m.id);
                      const tx = paidTxs.find((t) => t.memberId === m.id);
                      const isWinner = m.id === detailSession.winnerId;
                      return (
                        <div
                          key={m.id}
                          className={`flex items-center justify-between px-3 py-2 rounded-lg border text-sm ${
                            paid
                              ? 'bg-green-50 border-green-200'
                              : isWinner
                              ? 'bg-blue-50 border-blue-200'
                              : 'bg-gray-50 border-gray-200'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            {paid ? (
                              <CheckCircle2 size={15} className="text-green-600 shrink-0" />
                            ) : isWinner ? (
                              <CheckCircle2 size={15} className="text-blue-500 shrink-0" />
                            ) : (
                              <div className="w-3.5 h-3.5 rounded-full border-2 border-gray-300 shrink-0" />
                            )}
                            <span className={paid ? 'text-gray-800' : isWinner ? 'text-blue-700 font-medium' : 'text-gray-500'}>
                              {m.name}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            {paid ? (
                              <>
                                <span className="text-xs text-green-700 font-medium">
                                  {formatVnd(detailGroup.contributionAmount)}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => tx && deleteTransaction(tx.id)}
                                  className="text-xs text-gray-400 hover:text-red-500 px-2 py-0.5 rounded hover:bg-red-50"
                                >
                                  Hoàn
                                </button>
                              </>
                            ) : isWinner ? (
                              <span className="text-xs text-blue-600 font-medium">Người hốt — miễn góp</span>
                            ) : (
                              <button
                                type="button"
                                onClick={() =>
                                  addTransaction({
                                    groupId: detailGroup.id,
                                    memberId: m.id,
                                    kind: 'contribution',
                                    amount: detailGroup.contributionAmount,
                                    periodNumber: detailSession.periodNumber,
                                    date: detailSession.date,
                                    status: 'completed',
                                    notes: `Góp kỳ ${detailSession.periodNumber}`,
                                  })
                                }
                                className="text-xs px-3 py-1 rounded-lg bg-amber-400 hover:bg-amber-500 text-slate-900 font-medium"
                              >
                                Đánh dấu đã nộp
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })()}

            {/* Closed: winner info */}
            {detailSession.status === 'closed' && detailSession.winnerId && (
              <div className="rounded-lg bg-green-50 border border-green-200 p-4 flex items-start gap-3">
                <CheckCircle2 size={20} className="text-green-600 shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="font-semibold text-green-800">
                    Người hốt: {memberById(detailSession.winnerId)?.name ?? '—'}
                  </p>
                  {detailGroup.type === 'live' && (
                    <p className="text-green-700">Lãi kêu: {detailSession.winnerBidRate}%</p>
                  )}
                  <p className="text-green-700">
                    Tiền nhận: <strong>{formatVnd(detailSession.winnerNetAmount ?? 0)}</strong>
                  </p>
                </div>
              </div>
            )}

            {/* Interest distribution — live hui, after close */}
            {detailSession.status === 'closed' && detailGroup.type === 'live' && (() => {
              const rate = detailSession.winnerBidRate ?? 0;
              if (rate === 0) return null;
              const { interest } = calcSessionNet(detailGroup, rate, detailPeriodGross);
              if (interest === 0) return null;
              const groupMembers = membersForGroup(detailGroup.id);
              const nonWinners = groupMembers.filter((m) => m.id !== detailSession.winnerId);
              if (nonWinners.length === 0) return null;
              const bonus = Math.round(interest / nonWinners.length);
              return (
                <div className="rounded-lg bg-blue-50 border border-blue-200 p-4 text-sm space-y-2">
                  <p className="font-semibold text-blue-800">
                    Phân chia lãi kêu ({rate}%) — {formatVnd(interest)} tổng
                  </p>
                  <p className="text-xs text-blue-600">
                    Chia đều cho {nonWinners.length} thành viên chưa hốt: mỗi người được giảm{' '}
                    <strong>{formatVnd(bonus)}</strong> kỳ này.
                  </p>
                  <div className="grid grid-cols-2 gap-1 pt-1">
                    {nonWinners.map((m) => (
                      <div key={m.id} className="flex justify-between text-xs bg-white rounded px-2 py-1 border border-blue-100">
                        <span className="text-blue-700 truncate">{m.name}</span>
                        <span className="font-semibold text-blue-900 shrink-0 ml-2">+{formatVnd(bonus)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}

            {/* Bids table */}
            <div>
              <p className="text-sm font-semibold text-gray-800 mb-2">
                {detailGroup.type === 'live' ? 'Danh sách lượt kêu' : 'Danh sách đăng ký hốt'}
                {detailSession.status === 'open' && ` (${detailSession.bids.length} lượt)`}
              </p>

              {sortedBids.length === 0 ? (
                <p className="text-sm text-gray-400 py-2">
                  Chưa có lượt kêu nào.
                  {detailGroup.type === 'dead' ? ' Chọn người hốt bên dưới và nhấn "Chốt phiên".' : ''}
                </p>
              ) : (
                <div className="space-y-2">
                  {sortedBids.map((bid, idx) => {
                    const m = memberById(bid.memberId);
                    const { net } = calcSessionNet(detailGroup, bid.bidRate, detailPeriodGross);
                    const isWinner = detailSession.status === 'closed' && detailSession.winnerId === bid.memberId;
                    return (
                      <div
                        key={bid.memberId}
                        className={`flex items-center justify-between p-3 rounded-lg border ${
                          isWinner
                            ? 'bg-green-50 border-green-200'
                            : idx === 0 && detailSession.status === 'open'
                            ? 'bg-amber-50 border-amber-200'
                            : 'bg-gray-50 border-gray-200'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <span className="w-6 h-6 rounded-full bg-gray-200 text-gray-600 text-xs font-bold flex items-center justify-center shrink-0">
                            {idx + 1}
                          </span>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {m?.name ?? '—'}
                              {isWinner && <span className="ml-2 text-green-600 text-xs">✓ Hốt</span>}
                              {idx === 0 && detailSession.status === 'open' && !isWinner && (
                                <span className="ml-2 text-amber-600 text-xs">↑ Cao nhất</span>
                              )}
                            </p>
                            {detailGroup.type === 'live' && (
                              <p className="text-xs text-gray-500">Lãi kêu: {bid.bidRate}%</p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          <span className="text-sm font-semibold text-emerald-600">{formatVnd(net)}</span>
                          {detailSession.status === 'open' && (
                            <button
                              type="button"
                              onClick={() => removeBid(bid.memberId)}
                              className="p-1 rounded hover:bg-red-100 text-red-400"
                            >
                              <Trash2 size={13} />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Add bid form — only when open */}
            {detailSession.status === 'open' && (
              <div className="rounded-lg border border-dashed border-gray-300 p-4 space-y-3 bg-gray-50">
                <p className="text-xs font-medium text-gray-600 uppercase tracking-wide">
                  {detailGroup.type === 'live' ? 'Thêm lượt kêu' : 'Thêm người đăng ký'}
                </p>
                <div className="flex flex-wrap gap-2 items-end">
                  <div className="flex-1 min-w-[160px] space-y-1">
                    <span className="text-xs text-gray-500">Thành viên</span>
                    <select
                      value={bidMemberId}
                      onChange={(e) => setBidMemberId(e.target.value)}
                      className="w-full rounded-lg bg-white border border-gray-300 px-3 py-2 text-gray-900 text-sm"
                    >
                      <option value="">— Chọn thành viên —</option>
                      {unbidMembers.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  {detailGroup.type === 'live' && (
                    <div className="w-32 space-y-1">
                      <span className="text-xs text-gray-500">Lãi kêu (%/kỳ)</span>
                      <input
                        type="number"
                        min={0}
                        max={50}
                        step={0.1}
                        value={bidRate}
                        onChange={(e) => { setBidRate(e.target.value); setBidRateError(''); }}
                        className={`w-full rounded-lg bg-white border px-3 py-2 text-gray-900 text-sm ${
                          bidRateError ? 'border-red-400' : 'border-gray-300'
                        }`}
                      />
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={addBid}
                    disabled={!bidMemberId}
                    className="px-4 py-2 rounded-lg bg-amber-400 hover:bg-amber-500 text-slate-900 font-semibold text-sm disabled:opacity-40"
                  >
                    + Thêm
                  </button>
                </div>
                {bidRateError && (
                  <p className="text-xs text-red-500 flex items-center gap-1">
                    <AlertCircle size={12} /> {bidRateError}
                  </p>
                )}
                {unbidMembers.length === 0 && eligibleMembers.length > 0 && (
                  <p className="text-xs text-gray-400">Tất cả thành viên đủ điều kiện đã được thêm.</p>
                )}
                {eligibleMembers.length === 0 && (
                  <p className="text-xs text-amber-600 flex items-center gap-1">
                    <AlertCircle size={13} />
                    Tất cả thành viên đã hốt hụi trong dây này.
                  </p>
                )}
              </div>
            )}

            {/* Dead hui: Chốt ngay per-member buttons + lucky wheel */}
            {detailGroup.type === 'dead' && detailSession.status === 'open' && eligibleMembers.length > 0 && (
              <div className="rounded-lg bg-blue-50 border border-blue-200 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-medium text-blue-700 flex items-center gap-1">
                    <Zap size={13} /> Hụi chết — Chốt ngay người hốt kỳ này:
                  </p>
                  {eligibleMembers.length >= 2 && (
                    <button
                      type="button"
                      onClick={() => openWheel(eligibleMembers)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-400 hover:bg-amber-500 text-slate-900 text-xs font-semibold transition-colors"
                    >
                      <Shuffle size={13} /> Vòng quay may mắn
                    </button>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  {eligibleMembers.map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => { setConfirmWinnerId(m.id); setConfirmOpen(true); }}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-blue-200 text-sm text-gray-800 hover:bg-amber-50 hover:border-amber-300 transition-colors"
                    >
                      <Zap size={13} className="text-amber-500" />
                      {m.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Live hui: tied-bid wheel */}
            {detailGroup.type === 'live' && detailSession.status === 'open' && tiedBidders.length >= 2 && (
              <div className="rounded-lg bg-orange-50 border border-orange-200 p-4 space-y-2">
                <p className="text-xs font-medium text-orange-700">
                  {tiedBidders.length} thành viên cùng kêu lãi <strong>{sortedBids[0].bidRate}%</strong> — cần bốc thăm.
                </p>
                <button
                  type="button"
                  onClick={() => openWheel(tiedBidders.map((b) => memberById(b.memberId)).filter(Boolean))}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-orange-400 hover:bg-orange-500 text-white font-semibold text-sm transition-colors"
                >
                  <Shuffle size={15} /> Vòng quay may mắn
                </button>
              </div>
            )}

            </> /* end session tab */}
          </div>
        ) : null}
      </Modal>

      {/* ===== Confirm winner modal ===== */}
      <Modal
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        title="Xác nhận chốt phiên"
        footer={
          <>
            <button
              type="button"
              onClick={() => setConfirmOpen(false)}
              className="px-4 py-2 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 text-sm"
            >
              Hủy
            </button>
            <button
              type="button"
              onClick={closeSession}
              disabled={!confirmWinnerId}
              className="px-5 py-2 rounded-lg bg-gradient-to-r from-amber-400 to-orange-500 text-slate-900 font-semibold text-sm disabled:opacity-40"
            >
              Xác nhận &amp; tạo giao dịch
            </button>
          </>
        }
      >
        {detailGroup && detailSession && (
          <div className="space-y-4 text-sm">
            {/* Contribution warning */}
            {(() => {
              const groupMembers = membersForGroup(detailGroup.id);
              const paidCount = transactions.filter(
                (t) => t.groupId === detailGroup.id && t.periodNumber === detailSession.periodNumber
                  && t.kind === 'contribution' && t.status === 'completed'
              ).length;
              // winner doesn't pay, so exclude them from the required count
              const required = groupMembers.filter((m) => m.id !== confirmWinnerId).length;
              const unpaid = required - paidCount;
              if (unpaid <= 0) return null;
              return (
                <div className="flex items-start gap-2 rounded-lg bg-amber-50 border border-amber-300 px-3 py-2 text-xs text-amber-800">
                  <AlertCircle size={14} className="shrink-0 mt-0.5" />
                  <span>Còn <strong>{unpaid}</strong> thành viên chưa nộp quỹ kỳ {detailSession.periodNumber}. Hãy kiểm tra trước khi chốt.</span>
                </div>
              );
            })()}

            {/* Tie wheel shortcut */}
            {tiedBidders.length >= 2 && (
              <div className="flex items-center justify-between rounded-lg bg-orange-50 border border-orange-200 px-3 py-2">
                <span className="text-xs text-orange-700">
                  {tiedBidders.length} người cùng lãi {sortedBids[0]?.bidRate}% — bốc thăm?
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setConfirmOpen(false);
                    openWheel(tiedBidders.map((b) => memberById(b.memberId)).filter(Boolean));
                  }}
                  className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-orange-400 text-white text-xs font-semibold"
                >
                  <Shuffle size={12} /> Quay
                </button>
              </div>
            )}

            <p className="text-gray-600">
              Chốt phiên sẽ tự động tạo giao dịch hốt và đánh dấu phiên đã kết thúc.
            </p>

            <label className="block space-y-1">
              <span className="text-xs text-gray-600">Người hốt</span>
              <select
                value={confirmWinnerId}
                onChange={(e) => setConfirmWinnerId(e.target.value)}
                className="w-full rounded-lg bg-white border border-gray-300 px-3 py-2 text-gray-900 text-sm"
              >
                <option value="">— Chọn người hốt —</option>
                {(sortedBids.length > 0 ? sortedBids : detailSession.bids.length > 0 ? detailSession.bids : eligibleMembers.map(m => ({ memberId: m.id, bidRate: 0 }))).map((b) => {
                  const m = memberById(b.memberId);
                  return (
                    <option key={b.memberId} value={b.memberId}>
                      {m?.name ?? b.memberId}
                      {detailGroup.type === 'live' ? ` — ${b.bidRate}%` : ''}
                    </option>
                  );
                })}
              </select>
            </label>

            {confirmWinnerId && (() => {
              const bid = detailSession.bids.find((b) => b.memberId === confirmWinnerId);
              const rate = bid?.bidRate ?? 0;
              const { gross, commission, interest, net } = calcSessionNet(detailGroup, rate, detailPeriodGross);
              return (
                <div className="rounded-lg bg-amber-50 border border-amber-200 p-3 space-y-1 text-xs">
                  <p className="font-medium text-amber-700">Tổng kết</p>
                  <div className="flex justify-between"><span>Tổng tiền góp</span><span>{formatVnd(gross)}</span></div>
                  <div className="flex justify-between text-red-500"><span>Hoa hồng</span><span>−{formatVnd(commission)}</span></div>
                  {detailGroup.type === 'live' && <div className="flex justify-between text-orange-500"><span>Lãi kêu ({rate}%)</span><span>−{formatVnd(interest)}</span></div>}
                  <div className="flex justify-between font-bold text-gray-900 border-t border-amber-200 pt-1">
                    <span>Tiền nhận</span><span className="text-emerald-600">{formatVnd(net)}</span>
                  </div>
                </div>
              );
            })()}
          </div>
        )}
      </Modal>

      {/* ===== Lucky Wheel modal ===== */}
      <Modal
        open={wheelOpen}
        onClose={() => setWheelOpen(false)}
        title="🎰 Vòng quay may mắn"
        wide
        footer={
          <button
            type="button"
            onClick={() => setWheelOpen(false)}
            className="px-4 py-2 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 text-sm"
          >
            Đóng
          </button>
        }
      >
        <LuckyWheel
          members={wheelMembers}
          onSelect={(id) => {
            setConfirmWinnerId(id);
            setWheelOpen(false);
            setConfirmOpen(true);
          }}
        />
      </Modal>

      {/* ===== Delete confirm modal ===== */}
      <Modal
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        title="Xóa phiên?"
        footer={
          <>
            <button
              type="button"
              onClick={() => setDeleteId(null)}
              className="px-4 py-2 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 text-sm"
            >
              Hủy
            </button>
            <button
              type="button"
              onClick={() => { deleteSession(deleteId); setDeleteId(null); }}
              className="px-4 py-2 rounded-lg bg-red-500 text-white text-sm font-medium"
            >
              Xóa
            </button>
          </>
        }
      >
        <p className="text-sm text-gray-600">Xóa phiên kêu hụi này. Giao dịch liên quan không bị xóa.</p>
      </Modal>
    </div>
  );
}
