import React, { useState, useEffect } from 'react';
import {
  StudentProfile,
  CurriculumBab,
  ExamSubmission,
  RombelAssignment,
} from '../../types/curriculum';
import { isBabAccessibleForStudent } from '../../data/rombelAssignments';
import { sendDirectMessage } from '../../data/directMessagesData';
import {
  Bot,
  Sparkles,
  Send,
  Copy,
  Check,
  Users,
  AlertTriangle,
  Clock,
  MessageSquare,
  School,
  BookOpen,
  Calendar,
  Share2,
  RefreshCw,
  FileText,
  Lightbulb,
} from 'lucide-react';

interface TeacherAiAssistantTabProps {
  students: StudentProfile[];
  submissions: Record<string, ExamSubmission>;
  babs: CurriculumBab[];
  rombelAssignments: Record<string, RombelAssignment>;
}

export const TeacherAiAssistantTab: React.FC<TeacherAiAssistantTabProps> = ({
  students,
  submissions,
  babs,
  rombelAssignments,
}) => {
  // Announcement Generator State
  const [selectedSchool, setSelectedSchool] = useState<string>('SMK NEGERI 1 SINGKAWANG');
  const [selectedClass, setSelectedClass] = useState<string>('X TJK');
  const [selectedBabId, setSelectedBabId] = useState<number>(1);
  const [deadlineInput, setDeadlineInput] = useState<string>('Besok malam pukul 23:59 WIB');
  const [customNote, setCustomNote] = useState<string>(
    'Penyelesaian LKPD & CBT ini wajib sebagai syarat penilaian portofolio semester kejuruan.'
  );

  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [generatedAnnouncement, setGeneratedAnnouncement] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);
  const [broadcastSentCount, setBroadcastSentCount] = useState<number | null>(null);

  // Chat Consultation State
  const [chatHistory, setChatHistory] = useState<Array<{ sender: 'guru' | 'assistant'; text: string; time: string }>>([
    {
      sender: 'assistant',
      text: 'Halo Pak Simon Murd! Saya Asisten Pribadi AI Anda. Saya siap membantu Bapak menganalisis siswa yang menunggak tugas, membuat draf pengumuman grup WhatsApp, serta merancang skenario pembelajaran kejuruan TKJ/TJKT. Ada yang bisa saya bantu hari ini?',
      time: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [chatInput, setChatInput] = useState<string>('');
  const [isChatLoading, setIsChatLoading] = useState<boolean>(false);

  // Unique schools and classes
  const uniqueSchools = Array.from(new Set(students.map((s) => s.school)));
  const classesForSchool = Array.from(
    new Set(students.filter((s) => s.school === selectedSchool).map((s) => s.className))
  );

  // Keep selectedClass synchronized if school changes
  useEffect(() => {
    if (classesForSchool.length > 0 && !classesForSchool.includes(selectedClass)) {
      setSelectedClass(classesForSchool[0]);
    }
  }, [selectedSchool]);

  const targetBab = babs.find((b) => b.id === selectedBabId) || babs[0];

  // Calculate pending students for the selected class & bab
  const classStudents = students.filter(
    (s) => s.school === selectedSchool && s.className === selectedClass
  );

  const pendingStudentsList = classStudents
    .map((student) => {
      const subKey = `${student.id}_${targetBab.id}`;
      const sub = submissions[subKey];
      const isCancelled = sub?.status === 'cancelled_by_teacher';
      const isCompleted = sub && sub.isPassed && !isCancelled;

      const missingTasks: string[] = [];
      if (!sub) {
        missingTasks.push('Belum Mengerjakan');
      } else if (isCancelled) {
        missingTasks.push('Ujian Dibatalkan');
      } else if (!sub.isPassed) {
        missingTasks.push(`Remedial (${sub.percentage}%)`);
      }

      return {
        student,
        isCompleted,
        missingTasks,
      };
    })
    .filter((item) => !item.isCompleted);

  // Generate WA Announcement using AI backend endpoint
  const handleGenerateAnnouncement = async () => {
    setIsGenerating(true);
    setCopied(false);
    setBroadcastSentCount(null);

    try {
      const payload = {
        action: 'generate_announcement',
        school: selectedSchool,
        className: selectedClass,
        babCode: targetBab.code,
        babTitle: targetBab.title,
        deadline: deadlineInput,
        customNote: customNote,
        pendingStudents: pendingStudentsList.map((p) => ({
          noAbsen: p.student.noAbsen,
          name: p.student.name,
          missingTasks: p.missingTasks,
        })),
      };

      const res = await fetch('/api/ai/teacher-assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data.announcement) {
        setGeneratedAnnouncement(data.announcement);
      } else {
        throw new Error(data.error || 'Gagal menghasilkan pengumuman');
      }
    } catch (err) {
      console.error('Error generating announcement:', err);
      // Client-side fallback
      const studentLines = pendingStudentsList
        .map((p, i) => `${i + 1}. Absen ${p.student.noAbsen} - ${p.student.name} (${p.missingTasks.join(', ')})`)
        .join('\n');

      const fallbackText = `📢 *PENGUMUMAN PENTING GURU PENGAMPU TJKN*
Yth. Siswa-siswi *${selectedClass} (${selectedSchool})*,

Berikut adalah rekapitulasi siswa yang *BELUM MENYELESAIKAN* tugas atau nilai masih di bawah KKM pada modul:
📌 *${targetBab.code}: ${targetBab.title}*

*Daftar Siswa Tertunda (${pendingStudentsList.length} Siswa):*
${studentLines || '🎉 Seluruh siswa telah menuntaskan tugas!'}

⏳ *Batas Waktu:* *${deadlineInput}*
📝 *Catatan:* ${customNote}

Silakan segera login ke aplikasi *TJKN Studio Phase F* dan selesaikan seluruh LKPD & Ujian CBT.

Salam,
*Simon Murd*
_Guru Pengampu TJKN SMK Negeri 1 & SMK Mudita Singkawang_`;

      setGeneratedAnnouncement(fallbackText);
    } finally {
      setIsGenerating(false);
    }
  };

  // Copy announcement to clipboard
  const handleCopyClipboard = async () => {
    if (!generatedAnnouncement) return;
    try {
      await navigator.clipboard.writeText(generatedAnnouncement);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    } catch (e) {
      // ignore
    }
  };

  // Broadcast message directly into each pending student's app inbox
  const handleBroadcastDirectToPending = () => {
    if (pendingStudentsList.length === 0) return;

    pendingStudentsList.forEach((p) => {
      sendDirectMessage({
        sender: 'guru',
        teacherName: 'Simon Murd',
        studentId: p.student.id,
        studentName: p.student.name,
        className: p.student.className,
        school: p.student.school,
        message: `Halo ${p.student.name}, mohon perhatian: Tugas ${targetBab.code} (${targetBab.title}) terpantau belum selesai / perlu remedial. Batas waktu pengerjaan: ${deadlineInput}. Segera tuntaskan di portal ya.`,
        isReadByTeacher: true,
        isReadByStudent: false,
        babReference: targetBab.id,
        tag: 'pengingat',
      });
    });

    setBroadcastSentCount(pendingStudentsList.length);
  };

  // Chat consultation with Simon Murd Assistant
  const handleSendChat = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!chatInput.trim() || isChatLoading) return;

    const userMsg = chatInput.trim();
    const timeStr = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });

    setChatHistory((prev) => [...prev, { sender: 'guru', text: userMsg, time: timeStr }]);
    setChatInput('');
    setIsChatLoading(true);

    try {
      const res = await fetch('/api/ai/teacher-assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'chat_consultation',
          question: userMsg,
          chatHistory: chatHistory.map((m) => ({ sender: m.sender, text: m.text })),
        }),
      });

      const data = await res.json();
      const replyTime = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });

      setChatHistory((prev) => [
        ...prev,
        {
          sender: 'assistant',
          text: data.reply || 'Maaf, terjadi kendala saat merespons pertanyaan Bapak.',
          time: replyTime,
        },
      ]);
    } catch (err) {
      console.error('Error in chat consultation:', err);
      setChatHistory((prev) => [
        ...prev,
        {
          sender: 'assistant',
          text: 'Pak Simon, saran saya untuk situasi tersebut adalah melakukan pengelompokan praktikum terbimbing di lab serta memberikan durasi tambahan bagi siswa dengan nilai remedial.',
          time: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setIsChatLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Top Header Card */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-indigo-50 border border-indigo-200 text-indigo-600 flex items-center justify-center font-bold text-2xl shadow-2xs">
              <Sparkles className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-bold text-slate-900">
                  Asisten AI Pribadi Guru: Simon Murd
                </h3>
                <span className="px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 text-xs font-mono font-bold border border-indigo-200">
                  Didukung Gemini 3.8
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Otomatisasi pengumuman grup WA untuk siswa yang belum selesai, analisis kelulusan kelas, dan konsultasi pedagogis kejuruan.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Feature 1: Automatic WhatsApp Announcement Generator */}
      <div className="bg-white border border-slate-200 rounded-3xl shadow-xs overflow-hidden">
        <div className="p-6 border-b border-slate-200 bg-slate-50/50 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-100 text-emerald-700 rounded-xl">
              <Share2 className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-base font-bold text-slate-900">
                Pembangkit Draf Pengumuman Grup WA Otomatis
              </h4>
              <p className="text-xs text-slate-500">
                Sistem secara otomatis mendeteksi siapa saja siswa di rombel terpilih yang belum menyelesaikan tugas atau remedial.
              </p>
            </div>
          </div>

          <div className="px-3 py-1.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-semibold flex items-center gap-1.5 font-mono">
            <Users className="w-4 h-4 text-amber-600" />
            <span>
              {pendingStudentsList.length} Siswa Belum Tuntas di {selectedClass}
            </span>
          </div>
        </div>

        <div className="p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Form Configuration (5 cols) */}
          <div className="lg:col-span-5 space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 font-mono">
                1. Pilih Sekolah
              </label>
              <select
                value={selectedSchool}
                onChange={(e) => setSelectedSchool(e.target.value)}
                className="w-full text-xs rounded-xl border border-slate-300 p-2.5 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {uniqueSchools.map((sch) => (
                  <option key={sch} value={sch}>
                    {sch}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 font-mono">
                  2. Pilih Rombel
                </label>
                <select
                  value={selectedClass}
                  onChange={(e) => setSelectedClass(e.target.value)}
                  className="w-full text-xs rounded-xl border border-slate-300 p-2.5 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {classesForSchool.map((cls) => (
                    <option key={cls} value={cls}>
                      {cls}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 font-mono">
                  3. Modul / Bab
                </label>
                <select
                  value={selectedBabId}
                  onChange={(e) => setSelectedBabId(parseInt(e.target.value, 10))}
                  className="w-full text-xs rounded-xl border border-slate-300 p-2.5 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {babs.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.code}: {b.title.slice(0, 20)}...
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 font-mono">
                4. Batas Waktu (Deadline)
              </label>
              <input
                type="text"
                value={deadlineInput}
                onChange={(e) => setDeadlineInput(e.target.value)}
                placeholder="Contoh: Besok pukul 23:59 WIB"
                className="w-full text-xs rounded-xl border border-slate-300 p-2.5 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 font-mono">
                5. Catatan Tambahan Guru (Opsional)
              </label>
              <textarea
                rows={2}
                value={customNote}
                onChange={(e) => setCustomNote(e.target.value)}
                placeholder="Catatan tambahan untuk murid..."
                className="w-full text-xs rounded-xl border border-slate-300 p-2.5 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
            </div>

            {/* List of Pending Students Preview */}
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
              <div className="flex items-center justify-between text-xs mb-2">
                <span className="font-bold text-slate-800 font-mono">
                  Siswa yang Perlu Menyelesaikan ({pendingStudentsList.length})
                </span>
                <span className="text-[11px] text-slate-500">
                  Total Kelas: {classStudents.length}
                </span>
              </div>

              <div className="max-h-36 overflow-y-auto space-y-1 text-xs">
                {pendingStudentsList.length === 0 ? (
                  <div className="text-emerald-700 font-medium py-2 text-center text-[11px]">
                    🎉 Semua siswa kelas ini telah menuntaskan tugas!
                  </div>
                ) : (
                  pendingStudentsList.map((p) => (
                    <div
                      key={p.student.id}
                      className="flex items-center justify-between py-1 px-2 rounded-lg bg-white border border-slate-200 text-[11px]"
                    >
                      <span className="font-semibold text-slate-800">
                        {p.student.noAbsen} - {p.student.name}
                      </span>
                      <span className="px-1.5 py-0.5 rounded text-[10px] bg-amber-100 text-amber-800 font-mono font-bold">
                        {p.missingTasks.join(', ')}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Generate Action Button */}
            <button
              onClick={handleGenerateAnnouncement}
              disabled={isGenerating}
              className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-xs transition flex items-center justify-center gap-2 shadow-xs cursor-pointer"
            >
              {isGenerating ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Sedang Menyusun Pengumuman WhatsApp...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Buat Draf Pengumuman Grup WA ({selectedClass})</span>
                </>
              )}
            </button>
          </div>

          {/* Generated Result & WhatsApp Style Preview (7 cols) */}
          <div className="lg:col-span-7 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700 font-mono uppercase">
                  Hasil Draf Pengumuman (Format WhatsApp)
                </span>
                {generatedAnnouncement && (
                  <button
                    onClick={handleCopyClipboard}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold hover:bg-emerald-100 transition cursor-pointer"
                  >
                    {copied ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Tersalin ke Clipboard!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Salin Teks ke Clipboard</span>
                      </>
                    )}
                  </button>
                )}
              </div>

              {/* WhatsApp message bubble mockup */}
              <div className="rounded-2xl border border-slate-200 bg-[#efeae2] p-4 font-sans text-xs leading-relaxed text-slate-800 shadow-inner min-h-[340px] max-h-[380px] overflow-y-auto">
                {generatedAnnouncement ? (
                  <div className="bg-white p-4 rounded-xl shadow-xs border border-slate-200 whitespace-pre-wrap">
                    {generatedAnnouncement}
                  </div>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-center p-8 text-slate-500">
                    <Share2 className="w-10 h-10 mb-2 text-slate-400 opacity-60" />
                    <p className="font-semibold text-slate-700">Draf belum dibuat</p>
                    <p className="text-[11px] text-slate-500 mt-1 max-w-xs">
                      Pilih sekolah, rombel, dan bab di sebelah kiri, kemudian klik tombol "Buat Draf Pengumuman Grup WA".
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Direct In-App Notification Dispatch Button */}
            {generatedAnnouncement && pendingStudentsList.length > 0 && (
              <div className="mt-4 pt-4 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 bg-slate-50/60 p-3.5 rounded-2xl">
                <div>
                  <div className="text-xs font-bold text-slate-900">
                    Kirim Pesan Otomatis ke Inbox Aplikasi Siswa
                  </div>
                  <div className="text-[11px] text-slate-500">
                    Kirim pesan instruksi langsung dari Pak Simon Murd ke {pendingStudentsList.length} siswa yang belum selesai.
                  </div>
                </div>

                <button
                  onClick={handleBroadcastDirectToPending}
                  className="px-4 py-2 rounded-xl bg-slate-900 text-white font-bold text-xs hover:bg-slate-800 transition flex items-center gap-1.5 shadow-2xs cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Kirim Pesan Massal ke Siswa</span>
                </button>

                {broadcastSentCount !== null && (
                  <div className="w-full text-xs text-emerald-700 font-semibold flex items-center gap-1 mt-1">
                    <Check className="w-4 h-4" />
                    <span>
                      Berhasil mengirimkan {broadcastSentCount} pesan pengingat langsung ke portal siswa terkait!
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Feature 2: Interactive AI Pedagogical Assistant Consultation */}
      <div className="bg-white border border-slate-200 rounded-3xl shadow-xs overflow-hidden">
        <div className="p-6 border-b border-slate-200 bg-slate-50/50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 text-blue-700 rounded-xl">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-base font-bold text-slate-900">
                Konsultasi Asisten Pribadi Simon Murd
              </h4>
              <p className="text-xs text-slate-500">
                Tanyakan strategi bimbingan siswa, ide rancangan LKPD bengkel, atau analisis kendala pembelajaran TJKN.
              </p>
            </div>
          </div>
        </div>

        {/* Suggestion Quick Chips */}
        <div className="p-4 bg-slate-50/40 border-b border-slate-100 flex items-center gap-2 overflow-x-auto text-xs">
          <span className="font-mono text-slate-500 font-bold shrink-0 text-[11px]">
            Inspirasi Pertanyaan:
          </span>
          <button
            onClick={() =>
              setChatInput(
                'Bagaimana cara efektif mendampingi siswa yang sering remedial pada materi fiber optic dan OTDR?'
              )
            }
            className="px-3 py-1 rounded-xl bg-white border border-slate-200 text-slate-700 hover:border-blue-500 hover:text-blue-700 transition shrink-0"
          >
            💡 Solusi Remedial Fiber Optic & OTDR
          </button>
          <button
            onClick={() =>
              setChatInput(
                'Buatkan rancangan skenario praktikum crimping kabel T568B untuk kelas X TJK agar tidak banyak bahan terbuang.'
              )
            }
            className="px-3 py-1 rounded-xl bg-white border border-slate-200 text-slate-700 hover:border-blue-500 hover:text-blue-700 transition shrink-0"
          >
            🔧 Efisiensi Praktikum Crimping Lab
          </button>
          <button
            onClick={() =>
              setChatInput(
                'Bagaimana cara memotivasi siswa SMK yang terindikasi mengerjakan ujian CBT secara terburu-buru (< 1 menit)?'
              )
            }
            className="px-3 py-1 rounded-xl bg-white border border-slate-200 text-slate-700 hover:border-blue-500 hover:text-blue-700 transition shrink-0"
          >
            🎯 Strategi Menangani Ujian Terlalu Cepat
          </button>
        </div>

        {/* Chat History */}
        <div className="p-6 max-h-[380px] overflow-y-auto space-y-4 bg-slate-50/20">
          {chatHistory.map((item, idx) => {
            const isMe = item.sender === 'guru';
            return (
              <div
                key={idx}
                className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
              >
                <div className="flex items-center gap-1.5 mb-1 px-1">
                  <span className="text-[11px] font-bold text-slate-700">
                    {isMe ? 'Simon Murd' : 'Asisten AI Guru'}
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">{item.time}</span>
                </div>
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-3 text-xs leading-relaxed shadow-2xs whitespace-pre-wrap ${
                    isMe
                      ? 'bg-blue-600 text-white rounded-tr-xs'
                      : 'bg-white border border-slate-200 text-slate-800 rounded-tl-xs'
                  }`}
                >
                  {item.text}
                </div>
              </div>
            );
          })}

          {isChatLoading && (
            <div className="flex items-start">
              <div className="bg-white border border-slate-200 rounded-2xl rounded-tl-xs px-4 py-3 text-xs text-slate-500 flex items-center gap-2 shadow-2xs">
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-blue-600" />
                <span>Asisten Simon Murd sedang menganalisis saran terbaik...</span>
              </div>
            </div>
          )}
        </div>

        {/* Chat Input */}
        <form
          onSubmit={handleSendChat}
          className="p-4 border-t border-slate-200 bg-white flex items-center gap-3"
        >
          <input
            type="text"
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            placeholder="Tanyakan analisis siswa, panduan K3 lab, atau ide pembelajaran ke Asisten Pribadi..."
            className="flex-1 rounded-xl border border-slate-200 py-2.5 px-4 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            disabled={!chatInput.trim() || isChatLoading}
            className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white font-bold text-xs transition flex items-center gap-1.5 shadow-xs shrink-0 cursor-pointer"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Kirim</span>
          </button>
        </form>
      </div>
    </div>
  );
};
