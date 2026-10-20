import { Note } from 'tonal';

/** 標準調音的空弦 MIDI 音高；索引 = 弦號（1 = 高音 E）。 */
export const STANDARD_TUNING: Readonly<Record<StringNumber, number>> = {
  1: 64,
  2: 59,
  3: 55,
  4: 50,
  5: 45,
  6: 40,
};

export type StringNumber = 1 | 2 | 3 | 4 | 5 | 6;
export const STRINGS: readonly StringNumber[] = [1, 2, 3, 4, 5, 6];
export const MAX_FRET = 22;

export interface FretPos {
  string: StringNumber;
  fret: number;
}

export function midiAt(string: StringNumber, fret: number): number {
  return STANDARD_TUNING[string] + fret;
}

export function chromaOfMidi(midi: number): number {
  return ((midi % 12) + 12) % 12;
}

export function chromaAt(string: StringNumber, fret: number): number {
  return chromaOfMidi(midiAt(string, fret));
}

/** 音名（不含八度）。preferFlats 用於降記號調性。 */
export function noteNameOfChroma(chroma: number, preferFlats = false): string {
  const sharps = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  const flats = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];
  return (preferFlats ? flats : sharps)[chromaOfMidi(chroma)];
}

export function noteNameAt(string: StringNumber, fret: number, preferFlats = false): string {
  return noteNameOfChroma(chromaAt(string, fret), preferFlats);
}

export function chromaOf(noteName: string): number {
  const c = Note.chroma(noteName);
  if (c === undefined || Number.isNaN(c)) throw new Error(`Unknown note: ${noteName}`);
  return c;
}

/** 指定品格範圍內，所有屬於 chromas 的位置。 */
export function positionsOf(
  chromas: readonly number[],
  fromFret = 0,
  toFret = MAX_FRET,
): FretPos[] {
  const set = new Set(chromas);
  const out: FretPos[] = [];
  for (const string of STRINGS) {
    for (let fret = Math.max(0, fromFret); fret <= Math.min(MAX_FRET, toFret); fret++) {
      if (set.has(chromaAt(string, fret))) out.push({ string, fret });
    }
  }
  return out;
}

/** 所有可以彈出某個 MIDI 音高的位置。 */
export function positionsOfMidi(midi: number, fromFret = 0, toFret = MAX_FRET): FretPos[] {
  const out: FretPos[] = [];
  for (const string of STRINGS) {
    const fret = midi - STANDARD_TUNING[string];
    if (fret >= Math.max(0, fromFret) && fret <= Math.min(MAX_FRET, toFret)) {
      out.push({ string, fret });
    }
  }
  return out;
}
