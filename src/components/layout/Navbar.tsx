import React from 'react';
import { CurriculumBab, UserRole, StudentProfile, RombelAssignment } from '../../types/curriculum';
import {
  Server,
  Play,
  FileQuestion,
  PenTool,
  Printer,
  Bot,
  UserCheck,
  GraduationCap,
  Sparkles,
  BarChart3,
  BookOpen,
  ChevronDown,
  Download,
  LogOut,
  User,
  ShieldCheck,
  School,
  Lock,
  MessageSquare,
} from 'lucide-react';
import { isBabAccessibleForStudent } from '../../data/rombelAssignments';

interface NavbarProps {
  babs: CurriculumBab[];
  selectedBab: CurriculumBab;
  onSelectBab: (bab: CurriculumBab) => void;
  activeTab: 'overview' | 'simulations' | 'objective' | 'qualitative' | 'dashboard' | 'print' | 'admin_teacher';
  setActiveTab: (tab: 'overview' | 'simulations' | 'objective' | 'qualitative' | 'dashboard' | 'print' | 'admin_teacher') => void;
  userRole: UserRole;
  isTeacherAuthenticated: boolean;
  onOpenTeacherLogin: () => void;
  onTeacherLogout: () => void;
  activeStudent: StudentProfile | null;
  onOpenStudentSelector: () => void;
  onLogoutStudent?: () => void;
  onOpenAiTutor: () => void;
  onOpenAiGenerator: () => void;
  onExportJson: () => void;
  rombelAssignments?: Record<string, RombelAssignment>;
  onOpenStudentChat?: () => void;
  unreadStudentMessageCount?: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  babs,
  selectedBab,
  onSelectBab,
  activeTab,
  setActiveTab,
  userRole,
  isTeacherAuthenticated,
  onOpenTeacherLogin,
  onTeacherLogout,
  activeStudent,
  onOpenStudentSelector,
  onLogoutStudent,
  onOpenAiTutor,
  onOpenAiGenerator,
  onExportJson,
  rombelAssignments = {},
  onOpenStudentChat,
  unreadStudentMessageCount = 0,
}) => {
  const isMenuUnlocked = Boolean(activeStudent || isTeacherAuthenticated);

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 text-slate-800 print:hidden shadow-2xs">
      {/* Top Banner Bar */}
      <div className="max-w-7xl mx-auto px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 text-xs">
        {/* App Brand */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-xs shrink-0 font-bold">
            <Server className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-sm sm:text-base tracking-tight text-slate-900">
                TJKN Studio Phase F
              </span>
              <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 font-mono text-[10px] font-bold border border-blue-200">
                SMK TKJ / TJKT
              </span>
            </div>
            <p className="text-[11px] text-slate-500 hidden sm:block">
              Teknologi Jaringan Kabel & Nirkabel • Singkawang
            </p>
          </div>
        </div>

        {/* Center: Active Student Identity Badge */}
        <div className="flex items-center gap-2">
          {activeStudent ? (
            <>
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl p-1 shadow-2xs">
              <div
                onClick={onOpenStudentSelector}
                className="hover:bg-white rounded-lg px-2.5 py-1 cursor-pointer transition flex items-center gap-2 group border border-transparent hover:border-slate-200"
                title="Klik untuk mengganti siswa"
              >
                <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-[10px] font-mono shrink-0">
                  {activeStudent.noAbsen}
                </div>
                <div className="text-left">
                  <div className="font-bold text-xs text-slate-900 group-hover:text-blue-700 transition line-clamp-1 max-w-[150px] sm:max-w-[200px]">
                    {activeStudent.name}
                  </div>
                  <div className="text-[10px] text-slate-500 font-mono line-clamp-1 max-w-[150px] sm:max-w-[200px]">
                    {activeStudent.className} • {activeStudent.school.replace('SMK NEGERI 1 SINGKAWANG', 'SMKN 1').replace('SMK MUDITA SINGKAWANG', 'SMK Mudita')}
                  </div>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-600 shrink-0" />
              </div>

              {onLogoutStudent && (
                <button
                  onClick={onLogoutStudent}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition"
                  title="Keluar / Kunci Menu Siswa"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Direct Message with Teacher (Simon Murd) Button for Student */}
            {onOpenStudentChat && (
              <button
                onClick={onOpenStudentChat}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-700 font-bold text-xs transition shadow-2xs relative"
                title="Pesan Bimbingan & Catatan dari Guru (Simon Murd)"
              >
                <MessageSquare className="w-3.5 h-3.5 text-blue-600" />
                <span className="hidden sm:inline">Pesan Guru</span>
                {unreadStudentMessageCount > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full bg-red-600 text-white text-[10px] font-bold animate-pulse">
                    {unreadStudentMessageCount}
                  </span>
                )}
              </button>
            )}
            </>
          ) : (
            <button
              onClick={onOpenStudentSelector}
              className="px-3.5 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 font-bold text-xs transition flex items-center gap-2 shadow-2xs"
            >
              <Lock className="w-3.5 h-3.5 text-amber-600 animate-pulse" />
              <span>Ketik atau pilih Nama Siswa...</span>
            </button>
          )}
        </div>

        {/* Right: Bab Selector & Teacher Admin Login */}
        <div className="flex items-center gap-2">
          {/* Bab Dropdown */}
          <div className="relative">
            <select
              value={selectedBab.id}
              onChange={(e) => {
                const found = babs.find((b) => b.id === parseInt(e.target.value, 10));
                if (found) {
                  onSelectBab(found);
                  if (activeTab === 'admin_teacher') {
                    setActiveTab('overview');
                  }
                }
              }}
              disabled={!isMenuUnlocked}
              className={`text-xs rounded-xl px-3 py-1.5 font-medium transition cursor-pointer pr-8 border shadow-2xs ${
                isMenuUnlocked
                  ? 'bg-white border-slate-300 text-slate-800 hover:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500'
                  : 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed opacity-60'
              }`}
            >
              {babs.map((b) => {
                const isAssigned = isBabAccessibleForStudent(activeStudent, b.id, rombelAssignments);
                const prefix = activeStudent && !isTeacherAuthenticated
                  ? isAssigned ? '✓ ' : '🔒 '
                  : '';
                const suffix = activeStudent && !isTeacherAuthenticated && !isAssigned ? ' (Terkunci)' : '';

                return (
                  <option key={b.id} value={b.id} className="text-slate-800 py-1">
                    {prefix}{b.code}: {b.title.slice(0, 32)}...{suffix}
                  </option>
                );
              })}
            </select>
          </div>

          {/* Teacher Login / Admin Dashboard Button */}
          {isTeacherAuthenticated ? (
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setActiveTab('admin_teacher')}
                className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition shadow-2xs ${
                  activeTab === 'admin_teacher'
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-800'
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                <span>Panel Guru (Simon Murd)</span>
              </button>

              <button
                onClick={onTeacherLogout}
                className="p-1.5 rounded-xl text-slate-400 hover:text-red-600 hover:bg-red-50 transition"
                title="Keluar dari mode guru"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button
              onClick={onOpenTeacherLogin}
              className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition border border-slate-200"
            >
              <UserCheck className="w-3.5 h-3.5 text-slate-500" />
              <span>Login Guru</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Tab Navigation Bar */}
      <div className="max-w-7xl mx-auto px-4 py-2 flex flex-wrap items-center justify-between gap-2 text-xs">
        {/* Left Tabs (3-Part Standalone Architecture + Dashboard) */}
        <nav className="flex items-center gap-1 overflow-x-auto py-1">
          {/* Tab 0: Ringkasan Bab */}
          <button
            onClick={() => setActiveTab('overview')}
            disabled={!isMenuUnlocked}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-medium transition ${
              !isMenuUnlocked
                ? 'opacity-40 cursor-not-allowed text-slate-400'
                : activeTab === 'overview'
                ? 'bg-blue-600 text-white shadow-xs font-bold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Modul & Silabus</span>
          </button>

          {/* Tab 1: Practical Simulation */}
          <button
            onClick={() => setActiveTab('simulations')}
            disabled={!isMenuUnlocked}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-medium transition ${
              !isMenuUnlocked
                ? 'opacity-40 cursor-not-allowed text-slate-400'
                : activeTab === 'simulations'
                ? 'bg-blue-600 text-white shadow-xs font-bold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Play className="w-3.5 h-3.5" />
            <span>1. Simulasi Praktik</span>
          </button>

          {/* Tab 2: Objective Evaluation (40 MCQs) */}
          <button
            onClick={() => setActiveTab('objective')}
            disabled={!isMenuUnlocked}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-medium transition ${
              !isMenuUnlocked
                ? 'opacity-40 cursor-not-allowed text-slate-400'
                : activeTab === 'objective'
                ? 'bg-blue-600 text-white shadow-xs font-bold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <FileQuestion className="w-3.5 h-3.5" />
            <span>2. Evaluasi CBT (40 Soal)</span>
          </button>

          {/* Tab 3: Qualitative Evaluation (10 Essays) */}
          <button
            onClick={() => setActiveTab('qualitative')}
            disabled={!isMenuUnlocked}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-medium transition ${
              !isMenuUnlocked
                ? 'opacity-40 cursor-not-allowed text-slate-400'
                : activeTab === 'qualitative'
                ? 'bg-blue-600 text-white shadow-xs font-bold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <PenTool className="w-3.5 h-3.5" />
            <span>3. Esai Masalah (10 Soal)</span>
          </button>

          {/* Tab 4: Student Dashboard */}
          <button
            onClick={() => setActiveTab('dashboard')}
            disabled={!isMenuUnlocked}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-medium transition ${
              !isMenuUnlocked
                ? 'opacity-40 cursor-not-allowed text-slate-400'
                : activeTab === 'dashboard'
                ? 'bg-blue-600 text-white shadow-xs font-bold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Rapor Siswa</span>
          </button>
        </nav>

        {/* Right Tools (Cetak LKPD & AI Tools) */}
        <div className="flex items-center gap-1.5">
          {/* Printable Official LKPD */}
          <button
            onClick={() => setActiveTab('print')}
            disabled={!isMenuUnlocked}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-medium transition border ${
              !isMenuUnlocked
                ? 'opacity-40 cursor-not-allowed border-slate-200 text-slate-400'
                : activeTab === 'print'
                ? 'bg-slate-800 text-white border-slate-800'
                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
            title="Format Cetak Lembar Kerja Siswa Resmi"
          >
            <Printer className="w-3.5 h-3.5 text-slate-600" />
            <span className="hidden md:inline">Cetak LKPD</span>
          </button>

          {/* AI Tutor Assistant */}
          <button
            onClick={onOpenAiTutor}
            disabled={!isMenuUnlocked}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-medium transition border ${
              !isMenuUnlocked
                ? 'opacity-40 cursor-not-allowed border-slate-200 text-slate-400'
                : 'bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100'
            }`}
            title="Tanya Tutor AI Sokratik TJKN"
          >
            <Bot className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Tutor TJKN</span>
          </button>

          {/* Export JSON Bank Soal */}
          <button
            onClick={onExportJson}
            disabled={!isMenuUnlocked}
            className="p-1.5 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition border border-transparent hover:border-slate-200"
            title="Unduh Bank Soal Modul Ini (.JSON)"
          >
            <Download className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </header>
  );
};
