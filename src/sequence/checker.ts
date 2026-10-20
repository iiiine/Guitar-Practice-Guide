import { chromaOfMidi, getChord, getScale, MAX_FRET, midiAt } from '../theory';
import { assignRoles, targetMidi } from './roles';
import { beatsPerBar, chordAt, sortEvents, type EventSequence, type NoteEvent } from './types';

export type CheckRule =
  | 'fretRange'
  | 'inScale'
  | 'strongBeat'
  | 'ending'
  | 'span'
  | 'finger'
  | 'passing'
  | 'unknownChord';

export interface CheckIssue {
  rule: CheckRule;
  /** 對應 seq.events 的索引（排序後） */
  eventIndex?: number;
  detail: string;
}

export interface CheckResult {
  ok: boolean;
  issues: CheckIssue[];
}

const MAX_SPAN = 4;
const MAX_PASSING_DURATION = 1;
const EPS = 1e-6;

function isStrongBeat(start: number, bar: number): boolean {
  const pos = ((start % bar) + bar) % bar;
  if (Math.abs(pos) < EPS || Math.abs(pos - bar) < EPS) return true;
  return bar % 2 === 0 && Math.abs(pos - bar / 2) < EPS;
}

function isSilentish(e: NoteEvent): boolean {
  return !!e.technique?.some((t) => t.type === 'mute' || t.type === 'ghost');
}

function describe(e: NoteEvent, i: number): string {
  return `#${i} (string ${e.string} fret ${e.fret} @${e.start})`;
}

/** 依 shift 標記把音符切成手型段落。 */
export function handShapes(events: NoteEvent[]): NoteEvent[][] {
  const shapes: NoteEvent[][] = [];
  for (const e of events) {
    if (shapes.length === 0 || e.shift) shapes.push([]);
    shapes[shapes.length - 1].push(e);
  }
  return shapes;
}

/** 樂句檢查器：所有內容（手寫、規則式、AI、匯入）上線前都要通過。 */
export function checkSequence(input: EventSequence): CheckResult {
  const issues: CheckIssue[] = [];
  const seq = assignRoles({ ...input, events: sortEvents(input.events) });
  const scale = getScale(seq.key, seq.scale);
  const bar = beatsPerBar(seq);
  const events = seq.events;
  const strict = seq.kind === 'phrase';

  for (const c of seq.chords) {
    try {
      getChord(c.symbol);
    } catch {
      issues.push({ rule: 'unknownChord', detail: `unknown chord ${c.symbol}` });
      return { ok: false, issues };
    }
  }

  events.forEach((e, i) => {
    if (e.fret < 0 || e.fret > MAX_FRET) {
      issues.push({ rule: 'fretRange', eventIndex: i, detail: `${describe(e, i)} out of fret range` });
    }

    // 1. 音階內（刻意半音須標註）
    if (!e.chromatic) {
      const pitches = [midiAt(e.string, e.fret), targetMidi(e)];
      const slide = e.technique?.find((t) => t.type === 'slide');
      if (slide && slide.type === 'slide') pitches.push(midiAt(e.string, slide.toFret));
      for (const p of pitches) {
        if (!scale.chromas.includes(chromaOfMidi(p))) {
          issues.push({ rule: 'inScale', eventIndex: i, detail: `${describe(e, i)} not in ${seq.key} ${seq.scale}` });
          break;
        }
      }
    }

    // 2. 強拍落和弦音
    const chord = chordAt(seq, e.start);
    if (strict && chord && !isSilentish(e) && isStrongBeat(e.start, bar)) {
      const ok = getChord(chord.symbol).chromas.includes(chromaOfMidi(targetMidi(e)));
      if (!ok) {
        issues.push({ rule: 'strongBeat', eventIndex: i, detail: `${describe(e, i)} on strong beat is not a ${chord.symbol} chord tone` });
      }
    }

    // 6. 經過音不放長音
    if (strict && (e.role === 'passing' || e.chromatic) && e.duration > MAX_PASSING_DURATION + EPS) {
      issues.push({ rule: 'passing', eventIndex: i, detail: `${describe(e, i)} passing note too long (${e.duration})` });
    }

    // 5a. 手指編號範圍
    if (e.finger !== undefined && (e.finger < 0 || e.finger > 4 || !Number.isInteger(e.finger))) {
      issues.push({ rule: 'finger', eventIndex: i, detail: `${describe(e, i)} invalid finger ${e.finger}` });
    }
    if (strict && e.fret > 0 && e.finger === undefined) {
      issues.push({ rule: 'finger', eventIndex: i, detail: `${describe(e, i)} missing finger` });
    }
  });

  // 3. 結尾回到根音或和弦音
  if (strict && events.length > 0) {
    const lastStart = events[events.length - 1].start;
    const lastGroup = events.filter((e) => Math.abs(e.start - lastStart) < EPS);
    const chord = chordAt(seq, lastStart);
    const targets = new Set<number>([scale.chromas[0], ...(chord ? getChord(chord.symbol).chromas : [])]);
    if (!lastGroup.some((e) => targets.has(chromaOfMidi(targetMidi(e))))) {
      issues.push({ rule: 'ending', eventIndex: events.length - 1, detail: `last note does not resolve to a chord tone or the root` });
    }
    lastGroup.forEach((e) => {
      if (e.role === 'passing' || e.chromatic) {
        issues.push({ rule: 'passing', eventIndex: events.indexOf(e), detail: `${describe(e, events.indexOf(e))} passing note at phrase end` });
      }
    });
  }

  // 4 & 5b. 手型跨度與手指順序
  for (const shape of handShapes(events)) {
    const fretted = shape.filter((e) => e.fret > 0);
    if (fretted.length === 0) continue;
    const frets = fretted.map((e) => e.fret);
    const span = Math.max(...frets) - Math.min(...frets);
    if (span > MAX_SPAN) {
      const first = events.indexOf(shape[0]);
      issues.push({ rule: 'span', eventIndex: first, detail: `hand shape starting at ${describe(shape[0], first)} spans ${span} frets` });
    }
    const withFinger = fretted.filter((e) => e.finger !== undefined && e.finger > 0);
    outer: for (let a = 0; a < withFinger.length; a++) {
      for (let b = a + 1; b < withFinger.length; b++) {
        const ea = withFinger[a];
        const eb = withFinger[b];
        const df = eb.fret - ea.fret;
        const dfin = (eb.finger ?? 0) - (ea.finger ?? 0);
        // 相鄰一品允許同一指（伸張或移指），其餘必須依品格順序
        const crossed = (df > 0 && dfin < 0) || (df < 0 && dfin > 0);
        const sameFingerFar = dfin === 0 && Math.abs(df) > 1;
        if (crossed || sameFingerFar) {
          const idx = events.indexOf(eb);
          issues.push({ rule: 'finger', eventIndex: idx, detail: `${describe(eb, idx)} finger order conflicts with ${describe(ea, events.indexOf(ea))}` });
          break outer;
        }
      }
    }
  }

  return { ok: issues.length === 0, issues };
}
