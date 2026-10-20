import {
  chromaOf,
  getChord,
  getProgression,
  keyName,
  realize,
  getScale,
  midiAt,
  positionsOf,
  STRINGS,
  type FretPos,
  type StringNumber,
} from '../theory';
import type { BackingStyle, ChordSpan, EventSequence, Finger, NoteEvent } from './types';

/**
 * 規則式來源：音階、琶音、和弦轉換、認音等練習。
 * 輸出與手寫樂句同一種事件序列，且同樣要通過檢查器。
 */

/** 一指一品：食指放在 from。五品跨度時相鄰品可共用手指。 */
export function fingerFor(fret: number, from: number): Finger {
  if (fret === 0) return 0;
  const offset = fret - from;
  return Math.min(4, Math.max(1, offset + 1)) as Finger;
}

/** 依音高排序並去除重複音高（保留品格較低者，較早換弦）。 */
function ascendingUnique(positions: FretPos[]): FretPos[] {
  const byMidi = new Map<number, FretPos>();
  for (const p of positions) {
    const m = midiAt(p.string, p.fret);
    const prev = byMidi.get(m);
    if (!prev || p.fret < prev.fret) byMidi.set(m, p);
  }
  return [...byMidi.entries()].sort((a, b) => a[0] - b[0]).map(([, p]) => p);
}

interface Common {
  id: string;
  title: string;
  tempo?: number;
  backing?: BackingStyle;
  tip?: string;
}

function toEvents(path: FretPos[], from: number, step: number): NoteEvent[] {
  return path.map((p, i) => ({
    string: p.string,
    fret: p.fret,
    start: i * step,
    duration: step,
    finger: fingerFor(p.fret, from),
  }));
}

function upDown<T>(xs: T[]): T[] {
  return [...xs, ...xs.slice(0, -1).reverse()];
}

/** 把位內音階上下行。可指定從最低的主音開始，讓起點與終點都是根音。 */
export function scaleRun(
  opts: Common & {
    key: string;
    scale: string;
    from: number;
    to: number;
    step?: number;
    startOnRoot?: boolean;
    chords?: ChordSpan[];
  },
): EventSequence {
  const scale = getScale(opts.key, opts.scale);
  let path = ascendingUnique(positionsOf(scale.chromas, opts.from, opts.to));
  if (opts.startOnRoot) {
    const tonic = chromaOf(opts.key);
    const first = path.findIndex((p) => midiAt(p.string, p.fret) % 12 === tonic);
    const last = path.length - 1 - [...path].reverse().findIndex((p) => midiAt(p.string, p.fret) % 12 === tonic);
    path = path.slice(first, last + 1);
  }
  const step = opts.step ?? 0.5;
  const events = toEvents(upDown(path), opts.from, step);
  return {
    id: opts.id,
    title: opts.title,
    kind: 'exercise',
    key: opts.key,
    scale: opts.scale,
    tempo: opts.tempo ?? 70,
    timeSignature: [4, 4],
    chords: opts.chords ?? [],
    position: { from: opts.from, to: opts.to },
    source: 'rule',
    events,
    backing: opts.backing ?? 'none',
    tip: opts.tip,
  };
}

/** 把位內單一和弦琶音上下行。 */
export function arpeggio(
  opts: Common & { chord: string; key: string; scale: string; from: number; to: number; step?: number },
): EventSequence {
  const chord = getChord(opts.chord);
  const all = ascendingUnique(positionsOf(chord.chromas, opts.from, opts.to));
  const first = all.findIndex((p) => midiAt(p.string, p.fret) % 12 === chord.rootChroma);
  const lastFromEnd = [...all].reverse().findIndex((p) => midiAt(p.string, p.fret) % 12 === chord.rootChroma);
  const path = all.slice(first, all.length - lastFromEnd);
  const step = opts.step ?? 0.5;
  const events = toEvents(upDown(path), opts.from, step);
  const length = Math.ceil((events.length * step) / 4) * 4;
  return {
    id: opts.id,
    title: opts.title,
    kind: 'exercise',
    key: opts.key,
    scale: opts.scale,
    tempo: opts.tempo ?? 70,
    timeSignature: [4, 4],
    chords: [{ symbol: opts.chord, start: 0, end: length }],
    position: { from: opts.from, to: opts.to },
    source: 'rule',
    events,
    backing: opts.backing ?? 'none',
    tip: opts.tip,
  };
}

/**
 * 和弦轉換：每個和弦彈四分音符的和弦音，換和弦時走「最近的」和弦音（聲部導進），
 * 練習在同一把位內跟著和弦換落點。
 */
