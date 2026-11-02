import React, { useRef } from 'react';
import { CurriculumBab } from '../../types/curriculum';
import { Printer, Download, ArrowLeft, School, CheckSquare, FileText } from 'lucide-react';

interface PrintableLkpdProps {
  bab: CurriculumBab;
  onBack: () => void;
}

export const PrintableLkpd: React.FC<PrintableLkpdProps> = ({ bab, onBack }) => {
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadMarkdown = () => {
    const md = `# LEMBAR KERJA PESERTA DIDIK (LKPD) STANDAR SMK TKJ
Modul: ${bab.code} - ${bab.title}
Kelas / Fase: ${bab.grade} (Fase F)
Alokasi Waktu: ${bab.hoursAllocation} JP

Capaian Pembelajaran:
${bab.capaianPembelajaran}

BAGIAN 1: INTERAKTIF & SIMULASI (4 TUGAS)
${bab.simulations.map((s) => `### Tugas #${s.taskNumber}: ${s.title}\nTujuan: ${s.objective}\n`).join('\n')}

BAGIAN 2: EVALUASI OBJEKTIF (40 BUTIR SOAL)
- 20 Soal Pilihan Ganda Standar (A-E)
- 20 Soal Pilihan Ganda Kompleks (Checkbox)

BAGIAN 3: EVALUASI KUALITATIF (10 SOAL ESAI & TROUBLESHOOTING)
${bab.essayQuestions.map((e) => `### Kasus #${e.number}: ${e.title}\n${e.caseBackground}\nSoal: ${e.question}\n`).join('\n')}
`;

    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `LKPD_${bab.code}_${bab.title.replace(/\s+/g, '_')}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Action Navigation Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-wrap items-center justify-between gap-3 print:hidden">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Kembali ke Tampilan Interaktif
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={handleDownloadMarkdown}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition"
          >
            <Download className="w-3.5 h-3.5" />
            Download Markdown (.md)
          </button>

          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow transition"
          >
            <Printer className="w-3.5 h-3.5" />
            Cetak / Simpan PDF Lembar Kerja
          </button>
        </div>
      </div>

      {/* Printable Sheet (Formatted like official Indonesian SMK Worksheet) */}
      <div
        ref={printRef}
        className="bg-white text-slate-900 p-8 sm:p-12 rounded-xl shadow-2xl max-w-4xl mx-auto font-serif print:p-0 print:shadow-none print:max-w-none text-xs leading-relaxed"
      >
        {/* Kop Surat Sekolah Standar SMK */}
        <div className="border-b-4 border-double border-slate-900 pb-4 mb-6 text-center">
          <div className="uppercase tracking-wider font-sans font-bold text-sm text-slate-700">
            KEMENTERIAN PENDIDIKAN, KEBUDAYAAN, RISET, DAN TEKNOLOGI
          </div>
          <div className="uppercase tracking-wide font-sans font-black text-base sm:text-lg text-slate-900 mt-0.5">
            SEKOLAH MENENGAH KEJURUAN (SMK) PUSAT KEUNGGULAN
          </div>
          <div className="font-sans text-[11px] text-slate-600">
            PROGRAM KEAHLIAN TEKNIK JARINGAN KOMPUTER DAN TELEKOMUNIKASI (TJKT / TKJ)
          </div>
          <div className="font-sans italic text-[10px] text-slate-500 mt-1">
            Modul & Lembar Kerja Peserta Didik (LKPD) Kurikulum Merdeka - Fase F
          </div>
        </div>

        {/* Title */}
        <div className="text-center mb-6">
          <h2 className="font-sans font-black text-lg uppercase tracking-tight text-slate-900">
            LEMBAR KERJA PESERTA DIDIK (LKPD)
          </h2>
          <div className="font-sans font-bold text-sm text-slate-800 mt-0.5">
            MATA PELAJARAN: TEKNOLOGI JARINGAN KABEL DAN NIRKABEL (TJKN)
          </div>
          <div className="font-sans font-semibold text-xs text-blue-800 mt-0.5">
            {bab.code}: {bab.title}
          </div>
        </div>

        {/* Student Identity Box */}
        <div className="border border-slate-400 p-3.5 rounded-lg mb-6 font-sans text-xs grid grid-cols-2 gap-y-2 gap-x-4 bg-slate-50">
          <div>
            <span className="font-bold">Nama Lengkap Siswa:</span>{' '}
            <span className="border-b border-dotted border-slate-500 inline-block w-48"></span>
          </div>
          <div>
            <span className="font-bold">Kelas / Semester:</span> {bab.grade} / Semester {bab.semester}
          </div>
          <div>
            <span className="font-bold">NIS / NISN:</span>{' '}
            <span className="border-b border-dotted border-slate-500 inline-block w-48"></span>
          </div>
          <div>
            <span className="font-bold">Alokasi Waktu:</span> {bab.hoursAllocation} JP
          </div>
          <div>
            <span className="font-bold">Nama Kelompok:</span>{' '}
            <span className="border-b border-dotted border-slate-500 inline-block w-48"></span>
          </div>
          <div>
            <span className="font-bold">Tanggal Praktik:</span>{' '}
            <span className="border-b border-dotted border-slate-500 inline-block w-48"></span>
          </div>
        </div>

        {/* CP & ATP */}
        <div className="mb-6 font-sans">
          <h3 className="font-bold text-xs uppercase bg-slate-200 px-2 py-1 mb-2 border-l-4 border-slate-800">
            I. Capaian Pembelajaran (CP) & Tujuan Pembelajaran
          </h3>
          <p className="text-[11px] text-slate-700 italic mb-2 leading-relaxed">
            "{bab.capaianPembelajaran}"
          </p>
          <ol className="list-decimal list-inside space-y-1 text-[11px] text-slate-800">
            {bab.tujuanPembelajaran.map((tp, idx) => (
              <li key={idx}>{tp}</li>
            ))}
          </ol>
        </div>

        {/* BAGIAN 1: SIMULASI PRAKTIKUM */}
        <div className="mb-8 font-sans">
          <h3 className="font-bold text-xs uppercase bg-slate-200 px-2 py-1 mb-3 border-l-4 border-blue-800 flex justify-between">
            <span>BAGIAN 1: INTERAKTIF & SIMULASI PRAKTIKUM (4 TUGAS)</span>
            <span className="text-[10px]">Bobot: 30 Poin</span>
          </h3>

          <div className="space-y-4">
            {bab.simulations.map((sim) => (
              <div key={sim.id} className="border border-slate-300 p-3 rounded bg-slate-50/50">
                <div className="font-bold text-xs text-slate-900 mb-1">
                  Tugas Praktik #{sim.taskNumber}: {sim.title}
                </div>
                <div className="text-[11px] text-slate-700 mb-2">
                  <strong>Tujuan:</strong> {sim.objective}
                </div>
                <div className="text-[10px] text-slate-600 mb-2">
                  <strong>Alat & Bahan:</strong> {sim.toolsAndMaterials.join(', ')} | <strong>K3LH:</strong> {sim.safetyGuidelines.join(', ')}
                </div>
                <div className="text-[11px] text-slate-800 mb-2">
                  <strong>Langkah Kerja:</strong>
                  <ol className="list-decimal list-inside space-y-0.5 mt-1">
                    {sim.stepByStepGuide.map((step, i) => (
                      <li key={i}>{step}</li>
                    ))}
                  </ol>
                </div>
                <div className="border-t border-slate-200 pt-2 text-[10px] text-slate-600 italic">
                  <strong>Pertanyaan Analisis:</strong> {sim.criticalAnalysisQuestion}
                </div>
                <div className="mt-2 border border-dashed border-slate-300 h-14 rounded bg-white flex items-center justify-center text-slate-400 text-[10px]">
                  [Kolom Catatan Pengamatan & Tanda Tangan Instruktur Lab]
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* BAGIAN 2: EVALUASI OBJEKTIF */}
        <div className="mb-8 font-sans">
          <h3 className="font-bold text-xs uppercase bg-slate-200 px-2 py-1 mb-3 border-l-4 border-purple-800 flex justify-between">
            <span>BAGIAN 2: EVALUASI OBJEKTIF (40 BUTIR SOAL CBT)</span>
            <span className="text-[10px]">Bobot: 40 Poin</span>
          </h3>

          <div className="mb-4">
            <h4 className="font-bold text-xs text-slate-900 mb-2">
              A. 20 Soal Pilihan Ganda Standar (Pilihan Tunggal A-B-C-D-E)
            </h4>
            <div className="space-y-3">
              {bab.standardMCQs.map((q) => (
                <div key={q.id} className="text-[11px]">
                  <div className="font-medium text-slate-900">
                    <strong>{q.number}.</strong> {q.question}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 mt-1 pl-4 text-slate-700">
                    {q.options.map((opt) => (
                      <div key={opt.id}>
                        ({opt.id}) {opt.text}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-4 border-t border-slate-300">
            <h4 className="font-bold text-xs text-slate-900 mb-2">
              B. 20 Soal Pilihan Ganda Kompleks (Centang Beberapa Opsi yang Benar)
            </h4>
            <div className="space-y-3">
              {bab.complexMCQs.map((q) => (
                <div key={q.id} className="text-[11px]">
                  <div className="font-medium text-slate-900">
                    <strong>{q.number}.</strong> {q.question}
                  </div>
                  <div className="space-y-1 mt-1 pl-4 text-slate-700">
                    {q.options.map((opt) => (
                      <div key={opt.id} className="flex items-center gap-1.5">
                        <span className="inline-block w-3 h-3 border border-slate-600 rounded-sm"></span>
                        <span>
                          <strong>{opt.id}.</strong> {opt.text}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* BAGIAN 3: EVALUASI KUALITATIF */}
        <div className="mb-8 font-sans">
          <h3 className="font-bold text-xs uppercase bg-slate-200 px-2 py-1 mb-3 border-l-4 border-emerald-800 flex justify-between">
            <span>BAGIAN 3: EVALUASI KUALITATIF (10 SOAL ESAI & TROUBLESHOOTING)</span>
            <span className="text-[10px]">Bobot: 30 Poin</span>
          </h3>

          <div className="space-y-5">
            {bab.essayQuestions.map((e) => (
              <div key={e.id} className="text-[11px]">
                <div className="font-bold text-slate-900 mb-1">
                  Kasus #{e.number}: {e.title}
                </div>
                <div className="italic text-slate-600 bg-slate-100 p-2 rounded mb-1 text-[10px]">
                  Latar Belakang: "{e.caseBackground}"
                </div>
                <div className="whitespace-pre-line text-slate-800 mb-2 font-medium">
                  {e.question}
                </div>
                <div className="border border-slate-300 rounded p-2 bg-slate-50 text-[10px] text-slate-500 mb-2">
                  <strong>Kriteria Rubrik:</strong> {e.rubric.criteria.map((c) => `${c.aspect} (${c.score}P)`).join(' • ')}
                </div>
                <div className="border border-dashed border-slate-400 rounded h-20 bg-white p-2 text-slate-300 text-[10px]">
                  [Lembar Jawaban Siswa...]
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Lembar Tanda Tangan Penilaian Guru */}
        <div className="border-t-2 border-slate-800 pt-4 font-sans text-xs">
          <div className="grid grid-cols-2 gap-8 text-center">
            <div>
              <div className="font-bold text-slate-800 mb-16">
                Mengetahui,<br />Orang Tua / Wali Siswa
              </div>
              <div className="border-b border-slate-400 w-48 mx-auto"></div>
              <span className="text-[10px] text-slate-500 mt-0.5 block">(Tanda Tangan & Nama Terang)</span>
            </div>

            <div>
              <div className="font-bold text-slate-800 mb-16">
                Guru Pengampu Kejuruan TKJ,<br />Instruktur Lab Jaringan
              </div>
              <div className="border-b border-slate-400 w-48 mx-auto"></div>
              <span className="text-[10px] text-slate-500 mt-0.5 block">NIP. .................................................</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
