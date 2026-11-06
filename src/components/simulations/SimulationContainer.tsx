import React, { useState, useEffect } from 'react';
import {
  CurriculumBab,
  PracticalSimulationTask,
  StudentProfile,
  SimulationLogEntry,
  RombelAssignment,
} from '../../types/curriculum';
import { CrimpingSimulator } from './CrimpingSimulator';
import { LanTesterSimulator } from './LanTesterSimulator';
import { WirelessSpectrumSimulator } from './WirelessSpectrumSimulator';
import { LinkBudgetSimulator } from './LinkBudgetSimulator';
import { FiberSplicingSimulator } from './FiberSplicingSimulator';
import { OtdrSimulator } from './OtdrSimulator';
import { BandwidthQoSSimulator } from './BandwidthQoSSimulator';
import { TopologySubnetSimulator } from './TopologySubnetSimulator';
import { saveSimulationLogToFirestore } from '../../lib/firebase';
import {
  BookOpen,
  ShieldAlert,
  Wrench,
  CheckCircle,
  HelpCircle,
  Send,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  Clock,
  ExternalLink,
  RefreshCw,
  Sparkles,
} from 'lucide-react';
import { RombelAccessLockedNotice } from '../curriculum/RombelAccessLockedNotice';
import { isSectionAccessibleForStudent, getAssignmentForStudent } from '../../data/rombelAssignments';

interface SimulationContainerProps {
  bab: CurriculumBab;
  activeStudent: StudentProfile | null;
  rombelAssignments?: Record<string, RombelAssignment>;
  allBabs?: CurriculumBab[];
  onSelectBab?: (bab: CurriculumBab) => void;
  userRole?: 'siswa' | 'guru';
}

