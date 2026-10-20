import { create } from 'zustand';
import { content, getItem } from '../content';
import { review, suggestBpm, type LessonProgress, type PlayMode, type PracticeLog, type ScheduleState, type SelfRating } from '../practice';
import * as storage from '../storage';

interface PracticeState {
  loaded: boolean;
  schedules: Map<string, ScheduleState>;
  logs: PracticeLog[];
  progress: Map<string, LessonProgress>;
  init(): Promise<void>;
  rate(itemId: string, rating: SelfRating, bpm: number, mode: PlayMode): Promise<{ next: number }>;
  startLesson(lessonId: string): Promise<void>;
  completeLesson(lessonId: string, quizScore?: number): Promise<void>;
  saveQuiz(lessonId: string, score: number): Promise<void>;
}

function newId(): string {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export const usePractice = create<PracticeState>((set, get) => ({
  loaded: false,
  schedules: new Map(),
  logs: [],
  progress: new Map(),

  async init() {
    const [schedules, logs, progress] = await Promise.all([
      storage.getAllSchedules(),
      storage.getLogs(),
      storage.getLessonProgress(),
    ]);
    set({
      loaded: true,
      schedules: new Map(schedules.map((s) => [s.itemId, s])),
      logs,
      progress: new Map(progress.map((p) => [p.lessonId, p])),
    });
  },

  async rate(itemId, rating, bpm, mode) {
    const now = new Date();
    const prev = get().schedules.get(itemId);
    const state = review(prev, itemId, rating, bpm, now);
    const log: PracticeLog = { id: newId(), itemId, date: now.toISOString(), rating, bpm, mode };
    await Promise.all([storage.saveSchedule(state), storage.saveLog(log)]);
    const schedules = new Map(get().schedules);
    schedules.set(itemId, state);
    set({ schedules, logs: [...get().logs, log] });
    const item = getItem(itemId);
    return { next: item ? suggestBpm(item, state) : bpm };
  },

  async startLesson(lessonId) {
    const existing = get().progress.get(lessonId);
    if (existing?.startedAt) return;
    const p: LessonProgress = { ...existing, lessonId, startedAt: new Date().toISOString() };
    await storage.saveLessonProgress(p);
    set({ progress: new Map(get().progress).set(lessonId, p) });
  },

  async completeLesson(lessonId, quizScore) {
    const existing = get().progress.get(lessonId);
    const now = new Date().toISOString();
    const p: LessonProgress = {
      ...existing,
      lessonId,
      startedAt: existing?.startedAt ?? now,
      completedAt: now,
      quizScore: quizScore ?? existing?.quizScore,
    };
    await storage.saveLessonProgress(p);
    set({ progress: new Map(get().progress).set(lessonId, p) });
  },

  async saveQuiz(lessonId, score) {
    const existing = get().progress.get(lessonId);
    const p: LessonProgress = { ...existing, lessonId, quizScore: score };
    await storage.saveLessonProgress(p);
    set({ progress: new Map(get().progress).set(lessonId, p) });
  },
}));

/** 單元是否解鎖：前置單元都已完成（第一課永遠解鎖）。 */
export function isUnlocked(lessonId: string, progress: Map<string, LessonProgress>): boolean {
  const lesson = content.lessons.find((l) => l.id === lessonId);
  if (!lesson) return false;
  return lesson.prerequisites.every((p) => !!progress.get(p)?.completedAt) || !!progress.get(lessonId)?.startedAt;
}

export function activeLessonIds(progress: Map<string, LessonProgress>): string[] {
  return [...progress.values()].filter((p) => p.startedAt).map((p) => p.lessonId);
}
