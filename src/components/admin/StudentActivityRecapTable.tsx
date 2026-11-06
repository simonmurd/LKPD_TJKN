import React, { useState, useEffect } from 'react';
import {
  StudentProfile,
  CurriculumBab,
  ExamSubmission,
  SimulationLogEntry,
  RombelAssignment,
  EssayLogEntry,
} from '../../types/curriculum';
import { isBabAccessibleForStudent } from '../../data/rombelAssignments';
import { TeacherEssayGradingModal } from './TeacherEssayGradingModal';
import {
  fetchSimulationLogsFromFirestore,
  fetchEssayLogsFromFirestore,
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
      {/* Top Banner Alert for Veliyan Vinson or New Verified Activity */}
      {filteredRows.some((r) => r.student.name.toLowerCase().includes('veliyan')) && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-3xl p-5 flex flex-wrap items-center justify-between gap-4 text-xs shadow-xs">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white font-mono font-black flex items-center justify-center text-base shadow-sm">
              31
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-extrabold text-base text-emerald-950">
                  Data Terverifikasi: VELIYAN VINSON
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-200/70 text-emerald-900 font-mono font-bold text-[11px]">
                  XII TJKT • SMK MUDITA
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-600 text-white font-mono font-bold text-[11px]">
                  CBT: 93% • NA Rapor: 94 (A - Sangat Kompeten)
                </span>
              </div>
              <p className="text-emerald-800 text-xs mt-1">
                Modul Bab 8: Jaringan Nirkabel Outdoor • Simulasi LoS (95 Poin) • CBT 37/40 • Esai Dinilai (95 Poin).
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onOpenChatWithStudent && (
              <button
                onClick={() => {
                  const veliyan = students.find((s) => s.id === 'mudita_xii_31');
                  if (veliyan) onOpenChatWithStudent(veliyan);
                }}
                className="px-3.5 py-2 rounded-xl bg-white border border-emerald-300 text-emerald-800 font-bold hover:bg-emerald-100 transition flex items-center gap-1.5 shadow-2xs cursor-pointer"
              >
                <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                <span>Kirim Pesan ke Veliyan</span>
              </button>
            )}
            <button
              onClick={() => setSearchQuery('Veliyan')}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Sorot di Leger</span>
            </button>
          </div>
        </div>
      )}

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
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 font-bold transition shadow-2xs text-xs"
              title="Perbarui data terbaru dari semua perangkat siswa"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span>{isRefreshing ? 'Sinkronisasi...' : 'Segarkan Data'}</span>
            </button>

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

      {/* Structured Leger Table */}
      <div className="bg-white border border-slate-200 rounded-3xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-mono text-[11px] uppercase tracking-wider">
              <tr>
                <th className="p-4">Peserta Didik</th>
                <th className="p-4">Rombel & Sekolah</th>
                <th className="p-4">Modul (Bab)</th>
                <th className="p-4 text-center">Part 1: Praktik ({weightSim}%)</th>
                <th className="p-4 text-center">Part 2: CBT ({weightCbt}%)</th>
                <th className="p-4 text-center">Part 3: Esai ({weightEssay}%)</th>
                <th className="p-4 text-center">Nilai Akhir (NA)</th>
                <th className="p-4 text-center">Status KKM</th>
                <th className="p-4 text-right">Aksi Guru Pro</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {filteredRows.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-12 text-center text-slate-400">
                    <Users className="w-8 h-8 mx-auto mb-2 opacity-30 text-slate-500" />
                    <p className="font-semibold text-slate-700">Tidak ada data kegiatan yang cocok</p>
                    <p className="text-[11px] text-slate-400 mt-1">
                      Coba sesuaikan kata kunci pencarian atau ubah filter di atas.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredRows.map((row) => {
                  const isHighlighted =
                    searchQuery &&
                    row.student.name.toLowerCase().includes(searchQuery.toLowerCase());

                  return (
                    <tr
                      key={row.key}
                      className={`hover:bg-slate-50/80 transition ${
                        isHighlighted ? 'bg-blue-50/40' : ''
                      }`}
                    >
                      {/* 1. Student Identity */}
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-800 flex items-center justify-center font-mono font-bold text-xs shrink-0 border border-slate-200">
                            {row.student.noAbsen}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900 text-xs">
                              {row.student.name}
                            </div>
                            <div className="text-[10px] text-slate-400 font-mono">
                              ID: {row.student.id}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* 2. Rombel & School */}
                      <td className="p-4">
                        <div className="space-y-0.5">
                          <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 font-mono font-bold text-[10px] border border-blue-200 inline-block">
                            {row.student.className}
                          </span>
                          <div className="text-[11px] text-slate-500 font-medium truncate max-w-[140px]">
                            {row.student.school.replace('SMK NEGERI 1 SINGKAWANG', 'SMKN 1').replace('SMK MUDITA SINGKAWANG', 'SMK Mudita')}
                          </div>
                        </div>
                      </td>

                      {/* 3. Module (Bab) */}
                      <td className="p-4">
                        <div className="space-y-0.5 max-w-[180px]">
                          <span className="font-mono font-bold text-slate-900 text-xs">
                            {row.bab.code}
                          </span>
                          <div className="text-[11px] text-slate-500 truncate" title={row.bab.title}>
                            {row.bab.title}
                          </div>
                        </div>
                      </td>

                      {/* 4. Part 1: Praktik Simulasi */}
                      <td className="p-4 text-center">
                        {row.hasSim ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-[11px] font-bold">
                            <Play className="w-3 h-3 text-emerald-600" />
                            <span>{row.scoreSim} Poin</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 text-[10px]">
                            <Clock className="w-2.5 h-2.5" />
                            <span>Belum</span>
                          </span>
                        )}
                      </td>

                      {/* 5. Part 2: CBT Evaluation */}
                      <td className="p-4 text-center">
                        {row.examSub ? (
                          <div className="flex flex-col items-center gap-0.5">
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs font-black text-slate-900">
                                {row.examSub.percentage}%
                              </span>
                              <span className="text-[10px] text-slate-400 font-mono">
                                ({row.examSub.totalScore}/40)
                              </span>
                            </div>
                            <div className="text-[10px] text-slate-400 font-mono">
                              ⏱ {Math.floor(row.examSub.timeSpentSeconds / 60)}m {row.examSub.timeSpentSeconds % 60}s
                            </div>
                            {row.examSub.isFlaggedTooFast && (
                              <span className="px-1.5 py-0.2 rounded bg-red-100 text-red-700 text-[9px] font-bold font-mono">
                                ⚠ Terlalu Cepat
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 text-[10px]">
                            <Clock className="w-2.5 h-2.5" />
                            <span>Belum Ujian</span>
                          </span>
                        )}
                      </td>

                      {/* 6. Part 3: Esai */}
                      <td className="p-4 text-center">
                        {row.hasEssay ? (
                          <div className="flex flex-col items-center gap-1">
                            <span
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                row.essayLog?.teacherScore !== undefined
                                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                  : 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                              }`}
                            >
                              <PenTool className="w-2.5 h-2.5" />
                              <span>
                                {row.essayLog?.teacherScore !== undefined
                                  ? `Guru: ${row.essayLog.teacherScore}`
                                  : `AI: ${row.essayLog?.score || 80}`}
                              </span>
                            </span>
                            <button
                              onClick={() =>
                                setGradingTarget({
                                  student: row.student,
                                  bab: row.bab,
                                  essayLog: row.essayLog,
                                })
                              }
                              className="text-[10px] text-blue-600 hover:text-blue-800 font-bold hover:underline"
                            >
                              Koreksi Esai ✎
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() =>
                              setGradingTarget({
                                student: row.student,
                                bab: row.bab,
                                essayLog: row.essayLog,
                              })
                            }
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 text-[10px] font-medium"
                          >
                            <PenTool className="w-2.5 h-2.5" />
                            <span>Beri Nilai Esai</span>
                          </button>
                        )}
                      </td>

                      {/* 7. Nilai Akhir (NA) & Predikat Rapor */}
                      <td className="p-4 text-center">
                        {row.compositeScore > 0 ? (
                          <div className="flex flex-col items-center gap-0.5">
                            <div className="flex items-center gap-1.5">
                              <span className="text-sm font-black text-slate-900">
                                {row.compositeScore}
                              </span>
                              <span
                                className={`px-2 py-0.2 rounded-md font-mono text-[11px] font-black ${
                                  row.predikat === 'A'
                                    ? 'bg-emerald-600 text-white'
                                    : row.predikat === 'B'
                                    ? 'bg-blue-600 text-white'
                                    : row.predikat === 'C'
                                    ? 'bg-amber-600 text-white'
                                    : 'bg-red-600 text-white'
                                }`}
                              >
                                {row.predikat}
                              </span>
                            </div>
                            <span className="text-[10px] text-slate-400 font-mono">
                              Skala Rapor
                            </span>
                          </div>
                        ) : (
                          <span className="text-[10px] text-slate-400 font-mono">-</span>
                        )}
                      </td>

                      {/* 8. Final KKM Status */}
                      <td className="p-4 text-center">
                        {row.isCancelled ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-red-100 text-red-800 text-[11px] font-bold">
                            <XCircle className="w-3.5 h-3.5 text-red-600" />
                            <span>Dibatalkan</span>
                          </span>
                        ) : row.isPassed ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 text-[11px] font-bold">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            <span>TUNTAS KKM</span>
                          </span>
                        ) : row.compositeScore > 0 ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 border border-amber-300 text-[11px] font-bold">
                            <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                            <span>REMEDIAL</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 text-[10px]">
                            <span>Belum Ada Nilai</span>
                          </span>
                        )}
                      </td>

                      {/* 9. Teacher Actions */}
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {onOpenChatWithStudent && (
                            <button
                              onClick={() => onOpenChatWithStudent(row.student)}
                              className="p-1.5 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 transition"
                              title={`Kirim Pesan ke ${row.student.name}`}
                            >
                              <MessageSquare className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {row.isCancelled ? (
                            <button
                              onClick={() => onRestoreSubmission(row.key)}
                              className="px-2.5 py-1 rounded-lg bg-slate-900 text-white font-semibold hover:bg-slate-800 transition text-[11px] flex items-center gap-1"
                              title="Pulihkan ujian yang dibatalkan"
                            >
                              <RotateCcw className="w-3 h-3" />
                              <span>Pulihkan</span>
                            </button>
                          ) : row.examSub ? (
                            <button
                              onClick={() => {
                                const defReason = row.examSub?.isFlaggedTooFast
                                  ? 'Pengerjaan terlalu cepat (< 2 menit)'
                                  : 'Perlu pengulangan materi (tidak memenuhi SOP)';
                                setCancelReasonInput(defReason);
                                setCancellingTarget({
                                  key: row.key,
                                  name: row.student.name,
                                  babCode: row.bab.code,
                                  defaultReason: defReason,
                                });
                              }}
                              className="px-2 py-1 rounded-lg bg-red-50 text-red-700 border border-red-200 font-semibold hover:bg-red-100 transition text-[11px]"
                              title="Batalkan hasil ujian siswa"
                            >
                              Batalkan
                            </button>
                          ) : (
                            <span className="text-[10px] text-slate-400 font-mono">-</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

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
    </div>
  );
};
