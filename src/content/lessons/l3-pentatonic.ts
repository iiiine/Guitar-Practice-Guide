import { scaleRun } from '../../sequence/generators';
import { bars, bend, item, jam, n, phrase, slide, vib } from '../dsl';
import type { Lesson } from '../types';

const L = 'l3-pentatonic';
const PROG = bars(['Am', 'F', 'G', 'Am']);
const base = { key: 'A', scale: 'minor pentatonic', position: { from: 5, to: 8 }, chords: PROG } as const;

export const sequences = [
  scaleRun({ id: 'l3-ex-box1', title: 'A 小調五聲 第一把位（5–8 品）', key: 'A', scale: 'minor pentatonic', from: 5, to: 8, startOnRoot: true, tempo: 70, tip: '每條弦只有兩個音：食指 5 品，無名指 7 品或小指 8 品。' }),
  scaleRun({ id: 'l3-ex-box2', title: 'A 小調五聲 第二把位（7–10 品）', key: 'A', scale: 'minor pentatonic', from: 7, to: 10, startOnRoot: true, tempo: 65, tip: '第二把位接在第一把位右邊，共用 7、8 品的音。' }),
  scaleRun({ id: 'l3-aud-am', title: 'A 小調五聲（在 Am 上）', key: 'A', scale: 'minor pentatonic', from: 5, to: 8, startOnRoot: true, tempo: 90, chords: bars(['Am', 'Am']), backing: 'rock' }),
  scaleRun({ id: 'l3-aud-c', title: 'C 大調五聲（同樣的音，在 C 上）', key: 'C', scale: 'major pentatonic', from: 5, to: 8, startOnRoot: true, tempo: 90, chords: bars(['C', 'C']), backing: 'rock' }),

  phrase({
    ...base,
    id: 'l3-ph-from-root',
    title: '從根音出發',
    tempo: 76,
    tip: '開頭在 A、結尾也在 A：五聲音階最安全的用法。',
    events: [
      n(1, 5, 0, 1, 1), n(1, 8, 1, 1, 4), n(2, 5, 2, 1, 1), n(2, 8, 3, 1, 4),
      n(1, 5, 4, 2, 1), n(1, 8, 6, 2, 4),
      n(2, 8, 8, 1, 4), n(2, 5, 9, 1, 1), n(3, 7, 10, 1, 3), n(3, 5, 11, 1, 1),
      n(4, 7, 12, 4, 3, { technique: vib }),
    ],
  }),
  phrase({
    ...base,
    id: 'l3-ph-first-bend',
    title: '第一個推弦：D 推到 E',
    tempo: 72,
    tip: '用無名指推，中指和食指在後面幫忙一起推。推到的音要跟 2 弦 5 品的 E 一樣高。',
    events: [
      n(3, 7, 0, 2, 3, { technique: bend(2) }), n(2, 5, 2, 1, 1), n(2, 8, 3, 0.5, 4), n(2, 5, 3.5, 0.5, 1),
      n(3, 5, 4, 2, 1), n(4, 7, 6, 2, 3),
      n(4, 5, 8, 1, 1), n(4, 7, 9, 1, 3), n(3, 7, 10, 2, 3),
      n(3, 7, 12, 1, 3, { technique: bend(2) }), n(3, 5, 13, 1, 1), n(4, 7, 14, 2, 3, { technique: vib }),
    ],
  }),
  phrase({
    ...base,
    id: 'l3-ph-call-response',
    title: '問與答（留白很重要）',
    tempo: 76,
    tip: '第二小節是空的——讓伴奏說話。好的樂句一定會呼吸。',
    events: [
      n(1, 8, 0, 0.5, 4), n(1, 5, 0.5, 0.5, 1), n(2, 8, 1, 0.5, 4), n(2, 5, 1.5, 0.5, 1), n(1, 5, 2, 2, 1, { technique: vib }),
      n(2, 8, 8, 0.5, 4), n(2, 5, 8.5, 0.5, 1), n(3, 7, 9, 0.5, 3), n(3, 5, 9.5, 0.5, 1), n(3, 7, 10, 2, 3, { technique: vib }),
      n(3, 5, 12, 1, 1), n(4, 7, 13, 3, 3),
    ],
  }),
  phrase({
    ...base,
    id: 'l3-ph-cascade',
    title: '一口氣滑下來',
    tempo: 66,
    tip: '八分音符一路下行，換弦時保持撥弦方向交替。',
    events: [
      n(1, 5, 0, 0.5, 1), n(2, 8, 0.5, 0.5, 4), n(2, 5, 1, 0.5, 1), n(3, 7, 1.5, 0.5, 3),
      n(3, 5, 2, 0.5, 1), n(4, 7, 2.5, 0.5, 3), n(4, 5, 3, 0.5, 1), n(5, 7, 3.5, 0.5, 3),
      n(6, 8, 4, 1, 4), n(5, 5, 5, 1, 1), n(4, 7, 6, 2, 3),
      n(4, 5, 8, 1, 1), n(4, 7, 9, 0.5, 3), n(4, 5, 9.5, 0.5, 1), n(5, 5, 10, 2, 1),
      n(6, 8, 12, 1, 4), n(6, 5, 13, 3, 1),
    ],
  }),
  phrase({
    ...base,
    id: 'l3-ph-slide-out',
    title: '滑出第一把位',
    position: { from: 5, to: 10 },
    tempo: 72,
    tip: '無名指從 3 弦 7 品滑到 9 品，手順勢移到第二把位（食指 7 品）。',
    events: [
      n(3, 5, 0, 0.5, 1), n(3, 7, 0.5, 1.5, 3, { technique: slide(9) }),
      n(2, 10, 2, 1, 4, { shift: true }), n(2, 8, 3, 1, 2),
      n(1, 8, 4, 2, 2), n(2, 10, 6, 2, 4, { technique: vib }),
      n(2, 8, 8, 1, 2), n(3, 9, 9, 1, 3), n(3, 7, 10, 2, 1),
      n(4, 7, 12, 4, 1, { technique: vib }),
    ],
  }),
  jam({
    ...base,
    id: 'l3-jam',
    title: '應用：在 Am–F–G–Am 上用五聲即興',
    tempo: 84,
    tip: '換和弦的第 1 拍，彈一個亮起來的落點。其他時間隨意在五聲裡走。',
  }),
];

