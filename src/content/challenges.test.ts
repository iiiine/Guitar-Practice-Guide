import { describe, expect, it } from 'vitest';
import { review } from '../practice/schedule';
import { checkSequence } from '../sequence/checker';
import { challengesFor, content, getItem, getSequence, isMastered, lockedChallengeSources, unlockBpm, unlockedChallenges } from './index';

const now = new Date('2026-10-20T10:00:00Z');

describe('variation challenges', () => {
  it('every handwritten phrase offers at least one challenge, and all of them pass the checker', () => {
    const phrases = content.items.filter((i) => i.kind === 'phrase');
    const withNone = phrases.filter((i) => challengesFor(i.id).length === 0).map((i) => i.id);
    // 有空弦的樂句無法平移，但至少要能換把位
    expect(withNone).toEqual([]);
    for (const i of phrases) {
      for (const c of challengesFor(i.id)) {
        expect(checkSequence(c.sequence).ok, c.item.id).toBe(true);
        expect(c.item.challengeOf).toBe(i.id);
      }
    }
  });

  it('unlocks only after a smooth run near the target tempo', () => {
    const it0 = getItem('l3-ph-from-root')!;
    expect(unlockBpm(it0)).toBe(90);
    expect(isMastered(it0, review(undefined, it0.id, 'smooth', 85, now))).toBe(false);
    expect(isMastered(it0, review(undefined, it0.id, 'stuck', 95, now))).toBe(false);
    const s = review(undefined, it0.id, 'smooth', 90, now);
    expect(isMastered(it0, s)).toBe(true);
    const unlocked = unlockedChallenges(new Map([[it0.id, s]]));
    expect(unlocked.length).toBeGreaterThan(0);
    expect(unlocked.every((c) => c.item.challengeOf === it0.id)).toBe(true);
    expect(lockedChallengeSources(new Map([[it0.id, s]])).some((i) => i.id === it0.id)).toBe(false);
  });

  it('resolves challenge ids back to items and sequences', () => {
    const c = challengesFor('l5-ph-d7')[0];
    expect(getItem(c.item.id)?.title).toContain('轉到');
    expect(getSequence(c.item.id)?.events.length).toBe(getSequence('l5-ph-d7')!.events.length);
  });
});
