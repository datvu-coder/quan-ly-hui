import React, { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Eye, Edit2, Trash2, Users, CheckCircle2, XCircle } from 'lucide-react';
import { useHuiStore } from '../store/useHuiStore.js';
import { Modal } from '../components/Modal.jsx';
import { LegalBanner } from '../components/LegalBanner.jsx';
import { cycleLabel, formatVnd } from '../lib/format.js';
import { estimateDeadWithdrawal, estimateLiveWithdrawal, isInterestRateIllegal } from '../lib/calculations.js';
import { currentPeriodNumber } from '../lib/period.js';

const groupSchema = z.object({
  name: z.string().min(2, 'Tối thiểu 2 ký tự'),
  expectedMemberCount: z.coerce.number().min(1, 'Tối thiểu 1').max(500, 'Tối đa 500'),
  contributionAmount: z.coerce.number().min(1000, 'Tối thiểu 1.000 ₫'),
  cycle: z.enum(['day', 'week', 'month']),
  startDate: z.string(),
  type: z.enum(['dead', 'live']),
  interestRateAnnual: z.coerce.number().min(0).max(50, 'Tối đa 50%/năm'),
  ownerCommissionPercent: z.coerce.number().min(0).max(30, 'Tối đa 30%'),
  notes: z.string().optional(),
});

