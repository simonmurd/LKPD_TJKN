import { RombelAssignment, StudentProfile } from '../types/curriculum';

export const ROMBEL_ASSIGNMENTS_STORAGE_KEY = 'tjkn_rombel_assignments_v1';

export const ALL_ROMBEL_LIST: { school: string; className: string; label: string }[] = [
  { school: 'SMK NEGERI 1 SINGKAWANG', className: 'X TJK', label: 'X TJK - SMKN 1 Singkawang' },
  { school: 'SMK NEGERI 1 SINGKAWANG', className: 'XI TJK', label: 'XI TJK - SMKN 1 Singkawang' },
  { school: 'SMK NEGERI 1 SINGKAWANG', className: 'XII TJK 1', label: 'XII TJK 1 - SMKN 1 Singkawang' },
  { school: 'SMK NEGERI 1 SINGKAWANG', className: 'XII TJK 2', label: 'XII TJK 2 - SMKN 1 Singkawang' },
  { school: 'SMK NEGERI 1 SINGKAWANG', className: 'XII TJK 3', label: 'XII TJK 3 - SMKN 1 Singkawang' },
  { school: 'SMK MUDITA SINGKAWANG', className: 'X TJKT', label: 'X TJKT - SMK Mudita Singkawang' },
  { school: 'SMK MUDITA SINGKAWANG', className: 'XI TJKT', label: 'XI TJKT - SMK Mudita Singkawang' },
  { school: 'SMK MUDITA SINGKAWANG', className: 'XII TJKT', label: 'XII TJKT - SMK Mudita Singkawang' },
];

export function getRombelKey(school: string, className: string): string {
  return `${school.trim()}|${className.trim()}`;
}

export const DEFAULT_ROMBEL_ASSIGNMENTS: Record<string, RombelAssignment> = {
  [getRombelKey('SMK NEGERI 1 SINGKAWANG', 'X TJK')]: {
    rombelKey: getRombelKey('SMK NEGERI 1 SINGKAWANG', 'X TJK'),
    school: 'SMK NEGERI 1 SINGKAWANG',
    className: 'X TJK',
    allowedBabs: [1, 2, 3], // Kelas X fokus Media Transmisi & Pengkabelan
    allowedSections: {
      overview: true,
      simulations: true,
      objective: true,
      qualitative: true,
    },
    notes: 'Tugas Praktikum: Selesaikan Simulasi Crimping T568A/B dan Pengujian LAN Tester serta CBT Bab 1-3.',
    updatedAt: new Date().toISOString(),
  },
  [getRombelKey('SMK NEGERI 1 SINGKAWANG', 'XI TJK')]: {
    rombelKey: getRombelKey('SMK NEGERI 1 SINGKAWANG', 'XI TJK'),
    school: 'SMK NEGERI 1 SINGKAWANG',
    className: 'XI TJK',
    allowedBabs: [4, 5, 6, 7], // Kelas XI fokus Perangkat Keras & Nirkabel
    allowedSections: {
      overview: true,
      simulations: true,
      objective: true,
      qualitative: true,
    },
    notes: 'Tugas: Simulasi Pengaturan Kanal Spektrum Nirkabel dan Keamanan WPA2/WPA3.',
    updatedAt: new Date().toISOString(),
  },
  [getRombelKey('SMK NEGERI 1 SINGKAWANG', 'XII TJK 1')]: {
    rombelKey: getRombelKey('SMK NEGERI 1 SINGKAWANG', 'XII TJK 1'),
    school: 'SMK NEGERI 1 SINGKAWANG',
    className: 'XII TJK 1',
    allowedBabs: [8, 9, 10, 11, 12, 13, 14], // Kelas XII fokus Fiber Optic, Outdoor & QoS
    allowedSections: {
      overview: true,
      simulations: true,
      objective: true,
      qualitative: true,
    },
    notes: 'Penugasan: Analisis OTDR, Splicing Fiber Optic dan Simulasi Bandwidth QoS.',
    updatedAt: new Date().toISOString(),
  },
  [getRombelKey('SMK NEGERI 1 SINGKAWANG', 'XII TJK 2')]: {
    rombelKey: getRombelKey('SMK NEGERI 1 SINGKAWANG', 'XII TJK 2'),
    school: 'SMK NEGERI 1 SINGKAWANG',
    className: 'XII TJK 2',
    allowedBabs: [8, 9, 10, 11, 12],
    allowedSections: {
      overview: true,
      simulations: true,
      objective: true,
      qualitative: true,
    },
    notes: 'Penugasan: Splicer & Pengujian Reflektometer OTDR.',
    updatedAt: new Date().toISOString(),
  },
  [getRombelKey('SMK NEGERI 1 SINGKAWANG', 'XII TJK 3')]: {
    rombelKey: getRombelKey('SMK NEGERI 1 SINGKAWANG', 'XII TJK 3'),
    school: 'SMK NEGERI 1 SINGKAWANG',
    className: 'XII TJK 3',
    allowedBabs: [8, 9, 10, 11, 14],
    allowedSections: {
      overview: true,
      simulations: true,
      objective: true,
      qualitative: true,
    },
    notes: 'Latihan Terbimbing: Praktikum Splicing & Analisis Redaman Fiber Optic.',
    updatedAt: new Date().toISOString(),
  },
  [getRombelKey('SMK MUDITA SINGKAWANG', 'X TJKT')]: {
    rombelKey: getRombelKey('SMK MUDITA SINGKAWANG', 'X TJKT'),
    school: 'SMK MUDITA SINGKAWANG',
    className: 'X TJKT',
    allowedBabs: [1, 2],
    allowedSections: {
      overview: true,
      simulations: true,
      objective: true,
      qualitative: false,
    },
    notes: 'Fokus Pembuatan Kabel UTP Straight & Crossover (T568B).',
    updatedAt: new Date().toISOString(),
  },
  [getRombelKey('SMK MUDITA SINGKAWANG', 'XI TJKT')]: {
    rombelKey: getRombelKey('SMK MUDITA SINGKAWANG', 'XI TJKT'),
    school: 'SMK MUDITA SINGKAWANG',
    className: 'XI TJKT',
    allowedBabs: [4, 5, 6],
    allowedSections: {
      overview: true,
      simulations: true,
      objective: true,
      qualitative: true,
    },
    notes: 'Fokus Perangkat Keras dan Spektrum Nirkabel 2.4/5 GHz.',
    updatedAt: new Date().toISOString(),
  },
  [getRombelKey('SMK MUDITA SINGKAWANG', 'XII TJKT')]: {
    rombelKey: getRombelKey('SMK MUDITA SINGKAWANG', 'XII TJKT'),
    school: 'SMK MUDITA SINGKAWANG',
    className: 'XII TJKT',
    allowedBabs: [8, 9, 10, 11, 13],
    allowedSections: {
      overview: true,
      simulations: true,
      objective: true,
      qualitative: true,
    },
    notes: 'Praktikum Outdoor Nirkabel dan Penyambungan Inti Fiber Optic.',
    updatedAt: new Date().toISOString(),
  },
};

