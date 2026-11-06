import React, { useState, useEffect } from 'react';
import {
  CurriculumBab,
  EssayQuestion,
  UserRole,
  EssaySubmission,
  StudentProfile,
  RombelAssignment,
} from '../../types/curriculum';
import {
  FileText,
  Sparkles,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Bot,
  BookOpen,
  Send,
  ShieldCheck,
  AlertCircle,
  HelpCircle,
  Clock,
  Lock,
} from 'lucide-react';
import { RombelAccessLockedNotice } from '../curriculum/RombelAccessLockedNotice';
import { isSectionAccessibleForStudent, getAssignmentForStudent } from '../../data/rombelAssignments';
import { saveEssayLogToFirestore } from '../../lib/firebase';

interface QualitativeEvaluationProps {
  bab: CurriculumBab;
  userRole: UserRole;
  activeStudent?: StudentProfile | null;
  onSaveEssay?: (submission: EssaySubmission) => void;
  rombelAssignments?: Record<string, RombelAssignment>;
  allBabs?: CurriculumBab[];
  onSelectBab?: (bab: CurriculumBab) => void;
}

export const QualitativeEvaluation: React.FC<QualitativeEvaluationProps> = ({
  bab,
  userRole,
  activeStudent,
  onSaveEssay,
  rombelAssignments = {},
  allBabs = [],
  onSelectBab,
}) => {
  const [studentAnswers, setStudentAnswers] = useState<Record<string, string>>({});
  const [expandedId, setExpandedId] = useState<string>(bab.essayQuestions[0]?.id || '');
  const [gradingResults, setGradingResults] = useState<
    Record<
      string,
      {
        score: number;
        letterGrade: string;
        summaryFeedback: string;
        strengths: string[];
        improvements: string[];
        idealSolution: string;
      }
    >
  >({});
  const [evaluatingId, setEvaluatingId] = useState<string | null>(null);
  const [isBatchEvaluating, setIsBatchEvaluating] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [syncStatusMap, setSyncStatusMap] = useState<Record<string, string>>({});

  // Load cached essay answers from localStorage
  useEffect(() => {
    try {
      const studentPrefix = activeStudent?.id ? `${activeStudent.id}_` : '';
      const saved = localStorage.getItem(`tjkn_essays_${studentPrefix}bab_${bab.id}`);
      if (saved) {
        setStudentAnswers(JSON.parse(saved));
      }
    } catch (e) {
      console.warn('Failed to load saved essays', e);
    }
  }, [bab.id, activeStudent?.id]);

  // Check Rombel permission
  const accessCheck = isSectionAccessibleForStudent(activeStudent || null, bab.id, 'qualitative', rombelAssignments);
  const rombelAssignment = getAssignmentForStudent(activeStudent || null, rombelAssignments);

  if (userRole !== 'guru' && !accessCheck.allowed) {
    return (
      <RombelAccessLockedNotice
        student={activeStudent || null}
        bab={bab}
        sectionName="Evaluasi Kualitatif (10 Soal Analisis Esai)"
        rombelAssignment={rombelAssignment}
        allBabs={allBabs}
        onSelectBab={onSelectBab || (() => {})}
      />
    );
  }

  const handleAnswerChange = (qId: string, val: string) => {
    const next = { ...studentAnswers, [qId]: val };
    setStudentAnswers(next);
    try {
      const studentPrefix = activeStudent?.id ? `${activeStudent.id}_` : '';
      localStorage.setItem(`tjkn_essays_${studentPrefix}bab_${bab.id}`, JSON.stringify(next));
    } catch (e) {
      // ignore
    }
  };

  const handleAiGradeAndSync = async (question: EssayQuestion) => {
    const answer = studentAnswers[question.id];
    if (!answer || answer.trim().length < 15) {
      setErrorMessage('Jawaban esai terlalu pendek. Harap tuliskan analisis troubleshooting minimal 2-3 kalimat.');
      return;
    }

    setErrorMessage(null);
    setEvaluatingId(question.id);

    try {
      const res = await fetch('/api/ai/evaluate-essay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          babNumber: bab.id,
          babTitle: bab.title,
          questionText: `${question.title}\n${question.caseBackground}\n${question.question}`,
          studentAnswer: answer,
          rubric: JSON.stringify(question.rubric),
          keyPoints: question.modelAnswer,
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `Server error (${res.status})`);
      }

      const data = await res.json();
      setGradingResults((prev) => ({ ...prev, [question.id]: data }));

      if (onSaveEssay) {
        onSaveEssay({
          babId: bab.id,
          questionId: question.id,
          studentAnswer: answer,
          submittedAt: new Date().toISOString(),
          aiGrading: data,
        });
      }

      // Forward to Google Apps Script Essay Endpoint
      if (activeStudent) {
        setSyncStatusMap((prev) => ({ ...prev, [question.id]: 'Mengirim ke spreadsheet guru...' }));
        try {
          const words = answer.trim().split(/\s+/).length;
          const gasRes = await fetch('/api/essay-log', {
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
              questionId: question.id,
              questionNumber: question.number,
              questionTitle: question.title,
              studentAnswer: answer,
              wordCount: words,
              score: data.score,
              letterGrade: data.letterGrade,
              feedback: data.summaryFeedback,
              timestamp: new Date().toISOString(),
            }),
          });
          const gasData = await gasRes.json();
          // Save directly to Firebase Firestore
          saveEssayLogToFirestore({
            id: `essay_${activeStudent.id}_${bab.id}_${question.id}`,
            studentId: activeStudent.id,
            studentName: activeStudent.name,
            noAbsen: activeStudent.noAbsen,
            className: activeStudent.className,
            school: activeStudent.school,
            babId: bab.id,
            babCode: bab.code,
            babTitle: bab.title,
            questionId: question.id,
            questionNumber: question.number,
            questionTitle: question.title,
            studentAnswer: answer,
            wordCount: words,
            score: data.score,
            letterGrade: data.letterGrade,
            timestamp: new Date().toISOString(),
          });

          if (gasRes.ok && gasData.success) {
            setSyncStatusMap((prev) => ({ ...prev, [question.id]: '✓ Tersimpan di Firebase Cloud & Spreadsheet Guru' }));
          } else {
            setSyncStatusMap((prev) => ({ ...prev, [question.id]: '✓ Tersimpan di Firebase Cloud' }));
          }
        } catch {
          setSyncStatusMap((prev) => ({ ...prev, [question.id]: 'Tersimpan lokal & Cloud' }));
        }
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      setErrorMessage(`Gagal melakukan penilaian: ${msg}`);
    } finally {
      setEvaluatingId(null);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header Qualitative Banner - Bright Minimalist */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-full font-mono">
                LKPD Bagian 3
              </span>
              <h3 className="text-lg font-bold text-slate-900">
                Evaluasi Kualitatif (10 Soal Analisis Masalah & Esai)
              </h3>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              {activeStudent ? (
                <span>
                  Siswa: <strong className="text-slate-800">{activeStudent.noAbsen} {activeStudent.name}</strong> ({activeStudent.className} • {activeStudent.school}) • Analisis Kasus Lapangan
                </span>
              ) : (
                'Soal pemecahan masalah teknis nyata dan troubleshooting terstruktur (HOTS).'
              )}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-mono px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-600">
              {Object.keys(studentAnswers).filter((k) => studentAnswers[k]?.trim()).length} / 10 Soal Terisi
            </span>
            <button
              type="button"
              disabled={
                isBatchEvaluating ||
                Object.keys(studentAnswers).filter((k) => (studentAnswers[k]?.trim().length || 0) >= 15).length === 0
              }
              onClick={async () => {
                const filledQuestions = bab.essayQuestions.filter(
                  (q) => (studentAnswers[q.id]?.trim().length || 0) >= 15
                );
                if (filledQuestions.length === 0) {
                  setErrorMessage('Isi minimal 1 soal esai (min. 15 karakter) sebelum menilai dengan AI.');
                  return;
                }
                setIsBatchEvaluating(true);
                setErrorMessage(null);
                for (const q of filledQuestions) {
                  if (!gradingResults[q.id]) {
                    await handleAiGradeAndSync(q);
                  }
                }
                setIsBatchEvaluating(false);
              }}
              className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>
                {isBatchEvaluating
                  ? 'AI Sedang Menilai Semua...'
                  : 'Nilai Semua Esai (AI) & Kirim ke Leger'}
              </span>
            </button>
          </div>
        </div>

        {errorMessage && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}
      </div>

      {/* Accordion List of 10 Essay Questions */}
      <div className="space-y-4">
        {bab.essayQuestions.map((q) => {
          const isExpanded = expandedId === q.id;
          const answer = studentAnswers[q.id] || '';
          const wordCount = answer.trim() ? answer.trim().split(/\s+/).length : 0;
          const grade = gradingResults[q.id];
          const isEvaluating = evaluatingId === q.id;
          const syncStatus = syncStatusMap[q.id];

          return (
            <div
              key={q.id}
              className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden transition"
            >
              {/* Question Bar Header */}
              <button
                onClick={() => setExpandedId(isExpanded ? '' : q.id)}
                className="w-full p-4 sm:p-5 text-left flex items-center justify-between gap-4 hover:bg-slate-50 transition"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs font-mono shrink-0 ${
                      answer.trim()
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                        : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    {q.number}
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-slate-900 line-clamp-1">{q.title}</h4>
                    <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">{q.competency}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  {grade && (
                    <span className="px-2.5 py-0.5 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-bold font-mono">
                      Nilai: {grade.score} ({grade.letterGrade})
                    </span>
                  )}
                  {wordCount > 0 && !grade && (
                    <span className="text-[11px] font-mono text-slate-400 hidden sm:inline">
                      {wordCount} kata
                    </span>
                  )}
                  {isExpanded ? (
                    <ChevronUp className="w-4 h-4 text-slate-400" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-slate-400" />
                  )}
                </div>
              </button>

              {/* Accordion Body */}
              {isExpanded && (
                <div className="p-5 pt-0 space-y-4 border-t border-slate-100">
                  {/* Case Background Box */}
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs space-y-2 mt-4">
                    <div className="font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5 text-[11px]">
                      <BookOpen className="w-3.5 h-3.5 text-blue-600" />
                      <span>Skenario Masalah Lapangan / Bengkel:</span>
                    </div>
                    <p className="text-slate-700 leading-relaxed italic">
                      "{q.caseBackground}"
                    </p>
                  </div>

                  {/* Core Question & Sub-Questions */}
                  <div className="space-y-2">
                    <div className="text-xs sm:text-sm font-semibold text-slate-900 leading-relaxed">
                      {q.question}
                    </div>

                    {q.subQuestions && q.subQuestions.length > 0 && (
                      <ul className="space-y-1.5 pl-4 text-xs text-slate-700 list-disc">
                        {q.subQuestions.map((sub, idx) => (
                          <li key={idx} className="leading-relaxed">
                            {sub}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                  {/* Student Answer Textarea */}
                  <div>
                    <div className="flex items-center justify-between text-xs text-slate-500 mb-1.5">
                      <span className="font-semibold text-slate-700">Lembar Jawaban Analisis Siswa:</span>
                      <span className="font-mono text-[11px]">{wordCount} kata</span>
                    </div>

                    <textarea
                      rows={5}
                      value={answer}
                      onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                      placeholder="Tuliskan analisis permasalahan, langkah identifikasi, alat ukur yang digunakan, dan solusi teknis terstruktur..."
                      className="w-full p-3.5 rounded-xl bg-white border border-slate-300 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-2xs leading-relaxed"
                    />
                  </div>

                  {/* Submission and AI Asesor Trigger */}
                  <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                    <div className="text-xs text-slate-500">
                      {syncStatus && (
                        <span className="text-emerald-700 font-semibold flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span>{syncStatus}</span>
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleAiGradeAndSync(q)}
                        disabled={isEvaluating || !answer.trim()}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs transition shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Bot className="w-4 h-4" />
                        <span>{isEvaluating ? 'Menilai & Mengirim...' : 'Nilai & Kirim ke Spreadsheet'}</span>
                      </button>
                    </div>
                  </div>

                  {/* AI Feedback Card */}
                  {grade && (
                    <div className="p-4 rounded-xl bg-indigo-50/70 border border-indigo-200 text-xs space-y-3 mt-3 animate-in fade-in duration-200">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold text-xs">
                            {grade.letterGrade}
                          </span>
                          <div>
                            <span className="font-bold text-slate-900">Umpan Balik Asesor AI (Skor: {grade.score}/100)</span>
                            <div className="text-[11px] text-slate-500">Evaluasi berbasis rubrik SMK Pusat Keunggulan</div>
                          </div>
                        </div>
                      </div>

                      <p className="text-slate-700 leading-relaxed font-medium">
                        {grade.summaryFeedback}
                      </p>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                        <div className="bg-white/80 p-3 rounded-lg border border-emerald-200">
                          <span className="font-bold text-emerald-800 text-[11px] block mb-1">
                            ✓ Poin Kekuatan:
                          </span>
                          <ul className="list-disc pl-3 text-slate-700 space-y-0.5 text-[11px]">
                            {grade.strengths.map((s, idx) => (
                              <li key={idx}>{s}</li>
                            ))}
                          </ul>
                        </div>

                        <div className="bg-white/80 p-3 rounded-lg border border-amber-200">
                          <span className="font-bold text-amber-800 text-[11px] block mb-1">
                            ⚠ Saran Perbaikan:
                          </span>
                          <ul className="list-disc pl-3 text-slate-700 space-y-0.5 text-[11px]">
                            {grade.improvements.map((s, idx) => (
                              <li key={idx}>{s}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Teacher Rubric & Model Answer */}
                  {userRole === 'guru' && (
                    <div className="bg-amber-50/60 border border-amber-200 rounded-xl p-4 text-xs space-y-2 mt-2">
                      <div className="font-bold text-amber-900 flex items-center gap-1.5">
                        <HelpCircle className="w-3.5 h-3.5 text-amber-700" />
                        <span>Kunci Jawaban Guru & Model Solusi SOP Industri:</span>
                      </div>
                      <p className="text-slate-700 leading-relaxed">{q.modelAnswer}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
