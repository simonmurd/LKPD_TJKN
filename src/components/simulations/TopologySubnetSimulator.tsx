import React, { useState } from 'react';
import { Network, Terminal, Send, CheckCircle2, XCircle, Router, Wifi, Laptop, Server } from 'lucide-react';

interface DeviceNode {
  id: string;
  name: string;
  type: 'router' | 'switch' | 'ap' | 'pc_guru' | 'pc_siswa' | 'server';
  ip: string;
  vlan: number;
  mac: string;
}

const TOPOLOGY_DEVICES: DeviceNode[] = [
  { id: 'router1', name: 'Core Router (ROAS)', type: 'router', ip: '192.168.10.1 & 192.168.20.1', vlan: 1, mac: '00:1A:2B:3C:4D:01' },
  { id: 'switch1', name: 'Distribution Switch 802.1Q', type: 'switch', ip: '192.168.1.2 (Mgmt)', vlan: 1, mac: '00:1A:2B:3C:4D:02' },
  { id: 'ap1', name: 'Access Point Enterprise', type: 'ap', ip: '192.168.1.10', vlan: 1, mac: '00:1A:2B:3C:4D:03' },
  { id: 'pc_guru', name: 'PC Ruang Guru (VLAN 10)', type: 'pc_guru', ip: '192.168.10.15', vlan: 10, mac: '00:1A:2B:AA:11:01' },
  { id: 'pc_siswa', name: 'Laptop Siswa Wi-Fi (VLAN 20)', type: 'pc_siswa', ip: '192.168.20.45', vlan: 20, mac: '00:1A:2B:BB:22:02' },
  { id: 'server_cbt', name: 'Server Ujian CBT (VLAN 10)', type: 'server', ip: '192.168.10.200', vlan: 10, mac: '00:1A:2B:CC:33:03' },
];

