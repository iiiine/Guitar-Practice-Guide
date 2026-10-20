import type { Card } from 'ts-fsrs';

/** 自評：順／卡住／不會 */
export type SelfRating = 'smooth' | 'stuck' | 'cannot';

export type PracticeItemKind = 'warmup' | 'technique' | 'phrase' | 'apply';

/** 可排程的練習。每個練習指向一個事件序列。 */
export interface PracticeItem {
  id: string;
  title: string;
  sequenceId: string;
  kind: PracticeItemKind;
  lessonId?: string;
  genreId?: string;
  /** 建議練習分鐘數，用於每日菜單排時間 */
  minutes: number;
  startBpm: number;
  targetBpm: number;
  /** 變化挑戰：由哪個練習衍生（轉調、換把位） */
  challengeOf?: string;
}

export type PlayMode = 'demo' | 'follow' | 'step';

export interface PracticeLog {
  id: string;
  itemId: string;
  /** ISO 時間 */
  date: string;
  rating: SelfRating;
  bpm: number;
  mode: PlayMode;
}

export interface ScheduleState {
  itemId: string;
  card: Card;
  lastRating: SelfRating;
  lastBpm: number;
  bestSmoothBpm: number;
  reps: number;
}

export interface LessonProgress {
  lessonId: string;
  /** 開始學（解鎖其練習進入每日菜單） */
  startedAt?: string;
  completedAt?: string;
  quizScore?: number;
}
