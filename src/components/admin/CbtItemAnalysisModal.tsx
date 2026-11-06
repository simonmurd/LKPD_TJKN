import React, { useState } from 'react';
import { CurriculumBab, StandardMCQ, ComplexMCQ } from '../../types/curriculum';
import {
  X,
  FileQuestion,
  HelpCircle,
  Filter,
  Search,
  CheckCircle2,
  Award,
  Layers,
  ChevronDown,
  ChevronUp,
  BookOpen,
  Sparkles,
} from 'lucide-react';

interface CbtItemAnalysisModalProps {
  babs: CurriculumBab[];
  selectedBabId: number;
  onClose: () => void;
}

export const CbtItemAnalysisModal: React.FC<CbtItemAnalysisModalProps> = ({
  babs,
  selectedBabId,
  onClose,
}) => {
  const [currentBabId, setCurrentBabId] = useState<number>(selectedBabId);
  const [filterDifficulty, setFilterDifficulty] = useState<'all' | 'Mudah' | 'Sedang' | 'HOTS'>('all');
  const [filterType, setFilterType] = useState<'all' | 'standard' | 'complex'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [expandedQuestionId, setExpandedQuestionId] = useState<string | null>(null);

  const activeBab = babs.find((b) => b.id === currentBabId) || babs[0];

  const standardItems = (activeBab?.standardMCQs || []).map((q, idx) => ({
    ...q,
    itemCategory: 'standard' as const,
    globalNo: idx + 1,
  }));

  const complexItems = (activeBab?.complexMCQs || []).map((q, idx) => ({
    ...q,
    itemCategory: 'complex' as const,
    globalNo: 20 + idx + 1,
  }));

  const allItems = [...standardItems, ...complexItems];

  const filteredItems = allItems.filter((item) => {
    const q = searchQuery.toLowerCase();
    const matchSearch =
      !q ||
      item.question.toLowerCase().includes(q) ||
      item.explanation.toLowerCase().includes(q) ||
      item.competency.toLowerCase().includes(q);

    const matchDifficulty =
      filterDifficulty === 'all' || item.difficulty === filterDifficulty;

    const matchType =
      filterType === 'all' || item.itemCategory === filterType;

    return matchSearch && matchDifficulty && matchType;
  });

  const hotsCount = allItems.filter((i) => i.difficulty === 'HOTS').length;
  const sedangCount = allItems.filter((i) => i.difficulty === 'Sedang').length;
  const mudahCount = allItems.filter((i) => i.difficulty === 'Mudah').length;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-4xl w-full overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-50 border border-amber-200 text-amber-700 flex items-center justify-center font-bold">
              <FileQuestion className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900">
                  Analisis Butir Soal & Kisi-Kisi Lengkap CBT Guru
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 text-xs font-mono font-bold border border-amber-300">
                  40 Butir Soal Terstandar
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Bank Soal, Kunci Jawaban Lengkap, Tingkat Kesukaran & Pembahasan Teknis SMK Fase F
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

        {/* Toolbar & Filter Bar */}
        <div className="p-4 sm:p-6 border-b border-slate-100 bg-white space-y-4">
          {/* Select Bab Dropdown */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <label className="text-xs font-bold text-slate-700">Pilih Modul Bab:</label>
              <select
                value={currentBabId}
                onChange={(e) => setCurrentBabId(Number(e.target.value))}
                className="px-3 py-1.5 rounded-xl border border-slate-300 bg-slate-50 text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-blue-500"
              >
                {babs.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.code}: {b.title}
                  </option>
                ))}
              </select>
            </div>

            {/* Cognitive Distribution Metrics */}
            <div className="flex items-center gap-2 text-xs font-mono">
              <span className="px-2.5 py-1 rounded-lg bg-red-50 text-red-700 border border-red-200 font-bold">
                HOTS (C4-C5): {hotsCount}
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-amber-50 text-amber-700 border border-amber-200 font-bold">
                Sedang (C3): {sedangCount}
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold">
                Mudah (C1-C2): {mudahCount}
              </span>
            </div>
          </div>

          {/* Search & Sub-Filters */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari teks soal / pembahasan..."
                className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-slate-300 bg-slate-50 text-xs focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500">Tingkat:</span>
              <select
                value={filterDifficulty}
                onChange={(e) => setFilterDifficulty(e.target.value as any)}
                className="w-full px-3 py-1.5 rounded-xl border border-slate-300 bg-slate-50 text-xs font-medium text-slate-800"
              >
                <option value="all">Semua Tingkat Kesukaran</option>
                <option value="HOTS">Khusus Soal HOTS</option>
                <option value="Sedang">Khusus Soal Sedang</option>
                <option value="Mudah">Khusus Soal Mudah</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500">Tipe:</span>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value as any)}
                className="w-full px-3 py-1.5 rounded-xl border border-slate-300 bg-slate-50 text-xs font-medium text-slate-800"
              >
                <option value="all">Semua Tipe (40 Soal)</option>
                <option value="standard">Pilihan Ganda Biasa (1-20)</option>
                <option value="complex">Pilihan Ganda Kompleks (21-40)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Question List */}
        <div className="p-6 overflow-y-auto space-y-4 text-xs">
          {filteredItems.length === 0 ? (
            <div className="p-8 text-center text-slate-400">
              Tidak ada butir soal yang sesuai dengan pencarian atau filter.
            </div>
          ) : (
            filteredItems.map((item) => {
              const isExpanded = expandedQuestionId === item.id;
              const isStandard = item.itemCategory === 'standard';
              const correctLabel = isStandard
                ? (item as StandardMCQ).correctAnswer
                : (item as ComplexMCQ).correctAnswers.join(', ');

              return (
                <div
                  key={item.id}
                  className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-2xs hover:border-slate-300 transition"
                >
                  <div
                    onClick={() =>
                      setExpandedQuestionId(isExpanded ? null : item.id)
                    }
                    className="p-4 flex items-center justify-between cursor-pointer hover:bg-slate-50/60 gap-4"
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
                          item.difficulty === 'HOTS'
                            ? 'bg-red-50 text-red-700 border border-red-200'
                            : item.difficulty === 'Sedang'
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        }`}
                      >
                        #{item.globalNo}
                      </div>

                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-mono text-[11px] font-bold text-slate-700">
                            {isStandard ? 'Pilihan Ganda Biasa' : 'Pilihan Ganda Kompleks'}
                          </span>
                          <span
                            className={`px-2 py-0.2 rounded-full text-[10px] font-bold ${
                              item.difficulty === 'HOTS'
                                ? 'bg-red-100 text-red-800'
                                : item.difficulty === 'Sedang'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-emerald-100 text-emerald-800'
                            }`}
                          >
                            {item.difficulty}
                          </span>
                          <span className="text-slate-400 text-[11px]">•</span>
                          <span className="text-slate-500 text-[11px] font-mono">
                            Kunci: <strong className="text-emerald-700">{correctLabel}</strong>
                          </span>
                        </div>

                        <p className="text-slate-900 font-semibold leading-relaxed line-clamp-2">
                          {item.question}
                        </p>
                      </div>
                    </div>

                    <div className="text-slate-400 hover:text-slate-700 shrink-0">
                      {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                    </div>
                  </div>

                  {/* Expanded View: Options & Discussion */}
                  {isExpanded && (
                    <div className="p-4 border-t border-slate-100 bg-slate-50/50 space-y-3">
                      {/* Options */}
                      <div className="space-y-1.5 pl-2">
                        {item.options.map((opt) => {
                          const isCorrect = isStandard
                            ? (item as StandardMCQ).correctAnswer === opt.id
                            : (item as ComplexMCQ).correctAnswers.includes(opt.id);

                          return (
                            <div
                              key={opt.id}
                              className={`p-2.5 rounded-xl border flex items-start gap-2.5 ${
                                isCorrect
                                  ? 'bg-emerald-50/90 border-emerald-300 text-emerald-950 font-semibold'
                                  : 'bg-white border-slate-200 text-slate-700'
                              }`}
                            >
                              <span
                                className={`w-5 h-5 rounded-lg flex items-center justify-center font-bold text-[11px] shrink-0 ${
                                  isCorrect
                                    ? 'bg-emerald-600 text-white'
                                    : 'bg-slate-100 text-slate-600'
                                }`}
                              >
                                {opt.id}
                              </span>
                              <span className="leading-relaxed">{opt.text}</span>
                              {isCorrect && (
                                <span className="ml-auto text-[10px] font-mono text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full font-bold">
                                  KUNCI RESMI
                                </span>
                              )}
                            </div>
                          );
                        })}
                      </div>

                      {/* Technical Discussion & Industry Standard */}
                      <div className="p-3.5 rounded-2xl bg-amber-50/80 border border-amber-200/90 space-y-1">
                        <div className="flex items-center gap-1.5 font-bold text-amber-900 text-xs">
                          <HelpCircle className="w-4 h-4 text-amber-700" />
                          <span>Pembahasan Teknis Guru & Standar Industri:</span>
                        </div>
                        <p className="text-slate-700 leading-relaxed text-xs">
                          {item.explanation}
                        </p>
                        <div className="text-[10px] text-slate-500 font-mono pt-1">
                          Elemen Capaian Pembelajaran: {item.competency}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-5 border-t border-slate-100 bg-slate-50/70 flex items-center justify-between">
          <div className="text-xs text-slate-500">
            Menampilkan <strong>{filteredItems.length}</strong> dari 40 butir soal • Bab: {activeBab.code}
          </div>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition shadow-xs"
          >
            Tutup Kisi-Kisi
          </button>
        </div>
      </div>
    </div>
  );
};