export const TopologySubnetSimulator: React.FC = () => {
  const [sourceDevId, setSourceDevId] = useState<string>('pc_guru');
  const [destDevId, setDestDevId] = useState<string>('server_cbt');
  const [isInterVlanRoutingEnabled, setIsInterVlanRoutingEnabled] = useState<boolean>(true);
  const [isTrunkConfigured, setIsTrunkConfigured] = useState<boolean>(true);
  const [pingLog, setPingLog] = useState<string[]>([
    'Terminal Simulator Siap. Pilih perangkat Sumber (Source) dan Tujuan (Destination) lalu klik "Kirim Paket Ping".',
  ]);
  const [isPinging, setIsPinging] = useState<boolean>(false);
  const [pingResult, setPingResult] = useState<'success' | 'failure' | null>(null);

  const sourceDev = TOPOLOGY_DEVICES.find((d) => d.id === sourceDevId)!;
  const destDev = TOPOLOGY_DEVICES.find((d) => d.id === destDevId)!;

  const handleSendPing = () => {
    setIsPinging(true);
    setPingResult(null);

    const logs: string[] = [
      `C:\\Users\\TeknisiTKJ> ping ${destDev.ip} -t`,
      `Pinging ${destDev.ip} from ${sourceDev.ip} with 32 bytes of data:`,
    ];

    setTimeout(() => {
      // Check logical rules:
      // Case 1: Same VLAN (e.g. Guru to Server CBT, VLAN 10 to 10)
      if (sourceDev.vlan === destDev.vlan) {
        if (!isTrunkConfigured) {
          logs.push(`Request timed out.`);
          logs.push(`Request timed out.`);
          logs.push(`Ping statistics for ${destDev.ip}: Packets: Sent = 4, Received = 0, Lost = 4 (100% loss)`);
          logs.push(`[DIAGNOSIS]: Port Trunk Switch belum mengizinkan VLAN ${sourceDev.vlan} (VLAN Pruning Error).`);
          setPingResult('failure');
        } else {
          logs.push(`Reply from ${destDev.ip}: bytes=32 time=1ms TTL=64`);
          logs.push(`Reply from ${destDev.ip}: bytes=32 time=1ms TTL=64`);
          logs.push(`Reply from ${destDev.ip}: bytes=32 time=1ms TTL=64`);
          logs.push(`Reply from ${destDev.ip}: bytes=32 time=1ms TTL=64`);
          logs.push(`Ping statistics: Sent = 4, Received = 4, Lost = 0 (0% loss), RTT min/avg/max = 1/1/1 ms`);
          logs.push(`[STATUS]: Intra-VLAN Switching Berhasil (Layer 2 Forwarding).`);
          setPingResult('success');
        }
      } else {
        // Different VLAN (e.g. Siswa VLAN 20 to Server CBT VLAN 10)
        if (!isInterVlanRoutingEnabled) {
          logs.push(`Reply from ${sourceDev.ip}: Destination host unreachable.`);
          logs.push(`Reply from ${sourceDev.ip}: Destination host unreachable.`);
          logs.push(`[DIAGNOSIS]: Inter-VLAN Routing (Router-on-a-Stick dot1Q) tidak aktif pada router.`);
          setPingResult('failure');
        } else if (!isTrunkConfigured) {
          logs.push(`Request timed out.`);
          logs.push(`[DIAGNOSIS]: Trunking 802.1Q antara Switch dan Router belum dikonfigurasi.`);
          setPingResult('failure');
        } else {
          logs.push(`Reply from ${destDev.ip}: bytes=32 time=2ms TTL=63 (Routed via ROAS)`);
          logs.push(`Reply from ${destDev.ip}: bytes=32 time=2ms TTL=63`);
          logs.push(`Reply from ${destDev.ip}: bytes=32 time=2ms TTL=63`);
          logs.push(`Reply from ${destDev.ip}: bytes=32 time=2ms TTL=63`);
          logs.push(`Ping statistics: Sent = 4, Received = 4, Lost = 0 (0% loss), RTT avg = 2 ms`);
          logs.push(`[STATUS]: Inter-VLAN Routing Berhasil melewati Sub-Interface G0/0.10 dan G0/0.20.`);
          setPingResult('success');
        }
      }

      setPingLog(logs);
      setIsPinging(false);
    }, 900);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 text-slate-100 shadow-xl">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 text-xs font-semibold bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 rounded-full">
              Simulasi Praktik #8
            </span>
            <h3 className="text-lg font-bold text-white">Integrasi Topologi Hibrida (VLAN, Trunking, & ROAS)</h3>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Uji komunikasi paket ICMP antar segmen VLAN 10 (Guru) dan VLAN 20 (Siswa) melewati Router-on-a-Stick.
          </p>
        </div>

        {/* Feature Switches */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <button
            onClick={() => setIsInterVlanRoutingEnabled(!isInterVlanRoutingEnabled)}
            className={`px-3 py-1.5 rounded-lg font-semibold border transition ${
              isInterVlanRoutingEnabled
                ? 'bg-emerald-600/30 text-emerald-300 border-emerald-500/50'
                : 'bg-red-600/30 text-red-300 border-red-500/50'
            }`}
          >
            ROAS Routing: {isInterVlanRoutingEnabled ? 'ON' : 'OFF'}
          </button>

          <button
            onClick={() => setIsTrunkConfigured(!isTrunkConfigured)}
            className={`px-3 py-1.5 rounded-lg font-semibold border transition ${
              isTrunkConfigured
                ? 'bg-blue-600/30 text-blue-300 border-blue-500/50'
                : 'bg-slate-800 text-slate-400 border-slate-700'
            }`}
          >
            802.1Q Trunking: {isTrunkConfigured ? 'ON' : 'OFF'}
          </button>
        </div>
      </div>

      {/* Graphical Network Topology Map */}
      <div className="bg-slate-950 p-5 rounded-xl border border-slate-800 mb-5 relative overflow-hidden">
        <div className="text-xs font-mono text-slate-400 mb-3 flex items-center justify-between">
          <span>PETA TOPOLOGI HIBRIDA JARINGAN SEKOLAH</span>
          <span>VLAN 10: 192.168.10.0/24 | VLAN 20: 192.168.20.0/24</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          {/* Router Block */}
          <div className="bg-slate-900 border border-slate-800 p-3.5 rounded-xl text-center flex flex-col items-center">
            <div className="w-12 h-12 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center mb-2">
              <Router className="w-6 h-6" />
            </div>
            <span className="font-bold text-xs text-white">Core Router (ROAS)</span>
            <span className="text-[10px] text-slate-400 font-mono mt-0.5">Sub-if: G0/0.10 & G0/0.20</span>
            <div className="mt-2 text-[10px] px-2 py-0.5 rounded bg-slate-950 border border-slate-800 font-mono text-slate-300">
              Gateway: .10.1 & .20.1
            </div>
          </div>

          {/* Switch Block */}
          <div className="bg-slate-900 border border-slate-800 p-3.5 rounded-xl text-center flex flex-col items-center">
            <div className="w-12 h-12 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center mb-2">
              <Network className="w-6 h-6" />
            </div>
            <span className="font-bold text-xs text-white">Managed Switch 802.1Q</span>
            <span className="text-[10px] text-slate-400 font-mono mt-0.5">Port 1: Trunk (dot1q)</span>
            <div className="mt-2 flex gap-1 text-[10px] font-mono">
              <span className="px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300">VLAN 10</span>
              <span className="px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300">VLAN 20</span>
            </div>
          </div>

          {/* Wireless AP Block */}
          <div className="bg-slate-900 border border-slate-800 p-3.5 rounded-xl text-center flex flex-col items-center">
            <div className="w-12 h-12 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center mb-2">
              <Wifi className="w-6 h-6" />
            </div>
            <span className="font-bold text-xs text-white">Access Point Multi-SSID</span>
            <span className="text-[10px] text-slate-400 font-mono mt-0.5">SSID: Wi-Fi-Siswa</span>
            <div className="mt-2 text-[10px] px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 font-mono">
              Tagged VLAN 20
            </div>
          </div>
        </div>

        {/* End Devices Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* PC Guru */}
          <div
            onClick={() => setSourceDevId('pc_guru')}
            className={`p-3 rounded-lg border cursor-pointer transition flex items-center gap-3 ${
              sourceDevId === 'pc_guru'
                ? 'bg-blue-950/60 border-blue-500 ring-1 ring-blue-500'
                : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
            }`}
          >
            <Laptop className="w-5 h-5 text-blue-400 shrink-0" />
            <div>
              <div className="font-bold text-xs text-white">PC Ruang Guru</div>
              <div className="text-[10px] text-slate-400 font-mono">192.168.10.15 (VLAN 10)</div>
            </div>
          </div>

          {/* PC Siswa */}
          <div
            onClick={() => setSourceDevId('pc_siswa')}
            className={`p-3 rounded-lg border cursor-pointer transition flex items-center gap-3 ${
              sourceDevId === 'pc_siswa'
                ? 'bg-purple-950/60 border-purple-500 ring-1 ring-purple-500'
                : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
            }`}
          >
            <Laptop className="w-5 h-5 text-purple-400 shrink-0" />
            <div>
              <div className="font-bold text-xs text-white">Laptop Siswa (Wi-Fi)</div>
              <div className="text-[10px] text-slate-400 font-mono">192.168.20.45 (VLAN 20)</div>
            </div>
          </div>

          {/* Server CBT */}
          <div
            onClick={() => setDestDevId('server_cbt')}
            className={`p-3 rounded-lg border cursor-pointer transition flex items-center gap-3 ${
              destDevId === 'server_cbt'
                ? 'bg-emerald-950/60 border-emerald-500 ring-1 ring-emerald-500'
                : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
            }`}
          >
            <Server className="w-5 h-5 text-emerald-400 shrink-0" />
            <div>
              <div className="font-bold text-xs text-white">Server Ujian CBT</div>
              <div className="text-[10px] text-slate-400 font-mono">192.168.10.200 (VLAN 10)</div>
            </div>
          </div>
        </div>
      </div>

      {/* Ping Controls */}
      <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 mb-5 text-xs">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
          <div>
            <label className="block text-slate-400 mb-1">Perangkat Sumber (Source):</label>
            <select
              value={sourceDevId}
              onChange={(e) => setSourceDevId(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white font-mono"
            >
              {TOPOLOGY_DEVICES.filter((d) => d.type.startsWith('pc')).map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name} ({d.ip})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-slate-400 mb-1">Perangkat Tujuan (Destination):</label>
            <select
              value={destDevId}
              onChange={(e) => setDestDevId(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white font-mono"
            >
              {TOPOLOGY_DEVICES.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name} ({d.ip})
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={handleSendPing}
            disabled={isPinging || sourceDevId === destDevId}
            className={`flex items-center justify-center gap-2 p-2.5 rounded-lg font-bold text-xs transition shadow ${
              isPinging || sourceDevId === destDevId
                ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-blue-500/20 active:scale-95'
            }`}
          >
            <Send className={`w-4 h-4 ${isPinging ? 'animate-bounce' : ''}`} />
            {isPinging ? 'Mengirim ICMP Echo Request...' : 'Kirim Paket Ping (ICMP)'}
          </button>
        </div>
      </div>

      {/* Command Prompt Terminal Output */}
      <div className="bg-black rounded-xl border border-slate-800 p-4 font-mono text-xs text-slate-300">
        <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-2 text-slate-500 text-[11px]">
          <div className="flex items-center gap-2">
            <Terminal className="w-3.5 h-3.5 text-slate-400" />
            <span>Command Prompt - {sourceDev.name}</span>
          </div>
          {pingResult && (
            <span
              className={`flex items-center gap-1 font-bold ${
                pingResult === 'success' ? 'text-emerald-400' : 'text-red-400'
              }`}
            >
              {pingResult === 'success' ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
              {pingResult === 'success' ? 'PING SUCCESS (0% LOSS)' : 'PING FAILED (100% LOSS)'}
            </span>
          )}
        </div>
        <div className="space-y-1 overflow-x-auto min-h-[100px]">
          {pingLog.map((line, idx) => (
            <div
              key={idx}
              className={
                line.includes('Reply from')
                  ? 'text-emerald-400'
                  : line.includes('unreachable') || line.includes('timed out') || line.includes('DIAGNOSIS')
                  ? 'text-red-400 font-semibold'
                  : line.includes('STATUS')
                  ? 'text-blue-400 font-semibold'
                  : 'text-slate-400'
              }
            >
              {line}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
