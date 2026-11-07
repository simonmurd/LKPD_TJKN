import { StudentTaskAssignment, StudentProfile } from '../types/curriculum';
import {
  saveTaskToFirestore,
  deleteTaskFromFirestore,
  fetchTasksFromFirestore,
  subscribeToTasksFromFirestore,
} from '../lib/firebase';

const TASKS_STORAGE_KEY = 'tjkn_assigned_tasks_v1';

export function getCachedTasks(): StudentTaskAssignment[] {
  try {
    const raw = localStorage.getItem(TASKS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveCachedTasks(tasks: StudentTaskAssignment[]): void {
  try {
    localStorage.setItem(TASKS_STORAGE_KEY, JSON.stringify(tasks));
    window.dispatchEvent(new CustomEvent('tjkn_tasks_updated'));
  } catch {
    // ignore
  }
}

// Real-time Firestore sync
let isSubscriptionInitialized = false;
export function initTasksRealtimeSync(): void {
  if (isSubscriptionInitialized || typeof window === 'undefined') return;
  isSubscriptionInitialized = true;
  subscribeToTasksFromFirestore((firestoreTasks) => {
    if (Array.isArray(firestoreTasks)) {
      saveCachedTasks(firestoreTasks);
    }
  });
}

// Start listener immediately on load
if (typeof window !== 'undefined') {
  initTasksRealtimeSync();
}

export async function fetchTasksFromServer(): Promise<StudentTaskAssignment[]> {
  initTasksRealtimeSync();
  try {
    // 1. Priority: Fetch from Firestore Cloud Database
    const firestoreTasks = await fetchTasksFromFirestore();
    if (Array.isArray(firestoreTasks) && firestoreTasks.length > 0) {
      saveCachedTasks(firestoreTasks);
      return firestoreTasks;
    }

    // 2. Fallback: Fetch from server API
    const res = await fetch('/api/tasks');
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data.tasks)) {
        saveCachedTasks(data.tasks);
        // Sync tasks to Firestore
        data.tasks.forEach((t: StudentTaskAssignment) => {
          saveTaskToFirestore(t).catch(() => {});
        });
        return data.tasks;
      }
    }
  } catch {
    // fallback to cache
  }
  return getCachedTasks();
}

export async function createTaskOnServer(
  task: Omit<StudentTaskAssignment, 'id' | 'createdAt' | 'createdBy'>
): Promise<StudentTaskAssignment[]> {
  const newTask: StudentTaskAssignment = {
    ...task,
    id: `task_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    createdAt: new Date().toISOString(),
    createdBy: 'Simon Murd',
  };

  const current = getCachedTasks();
  const optimistic = [newTask, ...current];
  saveCachedTasks(optimistic);

  // 1. Real-time Firestore sync
  await saveTaskToFirestore(newTask);

  // 2. Local Express server persistence
  try {
    const res = await fetch('/api/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newTask),
    });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data.tasks)) {
        saveCachedTasks(data.tasks);
        return data.tasks;
      }
    }
  } catch {
    // keep optimistic
  }
  return optimistic;
}

export async function updateTaskOnServer(
  id: string,
  updates: Partial<StudentTaskAssignment>
): Promise<StudentTaskAssignment[]> {
  const current = getCachedTasks();
  const existing = current.find((t) => t.id === id);
  const updatedTask = existing
    ? { ...existing, ...updates }
    : ({ id, ...updates } as StudentTaskAssignment);
  const optimistic = current.map((t) => (t.id === id ? updatedTask : t));
  saveCachedTasks(optimistic);

  // 1. Update in Firestore
  await saveTaskToFirestore(updatedTask);

  // 2. Update on server
  try {
    const res = await fetch(`/api/tasks/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data.tasks)) {
        saveCachedTasks(data.tasks);
        return data.tasks;
      }
    }
  } catch {
    // keep optimistic
  }
  return optimistic;
}

export async function deleteTaskOnServer(id: string): Promise<StudentTaskAssignment[]> {
  const current = getCachedTasks();
  const optimistic = current.filter((t) => t.id !== id);
  saveCachedTasks(optimistic);

  // 1. Delete from Firestore
  await deleteTaskFromFirestore(id);

  // 2. Delete on server
  try {
    const res = await fetch(`/api/tasks/${id}`, {
      method: 'DELETE',
    });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data.tasks)) {
        saveCachedTasks(data.tasks);
        return data.tasks;
      }
    }
  } catch {
    // keep optimistic
  }
  return optimistic;
}

export function getTasksForStudent(
  tasks: StudentTaskAssignment[],
  student: StudentProfile | null
): StudentTaskAssignment[] {
  // If student has not selected an identity yet, show all active tasks
  // so the student immediately sees what Pak Simon Murd assigned!
  if (!student) {
    return tasks;
  }
  return tasks.filter((t) => {
    if (t.targetType === 'all') return true;
    if (t.targetType === 'school') return t.targetSchool === student.school;
    if (t.targetType === 'class') {
      return (
        (!t.targetSchool || t.targetSchool === student.school) &&
        t.targetClass === student.className
      );
    }
    if (t.targetType === 'student') return t.targetStudentId === student.id;
    return false;
  });
}
