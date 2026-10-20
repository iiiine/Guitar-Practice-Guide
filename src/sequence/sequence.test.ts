import { describe, expect, it } from 'vitest';
import {
  arpeggio,
  assignRoles,
  changeRhythm,
  checkSequence,
  chordAt,
  chordChange,
  findAllNotes,
  jamSequence,
  rootFret,
  moveToPosition,
  nextChordAfter,
  scaleRun,
  sequenceLength,
  transpose,
  type EventSequence,
} from './index';

const phrase: EventSequence = {
  id: 'test',
  title: 'test',
  kind: 'phrase',
  key: 'A',
  scale: 'minor pentatonic',
  tempo: 80,
  timeSignature: [4, 4],
  chords: [{ symbol: 'Am', start: 0, end: 4 }],
  position: { from: 5, to: 8 },
  source: 'handwritten',
  events: [
    { string: 1, fret: 5, start: 0, duration: 1, finger: 1 }, // A
    { string: 1, fret: 8, start: 1, duration: 1, finger: 4 }, // C
    { string: 2, fret: 8, start: 2, duration: 1, finger: 4 }, // G — 強拍非和弦音
    { string: 2, fret: 5, start: 3, duration: 1, finger: 1 }, // E
  ],
};

describe('types helpers', () => {
  it('finds chords at beats and the next chord', () => {
    const seq = { chords: [{ symbol: 'A7', start: 0, end: 4 }, { symbol: 'D7', start: 4, end: 8 }] };
    expect(chordAt(seq, 3.9)?.symbol).toBe('A7');
    expect(chordAt(seq, 4)?.symbol).toBe('D7');
    expect(nextChordAfter(seq, 1)?.symbol).toBe('D7');
    expect(nextChordAfter(seq, 5)?.symbol).toBe('A7'); // 循環回開頭
  });

  it('rounds length up to whole bars', () => {
    expect(sequenceLength({ ...phrase, events: [{ string: 1, fret: 5, start: 4, duration: 0.5 }] })).toBe(8);
  });
});

describe('roles', () => {
  it('infers roles from chord and key, keeps manual roles', () => {
    const out = assignRoles({ ...phrase, events: [...phrase.events, { string: 3, fret: 7, start: 3.5, duration: 0.5, role: 'passing' }] });
    expect(out.events.map((e) => e.role)).toEqual(['root', 'chordTone', 'scaleTone', 'chordTone', 'passing']);
  });

  it('uses the bend target for roles', () => {
    const out = assignRoles({ ...phrase, events: [{ string: 3, fret: 7, start: 0, duration: 1, technique: [{ type: 'bend', amount: 2 }] }] });
    expect(out.events[0].role).toBe('chordTone'); // D → E
  });
});

describe('checker', () => {
  it('flags strong beats that are not chord tones', () => {
    const r = checkSequence(phrase);
    expect(r.ok).toBe(false);
    expect(r.issues.map((i) => i.rule)).toEqual(['strongBeat']);
  });

  it('flags out-of-scale notes unless marked chromatic', () => {
    const bad: EventSequence = { ...phrase, events: [phrase.events[0], { string: 3, fret: 8, start: 1.5, duration: 0.5, finger: 4 as const }, phrase.events[3]] };
    expect(checkSequence(bad).issues.map((i) => i.rule)).toContain('inScale');
    bad.events[1] = { ...bad.events[1], chromatic: true };
    expect(checkSequence(bad).ok).toBe(true);
  });

  it('flags wide hand shapes unless a shift is marked', () => {
    const wide: EventSequence = { ...phrase, events: [phrase.events[0], { string: 1, fret: 12, start: 1, duration: 3, finger: 4 as const }] };
    expect(checkSequence(wide).issues.map((i) => i.rule)).toContain('span');
    wide.events[1] = { ...wide.events[1], shift: true };
    expect(checkSequence(wide).ok).toBe(true);
  });

  it('flags crossed fingers and missing fingers', () => {
    const crossed = { ...phrase, events: [{ ...phrase.events[0], finger: 3 as const }, { ...phrase.events[1], finger: 1 as const }, phrase.events[3]] };
    expect(checkSequence(crossed).issues.map((i) => i.rule)).toContain('finger');
    const missing = { ...phrase, events: [{ ...phrase.events[0], finger: undefined }] };
    expect(checkSequence(missing).issues.map((i) => i.rule)).toContain('finger');
  });

  it('requires the phrase to end on a chord tone or root', () => {
    const r = checkSequence({ ...phrase, events: [phrase.events[0], { string: 3, fret: 7, start: 1, duration: 1, finger: 3 }] });
    expect(r.issues.map((i) => i.rule)).toContain('ending');
  });
});

