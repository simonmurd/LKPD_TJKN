import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getFirestore,
  doc,
  getDoc,
  getDocFromServer,
  setDoc,
  collection,
  getDocs,
  query,
  orderBy,
  onSnapshot,
  Timestamp,
  updateDoc,
  deleteDoc,
} from 'firebase/firestore';
import { getAuth, signInAnonymously } from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';
import {
  ExamSubmission,
  SimulationLogEntry,
  EssayLogEntry,
  DirectChatMessage,
  ExamConfig,
  StudentProfile,
  UserPresence,
} from '../types/curriculum';

// Initialize Firebase App
export const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Initialize Firestore with custom Database ID
export const db = getFirestore(
  app,
  firebaseConfig.firestoreDatabaseId || '(default)'
);

// Initialize Auth
export const auth = getAuth(app);

// Sign in anonymously on startup for secure rules validation
signInAnonymously(auth).catch((err) => {
  console.warn('Anonymous auth sign-in warning:', err);
});

// Test Connection constraint from Firebase Skill
async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firestore offline or pending initial network connection.');
    }
  }
}
testConnection();

// ==========================================
// FIRESTORE COLLECTIONS & DATA HELPERS
// ==========================================

// 1. SUBMISSIONS
export async function saveSubmissionToFirestore(submission: ExamSubmission): Promise<void> {
  try {
    const key = `${submission.studentId || 'std'}_${submission.babId}`;
    const docRef = doc(db, 'submissions', key);
    const cleanData = Object.fromEntries(
      Object.entries({
        ...submission,
        firestoreUpdatedAt: new Date().toISOString(),
      }).filter(([, v]) => v !== undefined)
    );
    await setDoc(docRef, cleanData, { merge: true });
  } catch (err) {
    console.error('Error saving submission to Firestore:', err);
  }
}

export async function fetchSubmissionsFromFirestore(): Promise<Record<string, ExamSubmission>> {
  try {
    const colRef = collection(db, 'submissions');
    const snapshot = await getDocs(colRef);
    const dummyIds = new Set([
      'sub_seed_1',
      'sub_seed_2',
      'sub_seed_3',
      'sub_veliyan_bab8',
      'sub_veliyan_bab1',
      'smkn1_x_01_1',
      'smkn1_x_04_2',
      'mudita_xi_01_5',
      'mudita_xii_31_8',
      'mudita_xii_31_1',
    ]);
    const results: Record<string, ExamSubmission> = {};
    snapshot.forEach((d) => {
      const data = d.data() as ExamSubmission;
      if (dummyIds.has(d.id) || (data && data.id && dummyIds.has(data.id))) {
        deleteDoc(d.ref).catch(() => {});
        return;
      }
      results[d.id] = data;
    });
    return results;
  } catch (err) {
    console.warn('Could not fetch submissions from Firestore, fallback to local/server', err);
    return {};
  }
}

// 2. SIMULATION LOGS
export async function saveSimulationLogToFirestore(log: SimulationLogEntry): Promise<void> {
  try {
    const docId = log.id || `sim_${Date.now()}`;
    const docRef = doc(db, 'simulationLogs', docId);
    const cleanData = Object.fromEntries(
      Object.entries({
        ...log,
        firestoreTimestamp: new Date().toISOString(),
      }).filter(([, v]) => v !== undefined)
    );
    await setDoc(docRef, cleanData, { merge: true });
  } catch (err) {
    console.error('Error saving simulation log to Firestore:', err);
  }
}

export async function fetchSimulationLogsFromFirestore(): Promise<SimulationLogEntry[]> {
  try {
    const colRef = collection(db, 'simulationLogs');
    const snapshot = await getDocs(colRef);
    const list: SimulationLogEntry[] = [];
    snapshot.forEach((d) => {
      const data = d.data() as SimulationLogEntry;
      if (data && data.id && (data.id.includes('seed') || data.id.includes('veliyan'))) {
        deleteDoc(d.ref).catch(() => {});
        return;
      }
      list.push(data);
    });
    return list.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  } catch (err) {
    console.warn('Could not fetch simulation logs from Firestore:', err);
    return [];
  }
}

// 3. ESSAY LOGS & TEACHER GRADING
export async function saveEssayLogToFirestore(essay: EssayLogEntry): Promise<void> {
  try {
    const docId = essay.id || `essay_${essay.studentId}_${essay.babId}_${essay.questionId}`;
    const docRef = doc(db, 'essayLogs', docId);
    const cleanData = Object.fromEntries(
      Object.entries({
        ...essay,
        firestoreTimestamp: new Date().toISOString(),
      }).filter(([, v]) => v !== undefined)
    );
    await setDoc(docRef, cleanData, { merge: true });
  } catch (err) {
    console.error('Error saving essay to Firestore:', err);
  }
}

export async function fetchEssayLogsFromFirestore(): Promise<EssayLogEntry[]> {
  try {
    const colRef = collection(db, 'essayLogs');
    const snapshot = await getDocs(colRef);
    const list: EssayLogEntry[] = [];
    snapshot.forEach((d) => {
      const data = d.data() as EssayLogEntry;
      if (data && data.id && (data.id.includes('seed') || data.id.includes('veliyan'))) {
        deleteDoc(d.ref).catch(() => {});
        return;
      }
      list.push(data);
    });
    return list.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  } catch (err) {
    console.warn('Could not fetch essay logs from Firestore:', err);
    return [];
  }
}

