import React, { useState, useRef, useEffect } from 'react';
import { StudentProfile } from '../../types/curriculum';
import { Search, ChevronDown, Check, User, School, Sparkles, LogIn, X } from 'lucide-react';

interface StudentSelectorProps {
  students: StudentProfile[];
  selectedStudent: StudentProfile | null;
  onSelectStudent: (student: StudentProfile) => void;
  onCancel?: () => void;
  isModal?: boolean;
}

export const StudentSelector: React.FC<StudentSelectorProps> = ({
  students,
  selectedStudent,
  onSelectStudent,
  onCancel,
  isModal = false,
}) => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isOpen, setIsOpen] = useState<boolean>(true);
  const [filterClass, setFilterClass] = useState<string>('all');
  const [filterSchool, setFilterSchool] = useState<string>('all');
  const containerRef = useRef<HTMLDivElement>(null);

  // Close dropdown if clicked outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        if (!isModal) {
          setIsOpen(false);
        }
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isModal]);

  // Unique schools and classes for quick filter chips
  const schools = Array.from(new Set(students.map((s) => s.school)));
  const classes = Array.from(
    new Set(
      students
        .filter((s) => filterSchool === 'all' || s.school === filterSchool)
        .map((s) => s.className)
    )
  );

  // Filter students by search query, school, and class
  const filteredStudents = students.filter((s) => {
    const query = searchQuery.toLowerCase().trim();
    const matchQuery =
      !query ||
      s.name.toLowerCase().includes(query) ||
      s.noAbsen.includes(query) ||
      s.className.toLowerCase().includes(query) ||
      s.school.toLowerCase().includes(query);

    const matchSchool = filterSchool === 'all' || s.school === filterSchool;
    const matchClass = filterClass === 'all' || s.className === filterClass;

    return matchQuery && matchSchool && matchClass;
  });

  const content = (
    <div ref={containerRef} className="w-full max-w-xl mx-auto text-slate-800">
      {/* Search Input Box modeled after user screenshot */}
      <div className="relative">
        <div
          onClick={() => setIsOpen(true)}
          className={`flex items-center justify-between w-full bg-white border-2 rounded-2xl px-4 py-3 cursor-pointer shadow-xs transition ${
            isOpen
              ? 'border-blue-600 ring-2 ring-blue-500/20'
              : 'border-slate-300 hover:border-slate-400'
          }`}
        >
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <Search className="w-5 h-5 text-slate-400 shrink-0" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setIsOpen(true);
              }}
              onFocus={() => setIsOpen(true)}
              placeholder="Ketik atau pilih Nama Siswa..."
              className="w-full bg-transparent text-sm sm:text-base text-slate-900 placeholder:text-slate-400 focus:outline-none font-medium"
            />
          </div>

          <div className="flex items-center gap-2">
            {searchQuery && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setSearchQuery('');
                }}
                className="p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            )}
            <ChevronDown
              className={`w-5 h-5 text-slate-500 shrink-0 transition-transform duration-200 ${
                isOpen ? 'rotate-180 text-blue-600' : ''
              }`}
            />
          </div>
        </div>

        {/* Floating Dropdown List Popover (matching screenshot from image_af84b6d6.png) */}
        {isOpen && (
          <div className="mt-2 w-full bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-150">
            {/* Quick Filter Bar */}
            <div className="p-3 bg-slate-50 border-b border-slate-200 space-y-2 text-xs">
              {/* School Filter */}
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-[10px] uppercase font-mono font-bold text-slate-500 mr-1">
                  Sekolah:
                </span>
                <button
                  onClick={() => {
                    setFilterSchool('all');
                    setFilterClass('all');
                  }}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
                    filterSchool === 'all'
                      ? 'bg-blue-600 text-white shadow-2xs'
                      : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  Semua Sekolah
                </button>
                {schools.map((sch) => (
                  <button
                    key={sch}
                    onClick={() => {
                      setFilterSchool(sch);
                      setFilterClass('all');
                    }}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
                      filterSchool === sch
                        ? 'bg-blue-600 text-white shadow-2xs'
                        : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    {sch.includes('MUDITA') ? 'SMK Mudita' : 'SMKN 1 Singkawang'}
                  </button>
                ))}
              </div>

              {/* Class Filter */}
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-[10px] uppercase font-mono font-bold text-slate-500 mr-1">
                  Rombel:
                </span>
                <button
                  onClick={() => setFilterClass('all')}
                  className={`px-2 py-0.5 rounded-md text-[11px] font-semibold transition ${
                    filterClass === 'all'
                      ? 'bg-slate-800 text-white'
                      : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  Semua
                </button>
                {classes.map((cls) => (
                  <button
                    key={cls}
                    onClick={() => setFilterClass(cls)}
                    className={`px-2 py-0.5 rounded-md text-[11px] font-semibold transition ${
                      filterClass === cls
                        ? 'bg-slate-800 text-white'
                        : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    {cls}
                  </button>
                ))}
              </div>
            </div>

            {/* Student Items List */}
            <div className="max-h-72 overflow-y-auto divide-y divide-slate-100">
              {filteredStudents.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-500">
                  Tidak ada nama siswa yang cocok dengan kata kunci "{searchQuery}".
                </div>
              ) : (
                filteredStudents.map((student) => {
                  const isCurrent = selectedStudent?.id === student.id;
                  return (
                    <div
                      key={student.id}
                      onClick={() => {
                        onSelectStudent(student);
                        if (!isModal) {
                          setIsOpen(false);
                        }
                      }}
                      className={`p-3 px-4 flex items-center justify-between cursor-pointer transition ${
                        isCurrent
                          ? 'bg-blue-50/80'
                          : 'hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs font-mono shrink-0 ${
                            isCurrent
                              ? 'bg-blue-600 text-white'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {student.noAbsen}
                        </div>
                        <div>
                          <div className="font-bold text-xs sm:text-sm text-slate-900 line-clamp-1">
                            {student.noAbsen} {student.name}
                          </div>
                          <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                            {student.className} - {student.school}
                          </div>
                        </div>
                      </div>

                      {isCurrent ? (
                        <div className="flex items-center gap-1 text-xs text-blue-600 font-bold shrink-0">
                          <Check className="w-4 h-4" />
                          <span className="hidden sm:inline">Terpilih</span>
                        </div>
                      ) : (
                        <span className="text-[11px] font-medium text-slate-400 hover:text-blue-600 shrink-0">
                          Pilih & Buka →
                        </span>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            {/* List Footer Count */}
            <div className="p-2.5 bg-slate-50 border-t border-slate-200 text-center text-[11px] text-slate-500 font-mono">
              Menampilkan {filteredStudents.length} dari {students.length} Siswa Terdaftar
            </div>
          </div>
        )}
      </div>
    </div>
  );

  if (isModal) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-200">
        <div className="w-full max-w-xl bg-white border border-slate-200 rounded-3xl p-6 shadow-2xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <User className="w-5 h-5 text-blue-600" />
              <h3 className="font-bold text-base text-slate-900">Ganti Identitas Siswa</h3>
            </div>
            {onCancel && (
              <button
                onClick={onCancel}
                className="text-slate-400 hover:text-slate-600 text-xs font-semibold px-2 py-1 rounded-lg hover:bg-slate-100"
              >
                Tutup (ESC)
              </button>
            )}
          </div>

          {content}
        </div>
      </div>
    );
  }

  return content;
};
