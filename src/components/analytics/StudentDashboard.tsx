import React, { useState, useEffect } from 'react';
import {
  CurriculumBab,
  ExamSubmission,
  UserRole,
  StudentProfile,
  StudentTaskAssignment,
  SimulationLogEntry,
  EssayLogEntry,
} from '../../types/curriculum';
import {
  fetchTasksFromServer,
  getTasksForStudent,
} from '../../services/tasksService';
import {
  Award,
  CheckCircle2,
  AlertTriangle,
  TrendingUp,
  BookOpen,
  Clock,
  ShieldCheck,
  ArrowRight,
  Bell,
  ClipboardList,
  Play,
  FileQuestion,
  PenTool,
  Users,
} from 'lucide-react';

interface StudentDashboardProps {
  babs: CurriculumBab[];
  submissions: Record<number, ExamSubmission>;
  onSelectBab: (id: number) => void;
  userRole: UserRole;
  activeStudent?: StudentProfile | null;
  onNavigateToTask?: (babId: number, tab: 'simulations' | 'objective' | 'qualitative') => void;
}

export const StudentDashboard: React.FC<StudentDashboardProps> = ({
  babs,
  submissions,
  onSelectBab,
  userRole,
  activeStudent,
  onNavigateToTask,
}) => {
  const [allTasks, setAllTasks] = useState<StudentTaskAssignment[]>([]);
  const [simLogs, setSimLogs] = useState<SimulationLogEntry[]>([]);
  const [essayLogs, setEssayLogs] = useState<EssayLogEntry[]>([]);

  useEffect(() => {
    fetchTasksFromServer().then(setAllTasks);
    fetch('/api/simulation-logs')
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d && Array.isArray(d.logs)) setSimLogs(d.logs);
      })
      .catch(() => {});
    fetch('/api/essay-logs')
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d && Array.isArray(d.essays)) setEssayLogs(d.essays);
      })
      .catch(() => {});

    const handleTaskUpdate = () => {
      fetchTasksFromServer().then(setAllTasks);
    };
    window.addEventListener('tjkn_tasks_updated', handleTaskUpdate);
    return () => window.removeEventListener('tjkn_tasks_updated', handleTaskUpdate);
  }, [activeStudent?.id]);

  const myTasks = getTasksForStudent(allTasks, activeStudent || null);

  // Check completion status for each assigned task
  const taskChecklist = myTasks.map((t) => {
    let isDone = false;
    let scoreLabel = '-';

    if (t.taskType === 'cbt') {
      const sub = submissions[t.babId];
      if (sub && sub.status !== 'cancelled_by_teacher') {
        isDone = true;
        scoreLabel = `${sub.percentage}%`;
      }
    } else if (t.taskType === 'simulation') {
      const sim = simLogs.find(
        (s) =>
          (s.studentId === activeStudent?.id ||
            s.studentName?.toLowerCase() === activeStudent?.name.toLowerCase()) &&
          s.babId === t.babId
      );
      if (sim) {
        isDone = true;
        scoreLabel = `${sim.score ?? 100}%`;
      }
    } else if (t.taskType === 'essay') {
      const essays = essayLogs.filter(
        (e) =>
          (e.studentId === activeStudent?.id ||
            e.studentName?.toLowerCase() === activeStudent?.name.toLowerCase()) &&
          e.babId === t.babId
      );
      if (essays.length > 0) {
        isDone = true;
        const avg = Math.round(
          essays.reduce((acc, item) => acc + (item.score || 0), 0) / essays.length
        );
        scoreLabel = `${avg}% (AI)`;
      }
    }

    return {
      ...t,
      isDone,
      scoreLabel,
    };
  });

  const pendingTasksCount = taskChecklist.filter((t) => !t.isDone).length;

  const completedCount = Object.keys(submissions).length;
  const passedCount = Object.values(submissions).filter((s) => s.isPassed).length;

  const totalScoreSum = Object.values(submissions).reduce((acc, s) => acc + s.percentage, 0);
  const avgScore = completedCount > 0 ? Math.round(totalScoreSum / completedCount) : 0;

  // UKK Readiness status
  let ukkStatus = 'Belum Siap';
  let ukkBadge = 'text-red-700 bg-red-50 border-red-200';
  if (passedCount >= 10 && avgScore >= 80) {
    ukkStatus = 'Sangat Siap UKK (Level Teknisi Madya)';
    ukkBadge = 'text-emerald-700 bg-emerald-50 border-emerald-200';
  } else if (passedCount >= 5 && avgScore >= 75) {
    ukkStatus = 'Cukup Siap (Perlu Pemantapan Fiber Optic & QoS)';
    ukkBadge = 'text-amber-700 bg-amber-50 border-amber-200';
  }

  // Categories
  const categories = [
    { name: 'Kabel & Perangkat Keras', babIds: [1, 2, 3, 4] },
    { name: 'Jaringan Nirkabel & Outdoor', babIds: [5, 6, 7, 8] },
    { name: 'Teknologi Fiber Optic', babIds: [9, 10, 11] },
    { name: 'Topologi, QoS & Troubleshooting', babIds: [12, 13, 14] },
  ];

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Tugas & Kegiatan dari Guru (Notifikasi & Tabel Ceklis) */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="relative p-2.5 rounded-2xl bg-blue-100 text-blue-700">
              <ClipboardList className="w-5 h-5" />
              {pendingTasksCount > 0 && (
                <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-red-600 rounded-full border-2 border-white animate-ping"></span>
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-base text-slate-900">
                  Tugas & Kegiatan dari Pak Simon Murd
                </h3>
                {pendingTasksCount > 0 ? (
                  <span className="px-2.5 py-0.5 rounded-full bg-red-600 text-white text-[11px] font-bold animate-pulse flex items-center gap-1">
                    <Bell className="w-3 h-3" />
                    <span>{pendingTasksCount} Tugas Belum Dikerjakan</span>
                  </span>
                ) : taskChecklist.length > 0 ? (
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-bold">
                    ✓ Semua Tugas Selesai
                  </span>
                ) : null}
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Daftar tugas Simulasi, CBT, dan Esai yang dikirimkan guru. Nilai otomatis tercatat di Leger.
              </p>
            </div>
          </div>
        </div>

        {!activeStudent && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center justify-between gap-3 text-amber-900 text-xs">
            <div className="flex items-center gap-2.5">
              <Users className="w-5 h-5 text-amber-600 shrink-0" />
              <div>
                <span className="font-bold">Mode Tamu (Belum Memilih Nama Siswa).</span>{' '}
                Berikut adalah daftar tugas aktif dari Pak Simon Murd. Silakan klik tombol{' '}
                <strong>"Ketik atau pilih Nama Siswa"</strong> di navigasi atas agar hasil pengerjaanmu otomatis tercatat di Leger Guru.
              </div>
            </div>
          </div>
        )}

        {taskChecklist.length === 0 ? (
          <div className="p-6 text-center rounded-2xl bg-slate-50 border border-slate-200/80 text-xs text-slate-500">
            Belum ada tugas khusus yang dikirimkan oleh Pak Simon Murd saat ini. Kamu tetap bebas mempelajari semua modul.
          </div>
        ) : (
          <div className="overflow-x-auto border border-slate-200 rounded-2xl">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-mono text-[10px] uppercase">
                <tr>
                  <th className="p-3">Ceklis</th>
                  <th className="p-3">Judul Tugas & Kegiatan</th>
                  <th className="p-3">Target</th>
                  <th className="p-3">Modul</th>
                  <th className="p-3">Jenis</th>
                  <th className="p-3">Nilai</th>
                  <th className="p-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {taskChecklist.map((t) => (
                  <tr
                    key={t.id}
                    className={t.isDone ? 'bg-emerald-50/20' : 'bg-white hover:bg-slate-50'}
                  >
                    <td className="p-3">
                      {t.isDone ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[11px]">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Sudah</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 font-bold text-[11px]">
                          <Clock className="w-3.5 h-3.5 text-amber-600" />
                          <span>Belum</span>
                        </span>
                      )}
                    </td>
                    <td className="p-3">
                      <div className="font-bold text-slate-900">{t.title}</div>
                      {t.notes && (
                        <div className="text-[11px] text-slate-500 italic mt-0.5">
                          "{t.notes}"
                        </div>
                      )}
                    </td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-mono text-[10px] font-semibold">
                        {t.targetType === 'all'
                          ? 'Semua Siswa'
                          : t.targetType === 'school'
                          ? t.targetSchool?.replace(' SINGKAWANG', '')
                          : t.targetType === 'class'
                          ? `Rombel ${t.targetClass}`
                          : `Khusus: ${t.targetStudentName || t.targetStudentId}`}
                      </span>
                    </td>
                    <td className="p-3 font-mono font-bold text-slate-700">{t.babCode}</td>
                    <td className="p-3">
                      <span
                        className={`px-2 py-0.5 rounded-md text-[10px] font-mono font-bold uppercase ${
                          t.taskType === 'simulation'
                            ? 'bg-blue-100 text-blue-800'
                            : t.taskType === 'cbt'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-purple-100 text-purple-800'
                        }`}
                      >
                        {t.taskType === 'simulation'
                          ? 'Simulasi'
                          : t.taskType === 'cbt'
                          ? 'CBT'
                          : 'Esai AI'}
                      </span>
                    </td>
                    <td className="p-3 font-mono font-bold text-slate-900">{t.scoreLabel}</td>
                    <td className="p-3 text-right">
                      <button
                        type="button"
                        onClick={() => {
                          const targetTab =
                            t.taskType === 'simulation'
                              ? 'simulations'
                              : t.taskType === 'cbt'
                              ? 'objective'
                              : 'qualitative';
                          if (onNavigateToTask) {
                            onNavigateToTask(t.babId, targetTab);
                          } else {
                            onSelectBab(t.babId);
                          }
                        }}
                        className={`px-3 py-1.5 rounded-xl font-bold text-[11px] transition inline-flex items-center gap-1 cursor-pointer ${
                          t.isDone
                            ? 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                            : 'bg-blue-600 hover:bg-blue-700 text-white shadow-2xs'
                        }`}
                      >
                        <span>{t.isDone ? 'Buka Lagi' : 'Kerjakan'}</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Tabel Ceklis Sumatif Lingkup Materi (1 - 14) & Nilai Akhir (NA) */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="font-extrabold text-base text-slate-900">
              Rekap Ceklis Sumatif Lingkup Materi (Bab 1 – 14)
            </h3>
            <p className="text-xs text-slate-500">
              Tanda ceklis (✓) menunjukkan modul/tugas yang sudah dikerjakan, beserta Nilai Akhir (NA) total.
            </p>
          </div>
          <span className="text-[11px] font-mono text-slate-500 bg-slate-100 px-3 py-1 rounded-xl">
            KKM: 75 • Klik nomor Bab untuk membuka modul
          </span>
        </div>

        <div className="overflow-x-auto border border-slate-300 rounded-2xl">
          <table className="w-full text-center text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100 border-b border-slate-300 text-slate-800 font-bold">
                <th rowSpan={2} className="p-2.5 border-r border-slate-300 w-12">
                  No
                </th>
                <th rowSpan={2} className="p-2.5 border-r border-slate-300 text-left min-w-[180px]">
                  Nama Siswa
                </th>
                <th colSpan={14} className="p-2 border-b border-r border-slate-300 uppercase tracking-wider text-[11px]">
                  Sumatif Lingkup Materi (Bab 1 – 14)
                </th>
                <th rowSpan={2} className="p-2.5 w-16 font-extrabold">
                  NA
                </th>
              </tr>
              <tr className="bg-slate-50 border-b border-slate-300 text-slate-700 font-mono text-[11px]">
                {Array.from({ length: 14 }, (_, i) => i + 1).map((num) => (
                  <th
                    key={num}
                    onClick={() => onSelectBab(num)}
                    title={`Buka Bab ${num}`}
                    className="p-1.5 border-r border-slate-300 w-9 cursor-pointer hover:bg-blue-100 hover:text-blue-700 transition"
                  >
                    {num}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr className="bg-white hover:bg-slate-50/70">
                <td className="p-2.5 border-r border-slate-300 font-mono font-bold text-slate-700">
                  {activeStudent?.noAbsen || '01'}
                </td>
                <td className="p-2.5 border-r border-slate-300 text-left font-bold text-slate-900">
                  {activeStudent ? `${activeStudent.noAbsen} ${activeStudent.name}` : 'Siswa Aktif'}
                </td>
                {Array.from({ length: 14 }, (_, i) => i + 1).map((num) => {
                  const sub = submissions[num];
                  const hasSim = simLogs.some(
                    (s) =>
                      (s.studentId === activeStudent?.id ||
                        s.studentName?.toLowerCase() === activeStudent?.name.toLowerCase()) &&
                      s.babId === num
                  );
                  const hasEssay = essayLogs.some(
                    (e) =>
                      (e.studentId === activeStudent?.id ||
                        e.studentName?.toLowerCase() === activeStudent?.name.toLowerCase()) &&
                      e.babId === num
                  );
                  const isChecked = Boolean(
                    (sub && sub.status !== 'cancelled_by_teacher') || hasSim || hasEssay
                  );

                  return (
                    <td
                      key={num}
                      onClick={() => onSelectBab(num)}
                      className="p-2 border-r border-slate-300 font-bold text-sm cursor-pointer hover:bg-blue-50 transition"
                    >
                      {isChecked ? (
                        <span className="text-emerald-600 font-extrabold">✓</span>
                      ) : (
                        <span className="text-slate-200">-</span>
                      )}
                    </td>
                  );
                })}
                <td
                  className={`p-2.5 font-mono font-extrabold text-sm ${
                    avgScore === 0
                      ? 'bg-slate-100 text-slate-500'
                      : avgScore < 75
                      ? 'bg-red-100 text-red-800'
                      : 'bg-emerald-100 text-emerald-800'
                  }`}
                >
                  {avgScore}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
