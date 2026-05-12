import React, { useRef, useState, useEffect } from 'react';
import {
  TrendingUp,
  Users,
  DollarSign,
  Menu,
  X,
  Bell,
  Settings,
  LogOut,
  BarChart3,
  Database,
  Hammer,
  ChevronLeft,
} from 'lucide-react';
import DashboardPage    from './pages/DashboardPage.jsx';
import GroupsPage       from './pages/GroupsPage.jsx';
import MembersPage      from './pages/MembersPage.jsx';
import TransactionsPage from './pages/TransactionsPage.jsx';
import KeuHuiPage       from './pages/KeuHuiPage.jsx';
import ReportsPage      from './pages/ReportsPage.jsx';
import { Modal }        from './components/Modal.jsx';
import { useHuiStore }  from './store/useHuiStore.js';
import LoginPage        from './pages/LoginPage.jsx';
import MemberPortal     from './pages/MemberPortal.jsx';

const NAV_ITEMS = [
  { id: 'dashboard',    label: 'Dashboard',    icon: BarChart3  },
  { id: 'groups',       label: 'Dây Hụi',      icon: Users      },
  { id: 'members',      label: 'Thành Viên',   icon: Users      },
  { id: 'keu-hui',      label: 'Kêu Hụi',      icon: Hammer     },
  { id: 'transactions', label: 'Giao Dịch',    icon: DollarSign },
  { id: 'reports',      label: 'Báo Cáo',      icon: TrendingUp },
];

const TITLE_MAP = {
  dashboard:    'Dashboard',
  groups:       'Quản lý dây hụi',
  members:      'Thành viên',
  'keu-hui':    'Kêu hụi',
  transactions: 'Giao dịch',
  reports:      'Báo cáo',
};

