import type { PracticeItem } from '../practice/types';
import type { EventSequence } from '../sequence/types';

export interface LessonSection {
  paragraphs: string[];
  bullets?: string[];
}

export interface Audition {
  label: string;
  sequenceId: string;
}

export interface QuizQuestion {
  question: string;
  options: string[];
  answer: number;
  explain: string;
}

/** 課程單元：六段模板 + 測驗 + 練習。 */
export interface Lesson {
  id: string;
  order: number;
  title: string;
  subtitle: string;
  prerequisites: string[];
  /** 1. 是什麼：組成音、公式、指板形狀 */
  what: LessonSection & { formula?: string; shapeSequenceId?: string };
  /** 2. 聽起來怎樣：情緒色彩＋對比試聽 */
  sound: LessonSection & { auditions: Audition[] };
  /** 3. 跟誰有關：與已學概念差在哪幾個音 */
  related: LessonSection & {
    compare?: { from: { tonic: string; scale: string }; to: { tonic: string; scale: string } };
  };
  /** 4. 用在哪裡 */
  usage: LessonSection;
  /** 5. 常見誤區 */
  pitfalls: string[];
  /** 6. 馬上試試 */
  tryNow: { task: string; itemId: string };
  quiz: QuizQuestion[];
}

/** 曲風模組 */
export interface GenrePack {
  id: string;
  title: string;
  description: string;
  feel: string[];
  /** 進入曲風區時預設載入的伴奏 */
  jamItemId: string;
  itemIds: string[];
}

export interface ContentBundle {
  lessons: Lesson[];
  sequences: EventSequence[];
  items: PracticeItem[];
  genres: GenrePack[];
}
