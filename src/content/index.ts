import type { PracticeItem } from '../practice/types';
import type { EventSequence } from '../sequence/types';
import { resolveChallenge } from './challenges';
import * as registry from './registry';

export type * from './types';
export {
  content,
  getGenre,
  getLesson,
  itemsForLesson,
  orderedItems,
} from './registry';
export {
  challengesFor,
  isMastered,
  lockedChallengeSources,
  unlockBpm,
  unlockedChallenges,
  type Challenge,
} from './challenges';

/** 找練習：先找基礎內容，再找變化挑戰。 */
export function getItem(id: string): PracticeItem | undefined {
  return registry.getItem(id) ?? (id.includes('~') ? resolveChallenge(id)?.item : undefined);
}

/** 找序列：先找基礎內容，再找變化挑戰。 */
export function getSequence(id: string): EventSequence | undefined {
  return registry.getSequence(id) ?? (id.includes('~') ? resolveChallenge(id)?.sequence : undefined);
}

export function sequenceForItem(itemId: string): EventSequence | undefined {
  const it = getItem(itemId);
  return getSequence(it ? it.sequenceId : itemId);
}
