import { openDB, type DBSchema, type IDBPDatabase } from 'idb';
import type { LessonProgress, PracticeLog, ScheduleState } from '../practice/types';
import { filterLogs, type StorageBackend } from './backend';

interface GuitarDB extends DBSchema {
  logs: { key: string; value: PracticeLog; indexes: { byItem: string } };
  schedules: { key: string; value: ScheduleState };
  lessonProgress: { key: string; value: LessonProgress };
  settings: { key: string; value: { key: string; value: unknown } };
}

const DB_NAME = 'guitar-practice-guide';
const DB_VERSION = 1;

export function createIndexedDBBackend(dbName = DB_NAME): StorageBackend {
  let dbPromise: Promise<IDBPDatabase<GuitarDB>> | undefined;
  const db = () =>
    (dbPromise ??= openDB<GuitarDB>(dbName, DB_VERSION, {
      upgrade(d) {
        const logs = d.createObjectStore('logs', { keyPath: 'id' });
        logs.createIndex('byItem', 'itemId');
        d.createObjectStore('schedules', { keyPath: 'itemId' });
        d.createObjectStore('lessonProgress', { keyPath: 'lessonId' });
        d.createObjectStore('settings', { keyPath: 'key' });
      },
    }));

  return {
    async saveLog(log) {
      await (await db()).put('logs', log);
    },
    async getLogs(filter) {
      const d = await db();
      const raw = filter?.itemId ? await d.getAllFromIndex('logs', 'byItem', filter.itemId) : await d.getAll('logs');
      return filterLogs(raw, filter);
    },
    async getSchedule(itemId) {
      return (await db()).get('schedules', itemId);
    },
    async getAllSchedules() {
      return (await db()).getAll('schedules');
    },
    async saveSchedule(state) {
      await (await db()).put('schedules', state);
    },
    async getLessonProgress() {
      return (await db()).getAll('lessonProgress');
    },
    async saveLessonProgress(p) {
      await (await db()).put('lessonProgress', p);
    },
    async getSetting<T>(key: string) {
      return (await (await db()).get('settings', key))?.value as T | undefined;
    },
    async saveSetting(key, value) {
      await (await db()).put('settings', { key, value });
    },
  };
}
