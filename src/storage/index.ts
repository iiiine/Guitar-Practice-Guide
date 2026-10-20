import type { LessonProgress, PracticeLog, ScheduleState } from '../practice/types';
import { createMemoryBackend, type StorageBackend } from './backend';
import { createIndexedDBBackend } from './indexeddb';

export type { StorageBackend };
export { createMemoryBackend, createIndexedDBBackend };

let backend: StorageBackend =
  typeof indexedDB !== 'undefined' ? createIndexedDBBackend() : createMemoryBackend();

/** 替換底層實作（測試、未來的雲端同步）。 */
export function setBackend(b: StorageBackend): void {
  backend = b;
}

export const saveLog = (log: PracticeLog) => backend.saveLog(log);
export const getLogs = (filter?: { itemId?: string; since?: Date }) => backend.getLogs(filter);
export const getSchedule = (itemId: string) => backend.getSchedule(itemId);
export const getAllSchedules = () => backend.getAllSchedules();
export const saveSchedule = (s: ScheduleState) => backend.saveSchedule(s);
export const getLessonProgress = () => backend.getLessonProgress();
export const saveLessonProgress = (p: LessonProgress) => backend.saveLessonProgress(p);
export const getSetting = <T>(key: string) => backend.getSetting<T>(key);
export const saveSetting = <T>(key: string, value: T) => backend.saveSetting(key, value);
