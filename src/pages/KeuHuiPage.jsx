import React, { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Trash2, CheckCircle2, Clock, Users, AlertCircle } from 'lucide-react';
import { useHuiStore } from '../store/useHuiStore.js';
import { Modal } from '../components/Modal.jsx';
import { formatDate, formatVnd, cycleLabel } from '../lib/format.js';
import { currentPeriodNumber, calcSessionNet } from '../lib/period.js';

const createSchema = z.object({
  groupId: z.string().min(1, 'Chọn dây hụi'),
  periodNumber: z.coerce.number().min(1),
  date: z.string(),
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
  const addTransaction = useHuiStore((s) => s.addTransaction);
  const membersForGroup = useHuiStore((s) => s.membersForGroup);
  const memberById = useHuiStore((s) => s.memberById);
  const groupById = useHuiStore((s) => s.groupById);

  const [filterGroup, setFilterGroup] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [detailId, setDetailId] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [confirmWinnerId, setConfirmWinnerId] = useState('');
  const [confirmOpen, setConfirmOpen] = useState(false);

  // bid form state inside detail modal
  const [bidMemberId, setBidMemberId] = useState('');
  const [bidRate, setBidRate] = useState('0');

  const createForm = useForm({
    resolver: zodResolver(createSchema),
    defaultValues: {
      groupId: '',
      periodNumber: 1,
      date: new Date().toISOString().slice(0, 10),
    },
  });

  const watchGroup = createForm.watch('groupId');

  // Auto-fill period number when group changes
  const onGroupChange = (gid) => {
    const g = groups.find((x) => x.id === gid);
    if (g) {
      createForm.setValue('periodNumber', currentPeriodNumber(g.startDate, g.cycle));
    }
  };

  const onCreateSubmit = (vals) => {
    addSession({ groupId: vals.groupId, periodNumber: vals.periodNumber, date: vals.date });
    setCreateOpen(false);
    createForm.reset();
  };

  // ---------- Detail modal ----------
  const detailSession = useMemo(() => sessions.find((s) => s.id === detailId), [sessions, detailId]);
  const detailGroup = detailSession ? groupById(detailSession.groupId) : null;

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
    const newBids = [...detailSession.bids, { memberId: bidMemberId, bidRate: Number(bidRate) || 0 }];
    updateSession(detailSession.id, { bids: newBids });
    setBidMemberId('');
    setBidRate('0');
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

  const openConfirm = () => {
    if (!detailSession) return;
    // default winner = highest bidder (or first eligible if no bids yet for dead hui)
    const topBid = sortedBids[0];
    setConfirmWinnerId(topBid?.memberId ?? eligibleMembers[0]?.id ?? '');
    setConfirmOpen(true);
  };

  const closeSession = () => {
    if (!detailSession || !detailGroup || !confirmWinnerId) return;
    const winnerBid = detailSession.bids.find((b) => b.memberId === confirmWinnerId);
    const winnerBidRate = winnerBid?.bidRate ?? 0;
    const { gross, commission, interest, net } = calcSessionNet(detailGroup, winnerBidRate);

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
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-1">Kêu hụi</h2>
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

          {watchGroup && (() => {
            const g = groups.find((x) => x.id === watchGroup);
            if (!g) return null;
            const { gross, commission, net } = calcSessionNet(g, 0);
            return (
              <div className="rounded-lg bg-amber-50 border border-amber-200 p-3 text-xs text-gray-600 space-y-1">
                <p className="font-medium text-amber-700">Thông tin dây ({g.expectedMemberCount} người)</p>
                <div className="flex justify-between">
                  <span>Quỹ kỳ (gross)</span>
                  <span className="font-medium">{formatVnd(gross)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Hoa hồng ({g.ownerCommissionPercent}%)</span>
                  <span>{formatVnd(commission)}</span>
                </div>
                {g.type === 'dead' && (
                  <div className="flex justify-between text-gray-900 font-semibold border-t border-amber-200 pt-1">
                    <span>Tiền hốt (hụi chết)</span>
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

            {/* Gross calculation */}
            {(() => {
              const topRate = sortedBids[0]?.bidRate ?? 0;
              const { gross, commission, interest, net } = calcSessionNet(detailGroup, topRate);
              return (
                <div className="rounded-lg bg-gray-50 border border-gray-200 p-4 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div>
                    <p className="text-gray-500 mb-0.5">Quỹ kỳ (gross)</p>
                    <p className="font-semibold text-gray-900">{formatVnd(gross)}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 mb-0.5">Hoa hồng ({detailGroup.ownerCommissionPercent}%)</p>
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
                      {detailGroup.type === 'live' ? 'Tiền nhận (bid cao nhất)' : 'Tiền nhận'}
                    </p>
                    <p className="font-bold text-emerald-600">{formatVnd(net)}</p>
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
                    const { net } = calcSessionNet(detailGroup, bid.bidRate);
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
                      <span className="text-xs text-gray-500">Lãi kêu (%)</span>
                      <input
                        type="number"
                        min={0}
                        step={0.1}
                        value={bidRate}
                        onChange={(e) => setBidRate(e.target.value)}
                        className="w-full rounded-lg bg-white border border-gray-300 px-3 py-2 text-gray-900 text-sm"
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

            {/* For dead hui with open session and no bids: show eligible list to pick directly */}
            {detailGroup.type === 'dead' && detailSession.status === 'open' && sortedBids.length === 0 && eligibleMembers.length > 0 && (
              <div className="rounded-lg bg-blue-50 border border-blue-200 p-4 space-y-2">
                <p className="text-xs font-medium text-blue-700">
                  Hụi chết — Chọn người hốt kỳ này và nhấn "Chốt phiên":
                </p>
                <div className="flex flex-wrap gap-2">
                  {eligibleMembers.map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => {
                        updateSession(detailSession.id, {
                          bids: [{ memberId: m.id, bidRate: 0 }],
                        });
                      }}
                      className="px-3 py-1.5 rounded-lg bg-white border border-blue-200 text-sm text-gray-800 hover:bg-blue-100"
                    >
                      {m.name}
                    </button>
                  ))}
                </div>
              </div>
            )}
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
              const { gross, commission, interest, net } = calcSessionNet(detailGroup, rate);
              return (
                <div className="rounded-lg bg-amber-50 border border-amber-200 p-3 space-y-1 text-xs">
                  <p className="font-medium text-amber-700">Tổng kết</p>
                  <div className="flex justify-between"><span>Gross</span><span>{formatVnd(gross)}</span></div>
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
