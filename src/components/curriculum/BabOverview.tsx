import React from 'react';
import { CurriculumBab, StudentProfile, RombelAssignment } from '../../types/curriculum';
import {
  BookOpen,
  Target,
  Clock,
  Shield,
  CheckCircle,
  ArrowRight,
  Play,
  FileQuestion,
  PenTool,
  Lock,
  Sparkles,
  School,
  CheckCircle2,
} from 'lucide-react';
import { getAssignmentForStudent, isBabAccessibleForStudent } from '../../data/rombelAssignments';

interface BabOverviewProps {
  bab: CurriculumBab;
  onNavigateToTab: (tab: 'simulations' | 'objective' | 'qualitative') => void;
  activeStudent?: StudentProfile | null;
  rombelAssignments?: Record<string, RombelAssignment>;
  userRole?: 'siswa' | 'guru';
}

export const BabOverview: React.FC<BabOverviewProps> = ({
  bab,
  onNavigateToTab,
  activeStudent,
  rombelAssignments = {},
  userRole = 'siswa',
}) => {
  const isAssigned = isBabAccessibleForStudent(activeStudent || null, bab.id, rombelAssignments);
  const rombelAssignment = getAssignmentForStudent(activeStudent || null, rombelAssignments);

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Rombel Assignment Status Banner */}
      {activeStudent && userRole !== 'guru' && (
        <div
          className={`p-4 rounded-2xl border transition flex flex-wrap items-center justify-between gap-3 ${
            isAssigned
              ? 'bg-emerald-50/80 border-emerald-200 text-emerald-950'
              : 'bg-amber-50/80 border-amber-200 text-amber-950'
          }`}
        >
          <div className="flex items-center gap-3">
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold shrink-0 ${
                isAssigned ? 'bg-emerald-600 text-white' : 'bg-amber-600 text-white'
              }`}
            >
              {isAssigned ? <CheckCircle2 className="w-5 h-5" /> : <Lock className="w-5 h-5" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-xs uppercase tracking-wider">
                  {isAssigned ? 'Modul Ini Ditugaskan untuk Rombel Anda' : 'Modul Ini Belum Ditugaskan untuk Rombel Anda'}
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white border border-current font-bold">
                  {activeStudent.className}
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-0.5">
                {isAssigned
                  ? `Pak Simon Murd telah membuka akses Bab ${bab.code} untuk ${activeStudent.className} (${activeStudent.school}).`
                  : `Akses latihan dikunci oleh Pak Simon Murd. Rombel Anda saat ini fokus pada modul lain.`}
              </p>
            </div>
          </div>

          {rombelAssignment?.notes && isAssigned && (
            <div className="text-xs italic bg-white px-3 py-1.5 rounded-xl border border-emerald-200 text-slate-700 max-w-md">
              "{rombelAssignment.notes}"
            </div>
          )}
        </div>
      )}

      {/* Hero Module Card - Bright Minimalist */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-xs relative overflow-hidden">
        <div className="max-w-3xl">
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <span className="px-3 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200 font-mono font-bold text-xs">
              {bab.code}
            </span>
            <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 font-mono text-xs">
              {bab.grade} • Semester {bab.semester}
            </span>
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-mono text-xs flex items-center gap-1 border border-emerald-200">
              <Clock className="w-3 h-3" />
              {bab.hoursAllocation} Jam Pelajaran (JP)
            </span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mb-3">
            {bab.title}
          </h2>

          <p className="text-slate-600 text-sm leading-relaxed mb-6">
            {bab.capaianPembelajaran}
          </p>

          {/* 3 Standalone LKPD Shortcuts */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <button
              onClick={() => onNavigateToTab('simulations')}
              className="p-4 rounded-xl bg-slate-50 hover:bg-blue-50/70 border border-slate-200 hover:border-blue-300 text-left transition flex items-center justify-between group shadow-2xs"
            >
              <div>
                <span className="text-[10px] uppercase font-mono font-bold text-blue-700 block mb-0.5">
                  Bagian 1 LKPD
                </span>
                <span className="font-bold text-xs text-slate-900 group-hover:text-blue-900">
                  4 Simulasi Praktikum
                </span>
              </div>
              <Play className="w-4 h-4 text-slate-400 group-hover:text-blue-600 transition" />
            </button>

            <button
              onClick={() => onNavigateToTab('objective')}
              className="p-4 rounded-xl bg-slate-50 hover:bg-blue-50/70 border border-slate-200 hover:border-blue-300 text-left transition flex items-center justify-between group shadow-2xs"
            >
              <div>
                <span className="text-[10px] uppercase font-mono font-bold text-purple-700 block mb-0.5">
                  Bagian 2 LKPD
                </span>
                <span className="font-bold text-xs text-slate-900 group-hover:text-purple-900">
                  40 Soal Objektif CBT
                </span>
              </div>
              <FileQuestion className="w-4 h-4 text-slate-400 group-hover:text-purple-600 transition" />
            </button>

            <button
              onClick={() => onNavigateToTab('qualitative')}
              className="p-4 rounded-xl bg-slate-50 hover:bg-blue-50/70 border border-slate-200 hover:border-blue-300 text-left transition flex items-center justify-between group shadow-2xs"
            >
              <div>
                <span className="text-[10px] uppercase font-mono font-bold text-emerald-700 block mb-0.5">
                  Bagian 3 LKPD
                </span>
                <span className="font-bold text-xs text-slate-900 group-hover:text-emerald-900">
                  10 Esai & Kasus
                </span>
              </div>
              <PenTool className="w-4 h-4 text-slate-400 group-hover:text-emerald-600 transition" />
            </button>
          </div>
        </div>
      </div>

      {/* 2-Column: Learning Goals & Pedagogical Architecture */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Learning Goals (ATP) */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <Target className="w-5 h-5 text-blue-600" />
            <h3 className="font-bold text-sm text-slate-900">
              Alur Tujuan Pembelajaran (ATP) - Kurikulum Merdeka
            </h3>
          </div>

          <ul className="space-y-3 text-xs text-slate-700">
            {bab.tujuanPembelajaran.map((tp, idx) => (
              <li key={idx} className="flex items-start gap-2.5 leading-relaxed">
                <span className="w-5 h-5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 flex items-center justify-center font-bold text-[10px] font-mono shrink-0 mt-0.5">
                  {idx + 1}
                </span>
                <span>{tp}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Pedagogical Architecture Summary */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <BookOpen className="w-5 h-5 text-indigo-600" />
            <h3 className="font-bold text-sm text-slate-900">
              Arsitektur Instrumen Asesmen LKPD Fase F
            </h3>
          </div>

          <div className="space-y-3 text-xs">
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
              <span className="font-bold text-slate-900 block mb-1">
                1. Praktikum Interaktif & Log ke Google Sheets:
              </span>
              <p className="text-slate-600 leading-relaxed">
                4 tugas praktikum langsung terhubung dengan engine simulasi canvas (Crimping T568A/B, LAN Tester, Nirkabel, Splicer, dsb.) dengan pencatatan log otomatis ke Spreadsheet Guru.
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
              <span className="font-bold text-slate-900 block mb-1">
                2. Evaluasi CBT Komprehensif (40 Soal):
              </span>
              <p className="text-slate-600 leading-relaxed">
                20 butir Pilihan Ganda Tunggal + 20 butir Pilihan Ganda Kompleks. Standar KKM 75 dengan pembobotan HOTS industri.
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
              <span className="font-bold text-slate-900 block mb-1">
                3. Evaluasi Kualitatif & Esai (10 Soal):
              </span>
              <p className="text-slate-600 leading-relaxed">
                Studi kasus pemecahan kendala jaringan lapangan dengan rubrik penilaian otomatis dan umpan balik konstruktif.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
