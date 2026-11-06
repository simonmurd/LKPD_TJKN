import { DirectChatMessage } from '../types/curriculum';
import {
  sendChatMessageToFirestore,
  subscribeToChatMessagesFromFirestore,
} from '../lib/firebase';

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
    id: 'msg_seed_veliyan_1',
    sender: 'guru',
    teacherName: 'Simon Murd',
    studentId: 'mudita_xii_31',
    studentName: 'VELIYAN VINSON',
    className: 'XII TJKT',
    school: 'SMK MUDITA SINGKAWANG',
    message: 'Halo Veliyan, hasil evaluasi CBT Bab 8 Jaringan Nirkabel Outdoor kamu sudah masuk dengan nilai sangat bagus 93% (Lulus KKM). Pertahankan performanya ya!',
    timestamp: new Date(Date.now() - 1000 * 60 * 12).toISOString(),
    isReadByStudent: true,
    isReadByTeacher: true,
    babReference: 8,
    tag: 'apresiasi',
  },
  {
    id: 'msg_seed_veliyan_2',
    sender: 'siswa',
    teacherName: 'Simon Murd',
    studentId: 'mudita_xii_31',
    studentName: 'VELIYAN VINSON',
    className: 'XII TJKT',
    school: 'SMK MUDITA SINGKAWANG',
    message: 'Terima kasih banyak Pak Simon atas bimbingannya! Saya sudah selesaikan simulasi dan CBT Bab 8. Jika ada tugas lanjutan akan segera saya kerjakan.',
    timestamp: new Date(Date.now() - 1000 * 60 * 8).toISOString(),
    isReadByStudent: true,
    isReadByTeacher: true,
    babReference: 8,
    tag: 'umum',
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

// Real-time synchronization with server (Multi-device support)
export async function syncMessagesWithServer(): Promise<DirectChatMessage[]> {
  try {
    const res = await fetch('/api/messages');
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data.messages)) {
        const local = getAllDirectMessages();
        // Merge by ID avoiding duplicates
        const map = new Map<string, DirectChatMessage>();
        local.forEach((m) => map.set(m.id, m));
        data.messages.forEach((m: DirectChatMessage) => map.set(m.id, m));

        const merged = Array.from(map.values()).sort(
          (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
        );

        localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
        window.dispatchEvent(new CustomEvent('tjkn_direct_messages_updated'));
        return merged;
      }
    }
  } catch (e) {
    // ignore offline or failed sync
  }
  return getAllDirectMessages();
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

  // Sync to server immediately so other devices (teacher or student) receive it
  fetch('/api/messages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(newMsg),
  }).catch((err) => console.warn('Could not post message to server:', err));

  // Sync to Firestore Real-Time
  sendChatMessageToFirestore(newMsg).catch((err) => console.warn('Could not post message to Firestore:', err));

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

  // Notify server
  fetch('/api/messages/mark-read', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ studentId, role: 'siswa' }),
  }).catch(() => {});
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

  // Notify server
  fetch('/api/messages/mark-read', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ studentId, role: 'guru' }),
  }).catch(() => {});
}

export function getUnreadCountForStudent(studentId: string): number {
  const all = getAllDirectMessages();
  return all.filter((m) => m.studentId === studentId && m.sender === 'guru' && !m.isReadByStudent).length;
}

export function getUnreadCountForTeacher(): number {
  const all = getAllDirectMessages();
  return all.filter((m) => m.sender === 'siswa' && !m.isReadByTeacher).length;
}

// Initialize Firestore Real-time listener for direct messages
let hasInitializedFirestoreListener = false;
export function initFirestoreChatSync(): void {
  if (hasInitializedFirestoreListener || typeof window === 'undefined') return;
  hasInitializedFirestoreListener = true;

  subscribeToChatMessagesFromFirestore((firestoreMsgs) => {
    if (!firestoreMsgs || firestoreMsgs.length === 0) return;
    const local = getAllDirectMessages();
    const map = new Map<string, DirectChatMessage>();
    local.forEach((m) => map.set(m.id, m));
    firestoreMsgs.forEach((m) => map.set(m.id, m));

    const merged = Array.from(map.values()).sort(
      (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );

    localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
    window.dispatchEvent(new CustomEvent('tjkn_direct_messages_updated'));
  });
}
initFirestoreChatSync();
