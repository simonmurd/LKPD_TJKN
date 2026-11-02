import React, { useState, useEffect } from 'react';
import {
  StudentProfile,
  CurriculumBab,
  ExamSubmission,
  SimulationLogEntry,
  RombelAssignment,
} from '../../types/curriculum';
import { RombelAssignmentManager } from './RombelAssignmentManager';
import {
  Users,
  Search,
  Filter,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  RotateCcw,
  Edit2,
  Trash2,
  Plus,
  RefreshCw,
  Award,
  ShieldAlert,
  FileSpreadsheet,
  Download,
  ExternalLink,
  Send,
  Zap,
  SlidersHorizontal,
  FileText,
  FileQuestion,
  HelpCircle,
  Check,
} from 'lucide-react';

interface TeacherAdminDashboardProps {
  students: StudentProfile[];
  onUpdateStudents: (updated: StudentProfile[]) => void;
  onResetStudentsToDefault: () => void;
  submissions: Record<string, ExamSubmission>;
  onCancelSubmission: (key: string, reason: string) => void;
  onRestoreSubmission: (key: string) => void;
  babs: CurriculumBab[];
  rombelAssignments: Record<string, RombelAssignment>;
  onUpdateRombelAssignments: (next: Record<string, RombelAssignment>) => void;
}

const APPS_SCRIPT_URLS = {
  simulation: 'https://script.google.com/macros/s/AKfycbwVxPZEIDP24gxKTkMnibG68CdTbyduO0INuLrWB0iDylZb0XGiMx69FdvLGdNuEDrFJg/exec',
  mcq: 'https://script.google.com/macros/s/AKfycbzD7sroU9tzDHBwhHy95ArrdR_W54JTzJWr1X9cIL6ObmJiP23hjHkZfRlbbbuFQmQ/exec',
  essay: 'https://script.google.com/macros/s/AKfycbw87YyAPmDQbD6kp-Zz876qFRgVpkaU7uO6fXKq00DGRnHy2ykCQKoSrqwcToCF_CSHwQ/exec',
};

