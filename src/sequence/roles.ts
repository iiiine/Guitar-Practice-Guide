import { getScale, inferRole, midiAt } from '../theory';
import { chordAt, type EventSequence, type NoteEvent } from './types';

/** 實際聽到的目標音高（推弦取推到的音、滑音取起點）。 */
export function targetMidi(e: NoteEvent): number {
  const bend = e.technique?.find((t) => t.type === 'bend');
  return midiAt(e.string, e.fret) + (bend && bend.type === 'bend' ? bend.amount : 0);
}

/** 為未標註 role 的音符推算角色；手動標註優先。 */
export function assignRoles(seq: EventSequence): EventSequence {
  const scale = getScale(seq.key, seq.scale);
  return {
    ...seq,
    events: seq.events.map((e) =>
      e.role ? e : { ...e, role: inferRole(targetMidi(e), scale, chordAt(seq, e.start)?.symbol) },
    ),
  };
}
