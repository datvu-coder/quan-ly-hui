import React, { useState } from 'react';
import { Eye, EyeOff, Lock } from 'lucide-react';
import { useHuiStore } from '../store/useHuiStore.js';
import { hashPassword, verifyPassword } from '../lib/auth.js';

export default function LoginPage({ onSuccess }) {
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
      onSuccess();
    } else {
      if (!verifyPassword(pw, adminPasswordHash)) {
        setError('Mật khẩu không đúng');
        return;
      }
      onSuccess();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="bg-white rounded-2xl border border-gray-200 shadow-lg p-8 space-y-6">
          {/* Logo */}
          <div className="flex flex-col items-center gap-3">
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-md">
              <span className="text-white font-bold text-2xl">H</span>
            </div>
            <div className="text-center">
              <h1 className="text-xl font-bold text-gray-900">HUI PRO</h1>
              <p className="text-sm text-gray-500 mt-0.5">
                {isSetup ? 'Thiết lập mật khẩu lần đầu' : 'Đăng nhập để tiếp tục'}
              </p>
            </div>
          </div>

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
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
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
              <p className="text-xs text-red-500 flex items-center gap-1">
                <Lock size={12} />
                {error}
              </p>
            )}

            <button
              type="submit"
              className="w-full py-2.5 rounded-lg bg-gradient-to-r from-amber-400 to-orange-500 text-slate-900 font-semibold text-sm hover:shadow-md hover:shadow-amber-500/25 transition-all"
            >
              {isSetup ? 'Tạo mật khẩu & Vào app' : 'Đăng nhập'}
            </button>
          </form>

          {!isSetup && (
            <p className="text-xs text-center text-gray-400">
              Dữ liệu lưu cục bộ trên thiết bị này.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
