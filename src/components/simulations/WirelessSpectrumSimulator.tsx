import React, { useState } from 'react';
import { Radio, Wifi, AlertTriangle, CheckCircle2, Info, Layers } from 'lucide-react';

interface AccessPointItem {
  id: string;
  name: string;
  band: '2.4GHz' | '5GHz';
  channel: number;
  width: 20 | 40;
  powerDbm: number;
  color: string;
}

const DEFAULT_APS: AccessPointItem[] = [
  { id: 'ap1', name: 'AP-Lab-TKJ', band: '2.4GHz', channel: 1, width: 20, powerDbm: 20, color: '#3b82f6' },
  { id: 'ap2', name: 'AP-Ruang-Guru', band: '2.4GHz', channel: 6, width: 20, powerDbm: 18, color: '#10b981' },
  { id: 'ap3', name: 'AP-Kantin-Hotspot', band: '2.4GHz', channel: 11, width: 20, powerDbm: 17, color: '#8b5cf6' },
];

export const WirelessSpectrumSimulator: React.FC = () => {
  const [band, setBand] = useState<'2.4GHz' | '5GHz'>('2.4GHz');
  const [aps, setAps] = useState<AccessPointItem[]>(DEFAULT_APS);
  const [selectedApId, setSelectedApId] = useState<string>('ap1');

  const selectedAp = aps.find((a) => a.id === selectedApId) || aps[0];

  const updateSelectedAp = (updates: Partial<AccessPointItem>) => {
    setAps((prev) =>
      prev.map((ap) => (ap.id === selectedApId ? { ...ap, ...updates } : ap))
    );
  };

  // Check for channel overlap on 2.4 GHz
  const activeBands = aps.filter((a) => a.band === band);
  const overlappingPairs: string[] = [];

  for (let i = 0; i < activeBands.length; i++) {
    for (let j = i + 1; j < activeBands.length; j++) {
      const a = activeBands[i];
      const b = activeBands[j];
      const diff = Math.abs(a.channel - b.channel);
      if (band === '2.4GHz') {
        // In 2.4GHz, 20MHz channel spans 5 channels. Non-overlapping requires >= 5 channels apart (e.g. 1, 6, 11)
        if (diff < 5) {
          overlappingPairs.push(`${a.name} (Ch ${a.channel}) & ${b.name} (Ch ${b.channel})`);
        }
      }
    }
  }

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 text-slate-100 shadow-xl">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 text-xs font-semibold bg-purple-500/20 text-purple-400 border border-purple-500/30 rounded-full">
              Simulasi Praktik #3
            </span>
            <h3 className="text-lg font-bold text-white">Visualizer Spektrum Kanal Nirkabel & Analisis Interferensi</h3>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Simulasikan distribusi spektral saluran Wi-Fi 2.4 GHz dan 5 GHz, hindari Adjacent Channel Interference (ACI).
          </p>
        </div>

        {/* Band Switch */}
        <div className="flex items-center gap-2">
          <div className="bg-slate-950 p-1 rounded-lg border border-slate-800 flex text-xs">
            <button
              onClick={() => {
                setBand('2.4GHz');
                setAps(DEFAULT_APS);
              }}
              className={`px-3 py-1 rounded font-medium transition ${
                band === '2.4GHz' ? 'bg-purple-600 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              Spektrum 2.4 GHz (Kanal 1 - 14)
            </button>
            <button
              onClick={() => {
                setBand('5GHz');
                setAps([
                  { id: 'ap_5g_1', name: 'AP-Cisco-Core', band: '5GHz', channel: 36, width: 40, powerDbm: 20, color: '#38bdf8' },
                  { id: 'ap_5g_2', name: 'AP-UniFi-Aula', band: '5GHz', channel: 52, width: 40, powerDbm: 22, color: '#f59e0b' },
                  { id: 'ap_5g_3', name: 'AP-Lab-Server', band: '5GHz', channel: 149, width: 20, powerDbm: 18, color: '#ec4899' },
                ]);
                setSelectedApId('ap_5g_1');
              }}
              className={`px-3 py-1 rounded font-medium transition ${
                band === '5GHz' ? 'bg-purple-600 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              Spektrum 5 GHz (UNII-1, UNII-2, UNII-3)
            </button>
          </div>
        </div>
      </div>

      {/* Access Point Tuner Bar */}
      <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 mb-5">
        <div className="text-xs font-semibold text-slate-300 mb-3 flex items-center justify-between">
          <span>Pilih & Konfigurasi Parameter Access Point:</span>
          <span className="text-slate-500 font-mono text-[11px]">Frekuensi Band: {band}</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
          {activeBands.map((ap) => (
            <button
              key={ap.id}
              onClick={() => setSelectedApId(ap.id)}
              className={`p-3 rounded-lg border text-left transition flex items-center justify-between ${
                selectedApId === ap.id
                  ? 'bg-slate-800 border-purple-500 ring-1 ring-purple-500'
                  : 'bg-slate-900 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div>
                <div className="font-bold text-xs text-white">{ap.name}</div>
                <div className="text-[11px] text-slate-400 mt-0.5">
                  Kanal {ap.channel} • {ap.width} MHz • {ap.powerDbm} dBm
                </div>
              </div>
              <div className="w-3.5 h-3.5 rounded-full" style={{ backgroundColor: ap.color }} />
            </button>
          ))}
        </div>

        {/* Selected AP Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-3 border-t border-slate-800/80 text-xs">
          <div>
            <label className="block text-slate-400 mb-1">
              Nomor Kanal Frekuensi: <strong className="text-white">Kanal {selectedAp.channel}</strong>
            </label>
            <input
              type="range"
              min={band === '2.4GHz' ? 1 : 36}
              max={band === '2.4GHz' ? 13 : 165}
              step={band === '2.4GHz' ? 1 : 4}
              value={selectedAp.channel}
              onChange={(e) => updateSelectedAp({ channel: parseInt(e.target.value, 10) })}
              className="w-full accent-purple-500 cursor-pointer"
            />
            {band === '2.4GHz' && (
              <div className="flex justify-between text-[10px] text-slate-500 mt-1">
                <span>Ch 1 (2412)</span>
                <span className="text-emerald-400">Ch 6 (2437)</span>
                <span>Ch 11 (2462)</span>
              </div>
            )}
          </div>

          <div>
            <label className="block text-slate-400 mb-1">
              Lebar Pita Saluran (Channel Width):
            </label>
            <div className="flex gap-2">
              <button
                onClick={() => updateSelectedAp({ width: 20 })}
                className={`flex-1 py-1 rounded text-xs font-semibold border transition ${
                  selectedAp.width === 20
                    ? 'bg-purple-600 text-white border-purple-500'
                    : 'bg-slate-800 text-slate-400 border-slate-700'
                }`}
              >
                20 MHz (Direkomendasikan)
              </button>
              <button
                onClick={() => updateSelectedAp({ width: 40 })}
                className={`flex-1 py-1 rounded text-xs font-semibold border transition ${
                  selectedAp.width === 40
                    ? 'bg-amber-600 text-white border-amber-500'
                    : 'bg-slate-800 text-slate-400 border-slate-700'
                }`}
              >
                40 MHz (Risiko Interferensi)
              </button>
            </div>
          </div>

          <div>
            <label className="block text-slate-400 mb-1">
              Daya Pancar (Tx Power): <strong className="text-white">{selectedAp.powerDbm} dBm</strong>
            </label>
            <input
              type="range"
              min="10"
              max="24"
              value={selectedAp.powerDbm}
              onChange={(e) => updateSelectedAp({ powerDbm: parseInt(e.target.value, 10) })}
              className="w-full accent-purple-500 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-500 mt-1">
              <span>10 dBm (10 mW)</span>
              <span>20 dBm (100 mW)</span>
              <span>24 dBm (250 mW)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Spectrum Graph (SVG) */}
      <div className="bg-slate-950 p-5 rounded-xl border border-slate-800 mb-5 overflow-x-auto">
        <div className="text-xs font-mono text-slate-400 mb-3 flex items-center justify-between">
          <span>KURVA DISTRIBUSI DAYA SPEKTRAL (SPECTRAL MASK)</span>
          <span>Sumbu Y: Daya Relatif (dBm) | Sumbu X: Frekuensi</span>
        </div>

        <svg viewBox="0 0 800 240" className="w-full h-56 bg-slate-900/90 rounded-lg border border-slate-800">
          {/* Grid lines */}
          <line x1="40" y1="40" x2="780" y2="40" stroke="#334155" strokeDasharray="3 3" />
          <line x1="40" y1="90" x2="780" y2="90" stroke="#334155" strokeDasharray="3 3" />
          <line x1="40" y1="140" x2="780" y2="140" stroke="#334155" strokeDasharray="3 3" />
          <line x1="40" y1="190" x2="780" y2="190" stroke="#475569" strokeWidth="2" />

          {/* Y Axis Labels */}
          <text x="10" y="45" fill="#64748b" fontSize="10" fontFamily="monospace">0 dBm</text>
          <text x="10" y="95" fill="#64748b" fontSize="10" fontFamily="monospace">-20 dBm</text>
          <text x="10" y="145" fill="#64748b" fontSize="10" fontFamily="monospace">-40 dBm</text>
          <text x="10" y="195" fill="#64748b" fontSize="10" fontFamily="monospace">-60 dBm</text>

          {/* 2.4 GHz Channel Markers */}
          {band === '2.4GHz' ? (
            <>
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14].map((ch) => {
                const x = 70 + (ch - 1) * 50;
                const isClean = [1, 6, 11].includes(ch);
                return (
                  <g key={ch}>
                    <line x1={x} y1="190" x2={x} y2="198" stroke="#64748b" />
                    <text
                      x={x}
                      y="212"
                      fill={isClean ? '#34d399' : '#94a3b8'}
                      fontSize={isClean ? '11' : '9'}
                      fontWeight={isClean ? 'bold' : 'normal'}
                      textAnchor="middle"
                      fontFamily="monospace"
                    >
                      {ch}
                    </text>
                    <text x={x} y="225" fill="#64748b" fontSize="8" textAnchor="middle" fontFamily="monospace">
                      {2412 + (ch - 1) * 5}
                    </text>
                  </g>
                );
              })}
            </>
          ) : (
            <>
              {/* 5GHz Channels */}
              {[36, 40, 44, 48, 52, 56, 60, 64, 100, 149, 153, 157, 161].map((ch, idx) => {
                const x = 70 + idx * 55;
                return (
                  <g key={ch}>
                    <line x1={x} y1="190" x2={x} y2="198" stroke="#64748b" />
                    <text x={x} y="212" fill="#38bdf8" fontSize="10" textAnchor="middle" fontFamily="monospace">
                      {ch}
                    </text>
                  </g>
                );
              })}
            </>
          )}

          {/* Render AP Bell Curves */}
          {activeBands.map((ap) => {
            let centerX = 70;
            if (band === '2.4GHz') {
              centerX = 70 + (ap.channel - 1) * 50;
            } else {
              const idx = [36, 40, 44, 48, 52, 56, 60, 64, 100, 149, 153, 157, 161].indexOf(ap.channel);
              centerX = idx !== -1 ? 70 + idx * 55 : 200;
            }

            const curveWidth = (ap.width / 20) * 60;
            const curveHeight = (ap.powerDbm / 24) * 130;
            const topY = 190 - curveHeight;

            const path = `M ${centerX - curveWidth} 190 
                          Q ${centerX - curveWidth * 0.4} ${topY + 10}, ${centerX} ${topY} 
                          Q ${centerX + curveWidth * 0.4} ${topY + 10}, ${centerX + curveWidth} 190 Z`;

            return (
              <g key={ap.id}>
                <path
                  d={path}
                  fill={ap.color}
                  fillOpacity="0.35"
                  stroke={ap.color}
                  strokeWidth="2.5"
                />
                <circle cx={centerX} cy={topY} r="4" fill={ap.color} />
                <text
                  x={centerX}
                  y={topY - 8}
                  fill="white"
                  fontSize="10"
                  fontWeight="bold"
                  textAnchor="middle"
                  fontFamily="sans-serif"
                >
                  {ap.name}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Overlapping & Interference Alert */}
      <div className="space-y-3">
        {overlappingPairs.length > 0 ? (
          <div className="p-4 rounded-xl bg-amber-950/40 border border-amber-500/50 text-amber-200">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-bold text-sm text-white mb-1">
                  Peringatan: Terdeteksi Tumpang Tindih Spektral (Channel Overlapping)!
                </h4>
                <p className="text-xs text-amber-200/90 mb-2">
                  Interferensi kanal bersebelahan (Adjacent Channel Interference) akan merusak frame Wi-Fi, memicu tingginya
                  retransmisi paket (packet retry rate), dan menyebabkan throughput anjlok drastis.
                </p>
                <div className="text-xs font-mono bg-slate-950/60 p-2 rounded border border-amber-500/30">
                  Pasangan Berkonflik: {overlappingPairs.join(' • ')}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-500/50 text-emerald-200">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
              <div className="text-xs">
                <span className="font-bold text-sm text-white">Spektrum Bersih (Non-Overlapping Configured)!</span>
                <p className="mt-0.5 opacity-90">
                  Semua Access Point beroperasi pada saluran yang terisolasi spektralnya. Tidak terjadi degradasi akibat
                  tabrakan frekuensi ko-kanal.
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 text-[11px] text-slate-400 flex items-center gap-2">
          <Info className="w-4 h-4 text-blue-400 shrink-0" />
          <span>
            <strong>Aturan Baku Kurikulum SMK TKJ:</strong> Pada pita 2.4 GHz di Indonesia, selalu gunakan kombinasi
            kanal non-overlapping <strong>Kanal 1, Kanal 6, dan Kanal 11</strong> dengan lebar pita 20 MHz untuk multi-AP
            deployment.
          </span>
        </div>
      </div>
    </div>
  );
};
