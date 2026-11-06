import React, { useState, useEffect, useRef } from 'react';
import {
  StudentProfile,
  CurriculumBab,
  ExamSubmission,
  DirectChatMessage,
  RombelAssignment,
  UserPresence,
} from '../../types/curriculum';
import {
  getAllDirectMessages,
  sendDirectMessage,
  markMessagesAsReadByTeacher,
  syncMessagesWithServer,
} from '../../data/directMessagesData';
import { isBabAccessibleForStudent } from '../../data/rombelAssignments';
import {
  subscribeToLabPresence,
  updateTypingStatus,
} from '../../services/presenceService';
import { playChatNotificationChime } from '../../utils/audioChime';
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
  Radio,
  Activity,
  Volume2,
  VolumeX,
  Zap,
  Monitor,
} from 'lucide-react';

interface TeacherDirectChatAndProgressProps {
  students: StudentProfile[];
  submissions: Record<string, ExamSubmission>;
  babs: CurriculumBab[];
  rombelAssignments: Record<string, RombelAssignment>;
  onCancelSubmission: (key: string, reason: string) => void;
  onRestoreSubmission: (key: string) => void;
  initialSelectedStudentId?: string;
  initialTab?: 'progress' | 'chat';
}

export const TeacherDirectChatAndProgress: React.FC<TeacherDirectChatAndProgressProps> = ({
  students,
  submissions,
  babs,
  rombelAssignments,
  onCancelSubmission,
  onRestoreSubmission,
  initialSelectedStudentId,
  initialTab,
}) => {
  // Selection states
  const [selectedStudent, setSelectedStudent] = useState<StudentProfile | null>(() => {
    if (initialSelectedStudentId) {
      const found = students.find((s) => s.id === initialSelectedStudentId);
      if (found) return found;
    }
    return students[0] || null;
  });
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterSchool, setFilterSchool] = useState<string>('all');
  const [filterClass, setFilterClass] = useState<string>('all');
  const [filterProgressStatus, setFilterProgressStatus] = useState<'all' | 'pending' | 'completed' | 'remedial'>('all');
  const [filterPresenceMode, setFilterPresenceMode] = useState<'all' | 'online_only' | 'cbt' | 'simulation' | 'essay'>('all');
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);

  // Presence state from Firestore and Server
  const [presences, setPresences] = useState<Record<string, UserPresence>>({});

  // Messages state
  const [allMessages, setAllMessages] = useState<DirectChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState<string>('');
  const [selectedTag, setSelectedTag] = useState<DirectChatMessage['tag']>('umum');
  const [selectedBabRef, setSelectedBabRef] = useState<number | undefined>(undefined);
  const [activeTab, setActiveTab] = useState<'progress' | 'chat'>(initialTab || 'progress');

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimerRef = useRef<any>(null);
  const prevMsgLengthRef = useRef<number>(0);

  // Sync initial student selection if passed
  useEffect(() => {
    if (initialSelectedStudentId) {
      const match = students.find((s) => s.id === initialSelectedStudentId);
      if (match) {
        setSelectedStudent(match);
        if (initialTab) {
          setActiveTab(initialTab);
        }
      }
    }
  }, [initialSelectedStudentId, initialTab, students]);

  // Subscribe to real-time Lab Presence
  useEffect(() => {
    const unsubscribe = subscribeToLabPresence((updated) => {
      setPresences(updated);
    });
    return () => {
      unsubscribe();
    };
  }, []);

  // Chime when new student message arrives
  useEffect(() => {
    if (allMessages.length > prevMsgLengthRef.current && prevMsgLengthRef.current > 0) {
      const latest = allMessages[allMessages.length - 1];
      if (latest && latest.sender === 'siswa') {
        if (soundEnabled) {
          playChatNotificationChime();
        }
      }
    }
    prevMsgLengthRef.current = allMessages.length;
  }, [allMessages, soundEnabled]);

  // Load and subscribe to direct messages
  const reloadMessages = () => {
    setAllMessages(getAllDirectMessages());
  };

  useEffect(() => {
    reloadMessages();
    syncMessagesWithServer().then(() => reloadMessages());

    // 2-second live polling while teacher is viewing this screen
    const pollTimer = setInterval(async () => {
      await syncMessagesWithServer();
      reloadMessages();
    }, 2000);

    const handleUpdate = () => reloadMessages();
    window.addEventListener('tjkn_direct_messages_updated', handleUpdate);
    window.addEventListener('storage', handleUpdate);
    return () => {
      clearInterval(pollTimer);
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

  // Filter students with presence filter
  const filteredStudents = students.filter((s) => {
    const q = searchQuery.toLowerCase().trim();
    const matchSearch =
      !q ||
      s.name.toLowerCase().includes(q) ||
      s.noAbsen.includes(q) ||
      s.className.toLowerCase().includes(q) ||
      s.school.toLowerCase().includes(q);

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

    if (filterPresenceMode === 'online_only') {
      if (!presences[s.id]?.isOnline) return false;
    } else if (filterPresenceMode === 'cbt') {
      const pres = presences[s.id];
      if (!pres?.isOnline || pres.activityCategory !== 'cbt') return false;
    } else if (filterPresenceMode === 'simulation') {
      const pres = presences[s.id];
      if (!pres?.isOnline || pres.activityCategory !== 'simulation') return false;
    } else if (filterPresenceMode === 'essay') {
      const pres = presences[s.id];
      if (!pres?.isOnline || pres.activityCategory !== 'essay') return false;
    }

    return true;
  });

  // Online metrics for Radar Lab
  const onlineCount = Object.values(presences).filter((p) => p.isOnline && p.role === 'siswa').length;
  const cbtCount = Object.values(presences).filter((p) => p.isOnline && p.role === 'siswa' && p.activityCategory === 'cbt').length;
  const simCount = Object.values(presences).filter((p) => p.isOnline && p.role === 'siswa' && p.activityCategory === 'simulation').length;
  const essayCount = Object.values(presences).filter((p) => p.isOnline && p.role === 'siswa' && p.activityCategory === 'essay').length;

  // Current student conversation
  const studentMessages = selectedStudent
    ? allMessages.filter((m) => m.studentId === selectedStudent.id)
    : [];

  const handleInputChange = (text: string) => {
    setInputMessage(text);
    if (!selectedStudent) return;
    updateTypingStatus('teacher_simon', selectedStudent.id);
    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    typingTimerRef.current = setTimeout(() => {
      updateTypingStatus('teacher_simon', null);
    }, 2500);
  };

  const handleSendMessage = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputMessage.trim() || !selectedStudent) return;

    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    updateTypingStatus('teacher_simon', null);

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
  const selectedPresence = selectedStudent ? presences[selectedStudent.id] : null;

  return (
    <div className="bg-white border border-slate-200 rounded-3xl shadow-xs overflow-hidden">
      {/* Top Banner with Real-Time Lab Radar */}
      <div className="p-6 border-b border-slate-200 bg-slate-900 text-white flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="p-2 bg-blue-500/20 text-blue-400 rounded-xl border border-blue-500/30">
              <Radio className="w-5 h-5 animate-pulse text-emerald-400" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-black tracking-tight text-white">
                  Radar Lab & Live Chat Siswa (Real-Time)
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-[10px] font-mono font-bold flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                  RADAR AKTIF
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Mendeteksi siswa yang sedang online di lab komputer, materi/soal yang sedang mereka buka secara live, dan komunikasi bimbingan 2 arah.
              </p>
            </div>
          </div>
        </div>

        {/* Live Lab Metrics & Audio Control */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center gap-1.5 bg-slate-800/80 p-1 rounded-xl border border-slate-700/80 text-xs font-mono">
            <div className="px-3 py-1 rounded-lg bg-emerald-950/60 text-emerald-300 border border-emerald-800/60 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span className="font-bold">{onlineCount}</span>
              <span className="text-[11px] text-emerald-400/80">Online</span>
            </div>
            <div className="px-2.5 py-1 rounded-lg text-slate-300">
              <span className="font-bold text-white">{cbtCount}</span> CBT
            </div>
            <div className="px-2.5 py-1 rounded-lg text-slate-300">
              <span className="font-bold text-white">{simCount}</span> Simulator
            </div>
            <div className="px-2.5 py-1 rounded-lg text-slate-300">
              <span className="font-bold text-white">{essayCount}</span> Esai
            </div>
          </div>

          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            title={soundEnabled ? 'Notifikasi Suara Aktif (Klik untuk Mute)' : 'Notifikasi Suara Nonaktif (Klik untuk Bunyi)'}
            className={`p-2 rounded-xl border transition flex items-center gap-1.5 text-xs font-mono ${
              soundEnabled
                ? 'bg-blue-600/30 border-blue-500/50 text-blue-300 hover:bg-blue-600/50'
                : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700'
            }`}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4 text-blue-400" /> : <VolumeX className="w-4 h-4" />}
            <span className="hidden sm:inline">{soundEnabled ? 'Suara ON' : 'Mute'}</span>
          </button>
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

            {/* Progress Filter Badges */}
            <div className="flex items-center gap-1.5 pt-1 overflow-x-auto text-[11px]">
              <button
                onClick={() => setFilterProgressStatus('all')}
                className={`px-2.5 py-1 rounded-lg font-medium transition ${
                  filterProgressStatus === 'all'
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Semua Progres
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

            {/* Radar Lab Activity Filter Badges */}
            <div className="pt-2 border-t border-slate-100 flex items-center gap-1.5 overflow-x-auto text-[10px] font-mono">
              <span className="text-slate-400 font-bold shrink-0">Radar:</span>
              <button
                onClick={() => setFilterPresenceMode('all')}
                className={`px-2 py-0.5 rounded-md font-bold transition shrink-0 ${
                  filterPresenceMode === 'all'
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Semua ({students.length})
              </button>
              <button
                onClick={() => setFilterPresenceMode('online_only')}
                className={`px-2 py-0.5 rounded-md font-bold transition shrink-0 flex items-center gap-1 ${
                  filterPresenceMode === 'online_only'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>Online ({onlineCount})</span>
              </button>
              <button
                onClick={() => setFilterPresenceMode('cbt')}
                className={`px-2 py-0.5 rounded-md font-bold transition shrink-0 ${
                  filterPresenceMode === 'cbt'
                    ? 'bg-purple-600 text-white'
                    : 'bg-purple-50 text-purple-700 border border-purple-200 hover:bg-purple-100'
                }`}
              >
                CBT ({cbtCount})
              </button>
              <button
                onClick={() => setFilterPresenceMode('simulation')}
                className={`px-2 py-0.5 rounded-md font-bold transition shrink-0 ${
                  filterPresenceMode === 'simulation'
                    ? 'bg-blue-600 text-white'
                    : 'bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100'
                }`}
              >
                Sim ({simCount})
              </button>
              <button
                onClick={() => setFilterPresenceMode('essay')}
                className={`px-2 py-0.5 rounded-md font-bold transition shrink-0 ${
                  filterPresenceMode === 'essay'
                    ? 'bg-amber-600 text-white'
                    : 'bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100'
                }`}
              >
                Esai ({essayCount})
              </button>
            </div>
          </div>

          {/* Student List Scrollable */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-100 max-h-[560px]">
            {filteredStudents.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">
                Tidak ada siswa yang sesuai filter saat ini.
              </div>
            ) : (
              filteredStudents.map((student) => {
                const stats = getStudentStats(student);
                const isSelected = selectedStudent?.id === student.id;
                const unreadFromStudent = allMessages.filter(
                  (m) => m.studentId === student.id && m.sender === 'siswa' && !m.isReadByTeacher
                ).length;
                const pres = presences[student.id];
                const isOnline = Boolean(pres?.isOnline);

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
                      <div className="relative">
                        <div
                          className={`w-9 h-9 rounded-xl flex items-center justify-center text-xs font-mono font-bold shrink-0 ${
                            isSelected
                              ? 'bg-blue-600 text-white'
                              : 'bg-slate-200 text-slate-700'
                          }`}
                        >
                          {student.noAbsen}
                        </div>
                        {isOnline && (
                          <span className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white animate-pulse"></span>
                        )}
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold text-slate-900 truncate">
                            {student.name}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500 font-mono truncate">
                          {student.className} •{' '}
                          {student.school.includes('MUDITA') ? 'SMK Mudita' : 'SMKN 1'}
                        </div>

                        {/* Live Activity Badge */}
                        {isOnline && pres?.currentActivity ? (
                          <div className="text-[10px] font-semibold text-emerald-700 flex items-center gap-1 mt-0.5 truncate bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200/80 max-w-[200px]">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0"></span>
                            <span className="truncate">{pres.currentActivity}</span>
                          </div>
                        ) : (
                          <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                            Offline di Lab
                          </div>
                        )}
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
                  <div className="relative">
                    <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white font-mono font-extrabold flex items-center justify-center text-base shadow-xs">
                      {selectedStudent.noAbsen}
                    </div>
                    {selectedPresence?.isOnline && (
                      <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-white animate-ping"></span>
                    )}
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

              {/* Real-Time Student Activity Radar Bar */}
              <div className="px-5 py-2.5 bg-slate-100/90 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-2">
                  {selectedPresence?.isOnline ? (
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 text-[11px] font-bold flex items-center gap-1.5 font-mono">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                      <span>ONLINE DI LAB</span>
                    </span>
                  ) : (
                    <span className="px-2.5 py-0.5 rounded-full bg-slate-200 text-slate-600 text-[11px] font-bold font-mono">
                      OFFLINE
                    </span>
                  )}
                  <div className="text-slate-800 font-medium">
                    <span className="text-slate-500">Sedang Mengerjakan: </span>
                    <span className="font-bold text-slate-900">
                      {selectedPresence?.currentActivity || 'Belum ada aktivitas baru'}
                    </span>
                  </div>
                </div>

                {selectedPresence?.deviceLabel && (
                  <div className="text-[11px] font-mono text-slate-500 flex items-center gap-1">
                    <Monitor className="w-3.5 h-3.5 text-slate-400" />
                    <span>{selectedPresence.deviceLabel}</span>
                  </div>
                )}
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
                      Template Bimbingan Cepat:
                    </span>
                    <button
                      onClick={() =>
                        applyTemplate(
                          'Halo {nama}, apakah ada kendala atau kesulitan pada materi/simulasi yang sedang kamu buka saat ini? Silakan tanyakan ke Pak Simon.',
                          'umum'
                        )
                      }
                      className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-700 hover:border-blue-500 hover:text-blue-700 transition shrink-0"
                    >
                      ❓ Tanya Kendala Siswa
                    </button>
                    <button
                      onClick={() =>
                        applyTemplate(
                          'Halo {nama}, perhatikan alokasi waktu evaluasi CBT kamu ya. Jangan terburu-buru, periksa kembali jawaban sebelum submit.',
                          'pengingat'
                        )
                      }
                      className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-700 hover:border-amber-500 hover:text-amber-700 transition shrink-0"
                    >
                      ⏱️ Pengingat Waktu CBT
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
                          'Halo {nama}, pastikan memperhatikan parameter redaman kabel fiber optic dan polarisasi antena di simulator ya.',
                          'bimbingan'
                        )
                      }
                      className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-700 hover:border-blue-500 hover:text-blue-700 transition shrink-0"
                    >
                      🔧 Bimbingan Praktik Simulator
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

                    {/* Live Student Typing Indicator */}
                    {selectedPresence?.isTypingTo === 'teacher_simon' && (
                      <div className="flex items-center gap-2 p-2.5 px-3.5 rounded-2xl bg-blue-50 border border-blue-200/80 text-blue-700 text-xs w-fit animate-pulse">
                        <div className="flex gap-1 items-center">
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-bounce"></span>
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-bounce [animation-delay:0.2s]"></span>
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-bounce [animation-delay:0.4s]"></span>
                        </div>
                        <span className="font-semibold">{selectedStudent.name} sedang mengetik pesan...</span>
                      </div>
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
                        onChange={(e) => handleInputChange(e.target.value)}
                        onBlur={() => updateTypingStatus('teacher_simon', null)}
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