export const items = [
  item('l3-ex-box1', 'A 小調五聲 第一把位', 'warmup', { lessonId: L, minutes: 3, startBpm: 60, targetBpm: 120 }),
  item('l3-ph-from-root', '從根音出發', 'phrase', { lessonId: L, startBpm: 60, targetBpm: 100 }),
  item('l3-ph-first-bend', '第一個推弦', 'phrase', { lessonId: L, startBpm: 60, targetBpm: 96 }),
  item('l3-ph-call-response', '問與答', 'phrase', { lessonId: L, startBpm: 60, targetBpm: 100 }),
  item('l3-ex-box2', 'A 小調五聲 第二把位', 'technique', { lessonId: L, minutes: 3, startBpm: 55, targetBpm: 110 }),
  item('l3-ph-cascade', '一口氣滑下來', 'phrase', { lessonId: L, startBpm: 56, targetBpm: 96 }),
  item('l3-ph-slide-out', '滑出第一把位', 'phrase', { lessonId: L, startBpm: 60, targetBpm: 96 }),
  item('l3-jam', 'Am–F–G 五聲即興', 'apply', { lessonId: L, minutes: 6, startBpm: 76, targetBpm: 110 }),
];

export const lesson: Lesson = {
  id: L,
  order: 3,
  title: '小調五聲音階',
  subtitle: '電吉他最常用的 5 個音，也是即興的起點',
  prerequisites: ['l2-major'],
  what: {
    formula: '1 – b3 – 4 – 5 – b7（A C D E G）',
    paragraphs: [
      '「五聲」就是只有 5 個音。A 小調五聲：A C D E G。',
      '第一把位（Box 1）是全世界電吉他手最熟的形狀：根音在第 6 弦第 5 格，每條弦剛好兩個音，食指固定在 5 品。',
      '它的音比大調少，沒有容易「撞」和弦的半音，所以幾乎怎麼彈都不會太難聽——這就是為什麼它是即興的第一步。',
    ],
    bullets: ['第 6、1 弦：5（A）、8（C）', '第 5 弦：5（D）、7（E）', '第 4 弦：5（G）、7（A）', '第 3 弦：5（C）、7（D）', '第 2 弦：5（E）、8（G）'],
    shapeSequenceId: 'l3-ex-box1',
  },
  sound: {
    paragraphs: [
      '小調五聲聽起來帶點憂鬱、有力、很「搖滾」。少了半音，所以聲音開闊、不黏。',
      '對比聽：同樣這 5 個音，在 Am 和弦上聽起來是小調（家在 A），在 C 和弦上就變成 C 大調五聲（家在 C）。音一樣，「家」不同，感覺就不同。',
    ],
    auditions: [
      { label: '在 Am 上（小調）', sequenceId: 'l3-aud-am' },
      { label: '在 C 上（大調五聲）', sequenceId: 'l3-aud-c' },
    ],
  },
  related: {
    paragraphs: [
      'A 小調五聲 = C 大調音階拿掉 F 和 B。這兩個音正好是大調裡最容易跟和弦起衝突的半音。',
      '跟 CAGED 的關係：Box 1 包住的是 Am 和弦的 E 形封閉（5 品）。你按 Am 封閉和弦時，手下的音全部都在五聲裡。',
    ],
    compare: { from: { tonic: 'C', scale: 'major' }, to: { tonic: 'A', scale: 'minor pentatonic' } },
  },
  usage: {
    paragraphs: [
      '搖滾、藍調、硬式搖滾、金屬、放克的獨奏骨幹。',
      '小調歌曲（例如 Am–F–G 這類進行）直接用該調的小調五聲。',
      '大調歌曲也能用：在 C 大調歌曲上用 A 小調五聲（同樣的音），會得到明亮的 C 大調五聲聲音。',
    ],
  },
  pitfalls: [
    '從第 6 弦 5 品一路爬到底再爬回來，這是練習不是音樂。試著只用兩條弦做一句。',
    '推弦推不到音準：推之前先彈一次目標音（2 弦 5 品的 E）記住音高。',
    '結尾停在 D 或 G 這種「懸著」的音。長音和句尾優先放在亮起的和弦音上。',
  ],
  tryNow: {
    task: '只用第 1、2 弦的四個音（A C E G），在 Am 伴奏上彈出一句兩小節的樂句，最後停在 A。',
    itemId: 'l3-jam',
  },
  quiz: [
    {
      question: 'A 小調五聲由哪五個音組成？',
      options: ['A B C D E', 'A C D E G', 'A C# E F# G', 'A C D Eb E'],
      answer: 1,
      explain: '1 b3 4 5 b7 → A C D E G。',
    },
    {
      question: 'A 小調五聲和 C 大調音階差在哪？',
      options: ['少了 F 和 B', '少了 C 和 G', '多了 Eb', '完全一樣'],
      answer: 0,
      explain: 'C 大調 C D E F G A B 拿掉 F、B 就剩 A C D E G。',
    },
    {
      question: '在 Am 和弦的第一拍，下列哪個音最穩？',
      options: ['D', 'G', 'E', 'B'],
      answer: 2,
      explain: 'Am = A C E，E 是和弦音；D、G 是音階音，比較適合當經過。',
    },
  ],
};
