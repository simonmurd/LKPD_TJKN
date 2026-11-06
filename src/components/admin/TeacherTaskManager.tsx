import React, { useState, useEffect } from 'react';
import {
  StudentProfile,
  CurriculumBab,
  StudentTaskAssignment,
} from '../../types/curriculum';
import {
  fetchTasksFromServer,
  createTaskOnServer,
  updateTaskOnServer,
  deleteTaskOnServer,
} from '../../services/tasksService';
import {
  Send,
  Plus,
  Trash2,
  Edit3,
  Play,
  FileQuestion,
  PenTool,
  Users,
  CheckCircle2,
  Calendar,
  ClipboardList,
  X,
} from 'lucide-react';

interface TeacherTaskManagerProps {
  students: StudentProfile[];
  babs: CurriculumBab[];
}

export const TeacherTaskManager: React.FC<TeacherTaskManagerProps> = ({
  students,
  babs,
}) => {
  const [tasks, setTasks] = useState<StudentTaskAssignment[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Form states
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [taskType, setTaskType] = useState<'simulation' | 'cbt' | 'essay'>('simulation');
  const [selectedBabId, setSelectedBabId] = useState<number>(babs[0]?.id || 1);
  const [title, setTitle] = useState<string>('');
  const [targetType, setTargetType] = useState<'all' | 'school' | 'class' | 'student'>('all');
  const [targetSchool, setTargetSchool] = useState<string>('SMK NEGERI 1 SINGKAWANG');
  const [targetClass, setTargetClass] = useState<string>('X TJK');
  const [targetStudentId, setTargetStudentId] = useState<string>(students[0]?.id || '');
  const [dueDate, setDueDate] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  const uniqueSchools = Array.from(new Set(students.map((s) => s.school)));
  const uniqueClasses = Array.from(
    new Set(
      students
        .filter((s) => !targetSchool || s.school === targetSchool)
        .map((s) => s.className)
    )
  );

  useEffect(() => {
    fetchTasksFromServer().then(setTasks);
    const handleUpdate = () => {
      fetchTasksFromServer().then(setTasks);
    };
    window.addEventListener('tjkn_tasks_updated', handleUpdate);
    return () => window.removeEventListener('tjkn_tasks_updated', handleUpdate);
  }, []);

  // Auto-generate default title when bab or taskType changes (if not editing)
  useEffect(() => {
    if (editingTaskId) return;
    const bab = babs.find((b) => b.id === selectedBabId);
    if (!bab) return;
    const typeLabel =
      taskType === 'simulation'
        ? 'Praktikum Simulasi'
        : taskType === 'cbt'
        ? 'Evaluasi CBT (40 Soal)'
        : 'Evaluasi Esai (AI)';
    setTitle(`Tugas ${typeLabel} - ${bab.code}: ${bab.title}`);
  }, [selectedBabId, taskType, babs, editingTaskId]);

  const resetForm = () => {
    setEditingTaskId(null);
    setTaskType('simulation');
    setSelectedBabId(babs[0]?.id || 1);
    setTargetType('all');
    setDueDate('');
    setNotes('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const bab = babs.find((b) => b.id === selectedBabId);
    if (!bab || !title.trim()) return;

    setIsLoading(true);
    const targetStudent = students.find((s) => s.id === targetStudentId);

    const payload = {
      title: title.trim(),
      babId: bab.id,
      babCode: bab.code,
      babTitle: bab.title,
      taskType,
      targetType,
      targetSchool: targetType === 'school' || targetType === 'class' ? targetSchool : undefined,
      targetClass: targetType === 'class' ? targetClass : undefined,
      targetStudentId: targetType === 'student' ? targetStudentId : undefined,
      targetStudentName: targetType === 'student' ? targetStudent?.name : undefined,
      dueDate: dueDate || undefined,
      notes: notes.trim() || undefined,
    };

    if (editingTaskId) {
      const updated = await updateTaskOnServer(editingTaskId, payload);
      setTasks(updated);
      setFeedbackMsg('✓ Tugas berhasil diperbarui & dikirim ke siswa!');
    } else {
      const updated = await createTaskOnServer(payload);
      setTasks(updated);
      setFeedbackMsg('✓ Tugas baru berhasil dikirim ke Dashboard Siswa & Leger!');
    }

    setIsLoading(false);
    resetForm();
    setTimeout(() => setFeedbackMsg(null), 4000);
  };

  const handleEdit = (t: StudentTaskAssignment) => {
    setEditingTaskId(t.id);
    setTaskType(t.taskType);
    setSelectedBabId(t.babId);
    setTitle(t.title);
    setTargetType(t.targetType);
    if (t.targetSchool) setTargetSchool(t.targetSchool);
    if (t.targetClass) setTargetClass(t.targetClass);
    if (t.targetStudentId) setTargetStudentId(t.targetStudentId);
    setDueDate(t.dueDate || '');
    setNotes(t.notes || '');
  };

  const handleDelete = async (id: string) => {
    const updated = await deleteTaskOnServer(id);
    setTasks(updated);
    setFeedbackMsg('✓ Tugas berhasil dihapus.');
    setTimeout(() => setFeedbackMsg(null), 3000);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Left: Form Kirim / Ganti Tugas (5 cols) */}
      <div className="lg:col-span-5 bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-4 h-fit">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="p-2 bg-blue-100 text-blue-700 rounded-xl">
              <Send className="w-5 h-5" />
            </span>
            <div>
              <h3 className="font-bold text-base text-slate-900">
                {editingTaskId ? 'Ganti / Edit Tugas Siswa' : 'Kirim Tugas & Kegiatan Baru'}
              </h3>
              <p className="text-xs text-slate-500">
                Pilih Simulasi, CBT, atau Esai untuk dikirim ke Dashboard Siswa
              </p>
            </div>
          </div>
          {editingTaskId && (
            <button
              type="button"
              onClick={resetForm}
              className="p-1.5 rounded-xl bg-slate-100 text-slate-500 hover:text-slate-800"
              title="Batal Edit"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {feedbackMsg && (
          <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{feedbackMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          {/* Jenis Kegiatan */}
          <div>
            <label className="block font-bold text-slate-700 mb-1.5">
              1. Pilih Jenis Kegiatan / Tugas:
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setTaskType('simulation')}
                className={`p-2.5 rounded-xl border font-bold flex flex-col items-center gap-1 transition ${
                  taskType === 'simulation'
                    ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <Play className="w-4 h-4" />
                <span>Simulasi</span>
              </button>
              <button
                type="button"
                onClick={() => setTaskType('cbt')}
                className={`p-2.5 rounded-xl border font-bold flex flex-col items-center gap-1 transition ${
                  taskType === 'cbt'
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <FileQuestion className="w-4 h-4" />
                <span>CBT 40 Soal</span>
              </button>
              <button
                type="button"
                onClick={() => setTaskType('essay')}
                className={`p-2.5 rounded-xl border font-bold flex flex-col items-center gap-1 transition ${
                  taskType === 'essay'
                    ? 'bg-purple-600 text-white border-purple-600 shadow-xs'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <PenTool className="w-4 h-4" />
                <span>Esai (AI)</span>
              </button>
            </div>
          </div>

          {/* Pilih Modul / Bab */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">
              2. Pilih Modul / Bab:
            </label>
            <select
              value={selectedBabId}
              onChange={(e) => setSelectedBabId(Number(e.target.value))}
              className="w-full rounded-xl border border-slate-200 p-2.5 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {babs.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.code}: {b.title} ({b.grade})
                </option>
              ))}
            </select>
          </div>

          {/* Judul Tugas */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">
              3. Judul Tugas / Kegiatan:
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Contoh: Praktikum Crimping T568B..."
              className="w-full rounded-xl border border-slate-200 p-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Target Penerima */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">
              4. Kirim Kepada:
            </label>
            <select
              value={targetType}
              onChange={(e) => setTargetType(e.target.value as any)}
              className="w-full rounded-xl border border-slate-200 p-2.5 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Semua Siswa (SMKN 1 & SMK Mudita)</option>
              <option value="school">Per Sekolah</option>
              <option value="class">Per Kelas / Rombel</option>
              <option value="student">Siswa Tertentu</option>
            </select>
          </div>

          {(targetType === 'school' || targetType === 'class') && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Sekolah:
                </label>
                <select
                  value={targetSchool}
                  onChange={(e) => setTargetSchool(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 p-2 bg-white text-slate-800"
                >
                  {uniqueSchools.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
              {targetType === 'class' && (
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Kelas / Rombel:
                  </label>
                  <select
                    value={targetClass}
                    onChange={(e) => setTargetClass(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 p-2 bg-white text-slate-800"
                  >
                    {uniqueClasses.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          )}

          {targetType === 'student' && (
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                Pilih Siswa:
              </label>
              <select
                value={targetStudentId}
                onChange={(e) => setTargetStudentId(e.target.value)}
                className="w-full rounded-xl border border-slate-200 p-2 bg-white text-slate-800"
              >
                {students.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.noAbsen} - {s.name} ({s.className})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Batas Waktu & Catatan */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Batas Waktu (Opsional):
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full rounded-xl border border-slate-200 p-2 text-slate-800"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">
              Instruksi / Catatan Guru:
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Contoh: Kerjakan dengan teliti, nilai minimal KKM 75..."
              className="w-full rounded-xl border border-slate-200 p-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading || !title.trim()}
            className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-xs transition flex items-center justify-center gap-2 shadow-xs cursor-pointer"
          >
            <Send className="w-4 h-4" />
            <span>
              {isLoading
                ? 'Mengirim...'
                : editingTaskId
                ? 'Simpan Perubahan Tugas'
                : 'Kirim Tugas ke Siswa'}
            </span>
          </button>
        </form>
      </div>

      {/* Right: Daftar Tugas Terkirim (7 cols) */}
      <div className="lg:col-span-7 bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="p-2 bg-emerald-100 text-emerald-700 rounded-xl">
              <ClipboardList className="w-5 h-5" />
            </span>
            <div>
              <h3 className="font-bold text-base text-slate-900">
                Daftar Tugas & Kegiatan Terkirim ({tasks.length})
              </h3>
              <p className="text-xs text-slate-500">
                Tugas yang dikirim otomatis muncul di Dashboard Siswa & tercatat di Leger
              </p>
            </div>
          </div>
        </div>

        {tasks.length === 0 ? (
          <div className="p-12 text-center border-2 border-dashed border-slate-200 rounded-2xl text-slate-400">
            <ClipboardList className="w-10 h-10 mx-auto mb-2 opacity-30" />
            <p className="text-xs font-semibold text-slate-600">
              Belum ada tugas yang dikirimkan.
            </p>
            <p className="text-[11px] mt-1">
              Gunakan formulir di sebelah kiri untuk mengirim tugas Simulasi, CBT, atau Esai ke siswa.
            </p>
          </div>
        ) : (
          <div className="space-y-3 max-h-[540px] overflow-y-auto pr-1">
            {tasks.map((t) => (
              <div
                key={t.id}
                className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 hover:bg-white transition flex flex-wrap items-start justify-between gap-3"
              >
                <div className="space-y-1.5 flex-1 min-w-[220px]">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span
                      className={`px-2 py-0.5 rounded-md text-[10px] font-mono font-bold uppercase ${
                        t.taskType === 'simulation'
                          ? 'bg-blue-100 text-blue-800'
                          : t.taskType === 'cbt'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-purple-100 text-purple-800'
                      }`}
                    >
                      {t.taskType === 'simulation'
                        ? 'Simulasi'
                        : t.taskType === 'cbt'
                        ? 'CBT 40 Soal'
                        : 'Esai AI'}
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-white border border-slate-200 text-[10px] font-mono font-bold text-slate-700">
                      {t.babCode}
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-amber-50 border border-amber-200 text-[10px] font-semibold text-amber-800">
                      {t.targetType === 'all'
                        ? 'Semua Siswa'
                        : t.targetType === 'school'
                        ? t.targetSchool
                        : t.targetType === 'class'
                        ? `${t.targetClass} (${t.targetSchool?.includes('MUDITA') ? 'Mudita' : 'SMKN 1'})`
                        : t.targetStudentName}
                    </span>
                  </div>

                  <h4 className="font-bold text-sm text-slate-900">{t.title}</h4>
                  {t.notes && (
                    <p className="text-xs text-slate-600 italic">"{t.notes}"</p>
                  )}
                  <div className="flex items-center gap-3 text-[11px] text-slate-400 font-mono">
                    <span>Dikirim: {new Date(t.createdAt).toLocaleDateString('id-ID')}</span>
                    {t.dueDate && (
                      <span className="text-amber-700 font-semibold flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        Batas: {t.dueDate}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleEdit(t)}
                    className="px-2.5 py-1.5 rounded-xl bg-white border border-slate-200 hover:border-blue-500 text-slate-700 hover:text-blue-700 text-xs font-semibold transition flex items-center gap-1"
                    title="Ganti / Edit Tugas"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Ganti</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(t.id)}
                    className="px-2.5 py-1.5 rounded-xl bg-red-50 border border-red-200 hover:bg-red-100 text-red-700 text-xs font-semibold transition flex items-center gap-1"
                    title="Hapus Tugas"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Hapus</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
