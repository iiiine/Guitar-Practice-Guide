import type { LessonProgress, PracticeLog, ScheduleState } from '../practice/types';

/**
 * 資料存取後端。上層不直接用它，而是呼叫 storage/index.ts 的函式；
 * 第一版是 IndexedDB，之後可換成「本機＋雲端同步」實作。
 */
export interface StorageBackend {
  saveLog(log: PracticeLog): Promise<void>;
  getLogs(filter?: { itemId?: string; since?: Date }): Promise<PracticeLog[]>;
  getSchedule(itemId: string): Promise<ScheduleState | undefined>;
  getAllSchedules(): Promise<ScheduleState[]>;
  saveSchedule(state: ScheduleState): Promise<void>;
  getLessonProgress(): Promise<LessonProgress[]>;
  saveLessonProgress(p: LessonProgress): Promise<void>;
  getSetting<T>(key: string): Promise<T | undefined>;
  saveSetting<T>(key: string, value: T): Promise<void>;
}

function filterLogs(logs: PracticeLog[], filter?: { itemId?: string; since?: Date }): PracticeLog[] {
  return logs
    .filter((l) => !filter?.itemId || l.itemId === filter.itemId)
    .filter((l) => !filter?.since || new Date(l.date) >= filter.since)
    .sort((a, b) => a.date.localeCompare(b.date));
}

/** 記憶體後端：測試與 IndexedDB 不可用時使用。 */
export function createMemoryBackend(): StorageBackend {
  const logs: PracticeLog[] = [];
  const schedules = new Map<string, ScheduleState>();
  const progress = new Map<string, LessonProgress>();
  const settings = new Map<string, unknown>();
  return {
    async saveLog(log) {
      logs.push(structuredClone(log));
    },
    async getLogs(filter) {
      return filterLogs(logs, filter).map((l) => structuredClone(l));
    },
    async getSchedule(itemId) {
      const s = schedules.get(itemId);
      return s && structuredClone(s);
    },
    async getAllSchedules() {
      return [...schedules.values()].map((s) => structuredClone(s));
    },
    async saveSchedule(state) {
      schedules.set(state.itemId, structuredClone(state));
    },
    async getLessonProgress() {
      return [...progress.values()].map((p) => structuredClone(p));
    },
    async saveLessonProgress(p) {
      progress.set(p.lessonId, structuredClone(p));
    },
    async getSetting<T>(key: string) {
      return settings.get(key) as T | undefined;
    },
    async saveSetting(key, value) {
      settings.set(key, structuredClone(value));
    },
  };
}

export { filterLogs };
