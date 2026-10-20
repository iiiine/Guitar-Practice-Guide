import type { NoteRole } from '../theory';

/**
 * 音程固定配色（以半音距離索引）。只有核心音級上色：根音紅、三度黃、五度藍、七度紫、藍調音洋紅；
 * 2、4、6 度淺灰，b2、b6 深灰。另以形狀與文字區分角色，不單靠顏色。避開介面強調色（青綠）。
 */
export const INTERVAL_COLORS: readonly string[] = [
  '#ff5a5a', // 1
  '#8b8f9c', // b2
  '#c9ccd6', // 2
  '#ffb02e', // b3
  '#ffd84a', // 3
  '#c9ccd6', // 4
  '#ff6ad5', // b5（藍調音）
  '#5aa0ff', // 5
  '#8b8f9c', // b6
  '#c9ccd6', // 6
  '#b388ff', // b7
  '#cdb0ff', // 7
];

/** 圖例用的代表色 */
export const LEGEND_COLORS = {
  root: INTERVAL_COLORS[0],
  third: INTERVAL_COLORS[4],
  fifth: INTERVAL_COLORS[7],
  seventh: INTERVAL_COLORS[10],
  blue: INTERVAL_COLORS[6],
  other: INTERVAL_COLORS[2],
} as const;

export const ROLE_SHAPE: Record<NoteRole, 'square' | 'circle' | 'small' | 'diamond'> = {
  root: 'square',
  chordTone: 'circle',
  scaleTone: 'small',
  passing: 'diamond',
};
