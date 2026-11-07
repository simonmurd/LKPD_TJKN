import React, { useState, useEffect } from 'react';
import {
  StudentProfile,
  CurriculumBab,
  ExamSubmission,
  SimulationLogEntry,
  RombelAssignment,
} from '../../types/curriculum';
import { RombelAssignmentManager } from './RombelAssignmentManager';
import { TeacherDirectChatAndProgress } from './TeacherDirectChatAndProgress';
import { TeacherAiAssistantTab } from './TeacherAiAssistantTab';
import { StudentActivityRecapTable } from './StudentActivityRecapTable';
import { TeacherAnalyticsDashboard } from './TeacherAnalyticsDashboard';
import { getUnreadCountForTeacher } from '../../data/directMessagesData';
import { ExamSessionConfigModal } from './ExamSessionConfigModal';
import { CbtItemAnalysisModal } from './CbtItemAnalysisModal';
import { TeacherTaskManager } from './TeacherTaskManager';
import { clearAllDataFromFirestore } from '../../lib/firebase';
import { ClipboardList } from 'lucide-react';
import {
  BarChart3,
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
  MessageSquare,
  Sparkles,
  KeyRound,
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
  onRefreshSubmissions?: () => void;
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
  onRefreshSubmissions,
}) => {
  const [activeTab, setActiveTab] = useState<
    'monitoring' | 'tasks_manager' | 'analytics' | 'chat_progress' | 'ai_assistant' | 'rombel_assignments' | 'students_crud' | 'simulation_logs'
  >('monitoring');
  const [selectedChatStudentId, setSelectedChatStudentId] = useState<string | undefined>(undefined);
  const [selectedChatTab, setSelectedChatTab] = useState<'progress' | 'chat'>('progress');
  const [unreadMessagesCount, setUnreadMessagesCount] = useState<number>(0);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterSchool, setFilterSchool] = useState<string>('all');
  const [filterClass, setFilterClass] = useState<string>('all');
  const [filterBab, setFilterBab] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  useEffect(() => {
    const updateUnread = () => {
      setUnreadMessagesCount(getUnreadCountForTeacher());
    };
    updateUnread();
    window.addEventListener('tjkn_direct_messages_updated', updateUnread);
    window.addEventListener('storage', updateUnread);
    return () => {
      window.removeEventListener('tjkn_direct_messages_updated', updateUnread);
      window.removeEventListener('storage', updateUnread);
    };
  }, []);

  // Proctoring & Item Analysis Modal States
  const [isExamConfigOpen, setIsExamConfigOpen] = useState<boolean>(false);
  const [isItemAnalysisOpen, setIsItemAnalysisOpen] = useState<boolean>(false);

  // Student CRUD Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [editingStudent, setEditingStudent] = useState<StudentProfile | null>(null);
  const [deletingStudentTarget, setDeletingStudentTarget] = useState<{ id: string; name: string } | null>(null);
  const [showResetStudentsModal, setShowResetStudentsModal] = useState<boolean>(false);
  const [showClearDummyModal, setShowClearDummyModal] = useState<boolean>(false);
  const [showMaintenanceTools, setShowMaintenanceTools] = useState<boolean>(false);
  const [isClearingDummy, setIsClearingDummy] = useState<boolean>(false);
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

    // If searching explicitly by name (e.g., "veliyan"), don't hide by school or class mismatch
    const isExplicitNameSearch = Boolean(q && sub.studentName?.toLowerCase().includes(q));

    const matchSchool = isExplicitNameSearch || filterSchool === 'all' || sub.school === filterSchool;
    const matchClass = isExplicitNameSearch || filterClass === 'all' || sub.className === filterClass;
    const matchBab = isExplicitNameSearch || filterBab === 'all' || String(sub.babId) === filterBab;
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
    setDeletingStudentTarget({ id, name });
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

          {/* Quick Stats & Proctoring Controls Grid */}
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setIsExamConfigOpen(true)}
              className="flex items-center gap-2 px-3.5 py-2.5 rounded-2xl bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 font-bold transition shadow-2xs text-xs cursor-pointer"
              title="Atur token ujian, durasi waktu countdown, dan sesi penilaian CBT"
            >
              <KeyRound className="w-4 h-4 text-blue-600" />
              <span>Token Ujian & Waktu CBT</span>
            </button>

            <button
              onClick={() => setIsItemAnalysisOpen(true)}
              className="flex items-center gap-2 px-3.5 py-2.5 rounded-2xl bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 font-bold transition shadow-2xs text-xs cursor-pointer"
              title="Lihat analisis butir soal, kunci jawaban lengkap, dan kisi-kisi HOTS 40 butir"
            >
              <FileQuestion className="w-4 h-4 text-amber-700" />
              <span>Kisi-Kisi & Bank Soal</span>
            </button>

            <button
              type="button"
              onClick={() => setShowMaintenanceTools((v) => !v)}
              className={`flex items-center gap-1.5 px-3 py-2.5 rounded-2xl border font-bold transition shadow-2xs text-xs cursor-pointer ${
                showMaintenanceTools
                  ? 'bg-red-600 text-white border-red-600'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-600 border-slate-200'
              }`}
              title="Tampilkan atau sembunyikan alat pemeliharaan data"
            >
              <Trash2 className="w-4 h-4" />
              <span>Pemeliharaan</span>
            </button>

            {showMaintenanceTools && (
              <button
                onClick={() => setShowClearDummyModal(true)}
                className="flex items-center gap-2 px-3.5 py-2.5 rounded-2xl bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 font-bold transition shadow-2xs text-xs cursor-pointer"
                title="Bersihkan semua data dummy/uji coba (nilai CBT, simulasi, esai, chat, dan radar)"
              >
                <Trash2 className="w-4 h-4 text-red-600" />
                <span>Bersihkan Data Dummy</span>
              </button>
            )}

            <div className="px-3.5 py-2 rounded-2xl bg-slate-50 border border-slate-200 text-center">
              <div className="text-[10px] text-slate-500 font-mono">Siswa</div>
              <div className="text-base font-bold text-slate-900">{students.length}</div>
            </div>
            <div className="px-3.5 py-2 rounded-2xl bg-slate-50 border border-slate-200 text-center">
              <div className="text-[10px] text-slate-500 font-mono">Hasil CBT</div>
              <div className="text-base font-bold text-slate-900">{totalSubmissionsCount}</div>
            </div>
            <div className="px-3.5 py-2 rounded-2xl bg-amber-50 border border-amber-200 text-center">
              <div className="text-[10px] text-amber-700 font-mono font-bold">Terlalu Cepat</div>
              <div className="text-base font-bold text-amber-900">{tooFastCount}</div>
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
          <span>Leger & Hasil Ujian ({submissionList.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('tasks_manager')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition ${
            activeTab === 'tasks_manager'
              ? 'bg-blue-600 text-white shadow-xs font-bold'
              : 'text-blue-700 bg-blue-50/70 hover:bg-blue-100/80'
          }`}
        >
          <ClipboardList className="w-4 h-4 text-blue-600" />
          <span>Kirim Tugas & Kegiatan</span>
        </button>

        <button
          onClick={() => setActiveTab('analytics')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition ${
            activeTab === 'analytics'
              ? 'bg-blue-600 text-white shadow-xs font-bold'
              : 'text-emerald-700 bg-emerald-50/70 hover:bg-emerald-100/80'
          }`}
        >
          <BarChart3 className="w-4 h-4 text-emerald-600" />
          <span>Statistik & Visualisasi Data (Recharts)</span>
        </button>

        <button
          onClick={() => setActiveTab('chat_progress')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition ${
            activeTab === 'chat_progress'
              ? 'bg-blue-600 text-white shadow-xs font-bold'
              : 'text-blue-700 bg-blue-50/70 hover:bg-blue-100/80'
          }`}
        >
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <MessageSquare className="w-4 h-4 text-blue-600" />
          <span>Radar Lab & Live Chat</span>
          {unreadMessagesCount > 0 ? (
            <span className="px-1.5 py-0.2 rounded-full bg-red-600 text-white text-[10px] font-bold animate-pulse">
              {unreadMessagesCount} baru
            </span>
          ) : (
            <span className="px-1.5 py-0.2 rounded-full bg-emerald-100 text-emerald-800 text-[9px] font-mono font-bold">
              LIVE
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('ai_assistant')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition ${
            activeTab === 'ai_assistant'
              ? 'bg-indigo-600 text-white shadow-xs font-bold'
              : 'text-indigo-700 bg-indigo-50/70 hover:bg-indigo-100/80'
          }`}
        >
          <Sparkles className="w-4 h-4 text-amber-500" />
          <span>Asisten Pribadi Guru (AI)</span>
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

      {/* TAB: CHAT & CEK PROGRES SISWA */}
      {activeTab === 'chat_progress' && (
        <TeacherDirectChatAndProgress
          students={students}
          submissions={submissions}
          babs={babs}
          rombelAssignments={rombelAssignments}
          onCancelSubmission={onCancelSubmission}
          onRestoreSubmission={onRestoreSubmission}
          initialSelectedStudentId={selectedChatStudentId}
          initialTab={selectedChatTab}
        />
      )}

      {/* TAB: ASISTEN PRIBADI GURU AI (SIMON MURD) */}
      {activeTab === 'ai_assistant' && (
        <TeacherAiAssistantTab
          students={students}
          submissions={submissions}
          babs={babs}
          rombelAssignments={rombelAssignments}
        />
      )}

      {/* TAB: KIRIM TUGAS & KEGIATAN SISWA */}
      {activeTab === 'tasks_manager' && (
        <TeacherTaskManager students={students} babs={babs} />
      )}

      {/* TAB: ROMBEL ASSIGNMENTS */}
      {activeTab === 'rombel_assignments' && (
        <RombelAssignmentManager
          assignments={rombelAssignments}
          onUpdateAssignments={onUpdateRombelAssignments}
          babs={babs}
        />
      )}

      {/* TAB: MONITORING SUBMISSIONS & REKAP LENGKAP HASIL KEGIATAN SISWA */}
      {activeTab === 'monitoring' && (
        <StudentActivityRecapTable
          students={students}
          submissions={submissions}
          babs={babs}
          rombelAssignments={rombelAssignments}
          onCancelSubmission={onCancelSubmission}
          onRestoreSubmission={onRestoreSubmission}
          onRefresh={() => {
            if (onRefreshSubmissions) onRefreshSubmissions();
          }}
          onOpenChatWithStudent={(st) => {
            setSelectedChatStudentId(st.id);
            setSelectedChatTab('chat');
            setActiveTab('chat_progress');
          }}
        />
      )}

      {/* TAB: STATISTIK & VISUALISASI DATA (RECHARTS) */}
      {activeTab === 'analytics' && (
        <TeacherAnalyticsDashboard
          students={students}
          submissions={submissions}
          babs={babs}
          rombelAssignments={rombelAssignments}
          onRefresh={() => {
            if (onRefreshSubmissions) onRefreshSubmissions();
          }}
        />
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
                onClick={() => setShowResetStudentsModal(true)}
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

      {/* MODAL: CONFIRM DELETE STUDENT */}
      {deletingStudentTarget && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 max-w-md w-full shadow-2xl relative text-xs space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 text-red-600">
              <Trash2 className="w-6 h-6 shrink-0" />
              <div>
                <h3 className="font-bold text-base text-slate-900">Hapus Data Siswa</h3>
                <p className="text-[11px] text-slate-500 font-mono">
                  {deletingStudentTarget.name}
                </p>
              </div>
            </div>

            <p className="text-slate-600 leading-relaxed">
              Apakah Anda yakin ingin menghapus siswa <strong>{deletingStudentTarget.name}</strong> dari daftar presensi dan evaluasi?
            </p>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setDeletingStudentTarget(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-medium hover:bg-slate-200 transition"
              >
                Batal
              </button>
              <button
                onClick={() => {
                  onUpdateStudents(students.filter((s) => s.id !== deletingStudentTarget.id));
                  setDeletingStudentTarget(null);
                }}
                className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold shadow-md shadow-red-500/20 transition cursor-pointer"
              >
                Ya, Hapus Siswa
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: CONFIRM RESET STUDENTS TO DEFAULT */}
      {showResetStudentsModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 max-w-md w-full shadow-2xl relative text-xs space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 text-amber-600">
              <RotateCcw className="w-6 h-6 shrink-0" />
              <div>
                <h3 className="font-bold text-base text-slate-900">Reset ke 140 Siswa Default?</h3>
                <p className="text-[11px] text-slate-500 font-mono">
                  SMKN 1 & SMK Mudita Singkawang
                </p>
              </div>
            </div>

            <p className="text-slate-600 leading-relaxed">
              Daftar siswa akan dikembalikan ke data awal lengkap (SMK Negeri 1 Singkawang X TJK & XI TJK, serta SMK Mudita Singkawang XI TJKT & XII TJKT). Perubahan khusus yang ditambahkan manual akan direset.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setShowResetStudentsModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-semibold hover:bg-slate-200 transition"
              >
                Batal
              </button>
              <button
                onClick={() => {
                  onResetStudentsToDefault();
                  setShowResetStudentsModal(false);
                }}
                className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold shadow-md shadow-amber-500/20 transition cursor-pointer"
              >
                Ya, Kembalikan Default
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CBT Exam Proctoring / Token Config Modal */}
      {isExamConfigOpen && (
        <ExamSessionConfigModal
          onClose={() => setIsExamConfigOpen(false)}
        />
      )}

      {/* CBT Item Analysis & Discussion Modal */}
      {isItemAnalysisOpen && (
        <CbtItemAnalysisModal
          babs={babs}
          selectedBabId={babs[0]?.id || 1}
          onClose={() => setIsItemAnalysisOpen(false)}
        />
      )}

      {/* Clear Dummy Data Confirmation Modal */}
      {showClearDummyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-red-100 text-red-700">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-extrabold text-base text-slate-900">
                  Bersihkan Semua Data Dummy?
                </h4>
                <p className="text-xs text-slate-500">
                  Tindakan ini akan mengosongkan data uji coba/dummy.
                </p>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-700 space-y-1.5">
              <p className="font-semibold text-slate-900">Yang akan dibersihkan:</p>
              <ul className="list-disc pl-4 space-y-1 text-slate-600">
                <li>Semua riwayat nilai CBT, Simulasi, dan Esai uji coba</li>
                <li>Riwayat chat dummy & status radar online uji coba</li>
              </ul>
              <p className="text-[11px] text-emerald-700 font-semibold pt-1">
                ✓ Master Data 140 Siswa & Pengaturan Rombel tetap aman.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                disabled={isClearingDummy}
                onClick={() => setShowClearDummyModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={isClearingDummy}
                onClick={async () => {
                  setIsClearingDummy(true);
                  try {
                    await fetch('/api/admin/clear-dummy-data', { method: 'POST' });
                    await clearAllDataFromFirestore();
                    localStorage.removeItem('tjkn_exam_submissions_v2');
                    localStorage.removeItem('tjkn_submissions_v1');
                    localStorage.removeItem('tjkn_simulation_logs');
                    localStorage.removeItem('tjkn_direct_messages_v1');
                    localStorage.removeItem('tjkn_lab_presence_cache');
                    window.dispatchEvent(new CustomEvent('tjkn_direct_messages_updated'));
                    if (onRefreshSubmissions) onRefreshSubmissions();
                  } catch (e) {
                    console.error(e);
                  } finally {
                    setIsClearingDummy(false);
                    setShowClearDummyModal(false);
                    window.location.reload();
                  }
                }}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white text-xs font-bold transition shadow-xs"
              >
                {isClearingDummy ? 'Membersihkan...' : 'Ya, Bersihkan Sekarang'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
