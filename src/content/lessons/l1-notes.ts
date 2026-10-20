import { findAllNotes, naturalNotesOnString } from '../../sequence/generators';
import { bars, item, jam, n, phrase } from '../dsl';
import type { Lesson } from '../types';

const L = 'l1-notes';

export const sequences = [
  naturalNotesOnString({ id: 'l1-ex-s6', title: '第 6 弦自然音', string: 6, tempo: 60, tip: '邊彈邊唸出音名，E 和 F、B 和 C 之間只差一格。' }),
  naturalNotesOnString({ id: 'l1-ex-s5', title: '第 5 弦自然音', string: 5, tempo: 60, tip: '第 5 弦從 A 開始，同樣注意 B–C、E–F 只差一格。' }),
  findAllNotes({ id: 'l1-ex-find-c', note: 'C', title: '找出所有的 C（0–12 品）', tempo: 50, tip: '先猜下一個 C 在哪，再看指板確認。' }),
  findAllNotes({ id: 'l1-ex-find-g', note: 'G', title: '找出所有的 G（0–12 品）', tempo: 50, tip: '試著用八度形狀從一個 G 推到下一個 G。' }),

  phrase({
    id: 'l1-ph-octave-roots',
    title: '八度根音跟著和弦走',
    key: 'C',
    scale: 'major',
    tempo: 70,
    chords: bars(['C', 'Am', 'F', 'G']),
    position: { from: 1, to: 7 },
    tip: '食指按根音、無名指按高八度（隔一條弦、往上兩格）。',
    events: [
      n(5, 3, 0, 1, 1, { shift: true }), n(5, 3, 1, 1, 1), n(3, 5, 2, 1, 3), n(3, 5, 3, 1, 3),
      n(6, 5, 4, 1, 1, { shift: true }), n(6, 5, 5, 1, 1), n(4, 7, 6, 1, 3), n(4, 7, 7, 1, 3),
      n(6, 1, 8, 1, 1, { shift: true }), n(6, 1, 9, 1, 1), n(4, 3, 10, 1, 3), n(4, 3, 11, 1, 3),
      n(6, 3, 12, 1, 1, { shift: true }), n(6, 3, 13, 1, 1), n(4, 5, 14, 2, 3),
    ],
  }),
  phrase({
    id: 'l1-ph-root-fifth',
    title: '根音 + 五度（強力和弦的骨架）',
    key: 'C',
    scale: 'major',
    tempo: 70,
    chords: bars(['C', 'Am', 'F', 'G']),
    position: { from: 1, to: 7 },
    tip: '五度永遠在根音的下一條弦、往上兩格。',
    events: [
      n(5, 3, 0, 1.5, 1, { shift: true }), n(4, 5, 1.5, 0.5, 3), n(5, 3, 2, 1, 1), n(4, 5, 3, 1, 3),
      n(6, 5, 4, 1.5, 1, { shift: true }), n(5, 7, 5.5, 0.5, 3), n(6, 5, 6, 1, 1), n(5, 7, 7, 1, 3),
      n(6, 1, 8, 1.5, 1, { shift: true }), n(5, 3, 9.5, 0.5, 3), n(6, 1, 10, 1, 1), n(5, 3, 11, 1, 3),
      n(6, 3, 12, 1.5, 1, { shift: true }), n(5, 5, 13.5, 0.5, 3), n(6, 3, 14, 2, 1),
    ],
  }),
  phrase({
    id: 'l1-ph-one-position',
    title: '不移動手，在 2–5 品找到每個根音',
    key: 'C',
    scale: 'major',
    tempo: 70,
    chords: bars(['C', 'Am', 'F', 'G']),
    position: { from: 2, to: 5 },
    tip: '換和弦時手不動，只換手指。這就是「把位」的概念。',
    events: [
      n(5, 3, 0, 2, 2), n(3, 5, 2, 2, 4),
      n(6, 5, 4, 2, 4), n(3, 2, 6, 2, 1),
      n(4, 3, 8, 2, 2), n(3, 2, 10, 2, 1),
      n(6, 3, 12, 2, 2), n(4, 5, 14, 2, 4),
    ],
  }),
  phrase({
    id: 'l1-ph-melody-12',
    title: '第 1、2 弦上的小旋律',
    key: 'C',
    scale: 'major',
    tempo: 75,
    chords: bars(['C', 'G', 'Am', 'F']),
    position: { from: 0, to: 3 },
    tip: '每彈一個音就唸出音名：C D E F G…',
    events: [
      n(2, 1, 0, 1, 1), n(2, 3, 1, 1, 3), n(1, 0, 2, 1, 0), n(1, 1, 3, 1, 1),
      n(1, 3, 4, 2, 3), n(2, 3, 6, 2, 3),
      n(1, 0, 8, 1, 0), n(2, 3, 9, 1, 3), n(2, 1, 10, 2, 1),
      n(1, 1, 12, 2, 1), n(2, 1, 14, 2, 1),
    ],
  }),
  phrase({
    id: 'l1-ph-caged-roots',
    title: 'CAGED：A 形與 E 形的根音',
    key: 'C',
    scale: 'major',
    tempo: 70,
    chords: bars(['C', 'C', 'G', 'G']),
    position: { from: 3, to: 12 },
    tip: 'A 形和弦根音在第 5 弦、E 形在第 6 弦——你已經會的 CAGED 就是根音地圖。',
    events: [
      n(5, 3, 0, 2, 1, { shift: true }), n(3, 5, 2, 2, 3),
      n(6, 8, 4, 2, 1, { shift: true }), n(4, 10, 6, 2, 3),
      n(6, 3, 8, 2, 1, { shift: true }), n(4, 5, 10, 2, 3),
      n(5, 10, 12, 2, 1, { shift: true }), n(3, 12, 14, 2, 3),
    ],
  }),
  jam({
    id: 'l1-jam',
    title: '應用：在伴奏上只彈根音',
    key: 'C',
    scale: 'major',
    tempo: 72,
    chords: bars(['C', 'Am', 'F', 'G']),
    position: { from: 1, to: 8 },
    tip: '只彈亮起的方形（根音）：每換一個和弦，在第 1 拍彈它的根音，可以用任何一個八度。',
  }),
];

