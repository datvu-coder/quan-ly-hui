import React, { useRef, useState } from 'react';
import {
  TrendingUp,
  Users,
  DollarSign,
  Menu,
  Bell,
  Settings,
  LogOut,
  BarChart3,
  Database,
  Hammer,
} from 'lucide-react';
import DashboardPage from './pages/DashboardPage.jsx';
import GroupsPage from './pages/GroupsPage.jsx';
import MembersPage from './pages/MembersPage.jsx';
import TransactionsPage from './pages/TransactionsPage.jsx';
import KeuHuiPage from './pages/KeuHuiPage.jsx';
import ReportsPage from './pages/ReportsPage.jsx';
import { Modal } from './components/Modal.jsx';
import { useHuiStore } from './store/useHuiStore.js';
import LoginPage from './pages/LoginPage.jsx';
import MemberPortal from './pages/MemberPortal.jsx';

export default function App() {
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [resetConfirm, setResetConfirm] = useState(false);
  const fileRef = useRef(null);

  const groups = useHuiStore((s) => s.groups);
  const members = useHuiStore((s) => s.members);
  const seedDemo = useHuiStore((s) => s.seedDemo);
  const exportBundle = useHuiStore((s) => s.exportBundle);
  const importBundle = useHuiStore((s) => s.importBundle);
  const resetAll = useHuiStore((s) => s.resetAll);
  // authedAs: null | 'admin' | memberId
  const [authedAs, setAuthedAs] = useState(
    () => sessionStorage.getItem('hui-authed')
  );

  const doLogin = (key) => {
    sessionStorage.setItem('hui-authed', key);
    setAuthedAs(key);
  };
  const doLogout = () => {
    sessionStorage.removeItem('hui-authed');
    setAuthedAs(null);
  };

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
    { id: 'groups', label: 'Dây Hụi', icon: Users },
    { id: 'members', label: 'Thành Viên', icon: Users },
    { id: 'keu-hui', label: 'Kêu Hụi', icon: Hammer },
    { id: 'transactions', label: 'Giao Dịch', icon: DollarSign },
    { id: 'reports', label: 'Báo Cáo', icon: TrendingUp },
  ];

  const titleMap = {
    dashboard: 'Dashboard',
    groups: 'Quản lý dây hụi',
    members: 'Thành viên',
    'keu-hui': 'Kêu hụi',
    transactions: 'Giao dịch',
    reports: 'Báo cáo',
  };

  const downloadJson = () => {
    const bundle = exportBundle();
    const blob = new Blob([JSON.stringify(bundle, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `hui-backup-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const onPickImport = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      importBundle(data);
    } catch {
      alert('Không đọc được file JSON. Kiểm tra định dạng.');
    }
    e.target.value = '';
    setSettingsOpen(false);
  };

  const empty = groups.length === 0 && members.length === 0;

  if (!authedAs) {
    return <LoginPage onSuccess={doLogin} />;
  }

  // Member portal
  if (authedAs !== 'admin') {
    return <MemberPortal memberId={authedAs} onLogout={doLogout} />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="relative flex min-h-screen">
        <aside
          className={`${
            sidebarOpen ? 'w-72' : 'w-20'
          } shrink-0 transition-all duration-300 bg-slate-900 border-r border-slate-700/60 flex flex-col relative`}
        >
          <div className="flex items-center justify-between p-6 border-b border-slate-700/50">
            {sidebarOpen ? (
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
                  <span className="text-white font-bold text-lg">H</span>
                </div>
                <div>
                  <div className="text-sm font-bold text-white">HUI PRO</div>
                  <div className="text-xs text-slate-400">Quản lý hụi</div>
                </div>
              </div>
            ) : null}
            <button
              type="button"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 hover:bg-slate-800/50 rounded-lg transition-colors"
              aria-label="Thu gọn menu"
            >
              <Menu size={20} className="text-slate-400" />
            </button>
          </div>

          <nav className="p-4 space-y-2 flex-1 overflow-y-auto">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setCurrentPage(item.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all text-left ${
                    currentPage === item.id
                      ? 'bg-gradient-to-r from-amber-400/20 to-orange-500/20 border border-amber-400/30 text-white'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/30'
                  }`}
                >
                  <Icon size={20} />
                  {sidebarOpen ? <span className="text-sm font-medium">{item.label}</span> : null}
                </button>
              );
            })}
          </nav>

          {sidebarOpen ? (
            <div className="p-4 border-t border-slate-700/50 space-y-3">
              <button
                type="button"
                onClick={() => seedDemo()}
                className="w-full flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-800/60 hover:bg-slate-800 text-amber-200 text-sm transition-colors"
              >
                <Database size={18} />
                Dữ liệu mẫu
              </button>
              <div className="bg-slate-800/30 rounded-lg p-4">
                <div className="text-xs text-slate-400 mb-2">Lãi suất tối đa (tham chiếu)</div>
                <div className="text-2xl font-bold text-amber-400">20% /năm</div>
              </div>
              <button
                type="button"
                onClick={doLogout}
                className="w-full flex items-center gap-2 px-4 py-2 text-slate-400 hover:text-slate-200 transition-colors text-sm"
              >
                <LogOut size={18} />
                Đăng xuất
              </button>
            </div>
          ) : null}
        </aside>

        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 sm:px-8 shrink-0 shadow-sm">
            <h1 className="text-lg sm:text-xl font-semibold text-gray-900 truncate pr-4">
              {titleMap[currentPage]}
            </h1>
            <div className="flex items-center gap-2 sm:gap-4 shrink-0">
              <button
                type="button"
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors relative"
                aria-label="Thông báo"
              >
                <Bell size={20} className="text-gray-500" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
              </button>
              <button
                type="button"
                onClick={() => setSettingsOpen(true)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                aria-label="Cài đặt"
              >
                <Settings size={20} className="text-gray-500" />
              </button>
            </div>
          </header>

          {empty ? (
            <div className="mx-4 sm:mx-8 mt-4 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <span>
                Chưa có dữ liệu. Thử <strong>Dữ liệu mẫu</strong> trên menu hoặc tạo dây hụi / thành viên.
              </span>
              <button
                type="button"
                onClick={() => seedDemo()}
                className="shrink-0 px-4 py-2 rounded-lg bg-amber-400 text-slate-900 font-semibold text-sm"
              >
                Tải mẫu ngay
              </button>
            </div>
          ) : null}

          <main className="flex-1 overflow-auto min-h-0">
            {currentPage === 'dashboard' && <DashboardPage />}
            {currentPage === 'groups' && <GroupsPage />}
            {currentPage === 'members' && <MembersPage />}
            {currentPage === 'keu-hui' && <KeuHuiPage />}
            {currentPage === 'transactions' && <TransactionsPage />}
            {currentPage === 'reports' && <ReportsPage />}
          </main>
        </div>
      </div>

      <Modal
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        title="Dữ liệu &amp; sao lưu"
        wide
        footer={
          <button
            type="button"
            onClick={() => setSettingsOpen(false)}
            className="px-4 py-2 rounded-lg bg-slate-800 text-slate-200 text-sm"
          >
            Đóng
          </button>
        }
      >
        <div className="space-y-6 text-sm text-gray-700">
          <p className="text-gray-600">
            Ứng dụng lưu cục bộ trên trình duyệt (localStorage). Hãy xuất JSON định kỳ để tránh mất dữ liệu khi xóa
            cache.
          </p>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={downloadJson}
              className="px-4 py-2 rounded-lg bg-gradient-to-r from-amber-400 to-orange-500 text-slate-900 font-semibold"
            >
              Xuất backup JSON
            </button>
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white border border-slate-600"
            >
              Nhập backup JSON
            </button>
            <input ref={fileRef} type="file" accept="application/json,.json" className="hidden" onChange={onPickImport} />
          </div>
          <div className="border-t border-gray-200 pt-4 flex flex-wrap gap-3 items-center">
            <button
              type="button"
              onClick={() => setResetConfirm(true)}
              className="px-4 py-2 rounded-lg bg-red-500/15 text-red-300 hover:bg-red-500/25 border border-red-500/30"
            >
              Xóa toàn bộ dữ liệu
            </button>
          </div>
        </div>
      </Modal>

      <Modal
        open={resetConfirm}
        onClose={() => setResetConfirm(false)}
        title="Xóa toàn bộ?"
        footer={
          <>
            <button
              type="button"
              onClick={() => setResetConfirm(false)}
              className="px-4 py-2 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 text-sm"
            >
              Hủy
            </button>
            <button
              type="button"
              onClick={() => {
                resetAll();
                setResetConfirm(false);
                setSettingsOpen(false);
              }}
              className="px-4 py-2 rounded-lg bg-red-600 text-white text-sm font-medium"
            >
              Xóa hết
            </button>
          </>
        }
      >
        <p className="text-sm text-gray-600">
          Xóa dây hụi, thành viên và giao dịch trên máy này. Nên xuất backup trước khi thử.
        </p>
      </Modal>
    </div>
  );
}
