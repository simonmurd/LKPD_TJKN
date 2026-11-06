import { StudentTaskAssignment, StudentProfile } from '../types/curriculum';

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

export async function fetchTasksFromServer(): Promise<StudentTaskAssignment[]> {
  try {
    const res = await fetch('/api/tasks');
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data.tasks)) {
        saveCachedTasks(data.tasks);
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
  const optimistic = current.map((t) => (t.id === id ? { ...t, ...updates } : t));
  saveCachedTasks(optimistic);

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
  if (!student) return [];
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
