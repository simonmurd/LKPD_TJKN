import { CurriculumBab } from '../../types/curriculum';
import { BAB_METADATA_LIST } from './babMetadata';
import { generateDefaultQuestionsForBab } from './questionBank';

const CACHE_KEY_PREFIX = 'tjkn_curriculum_bab_v1_';

export function getAllCurriculumBabs(): CurriculumBab[] {
  return BAB_METADATA_LIST.map((meta) => {
    // Check if custom user-edited Bab exists in localStorage
    if (typeof window !== 'undefined') {
      try {
        const cached = localStorage.getItem(`${CACHE_KEY_PREFIX}${meta.id}`);
        if (cached) {
          const parsed = JSON.parse(cached);
          if (parsed && parsed.id === meta.id) {
            return parsed;
          }
        }
      } catch (e) {
        console.warn('Failed to load cached bab', e);
      }
    }

    const questions = generateDefaultQuestionsForBab(meta.id);

    return {
      id: meta.id,
      code: meta.code,
      title: meta.title,
      semester: meta.semester,
      grade: meta.grade,
      hoursAllocation: meta.hoursAllocation,
      capaianPembelajaran: meta.capaianPembelajaran,
      elemen: meta.elemen,
      tujuanPembelajaran: meta.tujuanPembelajaran,
      primarySimulationType: meta.primarySimulationType,
      simulations: meta.simulations,
      standardMCQs: questions.standardMCQs,
      complexMCQs: questions.complexMCQs,
      essayQuestions: questions.essayQuestions,
    };
  });
}

export function getCurriculumBabById(id: number): CurriculumBab {
  const all = getAllCurriculumBabs();
  return all.find((b) => b.id === id) || all[0];
}

export function saveCustomBabToStorage(bab: CurriculumBab): void {
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(`${CACHE_KEY_PREFIX}${bab.id}`, JSON.stringify(bab));
    } catch (e) {
      console.error('Failed to save bab to localStorage', e);
    }
  }
}

export function resetBabToDefault(babId: number): CurriculumBab {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(`${CACHE_KEY_PREFIX}${babId}`);
  }
  return getCurriculumBabById(babId);
}

export function exportBabToJson(bab: CurriculumBab): string {
  return JSON.stringify(bab, null, 2);
}

export function exportBabToMarkdown(bab: CurriculumBab): string {
  let md = `# LEMBAR KERJA PESERTA DIDIK (LKPD) STANDAR SMK TKJ / TJKT
**Mata Pelajaran:** Teknologi Jaringan Kabel dan Nirkabel (TJKN)
**Tingkat / Fase:** ${bab.grade} (Fase F) | Semester ${bab.semester}
**Alokasi Waktu:** ${bab.hoursAllocation} JP
**Kode Modul:** ${bab.code} - ${bab.title}
**Elemen:** ${bab.elemen}

---

## I. CAPAIAN PEMBELAJARAN (CP)
${bab.capaianPembelajaran}

### Tujuan Pembelajaran:
${bab.tujuanPembelajaran.map((tp, idx) => `${idx + 1}. ${tp}`).join('\n')}

---

## BAGIAN 1: INTERAKTIF & SIMULASI PRAKTIKUM (4 TUGAS)
${bab.simulations
  .map(
    (sim) => `
### Tugas Praktik ${sim.taskNumber}: ${sim.title}
- **Tujuan:** ${sim.objective}
- **Alat & Bahan:** ${sim.toolsAndMaterials.join(', ')}
- **Panduan K3LH:** ${sim.safetyGuidelines.join(', ')}
- **Langkah Kerja:**
${sim.stepByStepGuide.map((s, i) => `  ${i + 1}. ${s}`).join('\n')}
- **Hasil Pengamatan yang Diharapkan:** ${sim.expectedObservation}
- **Pertanyaan Kritis Siswa:** *${sim.criticalAnalysisQuestion}*
`
  )
  .join('\n---\n')}

---

## BAGIAN 2: EVALUASI OBJEKTIF (40 BUTIR SOAL)

### A. 20 Soal Pilihan Ganda Standar (Pilihan Tunggal A-B-C-D-E)
${bab.standardMCQs
  .map(
    (q) => `
**Soal ${q.number}.** (${q.difficulty} - ${q.competency})
${q.question}
${q.options.map((o) => `[ ] ${o.id}. ${o.text}`).join('\n')}
*Kunci Jawaban Guru:* **${q.correctAnswer}**
*Pembahasan:* ${q.explanation}
`
  )
  .join('\n')}

### B. 20 Soal Pilihan Ganda Kompleks (Pilihan Ganda Lebih dari Satu Jawaban)
${bab.complexMCQs
  .map(
    (q) => `
**Soal ${q.number}.** (${q.difficulty} - ${q.competency})
${q.question}
${q.options.map((o) => `[ ] ${o.id}. ${o.text}`).join('\n')}
*Kunci Jawaban Guru:* **${q.correctAnswers.join(', ')}**
*Pembahasan:* ${q.explanation}
`
  )
  .join('\n')}

---

## BAGIAN 3: EVALUASI KUALITATIF (10 SOAL ESAI & TROUBLESHOOTING)
${bab.essayQuestions
  .map(
    (e) => `
### Kasus #${e.number}: ${e.title}
**Latar Belakang Skenario Industri:**
> ${e.caseBackground}

**Instruksi Masalah:**
${e.question}

**Rubrik Penilaian Guru (Maksimal 100 Poin):**
${e.rubric.criteria.map((c) => `- **${c.aspect}** (${c.score} Poin): ${c.indicator}`).join('\n')}

**Model Kunci Jawaban Guru:**
${e.modelAnswer}
`
  )
  .join('\n---\n')}
`;
  return md;
}
