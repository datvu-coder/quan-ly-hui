import React, { useMemo } from 'react';
import { BarChart3, Calendar, Download, TrendingUp, Users } from 'lucide-react';
import { useHuiStore } from '../store/useHuiStore.js';
import { LegalBanner } from '../components/LegalBanner.jsx';
import { formatVnd, formatVndCompact } from '../lib/format.js';
import { rowsToCsv, downloadTextFile } from '../lib/csv.js';
import { isInterestRateIllegal, isLargeFundWarning } from '../lib/calculations.js';

export default function ReportsPage() {
  const groups = useHuiStore((s) => s.groups);
  const members = useHuiStore((s) => s.members);
  const transactions = useHuiStore((s) => s.transactions);
  const dashboardStats = useHuiStore((s) => s.dashboardStats);

  const stats = dashboardStats();

  const interestWarnings = useMemo(() => {
    const w = [];
    for (const g of groups) {
      if (g.type === 'live' && isInterestRateIllegal(g.interestRateAnnual)) {
        w.push(`Dây “${g.name}”: lãi ${g.interestRateAnnual}%/năm vượt 20%.`);
      }
    }
    return w;
  }, [groups]);

  const fundWarning =
    isLargeFundWarning(stats.totalContrib) ||
    groups.some((g) => {
      const tg = transactions
        .filter((t) => t.groupId === g.id && t.kind === 'contribution' && t.status === 'completed')
        .reduce((a, t) => a + t.amount, 0);
      return isLargeFundWarning(tg);
    });

  const perGroup = useMemo(() => {
    return groups.map((g) => {
      const txs = transactions.filter((t) => t.groupId === g.id && t.status === 'completed');
      const contrib = txs.filter((t) => t.kind === 'contribution').reduce((a, t) => a + t.amount, 0);
      const withdraw = txs.filter((t) => t.kind === 'withdrawal').reduce((a, t) => a + t.amount, 0);
      const commission = txs
        .filter((t) => t.kind === 'withdrawal')
        .reduce((a, t) => a + (Number(t.meta?.commission) || 0), 0);
      return {
        id: g.id,
        name: g.name,
        contrib,
        withdraw,
        balance: contrib - withdraw,
        commission,
      };
    });
  }, [groups, transactions]);

  const exportTransactions = () => {
    const headers = ['id', 'groupId', 'memberId', 'kind', 'amount', 'periodNumber', 'date', 'status', 'notes'];
    const rows = transactions.map((t) => [
      t.id,
      t.groupId,
      t.memberId,
      t.kind,
      t.amount,
      t.periodNumber ?? '',
      t.date,
      t.status,
      (t.notes || '').replace(/\n/g, ' '),
    ]);
    downloadTextFile(`hui-transactions-${Date.now()}.csv`, rowsToCsv(headers, rows));
  };

  const exportMembers = () => {
    const headers = ['id', 'name', 'phone', 'email', 'address', 'joinedAt', 'status'];
    const rows = members.map((m) => [
      m.id,
      m.name,
      m.phone,
      m.email || '',
      m.address || '',
      m.joinedAt,
      m.status,
    ]);
    downloadTextFile(`hui-members-${Date.now()}.csv`, rowsToCsv(headers, rows));
  };

  const exportGroups = () => {
    const headers = [
      'id',
      'name',
      'expectedMemberCount',
      'contributionAmount',
      'cycle',
      'startDate',
      'type',
      'interestRateAnnual',
      'ownerCommissionPercent',
    ];
    const rows = groups.map((g) => [
      g.id,
      g.name,
      g.expectedMemberCount,
      g.contributionAmount,
      g.cycle,
      g.startDate,
      g.type,
      g.interestRateAnnual,
      g.ownerCommissionPercent,
    ]);
    downloadTextFile(`hui-groups-${Date.now()}.csv`, rowsToCsv(headers, rows));
  };

  const cards = [
    {
      title: 'Tổng quỹ góp',
      desc: 'Theo giao dịch đã xác nhận',
      value: formatVndCompact(stats.totalContrib),
      icon: BarChart3,
    },
    {
      title: 'Tổng đã hốt',
      desc: 'Chi ra cho hụi viên',
      value: formatVndCompact(stats.totalWithdraw),
      icon: TrendingUp,
    },
    {
      title: 'Hoa hồng (ước)',
      desc: 'Từ meta giao dịch hốt',
      value: formatVndCompact(stats.commissionEst),
      icon: Calendar,
    },
    {
      title: 'Số dư sổ',
      desc: 'Góp − Hốt',
      value: formatVndCompact(stats.fundBalance),
      icon: Users,
    },
  ];

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-4 sm:space-y-6 lg:space-y-8">
      <LegalBanner interestWarnings={interestWarnings} fundWarning={fundWarning} />

      <div>
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-1">Báo cáo</h2>
        <p className="text-sm text-gray-500">Tổng hợp tài chính và xuất CSV</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {cards.map((c, idx) => {
          const Icon = c.icon;
          return (
            <div
              key={idx}
              className="rounded-xl bg-white border border-gray-200 p-4 sm:p-6 flex items-start justify-between gap-4 shadow-sm"
            >
              <div>
                <h3 className="text-base sm:text-lg font-semibold text-gray-900">{c.title}</h3>
                <p className="text-sm text-gray-500 mt-1">{c.desc}</p>
                <p className="text-xl sm:text-2xl font-bold text-amber-600 mt-4">{c.value}</p>
              </div>
              <div className="p-3 rounded-lg bg-amber-50">
                <Icon size={24} className="text-amber-500" />
              </div>
            </div>
          );
        })}
      </div>

      <div className="rounded-xl bg-white border border-gray-200 p-4 sm:p-6 shadow-sm">
        <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">Xuất dữ liệu (CSV)</h3>
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={exportTransactions}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white hover:bg-gray-50 border border-gray-300 text-sm text-gray-700"
          >
            <Download size={16} />
            Giao dịch
          </button>
          <button
            type="button"
            onClick={exportMembers}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white hover:bg-gray-50 border border-gray-300 text-sm text-gray-700"
          >
            <Download size={16} />
            Thành viên
          </button>
          <button
            type="button"
            onClick={exportGroups}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white hover:bg-gray-50 border border-gray-300 text-sm text-gray-700"
          >
            <Download size={16} />
            Dây hụi
          </button>
        </div>
      </div>

      <div className="rounded-xl bg-white border border-gray-200 overflow-hidden shadow-sm">
        <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-200 bg-gray-50">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900">Theo từng dây</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px]">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-600">Dây hụi</th>
                <th className="px-6 py-3 text-right text-sm font-semibold text-gray-600">Đã góp</th>
                <th className="px-6 py-3 text-right text-sm font-semibold text-gray-600">Đã hốt</th>
                <th className="px-6 py-3 text-right text-sm font-semibold text-gray-600">Hoa hồng (meta)</th>
                <th className="px-6 py-3 text-right text-sm font-semibold text-gray-600">Số dư</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {perGroup.map((row) => (
                <tr key={row.id} className="hover:bg-gray-50">
                  <td className="px-6 py-3 text-sm text-gray-900">{row.name}</td>
                  <td className="px-6 py-3 text-sm text-right text-amber-600">{formatVnd(row.contrib)}</td>
                  <td className="px-6 py-3 text-sm text-right text-emerald-600">{formatVnd(row.withdraw)}</td>
                  <td className="px-6 py-3 text-sm text-right text-gray-500">{formatVnd(row.commission)}</td>
                  <td className="px-6 py-3 text-sm text-right font-semibold text-gray-900">
                    {formatVnd(row.balance)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {perGroup.length === 0 ? (
          <p className="p-6 text-sm text-gray-400">Chưa có dây hụi.</p>
        ) : null}
      </div>

      <div className="rounded-xl bg-white border border-gray-200 p-6 space-y-3 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900">Tổng hợp nhanh</h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between gap-4 border-b border-gray-100 pb-2">
            <span className="text-gray-500">Tổng tiền góp nhận</span>
            <span className="text-amber-600 font-semibold">{formatVnd(stats.totalContrib)}</span>
          </div>
          <div className="flex justify-between gap-4 border-b border-gray-100 pb-2">
            <span className="text-gray-500">Tổng tiền chi trả (hốt)</span>
            <span className="text-emerald-600 font-semibold">{formatVnd(stats.totalWithdraw)}</span>
          </div>
          <div className="flex justify-between gap-4 border-b border-gray-100 pb-2">
            <span className="text-gray-500">Hoa hồng chủ hụi (ước)</span>
            <span className="text-purple-600 font-semibold">{formatVnd(stats.commissionEst)}</span>
          </div>
          <div className="flex justify-between gap-4 pt-1">
            <span className="text-gray-700 font-medium">Số dư quỹ (ước)</span>
            <span className="text-gray-900 font-bold text-lg">{formatVnd(stats.fundBalance)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
