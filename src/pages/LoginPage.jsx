import React, { useState } from 'react';
import {
  Eye, EyeOff, Lock, Phone, ChevronLeft,
  Shield, User, ArrowRight, CheckCircle2,
  BarChart3, Users, DollarSign,
} from 'lucide-react';
import { useHuiStore } from '../store/useHuiStore.js';
import { hashPassword, verifyPassword } from '../lib/auth.js';

// ── Shared input component ────────────────────────────────────────────────────
function Input({ icon: Icon, right, ...props }) {
  return (
    <div className="relative">
      {Icon && (
        <Icon size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
      )}
      <input
        {...props}
        className={`w-full rounded-xl border border-gray-200 bg-gray-50 text-gray-900 text-sm
          py-3 pr-4 focus:outline-none focus:border-amber-400 focus:bg-white focus:ring-2 focus:ring-amber-400/20
          placeholder:text-gray-400 transition-all
          ${Icon ? 'pl-10' : 'pl-4'}
          ${right ? 'pr-11' : ''}`}
      />
      {right}
    </div>
  );
}

// ── Eye toggle button ─────────────────────────────────────────────────────────
function EyeBtn({ show, onToggle }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
      tabIndex={-1}
    >
      {show ? <EyeOff size={16} /> : <Eye size={16} />}
    </button>
  );
}

// ── Error message ─────────────────────────────────────────────────────────────
function ErrorMsg({ msg }) {
  if (!msg) return null;
  return (
    <div className="flex items-center gap-2 rounded-lg bg-red-50 border border-red-200 px-3 py-2.5 text-xs text-red-600">
      <Lock size={12} className="shrink-0" />
      {msg}
    </div>
  );
}

// ── Back button ───────────────────────────────────────────────────────────────
function BackBtn({ onClick, label }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-700 transition-colors mb-1"
    >
      <ChevronLeft size={15} />
      {label ?? 'Quay lại'}
    </button>
  );
}

// ── Role picker ───────────────────────────────────────────────────────────────
function RolePicker({ onPick }) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Chào mừng trở lại</h2>
        <p className="text-sm text-gray-500 mt-1">Chọn vai trò để tiếp tục đăng nhập</p>
      </div>

      <div className="space-y-3">
        <button
          type="button"
          onClick={() => onPick('admin')}
          className="w-full group flex items-center gap-4 p-4 rounded-2xl border-2 border-gray-100
            hover:border-amber-300 hover:bg-gradient-to-r hover:from-amber-50 hover:to-orange-50
            transition-all duration-200 text-left"
        >
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500
            flex items-center justify-center shrink-0 shadow-sm group-hover:shadow-md transition-shadow">
            <Shield size={22} className="text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-gray-900 text-sm">Quản trị viên</p>
            <p className="text-xs text-gray-400 mt-0.5">Toàn quyền quản lý hệ thống</p>
          </div>
          <ArrowRight size={16} className="text-gray-300 group-hover:text-amber-400 group-hover:translate-x-0.5 transition-all" />
        </button>

        <button
          type="button"
          onClick={() => onPick('member')}
          className="w-full group flex items-center gap-4 p-4 rounded-2xl border-2 border-gray-100
            hover:border-blue-300 hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50
            transition-all duration-200 text-left"
        >
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600
            flex items-center justify-center shrink-0 shadow-sm group-hover:shadow-md transition-shadow">
            <User size={22} className="text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-gray-900 text-sm">Thành viên hụi</p>
            <p className="text-xs text-gray-400 mt-0.5">Xem lịch sử & trạng thái dây hụi</p>
          </div>
          <ArrowRight size={16} className="text-gray-300 group-hover:text-blue-400 group-hover:translate-x-0.5 transition-all" />
        </button>
      </div>
    </div>
  );
}