export function getRombelAssignments(): Record<string, RombelAssignment> {
  if (typeof window === 'undefined') return DEFAULT_ROMBEL_ASSIGNMENTS;
  try {
    const raw = localStorage.getItem(ROMBEL_ASSIGNMENTS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      // Merge with defaults so any missing classes get initialized
      return { ...DEFAULT_ROMBEL_ASSIGNMENTS, ...parsed };
    }
  } catch (e) {
    console.warn('Failed to load rombel assignments from storage', e);
  }
  return DEFAULT_ROMBEL_ASSIGNMENTS;
}

export function saveRombelAssignments(assignments: Record<string, RombelAssignment>): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(ROMBEL_ASSIGNMENTS_STORAGE_KEY, JSON.stringify(assignments));
  } catch (e) {
    console.error('Failed to save rombel assignments', e);
  }
}

export function getAssignmentForStudent(
  student: StudentProfile | null,
  assignments: Record<string, RombelAssignment>
): RombelAssignment | null {
  if (!student) return null;
  const key = getRombelKey(student.school, student.className);
  return assignments[key] || null;
}

export function isBabAccessibleForStudent(
  student: StudentProfile | null,
  babId: number,
  assignments: Record<string, RombelAssignment>
): boolean {
  if (!student) return true; // Gate screen handles unauthenticated state
  const assignment = getAssignmentForStudent(student, assignments);
  if (!assignment) return true; // Default fallback open if not specified
  return assignment.allowedBabs.includes(babId);
}

export function isSectionAccessibleForStudent(
  student: StudentProfile | null,
  babId: number,
  section: 'overview' | 'simulations' | 'objective' | 'qualitative',
  assignments: Record<string, RombelAssignment>
): { allowed: boolean; reason?: string } {
  if (!student) return { allowed: true };
  const assignment = getAssignmentForStudent(student, assignments);
  if (!assignment) return { allowed: true };

  // First check if Bab itself is assigned
  if (!assignment.allowedBabs.includes(babId)) {
    return {
      allowed: false,
      reason: `Bab ${babId} belum ditugaskan untuk rombel ${student.className} (${student.school}).`,
    };
  }

  // Next check if this section is enabled for the rombel
  if (section === 'overview') {
    return { allowed: assignment.allowedSections.overview !== false };
  }
  if (section === 'simulations') {
    return {
      allowed: assignment.allowedSections.simulations !== false,
      reason: `Bagian Praktikum Simulasi Bab ${babId} dinonaktifkan oleh Guru untuk rombel ${student.className}.`,
    };
  }
  if (section === 'objective') {
    return {
      allowed: assignment.allowedSections.objective !== false,
      reason: `Bagian Evaluasi Objektif (40 Soal CBT) Bab ${babId} belum dibuka untuk rombel ${student.className}.`,
    };
  }
  if (section === 'qualitative') {
    return {
      allowed: assignment.allowedSections.qualitative !== false,
      reason: `Bagian Evaluasi Kualitatif (10 Soal Esai) Bab ${babId} belum dibuka untuk rombel ${student.className}.`,
    };
  }

  return { allowed: true };
}
