import React, { useRef, useState, useEffect, useCallback } from 'react';
import {
  TrendingUp, Users, DollarSign, Bell, Settings,
  LogOut, BarChart3, Database, Hammer, ChevronLeft,
  MoreHorizontal, Menu, X, FileBarChart,
} from 'lucide-react';
import DashboardPage    from './pages/DashboardPage.jsx';
import GroupsPage       from './pages/GroupsPage.jsx';
import MembersPage      from './pages/MembersPage.jsx';
import TransactionsPage from './pages/TransactionsPage.jsx';
import KeuHuiPage       from './pages/KeuHuiPage.jsx';
import ReportsPage      from './pages/ReportsPage.jsx';
import { Modal }        from './components/Modal.jsx';
import { useHuiStore }  from './store/useHuiStore.js';
import { BANKS, buildVietQrUrl } from './lib/banks.js';
import { fetchServerData, pushToServer } from './lib/api.js';
import LoginPage        from './pages/LoginPage.jsx';
import MemberPortal     from './pages/MemberPortal.jsx';
import LogoIcon         from './components/LogoIcon.jsx';

// ── Nav configs ──────────────────────────────────────────────────────────────
const SIDEBAR_NAV = [
  { id: 'dashboard',    label: 'Dashboard',   icon: BarChart3  },
  { id: 'groups',       label: 'Dây Hụi',     icon: Users      },
  { id: 'members',      label: 'Thành Viên',  icon: Users      },
  { id: 'keu-hui',      label: 'Kêu Hụi',     icon: Hammer     },
  { id: 'transactions', label: 'Giao Dịch',   icon: DollarSign },
  { id: 'reports',      label: 'Báo Cáo',     icon: TrendingUp },
];

// Mobile: 5 bottom tabs — "more" opens sheet
const BOTTOM_TABS = [
  { id: 'dashboard',    label: 'Tổng quan', icon: BarChart3             },
  { id: 'groups',       label: 'Dây hụi',   icon: Users                 },
  { id: 'keu-hui',      label: 'Kêu hụi',   icon: Hammer, featured: true},
  { id: 'transactions', label: 'Giao dịch', icon: DollarSign            },
  { id: 'more',         label: 'Thêm',      icon: MoreHorizontal        },
];

// Pages surfaced via the More sheet (not in main bottom tabs)
const MORE_PAGES = new Set(['members', 'reports']);

const TITLE_MAP = {
  dashboard:    'Tổng quan',
  groups:       'Dây hụi',
  members:      'Thành viên',
  'keu-hui':    'Kêu hụi',
  transactions: 'Giao dịch',
  reports:      'Báo cáo',
};

