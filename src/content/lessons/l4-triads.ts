import { arpeggio, chordChange } from '../../sequence/generators';
import type { NoteEvent, StringNumber } from '../../sequence/types';
import { bars, item, jam, n, phrase } from '../dsl';
import type { Lesson } from '../types';

const L = 'l4-triads';
const PROG = bars(['C', 'Am', 'F', 'G']);
const base = { key: 'C', scale: 'major', position: { from: 7, to: 10 }, chords: PROG, backing: 'ballad' } as const;

/** 7–10 品一指一品 */
const f = (fret: number) => (fret - 6) as 1 | 2 | 3 | 4;
const t = 1 / 3;

/** 三連音琶音：每拍三個音，奇數拍往上、偶數拍往下。 */
function tripletBar(start: number, notes: [StringNumber, number][], beats: number): NoteEvent[] {
  const out: NoteEvent[] = [];
  for (let b = 0; b < beats; b++) {
    const order = b % 2 === 0 ? notes : [...notes].reverse();
    order.forEach(([s, fret], i) => out.push(n(s, fret, start + b + i * t, t, f(fret))));
  }
  return out;
}

export const sequences = [
  arpeggio({ id: 'l4-ex-c-arp', title: 'C 大三和弦琶音（E 形，7–10 品）', chord: 'C', key: 'C', scale: 'major', from: 7, to: 10, tempo: 70, tip: '這就是 E 形封閉 C 和弦——一次只彈一個音。' }),
  arpeggio({ id: 'l4-ex-am-arp', title: 'Am 小三和弦琶音（E 形，5–8 品）', chord: 'Am', key: 'A', scale: 'minor', from: 5, to: 8, tempo: 70, tip: '跟 Am 封閉和弦同一個位置，注意 b3（C）在哪。' }),
  chordChange({ id: 'l4-ex-change', title: '和弦轉換：C–Am–F–G 只彈和弦音', key: 'C', scale: 'major', from: 7, to: 10, progression: ['C', 'Am', 'F', 'G'], tempo: 70, backing: 'ballad', tip: '換和弦時，找離你最近的那個新和弦音。' }),
  arpeggio({ id: 'l4-aud-c', title: 'C 大三和弦', chord: 'C', key: 'C', scale: 'major', from: 7, to: 10, tempo: 100 }),
  arpeggio({ id: 'l4-aud-cm', title: 'C 小三和弦', chord: 'Cm', key: 'C', scale: 'minor', from: 7, to: 10, tempo: 100 }),

  phrase({
    ...base,
    id: 'l4-ph-climb',
    title: '沿著和弦爬上去',
    tempo: 72,
    tip: '每個音都是當下和弦的組成音，所以聽起來就是「和弦在唱歌」。',
    events: [
      n(6, 8, 0, 1, 2), n(5, 7, 1, 1, 1), n(5, 10, 2, 1, 4), n(4, 10, 3, 1, 4),
      n(3, 9, 4, 1, 3), n(2, 10, 5, 1, 4), n(1, 8, 6, 2, 2),
      n(1, 8, 8, 1, 2), n(2, 10, 9, 1, 4), n(3, 10, 10, 2, 4),
      n(3, 7, 12, 1, 1), n(2, 8, 13, 1, 2), n(1, 7, 14, 2, 1),
    ],
  }),
  phrase({
    ...base,
    id: 'l4-ph-voice-leading',
    title: '最近的和弦音（聲部導進）',
    tempo: 70,
    tip: '每次換和弦只移動一兩格：G→A、C→C。旋律平順就是這樣來的。',
    events: [
      n(3, 9, 0, 2, 3), n(2, 8, 2, 2, 2),
      n(2, 10, 4, 2, 4), n(1, 8, 6, 2, 2),
      n(1, 8, 8, 2, 2), n(2, 10, 10, 2, 4),
      n(2, 8, 12, 1, 2), n(3, 7, 13, 1, 1), n(2, 8, 14, 2, 2),
    ],
  }),
  phrase({
    ...base,
    id: 'l4-ph-minor-color',
    title: '小三和弦的顏色',
    chords: bars(['Am', 'F', 'C', 'G']),
    tempo: 72,
    tip: '第一小節的 C（Am 的 b3）就是「小調感」的來源。',
    events: [
      n(4, 7, 0, 1, 1), n(4, 10, 1, 1, 4), n(3, 9, 2, 1, 3), n(2, 10, 3, 1, 4),
      n(3, 10, 4, 2, 4), n(4, 10, 6, 1, 4), n(4, 7, 7, 1, 1),
      n(5, 10, 8, 1, 4), n(5, 7, 9, 1, 1), n(6, 8, 10, 2, 2),
      n(6, 7, 12, 1, 1), n(6, 10, 13, 1, 4), n(5, 10, 14, 2, 4),
    ],
  }),
  phrase({
    ...base,
    id: 'l4-ph-triplets',
    title: '三連音琶音（抒情搖滾常用）',
    tempo: 60,
    tip: '每拍三個音「一ㄉㄚ ㄉㄚ」，上下來回。先慢，均勻比快重要。',
    events: [
      ...tripletBar(0, [[3, 9], [2, 8], [1, 8]], 4),
      ...tripletBar(4, [[3, 9], [2, 10], [1, 8]], 4),
      ...tripletBar(8, [[3, 10], [2, 10], [1, 8]], 4),
      ...tripletBar(12, [[3, 7], [2, 8], [1, 7]], 2),
      n(2, 8, 14, 2, 2),
    ],
  }),
  phrase({
    ...base,
    id: 'l4-ph-two-shapes',
    title: 'CAGED 兩個形狀串起來',
    chords: bars(['C', 'C', 'G', 'C']),
    position: { from: 2, to: 10 },
    tip: '第一小節是 A 形 C 和弦（3 品），第二小節滑到 E 形 C 和弦（8 品）：同一個和弦、兩個位置。',
    tempo: 72,
    events: [
      n(5, 3, 0, 1, 2), n(4, 2, 1, 1, 1), n(4, 5, 2, 1, 4), n(3, 5, 3, 1, 4),
      n(3, 9, 4, 1, 3, { shift: true }), n(2, 8, 5, 1, 2), n(1, 8, 6, 2, 2),
      n(1, 7, 8, 1, 1), n(2, 8, 9, 1, 2), n(3, 7, 10, 2, 1),
      n(3, 9, 12, 1, 3), n(2, 8, 13, 1, 2), n(4, 10, 14, 2, 4),
    ],
  }),
  jam({
    ...base,
    id: 'l4-jam',
    title: '應用：在 C–Am–F–G 上只彈和弦音',
    tempo: 76,
    tip: '這次規則更嚴：只彈亮起的落點，聽聽看旋律怎麼自己跟著和弦變色。',
  }),
];