export function chordChange(
  opts: Common & {
    key: string;
    scale: string;
    from: number;
    to: number;
    progression: string[];
    beatsPerChord?: number;
  },
): EventSequence {
  const per = opts.beatsPerChord ?? 4;
  const chords: ChordSpan[] = opts.progression.map((symbol, i) => ({ symbol, start: i * per, end: (i + 1) * per }));
  const events: NoteEvent[] = [];
  let prevMidi: number | undefined;
  let dir = 1;
  chords.forEach((c) => {
    const chord = getChord(c.symbol);
    const tones = ascendingUnique(positionsOf(chord.chromas, opts.from, opts.to));
    const midis = tones.map((p) => midiAt(p.string, p.fret));
    let idx: number;
    if (prevMidi === undefined) {
      idx = midis.findIndex((m) => m % 12 === chord.rootChroma);
    } else {
      const target = prevMidi;
      idx = midis.reduce((best, m, i) => (Math.abs(m - target) < Math.abs(midis[best] - target) ? i : best), 0);
    }
    for (let b = 0; b < per; b++) {
      if (idx + dir >= tones.length || idx + dir < 0) dir = -dir;
      const p = tones[idx];
      events.push({ string: p.string, fret: p.fret, start: c.start + b, duration: 1, finger: fingerFor(p.fret, opts.from) });
      prevMidi = midis[idx];
      if (b < per - 1) idx += dir;
    }
  });
  return {
    id: opts.id,
    title: opts.title,
    kind: 'exercise',
    key: opts.key,
    scale: opts.scale,
    tempo: opts.tempo ?? 70,
    timeSignature: [4, 4],
    chords,
    position: { from: opts.from, to: opts.to },
    source: 'rule',
    events,
    backing: opts.backing ?? 'rock',
    tip: opts.tip,
  };
}

/** 認音：依弦序（低音弦到高音弦）彈出 0–12 品所有指定的音，每個音都是一次換位。 */
export function findAllNotes(opts: Common & { note: string; toFret?: number; step?: number }): EventSequence {
  const chroma = chromaOf(opts.note);
  const step = opts.step ?? 2;
  const positions: FretPos[] = [];
  for (const s of [...STRINGS].reverse() as StringNumber[]) {
    for (let f = 0; f <= (opts.toFret ?? 12); f++) {
      if (midiAt(s, f) % 12 === chroma) positions.push({ string: s, fret: f });
    }
  }
  const events: NoteEvent[] = positions.map((p, i) => ({
    string: p.string,
    fret: p.fret,
    start: i * step,
    duration: step,
    finger: p.fret === 0 ? 0 : 1,
    shift: true,
  }));
  return {
    id: opts.id,
    title: opts.title,
    kind: 'exercise',
    key: opts.note,
    scale: 'major',
    tempo: opts.tempo ?? 60,
    timeSignature: [4, 4],
    chords: [],
    position: { from: 0, to: opts.toFret ?? 12 },
    source: 'rule',
    events,
    backing: 'none',
    tip: opts.tip,
  };
}

/** 單弦自然音（不含升降），練習記住一條弦上的音名。 */
export function naturalNotesOnString(opts: Common & { string: StringNumber; toFret?: number }): EventSequence {
  const naturals = [0, 2, 4, 5, 7, 9, 11];
  const frets: number[] = [];
  for (let f = 0; f <= (opts.toFret ?? 12); f++) {
    if (naturals.includes(midiAt(opts.string, f) % 12)) frets.push(f);
  }
  const path = upDown(frets);
  const events: NoteEvent[] = path.map((f, i) => ({
    string: opts.string,
    fret: f,
    start: i,
    duration: 1,
    finger: f === 0 ? 0 : 1,
    shift: true,
  }));
  return {
    id: opts.id,
    title: opts.title,
    kind: 'exercise',
    key: 'C',
    scale: 'major',
    tempo: opts.tempo ?? 60,
    timeSignature: [4, 4],
    chords: [],
    position: { from: 0, to: opts.toFret ?? 12 },
    source: 'rule',
    events,
    backing: 'none',
    tip: opts.tip,
  };
}

export interface JamOptions {
  key: string;
  progressionId: string;
  scale?: string;
  style?: BackingStyle;
  tempo?: number;
  /** 把位：根音放在第 6 弦或第 5 弦 */
  rootString?: 6 | 5;
  /** 重複幾遍和弦進行 */
  repeats?: number;
}

/** 根音在指定弦上的品格（太靠近琴枕時往上一個八度，避開空弦把位）。 */
export function rootFret(key: string, string: StringNumber): number {
  const fret = (chromaOf(key) - (midiAt(string, 0) % 12) + 12) % 12;
  return fret < 2 ? fret + 12 : fret;
}

/** 即興練習室：自選調、和弦進行、曲風、音階的伴奏序列（沒有音符，靠指板落點引導）。 */
export function jamSequence(opts: JamOptions): EventSequence {
  const template = getProgression(opts.progressionId);
  const key = keyName(opts.key, template.minor);
  const chords = realize(template, key);
  const repeats = opts.repeats ?? (chords.length >= 12 ? 1 : 2);
  const bars = Array.from({ length: repeats }, () => chords).flat();
  const r = rootFret(opts.key, opts.rootString ?? 6);
  const scale = opts.scale ?? template.scales[0];
  return {
    id: `jam:${opts.key}:${opts.progressionId}:${scale}:${opts.rootString ?? 6}`,
    title: `${key}${template.minor ? 'm' : ''} · ${chords.join(' – ')}`,
    kind: 'exercise',
    key,
    scale,
    tempo: opts.tempo ?? template.defaultTempo,
    timeSignature: [4, 4],
    chords: bars.map((symbol, i) => ({ symbol, start: i * 4, end: (i + 1) * 4 })),
    position: { from: r - 1, to: r + 3 },
    source: 'rule',
    events: [],
    backing: opts.style ?? template.style,
    swing: (opts.style ?? template.style) === 'blues-shuffle',
  };
}
