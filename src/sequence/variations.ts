import { Chord, Note } from 'tonal';
import { MAX_FRET, midiAt, positionsOfMidi } from '../theory';
import { checkSequence } from './checker';
import { fingerFor } from './generators';
import type { EventSequence, NoteEvent, Technique } from './types';

/**
 * 樂句變化：程式負責轉調、換把位、改節奏。
 * 任何變化都必須重新通過檢查器，不通過回傳 null（捨棄）。
 */

/** 音名移調（Cb、E#、重升降改成好讀的拼法）。 */
export function transposeName(name: string, semis: number): string {
  const interval = ['1P', '2m', '2M', '3m', '3M', '4P', '5d', '5P', '6m', '6M', '7m', '7M'][((semis % 12) + 12) % 12];
  return Note.simplify(Note.transpose(name, interval)) || name;
}

function transposeChord(symbol: string, semis: number): string {
  const c = Chord.get(symbol);
  if (!c.tonic) return symbol;
  return transposeName(c.tonic, semis) + symbol.slice(c.tonic.length);
}

function shiftTechniques(ts: Technique[] | undefined, df: number): Technique[] | undefined {
  return ts?.map((t) => (t.type === 'slide' ? { ...t, toFret: t.toFret + df } : t));
}

function regroupFingers(events: NoteEvent[], from: number): NoteEvent[] {
  return events.map((e) => ({ ...e, finger: e.finger === undefined ? undefined : fingerFor(e.fret, from) }));
}

/** 整段平移品格（同指型），超出指板時改以 ±12 品嘗試。 */
export function transpose(seq: EventSequence, semis: number): EventSequence | null {
  if (semis === 0) return seq;
  const minFret = Math.min(...seq.events.map((e) => e.fret));
  const hasOpen = seq.events.some((e) => e.fret === 0);
  for (const shift of [semis, semis - 12, semis + 12]) {
    const maxFret = Math.max(...seq.events.map((e) => e.fret));
    if (minFret + shift < (hasOpen ? 0 : 1) || maxFret + shift > MAX_FRET) continue;
    if (hasOpen && shift !== 0) continue; // 空弦無法平移
    const out: EventSequence = {
      ...seq,
      id: `${seq.id}~t${semis}`,
      key: transposeName(seq.key, semis),
      chords: seq.chords.map((c) => ({ ...c, symbol: transposeChord(c.symbol, semis) })),
      position: { from: seq.position.from + shift, to: seq.position.to + shift },
      source: 'rule',
      events: seq.events.map((e) => ({ ...e, fret: e.fret + shift, technique: shiftTechniques(e.technique, shift) })),
    };
    if (checkSequence(out).ok) return out;
  }
  return null;
}

/** 換把位：同樣的音高改在另一個把位（食指在 from）彈。 */
export function moveToPosition(seq: EventSequence, from: number): EventSequence | null {
  const to = from + 4;
  const events: NoteEvent[] = [];
  for (const e of seq.events) {
    if (e.technique?.some((t) => t.type === 'slide')) return null; // 滑音依賴原指型
    const options = positionsOfMidi(midiAt(e.string, e.fret), Math.max(1, from), to);
    if (options.length === 0) return null;
    // 同一音高有多個位置時，選最接近原本弦的那條
    const best = options.reduce((a, b) => (Math.abs(b.string - e.string) < Math.abs(a.string - e.string) ? b : a));
    events.push({ ...e, string: best.string, fret: best.fret, shift: false });
  }
  const out: EventSequence = {
    ...seq,
    id: `${seq.id}~p${from}`,
    position: { from, to },
    source: 'rule',
    events: regroupFingers(events, from),
  };
  return checkSequence(out).ok ? out : null;
}

export type RhythmVariant = 'halfTime' | 'swing' | 'straight';

/** 改節奏：半速（時值加倍）、搖擺（反拍八分音符往後推到三連音位置）、平直。 */
export function changeRhythm(seq: EventSequence, variant: RhythmVariant): EventSequence | null {
  let out: EventSequence;
  if (variant === 'halfTime') {
    out = {
      ...seq,
      id: `${seq.id}~half`,
      length: seq.length !== undefined ? seq.length * 2 : undefined,
      chords: seq.chords.map((c) => ({ ...c, start: c.start * 2, end: c.end * 2 })),
      events: seq.events.map((e) => ({ ...e, start: e.start * 2, duration: e.duration * 2 })),
    };
  } else {
    const swing = variant === 'swing';
    const map = (t: number) => {
      const beat = Math.floor(t + 1e-9);
      const frac = t - beat;
      if (swing && Math.abs(frac - 0.5) < 1e-6) return beat + 2 / 3;
      if (!swing && Math.abs(frac - 2 / 3) < 1e-3) return beat + 0.5;
      return t;
    };
    out = {
      ...seq,
      id: `${seq.id}~${variant}`,
      swing,
      events: seq.events.map((e) => {
        const start = map(e.start);
        const end = map(e.start + e.duration);
        return { ...e, start, duration: Math.max(0.1, end - start) };
      }),
    };
  }
  out = { ...out, source: 'rule' };
  return checkSequence(out).ok ? out : null;
}
