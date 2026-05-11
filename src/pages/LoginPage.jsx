import React, { useState } from 'react';
import { Eye, EyeOff, Lock, Phone, ChevronLeft } from 'lucide-react';
import { useHuiStore } from '../store/useHuiStore.js';
import { hashPassword, verifyPassword } from '../lib/auth.js';

// ── Role picker ───────────────────────────────────────────────────────────────
function RolePicker({ onPick }) {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-lg font-bold text-gray-900">Chọn vai đăng nhập</h2>
        <p className="text-sm text-gray-500 mt-1">Bạn là quản trị viên hay thành viên hụi?</p>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => onPick('admin')}
          className="flex flex-col items-center gap-3 p-5 rounded-xl border-2 border-gray-200 hover:border-amber-400 hover:bg-amber-50 transition-all group"
        >
          <span className="text-3xl">👑</span>
          <div className="text-center">
            <p className="font-semibold text-gray-900 text-sm group-hover:text-amber-700">Quản trị viên</p>
            <p className="text-xs text-gray-400 mt-0.5">Quản lý toàn bộ hệ thống</p>
          </div>
        </button>
        <button
          type="button"
          onClick={() => onPick('member')}
          className="flex flex-col items-center gap-3 p-5 rounded-xl border-2 border-gray-200 hover:border-blue-400 hover:bg-blue-50 transition-all group"
        >
          <span className="text-3xl">👤</span>
          <div className="text-center">
            <p className="font-semibold text-gray-900 text-sm group-hover:text-blue-700">Thành viên hụi</p>
            <p className="text-xs text-gray-400 mt-0.5">Xem dây hụi cá nhân</p>
          </div>
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
      <div className="flex items-center gap-3">
        <button type="button" onClick={onBack} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400">
          <ChevronLeft size={18} />
        </button>
        <div>
          <p className="text-xs text-gray-500">Vai</p>
          <p className="font-semibold text-gray-900 text-sm">👑 Quản trị viên</p>
        </div>
      </div>

      <p className="text-sm text-gray-500">
        {isSetup ? 'Thiết lập mật khẩu quản trị lần đầu.' : 'Nhập mật khẩu để tiếp tục.'}
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1">
          <label className="text-xs text-gray-600 font-medium">Mật khẩu</label>
          <div className="relative">
            <input
              type={showPw ? 'text' : 'password'}
              value={pw}
              onChange={(e) => setPw(e.target.value)}
              placeholder={isSetup ? 'Tạo mật khẩu (tối thiểu 6 ký tự)' : 'Nhập mật khẩu'}
              autoFocus
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 pr-10 text-gray-900 text-sm focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20"
            />
            <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>

        {isSetup && (
          <div className="space-y-1">
            <label className="text-xs text-gray-600 font-medium">Xác nhận mật khẩu</label>
            <input
              type={showPw ? 'text' : 'password'}
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="Nhập lại mật khẩu"
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-gray-900 text-sm focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20"
            />
          </div>
        )}

        {error && (
          <p className="text-xs text-red-500 flex items-center gap-1"><Lock size={12} />{error}</p>
        )}

        <button
          type="submit"
          className="w-full py-2.5 rounded-lg bg-gradient-to-r from-amber-400 to-orange-500 text-slate-900 font-semibold text-sm hover:shadow-md transition-all"
        >
          {isSetup ? 'Tạo mật khẩu & Vào app' : 'Đăng nhập'}
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

  const [step, setStep] = useState('phone'); // 'phone' | 'password'
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
    if (!member) {
      setError('Không tìm thấy thành viên với số điện thoại này.');
      return;
    }
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
      if (!verifyPassword(pw, memberPasswords[found.id])) {
        setError('Mật khẩu không đúng');
        return;
      }
      onSuccess(found.id);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => { if (step === 'password') { setStep('phone'); setError(''); } else onBack(); }}
          className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400"
        >
          <ChevronLeft size={18} />
        </button>
        <div>
          <p className="text-xs text-gray-500">Vai</p>
          <p className="font-semibold text-gray-900 text-sm">
            👤 Thành viên hụi{found ? ` — ${found.name}` : ''}
          </p>
        </div>
      </div>

      {step === 'phone' && (
        <form onSubmit={handlePhoneSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs text-gray-600 font-medium">Số điện thoại đã đăng ký</label>
            <div className="relative">
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Vd: 0901000001"
                autoFocus
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 pl-10 text-gray-900 text-sm focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20"
              />
              <Phone size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            </div>
          </div>
          {error && <p className="text-xs text-red-500 flex items-center gap-1"><Lock size={12} />{error}</p>}
          <button
            type="submit"
            className="w-full py-2.5 rounded-lg bg-gradient-to-r from-blue-500 to-blue-600 text-white font-semibold text-sm hover:shadow-md transition-all"
          >
            Tiếp tục
          </button>
        </form>
      )}

      {step === 'password' && found && (
        <form onSubmit={handlePasswordSubmit} className="space-y-4">
          <div className="rounded-lg bg-blue-50 border border-blue-200 px-4 py-3 text-sm">
            <p className="text-blue-800 font-medium">{found.name}</p>
            <p className="text-blue-600 text-xs mt-0.5">{found.phone}</p>
          </div>

          <p className="text-xs text-gray-500">
            {isSetup ? 'Lần đầu đăng nhập — hãy tạo mật khẩu riêng của bạn.' : 'Nhập mật khẩu để tiếp tục.'}
          </p>

          <div className="space-y-1">
            <label className="text-xs text-gray-600 font-medium">Mật khẩu</label>
            <div className="relative">
              <input
                type={showPw ? 'text' : 'password'}
                value={pw}
                onChange={(e) => setPw(e.target.value)}
                placeholder={isSetup ? 'Tạo mật khẩu (tối thiểu 6 ký tự)' : 'Nhập mật khẩu'}
                autoFocus
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 pr-10 text-gray-900 text-sm focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20"
              />
              <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {isSetup && (
            <div className="space-y-1">
              <label className="text-xs text-gray-600 font-medium">Xác nhận mật khẩu</label>
              <input
                type={showPw ? 'text' : 'password'}
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="Nhập lại mật khẩu"
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-gray-900 text-sm focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20"
              />
            </div>
          )}

          {error && <p className="text-xs text-red-500 flex items-center gap-1"><Lock size={12} />{error}</p>}

          <button
            type="submit"
            className="w-full py-2.5 rounded-lg bg-gradient-to-r from-blue-500 to-blue-600 text-white font-semibold text-sm hover:shadow-md transition-all"
          >
            {isSetup ? 'Tạo mật khẩu & Đăng nhập' : 'Đăng nhập'}
          </button>
        </form>
      )}
    </div>
  );
}

// ── Root ──────────────────────────────────────────────────────────────────────
// onSuccess(key): key = 'admin' | memberId
export default function LoginPage({ onSuccess }) {
  const [role, setRole] = useState(null); // null | 'admin' | 'member'

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="bg-white rounded-2xl border border-gray-200 shadow-lg p-8 space-y-6">
          {/* Logo */}
          <div className="flex flex-col items-center gap-3">
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-md">
              <span className="text-white font-bold text-2xl">H</span>
            </div>
            <h1 className="text-xl font-bold text-gray-900">HUI PRO</h1>
          </div>

          {role === null && (
            <RolePicker onPick={setRole} />
          )}

          {role === 'admin' && (
            <AdminLogin
              onSuccess={onSuccess}
              onBack={() => setRole(null)}
            />
          )}

          {role === 'member' && (
            <MemberLogin
              onSuccess={onSuccess}
              onBack={() => setRole(null)}
            />
          )}
        </div>
      </div>
    </div>
  );
}
