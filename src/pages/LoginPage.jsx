import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { useHuiStore } from '../store/useHuiStore.js';
import { hashPassword, verifyPassword } from '../lib/auth.js';

// ─────────────────────────────────────────────────────────────────────────────
// Design tokens (Apple-inspired)
// bg: #f5f5f7  card: white  text: #1d1d1f  muted: #6e6e73
// input: border #d2d2d7, focus #0071e3   btn: brand amber → solid
// ─────────────────────────────────────────────────────────────────────────────

const inputCls = `
  w-full rounded-xl border border-[#d2d2d7] bg-white
  text-[15px] text-[#1d1d1f] placeholder:text-[#aeaeb2]
  px-4 py-[13px] pr-11
  transition-all duration-150
  focus:outline-none focus:border-[#0071e3] focus:ring-2 focus:ring-[#0071e3]/20
`.replace(/\s+/g, ' ').trim();

function PwInput({ value, onChange, placeholder, autoFocus }) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <input
        type={show ? 'text' : 'password'}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        autoFocus={autoFocus}
        className={inputCls}
      />
      <button
        type="button"
        tabIndex={-1}
        onClick={() => setShow((s) => !s)}
        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#aeaeb2] hover:text-[#6e6e73] transition-colors"
      >
        {show ? <EyeOff size={17} /> : <Eye size={17} />}
      </button>
    </div>
  );
}

function FieldError({ msg }) {
  if (!msg) return null;
  return <p className="text-[13px] text-red-500 mt-1.5 px-0.5">{msg}</p>;
}

function PrimaryBtn({ children, onClick, type = 'submit' }) {
  return (
    <button
      type={type}
      onClick={onClick}
      className="w-full rounded-xl bg-[#ff9500] hover:bg-[#e68600] active:scale-[0.98]
        text-white font-semibold text-[15px] py-[13px] transition-all duration-150 shadow-sm"
    >
      {children}
    </button>
  );
}

function TextBtn({ children, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="text-[13px] text-[#0071e3] hover:underline underline-offset-2 transition-colors"
    >
      {children}
    </button>
  );
}

// ── Logo + app name (always at top) ──────────────────────────────────────────
function Logo() {
  return (
    <div className="flex flex-col items-center gap-3 pb-8 border-b border-[#f0f0f0]">
      <div className="w-[62px] h-[62px] rounded-[18px] bg-gradient-to-br from-amber-400 to-orange-500
        flex items-center justify-center shadow-[0_4px_14px_rgba(255,149,0,0.35)]">
        <span className="text-white font-bold text-[28px] leading-none select-none">H</span>
      </div>
      <div className="text-center">
        <p className="text-[18px] font-bold text-[#1d1d1f] tracking-tight">Hui Pro</p>
        <p className="text-[12px] text-[#aeaeb2] tracking-[0.06em] mt-0.5">Quản lý hụi thông minh</p>
      </div>
    </div>
  );
}

// ── Member avatar ─────────────────────────────────────────────────────────────
function MemberAvatar({ member }) {
  const initial = member.name?.trim()?.[0]?.toUpperCase() ?? '?';
  return (
    <div className="flex flex-col items-center gap-2.5 pb-2">
      <div className="w-[68px] h-[68px] rounded-full bg-gradient-to-br from-amber-400 to-orange-500
        flex items-center justify-center shadow-[0_4px_14px_rgba(255,149,0,0.3)]">
        <span className="text-white font-bold text-[26px] leading-none select-none">{initial}</span>
      </div>
      <div className="text-center">
        <p className="text-[17px] font-semibold text-[#1d1d1f]">{member.name}</p>
        <p className="text-[13px] text-[#6e6e73] mt-0.5">{member.phone}</p>
      </div>
    </div>
  );
}

// ── Bootstrap: tạo quản trị viên lần đầu ────────────────────────────────────
function BootstrapForm({ onSuccess }) {
  const addMember      = useHuiStore((s) => s.addMember);
  const setMemberPassword = useHuiStore((s) => s.setMemberPassword);

  const [name, setName]       = useState('');
  const [phone, setPhone]     = useState('');
  const [pw, setPw]           = useState('');
  const [confirm, setConfirm] = useState('');
  const [errors, setErrors]   = useState({});

  const validate = () => {
    const e = {};
    if (name.trim().length < 2)   e.name    = 'Tối thiểu 2 ký tự';
    if (!phone.trim())             e.phone   = 'Vui lòng nhập số điện thoại';
    if (pw.length < 6)             e.pw      = 'Tối thiểu 6 ký tự';
    if (pw !== confirm)            e.confirm = 'Mật khẩu không khớp';
    return e;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const e2 = validate();
    if (Object.keys(e2).length) { setErrors(e2); return; }
    const id = addMember({ name: name.trim(), phone: phone.trim(), isAdmin: true, status: 'active' });
    setMemberPassword(id, hashPassword(pw));
    onSuccess('admin');
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="text-center">
        <h2 className="text-[20px] font-semibold text-[#1d1d1f]">Thiết lập tài khoản</h2>
        <p className="text-[13px] text-[#6e6e73] mt-1.5 leading-snug">
          Tạo tài khoản quản trị viên để bắt đầu sử dụng Hui Pro
        </p>
      </div>

      <div>
        <input
          className={inputCls}
          type="text"
          placeholder="Họ và tên"
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoFocus
        />
        <FieldError msg={errors.name} />
      </div>

      <div>
        <input
          className={inputCls}
          type="tel"
          placeholder="Số điện thoại"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
        />
        <FieldError msg={errors.phone} />
      </div>

      <div>
        <PwInput
          value={pw}
          onChange={(e) => setPw(e.target.value)}
          placeholder="Mật khẩu (tối thiểu 6 ký tự)"
        />
        <FieldError msg={errors.pw} />
      </div>

      <div>
        <PwInput
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          placeholder="Xác nhận mật khẩu"
        />
        <FieldError msg={errors.confirm} />
      </div>

      <div className="pt-1">
        <PrimaryBtn>Tạo tài khoản</PrimaryBtn>
      </div>
    </form>
  );
}

