import React, { useState } from 'react';
import { CurriculumBab, StandardMCQ, ComplexMCQ, EssayQuestion, QuestionType } from '../../types/curriculum';
import { Sparkles, X, PlusCircle, Check, AlertCircle, Copy, Download } from 'lucide-react';

interface AiQuestionGeneratorModalProps {
  bab: CurriculumBab;
  isOpen: boolean;
  onClose: () => void;
  onAddQuestion: (type: QuestionType, newQuestion: StandardMCQ | ComplexMCQ | EssayQuestion) => void;
}

export const AiQuestionGeneratorModal: React.FC<AiQuestionGeneratorModalProps> = ({
  bab,
  isOpen,
  onClose,
  onAddQuestion,
}) => {
  const [type, setType] = useState<QuestionType>('standard_mcq');
  const [difficulty, setDifficulty] = useState<string>('HOTS (Menengah ke Tinggi)');
  const [scenarioTopic, setScenarioTopic] = useState<string>('Kasus Troubleshooting Jaringan Industri');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [generatedResult, setGeneratedResult] = useState<any>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [addedSuccess, setAddedSuccess] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleGenerate = async () => {
    setIsGenerating(true);
    setErrorMessage(null);
    setGeneratedResult(null);
    setAddedSuccess(false);

    try {
      const res = await fetch('/api/ai/generate-question', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          babNumber: bab.id,
          babTitle: bab.title,
          type,
          difficulty,
          scenarioTopic,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `Error ${res.status}`);
      }

      const data = await res.json();
      setGeneratedResult(data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      setErrorMessage(`Gagal generate soal: ${msg}. Pastikan GEMINI_API_KEY aktif.`);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleApplyToQuestionBank = () => {
    if (!generatedResult) return;

    if (type === 'standard_mcq') {
      const newQ: StandardMCQ = {
        id: `mcq_ai_${Date.now()}`,
        number: bab.standardMCQs.length + 1,
        question: generatedResult.question,
        options: generatedResult.options,
        correctAnswer: generatedResult.correctAnswer,
        explanation: generatedResult.explanation,
        competency: generatedResult.competency || `Capaian Khusus ${bab.title}`,
        difficulty: 'HOTS',
      };
      onAddQuestion('standard_mcq', newQ);
    } else if (type === 'complex_mcq') {
      const newQ: ComplexMCQ = {
        id: `cpx_ai_${Date.now()}`,
        number: bab.complexMCQs.length + 1,
        question: generatedResult.question,
        options: generatedResult.options,
        correctAnswers: generatedResult.correctAnswers || ['A', 'C'],
        explanation: generatedResult.explanation,
        competency: generatedResult.competency || `Capaian Khusus ${bab.title}`,
        difficulty: 'HOTS',
      };
      onAddQuestion('complex_mcq', newQ);
    } else if (type === 'essay') {
      const newQ: EssayQuestion = {
        id: `essay_ai_${Date.now()}`,
        number: bab.essayQuestions.length + 1,
        title: `Studi Kasus AI: ${scenarioTopic}`,
        caseBackground: generatedResult.caseBackground || 'Skenario lapangan industri jaringan telekomunikasi.',
        question: generatedResult.question,
        subQuestions: generatedResult.subQuestions || [],
        modelAnswer: generatedResult.modelAnswer || 'Kunci jawaban teknis',
        rubric: generatedResult.rubric || {
          maxScore: 100,
          criteria: [
            { aspect: 'Pemahaman Konsep', score: 30, indicator: 'Menganalisis prinsip kerja dengan tepat' },
            { aspect: 'Metode Troubleshooting', score: 40, indicator: 'Langkah pengujian instrumen ukur sistematis' },
            { aspect: 'Solusi & K3LH', score: 30, indicator: 'Perbaikan permanen dan kepatuhan keselamatan kerja' },
          ],
        },
        competency: `Troubleshooting Lapangan ${bab.title}`,
      };
      onAddQuestion('essay', newQ);
    }

    setAddedSuccess(true);
    setTimeout(() => {
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full p-6 shadow-2xl relative animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-purple-600 to-indigo-600 text-white flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">AI Question Bank Generator (Kurikulum Merdeka)</h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Buat butir soal HOTS baru khusus untuk {bab.code}: {bab.title}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4 text-xs">
          <div>
            <label className="block text-slate-400 mb-1 font-semibold">Tipe Soal LKPD:</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as QuestionType)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white font-medium"
            >
              <option value="standard_mcq">Pilihan Ganda Standar (A-E)</option>
              <option value="complex_mcq">Pilihan Ganda Kompleks</option>
              <option value="essay">Esai Studi Kasus & Rubrik</option>
            </select>
          </div>

          <div>
            <label className="block text-slate-400 mb-1 font-semibold">Tingkat Kesulitan:</label>
            <select
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white font-medium"
            >
              <option value="HOTS (Tinggi - Analisis Masalah)">HOTS (Tinggi - Analisis)</option>
              <option value="Sedang (Aplikasi Lapangan)">Sedang (Aplikasi Lapangan)</option>
              <option value="Mudah (Konsep Dasar)">Mudah (Konsep Dasar)</option>
            </select>
          </div>

          <div>
            <label className="block text-slate-400 mb-1 font-semibold">Fokus Skenario / Kasus:</label>
            <input
              type="text"
              value={scenarioTopic}
              onChange={(e) => setScenarioTopic(e.target.value)}
              placeholder="Misal: Degradasi Kecepatan..."
              className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white font-medium"
            />
          </div>
        </div>

        <button
          onClick={handleGenerate}
          disabled={isGenerating}
          className="w-full py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:opacity-50 text-white font-bold text-xs shadow-lg shadow-purple-500/20 transition flex items-center justify-center gap-2 mb-4"
        >
          <Sparkles className={`w-4 h-4 ${isGenerating ? 'animate-spin' : ''}`} />
          {isGenerating ? 'AI Sedang Menulis Soal & Rubrik...' : 'Hasilkan Butir Soal Baru (Generate)'}
        </button>

        {errorMessage && (
          <div className="p-3 mb-4 rounded-lg bg-red-950/50 border border-red-500/40 text-red-200 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Generated Result Preview */}
        {generatedResult && (
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-xs space-y-3 max-h-80 overflow-y-auto">
            <div className="font-bold text-white text-sm">Pratinjau Butir Soal yang Dihasilkan:</div>

            <div className="text-slate-200 font-medium leading-relaxed bg-slate-900 p-3 rounded-lg border border-slate-800">
              {generatedResult.question}
            </div>

            {generatedResult.options && (
              <div className="space-y-1.5 pl-2">
                {generatedResult.options.map((opt: any) => (
                  <div key={opt.id} className="text-slate-300">
                    <strong className="text-blue-400">{opt.id}.</strong> {opt.text}
                  </div>
                ))}
              </div>
            )}

            <div className="p-2.5 bg-emerald-950/30 rounded border border-emerald-500/30 text-emerald-200">
              <strong>Kunci Jawaban:</strong>{' '}
              {generatedResult.correctAnswer ||
                (generatedResult.correctAnswers ? generatedResult.correctAnswers.join(', ') : 'Model Answer')}
            </div>

            {generatedResult.explanation && (
              <div className="text-slate-400 text-[11px] leading-relaxed">
                <strong>Pembahasan:</strong> {generatedResult.explanation}
              </div>
            )}

            {/* Action Bar */}
            <div className="pt-2 flex items-center justify-end gap-2">
              <button
                onClick={handleApplyToQuestionBank}
                disabled={addedSuccess}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow transition"
              >
                {addedSuccess ? (
                  <>
                    <Check className="w-4 h-4" />
                    Berhasil Ditambahkan ke Bank Soal!
                  </>
                ) : (
                  <>
                    <PlusCircle className="w-4 h-4" />
                    Tambahkan ke LKPD {bab.code}
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
