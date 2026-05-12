import React, { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Trash2 } from 'lucide-react';
import { useHuiStore } from '../store/useHuiStore.js';
import { Modal } from '../components/Modal.jsx';
import { formatDate, formatVnd } from '../lib/format.js';
import { estimateDeadWithdrawal, estimateLiveWithdrawal } from '../lib/calculations.js';

const txSchema = z.object({
  groupId: z.string().min(1, 'Chọn dây hụi'),
  memberId: z.string().min(1, 'Chọn thành viên'),
  kind: z.enum(['contribution', 'withdrawal']),
  amount: z.coerce.number().min(1, 'Nhập số tiền'),
  periodNumber: z.preprocess((v) => {
    if (v === '' || v === undefined || v === null) return undefined;
    const n = Number(v);
    return Number.isFinite(n) ? n : undefined;
  }, z.number().min(1).optional()),
  date: z.string(),
  receiptNo: z.string().optional(),
  notes: z.string().optional(),
  status: z.enum(['completed', 'pending', 'failed']),
});

const statusUi = {
  completed: { label: 'Thành công', class: 'bg-green-100 text-green-700' },
  pending: { label: 'Chờ xác nhận', class: 'bg-yellow-100 text-yellow-700' },
  failed: { label: 'Thất bại', class: 'bg-red-100 text-red-700' },
};
const statusUiFallback = { label: 'Không rõ', class: 'bg-gray-100 text-gray-600' };

