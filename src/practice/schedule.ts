import { createEmptyCard, fsrs, Rating, type Card, type Grade } from 'ts-fsrs';
import type { PracticeItem, ScheduleState, SelfRating } from './types';

const scheduler = fsrs({ enable_fuzz: false });

export const RATING_TO_FSRS: Record<SelfRating, Grade> = {
  smooth: Rating.Good,
  stuck: Rating.Hard,
  cannot: Rating.Again,
};

const MIN_BPM = 40;
const BPM_STEP_UP = 5;
const BPM_STEP_DOWN = 10;

/** 依自評更新排程狀態（純函式）。 */
export function review(
  prev: ScheduleState | undefined,
  itemId: string,
  rating: SelfRating,
  bpm: number,
  now: Date,
): ScheduleState {
  const card: Card = prev?.card ?? createEmptyCard<Card>(now);
  const next = scheduler.next(card, now, RATING_TO_FSRS[rating]);
  return {
    itemId,
    card: next.card,
    lastRating: rating,
    lastBpm: bpm,
    bestSmoothBpm: rating === 'smooth' ? Math.max(prev?.bestSmoothBpm ?? 0, bpm) : prev?.bestSmoothBpm ?? 0,
    reps: (prev?.reps ?? 0) + 1,
  };
}

/** 下次練習建議 BPM：順就加速、卡住維持、不會就降速。 */
export function suggestBpm(item: PracticeItem, state: ScheduleState | undefined): number {
  if (!state) return item.startBpm;
  switch (state.lastRating) {
    case 'smooth':
      return Math.min(item.targetBpm, state.lastBpm + BPM_STEP_UP);
    case 'stuck':
      return state.lastBpm;
    case 'cannot':
      return Math.max(MIN_BPM, Math.min(item.startBpm, state.lastBpm - BPM_STEP_DOWN));
  }
}

export function isDue(state: ScheduleState, now: Date): boolean {
  return new Date(state.card.due).getTime() <= now.getTime();
}

/** 熟練度 0–1：以 BPM 接近目標的程度與最近自評估算，給畫面顯示用。 */
export function mastery(item: PracticeItem, state: ScheduleState | undefined): number {
  if (!state) return 0;
  const span = Math.max(1, item.targetBpm - item.startBpm);
  const speed = Math.min(1, Math.max(0, (state.bestSmoothBpm - item.startBpm) / span));
  const ratingBonus = state.lastRating === 'smooth' ? 0.2 : state.lastRating === 'stuck' ? 0.1 : 0;
  return Math.min(1, speed * 0.8 + ratingBonus);
}