// ── Admin login ───────────────────────────────────────────────────────────────
function AdminLogin({ onSuccess, onBack }) {
  const adminPasswordHash = useHuiStore((s) => s.adminPasswordHash);
  const setAdminPasswordHash = useHuiStore((s) => s.setAdminPasswordHash);
  const isSetup = !adminPasswordHash;

  const [pw, setPw] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    if (isSetup) {
      if (pw.length < 6) { setError('Mật khẩu tối thiểu 6 ký tự'); return; }
      if (pw !== confirm) { setError('Mật khẩu xác nhận không khớp'); return; }
      setAdminPasswordHash(hashPassword(pw));
      onSuccess('admin');
    } else {
      if (!verifyPassword(pw, adminPasswordHash)) { setError('Mật khẩu không đúng'); return; }
      onSuccess('admin');
    }
  };

  return (
    <div className="space-y-5">
      <BackBtn onClick={onBack} />

      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-sm">
          <Shield size={18} className="text-white" />
        </div>
        <div>
          <h2 className="font-bold text-gray-900 text-base">Quản trị viên</h2>
          <p className="text-xs text-gray-400">
            {isSetup ? 'Thiết lập mật khẩu lần đầu' : 'Nhập mật khẩu để tiếp tục'}
          </p>
        </div>
      </div>

      {isSetup && (
        <div className="flex items-start gap-2 rounded-xl bg-amber-50 border border-amber-200 px-3.5 py-3 text-xs text-amber-700">
          <CheckCircle2 size={14} className="shrink-0 mt-0.5" />
          <span>Đây là lần đăng nhập đầu tiên. Hãy tạo mật khẩu bảo mật cho tài khoản quản trị.</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-gray-600">Mật khẩu</label>
          <div className="relative">
            <Input
              icon={Lock}
              type={showPw ? 'text' : 'password'}
              value={pw}
              onChange={(e) => setPw(e.target.value)}
              placeholder={isSetup ? 'Tạo mật khẩu (tối thiểu 6 ký tự)' : 'Nhập mật khẩu'}
              autoFocus
              right={<EyeBtn show={showPw} onToggle={() => setShowPw(!showPw)} />}
            />
          </div>
        </div>

        {isSetup && (
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-gray-600">Xác nhận mật khẩu</label>
            <div className="relative">
              <Input
                icon={Lock}
                type={showPw ? 'text' : 'password'}
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="Nhập lại mật khẩu"
                right={<EyeBtn show={showPw} onToggle={() => setShowPw(!showPw)} />}
              />
            </div>
          </div>
        )}

        <ErrorMsg msg={error} />

        <button
          type="submit"
          className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-400 to-orange-500
            text-slate-900 font-semibold text-sm shadow-sm hover:shadow-md hover:from-amber-300 hover:to-orange-400
            transition-all duration-200 flex items-center justify-center gap-2"
        >
          {isSetup ? 'Tạo mật khẩu & Đăng nhập' : 'Đăng nhập'}
          <ArrowRight size={15} />
        </button>
      </form>
    </div>
  );
}

// ── Member login ──────────────────────────────────────────────────────────────
function MemberLogin({ onSuccess, onBack }) {
  const members = useHuiStore((s) => s.members);
  const memberPasswords = useHuiStore((s) => s.memberPasswords);
  const setMemberPassword = useHuiStore((s) => s.setMemberPassword);

  const [step, setStep] = useState('phone');
  const [phone, setPhone] = useState('');
  const [found, setFound] = useState(null);
  const [pw, setPw] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');

  const handlePhoneSubmit = (e) => {
    e.preventDefault();
    setError('');
    const clean = phone.trim().replace(/\s+/g, '');
    const member = members.find((m) => m.phone && m.phone.replace(/\s+/g, '') === clean);
    if (!member) { setError('Không tìm thấy thành viên với số điện thoại này.'); return; }
    setFound(member);
    setStep('password');
    setPw('');
    setConfirm('');
  };

  const isSetup = found && !memberPasswords[found.id];

  const handlePasswordSubmit = (e) => {
    e.preventDefault();
    setError('');
    if (isSetup) {
      if (pw.length < 6) { setError('Mật khẩu tối thiểu 6 ký tự'); return; }
      if (pw !== confirm) { setError('Mật khẩu xác nhận không khớp'); return; }
      setMemberPassword(found.id, hashPassword(pw));
      onSuccess(found.id);
    } else {
      if (!verifyPassword(pw, memberPasswords[found.id])) { setError('Mật khẩu không đúng'); return; }
      onSuccess(found.id);
    }
  };

  return (
    <div className="space-y-5">
      <BackBtn onClick={() => { if (step === 'password') { setStep('phone'); setError(''); } else onBack(); }} />

      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-sm">
          <User size={18} className="text-white" />
        </div>
        <div>
          <h2 className="font-bold text-gray-900 text-base">
            {found ? found.name : 'Thành viên hụi'}
          </h2>
          <p className="text-xs text-gray-400">
            {step === 'phone' ? 'Nhập số điện thoại đã đăng ký' : found?.phone}
          </p>
        </div>
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-2">
        {['phone', 'password'].map((s, i) => (
          <React.Fragment key={s}>
            <div className={`flex items-center gap-1.5 text-xs font-medium transition-colors ${
              step === s ? 'text-blue-600' : step === 'password' && i === 0 ? 'text-green-600' : 'text-gray-300'
            }`}>
              <div className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                step === 'password' && i === 0
                  ? 'bg-green-100 text-green-600 border border-green-300'
                  : step === s
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-400'
              }`}>
                {step === 'password' && i === 0 ? <CheckCircle2 size={12} /> : i + 1}
              </div>
              <span className="hidden sm:inline">{i === 0 ? 'Số điện thoại' : 'Mật khẩu'}</span>
            </div>
            {i === 0 && <div className="flex-1 h-px bg-gray-200" />}
          </React.Fragment>
        ))}
      </div>

      {step === 'phone' && (
        <form onSubmit={handlePhoneSubmit} className="space-y-3">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-gray-600">Số điện thoại đã đăng ký</label>
            <Input
              icon={Phone}
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Vd: 0901 234 567"
              autoFocus
            />
          </div>
          <ErrorMsg msg={error} />
          <button
            type="submit"
            className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600
              text-white font-semibold text-sm shadow-sm hover:shadow-md hover:from-blue-400 hover:to-indigo-500
              transition-all duration-200 flex items-center justify-center gap-2"
          >
            Tiếp tục <ArrowRight size={15} />
          </button>
        </form>
      )}

      {step === 'password' && found && (
        <form onSubmit={handlePasswordSubmit} className="space-y-3">
          {isSetup && (
            <div className="flex items-start gap-2 rounded-xl bg-blue-50 border border-blue-200 px-3.5 py-3 text-xs text-blue-700">
              <CheckCircle2 size={14} className="shrink-0 mt-0.5" />
              <span>Lần đầu đăng nhập. Hãy tạo mật khẩu riêng để bảo vệ tài khoản.</span>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-gray-600">Mật khẩu</label>
            <div className="relative">
              <Input
                icon={Lock}
                type={showPw ? 'text' : 'password'}
                value={pw}
                onChange={(e) => setPw(e.target.value)}
                placeholder={isSetup ? 'Tạo mật khẩu (tối thiểu 6 ký tự)' : 'Nhập mật khẩu'}
                autoFocus
                right={<EyeBtn show={showPw} onToggle={() => setShowPw(!showPw)} />}
              />
            </div>
          </div>

          {isSetup && (
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-gray-600">Xác nhận mật khẩu</label>
              <div className="relative">
                <Input
                  icon={Lock}
                  type={showPw ? 'text' : 'password'}
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  placeholder="Nhập lại mật khẩu"
                  right={<EyeBtn show={showPw} onToggle={() => setShowPw(!showPw)} />}
                />
              </div>
            </div>
          )}

          <ErrorMsg msg={error} />

          <button
            type="submit"
            className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600
              text-white font-semibold text-sm shadow-sm hover:shadow-md hover:from-blue-400 hover:to-indigo-500
              transition-all duration-200 flex items-center justify-center gap-2"
          >
            {isSetup ? 'Tạo mật khẩu & Đăng nhập' : 'Đăng nhập'}
            <ArrowRight size={15} />
          </button>
        </form>
      )}
    </div>
  );
}

// ── Left branding panel ───────────────────────────────────────────────────────
function BrandPanel() {
  const features = [
    { icon: Users,     text: 'Quản lý nhiều dây hụi cùng lúc' },
    { icon: DollarSign, text: 'Theo dõi thu chi minh bạch, rõ ràng' },
    { icon: BarChart3,  text: 'Báo cáo lãi suất & thống kê tức thì' },
  ];

  return (
    <div className="relative hidden lg:flex flex-col justify-between p-10 overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Decorative blobs */}
      <div className="absolute -top-24 -left-24 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -right-16 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-amber-400/5 rounded-full blur-2xl pointer-events-none" />

      {/* Logo */}
      <div className="relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg">
            <span className="text-white font-bold text-2xl leading-none">H</span>
          </div>
          <div>
            <p className="text-white font-bold text-xl tracking-wide">HUI PRO</p>
            <p className="text-amber-400/70 text-xs tracking-widest uppercase">Management System</p>
          </div>
        </div>
      </div>

      {/* Center content */}
      <div className="relative z-10 space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-white leading-snug">
            Quản lý hụi<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-400">
              thông minh & minh bạch
            </span>
          </h1>
          <p className="text-slate-400 text-sm mt-3 leading-relaxed">
            Nền tảng quản lý hụi hiện đại, giúp chủ hụi và thành viên theo dõi mọi giao dịch dễ dàng.
          </p>
        </div>

        <div className="space-y-4">
          {features.map(({ icon: Icon, text }) => (
            <div key={text} className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-amber-400/10 border border-amber-400/20 flex items-center justify-center shrink-0">
                <Icon size={15} className="text-amber-400" />
              </div>
              <span className="text-slate-300 text-sm">{text}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="relative z-10">
        <p className="text-slate-600 text-xs">© 2025 Hui Pro · Dữ liệu lưu cục bộ, bảo mật tuyệt đối</p>
      </div>
    </div>
  );
}

// ── Root ──────────────────────────────────────────────────────────────────────
export default function LoginPage({ onSuccess }) {
  const [role, setRole] = useState(null);

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Left branding panel — desktop only */}
      <div className="w-[480px] shrink-0">
        <BrandPanel />
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 sm:p-10">
        {/* Mobile logo */}
        <div className="lg:hidden flex flex-col items-center gap-2 mb-8">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg">
            <span className="text-white font-bold text-2xl">H</span>
          </div>
          <p className="font-bold text-gray-900 text-xl">HUI PRO</p>
        </div>

        <div className="w-full max-w-sm">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-xl shadow-gray-200/60 p-8">
            {role === null && <RolePicker onPick={setRole} />}
            {role === 'admin' && <AdminLogin onSuccess={onSuccess} onBack={() => setRole(null)} />}
            {role === 'member' && <MemberLogin onSuccess={onSuccess} onBack={() => setRole(null)} />}
          </div>

          <p className="text-center text-xs text-gray-400 mt-6">
            Dữ liệu được lưu trên thiết bị của bạn · Không chia sẻ với bên thứ ba
          </p>
        </div>
      </div>
    </div>
  );
}
