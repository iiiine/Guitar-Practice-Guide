import { isDue } from './schedule';
import type { PracticeItem, ScheduleState } from './types';

export type MenuReason = 'warmup' | 'review' | 'new' | 'challenge' | 'apply';

export interface MenuEntry {
  item: PracticeItem;
  reason: MenuReason;
}

export interface MenuInput {
  /** 依課程順序排列的所有練習 */
  items: PracticeItem[];
  schedules: Map<string, ScheduleState>;
  /** 已開始的單元（其練習可進菜單） */
  activeLessonIds: string[];
  now: Date;
  budgetMinutes?: number;
  maxNew?: number;
  /** 已解鎖的變化挑戰（challengeOf 有值），不受單元限制 */
  challenges?: PracticeItem[];
  maxChallenges?: number;
}

/** 每天換一個暖身，同一天結果固定。 */
function dayIndex(now: Date): number {
  return Math.floor(now.getTime() / 86_400_000);
}

/**
 * 每日菜單：暖身 → 到期複習 → 新內容 → 變化挑戰 → 在伴奏上應用。
 * 純函式：同樣的輸入永遠產生同樣的菜單。
 */
export function buildDailyMenu(input: MenuInput): MenuEntry[] {
  const { items, schedules, now } = input;
  const budget = input.budgetMinutes ?? 30;
  const maxNew = input.maxNew ?? 2;
  const active = new Set(input.activeLessonIds);
  const challenges = input.challenges ?? [];
  const available = [
    ...items.filter((i) => (i.lessonId ? active.has(i.lessonId) : active.size > 0 || i.kind === 'apply')),
    ...challenges,
  ];
  const menu: MenuEntry[] = [];
  let used = 0;
  const add = (item: PracticeItem, reason: MenuReason): boolean => {
    if (menu.some((m) => m.item.id === item.id)) return false;
    if (used + item.minutes > budget && menu.length > 0) return false;
    menu.push({ item, reason });
    used += item.minutes;
    return true;
  };

  const warmups = available.filter((i) => i.kind === 'warmup');
  if (warmups.length > 0) add(warmups[dayIndex(now) % warmups.length], 'warmup');

  const due = available
    .filter((i) => i.kind !== 'warmup' && schedules.has(i.id) && isDue(schedules.get(i.id)!, now))
    .sort((a, b) => new Date(schedules.get(a.id)!.card.due).getTime() - new Date(schedules.get(b.id)!.card.due).getTime());
  for (const item of due) add(item, 'review');

  let added = 0;
  for (const item of available) {
    if (added >= maxNew) break;
    if (item.kind === 'warmup' || item.kind === 'apply' || item.challengeOf || schedules.has(item.id)) continue;
    if (add(item, 'new')) added++;
  }

  let addedChallenges = 0;
  for (const item of challenges) {
    if (addedChallenges >= (input.maxChallenges ?? 1)) break;
    if (schedules.has(item.id)) continue;
    if (add(item, 'challenge')) addedChallenges++;
  }

  const apply = available.filter((i) => i.kind === 'apply');
  if (apply.length > 0) {
    // 優先還沒練過或最久沒練的應用練習
    const pick = [...apply].sort(
      (a, b) =>
        (schedules.get(a.id) ? new Date(schedules.get(a.id)!.card.last_review ?? 0).getTime() : -1) -
        (schedules.get(b.id) ? new Date(schedules.get(b.id)!.card.last_review ?? 0).getTime() : -1),
    )[0];
    if (!add(pick, 'apply')) {
      menu.push({ item: pick, reason: 'apply' }); // 應用永遠保留，閉環的最後一步
    }
  }
  return menu;
}

export function menuMinutes(menu: MenuEntry[]): number {
  return menu.reduce((s, m) => s + m.item.minutes, 0);
}
