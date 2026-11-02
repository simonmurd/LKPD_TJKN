import React from 'react';
import { StudentProfile, CurriculumBab, RombelAssignment } from '../../types/curriculum';
import { Lock, School, ShieldAlert, ArrowRight, BookOpen, AlertCircle } from 'lucide-react';

interface RombelAccessLockedNoticeProps {
  student: StudentProfile | null;
  bab: CurriculumBab;
  sectionName?: string;
  rombelAssignment?: RombelAssignment | null;
  allBabs: CurriculumBab[];
  onSelectBab: (bab: CurriculumBab) => void;
}

export const RombelAccessLockedNotice: React.FC<RombelAccessLockedNoticeProps> = ({
  student,
  bab,
  sectionName = 'Latihan ini',
  rombelAssignment,
  allBabs,
  onSelectBab,
}) => {
  const allowedBabsList = allBabs.filter((b) =>
    rombelAssignment?.allowedBabs.includes(b.id)
  );

  return (
    <div className="bg-white border border-amber-200 rounded-2xl p-6 sm:p-8 shadow-sm text-center max-w-2xl mx-auto my-8">
      <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center mx-auto mb-4 shadow-sm">
        <Lock className="w-7 h-7" />
      </div>

      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-xs font-semibold mb-3">
        <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
        <span>Akses Dibatasi Berdasarkan Rombel</span>
      </div>

      <h3 className="text-xl font-bold text-slate-900 tracking-tight mb-2">
        {sectionName} Belum Ditugaskan oleh Guru Pengampu
      </h3>

      <p className="text-slate-600 text-sm leading-relaxed max-w-lg mx-auto mb-6">
        Modul <strong className="text-slate-900">{bab.code}: {bab.title}</strong> saat ini belum dibuka untuk rombel{' '}
        <span className="font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
          {student?.className || 'Kelas Anda'}
        </span>{' '}
        di {student?.school || 'Sekolah'}. Guru pengampu (Pak Simon Murd) mengatur penugasan latihan bertahap sesuai capaian pembelajaran.
      </p>

      {rombelAssignment?.notes && (
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 mb-6 text-left max-w-lg mx-auto">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
            Instruksi / Catatan Guru Pengampu:
          </div>
          <p className="text-xs text-slate-700 italic">
            "{rombelAssignment.notes}"
          </p>
        </div>
      )}

      {allowedBabsList.length > 0 ? (
        <div className="bg-blue-50/70 border border-blue-200/80 rounded-xl p-4 text-left mb-6 max-w-lg mx-auto">
          <div className="text-xs font-bold text-blue-900 mb-2 flex items-center gap-1.5">
            <BookOpen className="w-4 h-4 text-blue-600" />
            <span>Modul yang Sedang Ditugaskan untuk Rombel Anda:</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {allowedBabsList.map((b) => (
              <button
                key={b.id}
                onClick={() => onSelectBab(b)}
                className="text-left px-3 py-2 rounded-lg bg-white border border-blue-200 hover:border-blue-400 hover:bg-blue-50 text-xs font-medium text-slate-800 transition flex items-center justify-between group shadow-xs"
              >
                <span className="truncate font-semibold text-blue-700 group-hover:text-blue-900">
                  {b.code}: {b.title.slice(0, 24)}...
                </span>
                <ArrowRight className="w-3.5 h-3.5 text-blue-400 group-hover:translate-x-0.5 transition shrink-0 ml-1" />
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs text-slate-500 mb-6">
          Belum ada modul yang dibuka untuk rombel ini. Silakan tunggu instruksi lebih lanjut dari Pak Simon Murd di kelas/lab.
        </div>
      )}

      <div className="text-[11px] text-slate-400 font-mono">
        SMK Negeri 1 Singkawang & SMK Mudita Singkawang • TJKN Phase F
      </div>
    </div>
  );
};