// ── Step 1: Nhập số điện thoại ───────────────────────────────────────────────
function PhoneStep({ onFound }) {
  const members = useHuiStore((s) => s.members);
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    const clean = phone.trim().replace(/\s+/g, '');
    if (!clean) { setError('Vui lòng nhập số điện thoại'); return; }
    const member = members.find((m) => m.phone && m.phone.replace(/\s+/g, '') === clean);
    if (!member) { setError('Số điện thoại không tìm thấy trong hệ thống'); return; }
    onFound(member);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="text-center">
        <h2 className="text-[20px] font-semibold text-[#1d1d1f]">Đăng nhập</h2>
        <p className="text-[13px] text-[#6e6e73] mt-1.5">
          Nhập số điện thoại đã đăng ký để tiếp tục
        </p>
      </div>

      <div>
        <input
          className={inputCls}
          type="tel"
          placeholder="Số điện thoại"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          autoFocus
          inputMode="tel"
        />
        <FieldError msg={error} />
      </div>

      <PrimaryBtn>Tiếp tục</PrimaryBtn>
    </form>
  );
}

// ── Step 2: Nhập mật khẩu ────────────────────────────────────────────────────
function PasswordStep({ member, onSuccess, onBack }) {
  const memberPasswords   = useHuiStore((s) => s.memberPasswords);
  const setMemberPassword = useHuiStore((s) => s.setMemberPassword);

  const isSetup = !memberPasswords[member.id];
  const [pw, setPw]           = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError]     = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    if (isSetup) {
      if (pw.length < 6)    { setError('Mật khẩu tối thiểu 6 ký tự'); return; }
      if (pw !== confirm)   { setError('Mật khẩu xác nhận không khớp'); return; }
      setMemberPassword(member.id, hashPassword(pw));
      onSuccess(member.isAdmin ? 'admin' : member.id);
    } else {
      if (!verifyPassword(pw, memberPasswords[member.id])) { setError('Mật khẩu không đúng'); return; }
      onSuccess(member.isAdmin ? 'admin' : member.id);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <MemberAvatar member={member} />

      {isSetup && (
        <p className="text-center text-[13px] text-[#6e6e73] -mt-1">
          Lần đầu đăng nhập — hãy tạo mật khẩu riêng
        </p>
      )}

      <div>
        <PwInput
          value={pw}
          onChange={(e) => setPw(e.target.value)}
          placeholder={isSetup ? 'Tạo mật khẩu mới' : 'Mật khẩu'}
          autoFocus
        />
        {!isSetup && error && <FieldError msg={error} />}
      </div>

      {isSetup && (
        <div>
          <PwInput
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            placeholder="Xác nhận mật khẩu"
          />
          <FieldError msg={error} />
        </div>
      )}

      {!isSetup && !error && <div />}

      <PrimaryBtn>{isSetup ? 'Tạo mật khẩu & Đăng nhập' : 'Đăng nhập'}</PrimaryBtn>

      <div className="flex justify-center">
        <TextBtn onClick={onBack}>Không phải {member.name}?</TextBtn>
      </div>
    </form>
  );
}

// ── Root ──────────────────────────────────────────────────────────────────────
export default function LoginPage({ onSuccess }) {
  const members     = useHuiStore((s) => s.members);
  const adminExists = members.some((m) => m.isAdmin);

  const [found, setFound] = useState(null); // null → phone step; member → password step

  return (
    <div className="min-h-screen bg-[#f5f5f7] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-[400px]">

        {/* Card */}
        <div className="bg-white rounded-[20px] shadow-[0_4px_40px_rgba(0,0,0,0.10)] overflow-hidden">

          {/* Logo area */}
          <div className="px-10 pt-10 pb-7">
            <Logo />
          </div>

          {/* Form area */}
          <div className="px-10 pb-10">
            {!adminExists
              ? <BootstrapForm onSuccess={onSuccess} />
              : found
              ? <PasswordStep
                  member={found}
                  onSuccess={onSuccess}
                  onBack={() => setFound(null)}
                />
              : <PhoneStep onFound={setFound} />
            }
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-[12px] text-[#aeaeb2] mt-8 leading-relaxed px-4">
          Dữ liệu lưu trên thiết bị của bạn.<br />
          Không chia sẻ với bên thứ ba.
        </p>

      </div>
    </div>
  );
}
