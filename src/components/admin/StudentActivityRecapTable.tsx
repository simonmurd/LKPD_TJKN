import React, { useState, useEffect } from 'react';
import {
  StudentProfile,
  CurriculumBab,
  ExamSubmission,
  SimulationLogEntry,
  RombelAssignment,
  EssayLogEntry,
  StudentTaskAssignment,
} from '../../types/curriculum';
import { fetchTasksFromServer, getCachedTasks } from '../../services/tasksService';
import { isBabAccessibleForStudent } from '../../data/rombelAssignments';
import { TeacherEssayGradingModal } from './TeacherEssayGradingModal';
import {
  fetchSimulationLogsFromFirestore,
  fetchEssayLogsFromFirestore,
  deleteStudentProgressFromFirestore,
  clearAllDataFromFirestore,
} from '../../lib/firebase';
import {
  Search,
  Filter,
  Download,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ShieldAlert,
  MessageSquare,
  Award,
  Play,
  FileQuestion,
  PenTool,
  RotateCcw,
  Check,
  XCircle,
  FileSpreadsheet,
  Users,
  Eye,
  Sliders,
  Sparkles,
} from 'lucide-react';

interface StudentActivityRecapTableProps {
  students: StudentProfile[];
  submissions: Record<string, ExamSubmission>;
  babs: CurriculumBab[];
  rombelAssignments: Record<string, RombelAssignment>;
  onCancelSubmission: (key: string, reason: string) => void;
  onRestoreSubmission: (key: string) => void;
  onRefresh: () => void;
  onOpenChatWithStudent?: (student: StudentProfile) => void;
}

