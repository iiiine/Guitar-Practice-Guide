import { Chord, Note, Progression } from 'tonal';
import { isMinorScale } from './harmony';

/** 和弦進行模板：以級數撰寫，套到任何調都能用。 */

export type ProgressionStyle = 'blues-shuffle' | 'rock' | 'ballad';

export interface ProgressionTemplate {
  id: string;
  /** 每小節一個級數（tonal 羅馬數字格式：大寫 + m 表示小和弦） */
  bars: string[];
  style: ProgressionStyle;
  /** 適合的音階，第一個是預設 */
  scales: string[];
  /** 主音是小調（例如 Am 進行的主音是 A） */
  minor: boolean;
  defaultTempo: number;
}

export const PROGRESSIONS: readonly ProgressionTemplate[] = [
  {
    id: 'blues12',
    bars: ['I7', 'I7', 'I7', 'I7', 'IV7', 'IV7', 'I7', 'I7', 'V7', 'IV7', 'I7', 'V7'],
    style: 'blues-shuffle',
    scales: ['blues', 'minor pentatonic', 'major pentatonic', 'mixolydian'],
    minor: false,
    defaultTempo: 84,
  },
  {
    id: 'blues12quick',
    bars: ['I7', 'IV7', 'I7', 'I7', 'IV7', 'IV7', 'I7', 'I7', 'V7', 'IV7', 'I7', 'V7'],
    style: 'blues-shuffle',
    scales: ['blues', 'minor pentatonic', 'major pentatonic', 'mixolydian'],
    minor: false,
    defaultTempo: 84,
  },
  {
    id: 'pop',
    bars: ['I', 'V', 'VIm', 'IV'],
    style: 'ballad',
    scales: ['major pentatonic', 'major'],
    minor: false,
    defaultTempo: 76,
  },
  {
    id: 'rock145',
    bars: ['I', 'IV', 'V', 'IV'],
    style: 'rock',
    scales: ['major pentatonic', 'major', 'minor pentatonic'],
    minor: false,
    defaultTempo: 96,
  },
  {
    id: 'fifties',
    bars: ['I', 'VIm', 'IIm', 'V'],
    style: 'ballad',
    scales: ['major', 'major pentatonic'],
    minor: false,
    defaultTempo: 72,
  },
  {
    id: 'minorRock',
    bars: ['Im', 'bVI', 'bVII', 'Im'],
    style: 'rock',
    scales: ['minor pentatonic', 'minor', 'blues'],
    minor: true,
    defaultTempo: 90,
  },
  {
    id: 'minorBallad',
    bars: ['Im', 'IVm', 'bVII', 'bIII'],
    style: 'ballad',
    scales: ['minor', 'minor pentatonic'],
    minor: true,
    defaultTempo: 72,
  },
  {
    id: 'dorianVamp',
    bars: ['Im7', 'Im7', 'IV7', 'IV7'],
    style: 'rock',
    scales: ['dorian', 'minor pentatonic', 'blues'],
    minor: true,
    defaultTempo: 92,
  },
  {
    id: 'jazz251',
    bars: ['IIm7', 'V7', 'Imaj7', 'Imaj7'],
    style: 'ballad',
    scales: ['major', 'major pentatonic'],
    minor: false,
    defaultTempo: 80,
  },
];

export const JAM_KEYS = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B'] as const;

const MINOR_SPELLING: Record<string, string> = { Db: 'C#', Ab: 'G#' };

/** 小調慣用拼法：Dbm → C#m、Abm → G#m。 */
export function keyName(key: string, minor: boolean): string {
  return minor ? MINOR_SPELLING[key] ?? key : key;
}

/** 依音階決定調名拼法，例如 Db 藍調顯示成 C#。 */
export function displayKey(key: string, scaleName: string): string {
  return keyName(key, isMinorScale(scaleName));
}

export function getProgression(id: string): ProgressionTemplate {
  const p = PROGRESSIONS.find((x) => x.id === id);
  if (!p) throw new Error(`Unknown progression: ${id}`);
  return p;
}

/** 把級數套到指定調，得到每小節的和弦名稱（Cb、E#、重升降這類拼法改成好讀的音名）。 */
export function realize(template: ProgressionTemplate, key: string): string[] {
  return Progression.fromRomanNumerals(key, template.bars).map((symbol) => {
    const tonic = Chord.get(symbol).tonic;
    if (!tonic) return symbol;
    return Note.simplify(tonic) + symbol.slice(tonic.length);
  });
}
