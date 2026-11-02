import { DirectChatMessage } from '../types/curriculum';

const STORAGE_KEY = 'tjkn_direct_messages_v1';

// Initial seed messages demonstrating teacher-student communication
const INITIAL_SEED_MESSAGES: DirectChatMessage[] = [
  {
    id: 'msg_seed_1',
    sender: 'guru',
    teacherName: 'Simon Murd',
    studentId: 'smkn1_x_01',
    studentName: 'ALVINO',
    className: 'X TJK',
    school: 'SMK NEGERI 1 SINGKAWANG',
    message: 'Selamat Alvino! Nilai CBT Bab 1 kamu sangat baik (88%). Pemahaman kabel UTP dan pinout T568A/B kamu sudah kuat. Silakan lanjutkan ke Bab 2.',
    timestamp: new Date(Date.now() - 3600000 * 5).toISOString(),
    isReadByStudent: true,
    isReadByTeacher: true,
    babReference: 1,
    tag: 'apresiasi',
  },
  {
    id: 'msg_seed_2',
    sender: 'siswa',
    teacherName: 'Simon Murd',
    studentId: 'smkn1_x_01',
    studentName: 'ALVINO',
    className: 'X TJK',
    school: 'SMK NEGERI 1 SINGKAWANG',
    message: 'Terima kasih banyak Pak Simon! Siap, saya akan langsung mulai pelajari Bab 2 pembuatan kabel.',
    timestamp: new Date(Date.now() - 3600000 * 4).toISOString(),
    isReadByStudent: true,
    isReadByTeacher: true,
    babReference: 1,
    tag: 'umum',
  },
  {
    id: 'msg_seed_3',
    sender: 'guru',
    teacherName: 'Simon Murd',
    studentId: 'smkn1_x_04',
    studentName: 'DEO REVALDY AHMAD',
    className: 'X TJK',
    school: 'SMK NEGERI 1 SINGKAWANG',
    message: 'Halo Deo, saya perhatikan kamu menyelesaikan ujian CBT Bab 2 hanya dalam waktu 45 detik dan nilainya masih 50% (di bawah KKM 75). Sistem menandai durasi ini terlalu cepat. Mohon baca kembali modul secara teliti lalu ajukan ujian remedial ya.',
    timestamp: new Date(Date.now() - 3600000 * 2).toISOString(),
    isReadByStudent: false,
    isReadByTeacher: true,
    babReference: 2,
    tag: 'teguran',
  },
  {
    id: 'msg_seed_4',
    sender: 'guru',
    teacherName: 'Simon Murd',
    studentId: 'mudita_xi_01',
    studentName: 'ALICIA JENIFER',
    className: 'XI TJKT',
    school: 'SMK MUDITA SINGKAWANG',
    message: 'Halo Alicia, kerja bagus pada simulasi spektrum nirkabel 2.4 GHz vs 5 GHz Bab 5 kemarin. Analisis interferensi saluran kamu sangat tepat.',
    timestamp: new Date(Date.now() - 3600000 * 7).toISOString(),
    isReadByStudent: true,
    isReadByTeacher: true,
    babReference: 5,
    tag: 'apresiasi',
  },
];

export function getAllDirectMessages(): DirectChatMessage[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_SEED_MESSAGES));
      return INITIAL_SEED_MESSAGES;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : INITIAL_SEED_MESSAGES;
  } catch (e) {
    console.warn('Error reading direct messages from localStorage', e);
    return INITIAL_SEED_MESSAGES;
  }
}

export function saveAllDirectMessages(messages: DirectChatMessage[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
    // Dispatch custom event so reactive components update across tabs or modals
    window.dispatchEvent(new CustomEvent('tjkn_direct_messages_updated'));
  } catch (e) {
    console.error('Error saving direct messages to localStorage', e);
  }
}

export function getMessagesForStudent(studentId: string): DirectChatMessage[] {
  const all = getAllDirectMessages();
  return all.filter((m) => m.studentId === studentId);
}

export function sendDirectMessage(
  payload: Omit<DirectChatMessage, 'id' | 'timestamp'>
): DirectChatMessage {
  const all = getAllDirectMessages();
  const newMsg: DirectChatMessage = {
    ...payload,
    id: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    timestamp: new Date().toISOString(),
  };

  const updated = [...all, newMsg];
  saveAllDirectMessages(updated);
  return newMsg;
}

export function markMessagesAsReadByStudent(studentId: string): void {
  const all = getAllDirectMessages();
  let changed = false;
  const updated = all.map((m) => {
    if (m.studentId === studentId && m.sender === 'guru' && !m.isReadByStudent) {
      changed = true;
      return { ...m, isReadByStudent: true };
    }
    return m;
  });

  if (changed) {
    saveAllDirectMessages(updated);
  }
}

export function markMessagesAsReadByTeacher(studentId: string): void {
  const all = getAllDirectMessages();
  let changed = false;
  const updated = all.map((m) => {
    if (m.studentId === studentId && m.sender === 'siswa' && !m.isReadByTeacher) {
      changed = true;
      return { ...m, isReadByTeacher: true };
    }
    return m;
  });

  if (changed) {
    saveAllDirectMessages(updated);
  }
}

export function getUnreadCountForStudent(studentId: string): number {
  const all = getAllDirectMessages();
  return all.filter((m) => m.studentId === studentId && m.sender === 'guru' && !m.isReadByStudent).length;
}

export function getUnreadCountForTeacher(): number {
  const all = getAllDirectMessages();
  return all.filter((m) => m.sender === 'siswa' && !m.isReadByTeacher).length;
}
