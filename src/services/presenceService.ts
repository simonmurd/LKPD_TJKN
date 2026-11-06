import { UserPresence } from '../types/curriculum';
import {
  savePresenceToFirestore,
  subscribeToPresenceFromFirestore,
} from '../lib/firebase';

const PRESENCE_LOCAL_CACHE = 'tjkn_lab_presence_cache';

// Send heartbeat to both Firestore and Server API
export async function sendPresenceHeartbeat(
  presence: Partial<UserPresence> & { userId: string; role: 'siswa' | 'guru'; userName: string }
): Promise<void> {
  const fullPresence: UserPresence = {
    userId: presence.userId,
    role: presence.role,
    userName: presence.userName,
    noAbsen: presence.noAbsen || '',
    className: presence.className || '',
    school: presence.school || '',
    currentActivity: presence.currentActivity || 'Aktif di Platform TJKN Studio',
    activityCategory: presence.activityCategory || 'idle',
    babId: presence.babId,
    babCode: presence.babCode,
    babTitle: presence.babTitle,
    activeItemDetail: presence.activeItemDetail,
    lastHeartbeat: new Date().toISOString(),
    isOnline: true,
    isTypingTo: presence.isTypingTo,
    deviceLabel: presence.deviceLabel || 'Client Web Browser',
  };

  // 1. Send to Server endpoint
  try {
    fetch('/api/presence/heartbeat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(fullPresence),
    }).catch(() => {});
  } catch (e) {
    // Ignore server error
  }

  // 2. Send to Firestore Real-Time DB
  try {
    await savePresenceToFirestore(fullPresence);
  } catch (e) {
    // Ignore Firestore offline error
  }
}

// Update typing indicator
export async function updateTypingStatus(
  userId: string,
  isTypingTo: string | null
): Promise<void> {
  try {
    fetch('/api/presence/typing', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, isTypingTo }),
    }).catch(() => {});
  } catch (e) {
    // Ignore
  }
}

// Fetch all presences from server (with fallback to local cache)
export async function fetchServerPresences(): Promise<Record<string, UserPresence>> {
  try {
    const res = await fetch('/api/presence');
    if (res.ok) {
      const data = await res.json();
      if (data && data.presences) {
        localStorage.setItem(PRESENCE_LOCAL_CACHE, JSON.stringify(data.presences));
        return data.presences;
      }
    }
  } catch (e) {
    // fallback
  }

  try {
    const cached = localStorage.getItem(PRESENCE_LOCAL_CACHE);
    if (cached) {
      return JSON.parse(cached);
    }
  } catch (e) {
    // ignore
  }

  return {};
}

// Subscribe to Presence Updates (dual channel: Firestore onSnapshot + periodic server polling)
export function subscribeToLabPresence(
  onUpdate: (presences: Record<string, UserPresence>) => void
): () => void {
  let isSubscribed = true;

  // Initial fetch from server
  fetchServerPresences().then((initial) => {
    if (isSubscribed && Object.keys(initial).length > 0) {
      onUpdate(initial);
    }
  });

  // Firestore live listener
  const unsubscribeFirestore = subscribeToPresenceFromFirestore((firestoreMap) => {
    if (!isSubscribed) return;
    if (Object.keys(firestoreMap).length > 0) {
      onUpdate(firestoreMap);
    }
  });

  // Polling server every 4 seconds to guarantee presence and typing indicator sync
  const pollInterval = setInterval(async () => {
    if (!isSubscribed) return;
    const serverMap = await fetchServerPresences();
    if (isSubscribed && Object.keys(serverMap).length > 0) {
      onUpdate(serverMap);
    }
  }, 4000);

  return () => {
    isSubscribed = false;
    unsubscribeFirestore();
    clearInterval(pollInterval);
  };
}