export const items = [
  item('l1-ex-s6', '第 6 弦自然音', 'warmup', { lessonId: L, minutes: 3, startBpm: 50, targetBpm: 90 }),
  item('l1-ph-octave-roots', '八度根音跟著和弦走', 'phrase', { lessonId: L, startBpm: 60, targetBpm: 100 }),
  item('l1-ex-s5', '第 5 弦自然音', 'technique', { lessonId: L, minutes: 3, startBpm: 50, targetBpm: 90 }),
  item('l1-ph-root-fifth', '根音 + 五度', 'phrase', { lessonId: L, startBpm: 60, targetBpm: 100 }),
  item('l1-ex-find-c', '找出所有的 C', 'technique', { lessonId: L, minutes: 3, startBpm: 40, targetBpm: 80 }),
  item('l1-ph-one-position', '一個把位找根音', 'phrase', { lessonId: L, startBpm: 60, targetBpm: 100 }),
  item('l1-ex-find-g', '找出所有的 G', 'technique', { lessonId: L, minutes: 3, startBpm: 40, targetBpm: 80 }),
  item('l1-ph-melody-12', '第 1、2 弦小旋律', 'phrase', { lessonId: L, startBpm: 60, targetBpm: 100 }),
  item('l1-ph-caged-roots', 'CAGED 根音', 'phrase', { lessonId: L, startBpm: 60, targetBpm: 100 }),
  item('l1-jam', '伴奏上只彈根音', 'apply', { lessonId: L, minutes: 5, startBpm: 66, targetBpm: 100 }),
];

