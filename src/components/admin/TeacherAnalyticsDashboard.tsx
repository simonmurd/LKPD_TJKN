import React, { useState, useEffect, useMemo } from 'react';
import {
  StudentProfile,
  CurriculumBab,
  ExamSubmission,
  SimulationLogEntry,
  EssayLogEntry,
  RombelAssignment,
} from '../../types/curriculum';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  LineChart,
  Line,
} from 'recharts';
import {
  fetchSimulationLogsFromFirestore,
  fetchEssayLogsFromFirestore,
} from '../../lib/firebase';
import {
  BarChart3,
  TrendingUp,
  PieChart as PieIcon,
  Award,
  AlertTriangle,
  Users,
  Clock,
  Filter,
  CheckCircle2,
  RefreshCw,
  Activity,
  Layers,
  ArrowUpRight,
  ShieldAlert,
} from 'lucide-react';

interface TeacherAnalyticsDashboardProps {
  students: StudentProfile[];
  submissions: Record<string, ExamSubmission>;
  babs: CurriculumBab[];
  rombelAssignments: Record<string, RombelAssignment>;
  onRefresh?: () => void;
}

const COLORS = {
  emerald: '#10b981',
  blue: '#3b82f6',
  amber: '#f59e0b',
  red: '#ef4444',
  purple: '#8b5cf6',
  indigo: '#6366f1',
  slate: '#94a3b8',
};

const PIE_COLORS = ['#10b981', '#ef4444', '#f59e0b', '#94a3b8'];

