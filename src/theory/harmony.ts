import { Chord, Scale } from 'tonal';
import { chromaOf, chromaOfMidi } from './fretboard';

export interface ScaleInfo {
  tonic: string;
  name: string;
  notes: string[];
  chromas: number[];
}

export function getScale(tonic: string, scaleName: string): ScaleInfo {
  const s = Scale.get(`${tonic} ${scaleName}`);
  if (s.empty) throw new Error(`Unknown scale: ${tonic} ${scaleName}`);
  return { tonic, name: scaleName, notes: s.notes, chromas: s.notes.map(chromaOf) };
}

export interface ChordInfo {
  symbol: string;
  root: string;
  rootChroma: number;
  notes: string[];
  chromas: number[];
}

const chordCache = new Map<string, ChordInfo>();

export function getChord(symbol: string): ChordInfo {
  const cached = chordCache.get(symbol);
  if (cached) return cached;
  const c = Chord.get(symbol);
  if (c.empty || !c.tonic) throw new Error(`Unknown chord: ${symbol}`);
  const info: ChordInfo = {
    symbol,
    root: c.tonic,
    rootChroma: chromaOf(c.tonic),
    notes: c.notes,
    chromas: c.notes.map(chromaOf),
  };
  chordCache.set(symbol, info);
  return info;
}

const INTERVAL_LABELS = ['1', 'b2', '2', 'b3', '3', '4', 'b5', '5', 'b6', '6', 'b7', '7'];

/** 以 rootChroma 為基準的音程標籤（1、b3、5…）。 */
export function intervalLabel(chroma: number, rootChroma: number): string {
  return INTERVAL_LABELS[chromaOfMidi(chroma - rootChroma)];
}

/** 0–11 的半音距離，用於固定配色。 */
export function semitonesFrom(chroma: number, rootChroma: number): number {
  return chromaOfMidi(chroma - rootChroma);
}

export interface ScaleDiff {
  /** b 有、a 沒有的音 */
  added: string[];
  /** a 有、b 沒有的音 */
  removed: string[];
  shared: string[];
}

/** 「跟誰有關」：比較兩個音階差在哪幾個音。 */
export function compareScales(a: ScaleInfo, b: ScaleInfo): ScaleDiff {
  const aSet = new Set(a.chromas);
  const bSet = new Set(b.chromas);
  return {
    added: b.notes.filter((_, i) => !aSet.has(b.chromas[i])),
    removed: a.notes.filter((_, i) => !bSet.has(a.chromas[i])),
    shared: b.notes.filter((_, i) => aSet.has(b.chromas[i])),
  };
}

/** 小調系音階（小調、五聲小調、藍調、Dorian…）。 */
export function isMinorScale(scaleName: string): boolean {
  return /minor|blues|dorian|phrygian|aeolian|locrian/.test(scaleName) && !/major/.test(scaleName);
}

/** 調性名稱是否慣用降記號。 */
export function prefersFlats(tonic: string, scaleName: string): boolean {
  if (tonic.includes('b')) return true;
  const minorish = isMinorScale(scaleName);
  const flatMajors = ['F'];
  const flatMinors = ['D', 'G', 'C', 'F'];
  return minorish ? flatMinors.includes(tonic) : flatMajors.includes(tonic);
}
