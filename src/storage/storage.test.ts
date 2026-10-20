import 'fake-indexeddb/auto';
import { describe, expect, it } from 'vitest';
import { review } from '../practice/schedule';
import { createIndexedDBBackend, createMemoryBackend, type StorageBackend } from './index';

const now = new Date('2026-10-20T10:00:00Z');

function suite(name: string, make: () => StorageBackend) {
  describe(name, () => {
    it('saves and filters logs', async () => {
      const b = make();
      await b.saveLog({ id: '1', itemId: 'a', date: '2026-10-19T10:00:00Z', rating: 'stuck', bpm: 60, mode: 'follow' });
      await b.saveLog({ id: '2', itemId: 'a', date: '2026-10-20T10:00:00Z', rating: 'smooth', bpm: 65, mode: 'follow' });
      await b.saveLog({ id: '3', itemId: 'b', date: '2026-10-20T11:00:00Z', rating: 'smooth', bpm: 80, mode: 'demo' });
      expect((await b.getLogs({ itemId: 'a' })).map((l) => l.id)).toEqual(['1', '2']);
      expect((await b.getLogs({ since: now })).map((l) => l.id)).toEqual(['2', '3']);
    });

    it('round-trips schedules, progress and settings', async () => {
      const b = make();
      const s = review(undefined, 'a', 'smooth', 70, now);
      await b.saveSchedule(s);
      const back = await b.getSchedule('a');
      expect(back?.lastBpm).toBe(70);
      expect(new Date(back!.card.due).getTime()).toBe(new Date(s.card.due).getTime());
      await b.saveLessonProgress({ lessonId: 'L1', startedAt: now.toISOString() });
      expect(await b.getLessonProgress()).toHaveLength(1);
      await b.saveSetting('bpm', 90);
      expect(await b.getSetting<number>('bpm')).toBe(90);
    });
  });
}

suite('memory backend', createMemoryBackend);
let n = 0;
suite('indexeddb backend', () => createIndexedDBBackend(`test-db-${n++}`));
