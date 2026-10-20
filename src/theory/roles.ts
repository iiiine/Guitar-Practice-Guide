import { chromaAt, chromaOfMidi, positionsOf, type FretPos } from './fretboard';
import { getChord, type ScaleInfo } from './harmony';

/** 音的層級：根音 > 和弦組成音 > 音階音 > 經過音。 */
export type NoteRole = 'root' | 'chordTone' | 'scaleTone' | 'passing';

export const ROLE_RANK: Record<NoteRole, number> = {
  root: 3,
  chordTone: 2,
  scaleTone: 1,
  passing: 0,
};

/**
 * 依當下和弦與調性推算角色。
 * 有和弦時「根音」指和弦根音；沒有和弦時指調性主音。
 */
export function inferRole(
  midi: number,
  scale: ScaleInfo,
  chordSymbol: string | undefined,
): NoteRole {
  const chroma = chromaOfMidi(midi);
  if (chordSymbol) {
    const chord = getChord(chordSymbol);
    if (chroma === chord.rootChroma) return 'root';
    if (chord.chromas.includes(chroma)) return 'chordTone';
  } else if (chroma === scale.chromas[0]) {
    return 'root';
  }
  return scale.chromas.includes(chroma) ? 'scaleTone' : 'passing';
}

export function isChordTone(midi: number, chordSymbol: string): boolean {
  return getChord(chordSymbol).chromas.includes(chromaOfMidi(midi));
}

export interface LandingPoint extends FretPos {
  role: 'root' | 'chordTone';
}

/** 安全落點：品格範圍內，目前和弦的根音與組成音。 */
export function landingPoints(chordSymbol: string, fromFret: number, toFret: number): LandingPoint[] {
  const chord = getChord(chordSymbol);
  return positionsOf(chord.chromas, fromFret, toFret).map((p) => ({
    ...p,
    role: chromaAt(p.string, p.fret) === chord.rootChroma ? 'root' : 'chordTone',
  }));
}