// ── Desktop sidebar ─────────────────────────────────────────────────────────
function Sidebar({ current, onNavigate, open, setOpen, onSeedDemo, onLogout }) {
  const collapsed = !open;
  const FooterBtn = ({ label, Icon, onClick, hoverCls = 'hover:text-slate-200 hover:bg-white/5' }) => (
    <button type="button" onClick={onClick} title={collapsed ? label : undefined}
      className={`relative w-full flex items-center gap-3 rounded-xl transition-all duration-150 group text-slate-400 ${hoverCls}
        ${collapsed ? 'justify-center h-11 px-0' : 'px-3 py-2.5'}`}>
      <Icon size={17} className="shrink-0" />
      {!collapsed && <span className="text-[13px] font-medium truncate">{label}</span>}
      {collapsed && (
        <span className="absolute left-full ml-3 px-2.5 py-1.5 rounded-lg bg-slate-800 text-white text-xs font-medium whitespace-nowrap
          opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity shadow-xl z-50 border border-white/10">
          {label}
        </span>
      )}
    </button>
  );

  return (
    <aside className={`hidden lg:flex flex-col flex-shrink-0 bg-[#0c1322] border-r border-white/5 transition-all duration-300 ${collapsed ? 'w-[68px]' : 'w-64'}`}>
      {/* Toggle + Logo */}
      <div className="flex items-center h-14 border-b border-white/5 relative shrink-0">
        <button type="button" onClick={() => setOpen(!open)} title={collapsed ? 'Mở rộng' : 'Thu gọn'}
          className="absolute left-0 top-0 w-[68px] h-14 flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/5 transition-colors z-10">
          {collapsed ? <Menu size={19} /> : <ChevronLeft size={19} />}
        </button>
        <div className={`flex items-center gap-2.5 pl-[68px] pr-4 overflow-hidden transition-all duration-300 ${collapsed ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
          <LogoIcon size={28} />
          <div>
            <p className="text-[13px] font-bold text-white tracking-wide leading-none">HUI PRO</p>
            <p className="text-[10px] text-slate-500 mt-0.5">Quản lý hụi thông minh</p>
          </div>
        </div>
      </div>

      {/* Nav items */}
      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
        {SIDEBAR_NAV.map(({ id, label, icon: Icon }) => {
          const active = current === id;
          return (
            <button key={id} type="button" onClick={() => onNavigate(id)} title={collapsed ? label : undefined}
              className={`relative w-full flex items-center gap-3 rounded-xl text-left transition-all duration-150 group
                ${collapsed ? 'justify-center h-11 px-0' : 'px-3 py-2.5'}
                ${active ? 'bg-amber-500/12 text-amber-400' : 'text-slate-400 hover:text-slate-100 hover:bg-white/5'}`}>
              {active && <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-amber-400 rounded-r-full" />}
              <Icon size={18} className={`shrink-0 ${active ? 'text-amber-400' : 'text-slate-500 group-hover:text-slate-300'}`} />
              {!collapsed && <span className="text-[13.5px] font-medium truncate">{label}</span>}
              {collapsed && (
                <span className="absolute left-full ml-3 px-2.5 py-1.5 rounded-lg bg-slate-800 text-white text-xs font-medium whitespace-nowrap
                  opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity shadow-xl z-50 border border-white/10">
                  {label}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="border-t border-white/5 p-2 space-y-0.5 shrink-0">
        <FooterBtn label="Dữ liệu mẫu" Icon={Database} onClick={onSeedDemo} hoverCls="hover:text-amber-300 hover:bg-white/5" />
        <FooterBtn label="Đăng xuất"   Icon={LogOut}   onClick={onLogout}   hoverCls="hover:text-red-400 hover:bg-red-500/8" />
      </div>
    </aside>
  );
}

// ── Mobile: top header ──────────────────────────────────────────────────────
function MobileHeader({ title, onSettings }) {
  return (
    <header className="lg:hidden fixed top-0 inset-x-0 z-20 h-14 bg-white border-b border-gray-100 flex items-center px-4 gap-3 shadow-sm">
      {/* Brand */}
      <div className="flex items-center gap-2 mr-auto">
        <LogoIcon size={32} />
        <span className="text-[15px] font-bold text-gray-900 tracking-tight">{title}</span>
      </div>

      {/* Actions */}
      <button type="button" className="relative p-2 rounded-xl hover:bg-gray-100 active:bg-gray-200 transition-colors">
        <Bell size={19} className="text-gray-500" />
        <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-red-500 rounded-full" />
      </button>
      <button type="button" onClick={onSettings} className="p-2 rounded-xl hover:bg-gray-100 active:bg-gray-200 transition-colors">
        <Settings size={19} className="text-gray-500" />
      </button>
    </header>
  );
}

// ── Mobile: bottom nav ──────────────────────────────────────────────────────
function BottomNav({ current, onNavigate, onMoreOpen }) {
  const isMoreActive = MORE_PAGES.has(current);

  return (
    <nav className="lg:hidden fixed bottom-0 inset-x-0 z-20 bg-white border-t border-gray-100 shadow-[0_-4px_20px_rgba(0,0,0,0.06)]"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
      <div className="flex items-end h-[60px] px-2">
        {BOTTOM_TABS.map(({ id, label, icon: Icon, featured }) => {
          if (featured) {
            // Elevated centre FAB-style button
            const active = current === id;
            return (
              <button key={id} type="button" onClick={() => onNavigate(id)}
                className="flex-1 flex flex-col items-center pb-1 -translate-y-3 gap-1 focus:outline-none">
                <div className={`w-[54px] h-[54px] rounded-full flex items-center justify-center shadow-lg transition-all
                  ${active
                    ? 'bg-gradient-to-br from-amber-400 to-orange-500 shadow-amber-400/50 ring-4 ring-white scale-105'
                    : 'bg-gradient-to-br from-amber-400 to-orange-500 shadow-amber-400/35 ring-4 ring-white'
                  }`}>
                  <Icon size={24} className="text-white" strokeWidth={2.2} />
                </div>
                <span className={`text-[10px] font-bold leading-none ${active ? 'text-amber-500' : 'text-gray-400'}`}>
                  {label}
                </span>
              </button>
            );
          }

          if (id === 'more') {
            return (
              <button key={id} type="button" onClick={onMoreOpen}
                className="flex-1 flex flex-col items-center justify-center gap-1.5 h-full focus:outline-none">
                <MoreHorizontal size={22} className={isMoreActive ? 'text-amber-500' : 'text-gray-400'} strokeWidth={2} />
                <span className={`text-[10px] font-semibold leading-none ${isMoreActive ? 'text-amber-500' : 'text-gray-400'}`}>
                  Thêm
                </span>
              </button>
            );
          }

          const active = current === id;
          return (
            <button key={id} type="button" onClick={() => onNavigate(id)}
              className="flex-1 flex flex-col items-center justify-center gap-1.5 h-full focus:outline-none group">
              <div className={`w-7 h-7 flex items-center justify-center rounded-xl transition-all duration-150 ${active ? 'bg-amber-50' : ''}`}>
                <Icon size={20} className={active ? 'text-amber-500' : 'text-gray-400'} strokeWidth={active ? 2.2 : 1.8} />
              </div>
              <span className={`text-[10px] font-semibold leading-none transition-colors ${active ? 'text-amber-500' : 'text-gray-400'}`}>
                {label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}

// ── Mobile: More bottom sheet ───────────────────────────────────────────────
function MoreSheet({ open, onClose, onNavigate, currentPage, onSeedDemo, onLogout, onSettings }) {
  const Row = ({ id, label, Icon, desc, iconBg, iconColor, onClick, labelColor = 'text-gray-900' }) => (
    <button type="button" onClick={onClick}
      className="w-full flex items-center gap-4 px-4 py-3.5 active:bg-gray-50 transition-colors text-left rounded-2xl">
      <div className={`w-11 h-11 rounded-2xl ${iconBg} flex items-center justify-center shrink-0`}>
        <Icon size={20} className={iconColor} />
      </div>
      <div className="flex-1 min-w-0">
        <p className={`text-[14px] font-semibold ${labelColor}`}>{label}</p>
        {desc && <p className="text-[12px] text-gray-400 mt-0.5 truncate">{desc}</p>}
      </div>
      {id && MORE_PAGES.has(id) && currentPage === id && (
        <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
      )}
    </button>
  );

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-30 lg:hidden transition-all duration-300 ${open ? 'bg-black/50 backdrop-blur-sm pointer-events-auto' : 'bg-transparent pointer-events-none'}`}
        onClick={onClose}
      />
      {/* Sheet */}
      <div className={`fixed bottom-0 inset-x-0 z-40 lg:hidden bg-white rounded-t-[28px] shadow-2xl transition-transform duration-[380ms] ease-[cubic-bezier(0.32,0.72,0,1)]
        ${open ? 'translate-y-0' : 'translate-y-full'}`}
        style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>

        {/* Pull handle */}
        <div className="flex justify-center pt-3 pb-4">
          <div className="w-9 h-1 rounded-full bg-gray-200" />
        </div>

        {/* Sheet header */}
        <div className="flex items-center justify-between px-5 pb-3">
          <p className="text-[16px] font-bold text-gray-900">Menu</p>
          <button type="button" onClick={onClose} className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
            <X size={15} className="text-gray-500" />
          </button>
        </div>

        {/* Primary nav items */}
        <div className="px-2 pb-1">
          <Row id="members" label="Thành Viên" Icon={Users}       desc="Quản lý danh sách hụi viên" iconBg="bg-violet-50" iconColor="text-violet-500"
            onClick={() => { onNavigate('members'); onClose(); }} />
          <Row id="reports" label="Báo Cáo"    Icon={FileBarChart} desc="Thống kê tài chính hụi"      iconBg="bg-blue-50"   iconColor="text-blue-500"
            onClick={() => { onNavigate('reports'); onClose(); }} />
        </div>

        {/* Divider */}
        <div className="mx-5 border-t border-gray-100 my-2" />

        {/* Utility items */}
        <div className="px-2 pb-1">
          <Row label="Dữ liệu mẫu" Icon={Database} desc="Nạp dữ liệu demo để thử nghiệm" iconBg="bg-emerald-50" iconColor="text-emerald-500"
            onClick={() => { onSeedDemo(); onClose(); }} />
          <Row label="Sao lưu dữ liệu" Icon={Settings} desc="Xuất / nhập backup JSON" iconBg="bg-gray-100" iconColor="text-gray-500"
            onClick={() => { onSettings(); onClose(); }} />
        </div>

        {/* Divider */}
        <div className="mx-5 border-t border-gray-100 my-2" />

        {/* Logout */}
        <div className="px-2 pb-4">
          <Row label="Đăng xuất" Icon={LogOut} desc="Thoát khỏi tài khoản hiện tại" iconBg="bg-red-50" iconColor="text-red-400"
            labelColor="text-red-500" onClick={() => { onLogout(); onClose(); }} />
        </div>
      </div>
    </>
  );
}

