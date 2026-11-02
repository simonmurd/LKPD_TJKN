import React, { useState, useEffect } from 'react';
import { Play, Pause, RotateCcw, AlertCircle, CheckCircle, Zap } from 'lucide-react';

type CableCondition = 'straight_good' | 'crossover_good' | 'open_pin3_6' | 'short_pin1_2' | 'reversed_pair';

export const LanTesterSimulator: React.FC = () => {
  const [condition, setCondition] = useState<CableCondition>('straight_good');
  const [powerMode, setPowerMode] = useState<'ON' | 'S' | 'OFF'>('ON');
  const [currentStep, setCurrentStep] = useState<number>(1); // 1 to 8, and 9 for G (Ground)
  const [speedInterval, setSpeedInterval] = useState<number>(450); // ms per step

  // Update speed when switching ON vs S (Slow)
  useEffect(() => {
    if (powerMode === 'ON') setSpeedInterval(450);
    else if (powerMode === 'S') setSpeedInterval(950);
  }, [powerMode]);

  // Cycling LED timer
  useEffect(() => {
    if (powerMode === 'OFF') return;

    const timer = setInterval(() => {
      setCurrentStep((prev) => (prev >= 8 ? 1 : prev + 1));
    }, speedInterval);

    return () => clearInterval(timer);
  }, [powerMode, speedInterval]);

  // Determine Master and Remote LED status for current step
  const getLedState = (pin: number) => {
    const isMasterActive = powerMode !== 'OFF' && currentStep === pin;
    let isRemoteActive = false;
    let isRemoteShort = false;

    if (powerMode !== 'OFF') {
      switch (condition) {
        case 'straight_good':
          isRemoteActive = currentStep === pin;
          break;

        case 'crossover_good':
          // Crossover swaps 1<->3 and 2<->6
          if (currentStep === 1 && pin === 3) isRemoteActive = true;
          else if (currentStep === 2 && pin === 6) isRemoteActive = true;
          else if (currentStep === 3 && pin === 1) isRemoteActive = true;
          else if (currentStep === 6 && pin === 2) isRemoteActive = true;
          else if (currentStep === pin && ![1, 2, 3, 6].includes(currentStep)) isRemoteActive = true;
          break;

        case 'open_pin3_6':
          // Pins 3 and 6 never light up on remote
          if (pin !== 3 && pin !== 6 && currentStep === pin) {
            isRemoteActive = true;
          }
          break;

        case 'short_pin1_2':
          // When 1 or 2 is active on master, both 1 and 2 light up on remote!
          if (currentStep === 1 || currentStep === 2) {
            if (pin === 1 || pin === 2) {
              isRemoteActive = true;
              isRemoteShort = true;
            }
          } else if (currentStep === pin) {
            isRemoteActive = true;
          }
          break;

        case 'reversed_pair':
          // Pins 4 and 5 reversed
          if (currentStep === 4 && pin === 5) isRemoteActive = true;
          else if (currentStep === 5 && pin === 4) isRemoteActive = true;
          else if (currentStep === pin) isRemoteActive = true;
          break;
      }
    }

    return { isMasterActive, isRemoteActive, isRemoteShort };
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 text-slate-100 shadow-xl">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 text-xs font-semibold bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded-full">
              Simulasi Praktik #2
            </span>
            <h3 className="text-lg font-bold text-white">Digital LAN Tester & Cable Wiremap Analyzer</h3>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Amati sinkronisasi pola nyala LED 1-8 pada Master Unit dan Remote Unit untuk mendiagnosis kerusakan fisik kabel.
          </p>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs">
            <button
              onClick={() => setPowerMode('ON')}
              className={`px-2.5 py-1 rounded font-medium transition ${
                powerMode === 'ON' ? 'bg-emerald-600 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              ON (Normal)
            </button>
            <button
              onClick={() => setPowerMode('S')}
              className={`px-2.5 py-1 rounded font-medium transition ${
                powerMode === 'S' ? 'bg-amber-600 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              S (Slow)
            </button>
            <button
              onClick={() => setPowerMode('OFF')}
              className={`px-2.5 py-1 rounded font-medium transition ${
                powerMode === 'OFF' ? 'bg-red-600 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              OFF
            </button>
          </div>
        </div>
      </div>

      {/* Preset Condition Selector */}
      <div className="mb-5">
        <label className="text-xs font-semibold text-slate-300 block mb-2">
          Pilih Kondisi Fisik Kabel yang Diuji:
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 text-xs">
          {[
            { id: 'straight_good', label: 'Straight Normal', desc: 'Semua 8 LED sinkron 1-8' },
            { id: 'crossover_good', label: 'Crossover Normal', desc: 'Silang 1-3 dan 2-6' },
            { id: 'open_pin3_6', label: 'Open Circuit (Putus)', desc: 'Pin 3 & 6 tidak menyala' },
            { id: 'short_pin1_2', label: 'Short Circuit (Korslet)', desc: 'Pin 1-2 menyala bersamaan' },
            { id: 'reversed_pair', label: 'Reversed Pair', desc: 'Pin 4 & 5 terbalik posisi' },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setCondition(item.id as CableCondition)}
              className={`p-2.5 rounded-lg border text-left transition ${
                condition === item.id
                  ? 'bg-blue-950/70 border-blue-500 text-white shadow-md'
                  : 'bg-slate-800/60 border-slate-700/80 text-slate-300 hover:bg-slate-800'
              }`}
            >
              <div className="font-bold text-xs">{item.label}</div>
              <div className="text-[10px] text-slate-400 mt-0.5">{item.desc}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Digital LAN Tester Hardware Representation */}
      <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-6 mb-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto">
          {/* Master Unit */}
          <div className="bg-gradient-to-b from-slate-800 to-slate-900 border-2 border-slate-700 rounded-2xl p-5 shadow-2xl relative">
            <div className="flex items-center justify-between border-b border-slate-700/80 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
                <span className="font-bold text-sm tracking-wide text-white uppercase">MASTER UNIT</span>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-950 text-slate-400 border border-slate-800">
                TX PORT RJ-45
              </span>
            </div>

            {/* LED Row 1-8 and G */}
            <div className="space-y-2 bg-slate-950/90 p-4 rounded-xl border border-slate-800">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((pin) => {
                const { isMasterActive } = getLedState(pin);
                return (
                  <div key={pin} className="flex items-center justify-between px-2 py-1 rounded bg-slate-900/60">
                    <span className="text-xs font-mono font-bold text-slate-400">PIN #{pin}</span>
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-3.5 h-3.5 rounded-full transition-all duration-150 ${
                          isMasterActive
                            ? 'bg-emerald-400 shadow-lg shadow-emerald-400/80 ring-2 ring-emerald-300'
                            : 'bg-emerald-950/50 border border-emerald-900'
                        }`}
                      />
                      <span className="text-[10px] font-mono w-8 text-right text-slate-500">
                        {isMasterActive ? 'HIGH' : 'LOW'}
                      </span>
                    </div>
                  </div>
                );
              })}

              {/* Ground Pin */}
              <div className="flex items-center justify-between px-2 py-1 rounded bg-slate-900/40 border-t border-slate-800/80 mt-1">
                <span className="text-[11px] font-mono font-bold text-slate-500">SHIELD (G)</span>
                <div className="w-3 h-3 rounded-full bg-slate-800 border border-slate-700" />
              </div>
            </div>

            <div className="mt-4 text-center">
              <span className="text-[11px] text-slate-400 font-mono">
                Sekuens Detak: <strong className="text-white">Pin #{currentStep}</strong>
              </span>
            </div>
          </div>

          {/* Remote Unit */}
          <div className="bg-gradient-to-b from-slate-800 to-slate-900 border-2 border-slate-700 rounded-2xl p-5 shadow-2xl relative">
            <div className="flex items-center justify-between border-b border-slate-700/80 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-blue-500" />
                <span className="font-bold text-sm tracking-wide text-white uppercase">REMOTE UNIT</span>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-950 text-slate-400 border border-slate-800">
                RX PORT RJ-45
              </span>
            </div>

            {/* LED Row 1-8 on Remote */}
            <div className="space-y-2 bg-slate-950/90 p-4 rounded-xl border border-slate-800">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((pin) => {
                const { isRemoteActive, isRemoteShort } = getLedState(pin);
                return (
                  <div key={pin} className="flex items-center justify-between px-2 py-1 rounded bg-slate-900/60">
                    <span className="text-xs font-mono font-bold text-slate-400">PIN #{pin}</span>
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-3.5 h-3.5 rounded-full transition-all duration-150 ${
                          isRemoteActive
                            ? isRemoteShort
                              ? 'bg-amber-400 shadow-lg shadow-amber-400/80 ring-2 ring-amber-300'
                              : 'bg-emerald-400 shadow-lg shadow-emerald-400/80 ring-2 ring-emerald-300'
                            : 'bg-slate-900 border border-slate-800'
                        }`}
                      />
                      <span
                        className={`text-[10px] font-mono w-12 text-right ${
                          isRemoteActive
                            ? isRemoteShort
                              ? 'text-amber-400 font-bold'
                              : 'text-emerald-400 font-bold'
                            : 'text-slate-600'
                        }`}
                      >
                        {isRemoteActive ? (isRemoteShort ? 'SHORT' : 'ACTIVE') : 'IDLE'}
                      </span>
                    </div>
                  </div>
                );
              })}

              {/* Ground Pin */}
              <div className="flex items-center justify-between px-2 py-1 rounded bg-slate-900/40 border-t border-slate-800/80 mt-1">
                <span className="text-[11px] font-mono font-bold text-slate-500">SHIELD (G)</span>
                <div className="w-3 h-3 rounded-full bg-slate-800 border border-slate-700" />
              </div>
            </div>

            <div className="mt-4 text-center">
              <span className="text-[11px] text-slate-400 font-mono">
                Status Link:{' '}
                <strong
                  className={
                    condition.includes('good')
                      ? 'text-emerald-400'
                      : condition.includes('open')
                      ? 'text-red-400'
                      : 'text-amber-400'
                  }
                >
                  {condition === 'straight_good' && 'Straight Lolos 100%'}
                  {condition === 'crossover_good' && 'Crossover Lolos 100%'}
                  {condition === 'open_pin3_6' && 'Gagal: Pin 3 & 6 Terputus'}
                  {condition === 'short_pin1_2' && 'Gagal: Korsleting Pin 1-2'}
                  {condition === 'reversed_pair' && 'Gagal: Pin 4-5 Tertukar'}
                </strong>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Wiremap Diagnostic Card */}
      <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-xs">
        <h4 className="font-bold text-sm text-white mb-2 flex items-center gap-2">
          <Zap className="w-4 h-4 text-amber-400" />
          Analisis Teknis & Dampak Jaringan Lapangan:
        </h4>
        <div className="text-slate-300 leading-relaxed space-y-1.5">
          {condition === 'straight_good' && (
            <p>
              Kabel Straight dalam kondisi prima. Master dan Remote berkedip berurutan 1 sampai 8 secara simultan. Siap
              digunakan untuk menghubungkan PC ke Switch atau Router ke Switch pada kecepatan Gigabit 1000BASE-T.
            </p>
          )}
          {condition === 'crossover_good' && (
            <p>
              Kabel Crossover berstandar T568A ke T568B. LED Master 1 menyalakan Remote 3, Master 2 menyalakan Remote 6,
              Master 3 menyalakan Remote 1, dan Master 6 menyalakan Remote 2. Digunakan untuk menghubungkan perangkat
              sejenis (Switch ke Switch tanpa Auto-MDIX).
            </p>
          )}
          {condition === 'open_pin3_6' && (
            <p className="text-red-300">
              Terjadi <strong>Open Circuit</strong> pada pasangan kawat hijau (Pin 3 dan 6). Akibatnya, sinyal Receive
              (Rx) terputus total. Di sistem operasi Windows akan muncul status <em>"Network Cable Unplugged"</em>.
              Solusi: Potong konektor RJ-45 dan lakukan crimping ulang.
            </p>
          )}
          {condition === 'short_pin1_2' && (
            <p className="text-amber-300">
              Terjadi <strong>Short Circuit (Korsleting)</strong> antara pin 1 dan 2. Saat Master mengirim arus ke pin 1,
              Remote menyala pada pin 1 dan 2 sekaligus. Ini terjadi karena kawat tembaga saling bersentuhan akibat
              pengupasan berlebih. Jika dialiri PoE 48V, dapat memicu proteksi trip pada switch!
            </p>
          )}
          {condition === 'reversed_pair' && (
            <p className="text-amber-300">
              Terjadi <strong>Reversed Pair</strong> pada pin 4 dan 5. Urutan polaritas kawat terbalik. Pada jaringan
              Fast Ethernet 100 Mbps koneksi mungkin masih berjalan semu, namun pada Gigabit Ethernet 1000 Mbps akan
              gagal bernegosiasi dan turun kecepatan serta menimbulkan packet loss parah.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
