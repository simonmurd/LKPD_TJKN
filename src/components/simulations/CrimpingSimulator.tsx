import React, { useState } from 'react';
import { CheckCircle2, AlertTriangle, RefreshCw, Scissors, ShieldAlert, Award } from 'lucide-react';

interface WirePin {
  color: string;
  name: string;
  code: string;
  borderColor: string;
}

const WIRE_COLORS: WirePin[] = [
  { color: 'bg-amber-100 text-amber-800 border-orange-500', name: 'Putih-Orange', code: 'WO', borderColor: '#f97316' },
  { color: 'bg-orange-500 text-white border-orange-600', name: 'Orange', code: 'O', borderColor: '#ea580c' },
  { color: 'bg-emerald-100 text-emerald-800 border-green-500', name: 'Putih-Hijau', code: 'WG', borderColor: '#22c55e' },
  { color: 'bg-blue-600 text-white border-blue-700', name: 'Biru', code: 'B', borderColor: '#2563eb' },
  { color: 'bg-sky-100 text-sky-800 border-blue-400', name: 'Putih-Biru', code: 'WB', borderColor: '#60a5fa' },
  { color: 'bg-green-600 text-white border-green-700', name: 'Hijau', code: 'G', borderColor: '#16a34a' },
  { color: 'bg-amber-50 text-amber-900 border-amber-700', name: 'Putih-Coklat', code: 'WBr', borderColor: '#b45309' },
  { color: 'bg-amber-900 text-white border-amber-950', name: 'Coklat', code: 'Br', borderColor: '#78350f' },
];

const T568B_ORDER = ['WO', 'O', 'WG', 'B', 'WB', 'G', 'WBr', 'Br'];
const T568A_ORDER = ['WG', 'G', 'WO', 'B', 'WB', 'O', 'WBr', 'Br'];

