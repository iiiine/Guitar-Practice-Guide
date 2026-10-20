/** 基礎內容登錄表（手寫與規則式內容）。上層請改用 content/index.ts，它會再加上變化挑戰。 */
import type { PracticeItem } from '../practice/types';
import type { EventSequence } from '../sequence/types';
import * as blues from './genres/blues';
import * as l1 from './lessons/l1-notes';
import * as l2 from './lessons/l2-major';
import * as l3 from './lessons/l3-pentatonic';
import * as l4 from './lessons/l4-triads';
import * as l5 from './lessons/l5-blues';
import type { ContentBundle, GenrePack, Lesson } from './types';

const lessonModules = [l1, l2, l3, l4, l5];

export const content: ContentBundle = {
  lessons: lessonModules.map((m) => m.lesson).sort((a, b) => a.order - b.order),
  sequences: [...lessonModules.flatMap((m) => m.sequences), ...blues.sequences],
  items: [...lessonModules.flatMap((m) => m.items), ...blues.items],
  genres: [blues.genre],
};

const sequenceById = new Map(content.sequences.map((s) => [s.id, s]));
const itemById = new Map(content.items.map((i) => [i.id, i]));
const lessonById = new Map(content.lessons.map((l) => [l.id, l]));

export function getSequence(id: string): EventSequence | undefined {
  return sequenceById.get(id);
}

export function getItem(id: string): PracticeItem | undefined {
  return itemById.get(id);
}

export function getLesson(id: string): Lesson | undefined {
  return lessonById.get(id);
}

export function getGenre(id: string): GenrePack | undefined {
  return content.genres.find((g) => g.id === id);
}

export function itemsForLesson(lessonId: string): PracticeItem[] {
  return content.items.filter((i) => i.lessonId === lessonId && !i.genreId);
}

/** 依課程順序排列的練習（每日菜單用） */
export function orderedItems(): PracticeItem[] {
  const order = new Map(content.lessons.map((l) => [l.id, l.order]));
  return [...content.items].sort((a, b) => (order.get(a.lessonId ?? '') ?? 99) - (order.get(b.lessonId ?? '') ?? 99));
}

/** 練習對應的序列；找不到練習時把 id 當序列 id（試聽用） */
export function sequenceForItem(itemId: string): EventSequence | undefined {
  const it = getItem(itemId);
  return getSequence(it ? it.sequenceId : itemId);
}
