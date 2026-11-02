import React, { useState } from 'react';
import { CurriculumBab, RombelAssignment } from '../../types/curriculum';
import {
  ALL_ROMBEL_LIST,
  getRombelKey,
  saveRombelAssignments,
} from '../../data/rombelAssignments';
import {
  ShieldCheck,
  CheckCircle2,
  Lock,
  Unlock,
  BookOpen,
  Layers,
  Save,
  RotateCcw,
  Sparkles,
  School,
  Users,
  CheckSquare,
  Square,
  Info,
} from 'lucide-react';

interface RombelAssignmentManagerProps {
  assignments: Record<string, RombelAssignment>;
  onUpdateAssignments: (next: Record<string, RombelAssignment>) => void;
  babs: CurriculumBab[];
}

export const RombelAssignmentManager: React.FC<RombelAssignmentManagerProps> = ({
  assignments,
  onUpdateAssignments,
  babs,
}) => {
  const [selectedRombelKey, setSelectedRombelKey] = useState<string>(
    ALL_ROMBEL_LIST[0] ? getRombelKey(ALL_ROMBEL_LIST[0].school, ALL_ROMBEL_LIST[0].className) : ''
  );
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);

  const activeRombelObj = ALL_ROMBEL_LIST.find(
    (r) => getRombelKey(r.school, r.className) === selectedRombelKey
  ) || ALL_ROMBEL_LIST[0];

  const currentAssignment: RombelAssignment = assignments[selectedRombelKey] || {
    rombelKey: selectedRombelKey,
    school: activeRombelObj?.school || 'SMK NEGERI 1 SINGKAWANG',
    className: activeRombelObj?.className || 'X TJK',
    allowedBabs: [1, 2],
    allowedSections: {
      overview: true,
      simulations: true,
      objective: true,
      qualitative: true,
    },
    notes: 'Penugasan aktif untuk rombel ini.',
    updatedAt: new Date().toISOString(),
  };

  const updateCurrentAssignment = (patch: Partial<RombelAssignment>) => {
    const updated: RombelAssignment = {
      ...currentAssignment,
      ...patch,
      updatedAt: new Date().toISOString(),
    };
    const nextMap = { ...assignments, [selectedRombelKey]: updated };
    onUpdateAssignments(nextMap);
    saveRombelAssignments(nextMap);
  };

  const handleToggleBab = (babId: number) => {
    const currentList = currentAssignment.allowedBabs || [];
    const nextList = currentList.includes(babId)
      ? currentList.filter((id) => id !== babId)
      : [...currentList, babId].sort((a, b) => a - b);
    updateCurrentAssignment({ allowedBabs: nextList });
  };

  const handleToggleSection = (section: keyof RombelAssignment['allowedSections']) => {
    const nextSections = {
      ...currentAssignment.allowedSections,
      [section]: !currentAssignment.allowedSections[section],
    };
    updateCurrentAssignment({ allowedSections: nextSections });
  };

  // Presets
  const handleSelectAllBabs = () => {
    updateCurrentAssignment({ allowedBabs: babs.map((b) => b.id) });
  };

  const handleClearAllBabs = () => {
    updateCurrentAssignment({ allowedBabs: [] });
  };

  const handleSetBabRange = (start: number, end: number) => {
    const ids = babs.filter((b) => b.id >= start && b.id <= end).map((b) => b.id);
    updateCurrentAssignment({ allowedBabs: ids });
  };

  const handleApplyToAllRombels = () => {
    if (window.confirm(`Terapkan penugasan ini (Bab ${currentAssignment.allowedBabs.join(', ') || 'kosong'}) ke SELURUH rombel di SMK Negeri 1 & SMK Mudita?`)) {
      const nextMap: Record<string, RombelAssignment> = {};
      ALL_ROMBEL_LIST.forEach((r) => {
        const key = getRombelKey(r.school, r.className);
        nextMap[key] = {
          ...currentAssignment,
          rombelKey: key,
          school: r.school,
          className: r.className,
          updatedAt: new Date().toISOString(),
        };
      });
      onUpdateAssignments(nextMap);
      saveRombelAssignments(nextMap);
      setSaveSuccessMsg('Pengaturan penugasan berhasil diterapkan ke seluruh rombel!');
      setTimeout(() => setSaveSuccessMsg(null), 3500);
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 text-xs font-semibold">
              Fitur Guru Simon Murd
            </span>
            <h3 className="text-lg font-bold text-slate-900">
              Matriks Penugasan Latihan Per Rombel
            </h3>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Atur bab dan bagian LKPD yang dapat dibuka oleh siswa berdasarkan rombongan belajar (kelas). Siswa di luar penugasan akan terkunci otomatis.
          </p>
        </div>

        {saveSuccessMsg && (
          <div className="px-3.5 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{saveSuccessMsg}</span>
          </div>
        )}
      </div>

      {/* Rombel Selector Pills */}
      <div>
        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2.5">
          1. Pilih Rombongan Belajar (Rombel):
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {ALL_ROMBEL_LIST.map((rombel) => {
            const key = getRombelKey(rombel.school, rombel.className);
            const isSelected = selectedRombelKey === key;
            const assign = assignments[key];
            const babCount = assign?.allowedBabs?.length || 0;

            return (
              <button
                key={key}
                onClick={() => setSelectedRombelKey(key)}
                className={`p-3 rounded-xl border text-left transition relative ${
                  isSelected
                    ? 'bg-blue-50/80 border-blue-500 ring-2 ring-blue-500/20 text-slate-900 shadow-xs'
                    : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700'
                }`}
              >
                <div className="font-bold text-xs truncate">{rombel.className}</div>
                <div className="text-[10px] text-slate-500 truncate mt-0.5">{rombel.school}</div>
                <div className="mt-2 flex items-center gap-1.5 text-[11px] font-mono">
                  <span
                    className={`inline-block w-2 h-2 rounded-full ${
                      babCount > 0 ? 'bg-emerald-500' : 'bg-slate-300'
                    }`}
                  />
                  <span className="text-slate-600 font-medium">
                    {babCount > 0 ? `${babCount} Bab Aktif` : 'Terkunci'}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Assignment Detail Panel for Active Rombel */}
      <div className="bg-slate-50/70 border border-slate-200 rounded-2xl p-5 space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-xs shadow-xs">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <h4 className="font-bold text-sm text-slate-900">
                Konfigurasi untuk {activeRombelObj.className} ({activeRombelObj.school})
              </h4>
              <p className="text-[11px] text-slate-500">
                Terakhir disimpan: {new Date(currentAssignment.updatedAt || Date.now()).toLocaleTimeString('id-ID')}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleApplyToAllRombels}
              className="px-3 py-1.5 rounded-lg bg-white border border-slate-300 hover:bg-slate-100 text-xs font-semibold text-slate-700 transition flex items-center gap-1.5 shadow-2xs"
              title="Salin pengaturan ini ke semua rombel sekaligus"
            >
              <Sparkles className="w-3.5 h-3.5 text-blue-600" />
              <span>Terapkan ke Semua Rombel</span>
            </button>
          </div>
        </div>

        {/* Section Toggles */}
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
            2. Bagian LKPD yang Diizinkan Dibuka:
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Bagian 1: Simulasi */}
            <div
              onClick={() => handleToggleSection('simulations')}
              className={`p-3.5 rounded-xl border cursor-pointer transition flex items-start gap-3 ${
                currentAssignment.allowedSections.simulations
                  ? 'bg-white border-blue-300 ring-1 ring-blue-300 text-slate-900 shadow-2xs'
                  : 'bg-slate-100 border-slate-200 text-slate-400 opacity-75'
              }`}
            >
              <div className="mt-0.5">
                {currentAssignment.allowedSections.simulations ? (
                  <CheckSquare className="w-4 h-4 text-blue-600" />
                ) : (
                  <Square className="w-4 h-4 text-slate-400" />
                )}
              </div>
              <div>
                <div className="font-bold text-xs text-slate-900">Bagian 1: Praktikum Simulasi</div>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  Crimping, LAN Tester, Nirkabel, Splicer, dsb.
                </div>
              </div>
            </div>

            {/* Bagian 2: Objective (40 Soal CBT) */}
            <div
              onClick={() => handleToggleSection('objective')}
              className={`p-3.5 rounded-xl border cursor-pointer transition flex items-start gap-3 ${
                currentAssignment.allowedSections.objective
                  ? 'bg-white border-blue-300 ring-1 ring-blue-300 text-slate-900 shadow-2xs'
                  : 'bg-slate-100 border-slate-200 text-slate-400 opacity-75'
              }`}
            >
              <div className="mt-0.5">
                {currentAssignment.allowedSections.objective ? (
                  <CheckSquare className="w-4 h-4 text-blue-600" />
                ) : (
                  <Square className="w-4 h-4 text-slate-400" />
                )}
              </div>
              <div>
                <div className="font-bold text-xs text-slate-900">Bagian 2: Pilihan Ganda (CBT)</div>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  20 Soal Standar + 20 Soal Kompleks (KKM 75)
                </div>
              </div>
            </div>

            {/* Bagian 3: Qualitative (10 Soal Esai) */}
            <div
              onClick={() => handleToggleSection('qualitative')}
              className={`p-3.5 rounded-xl border cursor-pointer transition flex items-start gap-3 ${
                currentAssignment.allowedSections.qualitative
                  ? 'bg-white border-blue-300 ring-1 ring-blue-300 text-slate-900 shadow-2xs'
                  : 'bg-slate-100 border-slate-200 text-slate-400 opacity-75'
              }`}
            >
              <div className="mt-0.5">
                {currentAssignment.allowedSections.qualitative ? (
                  <CheckSquare className="w-4 h-4 text-blue-600" />
                ) : (
                  <Square className="w-4 h-4 text-slate-400" />
                )}
              </div>
              <div>
                <div className="font-bold text-xs text-slate-900">Bagian 3: Analisis Esai</div>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  10 Soal HOTS Pemecahan Kasus Jaringan
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bab Checkbox Matrix */}
        <div>
          <div className="flex flex-wrap items-center justify-between gap-2 mb-2.5">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              3. Daftar Bab yang Ditugaskan (Centang Bab yang Dibuka):
            </label>
            {/* Quick Presets */}
            <div className="flex flex-wrap items-center gap-1.5 text-xs">
              <button
                onClick={handleSelectAllBabs}
                className="px-2.5 py-1 rounded-md bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 font-medium transition"
              >
                Buka Semua (1-14)
              </button>
              <button
                onClick={() => handleSetBabRange(1, 3)}
                className="px-2.5 py-1 rounded-md bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 font-medium transition"
              >
                Bab 1-3
              </button>
              <button
                onClick={() => handleSetBabRange(4, 7)}
                className="px-2.5 py-1 rounded-md bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 font-medium transition"
              >
                Bab 4-7
              </button>
              <button
                onClick={() => handleSetBabRange(8, 14)}
                className="px-2.5 py-1 rounded-md bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 font-medium transition"
              >
                Bab 8-14
              </button>
              <button
                onClick={handleClearAllBabs}
                className="px-2.5 py-1 rounded-md bg-white border border-red-200 text-red-600 hover:bg-red-50 font-medium transition"
              >
                Kunci Semua
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
            {babs.map((bab) => {
              const isChecked = currentAssignment.allowedBabs.includes(bab.id);
              return (
                <div
                  key={bab.id}
                  onClick={() => handleToggleBab(bab.id)}
                  className={`p-3 rounded-xl border cursor-pointer transition flex items-center justify-between gap-3 ${
                    isChecked
                      ? 'bg-white border-blue-400 ring-1 ring-blue-300 text-slate-900 shadow-2xs'
                      : 'bg-white/60 border-slate-200 text-slate-500 hover:bg-white hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="shrink-0">
                      {isChecked ? (
                        <CheckSquare className="w-4 h-4 text-blue-600" />
                      ) : (
                        <Square className="w-4 h-4 text-slate-300" />
                      )}
                    </div>
                    <div>
                      <div className="font-bold text-xs flex items-center gap-2">
                        <span>{bab.code}</span>
                        <span className="text-[10px] font-normal px-1.5 py-0.2 rounded bg-slate-100 text-slate-600">
                          {bab.grade}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-600 line-clamp-1 mt-0.5">
                        {bab.title}
                      </div>
                    </div>
                  </div>

                  <div className="shrink-0">
                    {isChecked ? (
                      <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold">
                        DIBUKA
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 text-[10px] font-medium flex items-center gap-1">
                        <Lock className="w-2.5 h-2.5" />
                        Terkunci
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Teacher Notes / Instructions */}
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
            4. Catatan & Instruksi Khusus untuk Rombel Ini:
          </label>
          <input
            type="text"
            value={currentAssignment.notes || ''}
            onChange={(e) => updateCurrentAssignment({ notes: e.target.value })}
            placeholder="Contoh: Selesaikan Simulasi Crimping T568B dan CBT Bab 2 sebelum praktikum berakhir..."
            className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-300 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-2xs"
          />
          <p className="text-[11px] text-slate-500 mt-1">
            Catatan ini akan tampil di dashboard siswa rombel ini jika mereka membuka bab yang ditugaskan atau mencoba membuka bab yang terkunci.
          </p>
        </div>
      </div>
    </div>
  );
};
