import { scaleRun } from '../../sequence/generators';
import { bars, item, jam, n, phrase } from '../dsl';
import type { Lesson } from '../types';

const L = 'l2-major';
const GCDG = bars(['G', 'C', 'D', 'G']);

export const sequences = [
  scaleRun({ id: 'l2-ex-g-major', title: 'G 大調音階（E 形，2–5 品）', key: 'G', scale: 'major', from: 2, to: 5, startOnRoot: true, tempo: 70, tip: '一指一品：食指 2 品、中指 3 品、無名指 4 品、小指 5 品。' }),
  scaleRun({ id: 'l2-ex-c-major', title: 'C 大調音階（同形狀移到 7–10 品）', key: 'C', scale: 'major', from: 7, to: 10, startOnRoot: true, tempo: 70, tip: '跟 G 大調完全同一個指型，只是整個往右移 5 格。' }),
  scaleRun({ id: 'l2-aud-a-minor', title: 'A 自然小調（對比用）', key: 'A', scale: 'minor', from: 4, to: 8, startOnRoot: true, tempo: 90 }),
  scaleRun({ id: 'l2-aud-c-major', title: 'C 大調（對比用）', key: 'C', scale: 'major', from: 7, to: 10, startOnRoot: true, tempo: 90 }),

  phrase({
    id: 'l2-ph-rise',
    title: '一路往上唱的旋律',
    key: 'G',
    scale: 'major',
    tempo: 72,
    chords: GCDG,
    position: { from: 2, to: 5 },
    backing: 'ballad',
    tip: '第 1、3 拍都落在和弦音上，所以怎麼聽都「對」。',
    events: [
      n(4, 5, 0, 1, 4), n(3, 2, 1, 1, 1), n(3, 4, 2, 1, 3), n(2, 3, 3, 1, 2),
      n(2, 5, 4, 1, 4), n(2, 3, 5, 1, 2), n(3, 5, 6, 2, 4),
      n(3, 2, 8, 1, 1), n(3, 4, 9, 0.5, 3), n(3, 2, 9.5, 0.5, 1), n(4, 4, 10, 1, 3), n(4, 2, 11, 1, 1),
      n(4, 5, 12, 4, 4),
    ],
  }),
  phrase({
    id: 'l2-ph-fall',
    title: '從高音緩緩落下',
    key: 'G',
    scale: 'major',
    tempo: 72,
    chords: [...bars(['G', 'Em']), { symbol: 'C', start: 8, end: 10 }, { symbol: 'D', start: 10, end: 12 }, { symbol: 'G', start: 12, end: 16 }],
    position: { from: 2, to: 5 },
    backing: 'ballad',
    tip: '第三小節和弦變快（兩拍一換），注意 F# 剛好落在 D 和弦上。',
    events: [
      n(1, 3, 0, 1, 2), n(1, 2, 1, 0.5, 1), n(2, 5, 1.5, 0.5, 4), n(2, 3, 2, 1, 2), n(3, 4, 3, 1, 3),
      n(2, 5, 4, 1.5, 4), n(2, 3, 5.5, 0.5, 2), n(3, 4, 6, 1, 3), n(3, 2, 7, 1, 1),
      n(3, 5, 8, 1, 4), n(3, 4, 9, 1, 3), n(4, 4, 10, 1, 3), n(4, 2, 11, 1, 1),
      n(4, 5, 12, 4, 4),
    ],
  }),
  phrase({
    id: 'l2-ph-home',
    title: '回家的感覺（大調終止）',
    key: 'G',
    scale: 'major',
    tempo: 72,
    chords: bars(['C', 'D', 'G', 'G']),
    position: { from: 2, to: 5 },
    backing: 'ballad',
    tip: 'C → D → G 是最典型的「回家」。聽聽最後的 G 有多穩。',
    events: [
      n(3, 5, 0, 1, 4), n(2, 3, 1, 1, 2), n(2, 5, 2, 2, 4),
      n(1, 2, 4, 1, 1), n(1, 5, 5, 1, 4), n(1, 2, 6, 1, 1), n(2, 5, 7, 1, 4),
      n(2, 3, 8, 2, 2), n(3, 4, 10, 1, 3), n(3, 2, 11, 1, 1),
      n(4, 5, 12, 4, 4),
    ],
  }),
  phrase({
    id: 'l2-ph-eighths',
    title: '八分音符的律動',
    key: 'G',
    scale: 'major',
    tempo: 66,
    chords: GCDG,
    position: { from: 2, to: 5 },
    tip: '下撥在拍點、上撥在反拍，手腕像鐘擺一樣不停。',
    events: [
      n(5, 2, 0, 0.5, 1), n(5, 3, 0.5, 0.5, 2), n(5, 5, 1, 0.5, 4), n(4, 2, 1.5, 0.5, 1), n(5, 5, 2, 1, 4), n(5, 2, 3, 1, 1),
      n(5, 3, 4, 1, 2), n(4, 2, 5, 0.5, 1), n(4, 5, 5.5, 0.5, 4), n(4, 2, 6, 1, 1), n(5, 5, 7, 1, 4),
      n(4, 4, 8, 1, 3), n(4, 5, 9, 0.5, 4), n(4, 4, 9.5, 0.5, 3), n(3, 2, 10, 1, 1), n(4, 4, 11, 1, 3),
      n(4, 5, 12, 4, 4),
    ],
  }),
  phrase({
    id: 'l2-ph-c-position',
    title: '同一句話換到 C 大調（7–10 品）',
    key: 'C',
    scale: 'major',
    tempo: 72,
    chords: bars(['C', 'F', 'G', 'C']),
    position: { from: 7, to: 10 },
    backing: 'ballad',
    tip: '指型會移動，你就能用同一套手感彈任何調。',
    events: [
      n(4, 10, 0, 1, 4), n(3, 7, 1, 1, 1), n(3, 9, 2, 1, 3), n(2, 8, 3, 1, 2),
      n(2, 10, 4, 2, 4), n(3, 10, 6, 2, 4),
      n(3, 7, 8, 1, 1), n(4, 9, 9, 1, 3), n(3, 7, 10, 1, 1), n(2, 8, 11, 1, 2),
      n(1, 8, 12, 4, 2),
    ],
  }),
  jam({
    id: 'l2-jam',
    title: '應用：在 G–C–D–G 上用大調音階即興',
    key: 'G',
    scale: 'major',
    tempo: 80,
    chords: GCDG,
    position: { from: 2, to: 5 },
    backing: 'ballad',
    tip: '只看亮起的落點：第 1 拍彈落點，其他時間自由走音階。',
  }),
];

