import { chordAt, nextChordAfter, sequenceLength, type ChordSpan, type EventSequence, type NoteEvent } from '../sequence/types';
import { chromaOf, getChord, MAX_FRET } from '../theory';

/** 指板視覺狀態推導（純函式）：從序列與目前拍點算出該畫什麼。 */

export interface TrailNote {
  e: NoteEvent;
  /** 1 = 剛彈完，0 = 即將消失 */
  fade: number;
}

export interface VisualState {
  current: NoteEvent[];
  next: NoteEvent[];
  trail: TrailNote[];
  chord?: ChordSpan;
  nextChord?: ChordSpan;
  /** 音程配色與標籤的基準：目前和弦根音，沒有和弦時是調性主音 */
  referenceChroma: number;
}

const MIN_VISIBLE = 0.2;
const TRAIL_BEATS = 1.5;
const MAX_TRAIL = 6;

export function computeVisual(seq: EventSequence, beat: number): VisualState {
  const events = seq.events;
  const current = events.filter((e) => beat >= e.start - 1e-6 && beat < e.start + Math.max(e.duration, MIN_VISIBLE));
  const future = events.filter((e) => e.start > beat + 1e-6);
  let next: NoteEvent[] = [];
  if (future.length > 0) {
    const t = Math.min(...future.map((e) => e.start));
    next = future.filter((e) => Math.abs(e.start - t) < 1e-6);
  } else if (events.length > 0 && beat >= 0) {
    const t = Math.min(...events.map((e) => e.start));
    next = events.filter((e) => Math.abs(e.start - t) < 1e-6 && !current.includes(e));
  }
  const trail = events
    .filter((e) => !current.includes(e))
    .map((e) => ({ e, ago: beat - (e.start + Math.max(e.duration, MIN_VISIBLE)) }))
    .filter((x) => x.ago >= 0 && x.ago < TRAIL_BEATS)
    .sort((a, b) => a.ago - b.ago)
    .slice(0, MAX_TRAIL)
    .map((x) => ({ e: x.e, fade: 1 - x.ago / TRAIL_BEATS }));

  const chord = chordAt(seq, Math.max(0, beat));
  const nextChord = seq.chords.length > 1 ? nextChordAfter(seq, Math.max(0, beat)) : undefined;
  const referenceChroma = chord ? getChord(chord.symbol).rootChroma : chromaOf(seq.key);
  return { current, next, trail, chord, nextChord, referenceChroma };
}

export const VIEW_FRETS = 13;

/** 靜態視窗：序列整體放得下就固定，避免畫面亂跳。 */
export function staticWindow(seq: EventSequence, width = VIEW_FRETS): { from: number; to: number } | null {
  const frets = [...seq.events.map((e) => e.fret), seq.position.from, seq.position.to];
  const lo = Math.min(...frets);
  const hi = Math.max(...frets);
  if (hi - lo + 2 > width) return null;
  const from = clampFrom(Math.round((lo + hi) / 2 - width / 2) + 1, width);
  return { from, to: from + width - 1 };
}

function clampFrom(from: number, width: number): number {
  return Math.max(0, Math.min(MAX_FRET + 1 - width, from));
}

/** 自動追焦：目前與接下來兩拍的音都要在視窗內。 */
export function followWindow(
  seq: EventSequence,
  beat: number,
  prevFrom: number,
  width = VIEW_FRETS,
): { from: number; to: number } {
  const fixed = staticWindow(seq, width);
  if (fixed) return fixed;
  const len = sequenceLength(seq);
  const look = seq.events.filter((e) => e.start + e.duration > beat - 0.01 && e.start < beat + 2);
  const focus = look.length > 0 ? look : seq.events.filter((e) => e.start >= beat).slice(0, 1);
  if (focus.length === 0 || beat > len) return { from: prevFrom, to: prevFrom + width - 1 };
  const lo = Math.min(...focus.map((e) => e.fret));
  const hi = Math.max(...focus.map((e) => e.fret));
  if (lo >= prevFrom + 1 && hi <= prevFrom + width - 2) return { from: prevFrom, to: prevFrom + width - 1 };
  const from = clampFrom(Math.round((lo + hi) / 2 - width / 2) + 1, width);
  return { from, to: from + width - 1 };
}
