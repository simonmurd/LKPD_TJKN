import React from 'react';
import { CurriculumBab, ExamSubmission, UserRole } from '../../types/curriculum';
import { Award, CheckCircle2, AlertTriangle, TrendingUp, BookOpen, Clock, ShieldCheck, ArrowRight } from 'lucide-react';

interface StudentDashboardProps {
  babs: CurriculumBab[];
  submissions: Record<number, ExamSubmission>;
  onSelectBab: (id: number) => void;
  userRole: UserRole;
}

export const StudentDashboard: React.FC<StudentDashboardProps> = ({
  babs,
  submissions,
  onSelectBab,
  userRole,
}) => {
  const completedCount = Object.keys(submissions).length;
  const passedCount = Object.values(submissions).filter((s) => s.isPassed).length;

  const totalScoreSum = Object.values(submissions).reduce((acc, s) => acc + s.percentage, 0);
  const avgScore = completedCount > 0 ? Math.round(totalScoreSum / completedCount) : 0;

  // UKK Readiness status
  let ukkStatus = 'Belum Siap';
  let ukkBadge = 'text-red-700 bg-red-50 border-red-200';
  if (passedCount >= 10 && avgScore >= 80) {
    ukkStatus = 'Sangat Siap UKK (Level Teknisi Madya)';
    ukkBadge = 'text-emerald-700 bg-emerald-50 border-emerald-200';
  } else if (passedCount >= 5 && avgScore >= 75) {
    ukkStatus = 'Cukup Siap (Perlu Pemantapan Fiber Optic & QoS)';
    ukkBadge = 'text-amber-700 bg-amber-50 border-amber-200';
  }

  // Categories
  const categories = [
    { name: 'Kabel & Perangkat Keras', babIds: [1, 2, 3, 4] },
    { name: 'Jaringan Nirkabel & Outdoor', babIds: [5, 6, 7, 8] },
    { name: 'Teknologi Fiber Optic', babIds: [9, 10, 11] },
    { name: 'Topologi, QoS & Troubleshooting', babIds: [12, 13, 14] },
  ];

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Overview Stat Cards - Bright Minimalist */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
          <div className="text-slate-500 text-xs font-mono uppercase font-bold">Modul Selesai</div>
          <div className="text-2xl font-black text-slate-900 mt-1 font-mono">
            {completedCount} <span className="text-slate-400 text-sm font-normal">/ 14 Bab</span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-1.5 mt-3 overflow-hidden">
            <div
              className="bg-blue-600 h-full rounded-full transition-all duration-500"
              style={{ width: `${(completedCount / 14) * 100}%` }}
            />
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
          <div className="text-slate-500 text-xs font-mono uppercase font-bold">Lolos KKM (&ge; 75)</div>
          <div className="text-2xl font-black text-emerald-600 mt-1 font-mono">
            {passedCount} <span className="text-slate-400 text-sm font-normal">Modul</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-2">
            Tingkat Kelulusan:{' '}
            <strong className="text-slate-900">
              {completedCount > 0 ? Math.round((passedCount / completedCount) * 100) : 0}%
            </strong>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
          <div className="text-slate-500 text-xs font-mono uppercase font-bold">Rata-Rata Nilai CBT</div>
          <div className="text-2xl font-black text-slate-900 mt-1 font-mono">
            {avgScore} <span className="text-slate-400 text-sm font-normal">/ 100</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-2">
            Predikat: <strong className="text-blue-700">{avgScore >= 85 ? 'A (Sangat Baik)' : avgScore >= 75 ? 'B (Baik)' : 'C (Perlu Remedial)'}</strong>
          </div>
        </div>

        <div className={`rounded-2xl p-5 border shadow-xs ${ukkBadge}`}>
          <div className="text-xs font-mono uppercase opacity-75 font-bold">Status Kesiapan UKK</div>
          <div className="text-sm font-black mt-1 line-clamp-1">{ukkStatus}</div>
          <div className="text-[10px] mt-2 opacity-80 font-mono">
            Standar Uji Kompetensi Kejuruan LSP-P1
          </div>
        </div>
      </div>

      {/* 4 Curriculum Clusters */}
      <div className="space-y-3">
        <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-blue-600" />
          Progres Belajar Berdasarkan 4 Kluster Kompetensi TJKN Fase F:
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {categories.map((cat, idx) => {
            const clusterBabs = babs.filter((b) => cat.babIds.includes(b.id));
            const clusterCompleted = clusterBabs.filter((b) => submissions[b.id]).length;
            const clusterPassed = clusterBabs.filter((b) => submissions[b.id]?.isPassed).length;

            return (
              <div
                key={idx}
                className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-3"
              >
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-xs sm:text-sm text-slate-900">{cat.name}</h4>
                  <span className="text-xs font-mono text-slate-500">
                    {clusterCompleted} / {clusterBabs.length} Bab
                  </span>
                </div>

                <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                  <div
                    className="bg-blue-600 h-full rounded-full transition-all"
                    style={{ width: `${(clusterCompleted / clusterBabs.length) * 100}%` }}
                  />
                </div>

                <div className="grid grid-cols-2 gap-2 pt-1">
                  {clusterBabs.map((b) => {
                    const sub = submissions[b.id];
                    return (
                      <button
                        key={b.id}
                        onClick={() => onSelectBab(b.id)}
                        className={`p-2.5 rounded-xl border text-left transition flex items-center justify-between text-xs group ${
                          sub
                            ? sub.isPassed
                              ? 'bg-emerald-50/60 border-emerald-200 text-slate-800 hover:bg-emerald-50'
                              : 'bg-amber-50/60 border-amber-200 text-slate-800 hover:bg-amber-50'
                            : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        <div className="truncate">
                          <span className="font-bold mr-1">{b.code}</span>
                          <span className="text-[11px] text-slate-500 truncate">{b.title.slice(0, 15)}...</span>
                        </div>
                        {sub ? (
                          <span
                            className={`text-[10px] font-bold font-mono px-1.5 py-0.5 rounded ${
                              sub.isPassed ? 'text-emerald-700 bg-emerald-100' : 'text-amber-700 bg-amber-100'
                            }`}
                          >
                            {sub.percentage}%
                          </span>
                        ) : (
                          <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-0.5 transition shrink-0" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
