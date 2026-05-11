import React, { useState } from 'react';
import {
  Eye, EyeOff, Lock, Phone, ChevronLeft,
  Shield, User, ArrowRight, CheckCircle2,
  BarChart3, Users, DollarSign,
} from 'lucide-react';
import { useHuiStore } from '../store/useHuiStore.js';
import { hashPassword, verifyPassword } from '../lib/auth.js';

// ── Shared primitives ─────────────────────────────────────────────────────────
function InputField({ icon: Icon, right, ...props }) {
  return (
    <div className="relative">
      {Icon && (
        <Icon size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
      )}
      <input
        {...props}
        className={`w-full rounded-xl border border-gray-200 bg-gray-50 text-gray-900 text-sm
          py-3 focus:outline-none focus:border-amber-400 focus:bg-white focus:ring-2 focus:ring-amber-400/20
          placeholder:text-gray-400 transition-all
          ${Icon ? 'pl-10' : 'pl-4'} ${right ? 'pr-11' : 'pr-4'}`}
      />
      {right}
    </div>
  );
}

function EyeBtn({ show, onToggle }) {
  return (
    <button
      type="button"
      tabIndex={-1}
      onClick={onToggle}
      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
    >
      {show ? <EyeOff size={16} /> : <Eye size={16} />}
    </button>
  );
}

function ErrorMsg({ msg }) {
  if (!msg) return null;
  return (
    <div className="flex items-center gap-2 rounded-xl bg-red-50 border border-red-200 px-3.5 py-2.5 text-xs text-red-600">
      <Lock size={12} className="shrink-0" /> {msg}
    </div>
  );
}

function SubmitBtn({ children, blue }) {
  const cls = blue
    ? 'from-blue-500 to-indigo-600 hover:from-blue-400 hover:to-indigo-500 text-white'
    : 'from-amber-400 to-orange-500 hover:from-amber-300 hover:to-orange-400 text-slate-900';
  return (
    <button
      type="submit"
      className={`w-full py-3 rounded-xl bg-gradient-to-r ${cls}
        font-semibold text-sm shadow-sm hover:shadow-md transition-all duration-200
        flex items-center justify-center gap-2`}
    >
      {children} <ArrowRight size={15} />
    </button>
  );
}

// ── Bootstrap: tạo tài khoản quản trị lần đầu ────────────────────────────────
function BootstrapForm({ onSuccess }) {
  const addMember = useHuiStore((s) => s.addMember);
  const setMemberPassword = useHuiStore((s) => s.setMemberPassword);

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [pw, setPw] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    if (name.trim().length < 2) { setError('Tên tối thiểu 2 ký tự'); return; }
    if (!phone.trim()) { setError('Vui lòng nhập số điện thoại'); return; }
    if (pw.length < 6) { setError('Mật khẩu tối thiểu 6 ký tự'); return; }
    if (pw !== confirm) { setError('Mật khẩu xác nhận không khớp'); return; }
    const id = addMember({ name: name.trim(), phone: phone.trim(), isAdmin: true, status: 'active' });
    setMemberPassword(id, hashPassword(pw));
    onSuccess('admin');
  };

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Thiết lập tài khoản</h2>
        <p className="text-sm text-gray-500 mt-1">Tạo tài khoản quản trị viên lần đầu để bắt đầu sử dụng</p>
      </div>

      <div className="flex items-start gap-2.5 rounded-xl bg-amber-50 border border-amber-200 px-3.5 py-3 text-xs text-amber-700">
        <Shield size={14} className="shrink-0 mt-0.5" />
        <span>Đây là tài khoản quản trị viên duy nhất. Bạn có thể thêm thành viên và phân quyền trong phần <strong>Thành viên</strong> sau khi đăng nhập.</span>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-gray-600">Họ tên</label>
          <InputField
            icon={User}
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Tên của bạn"
            autoFocus
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-gray-600">Số điện thoại</label>
          <InputField
            icon={Phone}
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="Dùng để đăng nhập"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-gray-600">Mật khẩu</label>
          <div className="relative">
            <InputField
              icon={Lock}
              type={showPw ? 'text' : 'password'}
              value={pw}
              onChange={(e) => setPw(e.target.value)}
              placeholder="Tối thiểu 6 ký tự"
              right={<EyeBtn show={showPw} onToggle={() => setShowPw(!showPw)} />}
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-gray-600">Xác nhận mật khẩu</label>
          <div className="relative">
            <InputField
              icon={Lock}
              type={showPw ? 'text' : 'password'}
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="Nhập lại mật khẩu"
              right={<EyeBtn show={showPw} onToggle={() => setShowPw(!showPw)} />}
            />
          </div>
        </div>

        <ErrorMsg msg={error} />
        <SubmitBtn>Tạo tài khoản & Vào app</SubmitBtn>
      </form>
    </div>
  );
}

