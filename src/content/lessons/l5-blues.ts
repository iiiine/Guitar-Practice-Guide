import { scaleRun } from '../../sequence/generators';
import type { NoteEvent } from '../../sequence/types';
import { bars, bend, item, L as Lg, n, phrase, S, vib } from '../dsl';
import type { Lesson } from '../types';

const L = 'l5-blues';
const base = { key: 'A', scale: 'blues', position: { from: 5, to: 8 }, backing: 'blues-shuffle', swing: true } as const;
const blue = { chromatic: true } as const;

/** 以下片段同時用在本課與藍調曲風區的 12 小節獨奏。全部是原創樂句。 */

/** A7 兩小節：從 b7 經過藍調音滑回根音 */
export const LICK_DESCEND: NoteEvent[] = [
  n(2, 8, 0, Lg, 4), n(2, 5, Lg, S, 1), n(3, 8, 1, Lg, 4, blue), n(3, 7, 1 + Lg, S, 3), n(4, 7, 2, 2, 3),
  n(5, 7, 4, 1, 3), n(5, 6, 5, Lg, 2, blue), n(5, 5, 5 + Lg, S, 1), n(6, 5, 6, 2, 1, { technique: vib }),
];

/** A7 兩小節：b3 推半音到大三度 */
export const LICK_B3_BEND: NoteEvent[] = [
  n(1, 8, 0, 1, 4, { technique: bend(1), chromatic: true }), n(1, 5, 1, 1, 1), n(2, 8, 2, Lg, 4), n(2, 5, 2 + Lg, S, 1), n(1, 5, 3, 1, 1),
  n(2, 5, 4, 1, 1), n(3, 7, 5, Lg, 3), n(3, 5, 5 + Lg, S, 1), n(4, 7, 6, 2, 3, { technique: vib }),
];

/** D7 兩小節：同一個動機，落在 D7 的音上 */
export const LICK_D7: NoteEvent[] = [
  n(1, 5, 0, Lg, 1), n(1, 8, Lg, S, 4), n(1, 5, 1, Lg, 1), n(2, 8, 1 + Lg, S, 4), n(3, 7, 2, 2, 3, { technique: vib }),
  n(3, 5, 4, 1, 1), n(4, 7, 5, 1, 3), n(3, 7, 6, 2, 3),
];

/** A7 兩小節：藍調音往上解決到 5 度，再回根音 */
export const LICK_RESOLVE: NoteEvent[] = [
  n(2, 8, 0, Lg, 4), n(2, 5, Lg, S, 1), n(3, 7, 1, Lg, 3), n(3, 8, 1 + Lg, S, 4, blue), n(2, 5, 2, 2, 1),
  n(4, 7, 4, 4, 3, { technique: vib }),
];

/** E7–D7–A7–E7 四小節：回到開頭前的句尾（turnaround） */
export const LICK_TURNAROUND: NoteEvent[] = [
  n(3, 7, 0, 1, 3, { technique: bend(2) }), n(2, 5, 1, 1, 1), n(3, 7, 2, 1, 3), n(3, 5, 3, 1, 1),
  n(4, 7, 4, 1, 3), n(4, 5, 5, 1, 1), n(3, 5, 6, 2, 1),
  n(4, 7, 8, 1, 3), n(3, 5, 9, Lg, 1), n(4, 7, 9 + Lg, S, 3), n(4, 5, 10, 1, 1), n(5, 7, 11, Lg, 3), n(5, 6, 11 + Lg, S, 2, blue),
  n(5, 7, 12, 4, 3, { technique: vib }),
];

export const sequences = [
  scaleRun({ id: 'l5-ex-blues-box', title: 'A 藍調音階 第一把位', key: 'A', scale: 'blues', from: 5, to: 8, startOnRoot: true, tempo: 70, tip: '五聲音階加上第 5 弦 6 品、第 3 弦 8 品的藍調音（b5）。' }),
  scaleRun({ id: 'l5-aud-pent', title: 'A 小調五聲（對比用）', key: 'A', scale: 'minor pentatonic', from: 5, to: 8, startOnRoot: true, tempo: 100 }),
  scaleRun({ id: 'l5-aud-blues', title: 'A 藍調音階（對比用）', key: 'A', scale: 'blues', from: 5, to: 8, startOnRoot: true, tempo: 100 }),

  phrase({ ...base, id: 'l5-ph-descend', title: '藍調音滑回根音', tempo: 80, chords: bars(['A7', 'A7']), events: LICK_DESCEND, tip: '藍調音（Eb）只是路過，一定要立刻走到隔壁的 D 或 E。' }),
  phrase({ ...base, id: 'l5-ph-b3-bend', title: 'b3 推到 3（藍調的招牌）', tempo: 80, chords: bars(['A7', 'A7']), events: LICK_B3_BEND, tip: '1 弦 8 品的 C 推半音變成 C#——就是 A7 的三度。推一點點就好。' }),
  phrase({ ...base, id: 'l5-ph-d7', title: '換到 D7：同一句、不同落點', tempo: 80, chords: bars(['D7', 'D7']), events: LICK_D7, tip: '跟 A7 上一樣的動機，最後停在 D——D7 的根音。' }),
  phrase({ ...base, id: 'l5-ph-resolve', title: '藍調音往上解決', tempo: 80, chords: bars(['A7', 'A7']), events: LICK_RESOLVE, tip: 'Eb → E：半音往上推進最有藍調味。' }),
  phrase({ ...base, id: 'l5-ph-turnaround', title: '12 小節的最後四小節', tempo: 80, chords: bars(['E7', 'D7', 'A7', 'E7']), events: LICK_TURNAROUND, tip: '停在 E（E7 的根音），讓伴奏帶你回到第一小節。' }),
];

