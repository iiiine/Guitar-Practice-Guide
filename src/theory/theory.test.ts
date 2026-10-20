import { describe, expect, it } from 'vitest';
import {
  chromaAt,
  displayKey,
  compareScales,
  getChord,
  getScale,
  getProgression,
  inferRole,
  intervalLabel,
  landingPoints,
  midiAt,
  noteNameAt,
  positionsOf,
  positionsOfMidi,
  realize,
} from './index';

describe('fretboard', () => {
  it('maps string 1 to high E and string 6 to low E', () => {
    expect(midiAt(1, 0)).toBe(64);
    expect(midiAt(6, 0)).toBe(40);
    expect(noteNameAt(6, 5)).toBe('A');
    expect(noteNameAt(5, 3)).toBe('C');
    expect(noteNameAt(2, 1)).toBe('C');
    expect(chromaAt(3, 2)).toBe(9);
  });

  it('finds scale positions inside a fret box', () => {
    const am = getScale('A', 'minor pentatonic');
    const box = positionsOf(am.chromas, 5, 8);
    expect(box).toHaveLength(12);
    expect(box.filter((p) => p.string === 6).map((p) => p.fret)).toEqual([5, 8]);
  });

  it('finds every place a pitch can be played', () => {
    expect(positionsOfMidi(64, 0, 12).map((p) => `${p.string}:${p.fret}`)).toEqual(['1:0', '2:5', '3:9']);
  });
});

describe('harmony', () => {
  it('labels intervals relative to a root', () => {
    expect(intervalLabel(0, 9)).toBe('b3'); // C over A
    expect(intervalLabel(4, 9)).toBe('5');
    expect(intervalLabel(3, 9)).toBe('b5');
  });

  it('compares scales', () => {
    const pent = getScale('A', 'minor pentatonic');
    const blues = getScale('A', 'blues');
    const diff = compareScales(pent, blues);
    expect(diff.added).toEqual(['Eb']);
    expect(diff.removed).toEqual([]);
  });
});

describe('roles', () => {
  const blues = getScale('A', 'blues');
  it('prefers chord root, then chord tone, then scale tone, then passing', () => {
    expect(inferRole(midiAt(6, 5), blues, 'A7')).toBe('root');
    expect(inferRole(midiAt(5, 7), blues, 'A7')).toBe('chordTone'); // E
    expect(inferRole(midiAt(4, 5), blues, 'A7')).toBe('chordTone'); // G = b7
    expect(inferRole(midiAt(4, 7), blues, 'D7')).toBe('chordTone'); // A over D7
    expect(inferRole(midiAt(3, 7), blues, 'A7')).toBe('scaleTone'); // D
    expect(inferRole(midiAt(3, 8), getScale('A', 'minor pentatonic'), 'A7')).toBe('passing'); // Eb
  });

  it('uses the key tonic as root when there is no chord', () => {
    const g = getScale('G', 'major');
    expect(inferRole(midiAt(6, 3), g, undefined)).toBe('root');
    expect(inferRole(midiAt(6, 2), g, undefined)).toBe('scaleTone');
    expect(inferRole(midiAt(6, 1), g, undefined)).toBe('passing');
  });

  it('computes landing points for a chord', () => {
    const pts = landingPoints('A7', 5, 8);
    expect(pts.some((p) => p.string === 6 && p.fret === 5 && p.role === 'root')).toBe(true);
    expect(pts.every((p) => getChord('A7').chromas.includes(chromaAt(p.string, p.fret)))).toBe(true);
  });
});

describe('progressions', () => {
  it('realizes roman numerals in any key with readable spelling', () => {
    expect(realize(getProgression('pop'), 'C')).toEqual(['C', 'G', 'Am', 'F']);
    expect(realize(getProgression('minorRock'), 'Eb')).toEqual(['Ebm', 'B', 'Db', 'Ebm']);
    expect(realize(getProgression('blues12'), 'F#').slice(8)).toEqual(['C#7', 'B7', 'F#7', 'C#7']);
  });

  it('調名依音階決定拼法', () => {
    expect(displayKey('Db', 'blues')).toBe('C#');
    expect(displayKey('Ab', 'minor pentatonic')).toBe('G#');
    expect(displayKey('Db', 'major')).toBe('Db');
  });
});
