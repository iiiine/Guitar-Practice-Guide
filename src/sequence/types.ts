import type { NoteRole, StringNumber } from '../theory';

export type { NoteRole, StringNumber };

export type Technique =
  | { type: 'bend'; /** 半音數，1 = 半音、2 = 全音 */ amount: number; release?: boolean }
  | { type: 'slide'; toFret: number }
  | { type: 'hammer' }
  | { type: 'pull' }
  | { type: 'vibrato' }
  | { type: 'mute' }
  | { type: 'ghost' };

export type Finger = 0 | 1 | 2 | 3 | 4; // 0 = 拇指

export interface NoteEvent {
  /** 1 = 高音 E */
  string: StringNumber;
  /** 0 = 空弦 */
  fret: number;
  /** 以拍為單位 */
  start: number;
  duration: number;
  finger?: Finger;
  /** 未標註時由 assignRoles() 推算；手動標註優先 */
  role?: NoteRole;
  technique?: Technique[];
  /** 刻意的音階外半音（藍調音等），檢查器會放行 */
  chromatic?: boolean;
  /** 此音開始換把位（新手型），檢查器以此切分手型 */
  shift?: boolean;
  /** 為樂譜匯入預留 */
  tie?: 'start' | 'stop' | 'continue';
  tuplet?: { actual: number; normal: number };
  voice?: number;
}

export interface ChordSpan {
  symbol: string;
  /** 起訖拍點（含起、不含訖） */
  start: number;
  end: number;
}

export type SequenceSource = 'handwritten' | 'rule' | 'ai' | 'import';
export type SequenceKind = 'phrase' | 'exercise';
export type BackingStyle = 'none' | 'blues-shuffle' | 'rock' | 'ballad';

export interface EventSequence {
  id: string;
  title: string;
  kind: SequenceKind;
  /** 調性主音，例如 'A' */
  key: string;
  /** tonal 音階名稱，例如 'minor pentatonic' */
  scale: string;
  tempo: number;
  timeSignature: [number, number];
  chords: ChordSpan[];
  position: { from: number; to: number };
  source: SequenceSource;
  events: NoteEvent[];
  /** 序列總長（拍）；省略時取最後一個音或和弦結束點，並補滿小節 */
  length?: number;
  backing?: BackingStyle;
  /** 使用 shuffle（三連音）律動播放伴奏與節拍器 */
  swing?: boolean;
  /** 給使用者的一句話提示 */
  tip?: string;
}

export function beatsPerBar(seq: Pick<EventSequence, 'timeSignature'>): number {
  return seq.timeSignature[0] * (4 / seq.timeSignature[1]);
}

export function sequenceLength(seq: EventSequence): number {
  if (seq.length !== undefined) return seq.length;
  const lastNote = seq.events.reduce((m, e) => Math.max(m, e.start + e.duration), 0);
  const lastChord = seq.chords.reduce((m, c) => Math.max(m, c.end), 0);
  const bar = beatsPerBar(seq);
  return Math.max(bar, Math.ceil(Math.max(lastNote, lastChord) / bar - 1e-9) * bar);
}

export function chordAt(seq: Pick<EventSequence, 'chords'>, beat: number): ChordSpan | undefined {
  return seq.chords.find((c) => beat >= c.start - 1e-9 && beat < c.end - 1e-9);
}

export function nextChordAfter(seq: Pick<EventSequence, 'chords'>, beat: number): ChordSpan | undefined {
  const current = chordAt(seq, beat);
  const from = current ? current.end : beat;
  const sorted = [...seq.chords].sort((a, b) => a.start - b.start);
  const next = sorted.find((c) => c.start >= from - 1e-9 && c.symbol !== current?.symbol);
  // 循環時下一個和弦可能是開頭
  return next ?? (sorted[0] && sorted[0].symbol !== current?.symbol ? sorted[0] : undefined);
}

export function sortEvents(events: NoteEvent[]): NoteEvent[] {
  return [...events].sort((a, b) => a.start - b.start || b.string - a.string);
}
