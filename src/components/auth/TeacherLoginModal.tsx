import React, { useState } from 'react';
import { ShieldCheck, Lock, User, X, AlertCircle, KeyRound, CheckCircle2 } from 'lucide-react';

interface TeacherLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccessLogin: () => void;
}

export const TeacherLoginModal: React.FC<TeacherLoginModalProps> = ({
  isOpen,
  onClose,
  onSuccessLogin,
}) => {
  const [username, setUsername] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    // Exact credentials specified by user: simonmurd / d17881520
    if (username.trim() === 'simonmurd' && password.trim() === 'd17881520') {
      setIsSuccess(true);
      setTimeout(() => {
        setIsSuccess(false);
        onSuccessLogin();
        onClose();
      }, 700);
    } else {
      setErrorMsg('Username atau password Guru salah. Pastikan menggunakan akun resmi Instruktur (simonmurd).');
    }
  };

  const handleFillDemo = () => {
    setUsername('simonmurd');
    setPassword('d17881520');
    setErrorMsg(null);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl relative animate-in fade-in zoom-in-95 duration-200 text-slate-800">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="text-center mb-6">
          <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-700 border border-blue-200 flex items-center justify-center mx-auto mb-3 shadow-2xs font-bold">
            <ShieldCheck className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight">
            Autentikasi Guru / Instruktur TKJ
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Masuk sebagai Guru Pengampu (Pak Simon Murd) untuk mengakses Manajemen Penugasan Rombel, pantau hasil ujian CBT, dan batalkan pengerjaan terlalu cepat.
          </p>
        </div>

        {errorMsg && (
          <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {isSuccess ? (
          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center justify-center gap-2 font-bold animate-pulse">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            <span>Login Berhasil! Selamat datang, Pak Simon Murd.</span>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div>
              <label className="block text-slate-700 mb-1 font-semibold">Username Guru:</label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="simonmurd"
                  required
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-10 pr-4 py-2.5 text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 transition font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-700 mb-1 font-semibold">Password:</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-10 pr-4 py-2.5 text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 transition font-mono"
                />
              </div>
            </div>

            <div className="flex items-center justify-between text-[11px] pt-1">
              <button
                type="button"
                onClick={handleFillDemo}
                className="text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1"
              >
                <KeyRound className="w-3 h-3" />
                <span>Isi Akun Simon Murd</span>
              </button>
              <span className="text-slate-400 font-mono">simonmurd • d17881520</span>
            </div>

            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-500/20 active:scale-95 transition"
            >
              Masuk ke Panel Guru
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