describe('generators', () => {
  it('builds a pentatonic box run that starts and ends on the root and passes the checker', () => {
    const seq = scaleRun({ id: 'r', title: 'r', key: 'A', scale: 'minor pentatonic', from: 5, to: 8, startOnRoot: true });
    expect(seq.events[0]).toMatchObject({ string: 6, fret: 5, finger: 1 });
    expect(seq.events[seq.events.length - 1]).toMatchObject({ string: 6, fret: 5 });
    expect(checkSequence(seq)).toEqual({ ok: true, issues: [] });
  });

  it('builds arpeggios and chord-change exercises that pass the checker', () => {
    expect(checkSequence(arpeggio({ id: 'a', title: 'a', chord: 'C', key: 'C', scale: 'major', from: 2, to: 5 })).ok).toBe(true);
    const cc = chordChange({ id: 'c', title: 'c', key: 'C', scale: 'major', from: 5, to: 8, progression: ['C', 'Am', 'F', 'G'] });
    expect(cc.events).toHaveLength(16);
    expect(checkSequence({ ...cc, kind: 'phrase' }).issues.filter((i) => i.rule === 'strongBeat')).toEqual([]);
  });

  it('finds every A in the first 12 frets', () => {
    const seq = findAllNotes({ id: 'f', title: 'f', note: 'A' });
    expect(seq.events.map((e) => `${e.string}:${e.fret}`)).toEqual(["6:5", "5:0", "5:12", "4:7", "3:2", "2:10", "1:5"]);
    expect(checkSequence(seq).ok).toBe(true);
  });
});

describe('variations', () => {
  const good: EventSequence = { ...phrase, events: [phrase.events[0], phrase.events[1], { string: 2, fret: 5, start: 2, duration: 2, finger: 1 }] };

  it('transposes frets, key and chords', () => {
    const t = transpose(good, 2)!;
    expect(t.key).toBe('B');
    expect(t.chords[0].symbol).toBe('Bm');
    expect(t.events[0].fret).toBe(7);
  });

  it('moves a phrase to a new position keeping pitches', () => {
    const moved = moveToPosition(good, 10)!;
    expect(moved).not.toBeNull();
    expect(moved.events[0]).toMatchObject({ string: 2, fret: 10 });
  });

  it('changes rhythm', () => {
    const half = changeRhythm(good, 'halfTime')!;
    expect(half.events[1].start).toBe(2);
    expect(half.chords[0].end).toBe(8);
    const eighths: EventSequence = { ...good, events: [{ ...good.events[0], duration: 0.5 }, { ...good.events[1], start: 0.5, duration: 0.5 }, { ...good.events[2], start: 2 }] };
    expect(changeRhythm(eighths, 'swing')!.events[1].start).toBeCloseTo(2 / 3);
  });
});

describe('jam generator', () => {
  it('realizes a 12-bar blues in E with the root on string 6 at fret 12', () => {
    const jam = jamSequence({ key: 'E', progressionId: 'blues12' });
    expect(jam.chords.map((c) => c.symbol).slice(0, 5)).toEqual(['E7', 'E7', 'E7', 'E7', 'A7']);
    expect(jam.chords).toHaveLength(12);
    expect(jam.position).toEqual({ from: 11, to: 15 });
    expect(jam.backing).toBe('blues-shuffle');
    expect(jam.swing).toBe(true);
  });

  it('spells minor keys the usual way', () => {
    const jam = jamSequence({ key: 'Db', progressionId: 'minorRock' });
    expect(jam.key).toBe('C#');
    expect(jam.chords.map((c) => c.symbol).slice(0, 4)).toEqual(['C#m', 'A', 'B', 'C#m']);
  });

  it('repeats short progressions and honours overrides', () => {
    const jam = jamSequence({ key: 'A', progressionId: 'minorRock', rootString: 5, style: 'ballad', scale: 'minor' });
    expect(jam.chords.map((c) => c.symbol)).toEqual(['Am', 'F', 'G', 'Am', 'Am', 'F', 'G', 'Am']);
    expect(rootFret('A', 5)).toBe(12);
    expect(jam.scale).toBe('minor');
    expect(jam.backing).toBe('ballad');
    expect(checkSequence(jam).ok).toBe(true);
  });
});

describe('jam generator: every combination is valid', () => {
  it('all keys × progressions × scales × root strings pass the checker and fit on the neck', async () => {
    const { JAM_KEYS, PROGRESSIONS } = await import('../theory');
    let n = 0;
    for (const key of JAM_KEYS)
      for (const p of PROGRESSIONS)
        for (const scale of p.scales)
          for (const rootString of [6, 5] as const) {
            const jam = jamSequence({ key, progressionId: p.id, scale, rootString });
            expect(checkSequence(jam).issues, jam.id).toEqual([]);
            expect(jam.position.from).toBeGreaterThanOrEqual(1);
            expect(jam.position.to).toBeLessThanOrEqual(22);
            n++;
          }
    expect(n).toBeGreaterThan(500);
  });
});
