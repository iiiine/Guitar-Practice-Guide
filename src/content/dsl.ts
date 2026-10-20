import type { PracticeItem } from '../practice/types';
import type {
  BackingStyle,
  ChordSpan,
  EventSequence,
  Finger,
  NoteEvent,
  StringNumber,
  Technique,
} from '../sequence/types';

/** 撰寫內容用的小工具，讓樂句資料保持精簡可讀。 */

/** shuffle 八分音符：長 = 2/3 拍、短 = 1/3 拍 */
export const L = 2 / 3;
export const S = 1 / 3;

export function n(
  string: StringNumber,
  fret: number,
  start: number,
  duration: number,
  finger: Finger,
  extra: Partial<NoteEvent> = {},
): NoteEvent {
  return { string, fret, start, duration, finger, ...extra };
}

export const bend = (amount: number): Technique[] => [{ type: 'bend', amount }];
export const slide = (toFret: number): Technique[] => [{ type: 'slide', toFret }];
export const vib: Technique[] = [{ type: 'vibrato' }];

/** 每個和弦佔 beatsPer 拍的和弦時間軸 */
export function bars(symbols: string[], beatsPer = 4): ChordSpan[] {
  return symbols.map((symbol, i) => ({ symbol, start: i * beatsPer, end: (i + 1) * beatsPer }));
}

/** 合併相鄰的同名和弦（12 小節藍調等） */
export function mergeChords(spans: ChordSpan[]): ChordSpan[] {
  const out: ChordSpan[] = [];
  for (const c of spans) {
    const last = out[out.length - 1];
    if (last && last.symbol === c.symbol && Math.abs(last.end - c.start) < 1e-9) last.end = c.end;
    else out.push({ ...c });
  }
  return out;
}

export function offset(events: NoteEvent[], by: number): NoteEvent[] {
  return events.map((e) => ({ ...e, start: e.start + by }));
}

export const BLUES_12_A = ['A7', 'A7', 'A7', 'A7', 'D7', 'D7', 'A7', 'A7', 'E7', 'D7', 'A7', 'E7'];

interface PhraseMeta {
  id: string;
  title: string;
  key: string;
  scale: string;
  tempo: number;
  chords: ChordSpan[];
  position: { from: number; to: number };
  events: NoteEvent[];
  backing?: BackingStyle;
  swing?: boolean;
  tip?: string;
  length?: number;
}

/** 手寫原創樂句 */
export function phrase(meta: PhraseMeta): EventSequence {
  return {
    kind: 'phrase',
    source: 'handwritten',
    timeSignature: [4, 4],
    backing: 'rock',
    ...meta,
  };
}

/** 沒有音符的伴奏序列：只靠指板落點引導即興（應用練習）。 */
export function jam(meta: Omit<PhraseMeta, 'events'>): EventSequence {
  return { kind: 'exercise', source: 'handwritten', timeSignature: [4, 4], backing: 'rock', events: [], ...meta };
}

export function item(
  id: string,
  title: string,
  kind: PracticeItem['kind'],
  opts: { lessonId?: string; genreId?: string; minutes?: number; startBpm: number; targetBpm: number; sequenceId?: string },
): PracticeItem {
  return {
    id,
    title,
    kind,
    sequenceId: opts.sequenceId ?? id,
    lessonId: opts.lessonId,
    genreId: opts.genreId,
    minutes: opts.minutes ?? 5,
    startBpm: opts.startBpm,
    targetBpm: opts.targetBpm,
  };
}
