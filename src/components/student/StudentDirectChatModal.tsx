import React, { useState, useEffect, useRef } from 'react';
import { StudentProfile, DirectChatMessage, UserPresence } from '../../types/curriculum';
import {
  getMessagesForStudent,
  sendDirectMessage,
  markMessagesAsReadByStudent,
  syncMessagesWithServer,
} from '../../data/directMessagesData';
import {
  subscribeToLabPresence,
  updateTypingStatus,
} from '../../services/presenceService';
import {
  X,
  Send,
  MessageSquare,
  ShieldCheck,
  Check,
  CheckCheck,
  Sparkles,
  Award,
  AlertTriangle,
  Clock,
  RefreshCw,
  HelpCircle,
  Wrench,
  CheckCircle2,
} from 'lucide-react';

interface StudentDirectChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeStudent: StudentProfile;
}

export const StudentDirectChatModal: React.FC<StudentDirectChatModalProps> = ({
  isOpen,
  onClose,
  activeStudent,
}) => {
  const [messages, setMessages] = useState<DirectChatMessage[]>([]);
  const [inputText, setInputText] = useState<string>('');
  const [presences, setPresences] = useState<Record<string, UserPresence>>({});
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimerRef = useRef<any>(null);

  const teacherPresence = presences['teacher_simon'];
  const isTeacherOnline = Boolean(teacherPresence?.isOnline ?? true);
  const isTeacherTyping = teacherPresence?.isTypingTo === activeStudent.id;

  const loadMessages = () => {
    const list = getMessagesForStudent(activeStudent.id);
    setMessages(list);
  };

  useEffect(() => {
    if (!isOpen) return;

    // Initial load and sync
    loadMessages();
    markMessagesAsReadByStudent(activeStudent.id);
    syncMessagesWithServer().then(() => {
      loadMessages();
      markMessagesAsReadByStudent(activeStudent.id);
    });

    // 2-second live polling while chat modal is active
    const pollTimer = setInterval(async () => {
      await syncMessagesWithServer();
      loadMessages();
    }, 2000);

    // Subscribe to presence
    const unsubPresence = subscribeToLabPresence((updated) => {
      setPresences(updated);
    });

    const handleUpdate = () => {
      loadMessages();
    };

    window.addEventListener('tjkn_direct_messages_updated', handleUpdate);
    window.addEventListener('storage', handleUpdate);
    return () => {
      clearInterval(pollTimer);
      unsubPresence();
      window.removeEventListener('tjkn_direct_messages_updated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, [isOpen, activeStudent.id]);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen, isTeacherTyping]);

  if (!isOpen) return null;

  const handleInputChange = (text: string) => {
    setInputText(text);
    updateTypingStatus(activeStudent.id, 'teacher_simon');
    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    typingTimerRef.current = setTimeout(() => {
      updateTypingStatus(activeStudent.id, null);
    }, 2500);
  };

  const handleClose = () => {
    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    updateTypingStatus(activeStudent.id, null);
    onClose();
  };

  const handleSendMessage = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim()) return;

    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    updateTypingStatus(activeStudent.id, null);

    sendDirectMessage({
      sender: 'siswa',
      teacherName: 'Simon Murd',
      studentId: activeStudent.id,
      studentName: activeStudent.name,
      className: activeStudent.className,
      school: activeStudent.school,
      message: inputText.trim(),
      isReadByTeacher: false,
      isReadByStudent: true,
      tag: 'umum',
    });

    setInputText('');
    loadMessages();
  };

  const setQuickTemplate = (text: string) => {
    setInputText(text);
    updateTypingStatus(activeStudent.id, 'teacher_simon');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-xl shadow-2xl flex flex-col overflow-hidden max-h-[85vh]">
        {/* Header */}
        <div className="p-5 border-b border-slate-200 bg-slate-50/70 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-sm shadow-xs">
                SM
              </div>
              {isTeacherOnline && (
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white animate-pulse"></span>
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm text-slate-900">
                  Pak Simon Murd (Guru Pengampu)
                </h3>
                {isTeacherOnline ? (
                  <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-mono font-bold border border-emerald-200 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                    <span>Online di Lab</span>
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[10px] font-mono font-bold border border-slate-200">
                    Standby
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 font-mono mt-0.5">
                Siswa: {activeStudent.noAbsen} • {activeStudent.name} ({activeStudent.className})
              </p>
            </div>
          </div>

          <button
            onClick={handleClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Inquiries for Student */}
        <div className="px-4 py-2 bg-slate-100/70 border-b border-slate-200 flex items-center gap-1.5 overflow-x-auto text-[11px]">
          <span className="text-[10px] font-mono text-slate-500 font-bold shrink-0">
            Tanya Cepat:
          </span>
          <button
            type="button"
            onClick={() => setQuickTemplate('Pak Simon, saya ingin bertanya tentang cara pengerjaan soal CBT ini.')}
            className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-700 hover:border-blue-500 hover:text-blue-700 transition shrink-0 flex items-center gap-1"
          >
            <HelpCircle className="w-3 h-3 text-blue-600" />
            <span>Tanya Soal CBT</span>
          </button>
          <button
            type="button"
            onClick={() => setQuickTemplate('Pak Simon, saya butuh bimbingan pada langkah simulasi praktikum yang sedang saya buka.')}
            className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-700 hover:border-blue-500 hover:text-blue-700 transition shrink-0 flex items-center gap-1"
          >
            <Wrench className="w-3 h-3 text-blue-600" />
            <span>Bimbingan Praktik</span>
          </button>
          <button
            type="button"
            onClick={() => setQuickTemplate('Pak Simon, saya sudah selesai mengerjakan tugas dan submit evaluasi. Mohon diperiksa ya Pak.')}
            className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-700 hover:border-emerald-500 hover:text-emerald-700 transition shrink-0 flex items-center gap-1"
          >
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            <span>Konfirmasi Selesai</span>
          </button>
        </div>

        {/* Message Thread */}
        <div className="flex-1 p-5 overflow-y-auto space-y-4 bg-slate-50/20 min-h-[300px]">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-8 text-slate-400">
              <MessageSquare className="w-10 h-10 mb-2 opacity-30 text-blue-600" />
              <p className="text-xs font-semibold text-slate-600">
                Belum ada pesan dengan Pak Simon Murd.
              </p>
              <p className="text-[11px] text-slate-400 mt-1 max-w-xs">
                Jika kamu memiliki pertanyaan tentang tugas atau kendala praktikum, silakan tulis pesan kepada guru di bawah ini.
              </p>
            </div>
          ) : (
            messages.map((msg) => {
              const isTeacher = msg.sender === 'guru';

              return (
                <div
                  key={msg.id}
                  className={`flex flex-col ${isTeacher ? 'items-start' : 'items-end'}`}
                >
                  <div className="flex items-center gap-1.5 mb-1 px-1">
                    <span className="text-[11px] font-bold text-slate-700">
                      {isTeacher ? 'Pak Simon Murd' : 'Saya (Siswa)'}
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
                        ? 'bg-white border border-slate-200 text-slate-800 rounded-tl-xs'
                        : 'bg-blue-600 text-white rounded-tr-xs'
                    }`}
                  >
                    {msg.message}
                  </div>

                  {/* Read receipts for student's messages */}
                  {!isTeacher && (
                    <div className="flex items-center gap-1 mt-1 text-[10px] text-slate-400 px-1 font-mono">
                      {msg.isReadByTeacher ? (
                        <>
                          <CheckCheck className="w-3.5 h-3.5 text-blue-600" />
                          <span>Dibaca Pak Simon</span>
                        </>
                      ) : (
                        <>
                          <Check className="w-3.5 h-3.5 text-slate-400" />
                          <span>Terkirim</span>
                        </>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}

          {/* Teacher typing indicator */}
          {isTeacherTyping && (
            <div className="flex items-center gap-2 p-2 px-3 rounded-2xl bg-white border border-slate-200 text-blue-700 text-xs w-fit animate-pulse shadow-xs">
              <div className="flex gap-1 items-center">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-bounce"></span>
                <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-bounce [animation-delay:0.2s]"></span>
                <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-bounce [animation-delay:0.4s]"></span>
              </div>
              <span className="font-semibold text-slate-700">Pak Simon sedang mengetik balasan...</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Reply Form */}
        <form
          onSubmit={handleSendMessage}
          className="p-4 border-t border-slate-200 bg-white flex items-center gap-2"
        >
          <input
            type="text"
            value={inputText}
            onChange={(e) => handleInputChange(e.target.value)}
            onBlur={() => updateTypingStatus(activeStudent.id, null)}
            placeholder="Tulis pesan langsung ke Pak Simon Murd..."
            className="flex-1 rounded-xl border border-slate-200 py-2.5 px-3.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            disabled={!inputText.trim()}
            className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white font-bold text-xs transition flex items-center gap-1.5 shadow-xs cursor-pointer shrink-0"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Kirim</span>
          </button>
        </form>
      </div>
    </div>
  );
};