export const SimulationContainer: React.FC<SimulationContainerProps> = ({
  bab,
  activeStudent,
  rombelAssignments = {},
  allBabs = [],
  onSelectBab,
  userRole = 'siswa',
}) => {
  const [activeTaskIndex, setActiveTaskIndex] = useState<number>(0);
  const [isLogging, setIsLogging] = useState<boolean>(false);
  const [lastLogSuccess, setLastLogSuccess] = useState<string | null>(null);
  const [logError, setLogError] = useState<string | null>(null);
  const [customNotes, setCustomNotes] = useState<string>('');
  const [sessionLogs, setSessionLogs] = useState<SimulationLogEntry[]>([]);
  const [appsScriptStatus, setAppsScriptStatus] = useState<'checking' | 'online' | 'offline'>('checking');

  const activeTask = bab.simulations[activeTaskIndex] || bab.simulations[0];

  // Check Rombel permission
  const accessCheck = isSectionAccessibleForStudent(activeStudent, bab.id, 'simulations', rombelAssignments);
  const rombelAssignment = getAssignmentForStudent(activeStudent, rombelAssignments);

  // Check Apps Script connectivity on mount
  useEffect(() => {
    let isMounted = true;
    fetch('/api/simulation-log/status')
      .then((res) => res.json())
      .then((data) => {
        if (isMounted) {
          if (data.status === 'online') {
            setAppsScriptStatus('online');
          } else {
            setAppsScriptStatus('offline');
          }
        }
      })
      .catch(() => {
        if (isMounted) setAppsScriptStatus('offline');
      });

    // Load cached session logs
    try {
      const stored = localStorage.getItem('tjkn_simulation_logs');
      if (stored) {
        setSessionLogs(JSON.parse(stored));
      }
    } catch (e) {
      // ignore
    }

    return () => {
      isMounted = false;
    };
  }, []);

  if (userRole !== 'guru' && !accessCheck.allowed) {
    return (
      <RombelAccessLockedNotice
        student={activeStudent}
        bab={bab}
        sectionName="Praktikum & Simulasi Jaringan"
        rombelAssignment={rombelAssignment}
        allBabs={allBabs}
        onSelectBab={onSelectBab || (() => {})}
      />
    );
  }

  // Send simulation log to Google Apps Script
  const handleSendLog = async (overrideStatus: 'Berhasil' | 'Sebagian' | 'Selesai' = 'Berhasil') => {
    setIsLogging(true);
    setLogError(null);
    setLastLogSuccess(null);

    const logEntry: SimulationLogEntry = {
      id: `sim_log_${Date.now()}`,
      timestamp: new Date().toISOString(),
      studentId: activeStudent?.id,
      studentName: activeStudent?.name || 'Siswa Anonim',
      noAbsen: activeStudent?.noAbsen || '-',
      className: activeStudent?.className || 'X TJK',
      school: activeStudent?.school || 'SMK NEGERI 1 SINGKAWANG',
      babId: bab.id,
      babCode: bab.code,
      babTitle: bab.title,
      taskNumber: activeTask.taskNumber,
      taskTitle: activeTask.title,
      simulationType: activeTask.type,
      status: overrideStatus,
      score: 100,
      details: customNotes || `Siswa menyelesaikan simulasi ${activeTask.title} (${activeTask.expectedObservation})`,
      syncedToAppsScript: true,
    };

    try {
      const res = await fetch('/api/simulation-log', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(logEntry),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        // Save to Firebase Firestore Cloud Database
        saveSimulationLogToFirestore(logEntry);

        setLastLogSuccess(`✓ Log Praktikum Tugas #${activeTask.taskNumber} berhasil tercatat di Dashboard Guru & Firebase Cloud!`);
        setCustomNotes('');

        // Update local session logs
        const updated = [logEntry, ...sessionLogs];
        setSessionLogs(updated);
        try {
          localStorage.setItem('tjkn_simulation_logs', JSON.stringify(updated.slice(0, 100)));
        } catch (e) {
          // ignore
        }
      } else {
        setLogError(data.error || 'Gagal mengirim log ke Google Apps Script');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Koneksi gagal';
      setLogError(`Gagal menghubungi server log: ${msg}`);
    } finally {
      setIsLogging(false);
    }
  };

  // Render the matching interactive simulator engine based on task.type
  const renderInteractiveEngine = (type: PracticalSimulationTask['type']) => {
    switch (type) {
      case 'crimping':
        return <CrimpingSimulator />;
      case 'lan_tester':
        return <LanTesterSimulator />;
      case 'wireless_spectrum':
        return <WirelessSpectrumSimulator />;
      case 'link_budget':
        return <LinkBudgetSimulator />;
      case 'fiber_splice':
        return <FiberSplicingSimulator />;
      case 'otdr_analysis':
        return <OtdrSimulator />;
      case 'bandwidth_qos':
        return <BandwidthQoSSimulator />;
      case 'topology_vlan':
      default:
        return <TopologySubnetSimulator />;
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* 4-Task Selector Tabs - Bright Minimalist */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
        <div className="text-xs font-semibold text-slate-500 mb-2.5 px-1 flex items-center justify-between">
          <span className="uppercase tracking-wider font-bold text-slate-700">
            LKPD Bagian 1: 4 Skenario Praktikum ({bab.code})
          </span>
          <span className="text-blue-700 font-mono text-[11px] font-semibold bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200">
            Standar Industri TJKN
          </span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
          {bab.simulations.map((sim, idx) => {
            const isSelected = activeTaskIndex === idx;
            return (
              <button
                key={sim.id}
                onClick={() => setActiveTaskIndex(idx)}
                className={`p-3.5 rounded-xl border text-left transition flex flex-col justify-between ${
                  isSelected
                    ? 'bg-blue-50/80 border-blue-500 text-slate-900 shadow-xs ring-2 ring-blue-500/20'
                    : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700'
                }`}
              >
                <div>
                  <span
                    className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold ${
                      isSelected
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    Tugas #{sim.taskNumber}
                  </span>
                  <div className="font-bold text-xs mt-2 line-clamp-2 leading-snug">
                    {sim.title}
                  </div>
                </div>
                <div className="text-[10px] text-slate-400 mt-2.5 capitalize font-mono">
                  Tipe: {sim.type.replace('_', ' ')}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Interactive Engine Component */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
        {renderInteractiveEngine(activeTask.type)}
      </div>

      {/* Google Apps Script Log Card */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center font-bold">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm text-slate-900">
                  Log Simulasi ke Spreadsheet Guru (Simon Murd)
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-mono text-[10px] font-bold border border-emerald-200 flex items-center gap-1">
                  <span className={`w-1.5 h-1.5 rounded-full ${appsScriptStatus === 'online' ? 'bg-emerald-500 animate-pulse' : 'bg-amber-400'}`} />
                  {appsScriptStatus === 'online' ? 'Endpoint Aktif' : 'Memeriksa Endpoint...'}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Pengujian dan presensi simulasi dikirim ke Google Sheets melalui Google Apps Script.
              </p>
            </div>
          </div>

          <div className="text-right text-xs">
            <div className="text-slate-400 text-[11px] font-mono">Peserta Praktikum:</div>
            <div className="font-bold text-slate-900">
              {activeStudent ? `${activeStudent.noAbsen} ${activeStudent.name}` : 'Siswa Belum Terpilih'}
            </div>
            <div className="text-[10px] text-blue-700 font-mono">
              {activeStudent ? `${activeStudent.className} • ${activeStudent.school}` : '-'}
            </div>
          </div>
        </div>

        {/* Input and Submit Action */}
        <div className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div className="sm:col-span-3">
              <input
                type="text"
                value={customNotes}
                onChange={(e) => setCustomNotes(e.target.value)}
                placeholder={`Catatan hasil pengamatan Tugas #${activeTask.taskNumber} (misal: "Hasil crimping 8 pin lurus terverifikasi pinout T568B")...`}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div className="sm:col-span-1">
              <button
                onClick={() => handleSendLog('Berhasil')}
                disabled={isLogging}
                className="w-full h-full min-h-[40px] px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 disabled:opacity-50 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition cursor-pointer"
              >
                {isLogging ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Mengirim...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Kirim Log Praktik</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Feedback Alerts */}
          {lastLogSuccess && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center justify-between gap-2 animate-in fade-in duration-200">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{lastLogSuccess}</span>
              </div>
              <span className="text-[10px] font-mono text-emerald-700 shrink-0">Status 200 OK</span>
            </div>
          )}

          {logError && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs flex items-center gap-2 animate-in fade-in duration-200">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
              <span>{logError}</span>
            </div>
          )}

          {/* Session Logs Mini History */}
          {sessionLogs.length > 0 && (
            <div className="pt-2">
              <div className="text-[11px] font-mono text-slate-500 mb-1.5 flex items-center justify-between">
                <span>Riwayat Pengiriman Log Simulasi Anda ({sessionLogs.length} Entri):</span>
                <span className="text-[10px] text-slate-400 font-mono">Terkoneksi ke Simon Murd Apps Script</span>
              </div>
              <div className="max-h-36 overflow-y-auto space-y-1.5 pr-1">
                {sessionLogs.slice(0, 5).map((log) => (
                  <div
                    key={log.id}
                    className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-[11px] flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-emerald-600 font-bold">✓</span>
                      <span className="font-semibold text-slate-900">{log.taskTitle}</span>
                      <span className="text-slate-500">({log.babCode})</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-500 font-mono text-[10px]">
                      <span>{new Date(log.timestamp).toLocaleTimeString('id-ID')}</span>
                      <span className="text-emerald-700 font-semibold bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                        Tersinkron
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Practical Guide Worksheet Detail (Pedagogical LKPD Content) */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
          <BookOpen className="w-5 h-5 text-blue-600" />
          <h4 className="font-bold text-sm text-slate-900">
            Lembar Panduan Instruksi Praktik #{activeTask.taskNumber}: {activeTask.title}
          </h4>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          {/* Objectives & Tools */}
          <div className="space-y-3">
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
              <span className="font-bold text-slate-900 block mb-1">Tujuan Praktikum:</span>
              <p className="text-slate-700 leading-relaxed">{activeTask.objective}</p>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
              <span className="font-bold text-slate-900 flex items-center gap-1.5 mb-1.5">
                <Wrench className="w-3.5 h-3.5 text-blue-600" />
                Alat & Bahan Praktikum:
              </span>
              <ul className="list-disc list-inside space-y-1 text-slate-700">
                {activeTask.toolsAndMaterials.map((tool, i) => (
                  <li key={i}>{tool}</li>
                ))}
              </ul>
            </div>

            <div className="bg-amber-50/70 p-4 rounded-xl border border-amber-200 text-amber-900">
              <span className="font-bold text-amber-950 flex items-center gap-1.5 mb-1.5">
                <ShieldAlert className="w-3.5 h-3.5 text-amber-600" />
                K3LH & Keselamatan Kerja Bengkel TKJ:
              </span>
              <ul className="list-disc list-inside space-y-1 text-slate-700">
                {activeTask.safetyGuidelines.map((safe, i) => (
                  <li key={i}>{safe}</li>
                ))}
              </ul>
            </div>
          </div>

          {/* Steps & Observations */}
          <div className="space-y-3">
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
              <span className="font-bold text-slate-900 block mb-1.5">Langkah Kerja Sistematis:</span>
              <ol className="list-decimal list-inside space-y-1.5 text-slate-700">
                {activeTask.stepByStepGuide.map((step, i) => (
                  <li key={i} className="leading-relaxed">
                    {step}
                  </li>
                ))}
              </ol>
            </div>

            <div className="bg-emerald-50/60 p-4 rounded-xl border border-emerald-200">
              <span className="font-bold text-emerald-900 flex items-center gap-1.5 mb-1">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                Hasil Pengamatan yang Diharapkan:
              </span>
              <p className="text-slate-700 leading-relaxed">{activeTask.expectedObservation}</p>
            </div>

            <div className="bg-blue-50/60 p-4 rounded-xl border border-blue-200 text-blue-900">
              <span className="font-bold text-blue-950 flex items-center gap-1.5 mb-1">
                <HelpCircle className="w-3.5 h-3.5 text-blue-600" />
                Pertanyaan Analisis Kritis Siswa:
              </span>
              <p className="italic text-xs font-medium leading-relaxed text-slate-700">
                {activeTask.criticalAnalysisQuestion}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