export const items = [
  item('l4-ex-c-arp', 'C 琶音 7–10 品', 'warmup', { lessonId: L, minutes: 3, startBpm: 60, targetBpm: 110 }),
  item('l4-ph-climb', '沿著和弦爬上去', 'phrase', { lessonId: L, startBpm: 60, targetBpm: 100 }),
  item('l4-ex-change', '和弦轉換 C–Am–F–G', 'technique', { lessonId: L, minutes: 4, startBpm: 60, targetBpm: 100 }),
  item('l4-ph-voice-leading', '最近的和弦音', 'phrase', { lessonId: L, startBpm: 60, targetBpm: 100 }),
  item('l4-ex-am-arp', 'Am 琶音 5–8 品', 'technique', { lessonId: L, minutes: 3, startBpm: 60, targetBpm: 110 }),
  item('l4-ph-minor-color', '小三和弦的顏色', 'phrase', { lessonId: L, startBpm: 60, targetBpm: 100 }),
  item('l4-ph-triplets', '三連音琶音', 'phrase', { lessonId: L, startBpm: 50, targetBpm: 84 }),
  item('l4-ph-two-shapes', 'CAGED 兩個形狀', 'phrase', { lessonId: L, startBpm: 60, targetBpm: 100 }),
  item('l4-jam', 'C–Am–F–G 只彈和弦音', 'apply', { lessonId: L, minutes: 6, startBpm: 70, targetBpm: 100 }),
];

