import React, { useState, useEffect, useRef } from 'react';
import { StudentProfile, DirectChatMessage } from '../../types/curriculum';
import {
  getMessagesForStudent,
  sendDirectMessage,
  markMessagesAsReadByStudent,
} from '../../data/directMessagesData';
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
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const loadMessages = () => {
    const list = getMessagesForStudent(activeStudent.id);
    setMessages(list);
  };

  useEffect(() => {
    if (isOpen) {
      loadMessages();
      markMessagesAsReadByStudent(activeStudent.id);
    }

    const handleUpdate = () => {
      if (isOpen) {
        loadMessages();
      }
    };

    window.addEventListener('tjkn_direct_messages_updated', handleUpdate);
    window.addEventListener('storage', handleUpdate);
    return () => {
      window.removeEventListener('tjkn_direct_messages_updated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, [isOpen, activeStudent.id]);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  if (!isOpen) return null;

  const handleSendMessage = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim()) return;

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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-xl shadow-2xl flex flex-col overflow-hidden max-h-[85vh]">
        {/* Header */}
        <div className="p-5 border-b border-slate-200 bg-slate-50/60 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-sm shadow-xs">
              SM
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm text-slate-900">
                  Pesan Pembelajaran: Pak Simon Murd
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 text-[10px] font-mono font-bold border border-blue-200">
                  Guru Pengampu
                </span>
              </div>
              <p className="text-xs text-slate-500 font-mono mt-0.5">
                Untuk: {activeStudent.noAbsen} {activeStudent.name} ({activeStudent.className})
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Message Thread */}
        <div className="flex-1 p-5 overflow-y-auto space-y-4 bg-slate-50/20 min-h-[300px]">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-8 text-slate-400">
              <MessageSquare className="w-10 h-10 mb-2 opacity-30 text-blue-600" />
              <p className="text-xs font-semibold text-slate-600">
                Belum ada pesan dari Pak Simon Murd.
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
                </div>
              );
            })
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
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Balas pesan kepada Pak Simon Murd..."
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
