import React, { useState } from 'react';
import { Flame, CheckCircle2, RotateCcw, Shield, Sparkles, AlertCircle } from 'lucide-react';

type SplicingPhase =
  | 'sleeve_insert'
  | 'stripping'
  | 'cleaning'
  | 'cleaving'
  | 'vgroove_align'
  | 'arc_fusion'
  | 'sleeve_heat'
  | 'completed';

export const FiberSplicingSimulator: React.FC = () => {
  const [phase, setPhase] = useState<SplicingPhase>('sleeve_insert');
  const [spliceLossDb, setSpliceLossDb] = useState<number>(0.01);
  const [cleaveAngleLeft, setCleaveAngleLeft] = useState<number>(0.4);
  const [cleaveAngleRight, setCleaveAngleRight] = useState<number>(0.5);
  const [isArcFiring, setIsArcFiring] = useState<boolean>(false);
  const [heaterProgress, setHeaterProgress] = useState<number>(0);

  const handleNextPhase = () => {
    switch (phase) {
      case 'sleeve_insert':
        setPhase('stripping');
        break;
      case 'stripping':
        setPhase('cleaning');
        break;
      case 'cleaning':
        setPhase('cleaving');
        break;
      case 'cleaving':
        setPhase('vgroove_align');
        break;
      case 'vgroove_align':
        setIsArcFiring(true);
        setTimeout(() => {
          setIsArcFiring(false);
          const loss = parseFloat((Math.random() * 0.02 + 0.01).toFixed(2));
          setSpliceLossDb(loss);
          setPhase('arc_fusion');
        }, 1600);
        break;
      case 'arc_fusion':
        setPhase('sleeve_heat');
        break;
      case 'sleeve_heat':
        let p = 0;
        const interval = setInterval(() => {
          p += 20;
          setHeaterProgress(p);
          if (p >= 100) {
            clearInterval(interval);
            setPhase('completed');
          }
        }, 300);
        break;
      default:
        break;
    }
  };

  const handleReset = () => {
    setPhase('sleeve_insert');
    setSpliceLossDb(0.01);
    setHeaterProgress(0);
    setIsArcFiring(false);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 text-slate-100 shadow-xl">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 text-xs font-semibold bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-full">
              Simulasi Praktik #5
            </span>
            <h3 className="text-lg font-bold text-white">Laboratorium Virtual Fusion Splicer Fiber Optic</h3>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Praktikkan SOP penyambungan serat optik: Stripping, Cleaning, Cleaving, Core Alignment, dan Arc Fusion (Target redaman &le; 0.03 dB).
          </p>
        </div>

        <button
          onClick={handleReset}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Mulai Ulang Praktik
        </button>
      </div>

      {/* Step Progress Tracker */}
      <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-1.5 mb-5 text-[11px]">
        {[
          { key: 'sleeve_insert', label: '1. Pasang Sleeve' },
          { key: 'stripping', label: '2. Stripping Kaca' },
          { key: 'cleaning', label: '3. Pembersihan Alkohol' },
          { key: 'cleaving', label: '4. Cleaving 90°' },
          { key: 'vgroove_align', label: '5. V-Groove Align' },
          { key: 'arc_fusion', label: '6. Fusi Busur Listrik' },
          { key: 'sleeve_heat', label: '7. Pemanasan Oven' },
        ].map((s) => {
          const phasesOrder: SplicingPhase[] = [
            'sleeve_insert',
            'stripping',
            'cleaning',
            'cleaving',
            'vgroove_align',
            'arc_fusion',
            'sleeve_heat',
            'completed',
          ];
          const isDone = phasesOrder.indexOf(phase) > phasesOrder.indexOf(s.key as SplicingPhase);
          const isCurrent = phase === s.key;

          return (
            <div
              key={s.key}
              className={`p-2 rounded-lg border text-center transition ${
                isDone
                  ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300'
                  : isCurrent
                  ? 'bg-blue-600 text-white font-bold border-blue-400 shadow-lg ring-1 ring-blue-400'
                  : 'bg-slate-950 border-slate-800 text-slate-500'
              }`}
            >
              {s.label}
            </div>
          );
        })}
      </div>

      {/* Main Interactive Stage Canvas */}
      <div className="bg-slate-950 p-6 rounded-xl border border-slate-800 mb-5 relative overflow-hidden min-h-[260px] flex flex-col justify-center">
        {/* Phase 1: Sleeve Insert */}
        {phase === 'sleeve_insert' && (
          <div className="text-center max-w-md mx-auto">
            <div className="w-16 h-16 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center mx-auto mb-3">
              <Shield className="w-8 h-8" />
            </div>
            <h4 className="text-base font-bold text-white mb-2">Langkah 1: Memasang Protection Sleeve (Heat Shrink)</h4>
            <p className="text-xs text-slate-300 leading-relaxed mb-4">
              Sebelum mengupas dan menyambung serat kaca, masukkan selongsong pelindung (Protection Sleeve 60mm) ke salah satu sisi kabel drop core.
              Jika lupa memasukkannya di awal, sambungan harus dipotong kembali!
            </p>
            <button
              onClick={handleNextPhase}
              className="px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs shadow-lg transition"
            >
              Pasang Protection Sleeve & Lanjut ke Stripping →
            </button>
          </div>
        )}

        {/* Phase 2: Stripping */}
        {phase === 'stripping' && (
          <div className="text-center max-w-md mx-auto">
            <h4 className="text-base font-bold text-white mb-2">Langkah 2: Pengupasan Bertingkat dengan Miller Stripper</h4>
            <div className="p-4 bg-slate-900 rounded-xl border border-slate-800 my-3 text-left text-xs space-y-2">
              <div className="flex items-center justify-between text-slate-300">
                <span>• Lubang 1: Jaket Luar 2.0 mm (Outer Jacket)</span>
                <span className="text-emerald-400 font-mono">Terkupas 5 cm ✓</span>
              </div>
              <div className="flex items-center justify-between text-slate-300">
                <span>• Lubang 2: Tight Buffer 900 &mu;m</span>
                <span className="text-emerald-400 font-mono">Terkupas 3 cm ✓</span>
              </div>
              <div className="flex items-center justify-between text-slate-300">
                <span>• Lubang 3: Acrylate Coating 250 &mu;m</span>
                <span className="text-emerald-400 font-mono">Menyisakan Core 125 &mu;m ✓</span>
              </div>
            </div>
            <p className="text-xs text-slate-400 mb-4">
              Pastikan pisau stripper tidak menggores permukaan kaca (cladding 125 mikron).
            </p>
            <button
              onClick={handleNextPhase}
              className="px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs shadow-lg transition"
            >
              Selesai Mengupas, Siapkan Alkohol 95% →
            </button>
          </div>
        )}

        {/* Phase 3: Cleaning */}
        {phase === 'cleaning' && (
          <div className="text-center max-w-md mx-auto">
            <div className="w-16 h-16 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center mx-auto mb-3">
              <Sparkles className="w-8 h-8" />
            </div>
            <h4 className="text-base font-bold text-white mb-2">Langkah 3: Pembersihan dengan Tisu Kimwipes & Alkohol 95-99%</h4>
            <p className="text-xs text-slate-300 leading-relaxed mb-4">
              Usap serat kaca telanjang satu arah menggunakan tisu bebas serat yang dibasahi alkohol isopropil murni hingga terdengar bunyi derit khas.
              Dilarang keras menyentuh kembali kaca yang sudah dibersihkan dengan jari tangan!
            </p>
            <button
              onClick={handleNextPhase}
              className="px-5 py-2.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs shadow-lg transition"
            >
              Kaca Bersih Bebas Minyak, Lanjut ke Cleaver →
            </button>
          </div>
        )}

        {/* Phase 4: Cleaving */}
        {phase === 'cleaving' && (
          <div className="text-center max-w-md mx-auto">
            <h4 className="text-base font-bold text-white mb-2">Langkah 4: Pemotongan Presisi Sudut 90° dengan Fiber Cleaver</h4>
            <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 my-3 text-xs">
              <div className="flex justify-between items-center mb-2 font-mono">
                <span className="text-slate-400">Sudut Potong Serat Kiri:</span>
                <span className="text-emerald-400 font-bold">{cleaveAngleLeft}° (Batas max: 1.0°)</span>
              </div>
              <div className="flex justify-between items-center font-mono">
                <span className="text-slate-400">Sudut Potong Serat Kanan:</span>
                <span className="text-emerald-400 font-bold">{cleaveAngleRight}° (Batas max: 1.0°)</span>
              </div>
            </div>
            <p className="text-xs text-slate-400 mb-4">
              Pisau tungsten karbida memotong tegak lurus sempurna. Serpihan potongan masuk ke kotak limbah cleaver.
            </p>
            <button
              onClick={handleNextPhase}
              className="px-5 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs shadow-lg transition"
            >
              Masukkan ke V-Groove Fusion Splicer →
            </button>
          </div>
        )}

        {/* Phase 5 & 6: V-Groove Alignment & Arc Fusion */}
        {(phase === 'vgroove_align' || phase === 'arc_fusion') && (
          <div className="max-w-xl mx-auto w-full">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-2 font-mono">
              <span>KAMERA MIKROSKOP X/Y CORE ALIGNMENT</span>
              <span>MAGNIFIKASI: 400X</span>
            </div>

            {/* Splicer Screen Canvas */}
            <div className="relative bg-black rounded-xl border-2 border-slate-700 p-6 overflow-hidden min-h-[160px] flex items-center justify-center">
              {/* Fiber Left */}
              <div
                className={`h-4 bg-gradient-to-r from-blue-300 to-slate-100 rounded-l shadow transition-all duration-700 ${
                  phase === 'arc_fusion' ? 'w-48' : 'w-44'
                }`}
              />

              {/* Arc Spark Effect */}
              {isArcFiring && (
                <div className="absolute inset-0 bg-blue-400/30 flex items-center justify-center animate-pulse">
                  <div className="w-8 h-8 rounded-full bg-cyan-200 shadow-2xl shadow-cyan-300 blur-sm animate-ping" />
                </div>
              )}

              {/* Electrodes Top & Bottom */}
              <div className="absolute top-1 w-3 h-6 bg-slate-500 rounded-b shadow" />
              <div className="absolute bottom-1 w-3 h-6 bg-slate-500 rounded-t shadow" />

              {/* Fiber Right */}
              <div
                className={`h-4 bg-gradient-to-l from-blue-300 to-slate-100 rounded-r shadow transition-all duration-700 ${
                  phase === 'arc_fusion' ? 'w-48' : 'w-44'
                }`}
              />
            </div>

            <div className="flex items-center justify-between mt-4">
              <div className="text-xs font-mono">
                {phase === 'arc_fusion' ? (
                  <span className="text-emerald-400 font-bold">
                    HASIL SAMBUNGAN: ESTIMASI LOSS = {spliceLossDb} dB (PASSED)
                  </span>
                ) : (
                  <span className="text-slate-400">Status: Serat Berjajar di V-Groove (Siap Fusi)</span>
                )}
              </div>

              {phase === 'vgroove_align' ? (
                <button
                  onClick={handleNextPhase}
                  disabled={isArcFiring}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white font-bold text-xs shadow-lg transition"
                >
                  <Flame className="w-4 h-4" />
                  {isArcFiring ? 'Menembakkan Busur Listrik...' : 'Tembak Arc Discharge (Fusi!)'}
                </button>
              ) : (
                <button
                  onClick={handleNextPhase}
                  className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs transition"
                >
                  Pindahkan ke Pemanas Protection Sleeve →
                </button>
              )}
            </div>
          </div>
        )}

        {/* Phase 7: Sleeve Heating */}
        {phase === 'sleeve_heat' && (
          <div className="text-center max-w-md mx-auto">
            <h4 className="text-base font-bold text-white mb-2">Langkah 7: Pemanasan Selongsong Protection Sleeve (Heater Oven)</h4>
            <p className="text-xs text-slate-300 mb-4">
              Geser protection sleeve tepat ke tengah sambungan kaca, tempatkan ke slot heater oven 200°C untuk mengeraskan pelindung kawat baja.
            </p>
            {heaterProgress > 0 ? (
              <div className="w-full bg-slate-800 rounded-full h-3 mb-4 overflow-hidden border border-slate-700">
                <div
                  className="bg-amber-500 h-full transition-all duration-300 shadow"
                  style={{ width: `${heaterProgress}%` }}
                />
              </div>
            ) : null}
            <button
              onClick={handleNextPhase}
              disabled={heaterProgress > 0}
              className="px-5 py-2.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-semibold text-xs shadow-lg transition"
            >
              {heaterProgress > 0 ? `Memanaskan... ${heaterProgress}%` : 'Mulai Proses Pemanasan Oven (Heat)'}
            </button>
          </div>
        )}

        {/* Phase 8: Completed */}
        {phase === 'completed' && (
          <div className="text-center max-w-md mx-auto">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto mb-3">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h4 className="text-lg font-bold text-white mb-1">Penyambungan Fiber Optic Selesai Sempurna!</h4>
            <p className="text-xs text-slate-300 mb-3">
              Protection sleeve telah mengeras. Redaman sambungan tercatat <strong className="text-emerald-400 font-mono font-bold">{spliceLossDb} dB</strong> (Standar industri: &le; 0.03 dB).
            </p>
            <div className="bg-slate-900 p-3 rounded-lg border border-slate-800 text-xs text-slate-400 mb-4 font-mono">
              Tahap Selanjutnya: Masukkan ke Splicing Tray kaset OTB / ODP dengan radius kelengkungan minimal 6 cm.
            </div>
            <button
              onClick={handleReset}
              className="px-5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-medium text-xs transition"
            >
              Ulangi Praktik Splicing
            </button>
          </div>
        )}
      </div>

      {/* Safety & K3LH Box */}
      <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 text-xs flex items-start gap-3 text-slate-300">
        <Shield className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
        <div>
          <strong className="text-white block mb-0.5">K3LH Keselamatan Kerja Laboratorium Serat Optik:</strong>
          Serpihan kaca potongan 125 mikron tidak kasat mata. Selalu gunakan kacamata pelindung (Safety Glasses), jangan
          pernah mengusap mata dengan tangan, dan selalu gunakan pinset serta wadah limbah tertutup untuk membuang ujung serat kaca.
        </div>
      </div>
    </div>
  );
};
