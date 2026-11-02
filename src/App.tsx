import React, { useState, useEffect } from 'react';
import {
  CurriculumBab,
  UserRole,
  ExamSubmission,
  EssaySubmission,
  QuestionType,
  StandardMCQ,
  ComplexMCQ,
  EssayQuestion,
  StudentProfile,
  RombelAssignment,
} from './types/curriculum';
import { getAllCurriculumBabs, exportBabToJson, saveCustomBabToStorage } from './data/modules';
import {
  getAllStudents,
  saveAllStudents,
  resetStudentsToDefault,
  getActiveStudentSession,
  setActiveStudentSession,
} from './data/studentsData';
import {
  getRombelAssignments,
  saveRombelAssignments,
} from './data/rombelAssignments';
import { Navbar } from './components/layout/Navbar';
import { BabOverview } from './components/curriculum/BabOverview';
import { SimulationContainer } from './components/simulations/SimulationContainer';
import { ObjectiveEvaluation } from './components/evaluation/ObjectiveEvaluation';
import { QualitativeEvaluation } from './components/evaluation/QualitativeEvaluation';
import { PrintableLkpd } from './components/curriculum/PrintableLkpd';
import { StudentDashboard } from './components/analytics/StudentDashboard';
import { TeacherAdminDashboard } from './components/admin/TeacherAdminDashboard';
import { StudentSelector } from './components/auth/StudentSelector';
import { StudentGateScreen } from './components/auth/StudentGateScreen';
import { TeacherLoginModal } from './components/auth/TeacherLoginModal';
import { AiTutorDrawer } from './components/ai/AiTutorDrawer';
import { AiQuestionGeneratorModal } from './components/ai/AiQuestionGeneratorModal';
import { StudentDirectChatModal } from './components/student/StudentDirectChatModal';
import { getUnreadCountForStudent } from './data/directMessagesData';
import { CheckCircle2, ShieldAlert } from 'lucide-react';

