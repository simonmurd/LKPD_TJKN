import React, { useState } from 'react';
import { Activity, Search, AlertTriangle, Eye, Sliders, CheckCircle } from 'lucide-react';

interface OtdrEvent {
  id: number;
  type: 'Front Connector' | 'Splice (Non-Reflective)' | 'Macrobend' | 'Connector' | 'Fiber Cut / End';
  distanceMeters: number;
  lossDb: number;
  reflectanceDb?: number;
  slopeDbKm: number;
  severity: 'normal' | 'warning' | 'critical';
}

const DEFAULT_EVENTS: OtdrEvent[] = [
  { id: 1, type: 'Front Connector', distanceMeters: 0, lossDb: 0.45, reflectanceDb: -42, slopeDbKm: 0.35, severity: 'normal' },
  { id: 2, type: 'Splice (Non-Reflective)', distanceMeters: 2450, lossDb: 0.02, slopeDbKm: 0.35, severity: 'normal' },
  { id: 3, type: 'Splice (Non-Reflective)', distanceMeters: 5120, lossDb: 0.48, slopeDbKm: 0.35, severity: 'warning' },
  { id: 4, type: 'Connector', distanceMeters: 8300, lossDb: 0.35, reflectanceDb: -45, slopeDbKm: 0.34, severity: 'normal' },
  { id: 5, type: 'Fiber Cut / End', distanceMeters: 12400, lossDb: 18.5, reflectanceDb: -14, slopeDbKm: 0.35, severity: 'critical' },
];

