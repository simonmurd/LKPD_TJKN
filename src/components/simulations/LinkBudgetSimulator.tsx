import React, { useState } from 'react';
import { Compass, ShieldCheck, AlertCircle, Mountain, ArrowRight } from 'lucide-react';

export const LinkBudgetSimulator: React.FC = () => {
  // Input parameters
  const [distanceKm, setDistanceKm] = useState<number>(10);
  const [frequencyGhz, setFrequencyGhz] = useState<number>(5.8);
  const [txPowerDbm, setTxPowerDbm] = useState<number>(24);
  const [txAntennaGainDbi, setTxAntennaGainDbi] = useState<number>(30);
  const [rxAntennaGainDbi, setRxAntennaGainDbi] = useState<number>(30);
  const [cableLossDb, setCableLossDb] = useState<number>(1.0);
  const [rxSensitivityDbm, setRxSensitivityDbm] = useState<number>(-75);
  const [obstacleHeightM, setObstacleHeightM] = useState<number>(10);

  // Calculations
  // FSPL (dB) = 92.45 + 20*log10(d in km) + 20*log10(f in GHz)
  const fspl =
    92.45 +
    20 * Math.log10(Math.max(distanceKm, 0.1)) +
    20 * Math.log10(frequencyGhz);

  // RSL = TxPower + TxGain - TxCable - FSPL + RxGain - RxCable
  const rsl =
    txPowerDbm +
    txAntennaGainDbi -
    cableLossDb -
    fspl +
    rxAntennaGainDbi -
    cableLossDb;

  // Fade Margin = RSL - RxSensitivity
  const fadeMargin = rsl - rxSensitivityDbm;

  // 1st Fresnel Zone Radius at midpoint: r1 = 17.32 * sqrt((d1 * d2) / (f * D))
  // At midpoint d1 = d2 = D / 2: r1 = 17.32 * sqrt((D/2 * D/2) / (f * D)) = 17.32 * sqrt(D / (4 * f))
  const fresnelRadiusM =
    17.32 * Math.sqrt(Math.max(distanceKm, 0.1) / (4 * frequencyGhz));
  const clearance60PctM = fresnelRadiusM * 0.6;

  // Earth Bulge at midpoint: h = (d1 * d2) / 12.74
  const earthBulgeM = ((distanceKm / 2) * (distanceKm / 2)) / 12.74;

  const totalObstacleImpactM = obstacleHeightM + earthBulgeM;
  const isFresnelBlocked = totalObstacleImpactM > clearance60PctM * 1.5;

  let linkRating: 'Sangat Bagus' | 'Bagus' | 'Marginal' | 'Gagal Link' = 'Gagal Link';
  let ratingColor = 'text-red-400 bg-red-950/40 border-red-500/50';

  if (fadeMargin >= 20 && !isFresnelBlocked) {
    linkRating = 'Sangat Bagus';
    ratingColor = 'text-emerald-400 bg-emerald-950/40 border-emerald-500/50';
  } else if (fadeMargin >= 15 && !isFresnelBlocked) {
    linkRating = 'Bagus';
    ratingColor = 'text-blue-400 bg-blue-950/40 border-blue-500/50';
  } else if (fadeMargin >= 8) {
    linkRating = 'Marginal';
    ratingColor = 'text-amber-400 bg-amber-950/40 border-amber-500/50';
  }

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 text-slate-100 shadow-xl">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 text-xs font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-full">
              Simulasi Praktik #4
            </span>
            <h3 className="text-lg font-bold text-white">Kalkulator Link Budget & Line of Sight (LoS) Outdoor</h3>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Hitung Free Space Path Loss (FSPL), RSL, Fade Margin cuaca tropis, dan radius kelayakan Fresnel Zone.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 font-mono">Frekuensi:</span>
          <div className="bg-slate-950 p-1 rounded-lg border border-slate-800 flex text-xs">
            <button
              onClick={() => setFrequencyGhz(5.8)}
              className={`px-3 py-1 rounded font-medium transition ${
                frequencyGhz === 5.8 ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              5.8 GHz ISM
            </button>
            <button
              onClick={() => setFrequencyGhz(2.4)}
              className={`px-3 py-1 rounded font-medium transition ${
                frequencyGhz === 2.4 ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              2.4 GHz
            </button>
          </div>
        </div>
      </div>

      {/* Main Diagram Area (SVG) */}
      <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 mb-5 overflow-hidden">
        <div className="text-xs font-mono text-slate-400 mb-2 flex items-center justify-between">
          <span>PROFIL LINTASAN KELENGKUNGAN BUMI & ELLIPSOID FRESNEL ZONE KE-1</span>
          <span>Jarak: {distanceKm} Km | Radius F1: {fresnelRadiusM.toFixed(1)} m</span>
        </div>

        <svg viewBox="0 0 700 200" className="w-full h-44 bg-slate-900/90 rounded-lg border border-slate-800">
          {/* Curved Earth Ground */}
          <path
            d="M 30 180 Q 350 160 670 180 L 670 200 L 30 200 Z"
            fill="#1e293b"
            stroke="#334155"
          />

          {/* Transmitter Tower (Left) */}
          <g transform="translate(60, 90)">
            <line x1="0" y1="90" x2="0" y2="0" stroke="#94a3b8" strokeWidth="3" />
            <line x1="-12" y1="90" x2="0" y2="0" stroke="#64748b" strokeWidth="1.5" />
            <line x1="12" y1="90" x2="0" y2="0" stroke="#64748b" strokeWidth="1.5" />
            <circle cx="0" cy="0" r="5" fill="#38bdf8" />
            <text x="0" y="-8" fill="#38bdf8" fontSize="10" fontWeight="bold" textAnchor="middle">
              Tx Tower (SMK)
            </text>
          </g>

          {/* Receiver Tower (Right) */}
          <g transform="translate(640, 90)">
            <line x1="0" y1="90" x2="0" y2="0" stroke="#94a3b8" strokeWidth="3" />
            <line x1="-12" y1="90" x2="0" y2="0" stroke="#64748b" strokeWidth="1.5" />
            <line x1="12" y1="90" x2="0" y2="0" stroke="#64748b" strokeWidth="1.5" />
            <circle cx="0" cy="0" r="5" fill="#a855f7" />
            <text x="0" y="-8" fill="#a855f7" fontSize="10" fontWeight="bold" textAnchor="middle">
              Rx Tower (Klien)
            </text>
          </g>

          {/* Direct Line of Sight (LOS) Ray */}
          <line x1="60" y1="90" x2="640" y2="90" stroke="#38bdf8" strokeWidth="1.5" strokeDasharray="4 2" />

          {/* 1st Fresnel Ellipsoid */}
          <ellipse
            cx="350"
            cy="90"
            rx="290"
            ry={Math.min(fresnelRadiusM * 2.2, 55)}
            fill="none"
            stroke="#22c55e"
            strokeWidth="1.5"
            strokeDasharray="6 3"
            opacity="0.8"
          />

          {/* 60% Clearance Boundary */}
          <ellipse
            cx="350"
            cy="90"
            rx="290"
            ry={Math.min(clearance60PctM * 2.2, 33)}
            fill="#22c55e"
            fillOpacity="0.08"
            stroke="#10b981"
            strokeWidth="1"
            opacity="0.9"
          />

          {/* Midpoint Obstacle (Tree / Hill) */}
          <g transform="translate(350, 168)">
            {/* Earth Bulge Curve */}
            <circle cx="0" cy="0" r={obstacleHeightM * 1.5 + 4} fill="#0f766e" opacity="0.8" />
            <path
              d={`M -15 0 L 0 -${obstacleHeightM * 2.5} L 15 0 Z`}
              fill={isFresnelBlocked ? '#ef4444' : '#14b8a6'}
            />
            <text x="0" y={`-${obstacleHeightM * 2.5 + 5}`} fill="#cbd5e1" fontSize="9" textAnchor="middle">
              Halangan: {obstacleHeightM}m
            </text>
          </g>
        </svg>
      </div>

      {/* Control Sliders Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5 text-xs">
        {/* Distance Slider */}
        <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800">
          <div className="flex justify-between mb-1">
            <span className="text-slate-400">Jarak Tautan (Distance):</span>
            <span className="font-bold text-white font-mono">{distanceKm} Km</span>
          </div>
          <input
            type="range"
            min="1"
            max="30"
            step="0.5"
            value={distanceKm}
            onChange={(e) => setDistanceKm(parseFloat(e.target.value))}
            className="w-full accent-blue-500 cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-slate-500 mt-1">
            <span>1 Km</span>
            <span>15 Km</span>
            <span>30 Km</span>
          </div>
        </div>

        {/* Tx Power & Antenna */}
        <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800">
          <div className="flex justify-between mb-1">
            <span className="text-slate-400">Daya Pancar Tx Power:</span>
            <span className="font-bold text-white font-mono">{txPowerDbm} dBm</span>
          </div>
          <input
            type="range"
            min="10"
            max="28"
            value={txPowerDbm}
            onChange={(e) => setTxPowerDbm(parseInt(e.target.value, 10))}
            className="w-full accent-blue-500 cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-slate-500 mt-1">
            <span>10 dBm</span>
            <span>20 dBm (100mW)</span>
            <span>28 dBm (630mW)</span>
          </div>
        </div>

        {/* Antennas Gain */}
        <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800">
          <div className="flex justify-between mb-1">
            <span className="text-slate-400">Penguatan Antena Dish (Gain):</span>
            <span className="font-bold text-white font-mono">{txAntennaGainDbi} dBi</span>
          </div>
          <input
            type="range"
            min="16"
            max="34"
            step="1"
            value={txAntennaGainDbi}
            onChange={(e) => {
              const val = parseInt(e.target.value, 10);
              setTxAntennaGainDbi(val);
              setRxAntennaGainDbi(val);
            }}
            className="w-full accent-blue-500 cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-slate-500 mt-1">
            <span>Grid 16 dBi</span>
            <span>Dish 24 dBi</span>
            <span>Solid Dish 34 dBi</span>
          </div>
        </div>
      </div>

      {/* Calculated Results Summary Panel */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
        <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800">
          <div className="text-[10px] uppercase font-mono text-slate-400">Path Loss (FSPL)</div>
          <div className="text-lg font-bold text-white mt-1 font-mono">{fspl.toFixed(1)} dB</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Pelemahan ruang bebas</div>
        </div>

        <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800">
          <div className="text-[10px] uppercase font-mono text-slate-400">Sinyal Terima (RSL)</div>
          <div className="text-lg font-bold text-sky-400 mt-1 font-mono">{rsl.toFixed(1)} dBm</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Target: &gt; -65 dBm</div>
        </div>

        <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800">
          <div className="text-[10px] uppercase font-mono text-slate-400">Fade Margin</div>
          <div
            className={`text-lg font-bold mt-1 font-mono ${
              fadeMargin >= 20 ? 'text-emerald-400' : fadeMargin >= 10 ? 'text-amber-400' : 'text-red-400'
            }`}
          >
            +{fadeMargin.toFixed(1)} dB
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">Ambang min: +15 dB</div>
        </div>

        <div className={`p-3.5 rounded-xl border ${ratingColor}`}>
          <div className="text-[10px] uppercase font-mono">Status Kelayakan Link</div>
          <div className="text-sm font-bold mt-1">{linkRating}</div>
          <div className="text-[10px] mt-0.5 opacity-80">
            {isFresnelBlocked ? 'Fresnel Terhalang!' : 'Fresnel LoS Bersih'}
          </div>
        </div>
      </div>

      {/* Technical Formula Explanation */}
      <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-xs">
        <h4 className="font-bold text-white mb-2 flex items-center gap-2">
          <Compass className="w-4 h-4 text-emerald-400" />
          Rumus Perhitungan Standar Industri:
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-slate-300 font-mono text-[11px]">
          <div className="bg-slate-900 p-2.5 rounded border border-slate-800">
            <span className="text-slate-400">1. Free Space Path Loss (FSPL):</span>
            <div className="text-emerald-400 mt-1">FSPL = 92.45 + 20·log10(d) + 20·log10(f)</div>
            <div className="text-slate-500 text-[10px] mt-0.5">
              = 92.45 + 20·log10({distanceKm}) + 20·log10({frequencyGhz}) = {fspl.toFixed(2)} dB
            </div>
          </div>
          <div className="bg-slate-900 p-2.5 rounded border border-slate-800">
            <span className="text-slate-400">2. Received Signal Level (RSL):</span>
            <div className="text-sky-400 mt-1">RSL = TxP + TxG - C_Tx - FSPL + RxG - C_Rx</div>
            <div className="text-slate-500 text-[10px] mt-0.5">
              = {txPowerDbm} + {txAntennaGainDbi} - {cableLossDb} - {fspl.toFixed(1)} + {rxAntennaGainDbi} - {cableLossDb} = {rsl.toFixed(1)} dBm
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
