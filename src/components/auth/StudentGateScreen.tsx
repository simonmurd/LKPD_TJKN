import React, { useState } from 'react';
import { StudentProfile } from '../../types/curriculum';
import { StudentSelector } from './StudentSelector';
import {
  Lock,
  Unlock,
  CheckCircle2,
  Calendar,
  School,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Cpu,
  Layers,
  FileCheck2,
  HelpCircle,
  GraduationCap,
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface StudentGateScreenProps {
  students: StudentProfile[];
  onSelectStudent: (student: StudentProfile) => void;
  onOpenTeacherLogin: () => void;
}

export const StudentGateScreen: React.FC<StudentGateScreenProps> = ({
  students,
  onSelectStudent,
  onOpenTeacherLogin,
}) => {
  const [selectedTemp, setSelectedTemp] = useState<StudentProfile | null>(null);

  // Today's date formatting for the attendance card (as in image_af84b6d6.png)
  const today = new Date();
  const dayNames = ['MIN', 'SEN', 'SEL', 'RAB', 'KAM', 'JUM', 'SAB'];
  const monthNames = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];
  const dayName = dayNames[today.getDay()];
  const dateNum = today.getDate();
  const monthName = monthNames[today.getMonth()];
  const yearNum = today.getFullYear();

  const handleConfirmStudent = (student: StudentProfile) => {
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#2563eb', '#10b981', '#6366f1', '#f59e0b'],
      });
    } catch (e) {
      // ignore
    }
    onSelectStudent(student);
  };

  return (
    <div className="w-full max-w-4xl mx-auto py-8 px-4 animate-in fade-in duration-300">
      {/* Hero Welcome Banner - Clean Bright Minimalist */}
      <div className="relative overflow-hidden rounded-3xl bg-white border border-slate-200/90 shadow-sm p-6 sm:p-10 mb-8">
        <div className="relative z-10 text-center max-w-2xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold">
            <School className="w-3.5 h-3.5" />
            <span>SMK NEGERI 1 SINGKAWANG & SMK MUDITA SINGKAWANG</span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Portal Lembar Kerja Peserta Didik (LKPD)
          </h1>
          <p className="text-slate-600 text-xs sm:text-sm font-medium leading-relaxed">
            Mata Pelajaran <span className="text-blue-700 font-semibold">Teknologi Jaringan Kabel & Nirkabel (TJKN)</span> Fase F.
            Silakan <span className="text-amber-700 font-bold underline underline-offset-4">isi dan pilih nama Anda terlebih dahulu</span> untuk membuka seluruh menu modul, simulasi praktikum, dan ujian CBT LKPD.
          </p>

          {/* Locked Status Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-mono font-bold">
            <Lock className="w-4 h-4 text-amber-600 animate-pulse" />
            <span>STATUS: MENU LKPD TERKUNCI (MENUNGGU PRESENSI SISWA)</span>
          </div>
        </div>
      </div>

      {/* Main Student Identification & Attendance Card (Modeled after image_af84b6d6.png) */}
      <div className="bg-white border-2 border-slate-200 hover:border-blue-400 rounded-3xl p-6 sm:p-8 shadow-sm relative transition-all">
        {/* Attendance Visual Header from user's image */}
        <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center justify-center font-mono font-extrabold text-lg shadow-2xs">
              {dateNum}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold font-mono text-emerald-700 uppercase tracking-wider">
                  Presensi Pembelajaran
                </span>
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              </div>
              <div className="text-sm font-bold text-slate-900">
                {dayName}, {dateNum} {monthName} {yearNum}
              </div>
            </div>
          </div>

          {/* Visual Buttons matching image_af84b6d6.png */}
          <div className="flex items-center gap-2">
            <div className="px-4 py-2 rounded-xl border-2 border-emerald-500 bg-emerald-50 text-emerald-700 font-extrabold text-xs tracking-wider shadow-2xs flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>HADIR</span>
            </div>
            <div className="px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-400 font-semibold text-xs">
              <span>LIBUR</span>
            </div>
          </div>
        </div>

        {/* Dropdown Selector Component with Image Match */}
        <div className="pt-6 space-y-4">
          <label className="block text-xs font-bold text-slate-700 font-mono uppercase tracking-wider">
            Langkah 1: Cari & Pilih Identitas Siswa
          </label>

          <StudentSelector
            students={students}
            selectedStudent={selectedTemp}
            onSelectStudent={(student) => {
              setSelectedTemp(student);
              handleConfirmStudent(student);
            }}
            isModal={false}
          />
        </div>

        {/* Quick Help Text */}
        <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-1.5">
            <HelpCircle className="w-4 h-4 text-slate-400" />
            <span>Nama Anda tidak tercantum? Hubungi Guru Pengampu (Pak Simon Murd).</span>
          </div>

          <button
            onClick={onOpenTeacherLogin}
            className="text-xs font-bold text-blue-600 hover:text-blue-800 underline underline-offset-2 flex items-center gap-1"
          >
            <span>Login Guru Pengampu</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* 3 LKPD Pedagogical Preview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-2">
          <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-700 border border-blue-200 flex items-center justify-center font-bold text-xs">
            1
          </div>
          <h4 className="font-bold text-sm text-slate-900">4 Praktikum Simulasi</h4>
          <p className="text-xs text-slate-500 leading-relaxed">
            Crimping kabel T568A/B, LAN tester, spektrum frekuensi 2.4/5GHz, penyambungan core fiber optic, hingga QoS.
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-2">
          <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-700 border border-purple-200 flex items-center justify-center font-bold text-xs">
            2
          </div>
          <h4 className="font-bold text-sm text-slate-900">40 Soal Evaluasi CBT</h4>
          <p className="text-xs text-slate-500 leading-relaxed">
            20 butir Pilihan Ganda Tunggal + 20 butir Pilihan Ganda Kompleks terstandar HOTS dengan KKM 75.
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-2">
          <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center font-bold text-xs">
            3
          </div>
          <h4 className="font-bold text-sm text-slate-900">10 Soal Analisis Esai</h4>
          <p className="text-xs text-slate-500 leading-relaxed">
            Studi kasus analisis gangguan riil lapangan dengan umpan balik rubrik penilaian otomatis.
          </p>
        </div>
      </div>
    </div>
  );
};
