import { describe, expect, it } from 'vitest';
import { getSequence } from '../content';
import { bassRoot, compVoicing, generateBacking } from './backing';

describe('backing generator', () => {
  it('places bass roots in the low register', () => {
    expect(bassRoot('E7')).toBe(28);
    expect(bassRoot('A7')).toBe(33);
    expect(compVoicing('C')).toEqual([55, 60, 64]);
  });

  it('generates a 12-bar shuffle that follows the chords', () => {
    const seq = getSequence('blues-jam-a')!;
    const ev = generateBacking(seq);
    const bassAt = (beat: number) => ev.find((e) => e.instrument === 'bass' && Math.abs(e.start - beat) < 1e-6)?.midi?.[0];
    expect(bassAt(0)).toBe(33); // A
    expect(bassAt(16)).toBe(38); // D7 第 5 小節
    expect(bassAt(32)).toBe(28); // E7 第 9 小節
    expect(ev.filter((e) => e.instrument === 'snare')).toHaveLength(24);
    expect(ev.some((e) => e.instrument === 'hat' && Math.abs(e.start - 2 / 3) < 1e-6)).toBe(true);
  });

  it('generates nothing for style none', () => {
    expect(generateBacking({ ...getSequence('l1-ex-s6')!, backing: 'none' })).toEqual([]);
  });
});