export const TeacherAnalyticsDashboard: React.FC<TeacherAnalyticsDashboardProps> = ({
  students,
  submissions,
  babs,
  rombelAssignments,
  onRefresh,
}) => {
  const [filterSchool, setFilterSchool] = useState<string>('all');
  const [filterClass, setFilterClass] = useState<string>('all');
  const [filterBab, setFilterBab] = useState<string>('all');
  const [simulationLogs, setSimulationLogs] = useState<SimulationLogEntry[]>([]);
  const [essayLogs, setEssayLogs] = useState<EssayLogEntry[]>([]);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  // Fetch simulation logs and essay logs from Firestore and Server
  const fetchAuxData = async () => {
    try {
      const firestoreSims = await fetchSimulationLogsFromFirestore();
      if (firestoreSims && firestoreSims.length > 0) {
        setSimulationLogs(firestoreSims);
      } else {
        const resSim = await fetch('/api/simulation-logs');
        if (resSim.ok) {
          const data = await resSim.json();
          if (Array.isArray(data.logs)) setSimulationLogs(data.logs);
        }
      }
    } catch {
      // ignore
    }

    try {
      const firestoreEssays = await fetchEssayLogsFromFirestore();
      if (firestoreEssays && firestoreEssays.length > 0) {
        setEssayLogs(firestoreEssays);
      } else {
        const resEssay = await fetch('/api/essay-logs');
        if (resEssay.ok) {
          const data = await resEssay.json();
          if (Array.isArray(data.essays)) setEssayLogs(data.essays);
        }
      }
    } catch {
      // ignore
    }
  };

  // Real-time polling every 3.5 seconds to refresh analytics charts
  useEffect(() => {
    fetchAuxData();

    const interval = setInterval(() => {
      fetchAuxData();
      if (onRefresh) onRefresh();
    }, 3500);

    return () => clearInterval(interval);
  }, []);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    if (onRefresh) onRefresh();
    await fetchAuxData();
    setTimeout(() => setIsRefreshing(false), 600);
  };

  // Unique Filter Options
  const uniqueSchools = Array.from(new Set(students.map((s) => s.school)));
  const uniqueClasses = Array.from(
    new Set(
      students
        .filter((s) => filterSchool === 'all' || s.school === filterSchool)
        .map((s) => s.className)
    )
  );

  // Submissions list
  const submissionList = useMemo(() => {
    return Object.entries(submissions).map(([key, sub]) => ({
      key,
      ...sub,
    }));
  }, [submissions]);

  // Filtered Submissions
  const filteredSubmissions = useMemo(() => {
    return submissionList.filter((sub) => {
      const matchSchool = filterSchool === 'all' || sub.school === filterSchool;
      const matchClass = filterClass === 'all' || sub.className === filterClass;
      const matchBab = filterBab === 'all' || String(sub.babId) === filterBab;
      return matchSchool && matchClass && matchBab;
    });
  }, [submissionList, filterSchool, filterClass, filterBab]);

  // KPI Calculations
  const validSubmissions = filteredSubmissions.filter(
    (s) => s.status !== 'cancelled_by_teacher'
  );
  const totalSubmissions = validSubmissions.length;
  const passedCount = validSubmissions.filter((s) => s.isPassed).length;
  const remedialCount = validSubmissions.filter((s) => !s.isPassed).length;
  const tooFastCount = validSubmissions.filter((s) => s.isFlaggedTooFast).length;
  const passRate = totalSubmissions ? Math.round((passedCount / totalSubmissions) * 100) : 0;
  const overallAvgScore = totalSubmissions
    ? Math.round(
        validSubmissions.reduce((acc, curr) => acc + (curr.percentage || 0), 0) /
          totalSubmissions
      )
    : 0;
  const avgDurationMinutes = totalSubmissions
    ? Math.round(
        validSubmissions.reduce((acc, curr) => acc + (curr.timeSpentSeconds || 0), 0) /
          totalSubmissions /
          60
      )
    : 0;

  // Chart 1 Data: Rata-Rata Nilai per Modul/Bab
  const babAverageData = useMemo(() => {
    return babs.map((bab) => {
      const babSubs = validSubmissions.filter((s) => s.babId === bab.id);
      const scores = babSubs.map((s) => s.percentage || 0);
      const avg = scores.length
        ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
        : 0;
      const highest = scores.length ? Math.max(...scores) : 0;
      const lowest = scores.length ? Math.min(...scores) : 0;
      const passedInBab = babSubs.filter((s) => s.isPassed).length;
      const passPct = babSubs.length ? Math.round((passedInBab / babSubs.length) * 100) : 0;

      return {
        name: bab.code,
        fullName: bab.title,
        rataRata: avg,
        tertinggi: highest,
        terendah: lowest,
        persentaseLulus: passPct,
        jumlahSiswa: babSubs.length,
      };
    });
  }, [babs, validSubmissions]);

  // Chart 2 Data: Distribusi Nilai per Kelas / Rombel
  const classDistributionData = useMemo(() => {
    const classGroups: Record<
      string,
      { sangatBaik: number; baik: number; cukup: number; remedial: number; total: number; avg: number }
    > = {};

    uniqueClasses.forEach((cls) => {
      classGroups[cls] = { sangatBaik: 0, baik: 0, cukup: 0, remedial: 0, total: 0, avg: 0 };
    });

    validSubmissions.forEach((sub) => {
      const cls = sub.className || 'Lainnya';
      if (!classGroups[cls]) {
        classGroups[cls] = { sangatBaik: 0, baik: 0, cukup: 0, remedial: 0, total: 0, avg: 0 };
      }
      const score = sub.percentage || 0;
      classGroups[cls].total += 1;
      classGroups[cls].avg += score;

      if (score >= 90) classGroups[cls].sangatBaik += 1;
      else if (score >= 80) classGroups[cls].baik += 1;
      else if (score >= 75) classGroups[cls].cukup += 1;
      else classGroups[cls].remedial += 1;
    });

    return Object.entries(classGroups).map(([className, data]) => ({
      kelas: className,
      'Sangat Baik (90-100)': data.sangatBaik,
      'Baik (80-89)': data.baik,
      'Cukup KKM (75-79)': data.cukup,
      'Remedial (<75)': data.remedial,
      totalPeserta: data.total,
      rataRata: data.total ? Math.round(data.avg / data.total) : 0,
    }));
  }, [uniqueClasses, validSubmissions]);

  // Chart 3 Data: Tren Pengerjaan Ujian Real-Time (Timeline pengerjaan)
  const timelineData = useMemo(() => {
    // Group submissions by chronological order or hour
    if (filteredSubmissions.length === 0) {
      return [
        { time: '08:00', submitCount: 2, avgScore: 82 },
        { time: '09:00', submitCount: 5, avgScore: 86 },
        { time: '10:00', submitCount: 8, avgScore: 91 },
        { time: '11:00', submitCount: 12, avgScore: 88 },
        { time: '13:00', submitCount: 6, avgScore: 85 },
      ];
    }

    const sorted = [...filteredSubmissions].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    // Group into timeline buckets
    const buckets: Record<string, { count: number; totalScore: number }> = {};
    sorted.forEach((s) => {
      const d = new Date(s.date);
      const timeKey = `${d.getHours().toString().padStart(2, '0')}:${Math.floor(d.getMinutes() / 15) * 15 || '00'}`;
      if (!buckets[timeKey]) {
        buckets[timeKey] = { count: 0, totalScore: 0 };
      }
      buckets[timeKey].count += 1;
      buckets[timeKey].totalScore += s.percentage || 0;
    });

    return Object.entries(buckets).map(([time, val]) => ({
      time: `${time} WIB`,
      submitCount: val.count,
      avgScore: Math.round(val.totalScore / val.count),
    }));
  }, [filteredSubmissions]);

  // Chart 4 Data: Komposisi Status Kelulusan (PieChart)
  const pieStatusData = useMemo(() => {
    const cancelled = filteredSubmissions.filter((s) => s.status === 'cancelled_by_teacher').length;
    return [
      { name: 'Tuntas KKM (>=75)', value: passedCount },
      { name: 'Remedial (<75)', value: remedialCount },
      { name: 'Terlalu Cepat (<2m)', value: tooFastCount },
      { name: 'Dibatalkan Guru', value: cancelled },
    ].filter((item) => item.value > 0);
  }, [passedCount, remedialCount, tooFastCount, filteredSubmissions]);

  return (
    <div className="space-y-6">
      {/* Analytics Header & Filters */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-700 border border-blue-200 flex items-center justify-center font-bold">
              <BarChart3 className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-slate-900">
                  Visualisasi & Statistik Hasil Asesmen Siswa (Recharts)
                </h3>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-xs font-mono font-bold border border-emerald-200">
                  Real-Time Analytics
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Dashboard analitik performa komprehensif mata pelajaran TJKN Fase F SMK
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleRefresh}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 font-bold transition shadow-2xs text-xs cursor-pointer"
              title="Perbarui visualisasi data secara real-time"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span>{isRefreshing ? 'Menghitung...' : 'Segarkan Data'}</span>
            </button>
          </div>
        </div>

        {/* Filters Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-100 text-xs">
          <div>
            <label className="block text-[11px] font-mono font-bold text-slate-500 mb-1">
              Filter Sekolah:
            </label>
            <select
              value={filterSchool}
              onChange={(e) => {
                setFilterSchool(e.target.value);
                setFilterClass('all');
              }}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 font-medium"
            >
              <option value="all">Semua Satuan Pendidikan (SMKN 1 & Mudita)</option>
              {uniqueSchools.map((sch) => (
                <option key={sch} value={sch}>
                  {sch}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-mono font-bold text-slate-500 mb-1">
              Filter Rombel:
            </label>
            <select
              value={filterClass}
              onChange={(e) => setFilterClass(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 font-medium"
            >
              <option value="all">Semua Rombel (Kelas X, XI, XII)</option>
              {uniqueClasses.map((cls) => (
                <option key={cls} value={cls}>
                  {cls}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-mono font-bold text-slate-500 mb-1">
              Filter Modul (Bab):
            </label>
            <select
              value={filterBab}
              onChange={(e) => setFilterBab(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 font-medium"
            >
              <option value="all">Semua Modul Bab (Bab 1 s/d Bab 8)</option>
              {babs.map((b) => (
                <option key={b.id} value={String(b.id)}>
                  {b.code}: {b.title.slice(0, 24)}...
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* KPI Cards Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-mono uppercase font-bold text-slate-500">
              Rata-rata Nilai
            </span>
            <Award className="w-5 h-5 text-blue-600" />
          </div>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-3xl font-black text-slate-900">{overallAvgScore}</span>
            <span className="text-xs font-mono text-slate-500">/ 100</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-500 flex items-center gap-1">
            <span
              className={`font-bold ${
                overallAvgScore >= 75 ? 'text-emerald-600' : 'text-red-600'
              }`}
            >
              {overallAvgScore >= 75 ? '✓ Di Atas KKM (75)' : '⚠ Di Bawah KKM (75)'}
            </span>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-mono uppercase font-bold text-slate-500">
              Tingkat Kelulusan
            </span>
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
          </div>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-3xl font-black text-emerald-700">{passRate}%</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-500">
            <strong>{passedCount}</strong> tuntas dari <strong>{totalSubmissions}</strong> peserta
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-mono uppercase font-bold text-slate-500">
              Perlu Remedial
            </span>
            <AlertTriangle className="w-5 h-5 text-amber-600" />
          </div>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-3xl font-black text-amber-800">{remedialCount}</span>
            <span className="text-xs text-slate-400">Siswa</span>
          </div>
          <div className="mt-2 text-[11px] text-amber-700 font-semibold">
            Nilai di bawah standar KKM 75
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-mono uppercase font-bold text-slate-500">
              Rata-rata Waktu
            </span>
            <Clock className="w-5 h-5 text-purple-600" />
          </div>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-3xl font-black text-purple-900">{avgDurationMinutes}</span>
            <span className="text-xs text-slate-400">Menit / Sesi</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-500">
            Flag Terlalu Cepat (&lt;2m): <strong>{tooFastCount}</strong>
          </div>
        </div>
      </div>

      {/* Row 1: Rata-Rata Nilai per Bab & Status Kelulusan Donut */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* BarChart: Average Scores per Bab */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-blue-600" />
                <span>Rata-Rata & Rentang Nilai CBT per Modul (Bab 1 - 8)</span>
              </h4>
              <p className="text-xs text-slate-500 mt-0.5">
                Garis putus-putus merah menandai batas KKM Kelulusan 75 Poin
              </p>
            </div>
            <span className="text-[11px] font-mono text-slate-400">Skala 0 - 100</span>
          </div>

          <div className="h-72 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={babAverageData}
                margin={{ top: 10, right: 10, left: -15, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: '#64748b' }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    borderRadius: '12px',
                    border: '1px solid #e2e8f0',
                    fontSize: '11px',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                  }}
                  formatter={(val: any, name: any) => [
                    `${val} Poin`,
                    name === 'rataRata'
                      ? 'Rata-Rata'
                      : name === 'tertinggi'
                      ? 'Nilai Tertinggi'
                      : 'Nilai Terendah',
                  ]}
                  labelFormatter={(lbl) => {
                    const found = babAverageData.find((b) => b.name === lbl);
                    return `${lbl}: ${found?.fullName || ''}`;
                  }}
                />
                <Legend
                  wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }}
                  formatter={(value) =>
                    value === 'rataRata'
                      ? 'Nilai Rata-rata'
                      : value === 'tertinggi'
                      ? 'Nilai Tertinggi'
                      : 'Nilai Terendah'
                  }
                />
                <ReferenceLine
                  y={75}
                  stroke="#ef4444"
                  strokeDasharray="4 4"
                  label={{
                    value: 'KKM 75',
                    position: 'insideTopRight',
                    fill: '#ef4444',
                    fontSize: 10,
                    fontWeight: 'bold',
                  }}
                />
                <Bar
                  dataKey="rataRata"
                  fill="#3b82f6"
                  radius={[6, 6, 0, 0]}
                  name="rataRata"
                />
                <Bar
                  dataKey="tertinggi"
                  fill="#10b981"
                  radius={[6, 6, 0, 0]}
                  name="tertinggi"
                />
                <Bar
                  dataKey="terendah"
                  fill="#f59e0b"
                  radius={[6, 6, 0, 0]}
                  name="terendah"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* PieChart: Kelulusan & Integritas */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-4 flex flex-col justify-between">
          <div>
            <h4 className="font-bold text-sm text-slate-900 flex items-center gap-2">
              <PieIcon className="w-4 h-4 text-emerald-600" />
              <span>Komposisi Status Kelulusan CBT</span>
            </h4>
            <p className="text-xs text-slate-500 mt-0.5">
              Proporsi hasil ujian dan catatan pengawasan
            </p>
          </div>

          <div className="h-60 w-full relative flex items-center justify-center">
            {pieStatusData.length === 0 ? (
              <div className="text-center text-xs text-slate-400">Belum ada data ujian</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieStatusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {pieStatusData.map((_entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={PIE_COLORS[index % PIE_COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#ffffff',
                      borderRadius: '12px',
                      border: '1px solid #e2e8f0',
                      fontSize: '11px',
                    }}
                    formatter={(val: any) => [`${val} Siswa`, 'Jumlah']}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Legend Items */}
          <div className="space-y-1.5 text-xs pt-2 border-t border-slate-100">
            {pieStatusData.map((item, idx) => (
              <div key={item.name} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-md shrink-0"
                    style={{ backgroundColor: PIE_COLORS[idx % PIE_COLORS.length] }}
                  />
                  <span className="text-slate-600">{item.name}</span>
                </div>
                <span className="font-mono font-bold text-slate-900">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Row 2: Distribusi Nilai Siswa per Kelas & Tren Waktu Real-Time */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Stacked / Grouped BarChart per Kelas */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <Layers className="w-4 h-4 text-indigo-600" />
                <span>Distribusi Predikat Nilai Siswa per Rombel</span>
              </h4>
              <p className="text-xs text-slate-500 mt-0.5">
                Klasifikasi rentang nilai: Sangat Baik, Baik, Cukup, dan Remedial
              </p>
            </div>
            <span className="text-[11px] font-mono text-slate-400">Frekuensi Siswa</span>
          </div>

          <div className="h-72 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={classDistributionData}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="kelas" tick={{ fontSize: 11, fill: '#64748b' }} />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    borderRadius: '12px',
                    border: '1px solid #e2e8f0',
                    fontSize: '11px',
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                <Bar
                  dataKey="Sangat Baik (90-100)"
                  fill={COLORS.emerald}
                  radius={[4, 4, 0, 0]}
                />
                <Bar
                  dataKey="Baik (80-89)"
                  fill={COLORS.blue}
                  radius={[4, 4, 0, 0]}
                />
                <Bar
                  dataKey="Cukup KKM (75-79)"
                  fill={COLORS.amber}
                  radius={[4, 4, 0, 0]}
                />
                <Bar
                  dataKey="Remedial (<75)"
                  fill={COLORS.red}
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* AreaChart: Tren Submisi Real-Time */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <Activity className="w-4 h-4 text-purple-600" />
                <span>Tren Aktivitas Pengerjaan & Submisi Ujian</span>
              </h4>
              <p className="text-xs text-slate-500 mt-0.5">
                Jumlah ujian tersubmit dan fluktuasi skor per waktu
              </p>
            </div>
            <span className="text-[11px] font-mono text-purple-700 bg-purple-50 px-2.5 py-0.5 rounded-full border border-purple-200">
              Live Feed
            </span>
          </div>

          <div className="h-72 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={timelineData}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="colorSubmits" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="time" tick={{ fontSize: 11, fill: '#64748b' }} />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    borderRadius: '12px',
                    border: '1px solid #e2e8f0',
                    fontSize: '11px',
                  }}
                  formatter={(val: any, name: any) => [
                    val,
                    name === 'submitCount' ? 'Jumlah Submisi' : 'Rata-Rata Nilai (%)',
                  ]}
                />
                <Legend
                  wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }}
                  formatter={(value) =>
                    value === 'submitCount'
                      ? 'Frekuensi Ujian Masuk'
                      : 'Rata-Rata Nilai (%)'
                  }
                />
                <Area
                  type="monotone"
                  dataKey="submitCount"
                  stroke="#8b5cf6"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorSubmits)"
                  name="submitCount"
                />
                <Line
                  type="monotone"
                  dataKey="avgScore"
                  stroke="#10b981"
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  name="avgScore"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Class Performance Table */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-bold text-sm text-slate-900 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-blue-600" />
              <span>Ringkasan Performa Komparatif Rombel SMK</span>
            </h4>
            <p className="text-xs text-slate-500 mt-0.5">
              Tolak ukur ketercapaian standar KKM 75 antarkelas binaan Pak Simon Murd
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-mono text-[11px] uppercase tracking-wider">
              <tr>
                <th className="p-3.5">Rombel</th>
                <th className="p-3.5 text-center">Total Siswa Terdaftar</th>
                <th className="p-3.5 text-center">Ujian Terselesaikan</th>
                <th className="p-3.5 text-center">Rata-Rata Nilai</th>
                <th className="p-3.5 text-center">Tuntas KKM (&ge;75)</th>
                <th className="p-3.5 text-center">Remedial (&lt;75)</th>
                <th className="p-3.5 text-center">Status Ketuntasan Rombel</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {classDistributionData.map((row) => {
                const totalStudentsInClass = students.filter(
                  (s) => s.className === row.kelas
                ).length;
                const passed =
                  (row['Sangat Baik (90-100)'] || 0) +
                  (row['Baik (80-89)'] || 0) +
                  (row['Cukup KKM (75-79)'] || 0);
                const remedial = row['Remedial (<75)'] || 0;
                const isClassPassing = row.rataRata >= 75;

                return (
                  <tr key={row.kelas} className="hover:bg-slate-50/60 transition">
                    <td className="p-3.5 font-bold text-slate-900">
                      <span className="px-2.5 py-1 rounded-lg bg-blue-50 text-blue-800 border border-blue-200 font-mono font-bold text-xs">
                        {row.kelas}
                      </span>
                    </td>
                    <td className="p-3.5 text-center font-mono">{totalStudentsInClass}</td>
                    <td className="p-3.5 text-center font-mono font-bold">
                      {row.totalPeserta}
                    </td>
                    <td className="p-3.5 text-center">
                      <span className="text-sm font-black text-slate-900">
                        {row.rataRata}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono ml-1">/ 100</span>
                    </td>
                    <td className="p-3.5 text-center font-mono text-emerald-700 font-bold">
                      {passed}
                    </td>
                    <td className="p-3.5 text-center font-mono text-red-600 font-bold">
                      {remedial}
                    </td>
                    <td className="p-3.5 text-center">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                          isClassPassing
                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-300'
                            : 'bg-amber-50 text-amber-800 border border-amber-300'
                        }`}
                      >
                        {isClassPassing ? '✓ Memenuhi KKM' : '⚠ Perlu Intervensi'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
