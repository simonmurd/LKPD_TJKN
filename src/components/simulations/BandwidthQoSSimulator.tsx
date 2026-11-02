import React, { useState, useEffect } from 'react';
import { Gauge, Sliders, Layers, BarChart2, ShieldCheck, AlertOctagon } from 'lucide-react';

interface ClientTraffic {
  id: string;
  name: string;
  category: 'CBT Ujian' | 'Streaming Video' | 'Browsing Web' | 'Download File';
  requestedSpeedMbps: number;
  priority: number; // 1 (highest) to 8 (lowest)
}

export const BandwidthQoSSimulator: React.FC = () => {
  const [totalPipeMbps, setTotalPipeMbps] = useState<number>(50);
  const [qosEnabled, setQosEnabled] = useState<boolean>(true);
  const [cbtLimitAtMbps, setCbtLimitAtMbps] = useState<number>(25); // CIR
  const [cbtMaxLimitMbps, setCbtMaxLimitMbps] = useState<number>(45); // MIR
  const [burstActive, setBurstActive] = useState<boolean>(false);

  // Active traffic clients
  const [clients, setClients] = useState<ClientTraffic[]>([
    { id: 'c1', name: 'Lab CBT Ujian Online (160 Siswa)', category: 'CBT Ujian', requestedSpeedMbps: 30, priority: 1 },
    { id: 'c2', name: 'Streaming Video YouTube 4K (Guru)', category: 'Streaming Video', requestedSpeedMbps: 25, priority: 6 },
    { id: 'c3', name: 'Download Update File ISO (Siswa)', category: 'Download File', requestedSpeedMbps: 35, priority: 8 },
  ]);

  // Calculate allocated bandwidth per client based on QoS vs FIFO
  const totalRequested = clients.reduce((acc, c) => acc + c.requestedSpeedMbps, 0);

  const calculateAllocations = () => {
    if (!qosEnabled) {
      // FIFO / Best-Effort without QoS: bandwidth divided purely proportional or first come, heavy congestion
      const ratio = Math.min(1, totalPipeMbps / totalRequested);
      return clients.map((c) => ({
        ...c,
        allocatedMbps: parseFloat((c.requestedSpeedMbps * ratio).toFixed(1)),
        isCongested: ratio < 0.8,
      }));
    }

    // QoS HTB / Priority Queue Enabled
    // 1. Give CBT its guaranteed CIR first
    const cbtClient = clients.find((c) => c.category === 'CBT Ujian')!;
    const cbtAllocated = Math.min(cbtClient.requestedSpeedMbps, cbtMaxLimitMbps);
    const remainingPipe = Math.max(0, totalPipeMbps - cbtAllocated);

    // 2. Divide remaining amongst other clients according to priority
    const otherClients = clients.filter((c) => c.category !== 'CBT Ujian');
    const otherRequested = otherClients.reduce((acc, c) => acc + c.requestedSpeedMbps, 0);
    const otherRatio = otherRequested > 0 ? Math.min(1, remainingPipe / otherRequested) : 1;

    return clients.map((c) => {
      if (c.category === 'CBT Ujian') {
        return {
          ...c,
          allocatedMbps: cbtAllocated,
          isCongested: false,
        };
      }
      return {
        ...c,
        allocatedMbps: parseFloat((c.requestedSpeedMbps * otherRatio).toFixed(1)),
        isCongested: otherRatio < 0.7,
      };
    });
  };

  const allocations = calculateAllocations();
  const currentTotalUsed = allocations.reduce((acc, c) => acc + c.allocatedMbps, 0);
  const isPipeMaxed = currentTotalUsed >= totalPipeMbps;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 text-slate-100 shadow-xl">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 text-xs font-semibold bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded-full">
              Simulasi Praktik #7
            </span>
            <h3 className="text-lg font-bold text-white">Simulator Manajemen Bandwidth & QoS (MikroTik HTB/PCQ)</h3>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Menganalisis dampak algoritma Hierarchical Token Bucket (HTB) dan jaminan CIR (Limit-at) terhadap traffic krusial Ujian CBT sekolah.
          </p>
        </div>

        {/* QoS Switch */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setQosEnabled(!qosEnabled)}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition shadow ${
              qosEnabled
                ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-500/20'
                : 'bg-red-600 hover:bg-red-500 text-white shadow-red-500/20'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            {qosEnabled ? 'QoS Priority: AKTIF' : 'QoS: NONAKTIF (FIFO Bebas)'}
          </button>
        </div>
      </div>

      {/* Main Bandwidth Gauge & Pipe Meter */}
      <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 mb-5">
        <div className="flex flex-wrap items-center justify-between text-xs font-mono text-slate-400 mb-2">
          <span>KAPASITAS TOTAL PIPA BANDWIDTH ISP: {totalPipeMbps} Mbps</span>
          <span>TERPAKAI: {currentTotalUsed.toFixed(1)} / {totalPipeMbps} Mbps ({((currentTotalUsed / totalPipeMbps) * 100).toFixed(0)}%)</span>
        </div>

        {/* Stacked Bandwidth Bar */}
        <div className="h-7 w-full bg-slate-900 rounded-lg overflow-hidden flex border border-slate-800 p-0.5 mb-3">
          {allocations.map((a) => {
            const widthPct = (a.allocatedMbps / totalPipeMbps) * 100;
            const barColor =
              a.category === 'CBT Ujian'
                ? 'bg-emerald-500'
                : a.category === 'Streaming Video'
                ? 'bg-blue-500'
                : 'bg-amber-500';

            return (
              <div
                key={a.id}
                style={{ width: `${widthPct}%` }}
                className={`${barColor} h-full transition-all duration-300 relative group flex items-center justify-center`}
                title={`${a.name}: ${a.allocatedMbps} Mbps`}
              >
                {widthPct > 15 && (
                  <span className="text-[10px] font-bold text-slate-950 truncate px-1 font-mono">
                    {a.allocatedMbps}M
                  </span>
                )}
              </div>
            );
          })}
        </div>

        {/* Warning if total pipe saturated */}
        {isPipeMaxed && (
          <div className="flex items-center gap-2 text-xs text-amber-400 bg-amber-950/30 p-2 rounded border border-amber-500/30">
            <AlertOctagon className="w-4 h-4 shrink-0" />
            <span>Pipa Bandwidth 100% Penuh (Saturated Link). Mekanisme antrean router sedang melakukan traffic shaping / drop.</span>
          </div>
        )}
      </div>

      {/* Clients Traffic Table */}
      <div className="space-y-3 mb-5">
        <div className="text-xs font-semibold text-slate-300">Daftar Antrean Klien Aktif (Queue List):</div>
        {allocations.map((client) => (
          <div
            key={client.id}
            className={`p-3.5 rounded-xl border transition ${
              client.category === 'CBT Ujian'
                ? 'bg-emerald-950/30 border-emerald-500/40'
                : 'bg-slate-950 border-slate-800'
            }`}
          >
            <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
              <div className="flex items-center gap-2">
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    client.priority === 1
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : client.priority <= 6
                      ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                      : 'bg-slate-800 text-slate-400 border border-slate-700'
                  }`}
                >
                  Priority {client.priority}
                </span>
                <span className="font-bold text-xs text-white">{client.name}</span>
              </div>

              <div className="text-xs font-mono">
                <span className="text-slate-400">Alokasi: </span>
                <strong
                  className={
                    client.isCongested
                      ? 'text-red-400'
                      : client.category === 'CBT Ujian'
                      ? 'text-emerald-400'
                      : 'text-white'
                  }
                >
                  {client.allocatedMbps} Mbps
                </strong>{' '}
                <span className="text-slate-500">/ Minta {client.requestedSpeedMbps} Mbps</span>
              </div>
            </div>

            {/* Sub Bar */}
            <div className="w-full bg-slate-900 rounded-full h-2 overflow-hidden border border-slate-800">
              <div
                className={`h-full transition-all duration-300 ${
                  client.category === 'CBT Ujian'
                    ? 'bg-emerald-500'
                    : client.isCongested
                    ? 'bg-red-500'
                    : 'bg-blue-500'
                }`}
                style={{ width: `${Math.min(100, (client.allocatedMbps / client.requestedSpeedMbps) * 100)}%` }}
              />
            </div>

            {client.isCongested && (
              <div className="text-[10px] text-red-400 mt-1.5 flex items-center gap-1 font-mono">
                <span>✕ Paket mengalami pelambatan (Packet Throttled / Dropped)</span>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* HTB Configuration Sliders for CBT */}
      {qosEnabled && (
        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 mb-5 text-xs">
          <div className="font-bold text-sm text-white mb-3 flex items-center gap-2">
            <Sliders className="w-4 h-4 text-emerald-400" />
            Parameter Simple Queue Ujian CBT:
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-slate-400">Limit-At (CIR / Garansi Minimum):</span>
                <span className="font-bold text-emerald-400 font-mono">{cbtLimitAtMbps} Mbps</span>
              </div>
              <input
                type="range"
                min="10"
                max="40"
                value={cbtLimitAtMbps}
                onChange={(e) => setCbtLimitAtMbps(parseInt(e.target.value, 10))}
                className="w-full accent-emerald-500 cursor-pointer"
              />
            </div>
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-slate-400">Max-Limit (MIR / Kecepatan Tertinggi):</span>
                <span className="font-bold text-blue-400 font-mono">{cbtMaxLimitMbps} Mbps</span>
              </div>
              <input
                type="range"
                min="20"
                max="50"
                value={cbtMaxLimitMbps}
                onChange={(e) => setCbtMaxLimitMbps(parseInt(e.target.value, 10))}
                className="w-full accent-blue-500 cursor-pointer"
              />
            </div>
          </div>
        </div>
      )}

      {/* Comparative Analysis */}
      <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-xs text-slate-300">
        <h4 className="font-bold text-white mb-1">Kesimpulan Pengamatan Siswa SMK:</h4>
        <p className="leading-relaxed">
          {qosEnabled ? (
            <span className="text-emerald-200">
              Dengan <strong>Quality of Service (QoS HTB)</strong> aktif, paket Ujian CBT terjamin mendapatkan 30 Mbps penuh (Priority 1 dan CIR tercukupi).
              Siswa tidak akan mengalami error atau logout saat ujian, sementara unduhan file besar otomatis ditekan kecepatannya saat jam ujian berlangsung.
            </span>
          ) : (
            <span className="text-red-300">
              Tanpa QoS (Sistem FIFO murni), unduhan file ISO dan streaming video rakus memonopoli bandwidth.
              Akibatnya alokasi server CBT anjlok hingga {allocations[0].allocatedMbps} Mbps, memicu time-out halaman ujian siswa (Bufferbloat)!
            </span>
          )}
        </p>
      </div>
    </div>
  );
};
