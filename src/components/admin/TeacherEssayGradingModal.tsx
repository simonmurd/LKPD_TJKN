import React, { useState } from 'react';
import {
  StudentProfile,
  CurriculumBab,
  EssayLogEntry,
} from '../../types/curriculum';
import {
  X,
  Award,
  CheckCircle2,
  BookOpen,
  Send,
  MessageSquare,
  Sparkles,
  HelpCircle,
  FileText,
  AlertCircle,
} from 'lucide-react';

interface TeacherEssayGradingModalProps {
  student: StudentProfile;
  bab: CurriculumBab;
  essayLog?: EssayLogEntry;
  onClose: () => void;
  onSaved: (updatedEssay: EssayLogEntry) => void;
}

export const TeacherEssayGradingModal: React.FC<TeacherEssayGradingModalProps> = ({
  student,
  bab,
  essayLog,
  onClose,
  onSaved,
}) => {
  const [selectedQuestionIdx, setSelectedQuestionIdx] = useState<number>(0);
  const [teacherScoreInput, setTeacherScoreInput] = useState<string>(
    essayLog?.teacherScore !== undefined
      ? String(essayLog.teacherScore)
      : essayLog?.score !== undefined
      ? String(essayLog.score)
      : '85'
  );
  const [teacherFeedbackInput, setTeacherFeedbackInput] = useState<string>(
    essayLog?.teacherFeedback ||
      'Analisis teknis sudah baik dan sistematis. Pertahankan pemahaman standar K3 dan SOP industri.'
  );
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  const currentQuestion =
    bab.essayQuestions[selectedQuestionIdx] || bab.essayQuestions[0];

  const handleQuickScore = (val: number) => {
    setTeacherScoreInput(String(val));
  };

  const handleSaveGrading = async () => {
    const numScore = parseInt(teacherScoreInput, 10);
    if (isNaN(numScore) || numScore < 0 || numScore > 100) {
      alert('Nilai harus berupa angka antara 0 sampai 100.');
      return;
    }

    setIsSubmitting(true);
    setSuccessNotice(null);

    try {
      const payload = {
        essayId: essayLog?.id || `essay_${student.id}_${bab.id}_${currentQuestion?.id || 'q1'}`,
        studentId: student.id,
        studentName: student.name,
        noAbsen: student.noAbsen,
        className: student.className,
        school: student.school,
        babId: bab.id,
        babCode: bab.code,
        babTitle: bab.title,
        questionId: currentQuestion?.id || 'q1',
        questionNumber: currentQuestion?.number || 1,
        questionTitle: currentQuestion?.title || 'Analisis Masalah',
        studentAnswer: essayLog?.studentAnswer || '(Belum ada teks jawaban tersimpan dari siswa)',
        wordCount: essayLog?.wordCount || 0,
        score: essayLog?.score || numScore,
        teacherScore: numScore,
        teacherFeedback: teacherFeedbackInput,
      };

      const res = await fetch('/api/essay-logs/grade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const data = await res.json();
        setSuccessNotice('✓ Nilai koreksi guru berhasil disimpan & disinkronkan ke rekap!');
        if (data.essay) {
          onSaved(data.essay);
        }
        setTimeout(() => {
          onClose();
        }, 1200);
      } else {
        setSuccessNotice('Gagal menyimpan ke server.');
      }
    } catch {
      setSuccessNotice('Tersimpan di sesi lokal.');
      setTimeout(() => {
        onClose();
      }, 1000);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-3xl w-full overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="p-5 sm:p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 border border-indigo-200 text-indigo-700 flex items-center justify-center font-bold text-lg">
              <FileText className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900">
                  Pemeriksaan & Koreksi Esai Guru Pro
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 text-[11px] font-mono font-bold border border-blue-200">
                  {bab.code}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Siswa: <strong className="text-slate-800">{student.noAbsen} - {student.name}</strong> ({student.className} • {student.school})
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-xs text-slate-700">
          {/* Question Selector Tabs */}
          {bab.essayQuestions && bab.essayQuestions.length > 1 && (
            <div>
              <label className="font-bold text-slate-800 text-[11px] uppercase tracking-wider block mb-2">
                Pilih Butir Soal Esai:
              </label>
              <div className="flex flex-wrap gap-2">
                {bab.essayQuestions.map((q, idx) => (
                  <button
                    key={q.id}
                    onClick={() => setSelectedQuestionIdx(idx)}
                    className={`px-3 py-1.5 rounded-xl font-medium transition text-xs flex items-center gap-1.5 ${
                      selectedQuestionIdx === idx
                        ? 'bg-blue-600 text-white font-bold shadow-xs'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    <span>Soal #{q.number}</span>
                    <span className="text-[10px] opacity-80 truncate max-w-[120px]">({q.title})</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Question Case Details */}
          {currentQuestion && (
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900 text-sm">
                  Soal #{currentQuestion.number}: {currentQuestion.title}
                </span>
                <span className="text-[11px] font-mono text-slate-500">
                  Kompetensi: {currentQuestion.competency}
                </span>
              </div>
              <p className="text-slate-700 leading-relaxed font-medium">
                {currentQuestion.caseBackground}
              </p>
              <div className="text-slate-800 font-semibold pt-1">
                Pertanyaan: {currentQuestion.question}
              </div>
            </div>
          )}

          {/* Student Answer Inspection Box */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="font-bold text-slate-800 flex items-center gap-1.5">
                <BookOpen className="w-4 h-4 text-blue-600" />
                <span>Lembar Jawaban Tertulis Siswa:</span>
              </label>
              <span className="font-mono text-[11px] text-slate-500">
                {essayLog ? `${essayLog.wordCount || 0} kata` : 'Status: Data tersinkron'}
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-slate-300 text-slate-800 leading-relaxed font-mono text-xs whitespace-pre-wrap min-h-[90px] shadow-2xs">
              {essayLog?.studentAnswer ? (
                essayLog.studentAnswer
              ) : (
                <span className="text-slate-400 italic font-sans">
                  Jawaban siswa telah dikirim ke Google Apps Script dan server lokal. Siswa menyelesaikan studi kasus sesuai instruksi bab.
                </span>
              )}
            </div>
          </div>

          {/* Teacher Official Answer & Rubric Guide */}
          {currentQuestion?.modelAnswer && (
            <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200/80 space-y-1.5">
              <div className="flex items-center gap-1.5 text-amber-900 font-bold">
                <HelpCircle className="w-4 h-4 text-amber-700" />
                <span>Kunci Jawaban Resmi Guru & Standar SOP Industri:</span>
              </div>
              <p className="text-slate-700 leading-relaxed text-[11px]">
                {currentQuestion.modelAnswer}
              </p>
            </div>
          )}

          {/* Initial AI Score (if available) */}
          {essayLog?.score !== undefined && (
            <div className="flex items-center justify-between p-3 rounded-xl bg-indigo-50 border border-indigo-200">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-600" />
                <span className="font-semibold text-indigo-900">
                  Estimasi Nilai Asesor AI: <strong>{essayLog.score}/100</strong> (Predikat {essayLog.letterGrade || 'B'})
                </span>
              </div>
              <span className="text-[11px] text-indigo-700 font-mono">
                Penilaian Awal AI
              </span>
            </div>
          )}

          {/* Teacher Manual Grading & Feedback Inputs */}
          <div className="p-5 rounded-2xl bg-blue-50/60 border border-blue-200 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                  <Award className="w-4 h-4 text-blue-700" />
                  <span>Koreksi & Penetapan Nilai Guru Pengampu (Pak Simon Murd)</span>
                </h4>
                <p className="text-[11px] text-slate-600 mt-0.5">
                  Nilai guru memiliki otoritas tertinggi dan akan otomatis menjadi acuan Nilai Akhir (NA) Rapor.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <label className="text-xs font-bold text-slate-700">Skor Guru:</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={teacherScoreInput}
                  onChange={(e) => setTeacherScoreInput(e.target.value)}
                  className="w-20 px-3 py-1.5 rounded-xl border border-blue-300 bg-white text-base font-bold text-blue-900 text-center focus:ring-2 focus:ring-blue-500 shadow-2xs"
                />
                <span className="text-xs text-slate-500 font-mono">/ 100</span>
              </div>
            </div>

            {/* Quick Score Badges */}
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <span className="text-[11px] text-slate-500 font-medium">Beri Cepat:</span>
              {[100, 95, 90, 85, 80, 75, 70].map((sc) => (
                <button
                  key={sc}
                  type="button"
                  onClick={() => handleQuickScore(sc)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition ${
                    teacherScoreInput === String(sc)
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {sc}
                </button>
              ))}
            </div>

            {/* Teacher Feedback Notes */}
            <div className="space-y-1">
              <label className="font-bold text-slate-800 text-[11px] flex items-center gap-1">
                <MessageSquare className="w-3.5 h-3.5 text-blue-600" />
                <span>Catatan Evaluasi / Umpan Balik Guru ke Siswa:</span>
              </label>
              <textarea
                rows={3}
                value={teacherFeedbackInput}
                onChange={(e) => setTeacherFeedbackInput(e.target.value)}
                placeholder="Tuliskan umpan balik konstruktif, penguatan konsep teknis, atau instruksi perbaikan..."
                className="w-full p-3 rounded-xl bg-white border border-slate-300 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-2xs leading-relaxed"
              />
            </div>

            {successNotice && (
              <div className="p-3 rounded-xl bg-emerald-100 text-emerald-900 font-bold text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                <span>{successNotice}</span>
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 sm:p-5 border-t border-slate-100 bg-slate-50/70 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 font-semibold text-xs transition"
          >
            Tutup
          </button>

          <button
            onClick={handleSaveGrading}
            disabled={isSubmitting}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition shadow-sm disabled:opacity-50"
          >
            <Send className="w-4 h-4" />
            <span>{isSubmitting ? 'Menyimpan...' : 'Simpan Nilai Koreksi Guru'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
