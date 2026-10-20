import { getChord } from '../theory';
import { beatsPerBar, sequenceLength, type ChordSpan, type EventSequence } from '../sequence/types';

/**
 * 伴奏生成（純函式，不碰 Tone.js）：依序列的和弦時間軸與曲風產生鼓、貝斯、和弦事件。
 * engine.ts 負責把它們排進 Transport。
 */

export type BackingInstrument = 'kick' | 'snare' | 'hat' | 'bass' | 'comp';

export interface BackingEvent {
  instrument: BackingInstrument;
  start: number;
  duration: number;
  midi?: number[];
  velocity: number;
}

const SW = 2 / 3;

/** 貝斯根音：落在 E1(28)–D#2(39) */
export function bassRoot(symbol: string): number {
  return 28 + ((getChord(symbol).rootChroma - 4 + 12) % 12);
}

/** 和弦的密集排列：從 G3(55) 往上 */
export function compVoicing(symbol: string): number[] {
  const chord = getChord(symbol);
  return chord.chromas.map((c) => 55 + ((c - 7 + 12) % 12)).sort((a, b) => a - b);
}

function eachBar(seq: EventSequence, length: number, fn: (barStart: number, chord: ChordSpan | undefined) => void) {
  const bar = beatsPerBar(seq);
  for (let b = 0; b < length - 1e-9; b += bar) {
    fn(b, seq.chords.find((c) => b >= c.start - 1e-9 && b < c.end - 1e-9));
  }
}

function chordAtBeat(seq: EventSequence, beat: number): ChordSpan | undefined {
  return seq.chords.find((c) => beat >= c.start - 1e-9 && beat < c.end - 1e-9);
}

function bluesShuffle(seq: EventSequence, length: number): BackingEvent[] {
  const out: BackingEvent[] = [];
  const walk = [[0, 4, 7, 9], [10, 9, 7, 4]];
  let barIndex = 0;
  eachBar(seq, length, (bs) => {
    for (let i = 0; i < 4; i++) {
      const beat = bs + i;
      out.push({ instrument: i % 2 === 0 ? 'kick' : 'snare', start: beat, duration: 0.25, velocity: i % 2 === 0 ? 0.9 : 0.7 });
      out.push({ instrument: 'hat', start: beat, duration: 0.1, velocity: 0.5 });
      out.push({ instrument: 'hat', start: beat + SW, duration: 0.1, velocity: 0.3 });
      const chord = chordAtBeat(seq, beat);
      if (!chord) continue;
      const root = bassRoot(chord.symbol);
      out.push({ instrument: 'bass', start: beat, duration: SW, midi: [root + walk[barIndex % 2][i]], velocity: 0.8 });
      if (i % 2 === 1) {
        out.push({ instrument: 'comp', start: beat, duration: 0.4, midi: compVoicing(chord.symbol), velocity: 0.5 });
        out.push({ instrument: 'comp', start: beat + SW, duration: 0.25, midi: compVoicing(chord.symbol), velocity: 0.35 });
      }
    }
    barIndex++;
  });
  return out;
}

function rock(seq: EventSequence, length: number): BackingEvent[] {
  const out: BackingEvent[] = [];
  eachBar(seq, length, (bs) => {
    for (let i = 0; i < 4; i++) {
      const beat = bs + i;
      if (i === 0 || i === 2) out.push({ instrument: 'kick', start: beat, duration: 0.25, velocity: 0.9 });
      if (i === 2) out.push({ instrument: 'kick', start: beat + 0.5, duration: 0.25, velocity: 0.6 });
      if (i === 1 || i === 3) out.push({ instrument: 'snare', start: beat, duration: 0.25, velocity: 0.75 });
      out.push({ instrument: 'hat', start: beat, duration: 0.1, velocity: 0.45 });
      out.push({ instrument: 'hat', start: beat + 0.5, duration: 0.1, velocity: 0.3 });
      for (const off of [0, 0.5]) {
        const chord = chordAtBeat(seq, beat + off);
        if (chord) out.push({ instrument: 'bass', start: beat + off, duration: 0.45, midi: [bassRoot(chord.symbol)], velocity: 0.75 });
      }
    }
  });
  for (const c of seq.chords) {
    for (let b = c.start; b < Math.min(c.end, length) - 1e-9; b += 2) {
      out.push({ instrument: 'comp', start: b, duration: Math.min(2, c.end - b) - 0.1, midi: compVoicing(c.symbol), velocity: 0.4 });
    }
  }
  return out;
}

function ballad(seq: EventSequence, length: number): BackingEvent[] {
  const out: BackingEvent[] = [];
  eachBar(seq, length, (bs) => {
    out.push({ instrument: 'kick', start: bs, duration: 0.25, velocity: 0.8 });
    out.push({ instrument: 'snare', start: bs + 2, duration: 0.25, velocity: 0.5 });
    for (let i = 0; i < 4; i++) out.push({ instrument: 'hat', start: bs + i, duration: 0.1, velocity: 0.3 });
    for (const off of [0, 2]) {
      const chord = chordAtBeat(seq, bs + off);
      if (!chord) continue;
      const root = bassRoot(chord.symbol);
      const fifth = root + 7;
      out.push({ instrument: 'bass', start: bs + off, duration: 1.8, midi: [off === 0 ? root : fifth], velocity: 0.7 });
    }
  });
  for (const c of seq.chords) {
    out.push({ instrument: 'comp', start: c.start, duration: Math.min(c.end, length) - c.start - 0.05, midi: compVoicing(c.symbol), velocity: 0.35 });
  }
  return out;
}

export function generateBacking(seq: EventSequence): BackingEvent[] {
  const length = sequenceLength(seq);
  switch (seq.backing ?? 'none') {
    case 'blues-shuffle':
      return bluesShuffle(seq, length);
    case 'rock':
      return rock(seq, length);
    case 'ballad':
      return ballad(seq, length);
    case 'none':
      return [];
  }
}
