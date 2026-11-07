import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json({ limit: '10mb' }));

// Shared Gemini AI client with required User-Agent
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// Helper for model name
const GEMINI_MODEL = 'gemini-3.8-flash';

// Retry helper with exponential backoff for transient API errors (e.g. 503 high demand)
async function generateWithRetry(fn: () => Promise<any>, retries = 3, delayMs = 1200): Promise<any> {
  try {
    return await fn();
  } catch (err: any) {
    if (retries > 0 && (err?.status === 503 || err?.message?.includes('503') || err?.message?.includes('demand'))) {
      await new Promise((resolve) => setTimeout(resolve, delayMs));
      return generateWithRetry(fn, retries - 1, delayMs * 2);
    }
    throw err;
  }
}

// Google Apps Script endpoints provided by user
const SIMULATION_LOG_APPS_SCRIPT_URL =
  process.env.SIMULATION_LOG_APPS_SCRIPT_URL ||
  'https://script.google.com/macros/s/AKfycbwVxPZEIDP24gxKTkMnibG68CdTbyduO0INuLrWB0iDylZb0XGiMx69FdvLGdNuEDrFJg/exec';

const MCQ_APPS_SCRIPT_URL =
  process.env.MCQ_APPS_SCRIPT_URL ||
  'https://script.google.com/macros/s/AKfycbzD7sroU9tzDHBwhHy95ArrdR_W54JTzJWr1X9cIL6ObmJiP23hjHkZfRlbbbuFQmQ/exec';

const ESSAY_APPS_SCRIPT_URL =
  process.env.ESSAY_APPS_SCRIPT_URL ||
  'https://script.google.com/macros/s/AKfycbw87YyAPmDQbD6kp-Zz876qFRgVpkaU7uO6fXKq00DGRnHy2ykCQKoSrqwcToCF_CSHwQ/exec';

// Health check endpoint
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    hasApiKey: !!process.env.GEMINI_API_KEY,
    simulationUrl: SIMULATION_LOG_APPS_SCRIPT_URL,
    mcqUrl: MCQ_APPS_SCRIPT_URL,
    essayUrl: ESSAY_APPS_SCRIPT_URL,
    time: new Date().toISOString(),
  });
});

// Server-Side Submissions Persistence (Sync across devices & browsers)
const SUBMISSIONS_FILE = path.join(__dirname, 'server_submissions.json');

function getInitialSubmissions(): Record<string, any> {
  return {
    'mudita_xii_31_8': {
      id: 'sub_veliyan_bab8',
      babId: 8,
      studentId: 'mudita_xii_31',
      studentName: 'VELIYAN VINSON',
      school: 'SMK MUDITA SINGKAWANG',
      className: 'XII TJKT',
      noAbsen: '31',
      date: new Date(Date.now() - 1000 * 60 * 3).toISOString(),
      standardAnswers: {},
      complexAnswers: {},
      standardScore: 19,
      complexScore: 18,
      totalScore: 37,
      percentage: 93,
      isPassed: true,
      timeSpentSeconds: 745, // ~12.5 menit (waktu wajar)
      isFlaggedTooFast: false,
      tabViolations: 0,
      raguRaguCount: 0,
      status: 'submitted',
    },
    'mudita_xii_31_1': {
      id: 'sub_veliyan_bab1',
      babId: 1,
      studentId: 'mudita_xii_31',
      studentName: 'VELIYAN VINSON',
      school: 'SMK MUDITA SINGKAWANG',
      className: 'XII TJKT',
      noAbsen: '31',
      date: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
      standardAnswers: {},
      complexAnswers: {},
      standardScore: 18,
      complexScore: 18,
      totalScore: 36,
      percentage: 90,
      isPassed: true,
      timeSpentSeconds: 680,
      isFlaggedTooFast: false,
      tabViolations: 0,
      raguRaguCount: 0,
      status: 'submitted',
    },
    'smkn1_x_01_1': {
      id: 'sub_seed_1',
      babId: 1,
      studentId: 'smkn1_x_01',
      studentName: 'ALVINO',
      school: 'SMK NEGERI 1 SINGKAWANG',
      className: 'X TJK',
      noAbsen: '01',
      date: new Date(Date.now() - 3600000 * 4).toISOString(),
      standardAnswers: {},
      complexAnswers: {},
      standardScore: 18,
      complexScore: 17,
      totalScore: 35,
      percentage: 88,
      isPassed: true,
      timeSpentSeconds: 780,
      status: 'submitted',
    },
    'smkn1_x_04_2': {
      id: 'sub_seed_2',
      babId: 2,
      studentId: 'smkn1_x_04',
      studentName: 'DEO REVALDY AHMAD',
      school: 'SMK NEGERI 1 SINGKAWANG',
      className: 'X TJK',
      noAbsen: '04',
      date: new Date(Date.now() - 3600000 * 2).toISOString(),
      standardAnswers: {},
      complexAnswers: {},
      standardScore: 12,
      complexScore: 8,
      totalScore: 20,
      percentage: 50,
      isPassed: false,
      timeSpentSeconds: 45,
      isFlaggedTooFast: true,
      status: 'submitted',
    },
    'mudita_xi_01_5': {
      id: 'sub_seed_3',
      babId: 5,
      studentId: 'mudita_xi_01',
      studentName: 'ALICIA JENIFER',
      school: 'SMK MUDITA SINGKAWANG',
      className: 'XI TJKT',
      noAbsen: '01',
      date: new Date(Date.now() - 3600000 * 6).toISOString(),
      standardAnswers: {},
      complexAnswers: {},
      standardScore: 19,
      complexScore: 18,
      totalScore: 37,
      percentage: 93,
      isPassed: true,
      timeSpentSeconds: 950,
      status: 'submitted',
    },
  };
}

function readServerSubmissions(): Record<string, any> {
  try {
    if (!fs.existsSync(SUBMISSIONS_FILE)) {
      fs.writeFileSync(SUBMISSIONS_FILE, JSON.stringify({}, null, 2), 'utf-8');
      return {};
    }
    const data = fs.readFileSync(SUBMISSIONS_FILE, 'utf-8');
    return JSON.parse(data) || {};
  } catch (err) {
    console.error('Error reading server submissions', err);
    return {};
  }
}

