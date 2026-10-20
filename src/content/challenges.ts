import type { PracticeItem, ScheduleState } from '../practice/types';
import { moveToPosition, transpose } from '../sequence/variations';
import { displayKey } from '../theory';
import type { EventSequence } from '../sequence/types';
import { content, getItem as getBaseItem, getSequence as getBaseSequence } from './registry';

/**
 * 變化挑戰：樂句練熟後，由程式產生轉調與換把位版本，成為新的可排程練習。
 * 「內容品質由人把關、數量由程式擴充」——變化一律重新通過檢查器（在 variations.ts 內）。
 */

/** 最佳「順」的 BPM 達到 起始 → 目標 的這個比例就解鎖 */
export const UNLOCK_RATIO = 0.75;

const TRANSPOSE_CANDIDATES = [5, -2, 3, -5, 2, -3, 7];
const POSITION_CANDIDATES = [12, 7, 10, 3, 5, 8, 14];
const MAX_TRANSPOSE = 2;

export interface Challenge {
  item: PracticeItem;
  sequence: EventSequence;
}

export function unlockBpm(item: PracticeItem): number {
  return Math.ceil(item.startBpm + UNLOCK_RATIO * (item.targetBpm - item.startBpm));
}

export function isMastered(item: PracticeItem, state: ScheduleState | undefined): boolean {
  return !!state && state.lastRating === 'smooth' && state.bestSmoothBpm >= unlockBpm(item);
}

/** 只有手寫樂句會衍生挑戰（挑戰本身不再衍生，避免無限擴張） */
export function canHaveChallenges(item: PracticeItem): boolean {
  const seq = getBaseSequence(item.sequenceId);
  return item.kind === 'phrase' && !item.challengeOf && !!seq && seq.source === 'handwritten' && seq.events.length > 0;
}

const cache = new Map<string, Challenge[]>();

/** 某練習所有可能的挑戰（確定性：同一個練習永遠得到同樣的挑戰） */
export function challengesFor(itemId: string): Challenge[] {
  const cached = cache.get(itemId);
  if (cached) return cached;
  const base = getBaseItem(itemId);
  const seq = base && getBaseSequence(base.sequenceId);
  const out: Challenge[] = [];
  if (base && seq && canHaveChallenges(base)) {
    const make = (s: EventSequence, title: string): Challenge => ({
      sequence: s,
      item: { ...base, id: s.id, sequenceId: s.id, title, challengeOf: base.id, kind: 'phrase' },
    });
    for (const semis of TRANSPOSE_CANDIDATES) {
      if (out.length >= MAX_TRANSPOSE) break;
      const t = transpose(seq, semis);
      if (t) out.push(make(t, `${base.title}・轉到 ${displayKey(t.key, t.scale)} 調`));
    }
    for (const from of POSITION_CANDIDATES) {
      if (Math.abs(from - seq.position.from) < 2) continue;
      const p = moveToPosition(seq, from);
      if (p) {
        out.push(make(p, `${base.title}・換到 ${p.position.from}–${p.position.to} 品`));
        break;
      }
    }
  }
  cache.set(itemId, out);
  return out;
}

/** 依排程狀態，目前已解鎖的挑戰 */
export function unlockedChallenges(schedules: Map<string, ScheduleState>): Challenge[] {
  return content.items
    .filter((i) => isMastered(i, schedules.get(i.id)))
    .flatMap((i) => challengesFor(i.id));
}

/** 還沒解鎖、但之後可以解鎖挑戰的樂句數 */
export function lockedChallengeSources(schedules: Map<string, ScheduleState>): PracticeItem[] {
  return content.items.filter((i) => canHaveChallenges(i) && !isMastered(i, schedules.get(i.id)) && challengesFor(i.id).length > 0);
}

/** 由挑戰 id（例如 l3-ph-from-root~t5）找回挑戰 */
export function resolveChallenge(id: string): Challenge | undefined {
  const baseId = id.split('~')[0];
  return challengesFor(baseId).find((c) => c.item.id === id);
}
