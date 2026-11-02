import React, { useState, useEffect, useRef } from 'react';
import {
  StudentProfile,
  CurriculumBab,
  ExamSubmission,
  DirectChatMessage,
  RombelAssignment,
} from '../../types/curriculum';
import {
  getAllDirectMessages,
  sendDirectMessage,
  markMessagesAsReadByTeacher,
} from '../../data/directMessagesData';
import { isBabAccessibleForStudent } from '../../data/rombelAssignments';
import {
  Users,
  Search,
  Filter,
  Send,
  CheckCircle2,
  AlertTriangle,
  Clock,
  MessageSquare,
  BarChart2,
  ShieldAlert,
  Sparkles,
  BookOpen,
  Play,
  FileQuestion,
  PenTool,
  Check,
  CheckCheck,
  CornerDownRight,
  RefreshCw,
  XCircle,
  Award,
} from 'lucide-react';

interface TeacherDirectChatAndProgressProps {
  students: StudentProfile[];
  submissions: Record<string, ExamSubmission>;
  babs: CurriculumBab[];
  rombelAssignments: Record<string, RombelAssignment>;
  onCancelSubmission: (key: string, reason: string) => void;
  onRestoreSubmission: (key: string) => void;
}

export const TeacherDirectChatAndProgress: React.FC<TeacherDirectChatAndProgressProps> = ({
  students,
  submissions,
  babs,
  rombelAssignments,
  onCancelSubmission,
  onRestoreSubmission,
}) => {
  // Selection states
  const [selectedStudent, setSelectedStudent] = useState<StudentProfile | null>(students[0] || null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterSchool, setFilterSchool] = useState<string>('all');
  const [filterClass, setFilterClass] = useState<string>('all');
  const [filterProgressStatus, setFilterProgressStatus] = useState<'all' | 'pending' | 'completed' | 'remedial'>('all');

  // Messages state
  const [allMessages, setAllMessages] = useState<DirectChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState<string>('');
  const [selectedTag, setSelectedTag] = useState<DirectChatMessage['tag']>('umum');
  const [selectedBabRef, setSelectedBabRef] = useState<number | undefined>(undefined);
  const [activeTab, setActiveTab] = useState<'progress' | 'chat'>('progress');

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load and subscribe to direct messages
  const reloadMessages = () => {
    setAllMessages(getAllDirectMessages());
  };

  useEffect(() => {
    reloadMessages();
    const handleUpdate = () => reloadMessages();
    window.addEventListener('tjkn_direct_messages_updated', handleUpdate);
    window.addEventListener('storage', handleUpdate);
    return () => {
      window.removeEventListener('tjkn_direct_messages_updated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, []);

  // When selected student changes, mark their messages as read by teacher
  useEffect(() => {
    if (selectedStudent) {
      markMessagesAsReadByTeacher(selectedStudent.id);
      reloadMessages();
    }
  }, [selectedStudent]);

  // Scroll to bottom of chat
  useEffect(() => {
    if (activeTab === 'chat') {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [allMessages, activeTab, selectedStudent]);

  // Unique lists for filters
  const uniqueSchools = Array.from(new Set(students.map((s) => s.school)));
  const uniqueClasses = Array.from(
    new Set(
      students
        .filter((s) => filterSchool === 'all' || s.school === filterSchool)
        .map((s) => s.className)
    )
  );

  // Helper to compute student overall progress
  const getStudentStats = (student: StudentProfile) => {
    const assignedBabs = babs.filter((b) => isBabAccessibleForStudent(student, b.id, rombelAssignments));
    const totalAssigned = assignedBabs.length;

    let completedCount = 0;
    let remedialCount = 0;
    let pendingCount = 0;

    assignedBabs.forEach((bab) => {
      const subKey = `${student.id}_${bab.id}`;
      const sub = submissions[subKey];
      if (!sub || sub.status === 'cancelled_by_teacher') {
        pendingCount++;
      } else if (sub.isPassed) {
        completedCount++;
      } else {
        remedialCount++;
      }
    });

    return {
      assignedBabs,
      totalAssigned,
      completedCount,
      remedialCount,
      pendingCount,
      isFullyCompleted: totalAssigned > 0 && completedCount === totalAssigned,
      hasRemedial: remedialCount > 0,
      hasPending: pendingCount > 0,
    };
  };

  // Filter students
  const filteredStudents = students.filter((s) => {
    const q = searchQuery.toLowerCase().trim();
    const matchSearch =
      !q ||
      s.name.toLowerCase().includes(q) ||
      s.noAbsen.includes(q) ||
      s.className.toLowerCase().includes(q) ||
      s.school.toLowerCase().includes(q);

    // If searching explicitly by name, don't hide by school or class filter
    const isExplicitNameSearch = Boolean(q && s.name.toLowerCase().includes(q));

    const matchSchool = isExplicitNameSearch || filterSchool === 'all' || s.school === filterSchool;
    const matchClass = isExplicitNameSearch || filterClass === 'all' || s.className === filterClass;

    if (!matchSearch || !matchSchool || !matchClass) return false;

    if (filterProgressStatus !== 'all') {
      const stats = getStudentStats(s);
      if (filterProgressStatus === 'completed' && !stats.isFullyCompleted) return false;
      if (filterProgressStatus === 'pending' && !stats.hasPending) return false;
      if (filterProgressStatus === 'remedial' && !stats.hasRemedial) return false;
    }

    return true;
  });

  // Current student conversation
  const studentMessages = selectedStudent
    ? allMessages.filter((m) => m.studentId === selectedStudent.id)
    : [];

  const handleSendMessage = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputMessage.trim() || !selectedStudent) return;

    sendDirectMessage({
      sender: 'guru',
      teacherName: 'Simon Murd',
      studentId: selectedStudent.id,
      studentName: selectedStudent.name,
      className: selectedStudent.className,
      school: selectedStudent.school,
      message: inputMessage.trim(),
      isReadByTeacher: true,
      isReadByStudent: false,
      babReference: selectedBabRef,
      tag: selectedTag,
    });

    setInputMessage('');
    reloadMessages();
  };

  // Quick message template applicator
  const applyTemplate = (templateText: string, tag: DirectChatMessage['tag'], babId?: number) => {
    if (!selectedStudent) return;
    const resolved = templateText
      .replace('{nama}', selectedStudent.name)
      .replace('{kelas}', selectedStudent.className);
    setInputMessage(resolved);
    setSelectedTag(tag);
    if (babId) setSelectedBabRef(babId);
    setActiveTab('chat');
  };

  const selectedStats = selectedStudent ? getStudentStats(selectedStudent) : null;

  return (
    <div className="bg-white border border-slate-200 rounded-3xl shadow-xs overflow-hidden">
      {/* Top Banner */}
      <div className="p-6 border-b border-slate-200 bg-slate-50/50 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-blue-100 text-blue-700 rounded-xl">
              <MessageSquare className="w-5 h-5" />
            </span>
            <h3 className="text-lg font-bold text-slate-900">
              Pengecekan Progres & Chat Langsung Siswa
            </h3>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Pilih nama siswa untuk memantau tugas yang diberikan/selesai, serta kirim bimbingan atau instruksi langsung dari Pak Simon Murd.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono">
          <span className="px-3 py-1.5 rounded-xl bg-blue-50 text-blue-700 border border-blue-200 font-semibold">
            Instruktur: Simon Murd
          </span>
          <span className="px-3 py-1.5 rounded-xl bg-slate-100 text-slate-700 border border-slate-200">
            {filteredStudents.length} Siswa Terfilter
          </span>
        </div>
      </div>

      {/* Main Split Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[640px]">
        {/* Left Column: Student List & Filter (4 cols) */}
        <div className="lg:col-span-4 border-r border-slate-200 flex flex-col bg-slate-50/30">
          {/* Search & Filters */}
          <div className="p-4 border-b border-slate-200 space-y-2.5 bg-white">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Cari nama, absen, atau kelas..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              />
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <select
                value={filterSchool}
                onChange={(e) => {
                  setFilterSchool(e.target.value);
                  setFilterClass('all');
                }}
                className="rounded-lg border border-slate-200 py-1.5 px-2 bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500 truncate"
              >
                <option value="all">Semua Sekolah</option>
                {uniqueSchools.map((sch) => (
                  <option key={sch} value={sch}>
                    {sch.includes('MUDITA') ? 'SMK Mudita' : 'SMKN 1 Singkawang'}
                  </option>
                ))}
              </select>

              <select
                value={filterClass}
                onChange={(e) => setFilterClass(e.target.value)}
                className="rounded-lg border border-slate-200 py-1.5 px-2 bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500 truncate"
              >
                <option value="all">Semua Rombel</option>
                {uniqueClasses.map((cls) => (
                  <option key={cls} value={cls}>
                    {cls}
                  </option>
                ))}
              </select>
            </div>

            {/* Quick Filter Badges */}
            <div className="flex items-center gap-1.5 pt-1 overflow-x-auto text-[11px]">
              <button
                onClick={() => setFilterProgressStatus('all')}
                className={`px-2.5 py-1 rounded-lg font-medium transition ${
                  filterProgressStatus === 'all'
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Semua
              </button>
              <button
                onClick={() => setFilterProgressStatus('pending')}
                className={`px-2.5 py-1 rounded-lg font-medium transition flex items-center gap-1 ${
                  filterProgressStatus === 'pending'
                    ? 'bg-amber-600 text-white'
                    : 'bg-amber-50 text-amber-700 hover:bg-amber-100'
                }`}
              >
                <Clock className="w-3 h-3" />
                <span>Belum Tuntas</span>
              </button>
              <button
                onClick={() => setFilterProgressStatus('remedial')}
                className={`px-2.5 py-1 rounded-lg font-medium transition flex items-center gap-1 ${
                  filterProgressStatus === 'remedial'
                    ? 'bg-red-600 text-white'
                    : 'bg-red-50 text-red-700 hover:bg-red-100'
                }`}
              >
                <AlertTriangle className="w-3 h-3" />
                <span>Remedial</span>
              </button>
              <button
                onClick={() => setFilterProgressStatus('completed')}
                className={`px-2.5 py-1 rounded-lg font-medium transition flex items-center gap-1 ${
                  filterProgressStatus === 'completed'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                }`}
              >
                <CheckCircle2 className="w-3 h-3" />
                <span>Lengkap</span>
              </button>
            </div>
          </div>

          {/* Student List Scrollable */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-100 max-h-[560px]">
            {filteredStudents.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">
                Tidak ada siswa yang sesuai filter.
              </div>
            ) : (
              filteredStudents.map((student) => {
                const stats = getStudentStats(student);
                const isSelected = selectedStudent?.id === student.id;
                const unreadFromStudent = allMessages.filter(
                  (m) => m.studentId === student.id && m.sender === 'siswa' && !m.isReadByTeacher
                ).length;

                return (
                  <div
                    key={student.id}
                    onClick={() => setSelectedStudent(student)}
                    className={`p-3.5 cursor-pointer transition flex items-center justify-between gap-3 text-left ${
                      isSelected
                        ? 'bg-blue-50/80 border-l-4 border-blue-600'
                        : 'hover:bg-slate-100/60'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center text-xs font-mono font-bold shrink-0 ${
                          isSelected
                            ? 'bg-blue-600 text-white'
                            : 'bg-slate-200 text-slate-700'
                        }`}
                      >
                        {student.noAbsen}
                      </div>

                      <div className="min-w-0">
                        <div className="text-xs font-bold text-slate-900 truncate">
                          {student.name}
                        </div>
                        <div className="text-[11px] text-slate-500 font-mono truncate">
                          {student.className} •{' '}
                          {student.school.includes('MUDITA') ? 'SMK Mudita' : 'SMKN 1'}
                        </div>
                      </div>
                    </div>

                    {/* Status Indicator */}
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      {unreadFromStudent > 0 && (
                        <span className="px-1.5 py-0.5 rounded-full bg-red-600 text-white text-[10px] font-bold animate-pulse">
                          {unreadFromStudent} pesan
                        </span>
                      )}

                      {stats.isFullyCompleted ? (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold">
                          {stats.completedCount}/{stats.totalAssigned} Tuntas
                        </span>
                      ) : stats.hasRemedial ? (
                        <span className="px-2 py-0.5 rounded-full bg-red-50 text-red-700 border border-red-200 text-[10px] font-bold">
                          {stats.remedialCount} Remedial
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-bold">
                          {stats.completedCount}/{stats.totalAssigned} Selesai
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Student Detail, Progress, & Chat (8 cols) */}
        <div className="lg:col-span-8 flex flex-col bg-white">
          {selectedStudent && selectedStats ? (
            <>
              {/* Selected Student Header Card */}
              <div className="p-5 border-b border-slate-200 flex flex-wrap items-center justify-between gap-4 bg-slate-50/40">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white font-mono font-extrabold flex items-center justify-center text-base shadow-xs">
                    {selectedStudent.noAbsen}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-extrabold text-base text-slate-900">
                        {selectedStudent.name}
                      </h4>
                      <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 text-[11px] font-mono font-bold border border-blue-200">
                        {selectedStudent.className}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 font-mono mt-0.5">
                      {selectedStudent.school}
                    </p>
                  </div>
                </div>

                {/* Sub-Tabs: Progres Tugas vs Chat Langsung */}
                <div className="flex items-center bg-slate-200/80 p-1 rounded-xl text-xs font-semibold">
                  <button
                    onClick={() => setActiveTab('progress')}
                    className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg transition ${
                      activeTab === 'progress'
                        ? 'bg-white text-slate-900 shadow-2xs font-bold'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <BarChart2 className="w-3.5 h-3.5 text-blue-600" />
                    <span>Cek Progres Tugas</span>
                  </button>

                  <button
                    onClick={() => setActiveTab('chat')}
                    className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg transition ${
                      activeTab === 'chat'
                        ? 'bg-white text-slate-900 shadow-2xs font-bold'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <MessageSquare className="w-3.5 h-3.5 text-blue-600" />
                    <span>Chat ke Siswa ({studentMessages.length})</span>
                  </button>
                </div>
              </div>

              {/* View 1: Detailed Task Progress */}
              {activeTab === 'progress' && (
                <div className="p-6 space-y-6 overflow-y-auto max-h-[560px]">
                  {/* Progress Metric Summary Cards */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200 text-left">
                      <div className="text-[11px] font-mono text-blue-700 font-semibold">
                        Tugas Ditugaskan
                      </div>
                      <div className="text-2xl font-black text-blue-900 mt-1">
                        {selectedStats.totalAssigned} <span className="text-xs font-normal text-blue-700">Bab</span>
                      </div>
                    </div>

                    <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-left">
                      <div className="text-[11px] font-mono text-emerald-700 font-semibold">
                        Tuntas KKM (&gt;= 75)
                      </div>
                      <div className="text-2xl font-black text-emerald-900 mt-1">
                        {selectedStats.completedCount} <span className="text-xs font-normal text-emerald-700">Bab</span>
                      </div>
                    </div>

                    <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-left">
                      <div className="text-[11px] font-mono text-amber-700 font-semibold">
                        Belum Dikerjakan
                      </div>
                      <div className="text-2xl font-black text-amber-900 mt-1">
                        {selectedStats.pendingCount} <span className="text-xs font-normal text-amber-700">Bab</span>
                      </div>
                    </div>

                    <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-left">
                      <div className="text-[11px] font-mono text-red-700 font-semibold">
                        Perlu Remedial
                      </div>
                      <div className="text-2xl font-black text-red-900 mt-1">
                        {selectedStats.remedialCount} <span className="text-xs font-normal text-red-700">Bab</span>
                      </div>
                    </div>
                  </div>

                  {/* List of Assigned Babs with Task Breakdown */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h5 className="text-xs font-bold text-slate-800 uppercase tracking-wider font-mono">
                        Daftar Penugasan Modul Rombel {selectedStudent.className}
                      </h5>
                      <span className="text-xs text-slate-400">
                        {selectedStats.assignedBabs.length} Modul Terbuka
                      </span>
                    </div>

                    <div className="space-y-3">
                      {selectedStats.assignedBabs.map((bab) => {
                        const subKey = `${selectedStudent.id}_${bab.id}`;
                        const sub = submissions[subKey];
                        const isCancelled = sub?.status === 'cancelled_by_teacher';
                        const isCompleted = sub && sub.isPassed && !isCancelled;
                        const isRemedial = sub && !sub.isPassed && !isCancelled;
                        const isPending = !sub || isCancelled;

                        return (
                          <div
                            key={bab.id}
                            className={`p-4 rounded-2xl border transition ${
                              isCancelled
                                ? 'bg-red-50/40 border-red-200'
                                : isCompleted
                                ? 'bg-emerald-50/20 border-emerald-200'
                                : isRemedial
                                ? 'bg-amber-50/30 border-amber-200'
                                : 'bg-slate-50/50 border-slate-200'
                            }`}
                          >
                            <div className="flex flex-wrap items-start justify-between gap-3">
                              <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <span className="px-2 py-0.5 rounded-md bg-white border border-slate-200 text-xs font-mono font-bold text-slate-800">
                                    {bab.code}
                                  </span>
                                  <h6 className="font-bold text-sm text-slate-900">
                                    {bab.title}
                                  </h6>
                                </div>
                                <p className="text-xs text-slate-500">
                                  Alokasi: {bab.hoursAllocation} JP • {bab.grade} Semester {bab.semester}
                                </p>
                              </div>

                              {/* Status Badge */}
                              <div className="flex items-center gap-2">
                                {isCancelled ? (
                                  <span className="px-2.5 py-1 rounded-xl bg-red-100 text-red-800 border border-red-300 text-xs font-bold flex items-center gap-1">
                                    <XCircle className="w-3.5 h-3.5 text-red-600" />
                                    <span>Ujian Dibatalkan Guru</span>
                                  </span>
                                ) : isCompleted ? (
                                  <span className="px-2.5 py-1 rounded-xl bg-emerald-100 text-emerald-800 border border-emerald-300 text-xs font-bold flex items-center gap-1">
                                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                    <span>Tuntas KKM ({sub.percentage}%)</span>
                                  </span>
                                ) : isRemedial ? (
                                  <span className="px-2.5 py-1 rounded-xl bg-amber-100 text-amber-800 border border-amber-300 text-xs font-bold flex items-center gap-1">
                                    <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                                    <span>Remedial ({sub.percentage}%)</span>
                                  </span>
                                ) : (
                                  <span className="px-2.5 py-1 rounded-xl bg-slate-200 text-slate-700 border border-slate-300 text-xs font-bold flex items-center gap-1">
                                    <Clock className="w-3.5 h-3.5 text-slate-500" />
                                    <span>Belum Dikerjakan</span>
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Breakdown of 3 Architecture Parts */}
                            <div className="mt-3 pt-3 border-t border-slate-200/60 grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                              {/* Part 1: Simulation */}
                              <div className="p-2.5 rounded-xl bg-white border border-slate-200 flex items-center gap-2">
                                <Play className="w-4 h-4 text-blue-600 shrink-0" />
                                <div>
                                  <div className="font-semibold text-slate-800">Part 1: Simulasi</div>
                                  <div className="text-[11px] text-slate-500">
                                    {sub ? 'Praktik Dilakukan' : 'Belum Praktik'}
                                  </div>
                                </div>
                              </div>

                              {/* Part 2: Objective Exam (40 Soal) */}
                              <div className="p-2.5 rounded-xl bg-white border border-slate-200 flex items-center justify-between gap-2">
                                <div className="flex items-center gap-2">
                                  <FileQuestion className="w-4 h-4 text-emerald-600 shrink-0" />
                                  <div>
                                    <div className="font-semibold text-slate-800">Part 2: CBT 40 Soal</div>
                                    <div className="text-[11px] text-slate-500">
                                      {sub ? `${sub.percentage}% (${sub.timeSpentSeconds}s)` : 'Belum Submit'}
                                    </div>
                                  </div>
                                </div>
                                {sub?.isFlaggedTooFast && (
                                  <span className="px-1.5 py-0.5 rounded bg-red-100 text-red-700 text-[10px] font-bold">
                                    Terlalu Cepat
                                  </span>
                                )}
                              </div>

                              {/* Part 3: Qualitative Essay */}
                              <div className="p-2.5 rounded-xl bg-white border border-slate-200 flex items-center gap-2">
                                <PenTool className="w-4 h-4 text-purple-600 shrink-0" />
                                <div>
                                  <div className="font-semibold text-slate-800">Part 3: 10 Esai</div>
                                  <div className="text-[11px] text-slate-500">
                                    {sub ? 'Tersimpan' : 'Belum Dijawab'}
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Action Buttons for this specific Bab */}
                            <div className="mt-3 flex flex-wrap items-center justify-end gap-2 text-xs">
                              {isCancelled ? (
                                <button
                                  onClick={() => onRestoreSubmission(subKey)}
                                  className="px-3 py-1.5 rounded-xl bg-slate-900 text-white font-semibold hover:bg-slate-800 transition flex items-center gap-1.5"
                                >
                                  <RefreshCw className="w-3.5 h-3.5" />
                                  <span>Pulihkan Ujian</span>
                                </button>
                              ) : sub ? (
                                sub.isFlaggedTooFast && (
                                  <button
                                    onClick={() => onCancelSubmission(subKey, 'Durasi pengerjaan terlalu cepat / tidak wajar')}
                                    className="px-3 py-1.5 rounded-xl bg-red-50 text-red-700 border border-red-200 font-semibold hover:bg-red-100 transition flex items-center gap-1.5"
                                  >
                                    <ShieldAlert className="w-3.5 h-3.5" />
                                    <span>Batalkan Karena Terlalu Cepat</span>
                                  </button>
                                )
                              ) : null}

                              {/* Quick Message Button regarding this Bab */}
                              <button
                                onClick={() => {
                                  if (isPending) {
                                    applyTemplate(
                                      `Halo {nama}, tugas ${bab.code} (${bab.title}) terpantau belum kamu selesaikan. Tolong segera kerjakan ya.`,
                                      'pengingat',
                                      bab.id
                                    );
                                  } else if (isRemedial) {
                                    applyTemplate(
                                      `Halo {nama}, nilai CBT ${bab.code} kamu (${sub?.percentage}%) masih di bawah KKM 75. Silakan pelajari kembali modul dan kerjakan remedial ya.`,
                                      'teguran',
                                      bab.id
                                    );
                                  } else {
                                    applyTemplate(
                                      `Selamat {nama}! Hasil pengerjaan ${bab.code} kamu sangat baik (${sub?.percentage}%). Pertahankan prestasinya!`,
                                      'apresiasi',
                                      bab.id
                                    );
                                  }
                                }}
                                className="px-3 py-1.5 rounded-xl bg-blue-50 text-blue-700 border border-blue-200 font-semibold hover:bg-blue-100 transition flex items-center gap-1.5"
                              >
                                <MessageSquare className="w-3.5 h-3.5" />
                                <span>Kirim Pesan Bimbingan {bab.code}</span>
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* View 2: Direct Chat Thread with the Student */}
              {activeTab === 'chat' && (
                <div className="flex flex-col h-[560px]">
                  {/* Chat Template Quick Shortcuts */}
                  <div className="p-3 bg-slate-50 border-b border-slate-200 flex items-center gap-2 overflow-x-auto text-xs">
                    <span className="text-[11px] font-mono text-slate-500 font-bold shrink-0">
                      Template Cepat:
                    </span>
                    <button
                      onClick={() =>
                        applyTemplate(
                          'Halo {nama}, tugas LKPD & CBT kamu belum selesai. Mohon segera diselesaikan hari ini ya.',
                          'pengingat'
                        )
                      }
                      className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-700 hover:border-blue-500 hover:text-blue-700 transition shrink-0"
                    >
                      ⚠️ Pengingat Tugas Belum Selesai
                    </button>
                    <button
                      onClick={() =>
                        applyTemplate(
                          'Halo {nama}, nilai ujian CBT kamu terdeteksi di bawah KKM. Silakan review materi dan lakukan ujian remedial.',
                          'teguran'
                        )
                      }
                      className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-700 hover:border-red-500 hover:text-red-700 transition shrink-0"
                    >
                      📝 Teguran Remedial
                    </button>
                    <button
                      onClick={() =>
                        applyTemplate(
                          'Bagus sekali {nama}! Nilai dan pemahaman kamu sudah tuntas di atas KKM. Lanjutkan ke modul berikutnya.',
                          'apresiasi'
                        )
                      }
                      className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-700 hover:border-emerald-500 hover:text-emerald-700 transition shrink-0"
                    >
                      👏 Apresiasi Prestasi
                    </button>
                    <button
                      onClick={() =>
                        applyTemplate(
                          'Halo {nama}, perhatikan SOP K3 dan ketelitian urutan warna kabel T568B saat praktikum crimping di bengkel ya.',
                          'bimbingan'
                        )
                      }
                      className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-700 hover:border-blue-500 hover:text-blue-700 transition shrink-0"
                    >
                      🔧 Bimbingan Praktik
                    </button>
                  </div>

                  {/* Message Bubbles Area */}
                  <div className="flex-1 p-5 overflow-y-auto space-y-4 bg-slate-50/20">
                    {studentMessages.length === 0 ? (
                      <div className="h-full flex flex-col items-center justify-center text-center p-8 text-slate-400">
                        <MessageSquare className="w-10 h-10 mb-2 opacity-30 text-blue-600" />
                        <p className="text-xs font-semibold text-slate-600">
                          Belum ada pesan dengan {selectedStudent.name}.
                        </p>
                        <p className="text-[11px] text-slate-400 mt-1 max-w-sm">
                          Tuliskan instruksi, teguran bagi yang belum tuntas, atau apresiasi prestasi belajar menggunakan formulir di bawah.
                        </p>
                      </div>
                    ) : (
                      studentMessages.map((msg) => {
                        const isTeacher = msg.sender === 'guru';

                        return (
                          <div
                            key={msg.id}
                            className={`flex flex-col ${
                              isTeacher ? 'items-end' : 'items-start'
                            }`}
                          >
                            <div className="flex items-center gap-1.5 mb-1 px-1">
                              <span className="text-[11px] font-bold text-slate-700">
                                {isTeacher ? 'Pak Simon Murd' : selectedStudent.name}
                              </span>
                              <span className="text-[10px] text-slate-400 font-mono">
                                {new Date(msg.timestamp).toLocaleTimeString('id-ID', {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </span>
                              {msg.tag && (
                                <span
                                  className={`px-1.5 py-0.2 rounded text-[9px] uppercase font-mono font-bold ${
                                    msg.tag === 'teguran'
                                      ? 'bg-red-100 text-red-700'
                                      : msg.tag === 'apresiasi'
                                      ? 'bg-emerald-100 text-emerald-700'
                                      : msg.tag === 'pengingat'
                                      ? 'bg-amber-100 text-amber-700'
                                      : 'bg-blue-100 text-blue-700'
                                  }`}
                                >
                                  {msg.tag}
                                </span>
                              )}
                            </div>

                            <div
                              className={`max-w-[85%] rounded-2xl px-4 py-3 text-xs leading-relaxed shadow-2xs ${
                                isTeacher
                                  ? 'bg-blue-600 text-white rounded-tr-xs'
                                  : 'bg-white border border-slate-200 text-slate-800 rounded-tl-xs'
                              }`}
                            >
                              {msg.message}
                            </div>

                            {/* Read receipt */}
                            {isTeacher && (
                              <div className="flex items-center gap-1 mt-1 text-[10px] text-slate-400 px-1 font-mono">
                                {msg.isReadByStudent ? (
                                  <>
                                    <CheckCheck className="w-3.5 h-3.5 text-blue-600" />
                                    <span>Dibaca Siswa</span>
                                  </>
                                ) : (
                                  <>
                                    <Check className="w-3.5 h-3.5 text-slate-400" />
                                    <span>Terkirim (Belum dibaca)</span>
                                  </>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })
                    )}
                    <div ref={messagesEndRef} />
                  </div>

                  {/* Send Message Form */}
                  <form
                    onSubmit={handleSendMessage}
                    className="p-4 border-t border-slate-200 bg-white space-y-2"
                  >
                    <div className="flex items-center gap-2 text-xs">
                      <span className="text-slate-500 font-mono text-[11px]">Kategori:</span>
                      <div className="flex items-center gap-1.5">
                        {(['umum', 'pengingat', 'teguran', 'apresiasi', 'bimbingan'] as const).map(
                          (tag) => (
                            <button
                              key={tag}
                              type="button"
                              onClick={() => setSelectedTag(tag)}
                              className={`px-2 py-0.5 rounded-md text-[10px] font-mono capitalize transition ${
                                selectedTag === tag
                                  ? 'bg-blue-600 text-white font-bold'
                                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                              }`}
                            >
                              {tag}
                            </button>
                          )
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <textarea
                        rows={2}
                        value={inputMessage}
                        onChange={(e) => setInputMessage(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleSendMessage();
                          }
                        }}
                        placeholder={`Ketik pesan langsung ke ${selectedStudent.name} (Tekan Enter untuk kirim)...`}
                        className="flex-1 rounded-xl border border-slate-200 p-2.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                      />
                      <button
                        type="submit"
                        disabled={!inputMessage.trim()}
                        className="px-4 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white font-bold text-xs transition flex items-center gap-1.5 shadow-xs shrink-0 self-stretch justify-center"
                      >
                        <Send className="w-4 h-4" />
                        <span>Kirim</span>
                      </button>
                    </div>
                  </form>
                </div>
              )}
            </>
          ) : (
            <div className="p-12 text-center text-slate-400 flex flex-col items-center justify-center h-full">
              <Users className="w-12 h-12 mb-3 text-slate-300" />
              <p className="text-sm font-semibold text-slate-700">Pilih salah satu siswa di sebelah kiri</p>
              <p className="text-xs text-slate-400 mt-1">
                Pilih siswa untuk melihat progres tugas yang telah dikerjakan dan mengirim pesan langsung.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
