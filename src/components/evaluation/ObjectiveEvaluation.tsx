import React, { useState, useEffect, useRef } from 'react';
import {
  CurriculumBab,
  StandardMCQ,
  ComplexMCQ,
  UserRole,
  ExamSubmission,
  StudentProfile,
  RombelAssignment,
} from '../../types/curriculum';
import {
  CheckCircle2,
  XCircle,
  Clock,
  Award,
  RotateCcw,
  Eye,
  Filter,
  ArrowRight,
  ArrowLeft,
  ShieldCheck,
  ShieldAlert,
  Send,
  CloudCheck,
  FileCheck,
  Lock,
  HelpCircle,
  AlertTriangle,
  LayoutGrid,
  List,
  Save,
  Check,
  BookmarkCheck,
  Maximize2,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { RombelAccessLockedNotice } from '../curriculum/RombelAccessLockedNotice';
import { isSectionAccessibleForStudent, getAssignmentForStudent } from '../../data/rombelAssignments';
import { saveSubmissionToFirestore } from '../../lib/firebase';

interface ObjectiveEvaluationProps {
  bab: CurriculumBab;
  userRole: UserRole;
  activeStudent?: StudentProfile | null;
  existingSubmission?: ExamSubmission;
  onSaveSubmission?: (submission: ExamSubmission) => void;
  rombelAssignments?: Record<string, RombelAssignment>;
  allBabs?: CurriculumBab[];
  onSelectBab?: (bab: CurriculumBab) => void;
}

export const ObjectiveEvaluation: React.FC<ObjectiveEvaluationProps> = ({
  bab,
  userRole,
  activeStudent,
  existingSubmission,
  onSaveSubmission,
  rombelAssignments = {},
  allBabs = [],
  onSelectBab,
}) => {
  // Draft storage key
  const draftKey = `tjkn_cbt_draft_${activeStudent?.id || 'anon'}_bab_${bab.id}`;

  // State: Standard and Complex answers
  const [selectedStandard, setSelectedStandard] = useState<Record<string, 'A' | 'B' | 'C' | 'D' | 'E'>>({});
  const [selectedComplex, setSelectedComplex] = useState<Record<string, ('A' | 'B' | 'C' | 'D' | 'E')[]>>({});

  // Ragu-ragu (Doubt) state for question palette (questionId -> boolean)
  const [raguRaguMap, setRaguRaguMap] = useState<Record<string, boolean>>({});

  // Submission state
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);
  const [showTeacherKey, setShowTeacherKey] = useState<boolean>(userRole === 'guru');
  const [secondsElapsed, setSecondsElapsed] = useState<number>(0);

  // ANBK View Modes: 'anbk_single' (Focus 1 per page with grid palette) vs 'list' (Show all 40)
  const [cbtViewMode, setCbtViewMode] = useState<'anbk_single' | 'list'>('anbk_single');
  const [activeQuestionIdx, setActiveQuestionIdx] = useState<number>(0); // 0 to 39
  const [isPaletteOpenMobile, setIsPaletteOpenMobile] = useState<boolean>(false);

  // Anti-Cheat (Tab-Switch / Visibility detection)
  const [tabViolations, setTabViolations] = useState<number>(0);
  const [showViolationModal, setShowViolationModal] = useState<boolean>(false);
  const [lastViolationTime, setLastViolationTime] = useState<string>('');

  // Confirmation modal before submit
  const [showConfirmSubmitModal, setShowConfirmSubmitModal] = useState<boolean>(false);
  const [showResetConfirmModal, setShowResetConfirmModal] = useState<boolean>(false);

  // Sync to Google Apps Script state
  const [appsScriptStatus, setAppsScriptStatus] = useState<'idle' | 'syncing' | 'synced' | 'error'>('idle');
  const [syncMessage, setSyncMessage] = useState<string>('');

  // Load draft or existing submission on mount
  useEffect(() => {
    if (existingSubmission && existingSubmission.status !== 'cancelled_by_teacher') {
      setSelectedStandard((existingSubmission.standardAnswers as Record<string, 'A' | 'B' | 'C' | 'D' | 'E'>) || {});
      setSelectedComplex((existingSubmission.complexAnswers as Record<string, ('A' | 'B' | 'C' | 'D' | 'E')[]>) || {});
      setSecondsElapsed(existingSubmission.timeSpentSeconds || 0);
      setTabViolations(existingSubmission.tabViolations || 0);
      setIsSubmitted(true);
    } else {
      // Restore draft from localStorage if present
      try {
        const rawDraft = localStorage.getItem(draftKey);
        if (rawDraft) {
          const parsed = JSON.parse(rawDraft);
          if (parsed.selectedStandard) setSelectedStandard(parsed.selectedStandard);
          if (parsed.selectedComplex) setSelectedComplex(parsed.selectedComplex);
          if (parsed.raguRaguMap) setRaguRaguMap(parsed.raguRaguMap);
          if (parsed.secondsElapsed) setSecondsElapsed(parsed.secondsElapsed);
          if (parsed.tabViolations) setTabViolations(parsed.tabViolations);
          if (typeof parsed.activeQuestionIdx === 'number') setActiveQuestionIdx(parsed.activeQuestionIdx);
        }
      } catch (e) {
        console.warn('Failed to load CBT draft', e);
      }
    }
  }, [bab.id, existingSubmission]);

  // Auto-Save Draft to LocalStorage whenever answers/ragu/idx change
  useEffect(() => {
    if (isSubmitted || userRole === 'guru') return;
    try {
      const draftData = {
        selectedStandard,
        selectedComplex,
        raguRaguMap,
        secondsElapsed,
        tabViolations,
        activeQuestionIdx,
        lastSaved: new Date().toISOString(),
      };
      localStorage.setItem(draftKey, JSON.stringify(draftData));
    } catch (e) {
      // ignore
    }
  }, [selectedStandard, selectedComplex, raguRaguMap, secondsElapsed, tabViolations, activeQuestionIdx, isSubmitted, userRole]);

  // Timer for student exam mode
  useEffect(() => {
    if (isSubmitted || userRole === 'guru') return;
    const interval = setInterval(() => {
      setSecondsElapsed((s) => s + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [isSubmitted, userRole]);

  // Dispatch current CBT question detail for live lab radar
  useEffect(() => {
    if (userRole === 'siswa' && !isSubmitted) {
      window.dispatchEvent(
        new CustomEvent('tjkn_active_item_detail', {
          detail: { detail: `Soal #${activeQuestionIdx + 1}/40` },
        })
      );
    }
  }, [activeQuestionIdx, userRole, isSubmitted]);

  // Anti-Cheat: Listen for Tab Switch & Window Blur during active exam
  useEffect(() => {
    if (isSubmitted || userRole === 'guru') return;

    let debounceTimer: any = null;

    const handleViolation = () => {
      if (document.hidden) {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
          setTabViolations((prev) => {
            const next = prev + 1;
            setLastViolationTime(new Date().toLocaleTimeString('id-ID'));
            setShowViolationModal(true);
            return next;
          });
        }, 500);
      }
    };

    document.addEventListener('visibilitychange', handleViolation);
    return () => {
      document.removeEventListener('visibilitychange', handleViolation);
      clearTimeout(debounceTimer);
    };
  }, [isSubmitted, userRole]);

  // Check Rombel permission
  const accessCheck = isSectionAccessibleForStudent(activeStudent || null, bab.id, 'objective', rombelAssignments);
  const rombelAssignment = getAssignmentForStudent(activeStudent || null, rombelAssignments);

  if (userRole !== 'guru' && !accessCheck.allowed) {
    return (
      <RombelAccessLockedNotice
        student={activeStudent || null}
        bab={bab}
        sectionName="Evaluasi Objektif (40 Butir Pilihan Ganda CBT)"
        rombelAssignment={rombelAssignment}
        allBabs={allBabs}
        onSelectBab={onSelectBab || (() => {})}
      />
    );
  }

  // Combine questions list (0..19: Standard, 20..39: Complex)
  const all40Questions = [
    ...bab.standardMCQs.map((q, idx) => ({ ...q, questionCategory: 'standard' as const, globalIndex: idx })),
    ...bab.complexMCQs.map((q, idx) => ({ ...q, questionCategory: 'complex' as const, globalIndex: 20 + idx })),
  ];

  const currentActiveQuestion = all40Questions[activeQuestionIdx] || all40Questions[0];

  // Helper: check if a question is answered
  const isQuestionAnswered = (q: (typeof all40Questions)[0]) => {
    if (q.questionCategory === 'standard') {
      return Boolean(selectedStandard[q.id]);
    } else {
      return Boolean(selectedComplex[q.id] && selectedComplex[q.id].length > 0);
    }
  };

  // Helper: check if question is marked ragu-ragu
  const isQuestionRagu = (qId: string) => Boolean(raguRaguMap[qId]);

  // Stats calculation
  const totalAnsweredCount = all40Questions.filter((q) => isQuestionAnswered(q)).length;
  const totalRaguCount = Object.values(raguRaguMap).filter(Boolean).length;
  const totalUnansweredCount = 40 - totalAnsweredCount;

  // Calculate scores
  let standardScore = 0;
  bab.standardMCQs.forEach((q) => {
    if (selectedStandard[q.id] === q.correctAnswer) {
      standardScore += 1;
    }
  });

  let complexScore = 0;
  bab.complexMCQs.forEach((q) => {
    const userAnswers = selectedComplex[q.id] || [];
    const correct = q.correctAnswers;
    const isExact =
      userAnswers.length === correct.length &&
      userAnswers.every((a) => correct.includes(a)) &&
      correct.every((a) => userAnswers.includes(a));
    if (isExact) {
      complexScore += 1;
    }
  });

  const totalPoints = standardScore + complexScore; // out of 40
  const finalPercentage = Math.round((totalPoints / 40) * 100);
  const isPassed = finalPercentage >= 75; // KKM standard SMK TKJ is 75

  // Handlers for answering
  const handleStandardSelect = (qId: string, optId: 'A' | 'B' | 'C' | 'D' | 'E') => {
    if (isSubmitted) return;
    setSelectedStandard((prev) => ({ ...prev, [qId]: optId }));
  };

  const handleComplexToggle = (qId: string, optId: 'A' | 'B' | 'C' | 'D' | 'E') => {
    if (isSubmitted) return;
    const current = selectedComplex[qId] || [];
    const next = current.includes(optId)
      ? current.filter((id) => id !== optId)
      : [...current, optId];
    setSelectedComplex((prev) => ({ ...prev, [qId]: next }));
  };

  const handleToggleRagu = (qId: string) => {
    if (isSubmitted) return;
    setRaguRaguMap((prev) => ({ ...prev, [qId]: !prev[qId] }));
  };

  // Submit Final Exam
  const handleExecuteSubmit = async () => {
    setShowConfirmSubmitModal(false);
    setIsSubmitted(true);
    const isTooFast = secondsElapsed < 120; // less than 2 minutes for 40 questions

    if (isPassed) {
      try {
        confetti({
          particleCount: 90,
          spread: 75,
          origin: { y: 0.6 },
          colors: ['#2563eb', '#10b981', '#6366f1', '#f59e0b'],
        });
      } catch (e) {
        // ignore
      }
    }

    const submissionPayload: ExamSubmission = {
      babId: bab.id,
      studentId: activeStudent?.id,
      studentName: activeStudent?.name,
      school: activeStudent?.school,
      className: activeStudent?.className,
      date: new Date().toISOString(),
      standardAnswers: selectedStandard,
      complexAnswers: selectedComplex,
      standardScore,
      complexScore,
      totalScore: totalPoints,
      percentage: finalPercentage,
      isPassed,
      timeSpentSeconds: secondsElapsed,
      isFlaggedTooFast: isTooFast,
      tabViolations,
      raguRaguCount: totalRaguCount,
      status: 'submitted',
    };

    if (onSaveSubmission) {
      onSaveSubmission(submissionPayload);
    }

    // Save directly to Firebase Firestore Cloud
    saveSubmissionToFirestore(submissionPayload);

    // Clear draft from localStorage
    try {
      localStorage.removeItem(draftKey);
    } catch (e) {
      // ignore
    }

    // Forward to Google Apps Script (MCQ endpoint)
    if (activeStudent) {
      setAppsScriptStatus('syncing');
      try {
        const res = await fetch('/api/mcq-log', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            studentName: activeStudent.name,
            noAbsen: activeStudent.noAbsen,
            className: activeStudent.className,
            school: activeStudent.school,
            babId: bab.id,
            babCode: bab.code,
            babTitle: bab.title,
            standardScore,
            complexScore,
            totalScore: totalPoints,
            percentage: finalPercentage,
            isPassed,
            timeSpentSeconds: secondsElapsed,
            isFlaggedTooFast: isTooFast,
            tabViolations,
            details: isPassed
              ? `Tuntas KKM (${finalPercentage}%) - ${totalPoints}/40 poin • Pelanggaran Tab: ${tabViolations}`
              : `Belum Tuntas (${finalPercentage}%) - Perlu Remedial • Pelanggaran Tab: ${tabViolations}`,
            timestamp: new Date().toISOString(),
          }),
        });

        const data = await res.json();
        if (res.ok && data.success) {
          setAppsScriptStatus('synced');
          setSyncMessage('Hasil CBT tersinkronisasi otomatis ke Google Spreadsheet Guru!');
        } else {
          setAppsScriptStatus('error');
          setSyncMessage(data.error || 'Tersimpan lokal di perangkat');
        }
      } catch (err) {
        setAppsScriptStatus('error');
        setSyncMessage('Data tersimpan secara lokal di browser');
      }
    }
  };

  const handleResetExam = () => {
    setShowResetConfirmModal(true);
  };

  const handlePerformReset = () => {
    setSelectedStandard({});
    setSelectedComplex({});
    setRaguRaguMap({});
    setIsSubmitted(false);
    setSecondsElapsed(0);
    setTabViolations(0);
    setActiveQuestionIdx(0);
    setAppsScriptStatus('idle');
    try {
      localStorage.removeItem(draftKey);
    } catch (e) {
      // ignore
    }
    setShowResetConfirmModal(false);
  };

  const formatTimer = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const s = sec % 60;
    return `${mins.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Teacher Cancellation Alert Banner */}
      {existingSubmission?.status === 'cancelled_by_teacher' && !isSubmitted && (
        <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-900 shadow-xs flex items-start gap-3.5">
          <ShieldAlert className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
          <div className="text-xs">
            <h4 className="font-bold text-sm text-red-900 mb-0.5">
              Peringatan: Hasil Ujian Sebelumnya Dibatalkan oleh Guru Pengampu (Pak Simon Murd)
            </h4>
            <p className="leading-relaxed mb-1.5 text-red-700">
              Alasan Pembatalan: <strong className="text-red-950">"{existingSubmission.cancelReason || 'Pengerjaan terlalu cepat / tidak wajar'}"</strong>.
            </p>
            <p className="text-red-600 font-medium">
              Silakan baca dan telaah kembali setiap butir soal dengan cermat. Sistem pengawas CBT memantau waktu dan perpindahan tab Anda.
            </p>
          </div>
        </div>
      )}

      {/* Top Header Bar: Timer, Anti-Cheat, & View Modes */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200 rounded-full font-mono">
                CBT Berstandar ANBK
              </span>
              <h3 className="text-lg font-bold text-slate-900">
                Evaluasi Objektif 40 Butir ({bab.code})
              </h3>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              {activeStudent ? (
                <span>
                  Peserta: <strong className="text-slate-800">{activeStudent.noAbsen} {activeStudent.name}</strong> ({activeStudent.className} • {activeStudent.school}) • KKM: 75
                </span>
              ) : (
                '20 Soal Standar (A-E) + 20 Soal Kompleks (Checkbox). KKM Kelulusan: 75.'
              )}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            {/* Realtime Anti-Cheat Badge */}
            {!isSubmitted && userRole === 'siswa' && (
              <div
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-medium ${
                  tabViolations > 0
                    ? 'bg-red-50 text-red-700 border-red-300'
                    : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                }`}
                title="Sistem pengawas mendeteksi jika jendela ujian ditinggalkan"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>
                  {tabViolations === 0 ? 'Layar Terkunci (Aman)' : `${tabViolations}x Pindah Tab`}
                </span>
              </div>
            )}

            {/* Timer Clock */}
            {!isSubmitted && userRole === 'siswa' && (
              <div className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-mono font-bold text-slate-700 shadow-2xs">
                <Clock className="w-3.5 h-3.5 text-blue-600" />
                <span>Waktu: {formatTimer(secondsElapsed)}</span>
              </div>
            )}

            {/* Teacher Toggle */}
            {userRole === 'guru' && (
              <button
                onClick={() => setShowTeacherKey(!showTeacherKey)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition border ${
                  showTeacherKey
                    ? 'bg-amber-50 text-amber-800 border-amber-300'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
              >
                <Eye className="w-3.5 h-3.5 text-amber-600" />
                {showTeacherKey ? 'Kunci Jawaban Guru Aktif' : 'Tampilkan Kunci Jawaban'}
              </button>
            )}

            {/* View Mode Toggle: ANBK Single vs List */}
            <div className="bg-slate-100 p-1 rounded-xl border border-slate-200 flex text-xs">
              <button
                onClick={() => setCbtViewMode('anbk_single')}
                className={`px-3 py-1 rounded-lg font-medium transition flex items-center gap-1.5 ${
                  cbtViewMode === 'anbk_single'
                    ? 'bg-white text-slate-900 shadow-2xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Tampilkan 1 soal per halaman dengan kisi navigasi ala ANBK"
              >
                <LayoutGrid className="w-3.5 h-3.5 text-blue-600" />
                <span>Mode ANBK</span>
              </button>

              <button
                onClick={() => setCbtViewMode('list')}
                className={`px-3 py-1 rounded-lg font-medium transition flex items-center gap-1.5 ${
                  cbtViewMode === 'list'
                    ? 'bg-white text-slate-900 shadow-2xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Tampilkan semua 40 soal dalam satu daftar panjang"
              >
                <List className="w-3.5 h-3.5 text-slate-600" />
                <span>Mode Daftar</span>
              </button>
            </div>
          </div>
        </div>

        {/* Realtime Draft Save Indicator */}
        {!isSubmitted && (
          <div className="flex flex-wrap items-center justify-between text-[11px] text-slate-400 border-t border-slate-100 pt-3">
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1 text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                <CloudCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>Auto-Save Aktif: Jawaban tersimpan otomatis</span>
              </span>
              <span className="text-slate-400 hidden sm:inline">•</span>
              <span className="text-slate-500 font-medium">
                {totalAnsweredCount} dari 40 soal terjawab
                {totalRaguCount > 0 && ` (${totalRaguCount} ragu-ragu)`}
              </span>
            </div>

            <button
              onClick={() => setIsPaletteOpenMobile(!isPaletteOpenMobile)}
              className="lg:hidden text-blue-600 font-bold hover:underline"
            >
              {isPaletteOpenMobile ? 'Tutup Kisi Soal ▲' : 'Buka Kisi 40 Soal ▼'}
            </button>
          </div>
        )}

        {/* Sync Status Feedback */}
        {appsScriptStatus !== 'idle' && (
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              {appsScriptStatus === 'syncing' && (
                <>
                  <div className="w-2 h-2 rounded-full bg-blue-500 animate-ping" />
                  <span className="text-slate-500">Mengirim nilai CBT ke Google Spreadsheet Guru...</span>
                </>
              )}
              {appsScriptStatus === 'synced' && (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span className="text-emerald-700 font-semibold">{syncMessage}</span>
                </>
              )}
              {appsScriptStatus === 'error' && (
                <>
                  <ShieldAlert className="w-4 h-4 text-amber-500" />
                  <span className="text-slate-600">{syncMessage}</span>
                </>
              )}
            </div>
            <span className="text-[11px] text-slate-400 font-mono">
              Endpoint: Apps Script Pilihan Ganda
            </span>
          </div>
        )}
      </div>

      {/* Post-Submission Score Card */}
      {isSubmitted && (
        <div
          className={`border rounded-2xl p-6 shadow-sm transition ${
            isPassed
              ? 'bg-emerald-50/80 border-emerald-200 text-slate-900'
              : 'bg-amber-50/80 border-amber-200 text-slate-900'
          }`}
        >
          <div className="flex flex-wrap items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div
                className={`w-14 h-14 rounded-2xl flex items-center justify-center font-bold text-xl shadow-xs ${
                  isPassed ? 'bg-emerald-600 text-white' : 'bg-amber-600 text-white'
                }`}
              >
                {finalPercentage}%
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-base font-bold text-slate-900">
                    {isPassed ? 'Selamat, Anda Lulus Evaluasi Objektif!' : 'Hasil Evaluasi: Perlu Pendalaman Materi'}
                  </h4>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                      isPassed
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                        : 'bg-amber-100 text-amber-800 border border-amber-300'
                    }`}
                  >
                    {isPassed ? 'TUNTAS KKM' : 'REMEDIAL (< 75)'}
                  </span>
                </div>
                <p className="text-xs text-slate-600 mt-1">
                  Skor Perolehan: <strong className="text-slate-900">{totalPoints} dari 40 butir benar</strong> ({standardScore} Standar + {complexScore} Kompleks) • Waktu Pengerjaan: {formatTimer(secondsElapsed)}
                </p>
                {tabViolations > 0 && (
                  <div className="text-[11px] text-red-600 font-semibold mt-1 flex items-center gap-1">
                    <ShieldAlert className="w-3.5 h-3.5" />
                    Catatan Pengawas: Terdeteksi {tabViolations} kali berpindah tab/layar selama ujian.
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleResetExam}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white border border-slate-300 hover:bg-slate-50 text-xs font-semibold text-slate-700 shadow-2xs transition"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Ulangi Ujian
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main CBT Workspace: 2 Columns on Desktop (Question Content on Left, Grid Palette on Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN: Question(s) Display (8 Cols on desktop) */}
        <div className="lg:col-span-8 space-y-6">
          {cbtViewMode === 'anbk_single' ? (
            /* MODE 1: ANBK SINGLE QUESTION FOCUS */
            <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
              {/* Question Header */}
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div className="flex items-center gap-3">
                  <span className="w-9 h-9 rounded-xl bg-blue-600 text-white font-extrabold text-sm flex items-center justify-center font-mono shadow-2xs">
                    {currentActiveQuestion.number}
                  </span>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs text-slate-900">
                        {currentActiveQuestion.questionCategory === 'standard'
                          ? 'Soal Pilihan Ganda Standar (1 Jawaban)'
                          : 'Soal Pilihan Ganda Kompleks (Bisa > 1 Jawaban)'}
                      </span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                        Soal {activeQuestionIdx + 1} dari 40
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                      {currentActiveQuestion.competency}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleToggleRagu(currentActiveQuestion.id)}
                    disabled={isSubmitted}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition border flex items-center gap-1.5 ${
                      isQuestionRagu(currentActiveQuestion.id)
                        ? 'bg-amber-400 text-amber-950 border-amber-500 font-bold shadow-2xs'
                        : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <BookmarkCheck className="w-3.5 h-3.5" />
                    <span>{isQuestionRagu(currentActiveQuestion.id) ? 'Ragu-Ragu Aktif' : 'Tandai Ragu-Ragu'}</span>
                  </button>
                </div>
              </div>

              {/* Question Stimulus / Text */}
              <div className="text-sm sm:text-base text-slate-900 font-medium leading-relaxed">
                {currentActiveQuestion.question}
              </div>

              {/* Options Section */}
              {currentActiveQuestion.questionCategory === 'standard' ? (
                /* Standard Single Choice A-E */
                <div className="space-y-2.5">
                  {(currentActiveQuestion as StandardMCQ).options.map((opt) => {
                    const selected = selectedStandard[currentActiveQuestion.id];
                    const isChosen = selected === opt.id;
                    const isCorrectAnswer = (currentActiveQuestion as StandardMCQ).correctAnswer === opt.id;

                    let optClass = 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100 hover:border-slate-300';
                    if (isSubmitted) {
                      if (isCorrectAnswer) {
                        optClass = 'bg-emerald-50 border-emerald-400 text-emerald-900 font-semibold ring-1 ring-emerald-400';
                      } else if (isChosen && !isCorrectAnswer) {
                        optClass = 'bg-red-50 border-red-300 text-red-900 line-through';
                      }
                    } else if (isChosen) {
                      optClass = 'bg-blue-50 border-blue-600 text-blue-900 font-semibold ring-2 ring-blue-500/20';
                    }

                    return (
                      <button
                        key={opt.id}
                        onClick={() => handleStandardSelect(currentActiveQuestion.id, opt.id)}
                        disabled={isSubmitted}
                        className={`w-full p-3.5 rounded-xl border text-left text-xs sm:text-sm transition flex items-center gap-3.5 ${optClass}`}
                      >
                        <span
                          className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs font-mono shrink-0 ${
                            isChosen
                              ? 'bg-blue-600 text-white'
                              : 'bg-white border border-slate-200 text-slate-600'
                          }`}
                        >
                          {opt.id}
                        </span>
                        <span className="flex-1 leading-snug">{opt.text}</span>
                      </button>
                    );
                  })}
                </div>
              ) : (
                /* Complex Checkbox Multiple Choices */
                <div className="space-y-2.5">
                  <div className="text-xs text-purple-700 font-semibold">
                    * Perintah: Pilihlah beberapa opsi yang benar (klik untuk mencentang)
                  </div>
                  {(currentActiveQuestion as ComplexMCQ).options.map((opt) => {
                    const userAnswers = selectedComplex[currentActiveQuestion.id] || [];
                    const isSelected = userAnswers.includes(opt.id);
                    const isCorrectAnswer = (currentActiveQuestion as ComplexMCQ).correctAnswers.includes(opt.id);

                    let optClass = 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100 hover:border-slate-300';
                    if (isSubmitted) {
                      if (isCorrectAnswer) {
                        optClass = 'bg-emerald-50 border-emerald-400 text-emerald-900 font-semibold';
                      } else if (isSelected && !isCorrectAnswer) {
                        optClass = 'bg-red-50 border-red-300 text-red-900';
                      }
                    } else if (isSelected) {
                      optClass = 'bg-purple-50 border-purple-600 text-purple-900 font-semibold ring-2 ring-purple-500/20';
                    }

                    return (
                      <button
                        key={opt.id}
                        onClick={() => handleComplexToggle(currentActiveQuestion.id, opt.id)}
                        disabled={isSubmitted}
                        className={`w-full p-3.5 rounded-xl border text-left text-xs sm:text-sm transition flex items-center gap-3.5 ${optClass}`}
                      >
                        <div
                          className={`w-5 h-5 rounded border flex items-center justify-center text-xs font-bold shrink-0 ${
                            isSelected
                              ? 'bg-purple-600 border-purple-600 text-white'
                              : 'border-slate-300 bg-white'
                          }`}
                        >
                          {isSelected ? '✓' : ''}
                        </div>
                        <span className="font-mono text-slate-500 font-bold shrink-0">{opt.id}.</span>
                        <span className="flex-1 leading-snug">{opt.text}</span>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Teacher / Post Submit Explanation */}
              {(isSubmitted || showTeacherKey) && (
                <div className="mt-4 p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1.5 animate-in fade-in">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-700">Kunci Jawaban Guru:</span>
                    <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold font-mono">
                      {currentActiveQuestion.questionCategory === 'standard'
                        ? (currentActiveQuestion as StandardMCQ).correctAnswer
                        : (currentActiveQuestion as ComplexMCQ).correctAnswers.join(', ')}
                    </span>
                  </div>
                  <p className="text-slate-600 text-[11px] leading-relaxed">
                    <strong>Pembahasan:</strong> {currentActiveQuestion.explanation}
                  </p>
                </div>
              )}

              {/* ANBK Navigation Bar (Previous, Ragu, Next) */}
              <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
                <button
                  onClick={() => setActiveQuestionIdx((prev) => Math.max(0, prev - 1))}
                  disabled={activeQuestionIdx === 0}
                  className="px-4 py-2.5 rounded-xl bg-white border border-slate-300 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed text-xs font-semibold text-slate-700 transition flex items-center gap-1.5 shadow-2xs"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Soal Sebelumnya</span>
                </button>

                <div className="text-xs font-mono text-slate-400 font-medium">
                  {activeQuestionIdx + 1} / 40
                </div>

                {activeQuestionIdx < 39 ? (
                  <button
                    onClick={() => setActiveQuestionIdx((prev) => Math.min(39, prev + 1))}
                    className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-xs"
                  >
                    <span>Soal Berikutnya</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    onClick={() => setShowConfirmSubmitModal(true)}
                    disabled={isSubmitted}
                    className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
                  >
                    <ShieldCheck className="w-4 h-4" />
                    <span>Selesaikan Ujian CBT</span>
                  </button>
                )}
              </div>
            </div>
          ) : (
            /* MODE 2: COMPLETE LIST VIEW (ALL 40 QUESTIONS) */
            <div className="space-y-6">
              {/* 20 Standard Questions */}
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                  <h4 className="font-bold text-sm text-slate-900">
                    Bagian 2.1: 20 Soal Pilihan Ganda Tunggal (A-E)
                  </h4>
                  <span className="text-xs text-slate-400 font-mono">1 Jawaban Tepat</span>
                </div>

                {bab.standardMCQs.map((q, idx) => {
                  const selected = selectedStandard[q.id];
                  const isCorrect = selected === q.correctAnswer;
                  const isRagu = isQuestionRagu(q.id);

                  return (
                    <div
                      key={q.id}
                      id={`soal_standard_${idx}`}
                      className={`bg-white border rounded-2xl p-5 transition shadow-2xs ${
                        isSubmitted
                          ? isCorrect
                            ? 'border-emerald-300 bg-emerald-50/20'
                            : 'border-red-200 bg-red-50/20'
                          : isRagu
                          ? 'border-amber-400 bg-amber-50/20'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div className="flex items-center gap-2">
                          <span className="w-7 h-7 rounded-lg bg-slate-100 text-slate-800 flex items-center justify-center font-bold text-xs font-mono">
                            {q.number}
                          </span>
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                            Pilihan Ganda
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleToggleRagu(q.id)}
                            disabled={isSubmitted}
                            className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border transition ${
                              isRagu
                                ? 'bg-amber-400 text-amber-950 border-amber-500 font-bold'
                                : 'bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100'
                            }`}
                          >
                            {isRagu ? '★ Ragu-ragu' : 'Tandai Ragu'}
                          </button>
                          <span className="text-[11px] text-slate-400 font-mono text-right truncate max-w-xs">
                            {q.competency}
                          </span>
                        </div>
                      </div>

                      <p className="text-xs sm:text-sm text-slate-900 font-medium leading-relaxed mb-4">
                        {q.question}
                      </p>

                      <div className="space-y-2">
                        {q.options.map((opt) => {
                          const isChosen = selected === opt.id;
                          const isCorrectAnswer = q.correctAnswer === opt.id;

                          let optClass = 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100 hover:border-slate-300';
                          if (isSubmitted) {
                            if (isCorrectAnswer) {
                              optClass = 'bg-emerald-50 border-emerald-400 text-emerald-900 font-semibold ring-1 ring-emerald-400';
                            } else if (isChosen && !isCorrectAnswer) {
                              optClass = 'bg-red-50 border-red-300 text-red-900 line-through';
                            }
                          } else if (isChosen) {
                            optClass = 'bg-blue-50 border-blue-500 text-blue-900 font-semibold ring-2 ring-blue-500/20';
                          }

                          return (
                            <button
                              key={opt.id}
                              onClick={() => handleStandardSelect(q.id, opt.id)}
                              disabled={isSubmitted}
                              className={`w-full p-3 rounded-xl border text-left text-xs transition flex items-center gap-3 ${optClass}`}
                            >
                              <span
                                className={`w-6 h-6 rounded-lg flex items-center justify-center font-bold text-xs font-mono shrink-0 ${
                                  isChosen
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-white border border-slate-200 text-slate-600'
                                }`}
                              >
                                {opt.id}
                              </span>
                              <span className="flex-1">{opt.text}</span>
                            </button>
                          );
                        })}
                      </div>

                      {(isSubmitted || showTeacherKey) && (
                        <div className="mt-4 pt-3 border-t border-slate-100 text-xs space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-slate-600">Kunci Jawaban Guru:</span>
                            <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold font-mono">
                              {q.correctAnswer}
                            </span>
                          </div>
                          <p className="text-slate-600 text-[11px] leading-relaxed pt-1">
                            <strong>Pembahasan:</strong> {q.explanation}
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* 20 Complex Questions */}
              <div className="space-y-4 pt-4">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                  <h4 className="font-bold text-sm text-slate-900">
                    Bagian 2.2: 20 Soal Pilihan Ganda Kompleks (Checkbox)
                  </h4>
                  <span className="text-xs text-slate-400 font-mono">Centang Beberapa Opsi Benar</span>
                </div>

                {bab.complexMCQs.map((q, idx) => {
                  const userAnswers = selectedComplex[q.id] || [];
                  const isExact =
                    userAnswers.length === q.correctAnswers.length &&
                    userAnswers.every((a) => q.correctAnswers.includes(a)) &&
                    q.correctAnswers.every((a) => userAnswers.includes(a));
                  const isRagu = isQuestionRagu(q.id);

                  return (
                    <div
                      key={q.id}
                      id={`soal_complex_${idx}`}
                      className={`bg-white border rounded-2xl p-5 transition shadow-2xs ${
                        isSubmitted
                          ? isExact
                            ? 'border-emerald-300 bg-emerald-50/20'
                            : 'border-amber-200 bg-amber-50/20'
                          : isRagu
                          ? 'border-amber-400 bg-amber-50/20'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div className="flex items-center gap-2">
                          <span className="w-7 h-7 rounded-lg bg-slate-100 text-slate-800 flex items-center justify-center font-bold text-xs font-mono">
                            {q.number}
                          </span>
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200">
                            Pilihan Kompleks
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleToggleRagu(q.id)}
                            disabled={isSubmitted}
                            className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border transition ${
                              isRagu
                                ? 'bg-amber-400 text-amber-950 border-amber-500 font-bold'
                                : 'bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100'
                            }`}
                          >
                            {isRagu ? '★ Ragu-ragu' : 'Tandai Ragu'}
                          </button>
                          <span className="text-[11px] text-slate-400 font-mono text-right truncate max-w-xs">
                            {q.competency}
                          </span>
                        </div>
                      </div>

                      <p className="text-xs sm:text-sm text-slate-900 font-medium leading-relaxed mb-4">
                        {q.question}
                      </p>

                      <div className="space-y-2">
                        {q.options.map((opt) => {
                          const isSelected = userAnswers.includes(opt.id);
                          const isCorrectAnswer = q.correctAnswers.includes(opt.id);

                          let optClass = 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100 hover:border-slate-300';
                          if (isSubmitted) {
                            if (isCorrectAnswer) {
                              optClass = 'bg-emerald-50 border-emerald-400 text-emerald-900 font-semibold';
                            } else if (isSelected && !isCorrectAnswer) {
                              optClass = 'bg-red-50 border-red-300 text-red-900';
                            }
                          } else if (isSelected) {
                            optClass = 'bg-purple-50 border-purple-500 text-purple-900 font-semibold ring-2 ring-purple-500/20';
                          }

                          return (
                            <button
                              key={opt.id}
                              onClick={() => handleComplexToggle(q.id, opt.id)}
                              disabled={isSubmitted}
                              className={`w-full p-3 rounded-xl border text-left text-xs transition flex items-center gap-3 ${optClass}`}
                            >
                              <div
                                className={`w-4 h-4 rounded border flex items-center justify-center text-[10px] font-bold shrink-0 ${
                                  isSelected
                                    ? 'bg-purple-600 border-purple-600 text-white'
                                    : 'border-slate-300 bg-white'
                                }`}
                              >
                                {isSelected ? '✓' : ''}
                              </div>
                              <span className="font-mono text-slate-500 font-bold shrink-0">{opt.id}.</span>
                              <span className="flex-1">{opt.text}</span>
                            </button>
                          );
                        })}
                      </div>

                      {(isSubmitted || showTeacherKey) && (
                        <div className="mt-4 pt-3 border-t border-slate-100 text-xs space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-slate-600">Kunci Jawaban Guru:</span>
                            <span className="px-2 py-0.5 rounded bg-purple-100 text-purple-800 font-bold font-mono">
                              {q.correctAnswers.join(', ')}
                            </span>
                          </div>
                          <p className="text-slate-600 text-[11px] leading-relaxed pt-1">
                            <strong>Pembahasan:</strong> {q.explanation}
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: Kisi Navigasi Soal (Grid 1 to 40) - 4 Cols on desktop */}
        <div className={`lg:col-span-4 ${isPaletteOpenMobile ? 'block' : 'hidden lg:block'}`}>
          <div className="sticky top-24 bg-white border border-slate-200 rounded-3xl p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h4 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                  <LayoutGrid className="w-4 h-4 text-blue-600" />
                  <span>Kisi Nomor Soal</span>
                </h4>
                <div className="text-[11px] text-slate-500 mt-0.5 font-mono">
                  {totalAnsweredCount} / 40 Terjawab • {totalRaguCount} Ragu
                </div>
              </div>

              <div className="text-xs font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-lg border border-blue-200">
                {Math.round((totalAnsweredCount / 40) * 100)}%
              </div>
            </div>

            {/* Legend */}
            <div className="grid grid-cols-3 gap-1.5 text-[10px] font-mono font-semibold text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-emerald-500 shrink-0" />
                <span>Dijawab</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-amber-400 shrink-0" />
                <span>Ragu</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-white border border-slate-300 shrink-0" />
                <span>Belum</span>
              </div>
            </div>

            {/* Part 1: Standard Questions (1-20) */}
            <div>
              <div className="text-[10px] font-bold font-mono text-slate-400 uppercase tracking-wider mb-2">
                1. Soal Pilihan Standar (1 - 20):
              </div>
              <div className="grid grid-cols-5 gap-1.5">
                {all40Questions.slice(0, 20).map((q, idx) => {
                  const answered = isQuestionAnswered(q);
                  const ragu = isQuestionRagu(q.id);
                  const isActive = activeQuestionIdx === idx;

                  let btnStyle = 'bg-white border-slate-300 text-slate-700 hover:border-slate-400';
                  if (ragu) {
                    btnStyle = 'bg-amber-400 border-amber-500 text-amber-950 font-black';
                  } else if (answered) {
                    btnStyle = 'bg-emerald-500 border-emerald-600 text-white font-bold';
                  }

                  if (isActive) {
                    btnStyle += ' ring-2 ring-blue-600 ring-offset-1 border-blue-600';
                  }

                  return (
                    <button
                      key={q.id}
                      onClick={() => {
                        setActiveQuestionIdx(idx);
                        if (cbtViewMode === 'list') {
                          document.getElementById(`soal_standard_${idx}`)?.scrollIntoView({ behavior: 'smooth' });
                        }
                      }}
                      className={`h-9 rounded-xl border text-xs font-mono transition flex items-center justify-center relative ${btnStyle}`}
                      title={`Nomor ${q.number}: ${answered ? 'Sudah dijawab' : 'Belum'} ${ragu ? '(Ragu-ragu)' : ''}`}
                    >
                      <span>{q.number}</span>
                      {ragu && <span className="absolute -top-1 -right-1 text-[8px]">★</span>}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Part 2: Complex Questions (21-40) */}
            <div>
              <div className="text-[10px] font-bold font-mono text-slate-400 uppercase tracking-wider mb-2">
                2. Soal Pilihan Kompleks (21 - 40):
              </div>
              <div className="grid grid-cols-5 gap-1.5">
                {all40Questions.slice(20, 40).map((q, idx) => {
                  const globalIdx = 20 + idx;
                  const answered = isQuestionAnswered(q);
                  const ragu = isQuestionRagu(q.id);
                  const isActive = activeQuestionIdx === globalIdx;

                  let btnStyle = 'bg-white border-slate-300 text-slate-700 hover:border-slate-400';
                  if (ragu) {
                    btnStyle = 'bg-amber-400 border-amber-500 text-amber-950 font-black';
                  } else if (answered) {
                    btnStyle = 'bg-emerald-500 border-emerald-600 text-white font-bold';
                  }

                  if (isActive) {
                    btnStyle += ' ring-2 ring-blue-600 ring-offset-1 border-blue-600';
                  }

                  return (
                    <button
                      key={q.id}
                      onClick={() => {
                        setActiveQuestionIdx(globalIdx);
                        if (cbtViewMode === 'list') {
                          document.getElementById(`soal_complex_${idx}`)?.scrollIntoView({ behavior: 'smooth' });
                        }
                      }}
                      className={`h-9 rounded-xl border text-xs font-mono transition flex items-center justify-center relative ${btnStyle}`}
                      title={`Nomor ${q.number}: ${answered ? 'Sudah dijawab' : 'Belum'} ${ragu ? '(Ragu-ragu)' : ''}`}
                    >
                      <span>{q.number}</span>
                      {ragu && <span className="absolute -top-1 -right-1 text-[8px]">★</span>}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Action Submit from Palette */}
            {!isSubmitted && (
              <div className="pt-3 border-t border-slate-100">
                <button
                  onClick={() => setShowConfirmSubmitModal(true)}
                  className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs transition flex items-center justify-center gap-2"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>Kumpulkan Ujian CBT</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* MODAL 1: ANTI-CHEAT TAB-SWITCH WARNING */}
      {showViolationModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white border-2 border-red-500 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl relative text-xs space-y-4">
            <div className="flex items-center gap-3 text-red-600">
              <div className="w-12 h-12 rounded-2xl bg-red-100 flex items-center justify-center font-bold shrink-0">
                <ShieldAlert className="w-6 h-6 text-red-600 animate-bounce" />
              </div>
              <div>
                <h3 className="font-extrabold text-base text-slate-900">
                  Peringatan Pelanggaran #{tabViolations}
                </h3>
                <span className="text-[11px] text-red-600 font-semibold font-mono">
                  Terdeteksi pada {lastViolationTime}
                </span>
              </div>
            </div>

            <p className="text-slate-700 leading-relaxed">
              Anda terdeteksi <strong className="text-red-700">berpindah tab atau meninggalkan jendela browser ujian</strong>. Sistem pengawas CBT SMK TKJ telah mencatat aktivitas ini dan akan meneruskannya ke lembar pemantauan guru (Pak Simon Murd).
            </p>

            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-800 text-[11px] leading-relaxed">
              Perhatian: Pembukaan tab lain, pencarian jawaban, atau membuka aplikasi selain CBT dapat menyebabkan hasil ujian <strong>dibatalkan langsung oleh guru</strong>.
            </div>

            <button
              onClick={() => setShowViolationModal(false)}
              className="w-full py-3 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-md shadow-red-500/20 active:scale-95 transition"
            >
              Saya Mengerti & Kembali ke Soal
            </button>
          </div>
        </div>
      )}

      {/* MODAL 2: CONFIRMATION BEFORE SUBMISSION */}
      {showConfirmSubmitModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl relative text-xs space-y-4">
            <div className="flex items-center gap-3 text-slate-900">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold shrink-0">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-extrabold text-base text-slate-900">
                  Konfirmasi Pengumpulan Ujian CBT
                </h3>
                <span className="text-[11px] text-slate-500 font-mono">
                  Modul {bab.code}: {bab.title.slice(0, 24)}...
                </span>
              </div>
            </div>

            {/* Recap Counters */}
            <div className="grid grid-cols-3 gap-2 text-center p-3 bg-slate-50 border border-slate-200 rounded-2xl">
              <div>
                <div className="text-xs text-slate-500 font-mono">Terjawab</div>
                <div className="text-base font-extrabold text-emerald-600">{totalAnsweredCount}</div>
              </div>
              <div>
                <div className="text-xs text-slate-500 font-mono">Ragu-Ragu</div>
                <div className="text-base font-extrabold text-amber-600">{totalRaguCount}</div>
              </div>
              <div>
                <div className="text-xs text-slate-500 font-mono">Belum Diisi</div>
                <div className="text-base font-extrabold text-red-600">{totalUnansweredCount}</div>
              </div>
            </div>

            {totalUnansweredCount > 0 && (
              <div className="p-3 bg-amber-50 border border-amber-200 text-amber-900 rounded-xl text-[11px] leading-relaxed flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <span>
                  Masih terdapat <strong>{totalUnansweredCount} butir soal</strong> yang belum Anda jawab. Soal yang tidak dijawab bernilai 0.
                </span>
              </div>
            )}

            {totalRaguCount > 0 && (
              <div className="p-3 bg-blue-50 border border-blue-200 text-blue-900 rounded-xl text-[11px] leading-relaxed flex items-start gap-2">
                <BookmarkCheck className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <span>
                  Terdapat <strong>{totalRaguCount} soal bertanda ragu-ragu</strong>. Pilihan Anda tetap akan dinilai.
                </span>
              </div>
            )}

            {tabViolations > 0 && (
              <div className="text-[11px] text-slate-500 font-mono">
                Catatan pengawas: Terdeteksi {tabViolations} kali perpindahan tab.
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setShowConfirmSubmitModal(false)}
                className="px-4 py-2.5 rounded-xl bg-slate-100 text-slate-700 font-semibold hover:bg-slate-200 transition"
              >
                Periksa Kembali
              </button>
              <button
                onClick={handleExecuteSubmit}
                className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-md shadow-blue-500/20 active:scale-95 transition"
              >
                Ya, Kumpulkan Ujian
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: RESET EXAM CONFIRMATION */}
      {showResetConfirmModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 max-w-md w-full shadow-2xl relative text-xs space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 text-amber-600">
              <RotateCcw className="w-6 h-6 shrink-0" />
              <div>
                <h3 className="font-bold text-base text-slate-900">Ulangi Ujian CBT dari Awal?</h3>
                <p className="text-[11px] text-slate-500 font-mono">
                  {bab.code} • 40 Butir Soal
                </p>
              </div>
            </div>

            <p className="text-slate-600 leading-relaxed">
              Seluruh draft lembar jawaban (20 soal standar dan 20 soal kompleks), tanda ragu-ragu, serta catatan waktu pengerjaan akan dikosongkan kembali ke awal.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setShowResetConfirmModal(false)}
                className="px-4 py-2.5 rounded-xl bg-slate-100 text-slate-700 font-semibold hover:bg-slate-200 transition"
              >
                Batal
              </button>
              <button
                onClick={handlePerformReset}
                className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold shadow-md shadow-amber-500/20 active:scale-95 transition"
              >
                Ya, Mulai Ulang
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
