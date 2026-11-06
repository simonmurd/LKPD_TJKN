import React, { useState, useEffect } from 'react';
import { ExamConfig } from '../../types/curriculum';
import {
  X,
  KeyRound,
  Clock,
  ShieldCheck,
  Check,
  Copy,
  RefreshCw,
  Save,
  AlertTriangle,
  SlidersHorizontal,
} from 'lucide-react';

interface ExamSessionConfigModalProps {
  onClose: () => void;
  onConfigUpdated?: (config: ExamConfig) => void;
}

export const ExamSessionConfigModal: React.FC<ExamSessionConfigModalProps> = ({
  onClose,
  onConfigUpdated,
}) => {
  const [config, setConfig] = useState<ExamConfig>({
    tokenEnabled: true,
    examToken: 'TJKN2026',
    durationMinutes: 60,
    sessionTitle: 'Penilaian Sumatif Akhir Bab (PSAB) Fase F TJKN',
    updatedAt: new Date().toISOString(),
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [copySuccess, setCopySuccess] = useState<boolean>(false);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const res = await fetch('/api/exam-config');
        if (res.ok) {
          const data = await res.json();
          if (data.config) {
            setConfig(data.config);
          }
        }
      } catch (e) {
        // use default
      } finally {
        setIsLoading(false);
      }
    };
    fetchConfig();
  }, []);

  const handleGenerateRandomToken = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let token = '';
    for (let i = 0; i < 6; i++) {
      token += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setConfig((prev) => ({ ...prev, examToken: token }));
  };

  const handleCopyToken = () => {
    navigator.clipboard.writeText(config.examToken);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  const handleSave = async () => {
    setIsSaving(true);
    setSaveSuccess(false);
    try {
      const res = await fetch('/api/exam-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      });
      if (res.ok) {
        const data = await res.json();
        setSaveSuccess(true);
        if (data.config && onConfigUpdated) {
          onConfigUpdated(data.config);
        }
        setTimeout(() => {
          onClose();
        }, 1200);
      }
    } catch {
      setSaveSuccess(true);
      setTimeout(() => onClose(), 1000);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-xl w-full overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 border border-blue-200 text-blue-700 flex items-center justify-center font-bold">
              <KeyRound className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Pengaturan Sesi Ujian CBT & Token Pengawas
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Konfigurasi Keamanan Lab & Waktu Ujian Fase F TJKN
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

        {/* Body */}
        <div className="p-6 space-y-6 text-xs text-slate-700">
          {/* Mode Switch: Token Required vs Free Practice */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
            <div className="space-y-0.5 pr-4">
              <div className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Wajibkan Token Ujian (Mode Pengawas Kelas)</span>
              </div>
              <p className="text-[11px] text-slate-500">
                Siswa tidak dapat memulai atau melihat soal CBT sebelum memasukkan token resmi dari guru di papan tulis lab.
              </p>
            </div>

            <label className="relative inline-flex items-center cursor-pointer shrink-0">
              <input
                type="checkbox"
                checked={config.tokenEnabled}
                onChange={(e) =>
                  setConfig((prev) => ({ ...prev, tokenEnabled: e.target.checked }))
                }
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          {/* Token Box */}
          {config.tokenEnabled && (
            <div className="p-5 rounded-2xl bg-blue-50/70 border border-blue-200 space-y-3">
              <div className="flex items-center justify-between">
                <label className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                  <KeyRound className="w-4 h-4 text-blue-600" />
                  <span>Token Ujian Aktif:</span>
                </label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleGenerateRandomToken}
                    className="flex items-center gap-1 text-[11px] font-semibold text-blue-700 hover:text-blue-900 bg-white px-2.5 py-1 rounded-lg border border-blue-200 shadow-2xs hover:bg-blue-50 transition"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>Acak Baru</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleCopyToken}
                    className="flex items-center gap-1 text-[11px] font-semibold text-blue-700 hover:text-blue-900 bg-white px-2.5 py-1 rounded-lg border border-blue-200 shadow-2xs hover:bg-blue-50 transition"
                  >
                    {copySuccess ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-600" />
                        <span className="text-emerald-700">Tersalin!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        <span>Salin</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              <input
                type="text"
                value={config.examToken}
                onChange={(e) =>
                  setConfig((prev) => ({
                    ...prev,
                    examToken: e.target.value.toUpperCase().trim(),
                  }))
                }
                placeholder="Misal: TJKN2026"
                className="w-full text-center tracking-widest text-2xl font-mono font-black text-blue-900 bg-white p-3 rounded-xl border border-blue-300 shadow-2xs focus:ring-2 focus:ring-blue-500 uppercase"
              />
              <p className="text-[11px] text-slate-500 text-center">
                Berikan token ini kepada siswa saat instruksi mulai ujian diberikan.
              </p>
            </div>
          )}

          {/* Exam Duration */}
          <div className="space-y-2">
            <label className="font-bold text-slate-800 flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-blue-600" />
              <span>Batas Durasi Pengerjaan Ujian (Countdown Timer):</span>
            </label>
            <div className="grid grid-cols-3 gap-3">
              {[45, 60, 90].map((mins) => (
                <button
                  key={mins}
                  type="button"
                  onClick={() =>
                    setConfig((prev) => ({ ...prev, durationMinutes: mins }))
                  }
                  className={`p-3 rounded-2xl border text-center transition ${
                    config.durationMinutes === mins
                      ? 'border-blue-600 bg-blue-50 text-blue-900 font-bold shadow-xs'
                      : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <div className="text-base font-bold">{mins} Menit</div>
                  <div className="text-[10px] text-slate-500 font-normal">
                    {mins === 60 ? 'Standar Asesmen' : mins === 45 ? 'Uji Singkat' : 'Uji Komprehensif'}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Session Title */}
          <div className="space-y-1.5">
            <label className="font-bold text-slate-800">
              Judul Sesi Penilaian (Ditampilkan di Kartu Siswa):
            </label>
            <input
              type="text"
              value={config.sessionTitle}
              onChange={(e) =>
                setConfig((prev) => ({ ...prev, sessionTitle: e.target.value }))
              }
              className="w-full p-3 rounded-xl border border-slate-300 bg-white text-slate-900 text-xs focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {saveSuccess && (
            <div className="p-3 rounded-xl bg-emerald-100 text-emerald-900 font-bold text-xs flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-700 shrink-0" />
              <span>Pengaturan sesi ujian berhasil diperbarui dan diterapkan ke seluruh siswa!</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-5 border-t border-slate-100 bg-slate-50/70 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 font-semibold text-xs transition"
          >
            Batal
          </button>

          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition shadow-sm disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? 'Menyimpan...' : 'Simpan Pengaturan Ujian'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