export const lesson: Lesson = {
  id: L,
  order: 1,
  title: '音名與指板',
  subtitle: '把你會的 CAGED 變成一張「根音地圖」',
  prerequisites: [],
  what: {
    formula: 'C – D – E ^ F – G – A – B ^ C（– 全音＝隔 2 格，^ 半音＝隔 1 格）',
    paragraphs: [
      '音樂只有 12 個音。7 個「自然音」是 C D E F G A B，其餘 5 個是升降音（C#／Db 這種）。',
      '規則只有一條：相鄰自然音之間隔一個全音（2 格），只有 E→F、B→C 隔半音（1 格）。記住這條，你就能從任何已知的音推出整條弦。',
      '吉他上最重要的兩條「定位弦」是第 6 弦和第 5 弦，因為 CAGED 的 E 形、A 形和弦根音就在這兩條弦上。',
      '八度形狀：根音往高兩條弦、往右兩格就是同一個音高八度（跨過 B 弦時要多往右一格）。',
    ],
    bullets: ['第 6 弦：0 E、1 F、3 G、5 A、7 B、8 C、10 D、12 E', '第 5 弦：0 A、2 B、3 C、5 D、7 E、8 F、10 G、12 A'],
    shapeSequenceId: 'l1-ex-s6',
  },
  sound: {
    paragraphs: [
      '同一個音名在不同位置聽起來是「同一個音的不同高度」。八度音聽起來很像、很融合——這是你判斷有沒有找對音最好的耳朵練習。',
      '聽聽看：同一串根音，用八度形狀彈時是不是更飽滿？',
    ],
    auditions: [
      { label: '所有的 C', sequenceId: 'l1-ex-find-c' },
      { label: '八度根音跟和弦', sequenceId: 'l1-ph-octave-roots' },
    ],
  },
  related: {
    paragraphs: [
      '你已經會 CAGED：每個和弦形狀裡都藏著根音。E 形的根音在第 6 弦、A 形在第 5 弦、C 形在第 5 弦（無名指）、G 形在第 6 弦（中指／無名指）、D 形在第 4 弦。',
      '這一課把那些根音抽出來單獨練。之後學音階、琶音時，起點和終點都會是這些根音。',
    ],
  },
  usage: {
    paragraphs: [
      '即興時「從根音出發、回到根音結束」是最安全的起手式。',
      '和弦一換，你要能在當下的把位立刻找到新和弦的根音——這就是本課樂句在練的事。',
      '貝斯線、強力和弦（Power chord）、八度旋律（爵士、放克常用）都直接建立在本課上。',
    ],
  },
  pitfalls: [
    '只背形狀不唸音名：手會彈、腦袋不知道彈什麼，換調就卡住。練習時一定要出聲唸。',
    '忘記 E–F、B–C 只差一格，推算時多數錯在這裡。',
    '八度形狀跨過第 2 弦（B 弦）時要多往右一格，第 3 弦→第 1 弦是隔三格。',
  ],
  tryNow: {
    task: '不看指板，在第 6 弦上依序彈出 C、G、A，每彈一個就唸出來，再用軟體確認。',
    itemId: 'l1-ex-s6',
  },
  quiz: [
    {
      question: '第 6 弦第 5 格是什麼音？',
      options: ['G', 'A', 'B', 'C'],
      answer: 1,
      explain: 'E(0) → F(1) → G(3) → A(5)。這也是 A 和弦（E 形封閉）的根音位置。',
    },
    {
      question: '哪一對相鄰自然音之間只差半音（1 格）？',
      options: ['C–D', 'F–G', 'B–C', 'A–B'],
      answer: 2,
      explain: '只有 E–F 和 B–C 是半音，其他相鄰自然音都差全音。',
    },
    {
      question: '第 5 弦第 3 格是 C，它的高八度在哪？',
      options: ['第 4 弦第 5 格', '第 3 弦第 5 格', '第 3 弦第 3 格', '第 2 弦第 5 格'],
      answer: 1,
      explain: '八度形狀：往高兩條弦、往右兩格 → 第 3 弦第 5 格。',
    },
  ],
};