export const items = [
  item('l2-ex-g-major', 'G 大調音階 2–5 品', 'warmup', { lessonId: L, minutes: 3, startBpm: 60, targetBpm: 110 }),
  item('l2-ph-rise', '往上唱的旋律', 'phrase', { lessonId: L, startBpm: 60, targetBpm: 100 }),
  item('l2-ph-home', '大調終止', 'phrase', { lessonId: L, startBpm: 60, targetBpm: 100 }),
  item('l2-ex-c-major', 'C 大調音階 7–10 品', 'technique', { lessonId: L, minutes: 3, startBpm: 60, targetBpm: 110 }),
  item('l2-ph-fall', '從高音落下', 'phrase', { lessonId: L, startBpm: 60, targetBpm: 100 }),
  item('l2-ph-eighths', '八分音符律動', 'phrase', { lessonId: L, startBpm: 56, targetBpm: 96 }),
  item('l2-ph-c-position', '換到 C 大調', 'phrase', { lessonId: L, startBpm: 60, targetBpm: 100 }),
  item('l2-jam', 'G–C–D–G 即興', 'apply', { lessonId: L, minutes: 6, startBpm: 70, targetBpm: 100 }),
];

export const lesson: Lesson = {
  id: L,
  order: 2,
  title: '大調音階',
  subtitle: 'Do Re Mi 在指板上的樣子，以及它和 CAGED 的關係',
  prerequisites: ['l1-notes'],
  what: {
    formula: '全 全 半 全 全 全 半（1 2 3 4 5 6 7 ＝ G A B C D E F#）',
    paragraphs: [
      '大調音階就是 Do Re Mi Fa Sol La Si。從根音出發，照「全全半全全全半」的距離排出 7 個音。',
      'G 大調：G A B C D E F#。C 大調：C D E F G A B（全是自然音）。',
      '本課用「E 形」把位：根音在第 6 弦，食指管 2 品、小指管 5 品，一指一品，手完全不用移動就能彈完兩個八度。',
    ],
    bullets: ['音級數字 1–7 比音名更重要：1 是家、3 決定大小調、5 是最穩的支撐、7 想回到 1。'],
    shapeSequenceId: 'l2-ex-g-major',
  },
  sound: {
    paragraphs: [
      '大調聽起來明亮、開朗、有「完成感」——大部分流行歌、兒歌、國歌都是大調。',
      '對比聽聽同一個起音高度的大調與小調：差的只是 3、6、7 這三個音，情緒卻完全不同。',
    ],
    auditions: [
      { label: 'C 大調（明亮）', sequenceId: 'l2-aud-c-major' },
      { label: 'A 自然小調（憂鬱）', sequenceId: 'l2-aud-a-minor' },
    ],
  },
  related: {
    paragraphs: [
      '你會的 CAGED 其實就是大調音階的骨架：每個 CAGED 和弦形狀，周圍都包著一個大調音階指型。本課的指型就是包在「E 形」G 和弦周圍的那一個。',
      '彈 G 大調音階時，你會發現 G 和弦（E 形封閉在 3 品）的每個音都在裡面——和弦就是音階裡挑出來的 1、3、5。',
    ],
  },
  usage: {
    paragraphs: [
      '流行、抒情、鄉村、許多搖滾的大調歌曲，旋律幾乎都在大調音階裡。',
      '和弦進行如果是 I–IV–V（G–C–D）這類大調進行，就用這個調的大調音階。',
      '它也是之後所有東西的「尺」：五聲音階＝大調拿掉兩個音；小調、藍調、調式都是用「跟大調差哪幾個音」來描述。',
    ],
  },
  pitfalls: [
    '從音階最低音（F#）開始彈，聽不出「家」在哪。一律從根音開始、在根音結束。',
    '只會上下爬音階：音階是材料不是音樂。每次練完音階都要在伴奏上試著唱一句。',
    '小指偷懶改用無名指去搆 5 品，會讓手型跑掉、之後速度上不去。',
  ],
  tryNow: {
    task: '用 G 大調音階的指型，在 G 和弦上只用 G、B、D 三個音彈一段四拍的旋律。',
    itemId: 'l2-ex-g-major',
  },
  quiz: [
    {
      question: '大調音階的全半音排列是？',
      options: ['全全半全全全半', '全半全全半全全', '全全全半全全半', '半全全全半全全'],
      answer: 0,
      explain: '全全半全全全半——3 到 4、7 到 8 是半音。',
    },
    {
      question: 'G 大調裡有哪一個升記號？',
      options: ['C#', 'F#', 'G#', 'D#'],
      answer: 1,
      explain: 'G A B C D E F#，第 7 個音必須離 G 半音，所以是 F#。',
    },
    {
      question: '把 G 大調指型（根音第 6 弦 3 品）整個往右移 5 格，變成什麼調？',
      options: ['A 大調', 'B 大調', 'C 大調', 'D 大調'],
      answer: 2,
      explain: '第 6 弦第 8 格是 C，指型可以平移，根音在哪就是什麼調。',
    },
  ],
};