export const CrimpingSimulator: React.FC = () => {
  const [selectedStandard, setSelectedStandard] = useState<'T568B' | 'T568A'>('T568B');
  const [targetType, setTargetType] = useState<'straight' | 'crossover'>('straight');
  const [pinout, setPinout] = useState<(WirePin | null)[]>([null, null, null, null, null, null, null, null]);
  const [isCrimped, setIsCrimped] = useState(false);
  const [crimpAnimation, setCrimpAnimation] = useState(false);

  const targetSequence = selectedStandard === 'T568B' ? T568B_ORDER : T568A_ORDER;

  const handlePlaceWire = (wire: WirePin) => {
    if (isCrimped) return;
    const emptyIndex = pinout.findIndex((p) => p === null);
    if (emptyIndex !== -1) {
      const next = [...pinout];
      next[emptyIndex] = wire;
      setPinout(next);
    }
  };

  const handleRemovePin = (index: number) => {
    if (isCrimped) return;
    const next = [...pinout];
    next[index] = null;
    setPinout(next);
  };

  const handleQuickPreset = (std: 'T568B' | 'T568A') => {
    const order = std === 'T568B' ? T568B_ORDER : T568A_ORDER;
    const filled = order.map((code) => WIRE_COLORS.find((w) => w.code === code)!);
    setPinout(filled);
    setIsCrimped(false);
  };

  const handleCrimp = () => {
    if (pinout.some((p) => p === null)) return;
    setCrimpAnimation(true);
    setTimeout(() => {
      setCrimpAnimation(false);
      setIsCrimped(true);
    }, 700);
  };

  const handleReset = () => {
    setPinout([null, null, null, null, null, null, null, null]);
    setIsCrimped(false);
  };

  // Evaluate pinout correctness
  const isComplete = pinout.every((p) => p !== null);
  const currentCodes = pinout.map((p) => p?.code || '');
  const isMatchCurrentStandard = currentCodes.join(',') === targetSequence.join(',');
  const isMatchT568B = currentCodes.join(',') === T568B_ORDER.join(',');
  const isMatchT568A = currentCodes.join(',') === T568A_ORDER.join(',');

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 text-slate-100 shadow-xl">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 text-xs font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-full">
              Simulasi Praktik #1
            </span>
            <h3 className="text-lg font-bold text-white">Laboratorium Virtual Crimping UTP T568A / T568B</h3>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Susun 8 pin kawat tembaga kabel UTP Cat6 ke dalam konektor RJ-45, potong rata, dan tekan crimper!
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="bg-slate-800 p-1 rounded-lg border border-slate-700 flex text-xs">
            <button
              onClick={() => setSelectedStandard('T568B')}
              className={`px-3 py-1 rounded font-medium transition ${
                selectedStandard === 'T568B'
                  ? 'bg-blue-600 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Standar T568B (Umum)
            </button>
            <button
              onClick={() => setSelectedStandard('T568A')}
              className={`px-3 py-1 rounded font-medium transition ${
                selectedStandard === 'T568A'
                  ? 'bg-blue-600 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Standar T568A
            </button>
          </div>

          <button
            onClick={handleReset}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
            title="Reset Pinout"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Wire Reference Guide Bar */}
      <div className="bg-slate-950/70 p-3 rounded-lg border border-slate-800/80 mb-5">
        <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
          <span className="font-semibold text-slate-300">
            Panduan Urutan Standar {selectedStandard} (Kiri ke Kanan, Pin 1 ke 8):
          </span>
          <span className="text-[11px] text-slate-400">
            Klip Pengunci RJ-45 Menghadap ke Bawah (Tab Down)
          </span>
        </div>
        <div className="grid grid-cols-8 gap-1.5">
          {targetSequence.map((code, idx) => {
            const wire = WIRE_COLORS.find((w) => w.code === code)!;
            return (
              <div
                key={idx}
                className="flex flex-col items-center bg-slate-900/90 border border-slate-800 rounded p-1.5"
              >
                <div
                  className="w-full h-3 rounded-sm mb-1 border"
                  style={{ backgroundColor: wire.borderColor }}
                />
                <span className="text-[10px] font-mono text-slate-400">Pin {idx + 1}</span>
                <span className="text-[10px] font-semibold text-slate-200 truncate w-full text-center">
                  {wire.name}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Main RJ-45 Connector Workspace */}
      <div className="relative bg-gradient-to-b from-slate-950 to-slate-900 border border-slate-800 rounded-xl p-6 mb-5 overflow-hidden">
        {/* Connector Housing Graphic */}
        <div className="max-w-xl mx-auto">
          <div className="text-center mb-3">
            <span className="text-xs uppercase font-mono tracking-wider text-slate-400">
              Konektor RJ-45 Transparan (Slot Pin 1 s.d. 8)
            </span>
          </div>

          {/* RJ45 Head */}
          <div
            className={`relative bg-sky-950/30 border-2 ${
              isCrimped ? 'border-emerald-500/80 ring-2 ring-emerald-500/20' : 'border-sky-500/50'
            } rounded-t-2xl p-4 pt-6 transition-all duration-300`}
          >
            {/* Gold Pins at the top */}
            <div className="grid grid-cols-8 gap-2 mb-3">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((pinNum) => (
                <div key={pinNum} className="flex flex-col items-center">
                  <div
                    className={`w-4 h-6 rounded-t-sm transition-colors ${
                      isCrimped ? 'bg-amber-400 shadow-md shadow-amber-400/50' : 'bg-amber-600/60'
                    }`}
                  />
                  <span className="text-[10px] font-mono font-bold text-slate-400 mt-1">
                    #{pinNum}
                  </span>
                </div>
              ))}
            </div>

            {/* Wire Slots */}
            <div className="grid grid-cols-8 gap-2 bg-slate-950/80 p-3 rounded-lg border border-slate-800 min-h-[140px] items-end">
              {pinout.map((pin, idx) => (
                <div
                  key={idx}
                  onClick={() => handleRemovePin(idx)}
                  className={`flex flex-col items-center justify-end h-full rounded cursor-pointer group transition-all relative ${
                    pin ? 'hover:opacity-80' : 'border border-dashed border-slate-700 hover:border-blue-500'
                  }`}
                  title={pin ? `${pin.name} (Klik untuk melepas)` : `Slot Pin ${idx + 1} kosong`}
                >
                  {pin ? (
                    <div className="w-full flex flex-col items-center">
                      <div
                        className="w-full h-24 rounded-t-sm shadow-inner transition-all border-x"
                        style={{
                          backgroundColor: pin.borderColor,
                          borderColor: 'rgba(255,255,255,0.2)',
                        }}
                      />
                      <span className="text-[9px] font-mono text-slate-300 mt-1 truncate px-0.5">
                        {pin.code}
                      </span>
                    </div>
                  ) : (
                    <div className="text-[10px] text-slate-500 mb-2 font-mono">
                      +
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Cable jacket lock wedge representation */}
            <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400 px-2">
              <span>Selubung Luar Kabel UTP Cat6 (Jacket)</span>
              <span className={`font-mono text-xs ${isCrimped ? 'text-emerald-400 font-semibold' : 'text-amber-400'}`}>
                {isCrimped ? 'Terkunci Baji Crimper ✓' : 'Belum Dikrimping'}
              </span>
            </div>
          </div>

          {/* Action Button Bar */}
          <div className="flex flex-wrap items-center justify-center gap-3 mt-4">
            <button
              onClick={handleCrimp}
              disabled={!isComplete || isCrimped}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-lg font-semibold text-sm transition shadow-lg ${
                !isComplete
                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                  : isCrimped
                  ? 'bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 cursor-default'
                  : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-blue-500/20 active:scale-95'
              }`}
            >
              <Scissors className={`w-4 h-4 ${crimpAnimation ? 'animate-spin' : ''}`} />
              {isCrimped ? 'Kabel Berhasil Dikrimping!' : 'Tekan Tang Crimping (Crimp!)'}
            </button>

            <button
              onClick={() => handleQuickPreset(selectedStandard)}
              className="text-xs text-slate-400 hover:text-white underline decoration-slate-600 hover:decoration-white transition"
            >
              Otomatis Isi Sesuai {selectedStandard}
            </button>
          </div>
        </div>
      </div>

      {/* Wire Palette for Manual Placement */}
      <div className="mb-5">
        <div className="text-xs font-semibold text-slate-300 mb-2">
          Pilih & Masukkan Kawat ke Pin RJ-45 (Klik kawat untuk menempatkan ke slot pin berikutnya):
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-8 gap-2">
          {WIRE_COLORS.map((wire) => (
            <button
              key={wire.code}
              onClick={() => handlePlaceWire(wire)}
              disabled={isCrimped || !pinout.some((p) => p === null)}
              className={`p-2 rounded-lg border text-left transition flex items-center gap-2 shadow-sm ${
                isCrimped
                  ? 'opacity-40 cursor-not-allowed border-slate-800 bg-slate-900'
                  : 'border-slate-700 bg-slate-800/80 hover:bg-slate-750 hover:border-slate-500'
              }`}
            >
              <div
                className="w-4 h-4 rounded-full border shrink-0"
                style={{ backgroundColor: wire.borderColor }}
              />
              <div className="overflow-hidden">
                <div className="text-xs font-medium text-slate-200 truncate">{wire.name}</div>
                <div className="text-[10px] text-slate-400 font-mono">{wire.code}</div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Diagnostic Evaluation Card */}
      {isCrimped && (
        <div
          className={`p-4 rounded-xl border transition ${
            isMatchCurrentStandard
              ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-200'
              : 'bg-amber-950/40 border-amber-500/50 text-amber-200'
          }`}
        >
          <div className="flex items-start gap-3">
            {isMatchCurrentStandard ? (
              <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0 mt-0.5" />
            ) : (
              <AlertTriangle className="w-6 h-6 text-amber-400 shrink-0 mt-0.5" />
            )}
            <div className="text-sm">
              <h4 className="font-bold text-white mb-1">
                {isMatchCurrentStandard
                  ? `Sempurna! Pinout Memenuhi Standar ${selectedStandard} ANSI/TIA-568`
                  : 'Peringatan: Urutan Kawat Tidak Sesuai Standar!'}
              </h4>
              <p className="text-xs opacity-90 mb-2">
                {isMatchT568B
                  ? 'Kabel berstandar T568B. Jika ujung lainnya juga T568B, ini membentuk kabel Straight-Through (PC ke Switch).'
                  : isMatchT568A
                  ? 'Kabel berstandar T568A. Jika dipasangkan dengan ujung T568B, akan menghasilkan kabel Crossover (PC ke PC / Switch ke Switch).'
                  : 'Urutan kawat tertukar atau keliru. Hal ini akan menimbulkan Near-End Crosstalk (NEXT), frame drops, atau bahkan kegagalan negosiasi kecepatan link di switch.'}
              </p>
              <div className="flex items-center gap-2 text-xs font-mono">
                <span className="text-slate-400">Hasil Wiremap:</span>
                <span className="font-bold text-white">{currentCodes.join(' - ')}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
