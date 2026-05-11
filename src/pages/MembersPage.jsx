import React, { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Eye, Edit2, Trash2, AlertTriangle, CheckCircle2, Clock } from 'lucide-react';
import { useHuiStore } from '../store/useHuiStore.js';
import { Modal } from '../components/Modal.jsx';
import { formatVnd, formatDate } from '../lib/format.js';
import { currentPeriodNumber } from '../lib/period.js';

const memberSchema = z.object({
  name: z.string().min(2, 'Tối thiểu 2 ký tự'),
  phone: z.string().max(20).optional().or(z.literal('')),
  email: z.union([z.string().email('Email không hợp lệ'), z.literal('')]).optional(),
  address: z.string().optional(),
  joinedAt: z.string(),
  status: z.enum(['active', 'warning', 'debt', 'left']),
  _groups: z.array(z.string()).optional(),
});

const statusClass = {
  active: 'bg-green-100 text-green-700',
  warning: 'bg-yellow-100 text-yellow-700',
  debt: 'bg-red-100 text-red-700',
  left: 'bg-gray-100 text-gray-600',
};

const statusLabel = {
  active: 'Hoạt động',
  warning: 'Cảnh báo',
  debt: 'Nợ',
  left: 'Đã rút',
};

export default function MembersPage() {
  const members = useHuiStore((s) => s.members);
  const groups = useHuiStore((s) => s.groups);
  const memberships = useHuiStore((s) => s.memberships);
  const transactions = useHuiStore((s) => s.transactions);
  const sessions = useHuiStore((s) => s.sessions);
  const addMember = useHuiStore((s) => s.addMember);
  const updateMember = useHuiStore((s) => s.updateMember);
  const deleteMember = useHuiStore((s) => s.deleteMember);
  const addMembership = useHuiStore((s) => s.addMembership);
  const removeMembership = useHuiStore((s) => s.removeMembership);
  const groupsForMember = useHuiStore((s) => s.groupsForMember);
  const contributionTotalForMember = useHuiStore((s) => s.contributionTotalForMember);

  // Detect late payers: members who haven't paid the current period in any group
  const lateMap = useMemo(() => {
    const result = new Map(); // memberId -> [{ group, period }]
    for (const group of groups) {
      const cp = currentPeriodNumber(group.startDate, group.cycle);
      const groupMemberIds = memberships
        .filter((x) => x.groupId === group.id)
        .map((x) => x.memberId);
      for (const mid of groupMemberIds) {
        const paid = transactions.some(
          (t) =>
            t.memberId === mid &&
            t.groupId === group.id &&
            t.kind === 'contribution' &&
            t.status === 'completed' &&
            t.periodNumber === cp
        );
        if (!paid) {
          const prev = result.get(mid) ?? [];
          result.set(mid, [...prev, { group, period: cp }]);
        }
      }
    }
    return result;
  }, [groups, memberships, transactions]);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [viewId, setViewId] = useState(null);
  const [deleteId, setDeleteId] = useState(null);

  const form = useForm({
    resolver: zodResolver(memberSchema),
    defaultValues: {
      name: '',
      phone: '',
      email: '',
      address: '',
      joinedAt: new Date().toISOString().slice(0, 10),
      status: 'active',
      _groups: [],
    },
  });

  const openCreate = () => {
    setEditingId(null);
    form.reset({
      name: '',
      phone: '',
      email: '',
      address: '',
      joinedAt: new Date().toISOString().slice(0, 10),
      status: 'active',
      _groups: [],
    });
    setModalOpen(true);
  };

  const openEdit = (m) => {
    setEditingId(m.id);
    const gs = memberships.filter((x) => x.memberId === m.id).map((x) => x.groupId);
    form.reset({
      name: m.name,
      phone: m.phone,
      email: m.email || '',
      address: m.address || '',
      joinedAt: m.joinedAt,
      status: m.status,
      _groups: gs,
    });
    setModalOpen(true);
  };

  const syncMemberships = (memberId, nextGroupIds) => {
    const current = memberships.filter((x) => x.memberId === memberId).map((x) => x.groupId);
    const setNext = new Set(nextGroupIds);
    const setCur = new Set(current);
    for (const gid of groups.map((g) => g.id)) {
      if (setNext.has(gid) && !setCur.has(gid)) addMembership(memberId, gid);
      if (!setNext.has(gid) && setCur.has(gid)) removeMembership(memberId, gid);
    }
  };

  const onSubmit = (values) => {
    const { _groups = [], ...rest } = values;
    const groupIds = Array.isArray(_groups) ? _groups : [];
    if (editingId) {
      updateMember(editingId, rest);
      syncMemberships(editingId, groupIds);
    } else {
      const id = addMember(rest);
      syncMemberships(id, groupIds);
    }
    setModalOpen(false);
  };

  const viewMember = useMemo(() => members.find((m) => m.id === viewId), [members, viewId]);

  return (
    <div className="p-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-1">Thành viên</h2>
          <p className="text-sm text-gray-500">{members.length} người đang quản lý</p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-gradient-to-r from-amber-400 to-orange-500 text-slate-900 font-semibold hover:shadow-lg hover:shadow-amber-500/25 transition-all"
        >
          <Plus size={20} />
          Thêm thành viên
        </button>
      </div>

      <div className="rounded-xl bg-white border border-gray-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px]">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Tên</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Điện thoại</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Dây hụi</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Đã góp</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Trạng thái</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {members.map((member) => {
                const gc = groupsForMember(member.id).length;
                const contributed = contributionTotalForMember(member.id);
                return (
                  <tr key={member.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-gray-900">{member.name}</p>
                        {lateMap.has(member.id) && (
                          <span title={`Trễ ${lateMap.get(member.id).length} dây`}>
                            <AlertTriangle size={14} className="text-red-500" />
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-gray-500">{member.phone}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm font-medium text-gray-800">{gc}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm font-semibold text-amber-600">{formatVnd(contributed)}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusClass[member.status] ?? 'bg-gray-100 text-gray-600'}`}>
                        {statusLabel[member.status]}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          className="p-2 hover:bg-slate-700/50 rounded-lg transition-colors"
                          onClick={() => setViewId(member.id)}
                        >
                          <Eye size={16} className="text-slate-400" />
                        </button>
                        <button
                          type="button"
                          className="p-2 hover:bg-slate-700/50 rounded-lg transition-colors"
                          onClick={() => openEdit(member)}
                        >
                          <Edit2 size={16} className="text-slate-400" />
                        </button>
                        <button
                          type="button"
                          className="p-2 hover:bg-red-500/20 rounded-lg transition-colors"
                          onClick={() => setDeleteId(member.id)}
                        >
                          <Trash2 size={16} className="text-red-400" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {members.length === 0 ? (
        <p className="text-center text-gray-400 text-sm py-6">Chưa có thành viên.</p>
      ) : null}

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingId ? 'Sửa thành viên' : 'Thêm thành viên'}
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
              <span className="text-xs text-gray-600">Họ tên</span>
              <input
                className="w-full rounded-lg bg-white border border-gray-300 px-3 py-2 text-gray-900 text-sm"
                {...form.register('name')}
              />
              {form.formState.errors.name ? (
                <span className="text-xs text-red-400">{form.formState.errors.name.message}</span>
              ) : null}
            </label>
            <label className="block space-y-1">
              <span className="text-xs text-gray-600">Điện thoại</span>
              <input
                className="w-full rounded-lg bg-white border border-gray-300 px-3 py-2 text-gray-900 text-sm"
                {...form.register('phone')}
              />
              {form.formState.errors.phone ? (
                <span className="text-xs text-red-400">{form.formState.errors.phone.message}</span>
              ) : null}
            </label>
            <label className="block space-y-1">
              <span className="text-xs text-gray-600">Email</span>
              <input
                className="w-full rounded-lg bg-white border border-gray-300 px-3 py-2 text-gray-900 text-sm"
                {...form.register('email')}
              />
              {form.formState.errors.email ? (
                <span className="text-xs text-red-400">{form.formState.errors.email.message}</span>
              ) : null}
            </label>
            <label className="block space-y-1">
              <span className="text-xs text-gray-600">Ngày tham gia</span>
              <input
                type="date"
                className="w-full rounded-lg bg-white border border-gray-300 px-3 py-2 text-gray-900 text-sm"
                {...form.register('joinedAt')}
              />
            </label>
            <label className="block space-y-1 sm:col-span-2">
              <span className="text-xs text-gray-600">Địa chỉ</span>
              <input
                className="w-full rounded-lg bg-white border border-gray-300 px-3 py-2 text-gray-900 text-sm"
                {...form.register('address')}
              />
            </label>
            <label className="block space-y-1">
              <span className="text-xs text-gray-600">Trạng thái</span>
              <select
                className="w-full rounded-lg bg-white border border-gray-300 px-3 py-2 text-gray-900 text-sm"
                {...form.register('status')}
              >
                <option value="active">Hoạt động</option>
                <option value="warning">Cảnh báo</option>
                <option value="debt">Nợ</option>
                <option value="left">Đã rút</option>
              </select>
            </label>
          </div>

          <div className="border border-gray-200 rounded-xl p-4 bg-gray-50">
            <p className="text-sm font-medium text-gray-800 mb-3">Tham gia dây hụi</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {groups.map((g) => {
                const gid = g.id;
                const arr = form.watch('_groups');
                const checked = Array.isArray(arr) && arr.includes(gid);
                return (
                  <label
                    key={g.id}
                    className="flex items-center justify-between gap-3 px-3 py-2 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 cursor-pointer transition-colors"
                  >
                    <span className="truncate">{g.name}</span>
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={(e) => {
                        const cur = Array.isArray(form.getValues('_groups'))
                          ? [...form.getValues('_groups')]
                          : [];
                        if (e.target.checked) {
                          if (!cur.includes(gid)) cur.push(gid);
                        } else {
                          const i = cur.indexOf(gid);
                          if (i >= 0) cur.splice(i, 1);
                        }
                        form.setValue('_groups', cur, { shouldDirty: true });
                      }}
                      className="w-4 h-4 rounded accent-amber-500 cursor-pointer"
                    />
                  </label>
                );
              })}
            </div>
            {groups.length === 0 ? (
              <p className="text-xs text-gray-400 mt-2">Chưa có dây hụi để chọn.</p>
            ) : null}
          </div>
        </form>
      </Modal>

      <Modal
        open={!!viewId && !!viewMember}
        onClose={() => setViewId(null)}
        title={viewMember?.name ?? ''}
        wide
        footer={
          <button
            type="button"
            onClick={() => setViewId(null)}
            className="px-4 py-2 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 text-sm"
          >
            Đóng
          </button>
        }
      >
        {viewMember ? (
          <div className="space-y-6 text-sm">
            {/* Basic info */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-xs text-gray-500">Điện thoại</p>
                <p className="text-gray-900 font-medium">{viewMember.phone}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Email</p>
                <p className="text-gray-900">{viewMember.email || '—'}</p>
              </div>
              <div className="col-span-2">
                <p className="text-xs text-gray-500">Địa chỉ</p>
                <p className="text-gray-900">{viewMember.address || '—'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Tổng đã góp (ghi nhận)</p>
                <p className="text-amber-600 font-bold text-base">
                  {formatVnd(contributionTotalForMember(viewMember.id))}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Trạng thái</p>
                <span className={`inline-block mt-0.5 px-3 py-1 rounded-full text-xs font-semibold ${
                  statusClass[viewMember.status] ?? 'bg-gray-100 text-gray-600'
                }`}>
                  {statusLabel[viewMember.status]}
                </span>
              </div>
            </div>

            {/* Late payment alert */}
            {lateMap.has(viewMember.id) && (
              <div className="rounded-lg bg-red-50 border border-red-200 p-3 flex items-start gap-2">
                <AlertTriangle size={16} className="text-red-500 shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-semibold text-red-700">Chưa đóng kỳ hiện tại:</p>
                  {lateMap.get(viewMember.id).map(({ group, period }) => (
                    <p key={group.id} className="text-xs text-red-600">
                      • {group.name} — Kỳ {period}
                    </p>
                  ))}
                </div>
              </div>
            )}

            {/* Per-group payment tracking */}
            <div>
              <p className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-2">
                Theo dõi đóng tiền từng kỳ
              </p>
              {groupsForMember(viewMember.id).length === 0 ? (
                <p className="text-xs text-gray-400">Chưa tham gia dây nào.</p>
              ) : (
                <div className="space-y-4">
                  {groupsForMember(viewMember.id).map((g) => {
                    const cp = currentPeriodNumber(g.startDate, g.cycle);
                    const maxPeriod = Math.min(cp, g.expectedMemberCount);
                    const paidPeriods = new Set(
                      transactions
                        .filter(
                          (t) =>
                            t.memberId === viewMember.id &&
                            t.groupId === g.id &&
                            t.kind === 'contribution' &&
                            t.status === 'completed' &&
                            t.periodNumber != null
                        )
                        .map((t) => t.periodNumber)
                    );
                    const wonSession = sessions.find(
                      (s) => s.groupId === g.id && s.status === 'closed' && s.winnerId === viewMember.id
                    );
                    return (
                      <div key={g.id} className="rounded-lg border border-gray-200 p-3">
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-xs font-semibold text-gray-800">{g.name}</p>
                          {wonSession && (
                            <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full font-medium flex items-center gap-1">
                              <CheckCircle2 size={11} />
                              Đã hốt kỳ {wonSession.periodNumber}
                            </span>
                          )}
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {Array.from({ length: maxPeriod }, (_, i) => i + 1).map((p) => {
                            const paid = paidPeriods.has(p);
                            const isCurrent = p === cp;
                            return (
                              <span
                                key={p}
                                title={`Kỳ ${p} — ${paid ? 'Đã đóng' : isCurrent ? 'Chưa đóng (kỳ hiện tại)' : 'Chưa đóng'}`}
                                className={`w-7 h-7 rounded-full text-xs font-semibold flex items-center justify-center border ${
                                  paid
                                    ? 'bg-green-100 text-green-700 border-green-300'
                                    : isCurrent
                                    ? 'bg-red-100 text-red-600 border-red-300'
                                    : 'bg-gray-100 text-gray-400 border-gray-200'
                                }`}
                              >
                                {p}
                              </span>
                            );
                          })}
                          {maxPeriod === 0 && (
                            <p className="text-xs text-gray-400">Chưa đến kỳ đầu tiên.</p>
                          )}
                        </div>
                        <p className="text-xs text-gray-400 mt-1.5">
                          Đã đóng {paidPeriods.size}/{maxPeriod} kỳ · Kỳ hiện tại: {cp}
                        </p>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Withdrawal (hốt) history */}
            <div>
              <p className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-2">
                Lịch sử hốt hụi
              </p>
              {(() => {
                const wonSessions = sessions.filter(
                  (s) => s.status === 'closed' && s.winnerId === viewMember.id
                );
                const wonTxs = transactions.filter(
                  (t) => t.memberId === viewMember.id && t.kind === 'withdrawal' && t.status === 'completed'
                );
                const items = wonSessions.length > 0 ? wonSessions : [];
                if (wonTxs.length === 0 && items.length === 0) {
                  return <p className="text-xs text-gray-400">Chưa có lần hốt nào được ghi nhận.</p>;
                }
                return (
                  <div className="space-y-2">
                    {wonTxs.map((t) => {
                      const g = groups.find((x) => x.id === t.groupId);
                      return (
                        <div key={t.id} className="flex justify-between items-center p-2 rounded-lg bg-green-50 border border-green-100">
                          <div>
                            <p className="text-xs font-medium text-gray-800">{g?.name ?? '—'}</p>
                            <p className="text-xs text-gray-500">Kỳ {t.periodNumber ?? '?'} · {formatDate(t.date)}</p>
                          </div>
                          <p className="text-sm font-bold text-emerald-600">{formatVnd(t.amount)}</p>
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
            </div>
          </div>
        ) : null}
      </Modal>

      <Modal
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        title="Xóa thành viên?"
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
                if (deleteId) deleteMember(deleteId);
                setDeleteId(null);
              }}
              className="px-4 py-2 rounded-lg bg-red-500/90 text-white text-sm font-medium"
            >
              Xóa
            </button>
          </>
        }
      >
        <p className="text-sm text-gray-600">Xóa thành viên và giao dịch liên quan.</p>
      </Modal>
    </div>
  );
}