export const StudentActivityRecapTable: React.FC<StudentActivityRecapTableProps> = ({
  students,
  submissions,
  babs,
  rombelAssignments,
  onCancelSubmission,
  onRestoreSubmission,
  onRefresh,
  onOpenChatWithStudent,
}) => {
  // Filter States
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterSchool, setFilterSchool] = useState<string>('all');
  const [filterClass, setFilterClass] = useState<string>('all');
  const [filterBab, setFilterBab] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<
    'all' | 'completed' | 'remedial' | 'too_fast' | 'cancelled' | 'pending'
  >('all');
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [showDangerActions, setShowDangerActions] = useState<boolean>(false);
  const [assignedTasks, setAssignedTasks] = useState<StudentTaskAssignment[]>(() => getCachedTasks());

  useEffect(() => {
    const loadTasks = () => {
      fetchTasksFromServer().then(setAssignedTasks).catch(() => {});
    };
    loadTasks();
    window.addEventListener('tjkn_tasks_updated', loadTasks);
    return () => window.removeEventListener('tjkn_tasks_updated', loadTasks);
  }, []);
  const [viewMode, setViewMode] = useState<'detail' | 'matrix'>('matrix');
  const [resetTarget, setResetTarget] = useState<{
    scope: 'student' | 'rombel';
    studentId?: string;
    studentName?: string;
    rombel?: string;
    school?: string;
  } | null>(null);
  const [isResetting, setIsResetting] = useState<boolean>(false);

  const handleConfirmReset = async () => {
    if (!resetTarget) return;
    setIsResetting(true);
    try {
      await fetch('/api/admin/reset-student-tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(resetTarget),
      });
      await deleteStudentProgressFromFirestore(resetTarget.scope, resetTarget);
      await handleManualRefresh();
      setResetTarget(null);
      window.location.reload();
    } catch (err) {
      console.error('Gagal mereset tugas:', err);
    } finally {
      setIsResetting(false);
    }
  };

  // Simulation logs and Essay logs from server
  const [simulationLogs, setSimulationLogs] = useState<SimulationLogEntry[]>([]);
  const [essayLogs, setEssayLogs] = useState<EssayLogEntry[]>([]);

  // Assessment Weights for SMK Fase F (Default: 40% Praktik Simulasi + 30% Teori CBT + 30% Esai Komprehensif)
  const [weightSim, setWeightSim] = useState<number>(40);
  const [weightCbt, setWeightCbt] = useState<number>(30);
  const [weightEssay, setWeightEssay] = useState<number>(30);
  const [showWeightSettings, setShowWeightSettings] = useState<boolean>(false);

  // Cancellation Modal state
  const [cancellingTarget, setCancellingTarget] = useState<{
    key: string;
    name: string;
    babCode: string;
    defaultReason: string;
  } | null>(null);
  const [cancelReasonInput, setCancelReasonInput] = useState<string>('Pengerjaan terlalu cepat (< 2 menit)');

  // Teacher Essay Grading Modal Target
  const [gradingTarget, setGradingTarget] = useState<{
    student: StudentProfile;
    bab: CurriculumBab;
    essayLog?: EssayLogEntry;
  } | null>(null);

  const loadData = async () => {
    // 1. Simulation logs (Firestore + Server)
    try {
      const firestoreSims = await fetchSimulationLogsFromFirestore();
      if (firestoreSims && firestoreSims.length > 0) {
        setSimulationLogs(firestoreSims);
      } else {
        const res = await fetch('/api/simulation-logs');
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data.logs)) setSimulationLogs(data.logs);
        }
      }
    } catch {
      try {
        const raw = localStorage.getItem('tjkn_simulation_logs');
        if (raw) setSimulationLogs(JSON.parse(raw));
      } catch {
        // ignore
      }
    }

    // 2. Essay logs (Firestore + Server)
    try {
      const firestoreEssays = await fetchEssayLogsFromFirestore();
      if (firestoreEssays && firestoreEssays.length > 0) {
        setEssayLogs(firestoreEssays);
      } else {
        const resEssays = await fetch('/api/essay-logs');
        if (resEssays.ok) {
          const data = await resEssays.json();
          if (Array.isArray(data.essays)) setEssayLogs(data.essays);
        }
      }
    } catch {
      // ignore
    }
  };

  // Real-Time Polling: automatically sync with student submissions and logs every 3.5 seconds
  useEffect(() => {
    loadData();

    const interval = setInterval(() => {
      loadData();
      onRefresh();
    }, 3500);

    return () => clearInterval(interval);
  }, []);

  const handleManualRefresh = () => {
    setIsRefreshing(true);
    onRefresh();
    loadData();
    setTimeout(() => setIsRefreshing(false), 700);
  };

  // Unique Filter Options
  const uniqueSchools = Array.from(new Set(students.map((s) => s.school)));
  const uniqueClasses = Array.from(
    new Set(
      students
        .filter((s) => filterSchool === 'all' || s.school === filterSchool)
        .map((s) => s.className)
    )
  );

  // Helper to get descriptive Capaian Pembelajaran (CP) for e-Rapor
  const getCpDescription = (na: number, babTitle: string) => {
    if (na >= 90) {
      return `Sangat kompeten dalam memahami konsep dan implementasi teknis ${babTitle}. Menunjukkan kemampuan analisis troubleshooting dan konfigurasi praktis berstandar industri.`;
    } else if (na >= 80) {
      return `Kompeten dalam penguasaan materi ${babTitle}. Mampu menyelesaikan penugasan praktik dan asesmen teori secara mandiri dengan hasil memuaskan.`;
    } else if (na >= 75) {
      return `Cukup kompeten dalam memahami capaian ${babTitle}. Telah melampaui KKM (75), disarankan memperkuat ketelitian prosedur K3 dan studi kasus lapangan.`;
    } else {
      return `Perlu bimbingan dan tindak lanjut remedial pada materi ${babTitle}. Membutuhkan pendalaman konsep dasar dan latihan praktik terbimbing di lab.`;
    }
  };

  // Build Unified Student Activity Records with NA (Nilai Akhir) calculation
  const activityRows = students.flatMap((student) => {
    const assignedBabs = babs.filter((b) =>
      isBabAccessibleForStudent(student, b.id, rombelAssignments)
    );

    return assignedBabs.map((bab) => {
      const subKey = `${student.id}_${bab.id}`;
      const examSub = submissions[subKey];

      // Find simulation log
      const simLog = simulationLogs.find(
        (l) =>
          (l.studentId === student.id || l.studentName?.toLowerCase() === student.name.toLowerCase()) &&
          l.babId === bab.id
      );

      // Find all AI-graded essay logs for this student & bab
      const studentBabEssays = essayLogs.filter(
        (e) =>
          (e.studentId === student.id || e.studentName?.toLowerCase() === student.name.toLowerCase()) &&
          e.babId === bab.id
      );
      const essayLog = studentBabEssays[0];

      // Component scores (Essay is automatically graded by AI)
      const scoreSim = simLog ? (simLog.score !== undefined ? simLog.score : 100) : 0;
      const scoreCbt = examSub ? examSub.percentage : 0;
      const scoreEssay =
        studentBabEssays.length > 0
          ? Math.round(
              studentBabEssays.reduce(
                (acc, item) =>
                  acc + (item.teacherScore !== undefined ? item.teacherScore : item.score || 0),
                0
              ) / studentBabEssays.length
            )
          : 0;

      const hasSim = Boolean(simLog);
      const hasCbt = Boolean(examSub);
      const hasEssay = studentBabEssays.length > 0;

      // Composite Score: NA (Nilai Akhir)
      let compositeScore = 0;
      if (hasSim || hasCbt || hasEssay) {
        const totalWeight =
          (hasSim ? weightSim : 0) +
          (hasCbt ? weightCbt : 0) +
          (hasEssay ? weightEssay : 0);

        if (totalWeight > 0) {
          const weightedSum =
            (hasSim ? scoreSim * weightSim : 0) +
            (hasCbt ? scoreCbt * weightCbt : 0) +
            (hasEssay ? scoreEssay * weightEssay : 0);
          compositeScore = Math.round(weightedSum / totalWeight);
        }
      }

      // Predikat (Huruf)
      let predikat: 'A' | 'B' | 'C' | 'D' = 'D';
      if (compositeScore >= 90) predikat = 'A';
      else if (compositeScore >= 80) predikat = 'B';
      else if (compositeScore >= 75) predikat = 'C';
      else predikat = 'D';

      const isCancelled = examSub?.status === 'cancelled_by_teacher';
      const isPassed = compositeScore >= 75 && !isCancelled && (hasCbt || hasSim);
      const isTooFast = examSub ? Boolean(examSub.isFlaggedTooFast) : false;

      let statusType: 'completed' | 'remedial' | 'too_fast' | 'cancelled' | 'pending' = 'pending';
      if (isCancelled) {
        statusType = 'cancelled';
      } else if (isTooFast) {
        statusType = 'too_fast';
      } else if (hasCbt && isPassed) {
        statusType = 'completed';
      } else if (hasCbt && !isPassed) {
        statusType = 'remedial';
      } else {
        statusType = 'pending';
      }

      const cpDescription = getCpDescription(compositeScore, bab.title);

      return {
        key: subKey,
        student,
        bab,
        examSub,
        simLog,
        essayLog,
        scoreSim,
        scoreCbt,
        scoreEssay,
        compositeScore,
        predikat,
        cpDescription,
        statusType,
        hasCbt,
        hasSim,
        hasEssay,
        isCancelled,
        isPassed,
        isTooFast,
      };
    });
  });

  // Filter Rows
  const filteredRows = activityRows.filter((row) => {
    const q = searchQuery.toLowerCase().trim();
    const isExplicitNameMatch = Boolean(
      q &&
        (row.student.name.toLowerCase().includes(q) ||
          row.student.noAbsen.includes(q))
    );

    const matchSearch =
      !q ||
      row.student.name.toLowerCase().includes(q) ||
      row.student.noAbsen.includes(q) ||
      row.student.className.toLowerCase().includes(q) ||
      row.student.school.toLowerCase().includes(q) ||
      row.bab.title.toLowerCase().includes(q) ||
      row.bab.code.toLowerCase().includes(q);

    const matchSchool =
      isExplicitNameMatch || filterSchool === 'all' || row.student.school === filterSchool;
    const matchClass =
      isExplicitNameMatch || filterClass === 'all' || row.student.className === filterClass;
    const matchBab =
      isExplicitNameMatch || filterBab === 'all' || String(row.bab.id) === filterBab;
    const matchStatus =
      filterStatus === 'all' || row.statusType === filterStatus;

    return matchSearch && matchSchool && matchClass && matchBab && matchStatus;
  });

  // Calculate Metrics from current filtered view
  const totalRecords = filteredRows.length;
  const completedRecords = filteredRows.filter((r) => r.isPassed).length;
  const remedialRecords = filteredRows.filter(
    (r) => r.hasCbt && !r.isPassed && !r.isCancelled
  ).length;
  const tooFastRecords = filteredRows.filter((r) => r.isTooFast).length;
  const submittedCbtList = filteredRows.filter((r) => r.examSub && !r.isCancelled);
  const avgCbtScore =
    submittedCbtList.length > 0
      ? Math.round(
          submittedCbtList.reduce((acc, curr) => acc + (curr.examSub?.percentage || 0), 0) /
            submittedCbtList.length
        )
      : 0;

  // Average Composite NA
  const activeNaList = filteredRows.filter((r) => r.compositeScore > 0 && !r.isCancelled);
  const avgNaScore =
    activeNaList.length > 0
      ? Math.round(
          activeNaList.reduce((acc, curr) => acc + curr.compositeScore, 0) / activeNaList.length
        )
      : 0;

  // Export to Clean Official SMK Leger CSV
  const handleExportCSV = () => {
    const headers = [
      'No Absen',
      'NIS/ID Siswa',
      'Nama Siswa',
      'Rombel',
      'Sekolah',
      'Modul (Bab)',
      'Judul Bab',
      `Nilai Praktik (${weightSim}%)`,
      `Nilai Teori CBT (${weightCbt}%)`,
      `Nilai Esai (${weightEssay}%)`,
      'Nilai Akhir (NA)',
      'Predikat Huruf',
      'Status KKM (75)',
      'Deskripsi Capaian Pembelajaran (e-Rapor)',
      'Durasi Pengerjaan CBT (Detik)',
      'Flag Terlalu Cepat',
      'Catatan Guru / Status Ujian',
      'Waktu Pengumpulan',
    ];

    const csvData = filteredRows.map((r) => [
      `"${r.student.noAbsen}"`,
      `"${r.student.id}"`,
      `"${r.student.name}"`,
      `"${r.student.className}"`,
      `"${r.student.school}"`,
      `"${r.bab.code}"`,
      `"${r.bab.title}"`,
      `"${r.hasSim ? r.scoreSim : '-'}"`,
      `"${r.hasCbt ? `${r.scoreCbt}%` : '-'}"`,
      `"${r.hasEssay ? r.scoreEssay : '-'}"`,
      `"${r.compositeScore > 0 ? r.compositeScore : '-'}"`,
      `"${r.compositeScore > 0 ? r.predikat : '-'}"`,
      `"${r.isPassed ? 'TUNTAS KKM' : r.hasCbt ? 'REMEDIAL' : 'BELUM TUNTAS'}"`,
      `"${r.cpDescription.replace(/"/g, '""')}"`,
      `"${r.examSub ? r.examSub.timeSpentSeconds : '-'}"`,
      `"${r.isTooFast ? 'YA (TERLALU CEPAT)' : 'NORMAL'}"`,
      `"${r.isCancelled ? 'DIBATALKAN GURU' : r.hasCbt ? 'SUBMITTED' : 'BELUM'}"`,
      `"${r.examSub ? new Date(r.examSub.date).toLocaleString('id-ID') : '-'}"`,
    ]);

    const csvContent =
      '\uFEFF' +
      [headers.join(';'), ...csvData.map((row) => row.join(';'))].join('\r\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Leger_Nilai_Rapor_TJKN_Fase_F_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">

      {/* Metrics Summary Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
          <div className="text-[11px] font-mono text-slate-500 font-semibold uppercase">
            Total Siswa Terdaftar
          </div>
          <div className="text-2xl font-black text-slate-900 mt-1">{totalRecords}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Penugasan Rombel Aktif</div>
        </div>

        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 shadow-xs">
          <div className="text-[11px] font-mono text-emerald-700 font-semibold uppercase">
            Tuntas KKM (NA &ge; 75)
          </div>
          <div className="text-2xl font-black text-emerald-900 mt-1">{completedRecords}</div>
          <div className="text-[10px] text-emerald-700 mt-0.5">
            {totalRecords ? Math.round((completedRecords / totalRecords) * 100) : 0}% Tingkat Kelulusan
          </div>
        </div>

        <div className="bg-red-50 border border-red-200 rounded-2xl p-4 shadow-xs">
          <div className="text-[11px] font-mono text-red-700 font-semibold uppercase">
            Remedial (NA &lt; 75)
          </div>
          <div className="text-2xl font-black text-red-900 mt-1">{remedialRecords}</div>
          <div className="text-[10px] text-red-700 mt-0.5">Perlu Program Remedial</div>
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 shadow-xs">
          <div className="text-[11px] font-mono text-amber-800 font-semibold uppercase">
            Durasi Terlalu Cepat
          </div>
          <div className="text-2xl font-black text-amber-900 mt-1">{tooFastRecords}</div>
          <div className="text-[10px] text-amber-700 mt-0.5">&lt; 2 Menit (Flag Pengawas)</div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 shadow-xs">
          <div className="text-[11px] font-mono text-blue-700 font-semibold uppercase">
            Rata-rata NA Rapor
          </div>
          <div className="text-2xl font-black text-blue-900 mt-1">{avgNaScore}</div>
          <div className="text-[10px] text-blue-700 mt-0.5">Skala 0-100 (Kurikulum Merdeka)</div>
        </div>
      </div>

      {/* Control & Filter Toolbar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
          {/* Search Box */}
          <div className="flex items-center gap-2 flex-1 min-w-[220px] max-w-md">
            <Search className="w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari nama siswa (misal: Veliyan, Alvino), rombel, atau modul..."
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="text-xs text-slate-400 hover:text-slate-600 px-1"
              >
                Clear
              </button>
            )}
          </div>

          {/* Action Buttons: Bobot Rapor, Refresh, Export */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setShowWeightSettings(!showWeightSettings)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold transition shadow-2xs text-xs"
              title="Atur bobot persentase Nilai Akhir (NA) Rapor"
            >
              <Sliders className="w-3.5 h-3.5 text-slate-600" />
              <span>Bobot NA ({weightSim}% : {weightCbt}% : {weightEssay}%)</span>
            </button>

            <button
              onClick={handleManualRefresh}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 font-bold transition shadow-2xs text-xs cursor-pointer"
              title="Perbarui data terbaru dari semua perangkat siswa"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span>{isRefreshing ? 'Sinkronisasi...' : 'Segarkan Data'}</span>
            </button>

            <button
              type="button"
              onClick={() => setShowDangerActions((v) => !v)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border font-bold transition shadow-2xs text-xs cursor-pointer ${
                showDangerActions
                  ? 'bg-red-600 text-white border-red-600'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-600 border-slate-200'
              }`}
              title="Tampilkan atau sembunyikan tombol reset data"
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>Opsi Reset</span>
            </button>

            {showDangerActions && (
              <button
                type="button"
                onClick={async () => {
                  setIsRefreshing(true);
                  try {
                    localStorage.clear();
                    localStorage.setItem('tjkn_dummy_cleaned_v4', '1');
                    await fetch('/api/admin/clear-dummy-data', { method: 'POST' });
                    await clearAllDataFromFirestore();
                  } finally {
                    window.location.reload();
                  }
                }}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 font-bold transition shadow-2xs text-xs cursor-pointer"
                title="Kosongkan seluruh nilai & riwayat pengerjaan di Leger menjadi 0"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Kosongkan Semua Leger</span>
              </button>
            )}

            <div className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-mono font-bold shadow-2xs" title="Data hasil pengerjaan siswa diperbarui secara otomatis setiap beberapa detik">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
              <span>Live Real-Time Sync</span>
            </div>

            <button
              onClick={handleExportCSV}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold transition shadow-2xs text-xs"
              title="Unduh leger nilai lengkap e-Rapor format Excel/CSV"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Unduh Leger Rapor CSV</span>
            </button>
          </div>
        </div>

        {/* Collapsible Bobot Settings */}
        {showWeightSettings && (
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-900">
                Kalkulator Bobot Nilai Akhir (NA) Kurikulum Merdeka Kejuruan:
              </span>
              <span className="text-[11px] text-slate-500 font-mono">
                Total Bobot: {weightSim + weightCbt + weightEssay}%
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="bg-white p-3 rounded-lg border border-slate-200">
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  1. Praktik Simulasi: {weightSim}%
                </label>
                <input
                  type="range"
                  min="10"
                  max="60"
                  step="5"
                  value={weightSim}
                  onChange={(e) => setWeightSim(Number(e.target.value))}
                  className="w-full accent-blue-600"
                />
              </div>
              <div className="bg-white p-3 rounded-lg border border-slate-200">
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  2. Teori CBT (40 Soal): {weightCbt}%
                </label>
                <input
                  type="range"
                  min="10"
                  max="60"
                  step="5"
                  value={weightCbt}
                  onChange={(e) => setWeightCbt(Number(e.target.value))}
                  className="w-full accent-blue-600"
                />
              </div>
              <div className="bg-white p-3 rounded-lg border border-slate-200">
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  3. Esai Komprehensif: {weightEssay}%
                </label>
                <input
                  type="range"
                  min="10"
                  max="60"
                  step="5"
                  value={weightEssay}
                  onChange={(e) => setWeightEssay(Number(e.target.value))}
                  className="w-full accent-blue-600"
                />
              </div>
            </div>
          </div>
        )}

        {/* Filters Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 border-t border-slate-100 text-xs">
          {/* School filter */}
          <div>
            <label className="block text-[10px] font-mono font-bold text-slate-500 mb-1">
              Sekolah:
            </label>
            <select
              value={filterSchool}
              onChange={(e) => {
                setFilterSchool(e.target.value);
                setFilterClass('all');
              }}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-slate-700 font-medium truncate"
            >
              <option value="all">Semua Sekolah</option>
              {uniqueSchools.map((sch) => (
                <option key={sch} value={sch}>
                  {sch.includes('MUDITA') ? 'SMK Mudita Singkawang' : 'SMKN 1 Singkawang'}
                </option>
              ))}
            </select>
          </div>

          {/* Class filter */}
          <div>
            <label className="block text-[10px] font-mono font-bold text-slate-500 mb-1">
              Rombel:
            </label>
            <select
              value={filterClass}
              onChange={(e) => setFilterClass(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-slate-700 font-medium truncate"
            >
              <option value="all">Semua Rombel</option>
              {uniqueClasses.map((cls) => (
                <option key={cls} value={cls}>
                  {cls}
                </option>
              ))}
            </select>
          </div>

          {/* Bab filter */}
          <div>
            <label className="block text-[10px] font-mono font-bold text-slate-500 mb-1">
              Modul (Bab):
            </label>
            <select
              value={filterBab}
              onChange={(e) => setFilterBab(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-slate-700 font-medium truncate"
            >
              <option value="all">Semua Bab</option>
              {babs.map((b) => (
                <option key={b.id} value={String(b.id)}>
                  {b.code}: {b.title.slice(0, 18)}...
                </option>
              ))}
            </select>
          </div>

          {/* Status filter */}
          <div>
            <label className="block text-[10px] font-mono font-bold text-slate-500 mb-1">
              Status Kelulusan:
            </label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as any)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-slate-700 font-medium truncate"
            >
              <option value="all">Semua Status</option>
              <option value="completed">✓ Tuntas KKM (&ge; 75)</option>
              <option value="remedial">⚠ Remedial (&lt; 75)</option>
              <option value="too_fast">⏱ Terlalu Cepat (&lt; 2 menit)</option>
              <option value="cancelled">🚫 Dibatalkan Guru</option>
              <option value="pending">⏳ Belum Mengerjakan</option>
            </select>
          </div>
        </div>
      </div>

      {/* Action Bar: Reset Rombel (Hidden unless Opsi Reset is toggled) */}
      {showDangerActions && filterClass !== 'all' && (
        <div className="flex items-center justify-end">
          <button
            type="button"
            onClick={() =>
              setResetTarget({
                scope: 'rombel',
                rombel: filterClass,
                school: filterSchool !== 'all' ? filterSchool : undefined,
              })
            }
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 transition cursor-pointer"
            title={`Reset semua tugas & nilai untuk rombel ${filterClass}`}
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset Tugas Rombel ({filterClass})
          </button>
        </div>
      )}

      {/* Matrix Leger View (Mengikuti Tugas yang Diberikan Guru, atau 1-14 jika belum ada tugas) */}
      {(() => {
        const relevantTasks = assignedTasks.filter(
          (t) =>
            filterClass === 'all' ||
            t.targetType === 'all' ||
            t.targetType === 'school' ||
            t.targetClass === filterClass
        );
        const assignedBabIds = Array.from(new Set(relevantTasks.map((t) => t.babId))).sort(
          (a, b) => a - b
        );
        const displayBabIds =
          assignedBabIds.length > 0
            ? assignedBabIds
            : Array.from({ length: 14 }, (_, i) => i + 1);

        return (
          <div className="bg-white border border-slate-300 rounded-3xl shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-center text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100 border-b border-slate-300 text-slate-800 font-bold">
                    <th rowSpan={2} className="p-2.5 border-r border-slate-300 w-12">
                      NO
                    </th>
                    <th rowSpan={2} className="p-2.5 border-r border-slate-300 text-left min-w-[200px]">
                      NAMA SISWA
                    </th>
                    <th
                      colSpan={displayBabIds.length}
                      className="p-2 border-b border-r border-slate-300 uppercase tracking-wider text-[11px]"
                    >
                      {assignedBabIds.length > 0
                        ? `Nilai Tugas yang Diberikan (${assignedBabIds.length} Tugas)`
                        : 'Nilai Total Per Bab (1 – 14)'}
                    </th>
                    <th colSpan={2} className="p-2 border-b border-r border-slate-300 uppercase tracking-wider text-[11px]">
                      NILAI
                    </th>
                    <th rowSpan={2} className={`p-2.5 w-14 font-extrabold ${showDangerActions ? 'border-r border-slate-300' : ''}`}>
                      Rank
                    </th>
                    {showDangerActions && (
                      <th rowSpan={2} className="p-2.5 w-16 font-extrabold">
                        Reset
                      </th>
                    )}
                  </tr>
                  <tr className="bg-slate-50 border-b border-slate-300 text-slate-700 font-mono text-[11px]">
                    {displayBabIds.map((num) => (
                      <th key={num} className="p-1.5 border-r border-slate-200 min-w-[36px]" title={`Bab ${num}`}>
                        {num}
                      </th>
                    ))}
                    <th className="p-1.5 border-r border-slate-200 min-w-[52px]">Total</th>
                    <th className="p-1.5 border-r border-slate-300 min-w-[48px]">NA</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {(() => {
                    const filteredMatrixStudents = students.filter((s) => {
                      const q = searchQuery.toLowerCase().trim();
                      const matchSearch =
                        !q ||
                        s.name.toLowerCase().includes(q) ||
                        s.noAbsen.includes(q) ||
                        s.className.toLowerCase().includes(q);
                      const matchSchool = filterSchool === 'all' || s.school === filterSchool;
                      const matchClass = filterClass === 'all' || s.className === filterClass;
                      return matchSearch && matchSchool && matchClass;
                    });

                    const matrixRows = filteredMatrixStudents.map((student) => {
                      const babScores: Record<number, number> = {};
                      let totalSum = 0;
                      let completedBabs = 0;

                      for (const babId of displayBabIds) {
                        const row = activityRows.find(
                          (r) => r.student.id === student.id && r.bab.id === babId
                        );
                        const val = row ? row.compositeScore : 0;
                        babScores[babId] = val;
                        totalSum += val;
                        if (val > 0) completedBabs++;
                      }

                      const na =
                        assignedBabIds.length > 0
                          ? Math.round(totalSum / assignedBabIds.length)
                          : completedBabs > 0
                          ? Math.round(totalSum / completedBabs)
                          : 0;
                      return { student, babScores, totalSum, na };
                    });

                    const sortedTotals = [...matrixRows]
                      .map((r) => r.totalSum)
                      .sort((a, b) => b - a);

                    return matrixRows.map((r) => {
                      const rank = sortedTotals.indexOf(r.totalSum) + 1;
                      return (
                        <tr key={r.student.id} className="hover:bg-blue-50/40 transition">
                          <td className="p-2 border-r border-slate-200 font-mono font-bold text-slate-600">
                            {r.student.noAbsen}
                          </td>
                          <td className="p-2 border-r border-slate-200 text-left font-bold text-slate-900">
                            {r.student.noAbsen} {r.student.name}
                          </td>
                          {displayBabIds.map((num) => {
                            const val = r.babScores[num] || 0;
                            return (
                              <td
                                key={num}
                                className={`p-1.5 border-r border-slate-200 font-mono ${
                                  val === 0
                                    ? 'text-slate-300'
                                    : val < 75
                                    ? 'text-red-700 font-bold bg-red-50/50'
                                    : 'text-slate-800 font-semibold'
                                }`}
                              >
                                {val}
                              </td>
                            );
                          })}
                          <td className="p-2 border-r border-slate-200 font-mono font-extrabold text-slate-900 bg-slate-50">
                            {r.totalSum}
                          </td>
                          <td
                            className={`p-2 border-r border-slate-200 font-mono font-extrabold ${
                              r.na === 0
                                ? 'text-slate-400'
                                : r.na < 75
                                ? 'bg-red-100 text-red-800'
                                : 'bg-emerald-100 text-emerald-800'
                            }`}
                          >
                            {r.na}
                          </td>
                          <td className={`p-2 font-mono font-extrabold text-blue-700 ${showDangerActions ? 'border-r border-slate-200' : ''}`}>
                            {rank}
                          </td>
                          {showDangerActions && (
                            <td className="p-1.5">
                              <button
                                type="button"
                                onClick={() =>
                                  setResetTarget({
                                    scope: 'student',
                                    studentId: r.student.id,
                                    studentName: r.student.name,
                                  })
                                }
                                className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition cursor-pointer"
                                title={`Reset semua tugas & nilai ${r.student.name}`}
                              >
                                <RotateCcw className="w-3.5 h-3.5 mx-auto" />
                              </button>
                            </td>
                          )}
                        </tr>
                      );
                    });
                  })()}
                </tbody>
              </table>
            </div>
          </div>
        );
      })()}

      {/* In-Page Modal for Submission Cancellation */}
      {cancellingTarget && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-xl max-w-md w-full p-6 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-3 text-red-600">
              <ShieldAlert className="w-6 h-6" />
              <h3 className="font-bold text-base text-slate-900">Batalkan Hasil Ujian Siswa</h3>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Anda akan membatalkan hasil ujian <strong>{cancellingTarget.name}</strong> untuk <strong>{cancellingTarget.babCode}</strong>. Siswa akan diminta mengulang ujian setelah Anda membatalkannya.
            </p>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">
                Alasan Pembatalan (Tercatat di sistem):
              </label>
              <textarea
                value={cancelReasonInput}
                onChange={(e) => setCancelReasonInput(e.target.value)}
                rows={2}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setCancellingTarget(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition"
              >
                Tutup
              </button>
              <button
                onClick={() => {
                  onCancelSubmission(cancellingTarget.key, cancelReasonInput);
                  setCancellingTarget(null);
                }}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-red-600 hover:bg-red-700 text-white transition shadow-xs"
              >
                Konfirmasi Batalkan Ujian
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Teacher Essay Grading Modal */}
      {gradingTarget && (
        <TeacherEssayGradingModal
          student={gradingTarget.student}
          bab={gradingTarget.bab}
          essayLog={gradingTarget.essayLog}
          onClose={() => setGradingTarget(null)}
          onSaved={(updatedEssay) => {
            setEssayLogs((prev) => {
              const idx = prev.findIndex((e) => e.id === updatedEssay.id);
              if (idx !== -1) {
                const next = [...prev];
                next[idx] = updatedEssay;
                return next;
              }
              return [updatedEssay, ...prev];
            });
            handleManualRefresh();
          }}
        />
      )}

      {/* In-Page Modal for Resetting Student or Rombel Tasks */}
      {resetTarget && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-xl max-w-md w-full p-6 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-3 text-red-600">
              <RotateCcw className="w-6 h-6" />
              <h3 className="font-bold text-base text-slate-900">
                {resetTarget.scope === 'student'
                  ? `Reset Semua Tugas & Nilai Siswa`
                  : `Reset Semua Tugas & Nilai Rombel ${resetTarget.rombel}`}
              </h3>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              {resetTarget.scope === 'student' ? (
                <>
                  Anda akan mereset seluruh riwayat pengerjaan (CBT, Simulasi, dan Esai) milik{' '}
                  <strong>{resetTarget.studentName}</strong>. Siswa dapat mengerjakan ulang semua tugas dari awal.
                </>
              ) : (
                <>
                  Anda akan mereset seluruh riwayat pengerjaan (CBT, Simulasi, dan Esai) untuk semua siswa di rombel{' '}
                  <strong>{resetTarget.rombel}</strong>. Seluruh siswa di rombel ini dapat mengerjakan ulang dari awal.
                </>
              )}
            </p>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                disabled={isResetting}
                onClick={() => setResetTarget(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={isResetting}
                onClick={handleConfirmReset}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-red-600 text-white hover:bg-red-700 transition cursor-pointer disabled:opacity-50"
              >
                {isResetting ? 'Mereset...' : 'Ya, Reset Sekarang'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