export default function App() {
  const [babs, setBabs] = useState<CurriculumBab[]>([]);
  const [selectedBab, setSelectedBab] = useState<CurriculumBab | null>(null);
  const [userRole, setUserRole] = useState<UserRole>('siswa');
  const [activeTab, setActiveTab] = useState<
    'overview' | 'simulations' | 'objective' | 'qualitative' | 'dashboard' | 'print' | 'admin_teacher'
  >('overview');

  // Student State
  const [students, setStudents] = useState<StudentProfile[]>([]);
  const [activeStudent, setActiveStudent] = useState<StudentProfile | null>(null);
  const [isStudentSelectorOpen, setIsStudentSelectorOpen] = useState<boolean>(false);

  // Teacher State
  const [isTeacherAuthenticated, setIsTeacherAuthenticated] = useState<boolean>(false);
  const [isTeacherLoginModalOpen, setIsTeacherLoginModalOpen] = useState<boolean>(false);

  // Rombel Assignments State (Teacher Simon Murd configures this per class)
  const [rombelAssignments, setRombelAssignments] = useState<Record<string, RombelAssignment>>({});

  // Submissions State (stored by `${studentId}_${babId}` or `${babId}`)
  const [submissions, setSubmissions] = useState<Record<string, ExamSubmission>>({});

  // Modals & Drawers
  const [isAiTutorOpen, setIsAiTutorOpen] = useState<boolean>(false);
  const [isAiGeneratorOpen, setIsAiGeneratorOpen] = useState<boolean>(false);
  const [isStudentChatOpen, setIsStudentChatOpen] = useState<boolean>(false);
  const [unreadStudentMsgCount, setUnreadStudentMsgCount] = useState<number>(0);
  const [notification, setNotification] = useState<string | null>(null);

  // Direct Messages Unread Listener for Active Student
  useEffect(() => {
    const updateUnread = () => {
      if (activeStudent) {
        setUnreadStudentMsgCount(getUnreadCountForStudent(activeStudent.id));
      } else {
        setUnreadStudentMsgCount(0);
      }
    };
    updateUnread();
    window.addEventListener('tjkn_direct_messages_updated', updateUnread);
    window.addEventListener('storage', updateUnread);
    return () => {
      window.removeEventListener('tjkn_direct_messages_updated', updateUnread);
      window.removeEventListener('storage', updateUnread);
    };
  }, [activeStudent]);

  // Initialize data on mount
  useEffect(() => {
    const loadedBabs = getAllCurriculumBabs();
    setBabs(loadedBabs);
    setSelectedBab(loadedBabs[0]);

    // Load students
    const loadedStudents = getAllStudents();
    setStudents(loadedStudents);

    // Load rombel assignments
    const loadedAssignments = getRombelAssignments();
    setRombelAssignments(loadedAssignments);

    // Load active student session if saved previously
    const savedActiveStudent = getActiveStudentSession();
    if (savedActiveStudent) {
      setActiveStudent(savedActiveStudent);
    }

    // Check teacher session
    try {
      const isTeacher = sessionStorage.getItem('tjkn_teacher_auth') === 'true';
      if (isTeacher) {
        setIsTeacherAuthenticated(true);
      }
    } catch (e) {
      // ignore
    }

    // Initial seed submissions including Veliyan Vinson and others
    const seedSubs: Record<string, ExamSubmission> = {
      'mudita_xii_31_8': {
        id: 'sub_veliyan_bab8',
        babId: 8,
        studentId: 'mudita_xii_31',
        studentName: 'VELIYAN VINSON',
        school: 'SMK MUDITA SINGKAWANG',
        className: 'XII TJKT',
        noAbsen: '31',
        date: new Date(Date.now() - 1000 * 60 * 3).toISOString(),
        standardAnswers: {},
        complexAnswers: {},
        standardScore: 19,
        complexScore: 18,
        totalScore: 37,
        percentage: 93,
        isPassed: true,
        timeSpentSeconds: 745,
        isFlaggedTooFast: false,
        tabViolations: 0,
        raguRaguCount: 0,
        status: 'submitted',
      },
      'mudita_xii_31_1': {
        id: 'sub_veliyan_bab1',
        babId: 1,
        studentId: 'mudita_xii_31',
        studentName: 'VELIYAN VINSON',
        school: 'SMK MUDITA SINGKAWANG',
        className: 'XII TJKT',
        noAbsen: '31',
        date: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
        standardAnswers: {},
        complexAnswers: {},
        standardScore: 18,
        complexScore: 18,
        totalScore: 36,
        percentage: 90,
        isPassed: true,
        timeSpentSeconds: 680,
        isFlaggedTooFast: false,
        tabViolations: 0,
        raguRaguCount: 0,
        status: 'submitted',
      },
      'smkn1_x_01_1': {
        id: 'sub_seed_1',
        babId: 1,
        studentId: 'smkn1_x_01',
        studentName: 'ALVINO',
        school: 'SMK NEGERI 1 SINGKAWANG',
        className: 'X TJK',
        noAbsen: '01',
        date: new Date(Date.now() - 3600000 * 4).toISOString(),
        standardAnswers: {},
        complexAnswers: {},
        standardScore: 18,
        complexScore: 17,
        totalScore: 35,
        percentage: 88,
        isPassed: true,
        timeSpentSeconds: 780,
        status: 'submitted',
      },
      'smkn1_x_04_2': {
        id: 'sub_seed_2',
        babId: 2,
        studentId: 'smkn1_x_04',
        studentName: 'DEO REVALDY AHMAD',
        school: 'SMK NEGERI 1 SINGKAWANG',
        className: 'X TJK',
        noAbsen: '04',
        date: new Date(Date.now() - 3600000 * 2).toISOString(),
        standardAnswers: {},
        complexAnswers: {},
        standardScore: 12,
        complexScore: 8,
        totalScore: 20,
        percentage: 50,
        isPassed: false,
        timeSpentSeconds: 45,
        isFlaggedTooFast: true,
        status: 'submitted',
      },
      'mudita_xi_01_5': {
        id: 'sub_seed_3',
        babId: 5,
        studentId: 'mudita_xi_01',
        studentName: 'ALICIA JENIFER',
        school: 'SMK MUDITA SINGKAWANG',
        className: 'XI TJKT',
        noAbsen: '01',
        date: new Date(Date.now() - 3600000 * 6).toISOString(),
        standardAnswers: {},
        complexAnswers: {},
        standardScore: 19,
        complexScore: 18,
        totalScore: 37,
        percentage: 93,
        isPassed: true,
        timeSpentSeconds: 950,
        status: 'submitted',
      },
    };

    // Load initial submissions and merge with Veliyan
    try {
      const savedSubs = localStorage.getItem('tjkn_exam_submissions_v2');
      let currentSubs = seedSubs;
      if (savedSubs) {
        currentSubs = { ...seedSubs, ...JSON.parse(savedSubs) };
        // Ensure Veliyan Vinson is definitely included even if old cache exists
        if (!currentSubs['mudita_xii_31_8']) {
          currentSubs['mudita_xii_31_8'] = seedSubs['mudita_xii_31_8'];
        }
        if (!currentSubs['mudita_xii_31_1']) {
          currentSubs['mudita_xii_31_1'] = seedSubs['mudita_xii_31_1'];
        }
      }
      setSubmissions(currentSubs);
      localStorage.setItem('tjkn_exam_submissions_v2', JSON.stringify(currentSubs));
    } catch (e) {
      console.warn('Failed to load submissions', e);
      setSubmissions(seedSubs);
    }

    // Sync real-time with server submissions
    fetch('/api/submissions')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.submissions) {
          setSubmissions((prev) => {
            const merged = { ...prev, ...data.submissions };
            try {
              localStorage.setItem('tjkn_exam_submissions_v2', JSON.stringify(merged));
            } catch (e) {}
            return merged;
          });
        }
      })
      .catch((err) => console.warn('Could not sync with server on mount', err));
  }, []);

  const syncSubmissionsWithServer = () => {
    fetch('/api/submissions')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.submissions) {
          setSubmissions((prev) => {
            const merged = { ...prev, ...data.submissions };
            try {
              localStorage.setItem('tjkn_exam_submissions_v2', JSON.stringify(merged));
            } catch (e) {}
            return merged;
          });
        }
      })
      .catch((err) => console.warn('Could not sync with server', err));
  };

  // Periodic Polling to sync submissions across student and teacher devices (every 5 seconds)
  useEffect(() => {
    const interval = setInterval(() => {
      syncSubmissionsWithServer();
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const showToastNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => {
      setNotification(null);
    }, 4000);
  };

  // Student selection
  const handleSelectStudent = (student: StudentProfile) => {
    setActiveStudent(student);
    setActiveStudentSession(student);
    setIsStudentSelectorOpen(false);
    showToastNotification(`Selamat datang ${student.name}! Menu LKPD telah dibuka sesuai penugasan rombel ${student.className}.`);
  };

  const handleLogoutStudent = () => {
    setActiveStudent(null);
    setActiveStudentSession(null);
    setActiveTab('overview');
    showToastNotification('Menu LKPD telah dikunci. Silakan isi dan pilih nama siswa untuk membuka kembali.');
  };

  // Teacher Authentication
  const handleTeacherLoginSuccess = () => {
    setIsTeacherAuthenticated(true);
    setUserRole('guru');
    sessionStorage.setItem('tjkn_teacher_auth', 'true');
    setActiveTab('admin_teacher');
    showToastNotification('Berhasil login sebagai Guru Pengampu (Simon Murd)');
  };

  const handleTeacherLogout = () => {
    setIsTeacherAuthenticated(false);
    setUserRole('siswa');
    sessionStorage.removeItem('tjkn_teacher_auth');
    setActiveTab('overview');
    showToastNotification('Telah keluar dari akun Guru.');
  };

  // Rombel Assignments update by teacher
  const handleUpdateRombelAssignments = (next: Record<string, RombelAssignment>) => {
    setRombelAssignments(next);
    saveRombelAssignments(next);
    showToastNotification('Pengaturan penugasan latihan per rombel berhasil disimpan!');
  };

  // Exam Submission by Student
  const handleSaveExamSubmission = (submission: ExamSubmission) => {
    const studentId = activeStudent?.id || 'anon_student';
    const subKey = `${studentId}_${submission.babId}`;
    const enrichedSub: ExamSubmission = {
      ...submission,
      id: submission.id || `sub_${Date.now()}`,
      studentId: activeStudent?.id,
      studentName: activeStudent?.name,
      school: activeStudent?.school,
      className: activeStudent?.className,
    };

    const next = { ...submissions, [subKey]: enrichedSub };
    setSubmissions(next);
    try {
      localStorage.setItem('tjkn_exam_submissions_v2', JSON.stringify(next));
    } catch (e) {
      // ignore
    }

    // Persist to server for real-time teacher synchronization
    fetch('/api/submissions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(enrichedSub),
    }).catch((err) => console.warn('Could not post submission to server', err));

    if (enrichedSub.isFlaggedTooFast) {
      showToastNotification(
        `Hasil CBT ${selectedBab?.code} tersimpan! Catatan: Waktu pengerjaan ${Math.floor(
          submission.timeSpentSeconds
        )} detik terindikasi terlalu cepat dan dipantau oleh Guru.`
      );
    } else {
      showToastNotification(`Hasil Ujian CBT ${selectedBab?.code} berhasil disimpan!`);
    }
  };

  // Teacher Cancels Submission (if too fast)
  const handleCancelSubmissionByTeacher = (subKey: string, reason: string) => {
    const current = submissions[subKey];
    if (!current) return;

    const updatedSub: ExamSubmission = {
      ...current,
      status: 'cancelled_by_teacher',
      cancelReason: reason || 'Pengerjaan terlalu cepat / tidak wajar',
      cancelledAt: new Date().toISOString(),
    };

    const next = { ...submissions, [subKey]: updatedSub };
    setSubmissions(next);
    try {
      localStorage.setItem('tjkn_exam_submissions_v2', JSON.stringify(next));
    } catch (e) {
      // ignore
    }

    // Sync cancellation to server
    fetch('/api/submissions/cancel', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key: subKey, reason }),
    }).catch(() => {});

    showToastNotification(`Ujian ${current.studentName} (${current.school}) berhasil dibatalkan.`);
  };

  // Teacher Restores Submission
  const handleRestoreSubmissionByTeacher = (subKey: string) => {
    const current = submissions[subKey];
    if (!current) return;

    const updatedSub: ExamSubmission = {
      ...current,
      status: 'submitted',
      cancelReason: undefined,
      cancelledAt: undefined,
    };

    const next = { ...submissions, [subKey]: updatedSub };
    setSubmissions(next);
    try {
      localStorage.setItem('tjkn_exam_submissions_v2', JSON.stringify(next));
    } catch (e) {
      // ignore
    }

    // Sync restoration to server
    fetch('/api/submissions/restore', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key: subKey }),
    }).catch(() => {});

    showToastNotification(`Hasil ujian ${current.studentName} dipulihkan.`);
  };

  // Students CRUD operations by Teacher
  const handleUpdateStudents = (updatedList: StudentProfile[]) => {
    setStudents(updatedList);
    saveAllStudents(updatedList);
    if (activeStudent) {
      const fresh = updatedList.find((s) => s.id === activeStudent.id);
      if (fresh) setActiveStudent(fresh);
    }
    showToastNotification('Data master siswa berhasil diperbarui!');
  };

  const handleResetStudents = () => {
    if (window.confirm('Kembalikan data siswa ke data default SMK Negeri 1 & SMK Mudita Singkawang?')) {
      const resetList = resetStudentsToDefault();
      setStudents(resetList);
      saveAllStudents(resetList);
      if (resetList.length > 0) {
        setActiveStudent(resetList[0]);
        setActiveStudentSession(resetList[0]);
      }
      showToastNotification('Data siswa berhasil direset ke data default.');
    }
  };

  // Question bank export
  const handleExportJson = () => {
    if (!selectedBab) return;
    const jsonStr = exportBabToJson(selectedBab);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `BankSoal_${selectedBab.code}_TJKN.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToastNotification(`Bank Soal ${selectedBab.code} berhasil diunduh dalam format JSON!`);
  };

  // AI Question Generation Callback
  const handleAddQuestionFromAi = (
    type: QuestionType,
    newQuestion: StandardMCQ | ComplexMCQ | EssayQuestion
  ) => {
    if (!selectedBab) return;

    const updated = { ...selectedBab };
    if (type === 'standard_mcq') {
      updated.standardMCQs = [...updated.standardMCQs, newQuestion as StandardMCQ];
    } else if (type === 'complex_mcq') {
      updated.complexMCQs = [...updated.complexMCQs, newQuestion as ComplexMCQ];
    } else if (type === 'essay') {
      updated.essayQuestions = [...updated.essayQuestions, newQuestion as EssayQuestion];
    }

    saveCustomBabToStorage(updated);
    setSelectedBab(updated);
    setBabs((prev) => prev.map((b) => (b.id === updated.id ? updated : b)));
    showToastNotification(`Soal baru berhasil ditambahkan ke Bank Soal ${selectedBab.code}!`);
  };

  if (!selectedBab) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center text-slate-500 font-mono text-sm">
        Memuat Kurikulum TJKN Phase F...
      </div>
    );
  }

  // Active student's submission for current Bab (if any)
  const currentStudentSubKey = activeStudent ? `${activeStudent.id}_${selectedBab.id}` : '';
  const currentStudentExistingSub = submissions[currentStudentSubKey];

  // Active student's all submissions for dashboard
  const activeStudentSubmissionsMap: Record<number, ExamSubmission> = {};
  if (activeStudent) {
    Object.values(submissions)
      .filter((s) => s.studentId === activeStudent.id)
      .forEach((s) => {
        activeStudentSubmissionsMap[s.babId] = s;
      });
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans antialiased selection:bg-blue-100 selection:text-blue-900">
      {/* Navbar with Student Identity and Teacher Simon Murd Controls */}
      <Navbar
        babs={babs}
        selectedBab={selectedBab}
        onSelectBab={(bab) => {
          setSelectedBab(bab);
          if (activeTab === 'print' || activeTab === 'admin_teacher') {
            setActiveTab('overview');
          }
        }}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        userRole={isTeacherAuthenticated ? 'guru' : 'siswa'}
        isTeacherAuthenticated={isTeacherAuthenticated}
        onOpenTeacherLogin={() => setIsTeacherLoginModalOpen(true)}
        onTeacherLogout={handleTeacherLogout}
        activeStudent={activeStudent}
        onOpenStudentSelector={() => setIsStudentSelectorOpen(true)}
        onLogoutStudent={handleLogoutStudent}
        onOpenAiTutor={() => setIsAiTutorOpen(true)}
        onOpenAiGenerator={() => setIsAiGeneratorOpen(true)}
        onExportJson={handleExportJson}
        rombelAssignments={rombelAssignments}
        onOpenStudentChat={() => setIsStudentChatOpen(true)}
        unreadStudentMessageCount={unreadStudentMsgCount}
      />

      {/* Floating Notification Toast */}
      {notification && (
        <div className="fixed top-24 right-4 z-50 bg-slate-900 text-white px-4 py-2.5 rounded-2xl shadow-xl flex items-center gap-2 text-xs font-semibold animate-in slide-in-from-top-4 duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{notification}</span>
        </div>
      )}

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        {!activeStudent && !isTeacherAuthenticated ? (
          /* Gated Entry: Student MUST select their name first before LKPD menu unlocks */
          <StudentGateScreen
            students={students}
            onSelectStudent={handleSelectStudent}
            onOpenTeacherLogin={() => setIsTeacherLoginModalOpen(true)}
          />
        ) : (
          /* Unlocked LKPD Content & Menus */
          <>
            {/* Tab 1: Overview */}
            {activeTab === 'overview' && (
              <BabOverview
                bab={selectedBab}
                onNavigateToTab={(tab) => setActiveTab(tab)}
                activeStudent={activeStudent}
                rombelAssignments={rombelAssignments}
                userRole={isTeacherAuthenticated ? 'guru' : 'siswa'}
              />
            )}

            {/* Tab 2: Simulations */}
            {activeTab === 'simulations' && (
              <SimulationContainer
                bab={selectedBab}
                activeStudent={activeStudent}
                rombelAssignments={rombelAssignments}
                allBabs={babs}
                onSelectBab={(b) => setSelectedBab(b)}
                userRole={isTeacherAuthenticated ? 'guru' : 'siswa'}
              />
            )}

            {/* Tab 3: Objective Evaluation */}
            {activeTab === 'objective' && (
              <ObjectiveEvaluation
                bab={selectedBab}
                userRole={isTeacherAuthenticated ? 'guru' : 'siswa'}
                activeStudent={activeStudent}
                existingSubmission={currentStudentExistingSub}
                onSaveSubmission={handleSaveExamSubmission}
                rombelAssignments={rombelAssignments}
                allBabs={babs}
                onSelectBab={(b) => setSelectedBab(b)}
              />
            )}

            {/* Tab 4: Qualitative Evaluation */}
            {activeTab === 'qualitative' && (
              <QualitativeEvaluation
                bab={selectedBab}
                userRole={isTeacherAuthenticated ? 'guru' : 'siswa'}
                activeStudent={activeStudent}
                rombelAssignments={rombelAssignments}
                allBabs={babs}
                onSelectBab={(b) => setSelectedBab(b)}
              />
            )}

            {/* Tab 5: Student Progress Dashboard */}
            {activeTab === 'dashboard' && (
              <div className="space-y-6">
                {activeStudent && (
                  <div className="bg-white border border-slate-200 p-5 rounded-2xl flex items-center justify-between shadow-xs">
                    <div>
                      <div className="text-xs text-slate-500 font-mono uppercase font-bold">Rapor Pembelajaran Siswa</div>
                      <div className="text-base font-bold text-slate-900 mt-0.5">
                        {activeStudent.noAbsen} {activeStudent.name}
                      </div>
                      <div className="text-xs text-blue-700 font-mono mt-0.5">
                        {activeStudent.className} • {activeStudent.school}
                      </div>
                    </div>
                    <button
                      onClick={() => setIsStudentSelectorOpen(true)}
                      className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-semibold text-slate-700 transition"
                    >
                      Ganti Siswa
                    </button>
                  </div>
                )}

                <StudentDashboard
                  babs={babs}
                  submissions={activeStudentSubmissionsMap}
                  userRole={isTeacherAuthenticated ? 'guru' : 'siswa'}
                  onSelectBab={(id) => {
                    const b = babs.find((item) => item.id === id);
                    if (b) {
                      setSelectedBab(b);
                      setActiveTab('overview');
                    }
                  }}
                />
              </div>
            )}

            {/* Tab 6: Admin Guru Dashboard (Simon Murd) */}
            {activeTab === 'admin_teacher' && isTeacherAuthenticated && (
              <TeacherAdminDashboard
                students={students}
                onUpdateStudents={handleUpdateStudents}
                onResetStudentsToDefault={handleResetStudents}
                submissions={submissions}
                onCancelSubmission={handleCancelSubmissionByTeacher}
                onRestoreSubmission={handleRestoreSubmissionByTeacher}
                babs={babs}
                rombelAssignments={rombelAssignments}
                onUpdateRombelAssignments={handleUpdateRombelAssignments}
                onRefreshSubmissions={syncSubmissionsWithServer}
              />
            )}

            {/* Tab 7: Official Print LKPD */}
            {activeTab === 'print' && (
              <PrintableLkpd
                bab={selectedBab}
                onBack={() => setActiveTab('overview')}
              />
            )}
          </>
        )}
      </main>

      {/* Footer - Minimalist Bright White */}
      <footer className="border-t border-slate-200 bg-white py-6 text-center text-xs text-slate-500 print:hidden mt-auto shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 flex flex-wrap items-center justify-between gap-4">
          <div className="text-left">
            <span className="font-bold text-slate-800">TJKN Studio Phase F</span> • Modul & LKPD SMK Kurikulum Merdeka
            <div className="text-[11px] text-slate-500">
              SMK Negeri 1 Singkawang & SMK Mudita Singkawang • Guru Pengampu: Simon Murd
            </div>
          </div>
          <div className="flex items-center gap-4 text-[11px] text-slate-500 font-mono">
            <span>Standar TIA-568 • IEEE 802.11 • ITU-T GPON</span>
            <span>KKM 75</span>
          </div>
        </div>
      </footer>

      {/* Student Selector Modal (When clicked or if student wants to switch) */}
      {isStudentSelectorOpen && (
        <StudentSelector
          students={students}
          selectedStudent={activeStudent}
          onSelectStudent={handleSelectStudent}
          onCancel={() => setIsStudentSelectorOpen(false)}
          isModal={true}
        />
      )}

      {/* Teacher Authentication Modal (simonmurd / d17881520) */}
      <TeacherLoginModal
        isOpen={isTeacherLoginModalOpen}
        onClose={() => setIsTeacherLoginModalOpen(false)}
        onSuccessLogin={handleTeacherLoginSuccess}
      />

      {/* AI Tutor Drawer */}
      <AiTutorDrawer
        bab={selectedBab}
        isOpen={isAiTutorOpen}
        onClose={() => setIsAiTutorOpen(false)}
      />

      {/* AI Question Generator Modal (Guru Mode) */}
      <AiQuestionGeneratorModal
        bab={selectedBab}
        isOpen={isAiGeneratorOpen}
        onClose={() => setIsAiGeneratorOpen(false)}
        onAddQuestion={handleAddQuestionFromAi}
      />

      {/* Student Direct Chat Modal (Messages from Guru Simon Murd) */}
      {activeStudent && (
        <StudentDirectChatModal
          isOpen={isStudentChatOpen}
          onClose={() => setIsStudentChatOpen(false)}
          activeStudent={activeStudent}
        />
      )}
    </div>
  );
}
