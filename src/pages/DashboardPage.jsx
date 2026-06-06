import React, { useMemo } from 'react';
import { DollarSign, Users, TrendingUp, Wallet, AlertTriangle } from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
import { useHuiStore } from '../store/useHuiStore.js';
import { formatDate, formatVndCompact } from '../lib/format.js';
import { currentPeriodNumber } from '../lib/period.js';

function lastMonthsBuckets(transactions, months = 6) {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth() - (months - 1), 1);
  const buckets = [];
  for (let i = 0; i < months; i++) {
    const d = new Date(start.getFullYear(), start.getMonth() + i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const label = `T${d.getMonth() + 1}`;
    buckets.push({ key, label, contrib: 0 });
  }
  const keyIndex = Object.fromEntries(buckets.map((b, idx) => [b.key, idx]));
  for (const t of transactions) {
    if (t.kind !== 'contribution' || t.status !== 'completed') continue;
    const dt = new Date(t.date);
    const key = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}`;
    const idx = keyIndex[key];
    if (idx != null) buckets[idx].contrib += t.amount;
  }
  let cum = 0;
  return buckets.map((b) => {
    cum += b.contrib;
    return { ...b, cumulative: cum };
  });
}

export default function DashboardPage() {
  const groups = useHuiStore((s) => s.groups);
  const transactions = useHuiStore((s) => s.transactions);
  const sessions = useHuiStore((s) => s.sessions);
  const members = useHuiStore((s) => s.members);
  const memberships = useHuiStore((s) => s.memberships);
  const dashboardStats = useHuiStore((s) => s.dashboardStats);
  const memberById = useHuiStore((s) => s.memberById);
  const groupById = useHuiStore((s) => s.groupById);

  const stats = dashboardStats();

  const chartData = useMemo(() => lastMonthsBuckets(transactions, 7), [transactions]);

  const recent = useMemo(() => {
    return [...transactions]
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 8);
  }, [transactions]);

  // Late payment detection
  const lateList = useMemo(() => {
    const result = [];
    for (const group of groups) {
      const cp = currentPeriodNumber(group.startDate, group.cycle);
      const closedSession = sessions.find(
        (s) => s.groupId === group.id && s.periodNumber === cp && s.status === 'closed'
      );
      const winnerThisPeriod = closedSession?.winnerId ?? null;
      const groupMemberIds = memberships
        .filter((x) => x.groupId === group.id)
        .map((x) => x.memberId);
      for (const mid of groupMemberIds) {
        if (mid === winnerThisPeriod) continue;
        const paid = transactions.some(
          (t) =>
            t.memberId === mid &&
            t.groupId === group.id &&
            t.kind === 'contribution' &&
            t.status === 'completed' &&
            t.periodNumber === cp
        );
        if (!paid) {
          result.push({ member: memberById(mid), group, period: cp });
        }
      }
    }
    return result;
  }, [groups, memberships, sessions, transactions, memberById]);

  const statCards = [
    {
      label: 'Tổng đã góp',
      value: formatVndCompact(stats.totalContrib),
      hint: 'Tất cả giao dịch góp (đã xác nhận)',
      icon: DollarSign,
      wrap: 'bg-amber-400/15 text-amber-400',
    },
    {
      label: 'Dây hụi',
      value: String(stats.groupCount),
      hint: `${members.length} thành viên`,
      icon: Users,
      wrap: 'bg-blue-400/15 text-blue-400',
    },
    {
      label: 'Đã chi (hốt)',
      value: formatVndCompact(stats.totalWithdraw),
      hint: 'Tổng tiền hốt ghi nhận',
      icon: Wallet,
      wrap: 'bg-purple-400/15 text-purple-400',
    },
    {
      label: 'Số dư sổ (ước)',
      value: formatVndCompact(stats.fundBalance),
      hint: 'Góp − Hốt (theo dữ liệu đã nhập)',
      icon: TrendingUp,
      wrap: 'bg-emerald-400/15 text-emerald-400',
    },
  ];

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-4 sm:space-y-6 lg:space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {statCards.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <div
              key={idx}
              className="group relative overflow-hidden rounded-xl bg-white border border-gray-200 p-4 sm:p-6 hover:border-gray-300 hover:shadow-md transition-all shadow-sm"
            >
              <div className="relative space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm text-gray-500 mb-1">{stat.label}</p>
                    <p className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">{stat.value}</p>
                  </div>
                  <div className={`p-3 rounded-lg ${stat.wrap}`}>
                    <Icon size={22} />
                  </div>
                </div>
                <p className="text-xs text-gray-400">{stat.hint}</p>
              </div>
            </div>
          );
        })}
      </div>

      {lateList.length > 0 && (
        <div className="rounded-xl bg-white border border-red-200 shadow-sm overflow-hidden">
          <div className="flex items-center gap-2 px-4 sm:px-6 py-3 sm:py-4 border-b border-red-100 bg-red-50">
            <AlertTriangle size={18} className="text-red-500" />
            <h3 className="text-sm font-semibold text-red-700">
              Chưa đóng kỳ hiện tại ({lateList.length} trường hợp)
            </h3>
          </div>
          <div className="divide-y divide-gray-100 max-h-52 overflow-y-auto">
            {lateList.map(({ member, group, period }, idx) => (
              <div key={idx} className="flex items-center justify-between px-4 sm:px-6 py-2.5 sm:py-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{member?.name ?? '—'}</p>
                  <p className="text-xs text-gray-500 truncate">{group.name}</p>
                </div>
                <span className="shrink-0 ml-4 px-2 py-0.5 bg-red-100 text-red-600 text-xs font-semibold rounded-full">
                  Kỳ {period}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 rounded-xl bg-white border border-gray-200 p-4 sm:p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900">Quỹ góp tích lũy (7 tháng gần nhất)</h3>
          </div>
          <div className="h-64 w-full min-w-0">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" opacity={0.8} />
                <XAxis dataKey="label" stroke="#6b7280" fontSize={11} />
                <YAxis stroke="#6b7280" fontSize={11} tickFormatter={(v) => formatVndCompact(v)} />
                <Tooltip
                  contentStyle={{
                    background: '#ffffff',
                    border: '1px solid #e5e7eb',
                    borderRadius: '12px',
                    boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
                  }}
                  labelStyle={{ color: '#111827' }}
                  formatter={(value) => [formatVndCompact(value), 'Tích lũy']}
                />
                <Bar dataKey="cumulative" fill="url(#barGold)" radius={[6, 6, 0, 0]} />
                <defs>
                  <linearGradient id="barGold" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#fbbf24" />
                    <stop offset="100%" stopColor="#ea580c" />
                  </linearGradient>
                </defs>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-xl bg-white border border-gray-200 p-4 sm:p-6 shadow-sm">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">Dây hụi</h3>
          <div className="space-y-3 max-h-64 overflow-y-auto scrollbar-thin scrollbar-thumb-slate">
            {groups.length === 0 ? (
              <p className="text-sm text-gray-400">Chưa có dây hụi. Tạo tại mục Dây Hụi.</p>
            ) : (
              groups.map((g) => {
                const wCount = transactions.filter(
                  (t) => t.groupId === g.id && t.kind === 'withdrawal' && t.status === 'completed'
                ).length;
                const total = g.expectedMemberCount;
                const pct = total ? Math.min(100, Math.round((wCount / total) * 100)) : 0;
                return (
                  <div
                    key={g.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors border border-gray-200"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">{g.name}</p>
                      <p className="text-xs text-gray-500">
                        Hốt {wCount}/{total} · {g.type === 'live' ? 'Hụi sống' : 'Hụi chết'}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      <div className="w-16 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-amber-400 to-orange-500 rounded-full"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      <div className="rounded-xl bg-white border border-gray-200 p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900">Giao dịch gần đây</h3>
        </div>
        <div className="space-y-2">
          {recent.length === 0 ? (
            <p className="text-sm text-gray-400">Chưa có giao dịch.</p>
          ) : (
            recent.map((tx) => {
              const m = memberById(tx.memberId);
              const g = groupById(tx.groupId);
              return (
                <div
                  key={tx.id}
                  className="flex items-center justify-between p-4 rounded-lg hover:bg-gray-50 transition-colors border border-transparent hover:border-gray-200"
                >
                  <div className="flex items-center gap-4 min-w-0">
                    <div
                      className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
                        tx.kind === 'contribution' ? 'bg-blue-100' : 'bg-emerald-100'
                      }`}
                    >
                      <DollarSign
                        size={18}
                        className={tx.kind === 'contribution' ? 'text-blue-600' : 'text-emerald-600'}
                      />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">{m?.name ?? '—'}</p>
                      <p className="text-xs text-gray-500 truncate">{g?.name ?? '—'}</p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p
                      className={`text-sm font-semibold ${
                        tx.kind === 'contribution' ? 'text-blue-600' : 'text-emerald-600'
                      }`}
                    >
                      {tx.kind === 'contribution' ? '+' : '−'}
                      {formatVndCompact(tx.amount)}
                    </p>
                    <p className="text-xs text-gray-400">{formatDate(tx.date)}</p>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