export const items = [
  item('l5-ex-blues-box', 'A 藍調音階', 'warmup', { lessonId: L, minutes: 3, startBpm: 60, targetBpm: 120 }),
  item('l5-ph-descend', '藍調音滑回根音', 'phrase', { lessonId: L, startBpm: 66, targetBpm: 110 }),
  item('l5-ph-b3-bend', 'b3 推到 3', 'phrase', { lessonId: L, startBpm: 66, targetBpm: 110 }),
  item('l5-ph-d7', '換到 D7', 'phrase', { lessonId: L, startBpm: 66, targetBpm: 110 }),
  item('l5-ph-resolve', '藍調音往上解決', 'phrase', { lessonId: L, startBpm: 66, targetBpm: 110 }),
  item('l5-ph-turnaround', '最後四小節', 'phrase', { lessonId: L, startBpm: 66, targetBpm: 110 }),
];

export const lesson: Lesson = {
  id: L,
  order: 5,
  title: '藍調音階',
  subtitle: '五聲音階加一個音，就是整個藍調的味道',
  prerequisites: ['l4-triads'],
  what: {
    formula: '1 – b3 – 4 – b5 – 5 – b7（A C D Eb E G）',
    paragraphs: [
      '藍調音階 = 小調五聲 + b5（藍調音）。A 藍調：A C D Eb E G。',
      '指型就是第 3 課的 Box 1，多兩個音：第 5 弦 6 品、第 3 弦 8 品。',
      '藍調音很「髒」，是刻意的不協和。它幾乎從不停留，總是從 4 走到 5（或反過來）的路上經過。',
      '12 小節藍調：A7 ×4、D7 ×2、A7 ×2、E7、D7、A7、E7。三個和弦都是屬七和弦（1 3 5 b7，例如 A7 = A C# E G）。',
    ],
    shapeSequenceId: 'l5-ex-blues-box',
  },
  sound: {
    paragraphs: [
      '藍調的聲音是「又苦又爽」：小調五聲的憂鬱，加上半音摩擦的張力，再配上 shuffle（長短長短）的搖擺律動。',
      '對比聽：同樣上下行，多了藍調音後聲音馬上變得有個性。',
    ],
    auditions: [
      { label: '小調五聲', sequenceId: 'l5-aud-pent' },
      { label: '藍調音階', sequenceId: 'l5-aud-blues' },
    ],
  },
  related: {
    paragraphs: [
      '跟第 3 課的小調五聲只差一個音（Eb）。',
      '跟第 4 課的關係：A7 的三度是 C#，但藍調音階裡是 C（b3）。這個「大調和弦上彈小三度」的衝突就是藍調的靈魂——把 C 推一點點往 C# 靠，就是最經典的藍調推弦。',
    ],
    compare: { from: { tonic: 'A', scale: 'minor pentatonic' }, to: { tonic: 'A', scale: 'blues' } },
  },
  usage: {
    paragraphs: [
      '12 小節藍調、藍調搖滾、Southern rock、很多硬搖滾 riff。',
      '每個和弦換掉時，句子的長音要落在新和弦的音上：A7 落 A／E／G，D7 落 D／A／C，E7 落 E／B／D。',
      'shuffle 律動：八分音符彈成「長—短」，像三連音的第一和第三個。',
    ],
  },
  pitfalls: [
    '停在藍調音上：Eb 只能經過，長音會變成走音。',
    '整首都用同一句：和弦換了，落點也要換（看指板上亮起的落點）。',
    '把 shuffle 彈成平均的八分音符，聽起來會很僵。先跟著伴奏唸「噠—啊噠、噠—啊噠」。',
  ],
  tryNow: {
    task: '到「藍調曲風區」開 12 小節伴奏，只在 D7 出現的那兩小節彈「換到 D7」這句，其他時間休息聽和弦。',
    itemId: 'l5-ph-d7',
  },
  quiz: [
    {
      question: '藍調音階比小調五聲多了哪個音級？',
      options: ['2', 'b5', '6', '7'],
      answer: 1,
      explain: 'b5（A 藍調中的 Eb），又叫藍調音。',
    },
    {
      question: '12 小節藍調（A 調）第 5、6 小節是什麼和弦？',
      options: ['A7', 'D7', 'E7', 'Bm7'],
      answer: 1,
      explain: 'A7 ×4 → D7 ×2 → A7 ×2 → E7 → D7 → A7 → E7。',
    },
    {
      question: '藍調音最適合怎麼用？',
      options: ['當句尾的長音', '當作經過音快速通過', '放在每小節第一拍', '完全不要用'],
      answer: 1,
      explain: '藍調音是張力，快速經過到 4 或 5 才好聽。',
    },
  ],
};