// 4. DIRECT CHAT MESSAGES (Real-Time Subscription)
export async function sendChatMessageToFirestore(msg: DirectChatMessage): Promise<void> {
  try {
    const docId = msg.id || `msg_${Date.now()}`;
    const docRef = doc(db, 'directMessages', docId);
    const cleanData = Object.fromEntries(
      Object.entries({
        ...msg,
        timestamp: msg.timestamp || new Date().toISOString(),
      }).filter(([, v]) => v !== undefined)
    );
    await setDoc(docRef, cleanData, { merge: true });
  } catch (err) {
    console.error('Error sending chat message to Firestore:', err);
  }
}

export function subscribeToChatMessagesFromFirestore(
  callback: (messages: DirectChatMessage[]) => void
): () => void {
  try {
    const colRef = collection(db, 'directMessages');
    return onSnapshot(
      colRef,
      (snapshot) => {
        const msgs: DirectChatMessage[] = [];
        snapshot.forEach((d) => {
          msgs.push(d.data() as DirectChatMessage);
        });
        msgs.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
        callback(msgs);
      },
      (err) => {
        console.warn('Firestore chat subscription notice:', err);
      }
    );
  } catch (err) {
    console.warn('Could not initiate Firestore chat subscription:', err);
    return () => {};
  }
}

// 5. EXAM CONFIG (Proctor Token & Duration)
export async function fetchExamConfigFromFirestore(): Promise<ExamConfig | null> {
  try {
    const docRef = doc(db, 'configs', 'examConfig');
    const snapshot = await getDoc(docRef);
    if (snapshot.exists()) {
      return snapshot.data() as ExamConfig;
    }
    return null;
  } catch (err) {
    console.warn('Could not fetch exam config from Firestore:', err);
    return null;
  }
}

export async function saveExamConfigToFirestore(config: ExamConfig): Promise<void> {
  try {
    const docRef = doc(db, 'configs', 'examConfig');
    const cleanData = Object.fromEntries(
      Object.entries({
        ...config,
        updatedAt: new Date().toISOString(),
      }).filter(([, v]) => v !== undefined)
    );
    await setDoc(docRef, cleanData, { merge: true });
  } catch (err) {
    console.error('Error saving exam config to Firestore:', err);
  }
}

// 6. REAL-TIME PRESENCE & ACTIVITY TRACKER (Radar Lab Komputer)
export async function savePresenceToFirestore(presence: UserPresence): Promise<void> {
  try {
    const docId = presence.userId.replace(/[^a-zA-Z0-9_-]/g, '_');
    const docRef = doc(db, 'presence', docId);
    const cleanData = Object.fromEntries(
      Object.entries({
        ...presence,
        lastHeartbeat: presence.lastHeartbeat || new Date().toISOString(),
      }).filter(([_, v]) => v !== undefined)
    );
    await setDoc(docRef, cleanData, { merge: true });
  } catch (err) {
    console.error('Error updating presence in Firestore:', err);
  }
}

export function subscribeToPresenceFromFirestore(
  callback: (presences: Record<string, UserPresence>) => void
): () => void {
  try {
    const colRef = collection(db, 'presence');
    return onSnapshot(
      colRef,
      (snapshot) => {
        const presences: Record<string, UserPresence> = {};
        const now = Date.now();
        snapshot.forEach((d) => {
          const item = d.data() as UserPresence;
          // Mark online if heartbeat within 45 seconds
          const heartbeatTime = new Date(item.lastHeartbeat).getTime();
          const isStillOnline = !isNaN(heartbeatTime) && (now - heartbeatTime < 45000);
          presences[item.userId] = {
            ...item,
            isOnline: isStillOnline,
          };
        });
        callback(presences);
      },
      (err) => {
        console.warn('Firestore presence subscription warning:', err);
      }
    );
  } catch (err) {
    console.warn('Could not initiate Firestore presence subscription:', err);
    return () => {};
  }
}

// 7. RESET STUDENT OR ROMBEL PROGRESS IN FIRESTORE
export async function deleteStudentProgressFromFirestore(
  scope: 'student' | 'rombel',
  target: { studentId?: string; rombel?: string; school?: string }
): Promise<void> {
  try {
    const matches = (data: any) => {
      if (!data) return false;
      if (scope === 'student') {
        return data.studentId === target.studentId;
      }
      const rombelMatch = data.rombel === target.rombel;
      const schoolMatch = target.school ? data.school === target.school : true;
      return rombelMatch && schoolMatch;
    };

    const collectionsToClean = ['submissions', 'simulationLogs', 'essayLogs'];
    for (const colName of collectionsToClean) {
      const snap = await getDocs(collection(db, colName));
      const deletions: Promise<void>[] = [];
      snap.forEach((d) => {
        const data = d.data();
        if (matches(data) || (colName === 'submissions' && scope === 'student' && target.studentId && d.id.startsWith(`${target.studentId}_`))) {
          deletions.push(deleteDoc(d.ref));
        }
      });
      await Promise.all(deletions);
    }
  } catch (err) {
    console.warn('Could not delete progress from Firestore:', err);
  }
}

export async function clearAllDataFromFirestore(): Promise<void> {
  try {
    const collectionsToClean = [
      'submissions',
      'simulationLogs',
      'essayLogs',
      'directMessages',
      'presence',
    ];
    for (const colName of collectionsToClean) {
      const snap = await getDocs(collection(db, colName));
      const deletions: Promise<void>[] = [];
      snap.forEach((d) => {
        deletions.push(deleteDoc(d.ref));
      });
      await Promise.all(deletions);
    }
  } catch (err) {
    console.warn('Could not clear all data from Firestore:', err);
  }
}