export const TeacherAdminDashboard: React.FC<TeacherAdminDashboardProps> = ({
  students,
  onUpdateStudents,
  onResetStudentsToDefault,
  submissions,
  onCancelSubmission,
  onRestoreSubmission,
  babs,
  rombelAssignments,
  onUpdateRombelAssignments,
}) => {
  const [activeTab, setActiveTab] = useState<'monitoring' | 'rombel_assignments' | 'students_crud' | 'simulation_logs'>('monitoring');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterSchool, setFilterSchool] = useState<string>('all');
  const [filterClass, setFilterClass] = useState<string>('all');
  const [filterBab, setFilterBab] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  // Student CRUD Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [editingStudent, setEditingStudent] = useState<StudentProfile | null>(null);
  const [formName, setFormName] = useState<string>('');
  const [formAbsen, setFormAbsen] = useState<string>('');
  const [formClass, setFormClass] = useState<string>('X TJK');
  const [formSchool, setFormSchool] = useState<string>('SMK NEGERI 1 SINGKAWANG');

  // Cancel Modal state
  const [cancellingKey, setCancellingKey] = useState<string | null>(null);
  const [cancelReasonInput, setCancelReasonInput] = useState<string>('Pengerjaan terlalu cepat / tidak wajar');

  // Simulation Logs State (Google Apps Script)
  const [simulationLogs, setSimulationLogs] = useState<SimulationLogEntry[]>([]);
  const [endpointStatus, setEndpointStatus] = useState<Record<string, { status: string; code?: number; response?: string }>>({});
  const [isTestingEndpoint, setIsTestingEndpoint] = useState<Record<string, boolean>>({});
  const [testResultMsg, setTestResultMsg] = useState<string | null>(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('tjkn_simulation_logs');
      if (stored) {
        setSimulationLogs(JSON.parse(stored));
      }
    } catch (e) {
      // ignore
    }
  }, [activeTab]);

  const handlePingEndpoint = async (type: 'simulation' | 'mcq' | 'essay') => {
    setIsTestingEndpoint((prev) => ({ ...prev, [type]: true }));
    setTestResultMsg(null);
    try {
      const endpointPath =
        type === 'simulation'
          ? '/api/simulation-log/status'
          : type === 'mcq'
          ? '/api/mcq-log/status'
          : '/api/essay-log/status';

      const res = await fetch(endpointPath);
      const data = await res.json();
      setEndpointStatus((prev) => ({
        ...prev,
        [type]: {
          status: data.status,
          code: data.code,
          response: data.response,
        },
      }));
    } catch (err: unknown) {
      setEndpointStatus((prev) => ({
        ...prev,
        [type]: {
          status: 'error',
          response: 'Gagal terhubung ke endpoint Apps Script',
        },
      }));
    } finally {
      setIsTestingEndpoint((prev) => ({ ...prev, [type]: false }));
    }
  };

  const handleSendTestMcq = async () => {
    setIsTestingEndpoint((prev) => ({ ...prev, mcq_send: true }));
    setTestResultMsg(null);
    try {
      const res = await fetch('/api/mcq-log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentName: 'SIMON MURD (GURU TEST)',
          noAbsen: '00',
          className: 'XI TJK',
          school: 'SMK NEGERI 1 SINGKAWANG',
          babId: 1,
          babCode: 'Bab 1',
          babTitle: 'Pengenalan Media Transmisi Jaringan',
          standardScore: 20,
          complexScore: 20,
          totalScore: 40,
          percentage: 100,
          isPassed: true,
          timeSpentSeconds: 300,
          isFlaggedTooFast: false,
          details: 'Uji coba pengiriman nilai CBT dari Panel Guru Simon Murd',
          timestamp: new Date().toISOString(),
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setTestResultMsg(`✓ Uji CBT Pilihan Ganda berhasil dikirim ke Apps Script! Respons: ${data.appsScriptResponse || 'OK'}`);
      } else {
        setTestResultMsg(`Gagal: ${data.error || 'Server error'}`);
      }
    } catch (e: any) {
      setTestResultMsg(`Gagal mengirim uji CBT: ${e.message}`);
    } finally {
      setIsTestingEndpoint((prev) => ({ ...prev, mcq_send: false }));
    }
  };

  const handleSendTestEssay = async () => {
    setIsTestingEndpoint((prev) => ({ ...prev, essay_send: true }));
    setTestResultMsg(null);
    try {
      const res = await fetch('/api/essay-log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentName: 'SIMON MURD (GURU TEST)',
          noAbsen: '00',
          className: 'XI TJK',
          school: 'SMK NEGERI 1 SINGKAWANG',
          babId: 1,
          babCode: 'Bab 1',
          babTitle: 'Pengenalan Media Transmisi Jaringan',
          questionId: 'essay_test_1',
          questionNumber: 1,
          questionTitle: 'Uji Analisis Redaman Fiber Optic',
          studentAnswer: 'Kabel fiber optic mengalami bending melebihi radius batas toleransi (macro-bending). Dilakukan re-splicing dan penataan ulang pada optical distribution point (ODP).',
          wordCount: 24,
          score: 95,
          letterGrade: 'A',
          feedback: 'Analisis troubleshooting akurat sesuai standar ITU-T G.652.',
          timestamp: new Date().toISOString(),
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setTestResultMsg(`✓ Uji Esai berhasil dikirim ke Apps Script! Respons: ${data.appsScriptResponse || 'OK'}`);
      } else {
        setTestResultMsg(`Gagal: ${data.error || 'Server error'}`);
      }
    } catch (e: any) {
      setTestResultMsg(`Gagal mengirim uji Esai: ${e.message}`);
    } finally {
      setIsTestingEndpoint((prev) => ({ ...prev, essay_send: false }));
    }
  };

  // Submission list transformed into array
  const submissionList = Object.entries(submissions).map(([key, sub]) => ({
    key,
    ...sub,
  }));

  // Filtering submissions
  const filteredSubmissions = submissionList.filter((sub) => {
    const q = searchQuery.toLowerCase().trim();
    const matchSearch =
      !q ||
      sub.studentName?.toLowerCase().includes(q) ||
      sub.school?.toLowerCase().includes(q) ||
      sub.className?.toLowerCase().includes(q) ||
      `bab ${sub.babId}`.includes(q);

    const matchSchool = filterSchool === 'all' || sub.school === filterSchool;
    const matchClass = filterClass === 'all' || sub.className === filterClass;
    const matchBab = filterBab === 'all' || String(sub.babId) === filterBab;
    const matchStatus =
      filterStatus === 'all' ||
      (filterStatus === 'too_fast' && sub.isFlaggedTooFast) ||
      (filterStatus === 'cancelled' && sub.status === 'cancelled_by_teacher') ||
      (filterStatus === 'passed' && sub.isPassed && sub.status !== 'cancelled_by_teacher') ||
      (filterStatus === 'failed' && !sub.isPassed && sub.status !== 'cancelled_by_teacher');

    return matchSearch && matchSchool && matchClass && matchBab && matchStatus;
  });

  // Calculate Statistics
  const totalSubmissionsCount = submissionList.length;
  const tooFastCount = submissionList.filter((s) => s.isFlaggedTooFast && s.status !== 'cancelled_by_teacher').length;
  const cancelledCount = submissionList.filter((s) => s.status === 'cancelled_by_teacher').length;
  const averageScore = totalSubmissionsCount
    ? Math.round(submissionList.reduce((acc, curr) => acc + curr.percentage, 0) / totalSubmissionsCount)
    : 0;

  // Student CRUD
  const handleOpenAddStudent = () => {
    setEditingStudent(null);
    setFormName('');
    setFormAbsen('');
    setFormClass('X TJK');
    setFormSchool('SMK NEGERI 1 SINGKAWANG');
    setIsAddModalOpen(true);
  };

  const handleOpenEditStudent = (student: StudentProfile) => {
    setEditingStudent(student);
    setFormName(student.name);
    setFormAbsen(student.noAbsen);
    setFormClass(student.className);
    setFormSchool(student.school);
    setIsAddModalOpen(true);
  };

  const handleSaveStudentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formAbsen.trim()) return;

    if (editingStudent) {
      const updated = students.map((s) =>
        s.id === editingStudent.id
          ? {
              ...s,
              name: formName.trim().toUpperCase(),
              noAbsen: formAbsen.trim().padStart(2, '0'),
              className: formClass,
              school: formSchool,
            }
          : s
      );
      onUpdateStudents(updated);
    } else {
      const newStudent: StudentProfile = {
        id: `custom_${Date.now()}`,
        name: formName.trim().toUpperCase(),
        noAbsen: formAbsen.trim().padStart(2, '0'),
        className: formClass,
        school: formSchool,
      };
      onUpdateStudents([newStudent, ...students]);
    }
    setIsAddModalOpen(false);
    setEditingStudent(null);
  };

  const handleDeleteStudent = (id: string, name: string) => {
    if (window.confirm(`Hapus data siswa "${name}" dari sistem?`)) {
      onUpdateStudents(students.filter((s) => s.id !== id));
    }
  };

  const handleConfirmCancel = () => {
    if (!cancellingKey) return;
    onCancelSubmission(cancellingKey, cancelReasonInput);
    setCancellingKey(null);
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Teacher Profile Banner - Bright White Minimalist */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-700 border border-blue-200 flex items-center justify-center font-bold text-xl shadow-2xs">
              SM
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-slate-900">
                  Panel Guru Pengampu: Simon Murd
                </h2>
                <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 text-xs font-mono font-bold border border-blue-200">
                  Instruktur Ahli TKJ
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                SMK Negeri 1 Singkawang & SMK Mudita Singkawang • Manajemen Pembelajaran TJKN Phase F
              </p>
            </div>
          </div>

          {/* Quick Stats Grid */}
          <div className="flex items-center gap-3">
            <div className="px-4 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-center">
              <div className="text-xs text-slate-500 font-mono">Siswa Terdaftar</div>
              <div className="text-lg font-bold text-slate-900">{students.length}</div>
            </div>
            <div className="px-4 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-center">
              <div className="text-xs text-slate-500 font-mono">Total Hasil CBT</div>
              <div className="text-lg font-bold text-slate-900">{totalSubmissionsCount}</div>
            </div>
            <div className="px-4 py-2.5 rounded-2xl bg-amber-50 border border-amber-200 text-center">
              <div className="text-xs text-amber-700 font-mono font-bold">Terlalu Cepat</div>
              <div className="text-lg font-bold text-amber-900">{tooFastCount}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('monitoring')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition ${
            activeTab === 'monitoring'
              ? 'bg-blue-600 text-white shadow-xs font-bold'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Award className="w-4 h-4" />
          <span>Pemantauan Hasil Ujian ({submissionList.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('rombel_assignments')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition ${
            activeTab === 'rombel_assignments'
              ? 'bg-blue-600 text-white shadow-xs font-bold'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <SlidersHorizontal className="w-4 h-4" />
          <span>Atur Penugasan Rombel</span>
        </button>

        <button
          onClick={() => setActiveTab('students_crud')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition ${
            activeTab === 'students_crud'
              ? 'bg-blue-600 text-white shadow-xs font-bold'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Master Siswa ({students.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('simulation_logs')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition ${
            activeTab === 'simulation_logs'
              ? 'bg-blue-600 text-white shadow-xs font-bold'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <FileSpreadsheet className="w-4 h-4" />
          <span>Google Apps Script & Spreadsheet</span>
        </button>
      </div>

      {/* TAB 1: ROMBEL ASSIGNMENTS (NEW REQUIREMENT) */}
      {activeTab === 'rombel_assignments' && (
        <RombelAssignmentManager
          assignments={rombelAssignments}
          onUpdateAssignments={onUpdateRombelAssignments}
          babs={babs}
        />
      )}

      {/* TAB 2: MONITORING SUBMISSIONS & CANCELLATIONS */}
      {activeTab === 'monitoring' && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 flex-1 min-w-[200px] max-w-md">
              <Search className="w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari nama siswa, rombel, atau bab..."
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-700 font-medium"
              >
                <option value="all">Semua Status</option>
                <option value="too_fast">⚠ Terlalu Cepat (Flagged)</option>
                <option value="cancelled">Dibatalkan Guru</option>
                <option value="passed">Tuntas KKM (&ge; 75)</option>
                <option value="failed">Remedial (&lt; 75)</option>
              </select>

              <select
                value={filterBab}
                onChange={(e) => setFilterBab(e.target.value)}
                className="bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-700 font-medium"
              >
                <option value="all">Semua Bab</option>
                {babs.map((b) => (
                  <option key={b.id} value={String(b.id)}>
                    {b.code}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Submissions Table */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-mono text-[10px]">
                  <tr>
                    <th className="p-3.5">Peserta Didik</th>
                    <th className="p-3.5">Rombel & Sekolah</th>
                    <th className="p-3.5">Modul (Bab)</th>
                    <th className="p-3.5">Durasi</th>
                    <th className="p-3.5">Nilai CBT</th>
                    <th className="p-3.5">Status</th>
                    <th className="p-3.5 text-right">Aksi Guru</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredSubmissions.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-slate-400">
                        Tidak ada riwayat hasil ujian yang cocok dengan kriteria pencarian.
                      </td>
                    </tr>
                  ) : (
                    filteredSubmissions.map((sub) => {
                      const isTooFast = sub.isFlaggedTooFast;
                      const isCancelled = sub.status === 'cancelled_by_teacher';

                      return (
                        <tr
                          key={sub.key}
                          className={`hover:bg-slate-50/80 transition ${
                            isCancelled
                              ? 'bg-red-50/30'
                              : isTooFast
                              ? 'bg-amber-50/30'
                              : ''
                          }`}
                        >
                          <td className="p-3.5">
                            <div className="font-bold text-slate-900">{sub.studentName}</div>
                            <div className="text-[10px] text-slate-400 font-mono">
                              Waktu: {new Date(sub.date).toLocaleString('id-ID')}
                            </div>
                          </td>
                          <td className="p-3.5">
                            <div className="font-semibold text-slate-800">{sub.className}</div>
                            <div className="text-[11px] text-slate-500 line-clamp-1">{sub.school}</div>
                          </td>
                          <td className="p-3.5">
                            <span className="font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                              Bab {sub.babId}
                            </span>
                          </td>
                          <td className="p-3.5 font-mono">
                            <div className="flex items-center gap-1.5">
                              <Clock className="w-3.5 h-3.5 text-slate-400" />
                              <span>{Math.floor(sub.timeSpentSeconds / 60)}m {sub.timeSpentSeconds % 60}s</span>
                            </div>
                            {isTooFast && (
                              <div className="text-[10px] font-bold text-amber-700 flex items-center gap-1 mt-0.5">
                                <AlertTriangle className="w-3 h-3" />
                                Terlalu Cepat (&lt; 2m)
                              </div>
                            )}
                            {Boolean(sub.tabViolations && sub.tabViolations > 0) && (
                              <div className="text-[10px] font-bold text-red-600 flex items-center gap-1 mt-0.5">
                                <ShieldAlert className="w-3 h-3 text-red-500" />
                                {sub.tabViolations}x Pindah Tab (Kecurangan)
                              </div>
                            )}
                          </td>
                          <td className="p-3.5">
                            <div className="font-bold text-sm text-slate-900">{sub.percentage}%</div>
                            <div className="text-[10px] text-slate-500">
                              {sub.totalScore}/40 Poin
                            </div>
                          </td>
                          <td className="p-3.5">
                            {isCancelled ? (
                              <span className="px-2 py-0.5 rounded-full bg-red-100 text-red-800 text-[10px] font-bold border border-red-200">
                                Dibatalkan Guru
                              </span>
                            ) : sub.isPassed ? (
                              <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold border border-emerald-200">
                                TUNTAS KKM
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold border border-amber-200">
                                REMEDIAL
                              </span>
                            )}
                          </td>
                          <td className="p-3.5 text-right">
                            {isCancelled ? (
                              <button
                                onClick={() => onRestoreSubmission(sub.key)}
                                className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-[11px] transition shadow-2xs"
                                title="Pulihkan status ujian siswa"
                              >
                                Pulihkan
                              </button>
                            ) : (
                              <button
                                onClick={() => {
                                  setCancellingKey(sub.key);
                                  setCancelReasonInput(
                                    isTooFast
                                      ? `Pengerjaan hanya ${Math.floor(sub.timeSpentSeconds)} detik (terindikasi tidak wajar/menebak)`
                                      : 'Pengerjaan tidak sesuai SOP kelas'
                                  );
                                }}
                                className="px-2.5 py-1 rounded-lg bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 font-semibold text-[11px] transition"
                              >
                                Batalkan Ujian
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: STUDENTS MASTER DATA (CRUD) */}
      {activeTab === 'students_crud' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
            <div>
              <h3 className="font-bold text-sm text-slate-900">
                Master Data Siswa SMKN 1 & SMK Mudita Singkawang
              </h3>
              <p className="text-xs text-slate-500">
                Total {students.length} siswa terdaftar di database lokal.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={onResetStudentsToDefault}
                className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition"
              >
                Reset Default (140 Siswa)
              </button>
              <button
                onClick={handleOpenAddStudent}
                className="px-4 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-xs"
              >
                <Plus className="w-4 h-4" />
                Tambah Siswa
              </button>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
            <div className="max-h-96 overflow-y-auto">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-mono text-[10px] uppercase sticky top-0 z-10">
                  <tr>
                    <th className="p-3">Absen</th>
                    <th className="p-3">Nama Siswa</th>
                    <th className="p-3">Kelas</th>
                    <th className="p-3">Sekolah</th>
                    <th className="p-3 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {students.map((st) => (
                    <tr key={st.id} className="hover:bg-slate-50">
                      <td className="p-3 font-mono font-bold text-slate-800">{st.noAbsen}</td>
                      <td className="p-3 font-bold text-slate-900">{st.name}</td>
                      <td className="p-3 font-mono text-blue-700">{st.className}</td>
                      <td className="p-3 text-slate-600">{st.school}</td>
                      <td className="p-3 text-right">
                        <div className="inline-flex items-center gap-1">
                          <button
                            onClick={() => handleOpenEditStudent(st)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-slate-100"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteStudent(st.id, st.name)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-red-600 hover:bg-red-50"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: GOOGLE APPS SCRIPT INTEGRATION (3 ENDPOINTS) */}
      {activeTab === 'simulation_logs' && (
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-semibold">
                  Google Workspace
                </span>
                <h3 className="text-lg font-bold text-slate-900">
                  Integrasi 3 Endpoint Google Spreadsheet (Simon Murd)
                </h3>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Data presensi simulasi, penilaian ujian objektif 40 butir CBT, dan hasil asesmen 10 esai otomatis diteruskan ke Google Spreadsheet terpisah melalui Web App Apps Script.
              </p>
            </div>

            {testResultMsg && (
              <div className="p-3.5 rounded-xl bg-blue-50 border border-blue-200 text-blue-900 text-xs flex items-center justify-between">
                <span>{testResultMsg}</span>
                <button onClick={() => setTestResultMsg(null)} className="font-bold ml-2">×</button>
              </div>
            )}

            {/* 3 Endpoint Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Endpoint 1: Simulation */}
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-slate-900">1. Log Simulasi Praktikum</span>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                      endpointStatus.simulation?.status === 'online'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-slate-200 text-slate-700'
                    }`}
                  >
                    {endpointStatus.simulation?.status === 'online' ? 'Online' : 'Siap'}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 line-clamp-2">
                  Mencatat langkah crimping, pengujian LAN tester, setting nirkabel, dan splicing.
                </p>
                <div className="text-[10px] font-mono text-slate-400 truncate">
                  {APPS_SCRIPT_URLS.simulation}
                </div>
                <div className="pt-2">
                  <button
                    onClick={() => handlePingEndpoint('simulation')}
                    disabled={isTestingEndpoint.simulation}
                    className="w-full py-1.5 px-3 rounded-lg bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 font-semibold text-xs transition"
                  >
                    {isTestingEndpoint.simulation ? 'Memeriksa...' : 'Uji Koneksi (Ping)'}
                  </button>
                </div>
              </div>

              {/* Endpoint 2: MCQ */}
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-slate-900">2. Nilai CBT Pilihan Ganda</span>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                      endpointStatus.mcq?.status === 'online'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-slate-200 text-slate-700'
                    }`}
                  >
                    {endpointStatus.mcq?.status === 'online' ? 'Online' : 'Siap'}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 line-clamp-2">
                  Mencatat 40 butir jawaban, skor total, persentase, tuntas KKM, dan durasi pengerjaan.
                </p>
                <div className="text-[10px] font-mono text-slate-400 truncate">
                  {APPS_SCRIPT_URLS.mcq}
                </div>
                <div className="pt-2 flex items-center gap-2">
                  <button
                    onClick={() => handlePingEndpoint('mcq')}
                    disabled={isTestingEndpoint.mcq}
                    className="flex-1 py-1.5 px-2 rounded-lg bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 font-semibold text-xs transition"
                  >
                    Ping
                  </button>
                  <button
                    onClick={handleSendTestMcq}
                    disabled={isTestingEndpoint.mcq_send}
                    className="flex-1 py-1.5 px-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition shadow-2xs"
                  >
                    Kirim Uji Nilai
                  </button>
                </div>
              </div>

              {/* Endpoint 3: Essay */}
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-slate-900">3. Hasil Analisis Esai</span>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                      endpointStatus.essay?.status === 'online'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-slate-200 text-slate-700'
                    }`}
                  >
                    {endpointStatus.essay?.status === 'online' ? 'Online' : 'Siap'}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 line-clamp-2">
                  Mencatat jawaban uraian troubleshooting, jumlah kata, skor asesor AI, dan umpan balik.
                </p>
                <div className="text-[10px] font-mono text-slate-400 truncate">
                  {APPS_SCRIPT_URLS.essay}
                </div>
                <div className="pt-2 flex items-center gap-2">
                  <button
                    onClick={() => handlePingEndpoint('essay')}
                    disabled={isTestingEndpoint.essay}
                    className="flex-1 py-1.5 px-2 rounded-lg bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 font-semibold text-xs transition"
                  >
                    Ping
                  </button>
                  <button
                    onClick={handleSendTestEssay}
                    disabled={isTestingEndpoint.essay_send}
                    className="flex-1 py-1.5 px-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition shadow-2xs"
                  >
                    Kirim Uji Esai
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: ADD / EDIT STUDENT */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4 text-xs">
            <h3 className="font-bold text-base text-slate-900 border-b border-slate-100 pb-3">
              {editingStudent ? 'Edit Data Siswa' : 'Tambah Siswa Baru'}
            </h3>

            <form onSubmit={handleSaveStudentSubmit} className="space-y-3">
              <div>
                <label className="block text-slate-700 mb-1 font-semibold">Nama Lengkap Siswa:</label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="Contoh: MUHAMMAD RIZKY"
                  required
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-slate-700 mb-1 font-semibold">Nomor Absen:</label>
                <input
                  type="text"
                  value={formAbsen}
                  onChange={(e) => setFormAbsen(e.target.value)}
                  placeholder="Contoh: 01"
                  required
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-slate-700 mb-1 font-semibold">Kelas (Rombel):</label>
                <select
                  value={formClass}
                  onChange={(e) => setFormClass(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-mono"
                >
                  <option value="X TJK">X TJK</option>
                  <option value="XI TJK">XI TJK</option>
                  <option value="XII TJK 1">XII TJK 1</option>
                  <option value="XII TJK 2">XII TJK 2</option>
                  <option value="XII TJK 3">XII TJK 3</option>
                  <option value="X TJKT">X TJKT</option>
                  <option value="XI TJKT">XI TJKT</option>
                  <option value="XII TJKT">XII TJKT</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 mb-1 font-semibold">Sekolah:</label>
                <select
                  value={formSchool}
                  onChange={(e) => setFormSchool(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900"
                >
                  <option value="SMK NEGERI 1 SINGKAWANG">SMK NEGERI 1 SINGKAWANG</option>
                  <option value="SMK MUDITA SINGKAWANG">SMK MUDITA SINGKAWANG</option>
                </select>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddModalOpen(false);
                    setEditingStudent(null);
                  }}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-medium hover:bg-slate-200"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-xs"
                >
                  Simpan Siswa
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: CONFIRM CANCEL / RESET SUBMISSION */}
      {cancellingKey && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 max-w-md w-full shadow-2xl relative text-xs space-y-4">
            <div className="flex items-center gap-3 text-red-600">
              <ShieldAlert className="w-6 h-6 shrink-0" />
              <h3 className="font-bold text-base text-slate-900">Konfirmasi Pembatalan Ujian Siswa</h3>
            </div>

            <p className="text-slate-600 leading-relaxed">
              Anda akan membatalkan hasil ujian siswa ini karena dicurigai mengerjakan terlalu cepat atau tidak wajar. Siswa wajib melakukan ujian ulang.
            </p>

            <div>
              <label className="block text-slate-700 mb-1 font-semibold">Alasan Pembatalan Guru:</label>
              <textarea
                rows={3}
                value={cancelReasonInput}
                onChange={(e) => setCancelReasonInput(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-slate-900 focus:outline-none focus:border-red-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setCancellingKey(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-medium hover:bg-slate-200"
              >
                Batal
              </button>
              <button
                onClick={handleConfirmCancel}
                className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold shadow-md shadow-red-500/20"
              >
                Ya, Batalkan Hasil Ujian
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