export default function GroupsPage() {
  const groups = useHuiStore((s) => s.groups);
  const transactions = useHuiStore((s) => s.transactions);
  const addGroup = useHuiStore((s) => s.addGroup);
  const updateGroup = useHuiStore((s) => s.updateGroup);
  const deleteGroup = useHuiStore((s) => s.deleteGroup);
  const membersForGroup = useHuiStore((s) => s.membersForGroup);
  const sessions = useHuiStore((s) => s.sessions);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [detailId, setDetailId] = useState(null);
  const [deleteId, setDeleteId] = useState(null);

  const interestWarnings = useMemo(() => {
    const w = [];
    for (const g of groups) {
      if (g.type === 'live' && isInterestRateIllegal(g.interestRateAnnual)) {
        w.push(`“${g.name}”: lãi ${g.interestRateAnnual}%/năm > 20%.`);
      }
    }
    return w;
  }, [groups]);

  const form = useForm({
    resolver: zodResolver(groupSchema),
    defaultValues: {
      name: '',
      expectedMemberCount: 10,
      contributionAmount: 1_000_000,
      cycle: 'month',
      startDate: new Date().toISOString().slice(0, 10),
      type: 'dead',
      interestRateAnnual: 0,
      ownerCommissionPercent: 2,
      notes: '',
    },
  });

  const openCreate = () => {
    setEditingId(null);
    form.reset({
      name: '',
      expectedMemberCount: 10,
      contributionAmount: 1_000_000,
      cycle: 'month',
      startDate: new Date().toISOString().slice(0, 10),
      type: 'dead',
      interestRateAnnual: 0,
      ownerCommissionPercent: 2,
      notes: '',
    });
    setModalOpen(true);
  };

  const openEdit = (g) => {
    setEditingId(g.id);
    form.reset({
      name: g.name,
      expectedMemberCount: g.expectedMemberCount,
      contributionAmount: g.contributionAmount,
      cycle: g.cycle,
      startDate: g.startDate,
      type: g.type,
      interestRateAnnual: g.interestRateAnnual,
      ownerCommissionPercent: g.ownerCommissionPercent,
      notes: g.notes || '',
    });
    setModalOpen(true);
  };

  const onSubmit = (values) => {
    if (editingId) {
      updateGroup(editingId, {
        ...values,
        interestRateAnnual: values.type === 'dead' ? 0 : values.interestRateAnnual,
      });
    } else {
      addGroup({
        ...values,
        interestRateAnnual: values.type === 'dead' ? 0 : values.interestRateAnnual,
      });
    }
    setModalOpen(false);
  };

  const detailGroup = groups.find((g) => g.id === detailId);
  const detailMembers = detailId ? membersForGroup(detailId) : [];

  const preview = useMemo(() => {
    if (!detailGroup) return null;
    const N = detailGroup.expectedMemberCount;
    const A = detailGroup.contributionAmount;
    const M = Math.min(N, Math.max(1, Math.floor(N / 2)));
    if (detailGroup.type === 'dead') {
      const e = estimateDeadWithdrawal(A, N, M, detailGroup.ownerCommissionPercent);
      return { ...e, label: `Ước tính kỳ ${M} (hụi chết)` };
    }
    const e = estimateLiveWithdrawal(A, N, M, detailGroup.interestRateAnnual, detailGroup.ownerCommissionPercent);
    return { ...e, label: `Ước tính kỳ ${M} (hụi sống — tham khảo)` };
  }, [detailGroup]);

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-4 sm:space-y-6 lg:space-y-8">
      <LegalBanner interestWarnings={interestWarnings} />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-1">Quản lý dây hụi</h2>
          <p className="text-sm text-gray-500">
            {groups.length} dây · Thêm, sửa, xem thành viên &amp; gợi ý tính hốt
          </p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-gradient-to-r from-amber-400 to-orange-500 text-slate-900 font-semibold hover:shadow-lg hover:shadow-amber-500/25 transition-all"
        >
          <Plus size={20} />
          Tạo dây hụi
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {groups.map((group) => {
          const wCount = transactions.filter(
            (t) => t.groupId === group.id && t.kind === 'withdrawal' && t.status === 'completed'
          ).length;
          const cSum = transactions
            .filter((t) => t.groupId === group.id && t.kind === 'contribution' && t.status === 'completed')
            .reduce((a, t) => a + t.amount, 0);
          const total = group.expectedMemberCount;
          const pct = total ? Math.round((wCount / total) * 100) : 0;
          const memCount = membersForGroup(group.id).length;

          return (
            <div
              key={group.id}
              className="group rounded-xl bg-white border border-gray-200 overflow-hidden hover:border-gray-300 transition-all hover:shadow-md shadow-sm"
            >
              <div className="bg-gradient-to-r from-gray-50 to-white p-4 sm:p-6 border-b border-gray-100">
                <div className="flex items-start justify-between mb-2 gap-2">
                  <div className="min-w-0">
                    <h3 className="text-base sm:text-lg font-bold text-gray-900 truncate">{group.name}</h3>
                    <p className="text-sm text-gray-500 mt-1">
                      {group.type === 'live'
                        ? `Hụi sống · ${group.interestRateAnnual}%/năm`
                        : 'Hụi chết'}
                      {' · '}
                      {cycleLabel(group.cycle)}
                    </p>
                  </div>
                  <span
                    className={`shrink-0 px-3 py-1 rounded-full text-xs font-semibold ${
                      memCount >= total * 0.8
                        ? 'bg-green-100 text-green-700'
                        : 'bg-sky-100 text-sky-700'
                    }`}
                  >
                    {memCount}/{total} người
                  </span>
                </div>
              </div>

              <div className="p-4 sm:p-6 space-y-4 sm:space-y-5">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 rounded-lg bg-gray-50">
                    <p className="text-xs text-gray-500 mb-1">Góp/kỳ</p>
                    <p className="text-lg font-bold text-gray-900">{formatVnd(group.contributionAmount)}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-amber-50">
                    <p className="text-xs text-gray-500 mb-1">Đã góp (ghi nhận)</p>
                    <p className="text-lg font-bold text-amber-600">{formatVnd(cSum)}</p>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs text-gray-500">Tiến độ hốt</p>
                    <p className="text-xs font-semibold text-gray-700">
                      {wCount}/{total} ({pct}%)
                    </p>
                  </div>
                  <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-amber-400 to-orange-500 rounded-full transition-all"
                      style={{ width: `${Math.min(100, pct)}%` }}
                    />
                  </div>
                </div>

                <div className="flex gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setDetailId(group.id)}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 hover:text-gray-900 transition-colors text-sm font-medium"
                  >
                    <Eye size={16} />
                    Chi tiết
                  </button>
                  <button
                    type="button"
                    onClick={() => openEdit(group)}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 hover:text-gray-900 transition-colors text-sm font-medium"
                  >
                    <Edit2 size={16} />
                    Sửa
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeleteId(group.id)}
                    className="px-3 py-2 rounded-lg bg-red-50 hover:bg-red-100 text-red-500 transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {groups.length === 0 ? (
        <p className="text-center text-gray-400 text-sm py-8">
          Chưa có dây hụi. Nhấn &quot;Tạo dây hụi&quot; hoặc &quot;Dữ liệu mẫu&quot; trên thanh công cụ.
        </p>
      ) : null}

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingId ? 'Sửa dây hụi' : 'Tạo dây hụi'}
        wide
        footer={
          <>
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="px-4 py-2 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 text-sm"
            >
              Hủy
            </button>
            <button
              type="button"
              onClick={form.handleSubmit(onSubmit)}
              className="px-5 py-2 rounded-lg bg-gradient-to-r from-amber-400 to-orange-500 text-slate-900 font-semibold text-sm"
            >
              Lưu
            </button>
          </>
        }
      >
        <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <label className="block space-y-1">
              <span className="text-xs text-gray-600">Tên dây hụi</span>
              <input
                className="w-full rounded-lg bg-white border border-gray-300 px-3 py-2 text-gray-900 text-sm"
                {...form.register('name')}
              />
              {form.formState.errors.name ? (
                <span className="text-xs text-red-400">{form.formState.errors.name.message}</span>
              ) : null}
            </label>
            <label className="block space-y-1">
              <span className="text-xs text-gray-600">Số hụi viên (kỳ)</span>
              <input
                type="number"
                className="w-full rounded-lg bg-white border border-gray-300 px-3 py-2 text-gray-900 text-sm"
                {...form.register('expectedMemberCount')}
              />
              {form.formState.errors.expectedMemberCount ? (
                <span className="text-xs text-red-400">{form.formState.errors.expectedMemberCount.message}</span>
              ) : null}
            </label>
            <label className="block space-y-1">
              <span className="text-xs text-gray-600">Tiền góp / người / kỳ (₫)</span>
              <input
                type="number"
                className="w-full rounded-lg bg-white border border-gray-300 px-3 py-2 text-gray-900 text-sm"
                {...form.register('contributionAmount')}
              />
              {form.formState.errors.contributionAmount ? (
                <span className="text-xs text-red-400">{form.formState.errors.contributionAmount.message}</span>
              ) : null}
            </label>
            <label className="block space-y-1">
              <span className="text-xs text-gray-600">Chu kỳ</span>
              <select
                className="w-full rounded-lg bg-white border border-gray-300 px-3 py-2 text-gray-900 text-sm"
                {...form.register('cycle')}
              >
                <option value="month">Tháng</option>
                <option value="week">Tuần</option>
                <option value="day">Ngày</option>
              </select>
            </label>
            <label className="block space-y-1">
              <span className="text-xs text-gray-600">Ngày bắt đầu</span>
              <input
                type="date"
                className="w-full rounded-lg bg-white border border-gray-300 px-3 py-2 text-gray-900 text-sm"
                {...form.register('startDate')}
              />
            </label>
            <label className="block space-y-1">
              <span className="text-xs text-gray-600">Loại</span>
              <select
                className="w-full rounded-lg bg-white border border-gray-300 px-3 py-2 text-gray-900 text-sm"
                {...form.register('type')}
              >
                <option value="dead">Hụi chết (không lãi)</option>
                <option value="live">Hụi sống (có lãi)</option>
              </select>
            </label>
            <label className="block space-y-1">
              <span className="text-xs text-gray-600">Lãi suất năm (%)</span>
              <input
                type="number"
                step="0.1"
                disabled={form.watch('type') === 'dead'}
                className="w-full rounded-lg bg-white border border-gray-300 px-3 py-2 text-gray-900 text-sm disabled:opacity-40"
                {...form.register('interestRateAnnual')}
              />
              {form.formState.errors.interestRateAnnual ? (
                <span className="text-xs text-red-400">{form.formState.errors.interestRateAnnual.message}</span>
              ) : null}
            </label>
            <label className="block space-y-1">
              <span className="text-xs text-gray-600">Hoa hồng chủ hụi (% trên quỹ kỳ hốt)</span>
              <input
                type="number"
                step="0.1"
                className="w-full rounded-lg bg-white border border-gray-300 px-3 py-2 text-gray-900 text-sm"
                {...form.register('ownerCommissionPercent')}
              />
              {form.formState.errors.ownerCommissionPercent ? (
                <span className="text-xs text-red-400">{form.formState.errors.ownerCommissionPercent.message}</span>
              ) : null}
            </label>
          </div>
          <label className="block space-y-1">
            <span className="text-xs text-gray-600">Ghi chú / quy tắc</span>
            <textarea
              rows={3}
              className="w-full rounded-lg bg-white border border-gray-300 px-3 py-2 text-gray-900 text-sm"
              {...form.register('notes')}
            />
          </label>
        </form>
      </Modal>

      <Modal
        open={!!detailId && !!detailGroup}
        onClose={() => setDetailId(null)}
        title={detailGroup ? detailGroup.name : ''}
        wide
        footer={
          <button
            type="button"
            onClick={() => setDetailId(null)}
            className="px-4 py-2 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 text-sm"
          >
            Đóng
          </button>
        }
      >
        {detailGroup ? (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div className="p-4 rounded-xl bg-gray-50 border border-gray-200">
                <p className="text-gray-500 text-xs mb-1">Góp mỗi kỳ</p>
                <p className="text-gray-900 font-semibold">{formatVnd(detailGroup.contributionAmount)}</p>
              </div>
              <div className="p-4 rounded-xl bg-gray-50 border border-gray-200">
                <p className="text-gray-500 text-xs mb-1">Chu kỳ</p>
                <p className="text-gray-900 font-semibold">{cycleLabel(detailGroup.cycle)}</p>
              </div>
            </div>

            {preview ? (
              <div className="p-4 rounded-xl bg-amber-50 border border-amber-200">
                <p className="text-amber-700 text-sm font-medium mb-2">{preview.label}</p>
                <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
                  <div>Quỹ góp (gross): {formatVnd(preview.gross)}</div>
                  <div>Hoa hồng: {formatVnd(preview.commission)}</div>
                  {preview.earlyPenalty != null ? (
                    <div>Khấu trừ (ước): {formatVnd(preview.earlyPenalty)}</div>
                  ) : null}
                  {preview.lateBonus != null ? (
                    <div>Cộng lãi (ước): {formatVnd(preview.lateBonus)}</div>
                  ) : null}
                  <div className="col-span-2 text-gray-900 font-semibold pt-2 border-t border-amber-200 mt-2">
                    Tiền nhận gợi ý: {formatVnd(preview.net)}
                  </div>
                </div>
              </div>
            ) : null}

            <div>
              <div className="flex items-center gap-2 mb-3 text-gray-800 font-medium text-sm">
                <Users size={18} className="text-amber-500" />
                Thành viên trong dây ({detailMembers.length})
              </div>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {detailMembers.length === 0 ? (
                  <p className="text-sm text-gray-400">Chưa gán thành viên — thêm tại mục Thành Viên.</p>
                ) : (
                  detailMembers.map((m) => (
                    <div
                      key={m.id}
                      className="flex justify-between items-center p-3 rounded-lg bg-gray-50 border border-gray-200"
                    >
                      <span className="text-gray-900 text-sm">{m.name}</span>
                      <span className="text-xs text-gray-500">{m.phone}</span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Period payment tracking */}
            {detailMembers.length > 0 && (() => {
              const cp = currentPeriodNumber(detailGroup.startDate, detailGroup.cycle);
              const maxP = Math.min(cp, detailGroup.expectedMemberCount);
              if (maxP === 0) return null;
              const periods = Array.from({ length: maxP }, (_, i) => i + 1);
              return (
                <div>
                  <p className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-2">
                    Bảng đóng tiền (kỳ 1 — {maxP})
                  </p>
                  <div className="overflow-x-auto rounded-lg border border-gray-200">
                    <table className="text-xs min-w-max">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-3 py-2 text-left text-gray-600 font-semibold sticky left-0 bg-gray-50">
                            Thành viên
                          </th>
                          {periods.map((p) => {
                            const wonSess = sessions.find(
                              (s) => s.groupId === detailGroup.id && s.status === 'closed' && s.winnerId && s.periodNumber === p
                            );
                            return (
                              <th
                                key={p}
                                className={`px-2 py-2 text-center font-semibold ${
                                  p === cp ? 'text-amber-600 bg-amber-50' : 'text-gray-500'
                                }`}
                                title={wonSess ? `Kỳ ${p} — ${detailMembers.find(m=>m.id===wonSess.winnerId)?.name ?? ''} hốt` : `Kỳ ${p}`}
                              >
                                {p}
                                {wonSess ? ' 🏆' : ''}
                              </th>
                            );
                          })}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {detailMembers.map((m) => (
                          <tr key={m.id} className="hover:bg-gray-50">
                            <td className="px-3 py-2 text-gray-800 font-medium whitespace-nowrap sticky left-0 bg-white">
                              {m.name}
                            </td>
                            {periods.map((p) => {
                              const paid = transactions.some(
                                (t) =>
                                  t.memberId === m.id &&
                                  t.groupId === detailGroup.id &&
                                  t.kind === 'contribution' &&
                                  t.status === 'completed' &&
                                  t.periodNumber === p
                              );
                              return (
                                <td key={p} className={`px-2 py-2 text-center ${p === cp ? 'bg-amber-50/50' : ''}`}>
                                  {paid ? (
                                    <CheckCircle2 size={14} className="text-green-500 mx-auto" />
                                  ) : (
                                    <XCircle size={14} className={`mx-auto ${p === cp ? 'text-red-400' : 'text-gray-200'}`} />
                                  )}
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <p className="text-xs text-gray-400 mt-1">
                    Kỳ hiện tại: <strong className="text-amber-600">{cp}</strong> · Cột nền vàng = kỳ hiện tại · 🏆 = đã có người hốt
                  </p>
                </div>
              );
            })()}
          </div>
        ) : null}
      </Modal>

      <Modal
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        title="Xóa dây hụi?"
        footer={
          <>
            <button
              type="button"
              onClick={() => setDeleteId(null)}
              className="px-4 py-2 rounded-lg bg-slate-800 text-slate-200 text-sm"
            >
              Hủy
            </button>
            <button
              type="button"
              onClick={() => {
                if (deleteId) deleteGroup(deleteId);
                setDeleteId(null);
              }}
              className="px-4 py-2 rounded-lg bg-red-500/90 text-white text-sm font-medium"
            >
              Xóa
            </button>
          </>
        }
      >
        <p className="text-sm text-slate-300">
          Sẽ xóa luôn thành viên khỏi dây và giao dịch liên quan. Thao tác không hoàn tác.
        </p>
      </Modal>
    </div>
  );
}