export const lesson: Lesson = {
  id: L,
  order: 4,
  title: '三和弦與琶音',
  subtitle: '和弦拆開來彈，就是最強的旋律素材',
  prerequisites: ['l3-pentatonic'],
  what: {
    formula: '大三和弦 1 – 3 – 5（C E G）　｜　小三和弦 1 – b3 – 5（A C E）',
    paragraphs: [
      '三和弦只有三個音：根音（1）、三度（3 或 b3）、五度（5）。C = C E G；Am = A C E。',
      '「琶音」就是把和弦的音一個一個彈出來。你按的每一個 CAGED 和弦，拆開就是一組琶音指型。',
      '大與小只差一個音：三度。大三度離根音 4 格（明亮），小三度離根音 3 格（憂鬱）。',
    ],
    shapeSequenceId: 'l4-ex-c-arp',
  },
  sound: {
    paragraphs: [
      '琶音聽起來比音階更「有和聲感」：因為每個音都是和弦本身，旋律跟伴奏完全融合。',
      '對比聽：C 大三和弦與 C 小三和弦，只差 E 和 Eb 一個音。',
    ],
    auditions: [
      { label: 'C 大三和弦（明亮）', sequenceId: 'l4-aud-c' },
      { label: 'C 小三和弦（暗）', sequenceId: 'l4-aud-cm' },
    ],
  },
  related: {
    paragraphs: [
      '大調音階裡的 1、3、5 就是大三和弦；小調五聲裡的 1、b3、5 就是小三和弦。所以你前兩課學的音階裡早就藏著琶音，這課只是把「最穩的那三個音」標出來。',
      '第 1 課的根音、第 2 課的大調、第 3 課的五聲，在這課第一次合在一起：音階是路，和弦音是路上的休息站。',
    ],
  },
  usage: {
    paragraphs: [
      '換和弦時的「落點」：第 1 拍彈新和弦的和弦音，聽眾立刻聽到你跟著和弦走。',
      '抒情搖滾、流行的分解和弦伴奏（三連音琶音）。',
      '金屬與 Fusion 的掃弦（Sweep picking）本質上也是琶音。',
    ],
  },
  pitfalls: [
    '只在和弦根音上換：試著用三度或五度當落點，旋律會更有線條。',
    '和弦一換就跳到很遠的位置。先找「最近的」新和弦音——通常只差一兩格。',
    '琶音彈成和弦：每個音要分開、一個一個響，左手按完要放鬆讓前一個音停掉。',
  ],
  tryNow: {
    task: '在 C–Am–F–G 伴奏上，每個和弦的第一拍只彈一個音，而且要選離上一個音最近的和弦音。',
    itemId: 'l4-ex-change',
  },
  quiz: [
    {
      question: 'C 大三和弦的組成音是？',
      options: ['C D E', 'C E G', 'C Eb G', 'C F A'],
      answer: 1,
      explain: '1 3 5 → C E G。',
    },
    {
      question: '大三和弦和小三和弦差在哪一個音？',
      options: ['根音', '三度', '五度', '七度'],
      answer: 1,
      explain: '大三度（4 格）vs 小三度（3 格），其他相同。',
    },
    {
      question: '從 C 和弦換到 Am 時，彈著 G 的手最近的 Am 和弦音是？',
      options: ['A（往上 2 格）', 'E（往下 3 格）', 'C（往上 5 格）', 'F（往下 2 格）'],
      answer: 0,
      explain: 'Am = A C E，A 離 G 只有一個全音，是最平順的走法。',
    },
  ],
};