// ── Sidebar component ────────────────────────────────────────────────────────
function Sidebar({ currentPage, setCurrentPage, sidebarOpen, setSidebarOpen, mobileOpen, setMobileOpen, onSeedDemo, onLogout }) {
  const collapsed = !sidebarOpen;

  const navigate = (id) => {
    setCurrentPage(id);
    setMobileOpen(false); // close drawer on mobile after navigation
  };

  return (
    <aside
      className={`
        fixed inset-y-0 left-0 z-40 flex flex-col
        bg-[#0c1322] border-r border-white/5
        transition-all duration-300 ease-in-out
        ${mobileOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'}
        lg:static lg:translate-x-0 lg:shadow-none
        ${collapsed ? 'lg:w-[68px]' : 'lg:w-64'}
        w-64
      `}
    >
      {/* ── Header: menu toggle + logo ─────────────────────────────────── */}
      <div className="flex items-center h-14 shrink-0 border-b border-white/5 relative">
        {/* Menu toggle — absolute at top-left corner */}
        <button
          type="button"
          onClick={() => {
            if (window.innerWidth < 1024) setMobileOpen(false);
            else setSidebarOpen(!sidebarOpen);
          }}
          title={collapsed ? 'Mở rộng menu' : 'Thu gọn menu'}
          className="absolute left-0 top-0 w-[68px] h-14 flex items-center justify-center
            text-slate-400 hover:text-white hover:bg-white/5
            transition-colors duration-150 shrink-0 z-10"
          aria-label="Toggle menu"
        >
          {collapsed
            ? <Menu size={19} />
            : <ChevronLeft size={19} />
          }
        </button>

        {/* Logo — slides in when expanded */}
        <div
          className={`flex items-center gap-2.5 pl-[68px] pr-4 overflow-hidden transition-all duration-300 ${
            collapsed ? 'opacity-0 w-0 pointer-events-none' : 'opacity-100 w-full'
          }`}
        >
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shrink-0 shadow-md shadow-amber-900/40">
            <span className="text-white font-black text-sm leading-none">H</span>
          </div>
          <div className="leading-none">
            <p className="text-[13px] font-bold text-white tracking-wide">HUI PRO</p>
            <p className="text-[10px] text-slate-500 mt-0.5">Quản lý hụi thông minh</p>
          </div>
        </div>

        {/* Mobile close button */}
        <button
          type="button"
          onClick={() => setMobileOpen(false)}
          className="lg:hidden absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
          aria-label="Đóng menu"
        >
          <X size={17} />
        </button>
      </div>

      {/* ── Navigation ──────────────────────────────────────────────────── */}
      <nav className="flex-1 overflow-y-auto overflow-x-hidden py-3 px-2 space-y-0.5">
        {NAV_ITEMS.map(({ id, label, icon: Icon }) => {
          const active = currentPage === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => navigate(id)}
              title={collapsed ? label : undefined}
              className={`
                relative w-full flex items-center gap-3 rounded-xl text-left
                transition-all duration-150 group
                ${collapsed ? 'px-0 justify-center h-11' : 'px-3 py-2.5'}
                ${active
                  ? 'bg-amber-500/12 text-amber-400'
                  : 'text-slate-400 hover:text-slate-100 hover:bg-white/5'
                }
              `}
            >
              {/* Active left accent bar */}
              {active && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-amber-400 rounded-r-full" />
              )}

              <Icon
                size={18}
                className={`shrink-0 transition-colors ${active ? 'text-amber-400' : 'text-slate-500 group-hover:text-slate-300'}`}
              />

              {!collapsed && (
                <span className="text-[13.5px] font-medium truncate">{label}</span>
              )}

              {/* Tooltip on collapsed (desktop only) */}
              {collapsed && (
                <span className="
                  absolute left-full ml-3 px-2.5 py-1.5 rounded-lg
                  bg-slate-800 text-white text-xs font-medium whitespace-nowrap
                  opacity-0 group-hover:opacity-100 pointer-events-none
                  transition-opacity duration-150 shadow-xl z-50
                  border border-white/10
                ">
                  {label}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* ── Footer ──────────────────────────────────────────────────────── */}
      <div className="border-t border-white/5 p-2 space-y-0.5 shrink-0">
        <button
          type="button"
          onClick={onSeedDemo}
          title={collapsed ? 'Dữ liệu mẫu' : undefined}
          className={`relative w-full flex items-center gap-3 rounded-xl transition-all duration-150 group
            text-slate-400 hover:text-amber-300 hover:bg-white/5
            ${collapsed ? 'justify-center h-11 px-0' : 'px-3 py-2.5'}
          `}
        >
          <Database size={17} className="shrink-0" />
          {!collapsed && <span className="text-[13px] font-medium truncate">Dữ liệu mẫu</span>}
          {collapsed && (
            <span className="absolute left-full ml-3 px-2.5 py-1.5 rounded-lg bg-slate-800 text-white text-xs font-medium whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity shadow-xl z-50 border border-white/10">
              Dữ liệu mẫu
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={onLogout}
          title={collapsed ? 'Đăng xuất' : undefined}
          className={`relative w-full flex items-center gap-3 rounded-xl transition-all duration-150 group
            text-slate-400 hover:text-red-400 hover:bg-red-500/8
            ${collapsed ? 'justify-center h-11 px-0' : 'px-3 py-2.5'}
          `}
        >
          <LogOut size={17} className="shrink-0" />
          {!collapsed && <span className="text-[13px] font-medium truncate">Đăng xuất</span>}
          {collapsed && (
            <span className="absolute left-full ml-3 px-2.5 py-1.5 rounded-lg bg-slate-800 text-white text-xs font-medium whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity shadow-xl z-50 border border-white/10">
              Đăng xuất
            </span>
          )}
        </button>
      </div>
    </aside>
  );
}

// ── Main App ─────────────────────────────────────────────────────────────────
export default function App() {
  const [currentPage,  setCurrentPage]  = useState('dashboard');
  const [sidebarOpen,  setSidebarOpen]  = useState(true);   // desktop collapsed state
  const [mobileOpen,   setMobileOpen]   = useState(false);  // mobile drawer state
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [resetConfirm, setResetConfirm] = useState(false);
  const fileRef = useRef(null);

  const groups       = useHuiStore((s) => s.groups);
  const members      = useHuiStore((s) => s.members);
  const seedDemo     = useHuiStore((s) => s.seedDemo);
  const exportBundle = useHuiStore((s) => s.exportBundle);
  const importBundle = useHuiStore((s) => s.importBundle);
  const resetAll     = useHuiStore((s) => s.resetAll);

  const [authedAs, setAuthedAs] = useState(() => sessionStorage.getItem('hui-authed'));

  // Close mobile drawer on resize to desktop
  useEffect(() => {
    const onResize = () => { if (window.innerWidth >= 1024) setMobileOpen(false); };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const doLogin  = (key) => { sessionStorage.setItem('hui-authed', key); setAuthedAs(key); };
  const doLogout = () => { sessionStorage.removeItem('hui-authed'); setAuthedAs(null); };

  const downloadJson = () => {
    const bundle = exportBundle();
    const blob = new Blob([JSON.stringify(bundle, null, 2)], { type: 'application/json' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url; a.download = `hui-backup-${Date.now()}.json`; a.click();
    URL.revokeObjectURL(url);
  };

  const onPickImport = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      importBundle(JSON.parse(await file.text()));
    } catch {
      alert('Không đọc được file JSON. Kiểm tra định dạng.');
    }
    e.target.value = '';
    setSettingsOpen(false);
  };

  if (!authedAs)           return <LoginPage onSuccess={doLogin} />;
  if (authedAs !== 'admin') return <MemberPortal memberId={authedAs} onLogout={doLogout} />;

  const empty = groups.length === 0 && members.length === 0;

  return (
    <div className="min-h-screen bg-gray-50 flex">

      {/* ── Mobile backdrop ─────────────────────────────────────────────── */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-30 lg:hidden"
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* ── Sidebar ─────────────────────────────────────────────────────── */}
      <Sidebar
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
        onSeedDemo={seedDemo}
        onLogout={doLogout}
      />

      {/* ── Main content ────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen overflow-hidden">

        {/* Top header */}
        <header className="h-14 bg-white border-b border-gray-200 flex items-center gap-2 px-3 sm:px-5 shrink-0 shadow-sm">
          {/* Mobile hamburger */}
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            className="lg:hidden p-2 -ml-1 rounded-xl hover:bg-gray-100 transition-colors"
            aria-label="Mở menu"
          >
            <Menu size={20} className="text-gray-600" />
          </button>

          {/* Page title */}
          <h1 className="flex-1 text-[15px] sm:text-base font-semibold text-gray-900 truncate">
            {TITLE_MAP[currentPage]}
          </h1>

          {/* Header actions */}
          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              className="relative p-2 rounded-xl hover:bg-gray-100 transition-colors"
              aria-label="Thông báo"
            >
              <Bell size={18} className="text-gray-500" />
              <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-red-500 rounded-full shadow-sm" />
            </button>
            <button
              type="button"
              onClick={() => setSettingsOpen(true)}
              className="p-2 rounded-xl hover:bg-gray-100 transition-colors"
              aria-label="Cài đặt"
            >
              <Settings size={18} className="text-gray-500" />
            </button>
          </div>
        </header>

        {/* Empty state banner */}
        {empty && (
          <div className="mx-3 sm:mx-6 mt-3 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <span>Chưa có dữ liệu. Thử <strong>Dữ liệu mẫu</strong> trên menu hoặc tạo dây hụi / thành viên.</span>
            <button
              type="button"
              onClick={seedDemo}
              className="shrink-0 px-4 py-2 rounded-lg bg-amber-400 text-slate-900 font-semibold text-sm"
            >
              Tải mẫu ngay
            </button>
          </div>
        )}

        {/* Page content */}
        <main className="flex-1 overflow-auto min-h-0">
          {currentPage === 'dashboard'    && <DashboardPage />}
          {currentPage === 'groups'       && <GroupsPage />}
          {currentPage === 'members'      && <MembersPage />}
          {currentPage === 'keu-hui'      && <KeuHuiPage />}
          {currentPage === 'transactions' && <TransactionsPage />}
          {currentPage === 'reports'      && <ReportsPage />}
        </main>
      </div>

      {/* ── Settings modal ──────────────────────────────────────────────── */}
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
            Ứng dụng lưu cục bộ trên trình duyệt (localStorage). Hãy xuất JSON định kỳ để tránh mất dữ liệu khi xóa cache.
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
          <div className="border-t border-gray-200 pt-4">
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

      {/* ── Reset confirm modal ─────────────────────────────────────────── */}
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
              onClick={() => { resetAll(); setResetConfirm(false); setSettingsOpen(false); }}
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