export const OtdrSimulator: React.FC = () => {
  const [wavelength, setWavelength] = useState<'1310nm' | '1550nm'>('1310nm');
  const [selectedEventId, setSelectedEventId] = useState<number>(3);
  const [markerA, setMarkerA] = useState<number>(1000); // meters
  const [markerB, setMarkerB] = useState<number>(7000); // meters

  const selectedEvent = DEFAULT_EVENTS.find((e) => e.id === selectedEventId) || DEFAULT_EVENTS[0];

  // Calculate attenuation between markers
  const deltaDistanceKm = Math.abs(markerB - markerA) / 1000;
  const slopeCoeff = wavelength === '1310nm' ? 0.35 : 0.22;
  const deltaLossDb = (deltaDistanceKm * slopeCoeff).toFixed(2);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 text-slate-100 shadow-xl">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 text-xs font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-full">
              Simulasi Praktik #6
            </span>
            <h3 className="text-lg font-bold text-white">Simulator Jejak Grafik OTDR (Optical Time Domain Reflectometer)</h3>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Analisis kurva Rayleigh backscatter, event reflektif (konektor), event non-reflektif (sambungan fusion), dan deteksi jarak putus kabel.
          </p>
        </div>

        {/* Wavelength Switch */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 font-mono">Panjang Gelombang:</span>
          <div className="bg-slate-950 p-1 rounded-lg border border-slate-800 flex text-xs">
            <button
              onClick={() => setWavelength('1310nm')}
              className={`px-3 py-1 rounded font-medium transition ${
                wavelength === '1310nm' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              1310 nm (0.35 dB/km)
            </button>
            <button
              onClick={() => setWavelength('1550nm')}
              className={`px-3 py-1 rounded font-medium transition ${
                wavelength === '1550nm' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              1550 nm (0.22 dB/km)
            </button>
          </div>
        </div>
      </div>

      {/* Main OTDR Graph (SVG) */}
      <div className="bg-slate-950 p-5 rounded-xl border border-slate-800 mb-5 overflow-hidden">
        <div className="flex items-center justify-between text-xs font-mono text-slate-400 mb-2">
          <span>KURVA JEJAK REDAMAN OTDR (TRACE REFLECTOMETRY)</span>
          <span>Panjang Bentang: 12.4 Km | Pulse Width: 100 ns | IOR: 1.4682</span>
        </div>

        <svg viewBox="0 0 800 260" className="w-full h-60 bg-black rounded-lg border border-slate-800">
          {/* Grid lines */}
          <line x1="50" y1="40" x2="780" y2="40" stroke="#1e293b" />
          <line x1="50" y1="90" x2="780" y2="90" stroke="#1e293b" />
          <line x1="50" y1="140" x2="780" y2="140" stroke="#1e293b" />
          <line x1="50" y1="190" x2="780" y2="190" stroke="#1e293b" />
          <line x1="50" y1="230" x2="780" y2="230" stroke="#334155" strokeWidth="2" />

          {/* Y Axis Labels (dB) */}
          <text x="15" y="45" fill="#64748b" fontSize="10" fontFamily="monospace">40 dB</text>
          <text x="15" y="95" fill="#64748b" fontSize="10" fontFamily="monospace">30 dB</text>
          <text x="15" y="145" fill="#64748b" fontSize="10" fontFamily="monospace">20 dB</text>
          <text x="15" y="195" fill="#64748b" fontSize="10" fontFamily="monospace">10 dB</text>
          <text x="15" y="235" fill="#64748b" fontSize="10" fontFamily="monospace">0 dB</text>

          {/* Distance Ticks X Axis (0 to 14 km) */}
          {[0, 2, 4, 6, 8, 10, 12, 14].map((km) => {
            const x = 50 + (km / 14) * 720;
            return (
              <g key={km}>
                <line x1={x} y1="230" x2={x} y2="236" stroke="#475569" />
                <text x={x} y="248" fill="#94a3b8" fontSize="10" textAnchor="middle" fontFamily="monospace">
                  {km} km
                </text>
              </g>
            );
          })}

          {/* Marker A & B lines */}
          <line
            x1={50 + (markerA / 14000) * 720}
            y1="30"
            x2={50 + (markerA / 14000) * 720}
            y2="230"
            stroke="#38bdf8"
            strokeWidth="1.5"
            strokeDasharray="4 2"
          />
          <text x={50 + (markerA / 14000) * 720} y="25" fill="#38bdf8" fontSize="10" fontWeight="bold" textAnchor="middle">
            A ({markerA}m)
          </text>

          <line
            x1={50 + (markerB / 14000) * 720}
            y1="30"
            x2={50 + (markerB / 14000) * 720}
            y2="230"
            stroke="#f59e0b"
            strokeWidth="1.5"
            strokeDasharray="4 2"
          />
          <text x={50 + (markerB / 14000) * 720} y="25" fill="#f59e0b" fontSize="10" fontWeight="bold" textAnchor="middle">
            B ({markerB}m)
          </text>

          {/* Actual OTDR Rayleigh Trace Path */}
          {/* 
            x0 = 50 (0m, 40dB)
            Spike at 0m up to 15dB
            Slope from 0 to 2450m
            Splice at 2450m (step down)
            Slope from 2450m to 5120m
            High Loss Splice at 5120m (sharp step down)
            Slope from 5120 to 8300m
            Connector at 8300m (spike + step down)
            Slope from 8300 to 12400m
            Fresnel Cut at 12400m (huge spike + drops to noise floor)
          */}
          <path
            d="
              M 50 210 
              L 50 50 
              L 54 80 
              L 176 102 
              L 176 104 
              L 313 126 
              L 313 148 
              L 476 172 
              L 476 110 
              L 480 180 
              L 687 210 
              L 687 70 
              L 692 230 
              L 770 230
            "
            fill="none"
            stroke="#22c55e"
            strokeWidth="2.5"
          />

          {/* Event Hotspot Markers */}
          {DEFAULT_EVENTS.map((evt) => {
            const x = 50 + (evt.distanceMeters / 14000) * 720;
            const isSelected = selectedEventId === evt.id;

            return (
              <g
                key={evt.id}
                onClick={() => setSelectedEventId(evt.id)}
                className="cursor-pointer group"
              >
                <circle
                  cx={x}
                  cy="90"
                  r={isSelected ? '7' : '5'}
                  fill={
                    evt.severity === 'critical'
                      ? '#ef4444'
                      : evt.severity === 'warning'
                      ? '#f59e0b'
                      : '#38bdf8'
                  }
                  stroke="#ffffff"
                  strokeWidth="1.5"
                />
                <text
                  x={x}
                  y="75"
                  fill="#ffffff"
                  fontSize="9"
                  fontFamily="monospace"
                  textAnchor="middle"
                  className="font-bold opacity-80 group-hover:opacity-100"
                >
                  #{evt.id}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Interactive Markers Slider */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-950 p-4 rounded-xl border border-slate-800 mb-5 text-xs">
        <div>
          <div className="flex justify-between mb-1">
            <span className="text-slate-400">Posisi Kursor Marker A:</span>
            <span className="text-sky-400 font-mono font-bold">{markerA} meter</span>
          </div>
          <input
            type="range"
            min="0"
            max="12400"
            step="100"
            value={markerA}
            onChange={(e) => setMarkerA(parseInt(e.target.value, 10))}
            className="w-full accent-sky-500 cursor-pointer"
          />
        </div>

        <div>
          <div className="flex justify-between mb-1">
            <span className="text-slate-400">Posisi Kursor Marker B:</span>
            <span className="text-amber-400 font-mono font-bold">{markerB} meter</span>
          </div>
          <input
            type="range"
            min="0"
            max="12400"
            step="100"
            value={markerB}
            onChange={(e) => setMarkerB(parseInt(e.target.value, 10))}
            className="w-full accent-amber-500 cursor-pointer"
          />
        </div>

        <div className="md:col-span-2 pt-2 border-t border-slate-800/80 flex flex-wrap items-center justify-between text-xs text-slate-300">
          <span>
            Jarak Antar Marker (&Delta;d): <strong className="text-white font-mono">{deltaDistanceKm.toFixed(2)} Km</strong>
          </span>
          <span>
            Estimasi Redaman (&Delta;Loss): <strong className="text-emerald-400 font-mono">{deltaLossDb} dB</strong>
          </span>
          <span>
            Kemiringan Serat (Loss/Km): <strong className="text-white font-mono">{slopeCoeff} dB/km</strong>
          </span>
        </div>
      </div>

      {/* Events Table */}
      <div className="bg-slate-950 rounded-xl border border-slate-800 overflow-hidden mb-5">
        <div className="p-3 bg-slate-900 border-b border-slate-800 font-bold text-xs text-white flex items-center justify-between">
          <span>TABEL EVENT JEJAK OTDR (EVENT TABLE)</span>
          <span className="text-slate-400 font-mono text-[11px]">5 Titik Terdeteksi</span>
        </div>
        <div className="overflow-x-auto text-xs">
          <table className="w-full text-left font-mono">
            <thead className="bg-slate-900/60 text-slate-400 text-[10px] uppercase border-b border-slate-800">
              <tr>
                <th className="p-2.5">No</th>
                <th className="p-2.5">Tipe Event</th>
                <th className="p-2.5">Jarak (m)</th>
                <th className="p-2.5">Loss (dB)</th>
                <th className="p-2.5">Reflektansi</th>
                <th className="p-2.5">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {DEFAULT_EVENTS.map((evt) => {
                const isSelected = evt.id === selectedEventId;
                return (
                  <tr
                    key={evt.id}
                    onClick={() => setSelectedEventId(evt.id)}
                    className={`cursor-pointer transition ${
                      isSelected ? 'bg-blue-950/60 font-bold text-white' : 'hover:bg-slate-900/40 text-slate-300'
                    }`}
                  >
                    <td className="p-2.5">#{evt.id}</td>
                    <td className="p-2.5">{evt.type}</td>
                    <td className="p-2.5">{evt.distanceMeters.toLocaleString()} m</td>
                    <td className="p-2.5">{evt.lossDb} dB</td>
                    <td className="p-2.5">{evt.reflectanceDb ? `${evt.reflectanceDb} dB` : '-'}</td>
                    <td className="p-2.5">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] ${
                          evt.severity === 'critical'
                            ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                            : evt.severity === 'warning'
                            ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                            : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        }`}
                      >
                        {evt.severity === 'critical' ? 'PUTUS TOTAL' : evt.severity === 'warning' ? 'HIGH LOSS' : 'GOOD'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Selected Event Diagnostic Detail */}
      <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-xs">
        <h4 className="font-bold text-sm text-white mb-2 flex items-center gap-2">
          <Activity className="w-4 h-4 text-emerald-400" />
          Detail Analisis Event Terpilih: #{selectedEvent.id} - {selectedEvent.type} di Jarak {selectedEvent.distanceMeters} Meter
        </h4>
        <div className="text-slate-300 leading-relaxed">
          {selectedEvent.id === 3 && (
            <p className="text-amber-200">
              <strong>Penyebab Peringatan:</strong> Event pada jarak 5.120 meter memiliki redaman sambungan sebesar 0.48 dB (standar maksimal: 0.03 dB).
              Ini merupakan indikasi <em>High Loss Fusion Splice</em> yang buruk, kemungkinan akibat potongan cleave miring atau debu di V-groove.
              Tindakan: Buka closure sambungan di patok KM 5.12 dan lakukan penyambungan ulang (re-splicing).
            </p>
          )}
          {selectedEvent.id === 5 && (
            <p className="text-red-300">
              <strong>Penyebab Kritis:</strong> Pada jarak 12.400 meter terjadi reflektansi Fresnel tajam (-14 dB) dan sinyal jatuh ke noise floor.
              Ini menandakan titik ujung akhir kabel atau <em>Fiber Cut</em> (kabel putus akibat benturan benda tajam/galian tanah).
              Jarak lapangan fisik: ~12.15 km (dengan helix factor 1.02).
            </p>
          )}
          {selectedEvent.id !== 3 && selectedEvent.id !== 5 && (
            <p>
              Event #{selectedEvent.id} berada dalam batas operasional normal industri. Integritas transmisi optik memenuhi syarat baku telekomunikasi ITU-T G.652.D.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