export default function TransactionsPage() {
  const transactions = useHuiStore((s) => s.transactions);
  const groups = useHuiStore((s) => s.groups);
  const addTransaction = useHuiStore((s) => s.addTransaction);
  const deleteTransaction = useHuiStore((s) => s.deleteTransaction);
  const membersForGroup = useHuiStore((s) => s.membersForGroup);
  const memberById = useHuiStore((s) => s.memberById);
  const groupById = useHuiStore((s) => s.groupById);

  const [modalOpen, setModalOpen] = useState(false);
  const [filterGroup, setFilterGroup] = useState('');
  const [deleteId, setDeleteId] = useState(null);

  const form = useForm({
    resolver: zodResolver(txSchema),
    defaultValues: {
      groupId: '',
      memberId: '',
      kind: 'contribution',
      amount: 1_000_000,
      periodNumber: 1,
      date: new Date().toISOString().slice(0, 10),
      receiptNo: '',
      notes: '',
      status: 'completed',
    },
  });

  const watchGroup = form.watch('groupId');
  const watchKind = form.watch('kind');
  const watchPeriod = form.watch('periodNumber');

  const groupOptions = groups;
  const memberOptions = watchGroup ? membersForGroup(watchGroup) : [];

  const suggestion = useMemo(() => {
    const g = groups.find((x) => x.id === watchGroup);
    if (!g || watchKind !== 'withdrawal') return null;
    const M = Number(watchPeriod) || 1;
    const N = g.expectedMemberCount;
    const A = g.contributionAmount;
    if (g.type === 'dead') {
      const e = estimateDeadWithdrawal(A, N, M, g.ownerCommissionPercent);
      return { ...e, type: 'dead' };
    }
    const e = estimateLiveWithdrawal(A, N, M, g.interestRateAnnual, g.ownerCommissionPercent);
    return { ...e, type: 'live' };
  }, [groups, watchGroup, watchKind, watchPeriod]);

  const openCreate = () => {
    const firstG = groups[0]?.id ?? '';
    form.reset({
      groupId: firstG,
      memberId: '',
      kind: 'contribution',
      amount: groups[0]?.contributionAmount ?? 1_000_000,
      periodNumber: 1,
      date: new Date().toISOString().slice(0, 10),
      receiptNo: '',
      notes: '',
      status: 'completed',
    });
    setModalOpen(true);
  };

  const onSubmit = (values) => {
    if (!values.groupId || !values.memberId) return;
    let meta;
    if (values.kind === 'withdrawal' && suggestion) {
      meta = {
        gross: suggestion.gross,
        commission: suggestion.commission,
        earlyPenalty: suggestion.earlyPenalty,
        lateBonus: suggestion.lateBonus,
      };
    }
    addTransaction({ ...values, meta });
    setModalOpen(false);
  };

  const applySuggestion = () => {
    if (!suggestion) return;
    form.setValue('amount', suggestion.net, { shouldValidate: true });
  };

  const filtered = useMemo(() => {
    if (!filterGroup) return transactions;
    return transactions.filter((t) => t.groupId === filterGroup);
  }, [transactions, filterGroup]);

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-4 sm:space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-1">Giao dịch</h2>
          <p className="text-sm text-gray-500">Góp hụi &amp; hốt hụi — có gợi ý số tiền (hốt)</p>
        </div>
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
          <button
            type="button"
            onClick={openCreate}
            disabled={groups.length === 0}
            title={groups.length === 0 ? 'Tạo dây hụi và thành viên trước' : ''}
            className="inline-flex items-center gap-2 px-5 py-2 rounded-lg bg-gradient-to-r from-amber-400 to-orange-500 text-slate-900 font-semibold text-sm disabled:opacity-40 disabled:pointer-events-none"
          >
            <Plus size={18} />
            Thêm giao dịch
          </button>
        </div>
      </div>

      <div className="rounded-xl bg-white border border-gray-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[860px]">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Thành viên</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Dây hụi</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Loại</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Số tiền</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Kỳ</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Ngày</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Trạng thái</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600"> </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map((tx) => {
                const m = memberById(tx.memberId);
                const g = groupById(tx.groupId);
                const st = statusUi[tx.status] ?? statusUiFallback;
                return (
                  <tr key={tx.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <p className="text-sm font-medium text-gray-900">{m?.name ?? '—'}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-gray-500">{g?.name ?? '—'}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-2 py-1 rounded text-xs font-semibold ${
                          tx.kind === 'contribution'
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-emerald-100 text-emerald-700'
                        }`}
                      >
                        {tx.kind === 'contribution' ? 'Góp' : 'Hốt'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm font-semibold text-amber-600">{formatVnd(tx.amount)}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-gray-500">{tx.periodNumber ?? '—'}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-gray-500">{formatDate(tx.date)}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${st.class}`}>
                        {st.label}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        type="button"
                        className="p-2 hover:bg-red-500/15 rounded-lg"
                        onClick={() => setDeleteId(tx.id)}
                      >
                        <Trash2 size={16} className="text-red-400" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {filtered.length === 0 ? (
        <p className="text-center text-gray-400 text-sm py-6">Không có giao dịch.</p>
      ) : null}

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Thêm giao dịch"
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
              <span className="text-xs text-gray-600">Dây hụi</span>
              <select
                className="w-full rounded-lg bg-white border border-gray-300 px-3 py-2 text-gray-900 text-sm"
                {...form.register('groupId', {
                  onChange: (e) => {
                    const gid = e.target.value;
                    const g = groups.find((x) => x.id === gid);
                    form.setValue('amount', g?.contributionAmount ?? 0);
                    form.setValue('memberId', '');
                  },
                })}
              >
                <option value="">— Chọn —</option>
                {groupOptions.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name}
                  </option>
                ))}
              </select>
              {form.formState.errors.groupId ? (
                <span className="text-xs text-red-400">{form.formState.errors.groupId.message}</span>
              ) : null}
            </label>
            <label className="block space-y-1">
              <span className="text-xs text-gray-600">Thành viên</span>
              <select
                className="w-full rounded-lg bg-white border border-gray-300 px-3 py-2 text-gray-900 text-sm"
                {...form.register('memberId')}
              >
                <option value="">— Chọn —</option>
                {memberOptions.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
              {watchGroup && memberOptions.length === 0 ? (
                <span className="text-xs text-amber-500">Dây này chưa có thành viên — thêm tại mục Thành Viên.</span>
              ) : null}
              {form.formState.errors.memberId ? (
                <span className="text-xs text-red-400">{form.formState.errors.memberId.message}</span>
              ) : null}
            </label>
            <label className="block space-y-1">
              <span className="text-xs text-gray-600">Loại</span>
              <select
                className="w-full rounded-lg bg-white border border-gray-300 px-3 py-2 text-gray-900 text-sm"
                {...form.register('kind')}
              >
                <option value="contribution">Góp hụi</option>
                <option value="withdrawal">Hốt hụi</option>
              </select>
            </label>
            <label className="block space-y-1">
              <span className="text-xs text-gray-600">Số tiền (₫)</span>
              <input
                type="number"
                className="w-full rounded-lg bg-white border border-gray-300 px-3 py-2 text-gray-900 text-sm"
                {...form.register('amount')}
              />
              {form.formState.errors.amount ? (
                <span className="text-xs text-red-400">{form.formState.errors.amount.message}</span>
              ) : null}
            </label>
            <label className="block space-y-1">
              <span className="text-xs text-gray-600">Kỳ (số thứ tự)</span>
              <input
                type="number"
                className="w-full rounded-lg bg-white border border-gray-300 px-3 py-2 text-gray-900 text-sm"
                {...form.register('periodNumber')}
              />
            </label>
            <label className="block space-y-1">
              <span className="text-xs text-gray-600">Ngày</span>
              <input
                type="date"
                className="w-full rounded-lg bg-white border border-gray-300 px-3 py-2 text-gray-900 text-sm"
                {...form.register('date')}
              />
            </label>
            <label className="block space-y-1">
              <span className="text-xs text-gray-600">Biên nhận số</span>
              <input
                className="w-full rounded-lg bg-white border border-gray-300 px-3 py-2 text-gray-900 text-sm"
                {...form.register('receiptNo')}
              />
            </label>
            <label className="block space-y-1">
              <span className="text-xs text-gray-600">Trạng thái</span>
              <select
                className="w-full rounded-lg bg-white border border-gray-300 px-3 py-2 text-gray-900 text-sm"
                {...form.register('status')}
              >
                <option value="completed">Thành công</option>
                <option value="pending">Chờ xác nhận</option>
                <option value="failed">Thất bại</option>
              </select>
            </label>
          </div>

          {watchKind === 'withdrawal' && suggestion ? (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-medium text-emerald-700">Gợi ý hốt (ước lượng)</p>
                <button
                  type="button"
                  onClick={applySuggestion}
                  className="text-xs px-3 py-1.5 rounded-lg bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
                >
                  Áp dụng vào số tiền
                </button>
              </div>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-gray-600">
                <span>Quỹ góp (gross)</span>
                <span className="text-right">{formatVnd(suggestion.gross)}</span>
                <span>Hoa hồng</span>
                <span className="text-right">{formatVnd(suggestion.commission)}</span>
                {suggestion.type === 'live' ? (
                  <>
                    <span>Khấu trừ (ước)</span>
                    <span className="text-right">{formatVnd(suggestion.earlyPenalty)}</span>
                    <span>Cộng lãi (ước)</span>
                    <span className="text-right">{formatVnd(suggestion.lateBonus)}</span>
                  </>
                ) : null}
                <span className="text-gray-900 font-semibold pt-1 border-t border-emerald-200 col-span-2 mt-1">
                  Tiền nhận gợi ý: {formatVnd(suggestion.net)}
                </span>
              </div>
            </div>
          ) : null}

          <label className="block space-y-1">
            <span className="text-xs text-gray-600">Ghi chú</span>
            <textarea
              rows={2}
              className="w-full rounded-lg bg-white border border-gray-300 px-3 py-2 text-gray-900 text-sm"
              {...form.register('notes')}
            />
          </label>
        </form>
      </Modal>

      <Modal
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        title="Xóa giao dịch?"
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
              onClick={() => {
                if (deleteId) deleteTransaction(deleteId);
                setDeleteId(null);
              }}
              className="px-4 py-2 rounded-lg bg-red-500/90 text-white text-sm font-medium"
            >
              Xóa
            </button>
          </>
        }
      >
        <p className="text-sm text-gray-600">Xóa vĩnh viễn bản ghi này.</p>
      </Modal>
    </div>
  );
}