// ── Login form: phone → password ──────────────────────────────────────────────
function LoginForm({ onSuccess }) {
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
    if (!member) { setError('Không tìm thấy tài khoản với số điện thoại này.'); return; }
    setFound(member);
    setPw('');
    setConfirm('');
    setStep('password');
  };

  const isSetup = found && !memberPasswords[found.id];

  const handlePasswordSubmit = (e) => {
    e.preventDefault();
    setError('');
    if (isSetup) {
      if (pw.length < 6) { setError('Mật khẩu tối thiểu 6 ký tự'); return; }
      if (pw !== confirm) { setError('Mật khẩu xác nhận không khớp'); return; }
      setMemberPassword(found.id, hashPassword(pw));
      onSuccess(found.isAdmin ? 'admin' : found.id);
    } else {
      if (!verifyPassword(pw, memberPasswords[found.id])) { setError('Mật khẩu không đúng'); return; }
      onSuccess(found.isAdmin ? 'admin' : found.id);
    }
  };

  return (
    <div className="space-y-5">
      {step === 'password' && (
        <button
          type="button"
          onClick={() => { setStep('phone'); setError(''); setFound(null); }}
          className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-700 transition-colors"
        >
          <ChevronLeft size={15} /> Đổi số điện thoại
        </button>
      )}

      <div>
        <h2 className="text-xl font-bold text-gray-900">
          {step === 'phone' ? 'Đăng nhập' : found?.name ?? 'Đăng nhập'}
        </h2>
        <p className="text-sm text-gray-500 mt-1">
          {step === 'phone'
            ? 'Nhập số điện thoại đã đăng ký'
            : isSetup
            ? 'Lần đầu đăng nhập — tạo mật khẩu của bạn'
            : found?.isAdmin
            ? 'Xin chào, Quản trị viên'
            : 'Nhập mật khẩu để tiếp tục'}
        </p>
      </div>

      {/* Member info card */}
      {step === 'password' && found && (
        <div className={`flex items-center gap-3 rounded-xl border px-4 py-3 ${
          found.isAdmin
            ? 'bg-amber-50 border-amber-200'
            : 'bg-blue-50 border-blue-200'
        }`}>
          <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
            found.isAdmin
              ? 'bg-gradient-to-br from-amber-400 to-orange-500'
              : 'bg-gradient-to-br from-blue-500 to-indigo-600'
          }`}>
            {found.isAdmin
              ? <Shield size={16} className="text-white" />
              : <User size={16} className="text-white" />
            }
          </div>
          <div>
            <p className={`text-sm font-semibold ${found.isAdmin ? 'text-amber-800' : 'text-blue-800'}`}>
              {found.name}
              {found.isAdmin && <span className="ml-2 text-xs font-normal opacity-70">· Quản trị viên</span>}
            </p>
            <p className={`text-xs ${found.isAdmin ? 'text-amber-600' : 'text-blue-600'}`}>{found.phone}</p>
          </div>
        </div>
      )}

      {/* Step indicator */}
      {step === 'password' && (
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 text-xs text-green-600 font-medium">
            <div className="w-5 h-5 rounded-full bg-green-100 border border-green-300 flex items-center justify-center">
              <CheckCircle2 size={12} />
            </div>
            <span className="hidden sm:inline">Số điện thoại</span>
          </div>
          <div className="flex-1 h-px bg-gray-200" />
          <div className="flex items-center gap-1.5 text-xs text-amber-600 font-medium">
            <div className="w-5 h-5 rounded-full bg-amber-400 text-white flex items-center justify-center text-xs font-bold">
              2
            </div>
            <span className="hidden sm:inline">Mật khẩu</span>
          </div>
        </div>
      )}

      {step === 'phone' && (
        <form onSubmit={handlePhoneSubmit} className="space-y-3">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-gray-600">Số điện thoại</label>
            <InputField
              icon={Phone}
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Vd: 0901 234 567"
              autoFocus
            />
          </div>
          <ErrorMsg msg={error} />
          <SubmitBtn blue>Tiếp tục</SubmitBtn>
        </form>
      )}

      {step === 'password' && found && (
        <form onSubmit={handlePasswordSubmit} className="space-y-3">
          {isSetup && (
            <div className="flex items-start gap-2 rounded-xl bg-blue-50 border border-blue-200 px-3.5 py-3 text-xs text-blue-700">
              <CheckCircle2 size={14} className="shrink-0 mt-0.5" />
              <span>Lần đầu đăng nhập. Tạo mật khẩu để bảo vệ tài khoản.</span>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-gray-600">Mật khẩu</label>
            <div className="relative">
              <InputField
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
                <InputField
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
          <SubmitBtn blue={!found.isAdmin}>
            {isSetup ? 'Tạo mật khẩu & Đăng nhập' : 'Đăng nhập'}
          </SubmitBtn>
        </form>
      )}
    </div>
  );
}

// ── Left branding panel ───────────────────────────────────────────────────────
function BrandPanel() {
  const features = [
    { icon: Users,      text: 'Quản lý nhiều dây hụi cùng lúc' },
    { icon: DollarSign, text: 'Theo dõi thu chi minh bạch, rõ ràng' },
    { icon: BarChart3,  text: 'Báo cáo lãi suất & thống kê tức thì' },
  ];
  return (
    <div className="relative hidden lg:flex flex-col justify-between p-10 overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="absolute -top-24 -left-24 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -right-16 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 flex items-center gap-3">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg">
          <span className="text-white font-bold text-2xl leading-none">H</span>
        </div>
        <div>
          <p className="text-white font-bold text-xl tracking-wide">HUI PRO</p>
          <p className="text-amber-400/70 text-xs tracking-widest uppercase">Management System</p>
        </div>
      </div>

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

      <p className="relative z-10 text-slate-600 text-xs">© 2025 Hui Pro · Dữ liệu lưu cục bộ, bảo mật tuyệt đối</p>
    </div>
  );
}

// ── Root ──────────────────────────────────────────────────────────────────────
export default function LoginPage({ onSuccess }) {
  const members = useHuiStore((s) => s.members);
  const adminExists = members.some((m) => m.isAdmin);

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <div className="w-[480px] shrink-0">
        <BrandPanel />
      </div>

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
            {adminExists
              ? <LoginForm onSuccess={onSuccess} />
              : <BootstrapForm onSuccess={onSuccess} />
            }
          </div>
          <p className="text-center text-xs text-gray-400 mt-6">
            Dữ liệu lưu trên thiết bị · Không chia sẻ với bên thứ ba
          </p>
        </div>
      </div>
    </div>
  );
}