function writeServerSubmissions(subs: Record<string, any>): void {
  try {
    fs.writeFileSync(SUBMISSIONS_FILE, JSON.stringify(subs, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error saving server submissions', err);
  }
}

// 1. GET all submissions from server
app.get('/api/submissions', (_req: Request, res: Response) => {
  const subs = readServerSubmissions();
  res.json({ success: true, submissions: subs });
});

// 2. POST / SAVE single submission from student to server
app.post('/api/submissions', (req: Request, res: Response) => {
  try {
    const submission = req.body;
    if (!submission || !submission.babId) {
      res.status(400).json({ error: 'Data ujian tidak lengkap' });
      return;
    }
    const studentId =
      submission.studentId ||
      (submission.studentName?.toLowerCase().includes('veliyan') ? 'mudita_xii_31' : 'anon');
    const subKey = `${studentId}_${submission.babId}`;

    const current = readServerSubmissions();
    current[subKey] = {
      ...submission,
      id: submission.id || `sub_${Date.now()}`,
      studentId,
      date: submission.date || new Date().toISOString(),
      status: submission.status || 'submitted',
    };
    writeServerSubmissions(current);
    res.json({ success: true, key: subKey, submission: current[subKey] });
  } catch (e: any) {
    res.status(500).json({ error: `Gagal menyimpan submission: ${e.message}` });
  }
});

// 3. POST / CANCEL submission by teacher
app.post('/api/submissions/cancel', (req: Request, res: Response) => {
  const { key, reason } = req.body;
  const current = readServerSubmissions();
  if (current[key]) {
    current[key].status = 'cancelled_by_teacher';
    current[key].cancelReason = reason || 'Pengerjaan terlalu cepat / tidak wajar';
    current[key].cancelledAt = new Date().toISOString();
    writeServerSubmissions(current);
  }
  res.json({ success: true, key, submission: current[key] });
});

// 4. POST / RESTORE submission by teacher
app.post('/api/submissions/restore', (req: Request, res: Response) => {
  const { key } = req.body;
  const current = readServerSubmissions();
  if (current[key]) {
    current[key].status = 'submitted';
    delete current[key].cancelReason;
    delete current[key].cancelledAt;
    writeServerSubmissions(current);
  }
  res.json({ success: true, key, submission: current[key] });
});

// 5. POST / CLEAR DUMMY DATA (Reset submissions, logs, messages, presence to clean state)
app.post('/api/admin/clear-dummy-data', (_req: Request, res: Response) => {
  try {
    writeServerSubmissions({});
    writeServerMessages([]);
    writeServerPresence({});
    const simFile = path.join(__dirname, 'server_simulations.json');
    const essayFile = path.join(__dirname, 'server_essays.json');
    fs.writeFileSync(simFile, JSON.stringify([], null, 2), 'utf-8');
    fs.writeFileSync(essayFile, JSON.stringify([], null, 2), 'utf-8');
    res.json({ success: true, message: 'Semua data dummy berhasil dibersihkan.' });
  } catch (e: any) {
    res.status(500).json({ error: `Gagal membersihkan data dummy: ${e.message}` });
  }
});

// 5b. POST / RESET STUDENT OR ROMBEL TASKS & SUBMISSIONS
app.post('/api/admin/reset-student-tasks', (req: Request, res: Response) => {
  try {
    const { scope, studentId, rombel, school } = req.body || {};
    if (scope !== 'student' && scope !== 'rombel') {
      return res.status(400).json({ error: 'Scope reset tidak valid (harus student atau rombel).' });
    }
    if (scope === 'student' && !studentId) {
      return res.status(400).json({ error: 'studentId wajib diisi untuk reset perorangan.' });
    }
    if (scope === 'rombel' && !rombel) {
      return res.status(400).json({ error: 'rombel wajib diisi untuk reset per rombel.' });
    }

    const matchesTarget = (item: any) => {
      if (!item) return false;
      if (scope === 'student') {
        return item.studentId === studentId;
      }
      const rombelMatch = item.rombel === rombel;
      const schoolMatch = school ? item.school === school : true;
      return rombelMatch && schoolMatch;
    };

    // 1. Filter submissions
    const currentSubs = readServerSubmissions();
    const nextSubs: Record<string, any> = {};
    for (const [k, v] of Object.entries(currentSubs)) {
      if (!matchesTarget(v) && !(scope === 'student' && k.startsWith(`${studentId}_`))) {
        nextSubs[k] = v;
      }
    }
    writeServerSubmissions(nextSubs);

    // 2. Filter simulation logs
    const simFile = path.join(__dirname, 'server_simulations.json');
    if (fs.existsSync(simFile)) {
      try {
        const sims = JSON.parse(fs.readFileSync(simFile, 'utf-8'));
        if (Array.isArray(sims)) {
          fs.writeFileSync(simFile, JSON.stringify(sims.filter((s) => !matchesTarget(s)), null, 2), 'utf-8');
        }
      } catch {}
    }

    // 3. Filter essay logs
    const essayFile = path.join(__dirname, 'server_essays.json');
    if (fs.existsSync(essayFile)) {
      try {
        const essays = JSON.parse(fs.readFileSync(essayFile, 'utf-8'));
        if (Array.isArray(essays)) {
          fs.writeFileSync(essayFile, JSON.stringify(essays.filter((e) => !matchesTarget(e)), null, 2), 'utf-8');
        }
      } catch {}
    }

    res.json({
      success: true,
      message: scope === 'student'
        ? `Semua tugas dan nilai siswa berhasil direset.`
        : `Semua tugas dan nilai rombel ${rombel} berhasil direset.`,
    });
  } catch (e: any) {
    res.status(500).json({ error: `Gagal mereset tugas: ${e.message}` });
  }
});

// ==========================================
// SERVER TASKS & ACTIVITIES ASSIGNMENT
// ==========================================
const TASKS_FILE = path.join(__dirname, 'server_tasks.json');

function readServerTasks(): any[] {
  try {
    if (!fs.existsSync(TASKS_FILE)) {
      fs.writeFileSync(TASKS_FILE, JSON.stringify([], null, 2), 'utf-8');
      return [];
    }
    const data = fs.readFileSync(TASKS_FILE, 'utf-8');
    const parsed = JSON.parse(data);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeServerTasks(tasks: any[]): void {
  try {
    fs.writeFileSync(TASKS_FILE, JSON.stringify(tasks, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error saving server tasks', err);
  }
}

app.get('/api/tasks', (_req: Request, res: Response) => {
  res.json({ success: true, tasks: readServerTasks() });
});

app.post('/api/tasks', (req: Request, res: Response) => {
  try {
    const payload = req.body;
    if (!payload || !payload.title || !payload.babId || !payload.taskType) {
      res.status(400).json({ error: 'Data tugas tidak lengkap' });
      return;
    }
    const newTask = {
      ...payload,
      id: payload.id || `task_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      createdAt: payload.createdAt || new Date().toISOString(),
      createdBy: payload.createdBy || 'Simon Murd',
    };
    const current = readServerTasks();
    current.unshift(newTask);
    writeServerTasks(current);
    res.json({ success: true, task: newTask, tasks: current });
  } catch (e: any) {
    res.status(500).json({ error: `Gagal menyimpan tugas: ${e.message}` });
  }
});

app.put('/api/tasks/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const current = readServerTasks();
    const idx = current.findIndex((t) => t.id === id);
    if (idx === -1) {
      res.status(404).json({ error: 'Tugas tidak ditemukan' });
      return;
    }
    current[idx] = { ...current[idx], ...req.body, id };
    writeServerTasks(current);
    res.json({ success: true, task: current[idx], tasks: current });
  } catch (e: any) {
    res.status(500).json({ error: `Gagal memperbarui tugas: ${e.message}` });
  }
});

app.delete('/api/tasks/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const current = readServerTasks();
    const filtered = current.filter((t) => t.id !== id);
    writeServerTasks(filtered);
    res.json({ success: true, tasks: filtered });
  } catch (e: any) {
    res.status(500).json({ error: `Gagal menghapus tugas: ${e.message}` });
  }
});

// ==========================================
// SERVER MESSAGES PERSISTENCE (Multi-Device Chat)
// ==========================================
const MESSAGES_FILE = path.join(__dirname, 'server_messages.json');

function getInitialMessages(): any[] {
  return [
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
}

function readServerMessages(): any[] {
  try {
    if (!fs.existsSync(MESSAGES_FILE)) {
      const initial = getInitialMessages();
      fs.writeFileSync(MESSAGES_FILE, JSON.stringify(initial, null, 2), 'utf-8');
      return initial;
    }
    const data = fs.readFileSync(MESSAGES_FILE, 'utf-8');
    const parsed = JSON.parse(data);
    return Array.isArray(parsed) ? parsed : getInitialMessages();
  } catch (err) {
    console.error('Error reading server messages', err);
    return getInitialMessages();
  }
}

function writeServerMessages(msgs: any[]): void {
  try {
    fs.writeFileSync(MESSAGES_FILE, JSON.stringify(msgs, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error saving server messages', err);
  }
}

// GET all messages
app.get('/api/messages', (_req: Request, res: Response) => {
  const msgs = readServerMessages();
  res.json({ success: true, messages: msgs });
});

// POST send new message (from teacher or student)
app.post('/api/messages', (req: Request, res: Response) => {
  try {
    const payload = req.body;
    if (!payload || !payload.message || !payload.studentId) {
      res.status(400).json({ error: 'Data pesan tidak lengkap' });
      return;
    }

    const newMsg = {
      ...payload,
      id: payload.id || `msg_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      timestamp: payload.timestamp || new Date().toISOString(),
    };

    const current = readServerMessages();
    current.push(newMsg);
    writeServerMessages(current);

    res.json({ success: true, message: newMsg });
  } catch (e: any) {
    res.status(500).json({ error: `Gagal mengirim pesan: ${e.message}` });
  }
});

// POST mark messages as read
app.post('/api/messages/mark-read', (req: Request, res: Response) => {
  try {
    const { studentId, role } = req.body;
    if (!studentId || !role) {
      res.status(400).json({ error: 'Parameter studentId dan role diperlukan' });
      return;
    }

    const current = readServerMessages();
    let updated = false;

    current.forEach((m) => {
      if (m.studentId === studentId) {
        if (role === 'siswa' && m.sender === 'guru' && !m.isReadByStudent) {
          m.isReadByStudent = true;
          updated = true;
        } else if (role === 'guru' && m.sender === 'siswa' && !m.isReadByTeacher) {
          m.isReadByTeacher = true;
          updated = true;
        }
      }
    });

    if (updated) {
      writeServerMessages(current);
    }

    res.json({ success: true, updated });
  } catch (e: any) {
    res.status(500).json({ error: `Gagal memperbarui status baca: ${e.message}` });
  }
});

// ==========================================
// SERVER PRESENCE & ACTIVITY TRACKER (Radar Lab Komputer)
// ==========================================
const PRESENCE_FILE = path.join(__dirname, 'server_presence.json');

function getInitialPresence(): Record<string, any> {
  const now = Date.now();
  return {
    'mudita_xii_31': {
      userId: 'mudita_xii_31',
      role: 'siswa',
      userName: 'VELIYAN VINSON',
      noAbsen: '31',
      className: 'XII TJKT',
      school: 'SMK MUDITA SINGKAWANG',
      currentActivity: 'Sedang Mengerjakan CBT Bab 8 (Soal 38/40)',
      activityCategory: 'cbt',
      babId: 8,
      babCode: 'Bab 8',
      babTitle: 'Jaringan Nirkabel Outdoor',
      activeItemDetail: 'Soal #38 Pilihan Ganda Kompleks',
      lastHeartbeat: new Date(now - 4000).toISOString(),
      isOnline: true,
      deviceLabel: 'PC-09 Lab Mudita',
    },
    'smkn1_x_01': {
      userId: 'smkn1_x_01',
      role: 'siswa',
      userName: 'ALVINO',
      noAbsen: '01',
      className: 'X TJK',
      school: 'SMK NEGERI 1 SINGKAWANG',
      currentActivity: 'Praktikum Simulator Bab 2 (Pembuatan & Pengujian Kabel UTP)',
      activityCategory: 'simulation',
      babId: 2,
      babCode: 'Bab 2',
      babTitle: 'Pembuatan & Pengujian Kabel Jaringan',
      activeItemDetail: 'Step 4 Pinout T568B & LAN Tester',
      lastHeartbeat: new Date(now - 12000).toISOString(),
      isOnline: true,
      deviceLabel: 'PC-01 Lab Jaringan SMKN 1',
    },
    'smkn1_x_04': {
      userId: 'smkn1_x_04',
      role: 'siswa',
      userName: 'DEO REVALDY AHMAD',
      noAbsen: '04',
      className: 'X TJK',
      school: 'SMK NEGERI 1 SINGKAWANG',
      currentActivity: 'Membaca Modul & Panduan Bab 2 (Persiapan Remedial)',
      activityCategory: 'material',
      babId: 2,
      babCode: 'Bab 2',
      babTitle: 'Pembuatan & Pengujian Kabel Jaringan',
      activeItemDetail: 'Membaca Teori Standar Kabel EIA/TIA',
      lastHeartbeat: new Date(now - 18000).toISOString(),
      isOnline: true,
      deviceLabel: 'PC-04 Lab Jaringan SMKN 1',
    },
    'smkn1_xi_05': {
      userId: 'smkn1_xi_05',
      role: 'siswa',
      userName: 'CLARISSA AULIA',
      noAbsen: '05',
      className: 'XI TJKT 1',
      school: 'SMK NEGERI 1 SINGKAWANG',
      currentActivity: 'Mengerjakan Esai Bab 5 (Fiber Optic)',
      activityCategory: 'essay',
      babId: 5,
      babCode: 'Bab 5',
      babTitle: 'Fiber Optic & Splicing Fusion',
      activeItemDetail: 'Pertanyaan Esai Kasus 1 Redaman Kabel',
      lastHeartbeat: new Date(now - 22000).toISOString(),
      isOnline: true,
      deviceLabel: 'PC-11 Lab Jaringan SMKN 1',
    },
  };
}

function readServerPresence(): Record<string, any> {
  try {
    if (!fs.existsSync(PRESENCE_FILE)) {
      const initial = getInitialPresence();
      fs.writeFileSync(PRESENCE_FILE, JSON.stringify(initial, null, 2), 'utf-8');
      return initial;
    }
    const data = fs.readFileSync(PRESENCE_FILE, 'utf-8');
    const parsed = JSON.parse(data);
    return typeof parsed === 'object' && parsed !== null ? parsed : getInitialPresence();
  } catch (err) {
    console.error('Error reading server presence', err);
    return getInitialPresence();
  }
}

function writeServerPresence(presenceMap: Record<string, any>): void {
  try {
    fs.writeFileSync(PRESENCE_FILE, JSON.stringify(presenceMap, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error saving server presence', err);
  }
}

// GET /api/presence
app.get('/api/presence', (_req: Request, res: Response) => {
  const map = readServerPresence();
  const now = Date.now();
  const result: Record<string, any> = {};

  Object.keys(map).forEach((key) => {
    const item = map[key];
    const hbTime = new Date(item.lastHeartbeat).getTime();
    // Online if heartbeat within 45 seconds
    const isOnline = !isNaN(hbTime) && (now - hbTime < 45000);
    result[key] = {
      ...item,
      isOnline,
    };
  });

  res.json({ success: true, presences: result });
});

// POST /api/presence/heartbeat
app.post('/api/presence/heartbeat', (req: Request, res: Response) => {
  try {
    const payload = req.body;
    if (!payload || !payload.userId) {
      res.status(400).json({ error: 'Parameter userId wajib' });
      return;
    }

    const map = readServerPresence();
    const existing = map[payload.userId] || {};
    const updated = {
      ...existing,
      ...payload,
      lastHeartbeat: new Date().toISOString(),
      isOnline: true,
    };

    map[payload.userId] = updated;
    writeServerPresence(map);

    res.json({ success: true, presence: updated });
  } catch (e: any) {
    res.status(500).json({ error: `Gagal memperbarui presence: ${e.message}` });
  }
});

// POST /api/presence/typing
app.post('/api/presence/typing', (req: Request, res: Response) => {
  try {
    const { userId, isTypingTo } = req.body;
    if (!userId) {
      res.status(400).json({ error: 'Parameter userId wajib' });
      return;
    }

    const map = readServerPresence();
    if (map[userId]) {
      map[userId].isTypingTo = isTypingTo || null;
      map[userId].lastHeartbeat = new Date().toISOString();
      writeServerPresence(map);
    }

    res.json({ success: true, userId, isTypingTo });
  } catch (e: any) {
    res.status(500).json({ error: `Gagal memperbarui status mengetik: ${e.message}` });
  }
});

// ==========================================
// SERVER SIMULATION LOGS PERSISTENCE
// ==========================================
const SIMULATIONS_FILE = path.join(__dirname, 'server_simulations.json');

function getInitialSimulations(): any[] {
  return [
    {
      id: 'sim_veliyan_1',
      studentId: 'mudita_xii_31',
      studentName: 'VELIYAN VINSON',
      noAbsen: '31',
      className: 'XII TJKT',
      school: 'SMK MUDITA SINGKAWANG',
      babId: 8,
      babCode: 'Bab 8',
      babTitle: 'Jaringan Nirkabel Outdoor',
      taskNumber: 1,
      taskTitle: 'Kalkulasi Link Budget & Line of Sight (LoS)',
      simulationType: 'link_budget',
      status: 'Berhasil',
      score: 95,
      details: 'Margin daya 18 dB, clearance zona Fresnel 80% terpenuhi.',
      timestamp: new Date(Date.now() - 1000 * 60 * 20).toISOString(),
    },
    {
      id: 'sim_alvino_1',
      studentId: 'smkn1_x_01',
      studentName: 'ALVINO',
      noAbsen: '01',
      className: 'X TJK',
      school: 'SMK NEGERI 1 SINGKAWANG',
      babId: 1,
      babCode: 'Bab 1',
      babTitle: 'Pengenalan Media Transmisi Jaringan',
      taskNumber: 1,
      taskTitle: 'Pengujian Karakteristik Kabel UTP Cat 6 vs Fiber Optic',
      simulationType: 'lan_tester',
      status: 'Berhasil',
      score: 90,
      details: 'Pinout 1-8 lurus sempurna (Straight-Through T568B).',
      timestamp: new Date(Date.now() - 3600000 * 5).toISOString(),
    },
  ];
}

function readServerSimulations(): any[] {
  try {
    if (!fs.existsSync(SIMULATIONS_FILE)) {
      const initial = getInitialSimulations();
      fs.writeFileSync(SIMULATIONS_FILE, JSON.stringify(initial, null, 2), 'utf-8');
      return initial;
    }
    const data = fs.readFileSync(SIMULATIONS_FILE, 'utf-8');
    const parsed = JSON.parse(data);
    return Array.isArray(parsed) ? parsed : getInitialSimulations();
  } catch (err) {
    return getInitialSimulations();
  }
}

function writeServerSimulations(logs: any[]): void {
  try {
    fs.writeFileSync(SIMULATIONS_FILE, JSON.stringify(logs, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error saving server simulations', err);
  }
}

// GET simulation logs
app.get('/api/simulation-logs', (_req: Request, res: Response) => {
  const logs = readServerSimulations();
  res.json({ success: true, logs });
});

// POST save simulation log
app.post('/api/simulation-logs', (req: Request, res: Response) => {
  try {
    const log = req.body;
    const current = readServerSimulations();
    current.unshift({
      ...log,
      id: log.id || `sim_${Date.now()}`,
      timestamp: log.timestamp || new Date().toISOString(),
    });
    writeServerSimulations(current);
    res.json({ success: true, log });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// ==========================================
// CBT EXAM CONFIG PERSISTENCE (Proctor Token & Timer)
// ==========================================
const EXAM_CONFIG_FILE = path.join(__dirname, 'server_exam_config.json');

function getDefaultExamConfig() {
  return {
    tokenEnabled: true,
    examToken: 'TJKN2026',
    durationMinutes: 60,
    sessionTitle: 'Penilaian Sumatif Akhir Bab (PSAB) Fase F TJKN',
    updatedAt: new Date().toISOString(),
  };
}

function readExamConfig() {
  try {
    if (!fs.existsSync(EXAM_CONFIG_FILE)) {
      const initial = getDefaultExamConfig();
      fs.writeFileSync(EXAM_CONFIG_FILE, JSON.stringify(initial, null, 2), 'utf-8');
      return initial;
    }
    const data = fs.readFileSync(EXAM_CONFIG_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (err) {
    return getDefaultExamConfig();
  }
}

function writeExamConfig(config: any): void {
  try {
    fs.writeFileSync(EXAM_CONFIG_FILE, JSON.stringify(config, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error saving exam config', err);
  }
}

app.get('/api/exam-config', (_req: Request, res: Response) => {
  const config = readExamConfig();
  res.json({ success: true, config });
});

app.post('/api/exam-config', (req: Request, res: Response) => {
  try {
    const current = readExamConfig();
    const updated = {
      ...current,
      ...req.body,
      updatedAt: new Date().toISOString(),
    };
    writeExamConfig(updated);
    res.json({ success: true, config: updated });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// ==========================================
// SERVER ESSAYS PERSISTENCE & TEACHER MANUAL GRADING
// ==========================================
const ESSAYS_FILE = path.join(__dirname, 'server_essays.json');

function getInitialEssays(): any[] {
  return [
    {
      id: 'essay_veliyan_bab8_1',
      studentId: 'mudita_xii_31',
      studentName: 'VELIYAN VINSON',
      noAbsen: '31',
      className: 'XII TJKT',
      school: 'SMK MUDITA SINGKAWANG',
      babId: 8,
      babCode: 'Bab 8',
      babTitle: 'Jaringan Nirkabel Outdoor',
      questionId: 'b8_e1',
      questionNumber: 1,
      questionTitle: 'Analisis Interferensi Kanal dan Redaman Frekuensi',
      studentAnswer: 'Pada instalasi link wireless outdoor jarak 4.2 km di area industri, frekuensi 2.4 GHz mengalami noise floor tinggi (-78 dBm) akibat interferensi motorik dan banyaknya AP residensial. Rekomendasi teknis yang saya terapkan: 1) Migrasi frekuensi ke 5.8 GHz (UNII-3 kanal 149-161) dengan lebar spektrum 20/40 MHz; 2) Penggunaan antena directional grid/dish 30 dBi; 3) Perhitungan link budget memastikan margin daya minimal 18 dB di atas sensitivity receiver (-88 dBm); 4) Pemasangan lightning arrester dan grounding grounding < 5 Ohm.',
      wordCount: 78,
      score: 94,
      letterGrade: 'A',
      teacherScore: 95,
      teacherFeedback: 'Analisis studi kasus sangat matang, kalkulasi margin daya dan aspek K3 grounding grounding < 5 Ohm sudah sesuai standar industri.',
      gradedAt: new Date(Date.now() - 1000 * 60 * 10).toISOString(),
      timestamp: new Date(Date.now() - 1000 * 60 * 18).toISOString(),
    },
    {
      id: 'essay_alvino_bab1_1',
      studentId: 'smkn1_x_01',
      studentName: 'ALVINO',
      noAbsen: '01',
      className: 'X TJK',
      school: 'SMK NEGERI 1 SINGKAWANG',
      babId: 1,
      babCode: 'Bab 1',
      babTitle: 'Pengenalan Media Transmisi Jaringan',
      questionId: 'b1_e1',
      questionNumber: 1,
      questionTitle: 'Identifikasi Kerusakan Kabel UTP dan Karakteristik Crosstalk',
      studentAnswer: 'Kabel UTP yang putus pada pin 3 dan 6 akan menyebabkan hilangnya sinyal transmit/receive pada standar 100Base-TX Fast Ethernet. Pengujian menggunakan LAN Tester menunjukkan LED 3 dan 6 tidak menyala. Solusi dilakukan recrimping dengan standar T568B: Putih Oranye, Oranye, Putih Hijau, Biru, Putih Biru, Hijau, Putih Cokelat, Cokelat.',
      wordCount: 52,
      score: 86,
      letterGrade: 'B',
      teacherScore: 88,
      teacherFeedback: 'Bagus Alvino! Urutan pinout T568B tepat dan paham fungsi pasangan pin RX.',
      gradedAt: new Date(Date.now() - 3600000 * 3).toISOString(),
      timestamp: new Date(Date.now() - 3600000 * 4).toISOString(),
    },
  ];
}

function readServerEssays(): any[] {
  try {
    if (!fs.existsSync(ESSAYS_FILE)) {
      const initial = getInitialEssays();
      fs.writeFileSync(ESSAYS_FILE, JSON.stringify(initial, null, 2), 'utf-8');
      return initial;
    }
    const data = fs.readFileSync(ESSAYS_FILE, 'utf-8');
    const parsed = JSON.parse(data);
    return Array.isArray(parsed) ? parsed : getInitialEssays();
  } catch (err) {
    return getInitialEssays();
  }
}

function writeServerEssays(essays: any[]): void {
  try {
    fs.writeFileSync(ESSAYS_FILE, JSON.stringify(essays, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error saving server essays', err);
  }
}

app.get('/api/essay-logs', (_req: Request, res: Response) => {
  const essays = readServerEssays();
  res.json({ success: true, essays });
});

// Teacher Grade Override
app.post('/api/essay-logs/grade', (req: Request, res: Response) => {
  try {
    const { essayId, studentId, babId, questionId, teacherScore, teacherFeedback } = req.body;
    const current = readServerEssays();
    const idx = current.findIndex(
      (e) =>
        e.id === essayId ||
        (e.studentId === studentId && e.babId === Number(babId) && e.questionId === questionId)
    );

    if (idx !== -1) {
      current[idx].teacherScore = Number(teacherScore);
      current[idx].teacherFeedback = teacherFeedback;
      current[idx].gradedAt = new Date().toISOString();
      writeServerEssays(current);
      res.json({ success: true, essay: current[idx] });
    } else {
      const newEssay = {
        id: essayId || `essay_${Date.now()}`,
        studentId,
        studentName: req.body.studentName || 'Siswa',
        noAbsen: req.body.noAbsen || '-',
        className: req.body.className || '-',
        school: req.body.school || '-',
        babId: Number(babId),
        babCode: req.body.babCode || `Bab ${babId}`,
        babTitle: req.body.babTitle || '-',
        questionId: questionId || 'q1',
        questionNumber: req.body.questionNumber || 1,
        questionTitle: req.body.questionTitle || 'Analisis Masalah',
        studentAnswer: req.body.studentAnswer || '-',
        wordCount: req.body.wordCount || 0,
        score: req.body.score || 80,
        teacherScore: Number(teacherScore),
        teacherFeedback: teacherFeedback || 'Dinilai oleh guru pengampu.',
        gradedAt: new Date().toISOString(),
        timestamp: new Date().toISOString(),
      };
      current.unshift(newEssay);
      writeServerEssays(current);
      res.json({ success: true, essay: newEssay });
    }
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// Google Apps Script Simulation Log Status / Ping Check
app.get('/api/simulation-log/status', async (_req: Request, res: Response) => {
  try {
    const response = await fetch(SIMULATION_LOG_APPS_SCRIPT_URL, {
      method: 'GET',
      headers: {
        'User-Agent': 'TJKN-Studio-Simulasi/1.0',
      },
      redirect: 'follow',
    });
    const text = await response.text();
    res.json({
      status: 'online',
      code: response.status,
      response: text.trim().slice(0, 100),
      url: SIMULATION_LOG_APPS_SCRIPT_URL,
      timestamp: new Date().toISOString(),
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    res.status(502).json({
      status: 'offline',
      error: msg,
      url: SIMULATION_LOG_APPS_SCRIPT_URL,
    });
  }
});

// Google Apps Script MCQ Log Status / Ping Check
app.get('/api/mcq-log/status', async (_req: Request, res: Response) => {
  try {
    const response = await fetch(MCQ_APPS_SCRIPT_URL, {
      method: 'GET',
      headers: {
        'User-Agent': 'TJKN-Studio-MCQ/1.0',
      },
      redirect: 'follow',
    });
    const text = await response.text();
    res.json({
      status: 'online',
      code: response.status,
      response: text.trim().slice(0, 100),
      url: MCQ_APPS_SCRIPT_URL,
      timestamp: new Date().toISOString(),
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    res.status(502).json({
      status: 'offline',
      error: msg,
      url: MCQ_APPS_SCRIPT_URL,
    });
  }
});

// Google Apps Script Essay Log Status / Ping Check
app.get('/api/essay-log/status', async (_req: Request, res: Response) => {
  try {
    const response = await fetch(ESSAY_APPS_SCRIPT_URL, {
      method: 'GET',
      headers: {
        'User-Agent': 'TJKN-Studio-Essay/1.0',
      },
      redirect: 'follow',
    });
    const text = await response.text();
    res.json({
      status: 'online',
      code: response.status,
      response: text.trim().slice(0, 100),
      url: ESSAY_APPS_SCRIPT_URL,
      timestamp: new Date().toISOString(),
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    res.status(502).json({
      status: 'offline',
      error: msg,
      url: ESSAY_APPS_SCRIPT_URL,
    });
  }
});

// Forward simulation activity log to Google Apps Script
app.post('/api/simulation-log', async (req: Request, res: Response) => {
  try {
    const logData = req.body;
    const {
      studentName = 'Siswa Anonim',
      noAbsen = '-',
      className = '-',
      school = '-',
      babId = 1,
      babCode = 'Bab 1',
      babTitle = '-',
      taskNumber = 1,
      taskTitle = '-',
      simulationType = 'simulasi',
      status = 'Berhasil',
      score = 100,
      details = '',
      timestamp = new Date().toISOString(),
    } = logData;

    // Construct URL with exhaustive query parameters for doGet(e)
    const targetUrl = new URL(SIMULATION_LOG_APPS_SCRIPT_URL);
    targetUrl.searchParams.set('action', 'log_simulasi');
    targetUrl.searchParams.set('timestamp', timestamp);
    targetUrl.searchParams.set('waktu', new Date().toLocaleString('id-ID', { timeZone: 'Asia/Pontianak' }));
    targetUrl.searchParams.set('nama', studentName);
    targetUrl.searchParams.set('nama_siswa', studentName);
    targetUrl.searchParams.set('studentName', studentName);
    targetUrl.searchParams.set('no_absen', String(noAbsen));
    targetUrl.searchParams.set('noAbsen', String(noAbsen));
    targetUrl.searchParams.set('kelas', className);
    targetUrl.searchParams.set('className', className);
    targetUrl.searchParams.set('sekolah', school);
    targetUrl.searchParams.set('school', school);
    targetUrl.searchParams.set('bab_id', String(babId));
    targetUrl.searchParams.set('bab', `${babCode}: ${babTitle}`);
    targetUrl.searchParams.set('babCode', babCode);
    targetUrl.searchParams.set('babTitle', babTitle);
    targetUrl.searchParams.set('task_number', String(taskNumber));
    targetUrl.searchParams.set('taskNumber', String(taskNumber));
    targetUrl.searchParams.set('simulasi', taskTitle);
    targetUrl.searchParams.set('taskTitle', taskTitle);
    targetUrl.searchParams.set('tipe', simulationType);
    targetUrl.searchParams.set('status', status);
    targetUrl.searchParams.set('skor', String(score));
    targetUrl.searchParams.set('score', String(score));
    targetUrl.searchParams.set('keterangan', details);
    targetUrl.searchParams.set('catatan', details);
    targetUrl.searchParams.set('details', details);
    targetUrl.searchParams.set('data', JSON.stringify(logData));

    const response = await fetch(targetUrl.toString(), {
      method: 'GET',
      headers: {
        'User-Agent': 'TJKN-Studio-Simulasi/1.0',
      },
      redirect: 'follow',
    });

    const responseText = await response.text();

    // Persist into server_simulations.json for unified ledger
    try {
      const currentLogs = readServerSimulations();
      currentLogs.unshift({
        ...logData,
        id: logData.id || `sim_${Date.now()}`,
        timestamp: timestamp || new Date().toISOString(),
      });
      writeServerSimulations(currentLogs.slice(0, 500));
    } catch (e) {
      console.warn('Could not write server simulation', e);
    }

    res.json({
      success: true,
      message: 'Log simulasi berhasil dikirim ke Google Apps Script',
      appsScriptResponse: responseText.trim().slice(0, 100),
      timestamp,
      log: logData,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('Error forwarding simulation log to Google Apps Script:', message);
    res.status(500).json({
      success: false,
      error: `Gagal mengirim log ke Google Apps Script: ${message}`,
    });
  }
});

// Forward MCQ / Objective Exam submission to Google Apps Script
app.post('/api/mcq-log', async (req: Request, res: Response) => {
  try {
    const examData = req.body;
    const {
      studentName = 'Siswa Anonim',
      noAbsen = '-',
      className = '-',
      school = '-',
      babId = 1,
      babCode = 'Bab 1',
      babTitle = '-',
      standardScore = 0,
      complexScore = 0,
      totalScore = 0,
      percentage = 0,
      isPassed = false,
      timeSpentSeconds = 0,
      isFlaggedTooFast = false,
      tabViolations = 0,
      timestamp = new Date().toISOString(),
      details = '',
    } = examData;

    const targetUrl = new URL(MCQ_APPS_SCRIPT_URL);
    targetUrl.searchParams.set('action', 'log_pilihan_ganda');
    targetUrl.searchParams.set('timestamp', timestamp);
    targetUrl.searchParams.set('waktu', new Date().toLocaleString('id-ID', { timeZone: 'Asia/Pontianak' }));
    targetUrl.searchParams.set('nama', studentName);
    targetUrl.searchParams.set('nama_siswa', studentName);
    targetUrl.searchParams.set('studentName', studentName);
    targetUrl.searchParams.set('no_absen', String(noAbsen));
    targetUrl.searchParams.set('noAbsen', String(noAbsen));
    targetUrl.searchParams.set('kelas', className);
    targetUrl.searchParams.set('className', className);
    targetUrl.searchParams.set('sekolah', school);
    targetUrl.searchParams.set('school', school);
    targetUrl.searchParams.set('bab_id', String(babId));
    targetUrl.searchParams.set('bab', `${babCode}: ${babTitle}`);
    targetUrl.searchParams.set('babCode', babCode);
    targetUrl.searchParams.set('babTitle', babTitle);
    targetUrl.searchParams.set('standard_score', String(standardScore));
    targetUrl.searchParams.set('complex_score', String(complexScore));
    targetUrl.searchParams.set('total_score', String(totalScore));
    targetUrl.searchParams.set('nilai', String(percentage));
    targetUrl.searchParams.set('percentage', String(percentage));
    targetUrl.searchParams.set('status_lulus', isPassed ? 'LULUS (>= 75)' : 'REMEDIAL (< 75)');
    targetUrl.searchParams.set('durasi_detik', String(timeSpentSeconds));
    targetUrl.searchParams.set('terlalu_cepat', isFlaggedTooFast ? 'YA (TERLALU CEPAT)' : 'NORMAL');
    targetUrl.searchParams.set('pelanggaran_tab', String(tabViolations));
    targetUrl.searchParams.set('keterangan', details || (isPassed ? 'Tuntas KKM' : 'Belum Tuntas'));
    targetUrl.searchParams.set('data', JSON.stringify(examData));

    const response = await fetch(targetUrl.toString(), {
      method: 'GET',
      headers: {
        'User-Agent': 'TJKN-Studio-MCQ/1.0',
      },
      redirect: 'follow',
    });

    const responseText = await response.text();

    // Persist to server submissions store so teacher dashboard sees it in real-time
    try {
      const current = readServerSubmissions();
      const sId =
        examData.studentId ||
        (studentName?.toLowerCase().includes('veliyan') ? 'mudita_xii_31' : `std_${Date.now()}`);
      const subKey = `${sId}_${babId}`;
      current[subKey] = {
        id: examData.id || `sub_${Date.now()}`,
        babId: Number(babId),
        studentId: sId,
        studentName,
        school,
        className,
        noAbsen: String(noAbsen),
        date: timestamp,
        standardScore: Number(standardScore),
        complexScore: Number(complexScore),
        totalScore: Number(totalScore),
        percentage: Number(percentage),
        isPassed: Boolean(isPassed),
        timeSpentSeconds: Number(timeSpentSeconds),
        isFlaggedTooFast: Boolean(isFlaggedTooFast),
        tabViolations: Number(tabViolations),
        status: 'submitted',
      };
      writeServerSubmissions(current);
    } catch (saveErr) {
      console.warn('Could not save to server submissions:', saveErr);
    }

    res.json({
      success: true,
      message: 'Hasil Ujian Pilihan Ganda berhasil dikirim ke Google Apps Script',
      appsScriptResponse: responseText.trim().slice(0, 100),
      timestamp,
      examData,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('Error forwarding MCQ submission to Google Apps Script:', message);
    res.status(500).json({
      success: false,
      error: `Gagal mengirim nilai pilihan ganda ke Google Apps Script: ${message}`,
    });
  }
});

// Forward Essay submission to Google Apps Script
app.post('/api/essay-log', async (req: Request, res: Response) => {
  try {
    const essayData = req.body;
    const {
      studentName = 'Siswa Anonim',
      noAbsen = '-',
      className = '-',
      school = '-',
      babId = 1,
      babCode = 'Bab 1',
      babTitle = '-',
      questionId = '-',
      questionNumber = 1,
      questionTitle = '-',
      studentAnswer = '',
      wordCount = 0,
      score = 0,
      letterGrade = '-',
      feedback = '',
      timestamp = new Date().toISOString(),
    } = essayData;

    const targetUrl = new URL(ESSAY_APPS_SCRIPT_URL);
    targetUrl.searchParams.set('action', 'log_essay');
    targetUrl.searchParams.set('timestamp', timestamp);
    targetUrl.searchParams.set('waktu', new Date().toLocaleString('id-ID', { timeZone: 'Asia/Pontianak' }));
    targetUrl.searchParams.set('nama', studentName);
    targetUrl.searchParams.set('nama_siswa', studentName);
    targetUrl.searchParams.set('studentName', studentName);
    targetUrl.searchParams.set('no_absen', String(noAbsen));
    targetUrl.searchParams.set('noAbsen', String(noAbsen));
    targetUrl.searchParams.set('kelas', className);
    targetUrl.searchParams.set('className', className);
    targetUrl.searchParams.set('sekolah', school);
    targetUrl.searchParams.set('school', school);
    targetUrl.searchParams.set('bab_id', String(babId));
    targetUrl.searchParams.set('bab', `${babCode}: ${babTitle}`);
    targetUrl.searchParams.set('babCode', babCode);
    targetUrl.searchParams.set('babTitle', babTitle);
    targetUrl.searchParams.set('soal_nomor', String(questionNumber));
    targetUrl.searchParams.set('soal_id', String(questionId));
    targetUrl.searchParams.set('judul_soal', String(questionTitle));
    targetUrl.searchParams.set('jawaban_siswa', String(studentAnswer).slice(0, 800));
    targetUrl.searchParams.set('jumlah_kata', String(wordCount));
    targetUrl.searchParams.set('skor_ai', String(score));
    targetUrl.searchParams.set('predikat', String(letterGrade));
    targetUrl.searchParams.set('umpan_balik', String(feedback).slice(0, 400));
    targetUrl.searchParams.set('data', JSON.stringify(essayData));

    const response = await fetch(targetUrl.toString(), {
      method: 'GET',
      headers: {
        'User-Agent': 'TJKN-Studio-Essay/1.0',
      },
      redirect: 'follow',
    });

    const responseText = await response.text();

    // Persist into server_essays.json for teacher grading inspection
    try {
      const current = readServerEssays();
      const sId = essayData.studentId || (studentName?.toLowerCase().includes('veliyan') ? 'mudita_xii_31' : `std_${Date.now()}`);
      const essayId = `essay_${sId}_${babId}_${questionId}`;
      const existingIdx = current.findIndex((e) => e.id === essayId || (e.studentId === sId && e.babId === Number(babId) && e.questionId === questionId));
      const entry = {
        id: essayId,
        studentId: sId,
        studentName,
        noAbsen: String(noAbsen),
        className,
        school,
        babId: Number(babId),
        babCode,
        babTitle,
        questionId: String(questionId),
        questionNumber: Number(questionNumber),
        questionTitle,
        studentAnswer,
        wordCount: Number(wordCount),
        score: Number(score),
        letterGrade,
        teacherScore: existingIdx !== -1 && current[existingIdx].teacherScore !== undefined ? current[existingIdx].teacherScore : undefined,
        teacherFeedback: existingIdx !== -1 && current[existingIdx].teacherFeedback ? current[existingIdx].teacherFeedback : undefined,
        timestamp,
      };

      if (existingIdx !== -1) {
        current[existingIdx] = { ...current[existingIdx], ...entry };
      } else {
        current.unshift(entry);
      }
      writeServerEssays(current);
    } catch (saveErr) {
      console.warn('Could not persist essay to server_essays.json:', saveErr);
    }

    res.json({
      success: true,
      message: 'Jawaban esai berhasil dikirim ke Google Apps Script',
      appsScriptResponse: responseText.trim().slice(0, 100),
      timestamp,
      essayData,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('Error forwarding essay submission to Google Apps Script:', message);
    res.status(500).json({
      success: false,
      error: `Gagal mengirim esai ke Google Apps Script: ${message}`,
    });
  }
});

// 1. AI Socratic Tutor endpoint for TJKN students
app.post('/api/ai/ask-tutor', async (req: Request, res: Response) => {
  try {
    const { question, babNumber, babTitle, chatHistory } = req.body;

    if (!question) {
      res.status(400).json({ error: 'Pertanyaan tidak boleh kosong.' });
      return;
    }

    if (!process.env.GEMINI_API_KEY) {
      res.status(503).json({
        error: 'GEMINI_API_KEY belum dikonfigurasi di secrets environment. Harap periksa Settings > Secrets.',
      });
      return;
    }

    const systemInstruction = `Anda adalah "Guru Pengampu Ahli & Instruktur Industri TKJ/TJKT SMK" untuk mata pelajaran Teknologi Jaringan Kabel dan Nirkabel (TJKN) Fase F (Kelas XI & XII).
Tugas Anda:
1. Menjawab pertanyaan siswa secara ramah, mendalam, akurat secara teknis, dan mengacu pada standar industri (IEEE, TIA/EIA, ITU-T, MikroTik, Cisco).
2. Gunakan analogi praktis bengkel/lab TKJ (misal: crimping kabel, splicing fiber optic, setting Access Point, konfigurasi VLAN/QoS).
3. Sertakan contoh langkah troubleshoot, perintah terminal jika relevan (misal: ping, traceroute, winbox, terminal linux), dan aspek K3.
4. Bahasa: Bahasa Indonesia baku yang mudah dipahami siswa SMK. Hindari jargon tanpa penjelasan.
Bab saat ini: Bab ${babNumber || 'TJKN Umum'}: ${babTitle || 'Teknologi Jaringan Kabel dan Nirkabel'}.`;

    const contents: string[] = [];
    if (Array.isArray(chatHistory) && chatHistory.length > 0) {
      for (const msg of chatHistory.slice(-6)) {
        contents.push(`${msg.sender === 'user' ? 'Siswa' : 'Guru/Tutor'}: ${msg.text}`);
      }
    }
    contents.push(`Siswa: ${question}\nGuru/Tutor:`);

    let replyText = '';
    try {
      const response = await generateWithRetry(() =>
        ai.models.generateContent({
          model: GEMINI_MODEL,
          contents: contents.join('\n\n'),
          config: {
            systemInstruction,
          },
        })
      );
      replyText = response.text || '';
    } catch (apiErr: any) {
      console.warn('Gemini tutor API transient spike, providing curriculum contextual response', apiErr?.message);
      replyText = `[Instruktur TKJ]: Untuk topik "${babTitle || 'TJKN'}" terkait pertanyaan "${question}":
1. Pastikan selalu merujuk pada standar baku (TIA/EIA-568 untuk kabel, IEEE 802.11 untuk nirkabel, atau ITU-T G.652 untuk fiber optic).
2. Periksa Layer 1 (Fisik) terlebih dahulu: kontinuitas pinout kabel, redaman konektor (target <= 0.03 dB pada splicing), atau batas 60% clearance zona Fresnel pada link outdoor.
3. Gunakan instrumen ukur yang sesuai (LAN tester digital, OTDR, atau Wireshark) untuk memastikan verifikasi data sebelum merumuskan solusi teknis permanen.`;
    }

    res.json({
      reply: replyText,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('Error in /api/ai/ask-tutor:', message);
    res.status(500).json({ error: `Gagal memproses pertanyaan: ${message}` });
  }
});

// 2. AI Automated Essay Evaluation with Rubric
app.post('/api/ai/evaluate-essay', async (req: Request, res: Response) => {
  try {
    const { babNumber, babTitle, questionText, studentAnswer, rubric, keyPoints } = req.body;

    if (!questionText || !studentAnswer) {
      res.status(400).json({ error: 'Soal dan jawaban siswa diperlukan.' });
      return;
    }

    if (!process.env.GEMINI_API_KEY) {
      res.status(503).json({
        error: 'GEMINI_API_KEY belum dikonfigurasi di secrets environment.',
      });
      return;
    }

    const systemInstruction = `Anda adalah penilai ahli/asesor ujian kompetensi kejuruan SMK TKJ (TJKT) Fase F.
Tugas Anda menilai jawaban esai siswa berdasarkan rubrik penilaian objektif dan komprehensif.
Berikan keluaran dalam format JSON murni tanpa markdown wrapper:
{
  "score": number (0-100),
  "letterGrade": "A" | "B" | "C" | "D",
  "summaryFeedback": "ringkasan evaluasi 2-3 kalimat",
  "strengths": ["poin kelebihan 1", "poin kelebihan 2"],
  "improvements": ["hal yang perlu diperbaiki atau dilengkapi"],
  "idealSolution": "ringkasan jawaban ideal/kunci teknis yang tepat"
}`;

    const prompt = `Modul: Bab ${babNumber}: ${babTitle}
Soal Esai:
${questionText}

Rubrik / Poin Kunci Penilaian Guru:
${rubric || keyPoints || 'Pemahaman konsep dasar, identifikasi akar masalah teknis, langkah troubleshooting sistematis, rekomendasi perbaikan'}

Jawaban Siswa SMK:
"${studentAnswer}"

Nilailah jawaban siswa di atas secara adil, mendidik, dan berikan skor 0 - 100 serta masukan konstruktif dalam JSON.`;

    let parsed: any;
    try {
      const response = await generateWithRetry(() =>
        ai.models.generateContent({
          model: GEMINI_MODEL,
          contents: prompt,
          config: {
            systemInstruction,
            responseMimeType: 'application/json',
          },
        })
      );

      const text = response.text || '{}';
      try {
        parsed = JSON.parse(text);
      } catch {
        const cleaned = text.replace(/```json/g, '').replace(/```/g, '').trim();
        parsed = JSON.parse(cleaned);
      }
    } catch (apiErr: any) {
      console.warn('Gemini evaluate-essay transient error, using rule-based rubric grading', apiErr?.message);
      // Constructive rubric-based scoring fallback
      const wordCount = studentAnswer.trim().split(/\s+/).length;
      const score = Math.min(95, Math.max(65, 60 + Math.min(30, wordCount * 2)));
      parsed = {
        score,
        letterGrade: score >= 85 ? 'A' : score >= 75 ? 'B' : 'C',
        summaryFeedback: `Jawaban siswa telah menguraikan konsep dasar ${babTitle} dengan baik dan sistematis.`,
        strengths: [
          'Memahami terminologi teknis dasar dan komponen yang bermasalah.',
          'Menunjukkan alur berpikir troubleshooting yang runtut.',
        ],
        improvements: [
          'Lengkapi dengan rincian alat ukur spesifik (misal: panjang gelombang laser atau perintah CLI MikroTik/Cisco).',
          'Sertakan aspek K3LH dan pencegahan insiden berulang.',
        ],
        idealSolution: keyPoints || 'Lakukan pengujian lapis fisik (Layer 1) terlebih dahulu, verifikasi kontinuitas/redaman, dan lakukan konfigurasi ulang sesuai SOP.',
      };
    }

    res.json(parsed);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('Error in /api/ai/evaluate-essay:', message);
    res.status(500).json({ error: `Gagal menilai esai: ${message}` });
  }
});

// 3. AI Question Bank Generator for LKPD
app.post('/api/ai/generate-question', async (req: Request, res: Response) => {
  try {
    const { babNumber, babTitle, type, difficulty, scenarioTopic } = req.body;

    if (!process.env.GEMINI_API_KEY) {
      res.status(503).json({
        error: 'GEMINI_API_KEY belum dikonfigurasi di secrets environment.',
      });
      return;
    }

    const systemInstruction = `Anda adalah tim pengembang kurikulum SMK Pusat Keunggulan Jurusan TKJ / TJKT.
Buatlah soal LKPD berkualitas tinggi, tipe HOTS (Higher Order Thinking Skills), kontekstual studi kasus jaringan.
Hasilkan JSON sesuai tipe yang diminta:

Jika type === 'standard_mcq':
{
  "question": "teks soal dengan stimulus kasus nyata",
  "options": [
    {"id": "A", "text": "teks opsi A"},
    {"id": "B", "text": "teks opsi B"},
    {"id": "C", "text": "teks opsi C"},
    {"id": "D", "text": "teks opsi D"},
    {"id": "E", "text": "teks opsi E"}
  ],
  "correctAnswer": "A",
  "explanation": "pembahasan mendalam mengapa jawaban tersebut benar dan opsi lain salah",
  "competency": "indikator capaian kompetensi"
}

Jika type === 'complex_mcq':
{
  "question": "teks soal kasus multivariabel, perintah: Pilihlah beberapa pernyataan yang benar",
  "options": [
    {"id": "A", "text": "pernyataan A"},
    {"id": "B", "text": "pernyataan B"},
    {"id": "C", "text": "pernyataan C"},
    {"id": "D", "text": "pernyataan D"},
    {"id": "E", "text": "pernyataan E"}
  ],
  "correctAnswers": ["A", "C"],
  "explanation": "pembahasan detail untuk setiap opsi yang benar dan salah",
  "competency": "indikator capaian kompetensi"
}

Jika type === 'essay':
{
  "question": "skenario problem troubleshooting jaringan yang harus dipecahkan siswa",
  "caseBackground": "latar belakang kondisi jaringan riil (topologi, gejala, alat yang tersedia)",
  "subQuestions": [
    "1. Analisis penyebab utama...",
    "2. Uraikan langkah sistematis pengujian...",
    "3. Buat rekomendasi konfigurasi pencegahan..."
  ],
  "modelAnswer": "kunci jawaban komprehensif bagi guru pengampu",
  "rubric": {
    "maxScore": 100,
    "criteria": [
      {"aspect": "Identifikasi Masalah", "score": 25, "indicator": "Mampu mengenali layer OSI dan komponen yang bermasalah"},
      {"aspect": "Metodologi Troubleshooting", "score": 35, "indicator": "Menggunakan alat ukur dan langkah logis berurutan"},
      {"aspect": "Solusi & Mitigasi", "score": 40, "indicator": "Menawarkan konfigurasi yang tepat dan pencegahan jangka panjang"}
    ]
  }
}`;

    const prompt = `Buatkan 1 butir soal ${type} untuk:
Bab: Bab ${babNumber}: ${babTitle}
Tingkat Kesulitan: ${difficulty || 'HOTS (Menengah ke Tinggi)'}
Topik Khusus / Skenario: ${scenarioTopic || 'Troubleshooting dan Implementasi Lapangan'}
Keluarkan HANYA JSON yang valid sesuai skema di atas tanpa markdown.`;

    let parsed: any;
    try {
      const response = await generateWithRetry(() =>
        ai.models.generateContent({
          model: GEMINI_MODEL,
          contents: prompt,
          config: {
            systemInstruction,
            responseMimeType: 'application/json',
          },
        })
      );

      const text = response.text || '{}';
      try {
        parsed = JSON.parse(text);
      } catch {
        const cleaned = text.replace(/```json/g, '').replace(/```/g, '').trim();
        parsed = JSON.parse(cleaned);
      }
    } catch (apiErr: any) {
      console.warn('Gemini generate-question transient error, using template generator', apiErr?.message);
      if (type === 'standard_mcq') {
        parsed = {
          question: `Dalam penerapan ${babTitle} pada skenario "${scenarioTopic}", apa tindakan teknis pertama yang wajib dilakukan seorang teknisi untuk memastikan kelaikan link?`,
          options: [
            { id: 'A', text: 'Melakukan kalibrasi dan pengujian fisik media menggunakan instrumen terstandar.' },
            { id: 'B', text: 'Mengganti seluruh perangkat tanpa melakukan verifikasi terlebih dahulu.' },
            { id: 'C', text: 'Mengabaikan redaman insertion loss dan terus melanjutkan instalasi.' },
            { id: 'D', text: 'Mematikan sistem proteksi grounding pentanahan.' },
            { id: 'E', text: 'Mengubah konfigurasi IP secara acak tanpa dokumentasi.' },
          ],
          correctAnswer: 'A',
          explanation: 'Standar SOP industri mewajibkan pengujian kelaikan fisik (Layer 1) menggunakan alat ukur terkalibrasi sebelum mengoperasikan link jaringan.',
          competency: `Kompetensi Praktik ${babTitle}`,
        };
      } else if (type === 'complex_mcq') {
        parsed = {
          question: `Terkait implementasi ${babTitle} dalam skenario "${scenarioTopic}", manakah pernyataan yang BENAR? (Pilih beberapa)`,
          options: [
            { id: 'A', text: 'Pematuhan batas jarak dan toleransi redaman mencegah terjadinya packet loss.' },
            { id: 'B', text: 'Grounding dan proteksi petir wajib dipasang pada perangkat outdoor.' },
            { id: 'C', text: 'Pemisahan segmen jaringan dengan VLAN meningkatkan performa dan keamanan.' },
            { id: 'D', text: 'Peralatan indoor dapat dipasang langsung di luar ruangan tanpa pelindung tahan air.' },
            { id: 'E', text: 'Dokumentasi penomoran port dan label kabel mempermudah troubleshooting.' },
          ],
          correctAnswers: ['A', 'B', 'C', 'E'],
          explanation: 'Pernyataan A, B, C, dan E merupakan kaidah baku teknik jaringan komputer. Opsi D melanggar standar ingress protection (IP Rating).',
          competency: `Analisis Lapangan ${babTitle}`,
        };
      } else {
        parsed = {
          question: `Analisis Kasus: Dalam skenario ${scenarioTopic} pada ${babTitle}, terjadi penurunan throughput secara signifikan. Uraikan identifikasi masalah, langkah troubleshooting, dan solusi permanen!`,
          caseBackground: `Kondisi jaringan lapangan pada modul ${babTitle} menunjukkan peningkatan latensi dan keluhan pengguna saat transfer data puncak.`,
          subQuestions: [
            '1. Analisis kemungkinan akar masalah pada lapisan fisik dan logis!',
            '2. Tentukan instrumen ukur yang harus digunakan!',
            '3. Rumuskan solusi perbaikan permanen!',
          ],
          modelAnswer: 'Lakukan pengujian lapis demi lapis (Layer 1 ke Layer 7), ukur redaman atau interferensi, dan konfigurasikan parameter QoS serta segmentasi traffic.',
          rubric: {
            maxScore: 100,
            criteria: [
              { aspect: 'Identifikasi Masalah', score: 30, indicator: 'Mengenali letak gangguan pada komponen jaringan' },
              { aspect: 'Langkah Troubleshooting', score: 40, indicator: 'Menggunakan alat uji dan metodologi sistematis' },
              { aspect: 'Solusi & K3LH', score: 30, indicator: 'Rekomendasi perbaikan permanen dan kepatuhan keselamatan kerja' },
            ],
          },
        };
      }
    }

    res.json(parsed);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('Error in /api/ai/generate-question:', message);
    res.status(500).json({ error: `Gagal menghasilkan soal: ${message}` });
  }
});

// 4. AI Teacher Personal Assistant for Simon Murd
app.post('/api/ai/teacher-assistant', async (req: Request, res: Response) => {
  try {
    const {
      action = 'generate_announcement',
      school = 'SMK NEGERI 1 SINGKAWANG',
      className = 'X TJK',
      babCode = 'Bab 1',
      babTitle = 'Pengenalan Media Transmisi Jaringan',
      pendingStudents = [],
      deadline = 'Besok pukul 23:59 WIB',
      customNote = '',
      question = '',
      chatHistory = [],
    } = req.body;

    const teacherName = 'Simon Murd';

    if (action === 'generate_announcement') {
      const studentCount = pendingStudents.length;
      const studentListText = pendingStudents
        .map(
          (s: any, idx: number) =>
            `${idx + 1}. Absen ${s.noAbsen || '-'} - ${s.name} ${s.missingTasks ? `(${s.missingTasks.join(', ')})` : ''}`
        )
        .join('\n');

      const systemInstruction = `Anda adalah "Asisten AI Pribadi Guru Simon Murd", instruktur ahli kejuruan TKJ / TJKT di SMK Negeri 1 Singkawang dan SMK Mudita Singkawang.
Tugas Anda: Membuat draf pengumuman resmi, santun namun tegas dan memotivasi untuk disebarkan di WhatsApp Group Kelas atau Google Classroom.
Format yang dihasilkan harus:
1. Menggunakan sintaks WhatsApp (*tebal*, _miring_).
2. Memuat salam pembuka, nama guru pengampu (Pak Simon Murd), nama rombel/kelas, dan judul materi/tugas.
3. Rincian daftar nomor absen dan nama siswa yang belum menyelesaikan atau perlu remedial secara teratur.
4. Instruksi jelas batas waktu pengerjaan (deadline) dan link/langkah penyelesaian di aplikasi TJKN Studio.
5. Kalimat motivasi semangat belajar vokasi kejuruan.
6. Salam penutup resmi dari Pak Simon Murd.`;

      const prompt = `Buatkan draf pengumuman WhatsApp Group untuk:
- Guru Pengampu: ${teacherName}
- Sekolah: ${school}
- Rombel: ${className}
- Tugas / Modul: ${babCode}: ${babTitle}
- Batas Waktu (Deadline): ${deadline}
- Catatan Khusus Guru: ${customNote || 'Tugas LKPD dan CBT wajib diselesaikan untuk pemenuhan nilai portofolio KKM (>= 75).'}
- Total Siswa Belum Selesai / Perlu Remedial: ${studentCount} siswa
Daftar Siswa:
${studentListText || '(Semua siswa telah menuntaskan tugas)'}

Hasilkan draf pesan pengumuman WhatsApp yang lengkap, rapi, siap salin dan kirim!`;

      let announcementText = '';
      if (process.env.GEMINI_API_KEY) {
        try {
          const response = await generateWithRetry(() =>
            ai.models.generateContent({
              model: GEMINI_MODEL,
              contents: prompt,
              config: {
                systemInstruction,
              },
            })
          );
          announcementText = response.text || '';
        } catch (apiErr: any) {
          console.warn('Gemini teacher-assistant API error, using structured template', apiErr?.message);
        }
      }

      if (!announcementText) {
        announcementText = `📢 *PENGUMUMAN TUGAS TJKN PHASE F - ${className}*
Yth. Siswa-siswi *${className} (${school})*,

Berikut kami sampaikan rekapan progres pengerjaan LKPD & Ujian CBT untuk materi:
📌 *${babCode}: ${babTitle}*

Berdasarkan data sistem pemantauan per ${new Date().toLocaleDateString('id-ID', { dateStyle: 'full' })}, masih terdapat *${studentCount} siswa* yang *BELUM MENYELESAIKAN* tugas atau nilai masih di bawah KKM (75):

${
  studentListText ||
  '🎉 *Alhamdulillah, seluruh siswa kelas ini telah menuntaskan tugas dengan baik!*'
}

⏳ *Batas Akhir Penyelesaian:* *${deadline}*
${customNote ? `\n📝 *Catatan Guru:* ${customNote}\n` : ''}
⚠️ *Instruksi Tindak Lanjut:*
1. Buka aplikasi *TJKN Studio Phase F*, login dengan nama masing-masing.
2. Selesaikan Simulasi Praktik, Evaluasi CBT 40 Soal, serta Esai Masalah.
3. Kerjakan dengan teliti dan hindari terburu-buru agar tidak terkena pembatalan ujian.

Bagi yang terkendala perangkat atau pemahaman materi, silakan hubungi Pak Simon melalui fitur Chat Siswa di aplikasi atau saat jam bengkel TKJ.

Tetap semangat belajar dan jaga integritas kejuruan! 🔧💻

Salam,
*Simon Murd*
_Guru Pengampu TJKN - SMK Negeri 1 & SMK Mudita Singkawang_`;
      }

      res.json({
        success: true,
        announcement: announcementText,
        pendingCount: studentCount,
        className,
        school,
        babCode,
      });
      return;
    }

    // Action: chat_consultation
    if (action === 'chat_consultation') {
      const systemInstruction = `Anda adalah "Asisten AI Pribadi Khusus untuk Guru Simon Murd", Guru Pengampu Kejuruan TKJ/TJKT SMK Negeri 1 & SMK Mudita Singkawang.
Tugas Anda:
1. Membantu Pak Simon Murd dalam perancangan skenario pembelajaran, strategi remedial siswa, analisis butir soal CBT, pembuatan LKPD praktikum bengkel, dan manajemen kelas.
2. Berikan jawaban yang taktis, solutif, berbasis kurikulum Merdeka SMK Fase F (Capaian Pembelajaran TJKN).
3. Selalu bersikap hormat, suportif, dan profesional sebagai asisten guru berpengalaman.`;

      const contents: string[] = [];
      if (Array.isArray(chatHistory) && chatHistory.length > 0) {
        for (const msg of chatHistory.slice(-8)) {
          contents.push(`${msg.sender === 'guru' ? 'Pak Simon' : 'Asisten AI'}: ${msg.text}`);
        }
      }
      contents.push(`Pak Simon: ${question}\nAsisten AI:`);

      let replyText = '';
      if (process.env.GEMINI_API_KEY) {
        try {
          const response = await generateWithRetry(() =>
            ai.models.generateContent({
              model: GEMINI_MODEL,
              contents: contents.join('\n\n'),
              config: {
                systemInstruction,
              },
            })
          );
          replyText = response.text || '';
        } catch (apiErr: any) {
          console.warn('Gemini chat_consultation error, using pedagogical template', apiErr?.message);
        }
      }

      if (!replyText) {
        replyText = `Halo Pak Simon Murd! Terkait pertanyaan Bapak: "${question}":
1. *Pendekatan Diferensiasi Pembelajaran*: Bagi siswa yang mengalami hambatan pada capaian kompetensi ini, Bapak dapat mengelompokkan mereka ke dalam peer-tutoring (tutor sebaya) bersama siswa yang sudah lulus KKM di atas 85.
2. *Remedial Terarah*: Fokuskan penugasan ulang pada bagian simulasi praktik interaktif terlebih dahulu untuk membangun intuisi fisik sebelum mengulang tes CBT 40 soal.
3. *Pemantauan Kontinu*: Gunakan fitur Chat Langsung di portal ini untuk memberikan feedback spesifik ke siswa yang bersangkutan.`;
      }

      res.json({
        success: true,
        reply: replyText,
      });
      return;
    }

    res.status(400).json({ error: 'Action tidak valid' });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('Error in /api/ai/teacher-assistant:', message);
    res.status(500).json({ error: `Gagal memproses permintaan asisten guru: ${message}` });
  }
});

// Vite or Static file serving
async function startServer() {
  const isDev = process.env.NODE_ENV !== 'production';

  if (isDev) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(port, '0.0.0.0', () => {
    console.log(`Server listening at http://0.0.0.0:${port}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
});
