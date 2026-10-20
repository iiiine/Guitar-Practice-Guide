import { describe, expect, it } from 'vitest';
import { checkSequence } from '../sequence/checker';
import { getChord, getScale } from '../theory';
import { content, getSequence } from './index';

/** CI 必過：所有內容檔都要通過樂句檢查器。 */
describe('content: phrase checker', () => {
  for (const seq of content.sequences) {
    it(`${seq.id} passes the checker`, () => {
      const r = checkSequence(seq);
      expect(r.issues.map((i) => `${i.rule}: ${i.detail}`)).toEqual([]);
    });
  }
});

describe('content: integrity', () => {
  it('has unique sequence and item ids', () => {
    const ids = content.sequences.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
    const itemIds = content.items.map((i) => i.id);
    expect(new Set(itemIds).size).toBe(itemIds.length);
  });

  it('every item, audition, try-now and genre reference resolves', () => {
    const itemIds = new Set(content.items.map((i) => i.id));
    for (const i of content.items) expect(getSequence(i.sequenceId), i.id).toBeDefined();
    for (const l of content.lessons) {
      for (const a of l.sound.auditions) expect(getSequence(a.sequenceId), a.sequenceId).toBeDefined();
      if (l.what.shapeSequenceId) expect(getSequence(l.what.shapeSequenceId)).toBeDefined();
      expect(itemIds.has(l.tryNow.itemId), l.tryNow.itemId).toBe(true);
      for (const p of l.prerequisites) expect(content.lessons.some((x) => x.id === p)).toBe(true);
      for (const q of l.quiz) expect(q.answer).toBeLessThan(q.options.length);
    }
    for (const g of content.genres) {
      expect(itemIds.has(g.jamItemId)).toBe(true);
      for (const id of g.itemIds) expect(itemIds.has(id), id).toBe(true);
    }
  });

  it('all keys, scales and chords are known', () => {
    for (const s of content.sequences) {
      expect(() => getScale(s.key, s.scale)).not.toThrow();
      for (const c of s.chords) expect(() => getChord(c.symbol)).not.toThrow();
    }
  });

  it('each lesson has 5–10 handwritten core phrases', () => {
    for (const l of content.lessons) {
      const phrases = content.sequences.filter((s) => s.id.startsWith(l.id.split('-')[0] + '-ph-'));
      expect(phrases.length, l.id).toBeGreaterThanOrEqual(5);
      expect(phrases.length, l.id).toBeLessThanOrEqual(10);
    }
  });
});
