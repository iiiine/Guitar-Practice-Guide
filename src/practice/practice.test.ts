import { describe, expect, it } from 'vitest';
import { buildDailyMenu, isDue, mastery, review, suggestBpm, type PracticeItem, type ScheduleState } from './index';

const item = (id: string, kind: PracticeItem['kind'], lessonId?: string, minutes = 5): PracticeItem => ({
  id,
  title: id,
  sequenceId: id,
  kind,
  lessonId,
  minutes,
  startBpm: 60,
  targetBpm: 100,
});

const now = new Date('2026-10-20T10:00:00Z');

describe('schedule', () => {
  it('schedules smooth later than cannot', () => {
    const good = review(undefined, 'x', 'smooth', 60, now);
    const again = review(undefined, 'x', 'cannot', 60, now);
    expect(new Date(good.card.due).getTime()).toBeGreaterThan(new Date(again.card.due).getTime());
    expect(good.bestSmoothBpm).toBe(60);
    expect(again.bestSmoothBpm).toBe(0);
    expect(good.reps).toBe(1);
  });

  it('suggests BPM from the last self-rating', () => {
    const it0 = item('a', 'phrase');
    expect(suggestBpm(it0, undefined)).toBe(60);
    expect(suggestBpm(it0, review(undefined, 'a', 'smooth', 70, now))).toBe(75);
    expect(suggestBpm(it0, review(undefined, 'a', 'stuck', 70, now))).toBe(70);
    expect(suggestBpm(it0, review(undefined, 'a', 'cannot', 70, now))).toBe(60);
    expect(suggestBpm(it0, review(undefined, 'a', 'smooth', 100, now))).toBe(100);
  });

  it('computes mastery', () => {
    const it0 = item('a', 'phrase');
    expect(mastery(it0, undefined)).toBe(0);
    expect(mastery(it0, review(undefined, 'a', 'smooth', 100, now))).toBe(1);
  });
});

describe('daily menu', () => {
  const items = [
    item('w1', 'warmup', 'L1', 3),
    item('p1', 'phrase', 'L1'),
    item('p2', 'phrase', 'L1'),
    item('p3', 'phrase', 'L1'),
    item('w2', 'warmup', 'L2', 3),
    item('p4', 'phrase', 'L2'),
    item('jam', 'apply', undefined, 8),
  ];

  it('builds warmup → new → apply for a beginner', () => {
    const menu = buildDailyMenu({ items, schedules: new Map(), activeLessonIds: ['L1'], now });
    expect(menu.map((m) => `${m.reason}:${m.item.id}`)).toEqual(['warmup:w1', 'new:p1', 'new:p2', 'apply:jam']);
  });

  it('puts due reviews before new items and skips locked lessons', () => {
    const past = new Date('2026-10-01T10:00:00Z');
    const s: ScheduleState = review(undefined, 'p3', 'cannot', 60, past);
    expect(isDue(s, now)).toBe(true);
    const menu = buildDailyMenu({ items, schedules: new Map([['p3', s]]), activeLessonIds: ['L1'], now });
    expect(menu.map((m) => m.item.id)).toEqual(['w1', 'p3', 'p1', 'p2', 'jam']);
    expect(menu.some((m) => m.item.id === 'p4')).toBe(false);
  });

  it('respects the time budget but always keeps the apply step', () => {
    const menu = buildDailyMenu({ items, schedules: new Map(), activeLessonIds: ['L1'], now, budgetMinutes: 8 });
    expect(menu.map((m) => m.item.id)).toEqual(['w1', 'p1', 'jam']);
  });
});

describe('daily menu: challenges', () => {
  const base = [item('w1', 'warmup', 'L1', 3), item('p1', 'phrase', 'L1'), item('jam', 'apply', undefined, 8)];
  const ch = (id: string): PracticeItem => ({ ...item(id, 'phrase', 'L1'), challengeOf: 'p1' });

  it('adds one new challenge per day after new items, never as a plain new item', () => {
    const schedules = new Map([['p1', review(undefined, 'p1', 'smooth', 100, now)]]);
    const menu = buildDailyMenu({ items: base, schedules, activeLessonIds: ['L1'], now, challenges: [ch('p1~t5'), ch('p1~p12')] });
    expect(menu.map((m) => `${m.reason}:${m.item.id}`)).toEqual(['warmup:w1', 'challenge:p1~t5', 'apply:jam']);
  });

  it('brings practised challenges back as reviews when due', () => {
    const past = new Date('2026-10-01T10:00:00Z');
    const schedules = new Map([
      ['p1', review(undefined, 'p1', 'smooth', 100, now)],
      ['p1~t5', review(undefined, 'p1~t5', 'cannot', 60, past)],
    ]);
    const menu = buildDailyMenu({ items: base, schedules, activeLessonIds: ['L1'], now, challenges: [ch('p1~t5'), ch('p1~p12')] });
    expect(menu.map((m) => `${m.reason}:${m.item.id}`)).toEqual(['warmup:w1', 'review:p1~t5', 'challenge:p1~p12', 'apply:jam']);
  });
});
