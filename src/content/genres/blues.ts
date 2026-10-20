import type { NoteEvent } from '../../sequence/types';
import { bars, BLUES_12_A, item, jam, L, mergeChords, n, offset, phrase, S } from '../dsl';
import {
  LICK_B3_BEND,
  LICK_D7,
  LICK_DESCEND,
  LICK_RESOLVE,
  LICK_TURNAROUND,
} from '../lessons/l5-blues';
import type { GenrePack } from '../types';

const G = 'blues';
const CHORDS_12 = mergeChords(bars(BLUES_12_A));

/** 12 小節的 boogie 節奏型：根音＋五度、根音＋六度交替（shuffle）。 */
function boogieBar(start: number, root: [1 | 2 | 3 | 4 | 5 | 6, number]): NoteEvent[] {
  const [rs] = root;
  const upper = (rs - 1) as 1 | 2 | 3 | 4 | 5;
  const out: NoteEvent[] = [];
  for (let b = 0; b < 4; b++) {
    const top = b % 2 === 0 ? 2 : 4;
    const finger = top === 2 ? 1 : 3;
    out.push(n(rs, 0, start + b, L, 0), n(upper, top, start + b, L, finger));
    out.push(n(rs, 0, start + b + L, S, 0), n(upper, top, start + b + L, S, finger));
  }
  return out;
}

const ROOT_STRING: Record<string, [1 | 2 | 3 | 4 | 5 | 6, number]> = { A7: [5, 0], D7: [4, 0], E7: [6, 0] };

const boogie: NoteEvent[] = BLUES_12_A.flatMap((sym, i) =>
  i === 11 ? [n(6, 0, 44, 2, 0), n(5, 2, 44, 2, 1)] : boogieBar(i * 4, ROOT_STRING[sym]),
);

export const sequences = [
  jam({
    id: 'blues-jam-a',
    title: 'A 調 12 小節藍調伴奏（自由即興）',
    key: 'A',
    scale: 'blues',
    tempo: 84,
    chords: CHORDS_12,
    position: { from: 5, to: 8 },
    backing: 'blues-shuffle',
    swing: true,
    tip: '看右側欄的「下一個和弦」，提早一拍準備好落點。',
  }),
  phrase({
    id: 'blues-solo-a',
    title: '完整一段 12 小節獨奏',
    key: 'A',
    scale: 'blues',
    tempo: 80,
    chords: CHORDS_12,
    position: { from: 5, to: 8 },
    backing: 'blues-shuffle',
    swing: true,
    tip: '把第 5 課的五個句子串成一整段。注意每句的落點都換成當下和弦的音。',
    events: [
      ...LICK_DESCEND,
      ...offset(LICK_B3_BEND, 8),
      ...offset(LICK_D7, 16),
      ...offset(LICK_RESOLVE, 24),
      ...offset(LICK_TURNAROUND, 32),
    ],
  }),
  phrase({
    id: 'blues-boogie-a',
    title: 'Boogie 節奏吉他（根音＋五度／六度）',
    key: 'A',
    scale: 'mixolydian',
    tempo: 84,
    chords: CHORDS_12,
    position: { from: 0, to: 4 },
    backing: 'blues-shuffle',
    swing: true,
    tip: '空弦當根音、食指按 2 品、無名指按 4 品。右手悶音（手掌輕靠琴橋）效果更好。',
    events: boogie,
  }),
];

export const items = [
  item('blues-boogie-a', 'Boogie 節奏吉他', 'technique', { genreId: G, lessonId: 'l5-blues', minutes: 4, startBpm: 70, targetBpm: 110 }),
  item('blues-solo-a', '12 小節獨奏', 'phrase', { genreId: G, lessonId: 'l5-blues', minutes: 6, startBpm: 66, targetBpm: 100 }),
  item('blues-jam-a', '12 小節藍調即興', 'apply', { genreId: G, lessonId: 'l5-blues', minutes: 8, startBpm: 76, targetBpm: 110 }),
];

export const genre: GenrePack = {
  id: G,
  title: '藍調曲風區',
  description: '12 小節藍調是電吉他的共同語言。在這裡把第 5 課的句子放進真正的藍調裡。',
  feel: [
    'Shuffle 律動：每拍分成「長—短」（三連音的 1 和 3），伴奏、節拍器都會用這個律動。',
    '屬七和弦：A7、D7、E7 都是 1 3 5 b7，所以 b7（G、C、D）都是安全的落點。',
    '形式：A7 ×4 → D7 ×2 → A7 ×2 → E7 → D7 → A7 → E7，最後兩小節叫 turnaround，把你帶回開頭。',
    '問與答：彈一句、休息一句，讓伴奏回答你。',
  ],
  jamItemId: 'blues-jam-a',
  itemIds: ['blues-jam-a', 'blues-solo-a', 'blues-boogie-a', 'l5-ph-descend', 'l5-ph-b3-bend', 'l5-ph-d7', 'l5-ph-resolve', 'l5-ph-turnaround'],
};
