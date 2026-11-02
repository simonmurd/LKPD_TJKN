import React, { useState } from 'react';
import { Bot, Send, X, Sparkles, MessageSquare, Terminal, Lightbulb } from 'lucide-react';
import { CurriculumBab } from '../../types/curriculum';

interface AiTutorDrawerProps {
  bab: CurriculumBab;
  isOpen: boolean;
  onClose: () => void;
}

interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: string;
}

export const AiTutorDrawer: React.FC<AiTutorDrawerProps> = ({ bab, isOpen, onClose }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      sender: 'ai',
      text: `Halo Siswa SMK TKJ! Saya adalah Guru Ahli & Instruktur Industri TJKN Anda. 
Ada yang perlu dibahas atau ditanyakan terkait materi "${bab.title}" atau ada kendala praktikum di bengkel?`,
      timestamp: 'Baru saja',
    },
  ]);
  const [inputVal, setInputVal] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);

  if (!isOpen) return null;

  const quickQuestions = [
    `Apa perbedaan praktis kabel Straight vs Crossover di lapangan?`,
    `Mengapa redaman sambungan fiber optic tidak boleh lebih dari 0.03 dB?`,
    `Bagaimana cara menentukan tinggi tower wireless outdoor dari Fresnel Zone?`,
    `Bagaimana cara kerja Router-on-a-Stick pada topologi VLAN?`,
  ];

  const handleSendMessage = async (textToSend?: string) => {
    const q = textToSend || inputVal;
    if (!q.trim() || isLoading) return;

    const userMsg: ChatMessage = {
      id: `u_${Date.now()}`,
      sender: 'user',
      text: q,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputVal('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/ai/ask-tutor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: q,
          babNumber: bab.id,
          babTitle: bab.title,
          chatHistory: messages.slice(-5),
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `Error ${res.status}`);
      }

      const data = await res.json();
      const aiMsg: ChatMessage = {
        id: `ai_${Date.now()}`,
        sender: 'ai',
        text: data.reply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, aiMsg]);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      setMessages((prev) => [
        ...prev,
        {
          id: `ai_err_${Date.now()}`,
          sender: 'ai',
          text: `Mohon maaf, terjadi kendala saat menghubungi asisten tutor AI: ${msg}. Pastikan GEMINI_API_KEY telah terpasang di Secrets panel.`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-y-0 right-0 w-full sm:w-[480px] bg-slate-950 border-l border-slate-800 shadow-2xl z-50 flex flex-col animate-in slide-in-from-right duration-200">
      {/* Header */}
      <div className="p-4 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-purple-600 to-indigo-600 text-white flex items-center justify-center shadow">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-xs sm:text-sm text-white">Guru & Instruktur AI TJKN</h3>
            <span className="text-[10px] text-emerald-400 font-mono flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Socratic Tutor ({bab.code})
            </span>
          </div>
        </div>

        <button
          onClick={onClose}
          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 text-xs">
        {messages.map((m) => (
          <div
            key={m.id}
            className={`flex flex-col ${m.sender === 'user' ? 'items-end' : 'items-start'}`}
          >
            <div
              className={`max-w-[88%] p-3.5 rounded-2xl leading-relaxed whitespace-pre-wrap ${
                m.sender === 'user'
                  ? 'bg-blue-600 text-white rounded-br-none'
                  : 'bg-slate-900 border border-slate-800 text-slate-200 rounded-bl-none shadow'
              }`}
            >
              {m.text}
            </div>
            <span className="text-[9px] text-slate-500 mt-1 px-1 font-mono">{m.timestamp}</span>
          </div>
        ))}

        {isLoading && (
          <div className="flex items-center gap-2 text-xs text-slate-400 bg-slate-900/60 p-3 rounded-xl border border-slate-800 w-fit">
            <Sparkles className="w-3.5 h-3.5 animate-spin text-purple-400" />
            <span>Guru AI sedang menyusun penjelasan teknis...</span>
          </div>
        )}
      </div>

      {/* Suggested Quick Questions */}
      <div className="p-3 bg-slate-900/80 border-t border-slate-800/80">
        <div className="flex items-center gap-1 text-[10px] text-slate-400 mb-1.5 font-mono">
          <Lightbulb className="w-3 h-3 text-amber-400" />
          <span>Pertanyaan Cepat Seputar {bab.code}:</span>
        </div>
        <div className="flex gap-1.5 overflow-x-auto pb-1 text-[10px]">
          {quickQuestions.map((q, idx) => (
            <button
              key={idx}
              onClick={() => handleSendMessage(q)}
              className="px-2.5 py-1 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 whitespace-nowrap shrink-0 transition"
            >
              {q}
            </button>
          ))}
        </div>
      </div>

      {/* Input Form */}
      <div className="p-3 bg-slate-950 border-t border-slate-800">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="flex items-center gap-2"
        >
          <input
            type="text"
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            placeholder={`Tanyakan troubleshooting / konsep ${bab.code}...`}
            className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 font-sans"
          />
          <button
            type="submit"
            disabled={!inputVal.trim() || isLoading}
            className="p-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white transition shrink-0 shadow"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