// ── Desktop top header ──────────────────────────────────────────────────────
function DesktopHeader({ title, onSettings }) {
  return (
    <header className="hidden lg:flex h-14 bg-white border-b border-gray-200 items-center gap-3 px-5 shrink-0 shadow-sm">
      <h1 className="flex-1 text-[15px] font-semibold text-gray-900 truncate">{title}</h1>
      <div className="flex items-center gap-1 shrink-0">
        <button type="button" className="relative p-2 rounded-xl hover:bg-gray-100 transition-colors">
          <Bell size={18} className="text-gray-500" />
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-red-500 rounded-full" />
        </button>
        <button type="button" onClick={onSettings} className="p-2 rounded-xl hover:bg-gray-100 transition-colors">
          <Settings size={18} className="text-gray-500" />
        </button>
      </div>
    </header>
  );
}

// ── Main App ─────────────────────────────────────────────────────────────────
export default function App() {
  const [currentPage,  setCurrentPage]  = useState('dashboard');
  const [sidebarOpen,  setSidebarOpen]  = useState(true);
  const [moreOpen,     setMoreOpen]     = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [resetConfirm, setResetConfirm] = useState(false);
  const fileRef = useRef(null);
  const qrRef   = useRef(null);

  const groups          = useHuiStore((s) => s.groups);
  const members         = useHuiStore((s) => s.members);
  const seedDemo        = useHuiStore((s) => s.seedDemo);
  const exportBundle    = useHuiStore((s) => s.exportBundle);
  const importBundle    = useHuiStore((s) => s.importBundle);
  const resetAll        = useHuiStore((s) => s.resetAll);
  const bankSettings    = useHuiStore((s) => s.bankSettings);
  const setBankSettings = useHuiStore((s) => s.setBankSettings);

  const [authedAs, setAuthedAs] = useState(() => sessionStorage.getItem('hui-authed'));
  const doLogin  = (key) => { sessionStorage.setItem('hui-authed', key); setAuthedAs(key); };
  const doLogout = () => { sessionStorage.removeItem('hui-authed'); setAuthedAs(null); };

  // ── Sync status: 'idle' | 'saving' | 'synced' | 'offline' ───────────
  const [syncStatus, setSyncStatus] = useState('idle');
  const syncClearRef = useRef(null);

  const markSynced = useCallback(() => {
    setSyncStatus('synced');
    clearTimeout(syncClearRef.current);
    syncClearRef.current = setTimeout(() => setSyncStatus('idle'), 3000);
  }, []);

  // ── IDB hydration ─────────────────────────────────────────────────────
  const [hydrated, setHydrated] = useState(() => useHuiStore.persist.hasHydrated());
  useEffect(() => {
    if (!hydrated) {
      return useHuiStore.persist.onFinishHydration(() => setHydrated(true));
    }
  }, [hydrated]);

  // ── On hydration: fetch server data (server = source of truth) ────────
  useEffect(() => {
    if (!hydrated) return;
    let cancelled = false;
    (async () => {
      const serverData = await fetchServerData();
      if (cancelled) return;
      if (serverData && serverData.groups) {
        // Server has data → import (overrides local IDB cache)
        useHuiStore.getState().importBundle(serverData);
      } else if (serverData === null) {
        // Server reachable but empty → push local data to initialise server
        const local = useHuiStore.getState().exportBundle();
        if (local.groups?.length > 0) {
          const ok = await pushToServer(local);
          if (!cancelled && ok) markSynced();
        }
      }
      // serverData === undefined → server unreachable, keep IDB data, show offline
      if (!cancelled && serverData === undefined) setSyncStatus('offline');
    })();
    return () => { cancelled = true; };
  }, [hydrated, markSynced]);

  // ── Auto-save: debounced push on every store change ───────────────────
  useEffect(() => {
    let saveTimer;
    const unsub = useHuiStore.subscribe((state) => {
      // Skip if page is about to reload (logo click) or store not yet ready
      if (!state.initialized || window.__huiReloading) return;
      clearTimeout(saveTimer);
      setSyncStatus('saving');
      saveTimer = setTimeout(async () => {
        const bundle = useHuiStore.getState().exportBundle();
        const ok = await pushToServer(bundle);
        if (ok) markSynced(); else setSyncStatus('offline');
      }, 1500);
    });
    return () => { unsub(); clearTimeout(saveTimer); };
  }, [markSynced]);

  // Close more sheet on desktop resize
  useEffect(() => {
    const fn = () => { if (window.innerWidth >= 1024) setMoreOpen(false); };
    window.addEventListener('resize', fn);
    return () => window.removeEventListener('resize', fn);
  }, []);

  const navigate = (id) => { setCurrentPage(id); setMoreOpen(false); };

  const downloadJson = () => {
    const bundle = exportBundle();
    const blob = new Blob([JSON.stringify(bundle, null, 2)], { type: 'application/json' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url; a.download = `hui-backup-${Date.now()}.json`; a.click();
    URL.revokeObjectURL(url);
  };

  const onPickQr = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setBankSettings({ qrImageDataUrl: ev.target.result });
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const onPickImport = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try { importBundle(JSON.parse(await file.text())); }
    catch { alert('Không đọc được file JSON. Kiểm tra định dạng.'); }
    e.target.value = '';
    setSettingsOpen(false);
  };

  // Show loading spinner while IndexedDB finishes hydrating
  if (!hydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-amber-400 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-gray-500">Đang tải dữ liệu...</p>
        </div>
      </div>
    );
  }

  if (!authedAs)            return <LoginPage onSuccess={doLogin} />;
  if (authedAs !== 'admin') return <MemberPortal memberId={authedAs} onLogout={doLogout} />;

  const empty     = groups.length === 0 && members.length === 0;
  const pageTitle = TITLE_MAP[currentPage] ?? 'Dashboard';

  return (
    <>
      {/* ── Mobile layout ─────────────────────────────────────────────── */}
      <MobileHeader title={pageTitle} onSettings={() => setSettingsOpen(true)} />

      {/* ── Desktop layout ────────────────────────────────────────────── */}
      <div className="min-h-screen bg-gray-50 flex">
        <Sidebar
          current={currentPage}
          onNavigate={navigate}
          open={sidebarOpen}
          setOpen={setSidebarOpen}
          onSeedDemo={seedDemo}
          onLogout={doLogout}
        />

        {/* Main content column */}
        <div className="flex-1 flex flex-col min-w-0 min-h-screen overflow-hidden">
          <DesktopHeader title={pageTitle} onSettings={() => setSettingsOpen(true)} />

          {/* Empty state */}
          {empty && (
            <div className="mx-3 sm:mx-6 mt-3 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-200
              flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <span>Chưa có dữ liệu. Thử <strong>Dữ liệu mẫu</strong> hoặc tạo dây hụi / thành viên.</span>
              <button type="button" onClick={seedDemo}
                className="shrink-0 px-4 py-2 rounded-lg bg-amber-400 text-slate-900 font-semibold text-sm">
                Tải mẫu ngay
              </button>
            </div>
          )}

          {/* Pages */}
          <main className="flex-1 overflow-auto min-h-0 pt-14 lg:pt-0 pb-24 lg:pb-0">
            {currentPage === 'dashboard'    && <DashboardPage />}
            {currentPage === 'groups'       && <GroupsPage />}
            {currentPage === 'members'      && <MembersPage />}
            {currentPage === 'keu-hui'      && <KeuHuiPage />}
            {currentPage === 'transactions' && <TransactionsPage />}
            {currentPage === 'reports'      && <ReportsPage />}
          </main>
        </div>
      </div>

      {/* ── Mobile: bottom nav + more sheet ───────────────────────────── */}
      <BottomNav current={currentPage} onNavigate={navigate} onMoreOpen={() => setMoreOpen(true)} />
      <MoreSheet
        open={moreOpen}
        onClose={() => setMoreOpen(false)}
        onNavigate={navigate}
        currentPage={currentPage}
        onSeedDemo={seedDemo}
        onLogout={doLogout}
        onSettings={() => setSettingsOpen(true)}
      />

      {/* ── Settings modal ─────────────────────────────────────────────── */}
      <Modal open={settingsOpen} onClose={() => setSettingsOpen(false)} title="Cài đặt &amp; sao lưu" wide
        footer={
          <button type="button" onClick={() => setSettingsOpen(false)} className="px-4 py-2 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 text-sm">
            Đóng
          </button>
        }
      >
        <div className="space-y-6 text-sm text-gray-700">

          {/* ── QR / Ngân hàng ── */}
          <div className="space-y-3">
            <h3 className="font-semibold text-gray-900">QR &amp; Thông tin thanh toán</h3>
            <p className="text-xs text-gray-500">Hiển thị cho thành viên khi cần chuyển khoản góp hụi.</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label className="block space-y-1">
                <span className="text-xs text-gray-600">Ngân hàng</span>
                <select
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 text-sm bg-white"
                  value={bankSettings.bankId}
                  onChange={(e) => setBankSettings({ bankId: e.target.value })}
                >
                  <option value="">— Chọn ngân hàng —</option>
                  {BANKS.map((b) => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
              </label>
              <label className="block space-y-1">
                <span className="text-xs text-gray-600">Số tài khoản</span>
                <input
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 text-sm"
                  placeholder="VD: 1234567890"
                  value={bankSettings.accountNo}
                  onChange={(e) => setBankSettings({ accountNo: e.target.value })}
                />
              </label>
              <label className="block space-y-1 sm:col-span-2">
                <span className="text-xs text-gray-600">Tên chủ tài khoản</span>
                <input
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 text-sm"
                  placeholder="VD: NGUYEN VAN A"
                  value={bankSettings.accountName}
                  onChange={(e) => setBankSettings({ accountName: e.target.value })}
                />
              </label>
            </div>
            <div className="flex items-start gap-4">
              <div className="flex-1 space-y-2">
                <span className="text-xs text-gray-600">Ảnh QR thanh toán</span>
                <div className="flex gap-2">
                  <button type="button" onClick={() => qrRef.current?.click()}
                    className="px-3 py-2 rounded-lg bg-white border border-gray-300 text-gray-700 text-sm hover:bg-gray-50">
                    {bankSettings.qrImageDataUrl ? 'Thay ảnh QR' : 'Tải ảnh QR lên'}
                  </button>
                  {bankSettings.qrImageDataUrl && (
                    <button type="button" onClick={() => setBankSettings({ qrImageDataUrl: '' })}
                      className="px-3 py-2 rounded-lg bg-red-50 border border-red-200 text-red-500 text-sm hover:bg-red-100">
                      Xóa
                    </button>
                  )}
                  <input ref={qrRef} type="file" accept="image/*" className="hidden" onChange={onPickQr} />
                </div>
                <p className="text-xs text-gray-400">PNG/JPG. Ảnh QR từ app ngân hàng của bạn.</p>
              </div>
              {bankSettings.qrImageDataUrl && (
                <img src={bankSettings.qrImageDataUrl} alt="QR" className="w-24 h-24 object-contain rounded-lg border border-gray-200 shrink-0" />
              )}
            </div>
          </div>

          {/* ── QR Preview ── */}
          {(() => {
            const previewUrl = buildVietQrUrl({
              bankId:      bankSettings.bankId,
              accountNo:   bankSettings.accountNo,
              accountName: bankSettings.accountName,
              amount:      100000,
              addInfo:     'Gop hui ky 1',
            });
            if (!previewUrl) return null;
            return (
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 space-y-2">
                <p className="text-xs font-semibold text-amber-800">Xem trước QR (mẫu · 100.000đ · kỳ 1)</p>
                <div className="flex gap-4 items-start">
                  <img
                    src={previewUrl}
                    alt="Preview QR"
                    className="w-full max-w-[180px] object-contain rounded-lg border border-amber-200"
                  />
                  <div className="space-y-1 text-xs text-gray-600 pt-1">
                    <p>Thành viên quét QR này → app ngân hàng tự điền:</p>
                    <ul className="space-y-1 mt-1">
                      <li>• Số tài khoản</li>
                      <li>• Số tiền đóng hụi</li>
                      <li>• Nội dung chuyển khoản</li>
                    </ul>
                    <p className="text-amber-700 mt-2">QR thực tế sẽ điền đúng số tiền và kỳ của từng dây hụi.</p>
                  </div>
                </div>
              </div>
            );
          })()}

          <div className="border-t border-gray-200" />

          {/* ── Backup ── */}
          <div className="space-y-3">
            <h3 className="font-semibold text-gray-900">Sao lưu dữ liệu</h3>
            <p className="text-gray-600 text-xs">Dữ liệu lưu trong IndexedDB (có backup localStorage). Xuất JSON định kỳ để giữ bản sao an toàn.</p>
            <div className="flex flex-wrap gap-3">
              <button type="button" onClick={downloadJson}
                className="px-4 py-2 rounded-lg bg-gradient-to-r from-amber-400 to-orange-500 text-slate-900 font-semibold text-sm">
                Xuất backup JSON
              </button>
              <button type="button" onClick={() => fileRef.current?.click()}
                className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-sm border border-slate-600">
                Nhập backup JSON
              </button>
              <input ref={fileRef} type="file" accept="application/json,.json" className="hidden" onChange={onPickImport} />
            </div>
          </div>

          <div className="border-t border-gray-200 pt-1">
            <button type="button" onClick={() => setResetConfirm(true)}
              className="px-4 py-2 rounded-lg bg-red-50 text-red-500 hover:bg-red-100 border border-red-200 text-sm">
              Xóa toàn bộ dữ liệu
            </button>
          </div>
        </div>
      </Modal>

      {/* ── Reset confirm modal ─────────────────────────────────────────── */}
      <Modal open={resetConfirm} onClose={() => setResetConfirm(false)} title="Xóa toàn bộ?"
        footer={
          <>
            <button type="button" onClick={() => setResetConfirm(false)} className="px-4 py-2 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 text-sm">Hủy</button>
            <button type="button" onClick={() => { resetAll(); setResetConfirm(false); setSettingsOpen(false); }}
              className="px-4 py-2 rounded-lg bg-red-600 text-white text-sm font-medium">Xóa hết</button>
          </>
        }
      >
        <p className="text-sm text-gray-600">Xóa dây hụi, thành viên và giao dịch trên máy này. Nên xuất backup trước khi thử.</p>
      </Modal>

      {/* ── Cloud sync status badge — chỉ hiện khi offline ─────────────── */}
      {syncStatus === 'offline' && (
        <div className="fixed bottom-20 lg:bottom-4 right-4 z-50 flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full shadow border bg-red-50 border-red-200 text-red-600">
          ⚠ Offline — chưa lưu được
        </div>
      )}
    </>
  );
}
