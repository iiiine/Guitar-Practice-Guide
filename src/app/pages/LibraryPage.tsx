import { Lock } from 'lucide-react';
import { useMemo, useState } from 'react';
import { content, lockedChallengeSources, unlockedChallenges } from '../../content';
import { t } from '../../i18n';
import { isDue, mastery, type PracticeItem, type PracticeItemKind, type ScheduleState } from '../../practice';
import { useNav } from '../nav';
import { isUnlocked, usePractice } from '../practiceStore';
import { Meter } from '../ui';

type KindFilter = 'all' | PracticeItemKind | 'challenge';
type StatusFilter = 'all' | 'new' | 'cannot' | 'stuck' | 'smooth' | 'due';
type Sort = 'course' | 'weakest' | 'stale';

const RATING_WEIGHT = { cannot: 0, stuck: 1, smooth: 3 } as const;

/** 「最需要加強」：不會 → 卡住 → 沒練過 → 順，同級再看熟練度 */
function weakness(item: PracticeItem, s: ScheduleState | undefined): number {
  const base = s ? RATING_WEIGHT[s.lastRating] : 2;
  return base + mastery(item, s);
}

const fmtDate = (iso: string) => new Date(iso).toLocaleDateString('zh-TW', { month: 'numeric', day: 'numeric' });

export function LibraryPage() {
  const go = useNav((s) => s.go);
  const { schedules, logs, progress } = usePractice();
  const [kind, setKind] = useState<KindFilter>('all');
  const [lesson, setLesson] = useState<string>('all');
  const [status, setStatus] = useState<StatusFilter>('all');
  const [sort, setSort] = useState<Sort>('course');

  const challenges = useMemo(() => unlockedChallenges(schedules).map((c) => c.item), [schedules]);
  const lockedSources = useMemo(() => lockedChallengeSources(schedules).length, [schedules]);
  const lastPracticed = useMemo(() => {
    const m = new Map<string, string>();
    for (const l of logs) if (!m.has(l.itemId) || m.get(l.itemId)! < l.date) m.set(l.itemId, l.date);
    return m;
  }, [logs]);

  const now = new Date();
  const all = [...content.items, ...challenges];
  const lessonTitle = (i: PracticeItem) =>
    i.genreId ? t('library.genreBlues') : content.lessons.find((l) => l.id === i.lessonId)?.title ?? '';

  const filtered = all
    .filter((i) => kind === 'all' || (kind === 'challenge' ? !!i.challengeOf : i.kind === kind && !i.challengeOf))
    .filter((i) => lesson === 'all' || (lesson === 'blues' ? !!i.genreId : i.lessonId === lesson && !i.genreId))
    .filter((i) => {
      const s = schedules.get(i.id);
      switch (status) {
        case 'all':
          return true;
        case 'new':
          return !s;
        case 'due':
          return !!s && isDue(s, now);
        default:
          return s?.lastRating === status;
      }
    });

  const sorted =
    sort === 'course'
      ? filtered
      : [...filtered].sort((a, b) =>
          sort === 'weakest'
            ? weakness(a, schedules.get(a.id)) - weakness(b, schedules.get(b.id))
            : (lastPracticed.get(a.id) ?? '').localeCompare(lastPracticed.get(b.id) ?? ''),
        );

  const back = { name: 'library' } as const;

  return (
    <div className="page page-wide">
      <div className="page-header">
        <div>
          <h1>{t('library.heading')}</h1>
          <p>{t('library.intro')}</p>
        </div>
      </div>

      <div className="card toolbar">
        <label>
          {t('library.filter.kind')}
          <select value={kind} onChange={(e) => setKind(e.target.value as KindFilter)}>
            <option value="all">{t('library.all')}</option>
            {(['warmup', 'technique', 'phrase', 'apply', 'challenge'] as const).map((k) => (
              <option key={k} value={k}>{t(`kind.${k}`)}</option>
            ))}
          </select>
        </label>
        <label>
          {t('library.filter.lesson')}
          <select value={lesson} onChange={(e) => setLesson(e.target.value)}>
            <option value="all">{t('library.all')}</option>
            {content.lessons.map((l) => (
              <option key={l.id} value={l.id}>{l.order}. {l.title}</option>
            ))}
            <option value="blues">{t('library.genreBlues')}</option>
          </select>
        </label>
        <label>
          {t('library.filter.status')}
          <select value={status} onChange={(e) => setStatus(e.target.value as StatusFilter)}>
            <option value="all">{t('library.all')}</option>
            {(['due', 'new', 'cannot', 'stuck', 'smooth'] as const).map((k) => (
              <option key={k} value={k}>{t(`library.status.${k}`)}</option>
            ))}
          </select>
        </label>
        <label>
          {t('library.sort')}
          <select value={sort} onChange={(e) => setSort(e.target.value as Sort)}>
            {(['course', 'weakest', 'stale'] as const).map((k) => (
              <option key={k} value={k}>{t(`library.sort.${k}`)}</option>
            ))}
          </select>
        </label>
        <span className="count faint small mono">{t('library.count', { n: sorted.length })}</span>
      </div>

      {lockedSources > 0 && (
        <p className="notice lock-note">
          <Lock size={13} />
          <span>{t('library.challengeLocked', { n: lockedSources })}</span>
        </p>
      )}

      {sorted.length === 0 ? (
        <p className="muted">{t('library.empty')}</p>
      ) : (
        <ul className="list">
          {sorted.map((i) => {
            const s = schedules.get(i.id);
            const last = lastPracticed.get(i.id);
            const locked = !!i.lessonId && !i.challengeOf && !isUnlocked(i.lessonId, progress);
            const due = !!s && isDue(s, now);
            return (
              <li key={i.id} className={`list-row library-row ${locked ? 'locked' : ''}`}>
                <span className={`badge ${i.challengeOf ? 'badge-challenge' : ''}`}>
                  {t(i.challengeOf ? 'kind.challenge' : `kind.${i.kind}`)}
                </span>
                <div className="list-main">
                  <button className="link list-title" onClick={() => go({ name: 'practice', itemId: i.id, back })}>
                    {i.title}
                  </button>
                  <div className="list-meta">
                    <span>{lessonTitle(i)}</span>
                    {locked && (
                      <span className="row" style={{ gap: 4 }}>
                        <Lock size={11} />
                        {t('library.locked')}
                      </span>
                    )}
                    <span>{last ? t('library.lastPracticed', { date: fmtDate(last) }) : t('library.never')}</span>
                    {s && <span className="mono">{t('library.bestBpm', { best: s.bestSmoothBpm || '—', target: i.targetBpm })}</span>}
                  </div>
                </div>
                <div className="library-status">
                  {due && <span className="badge badge-review">{t('library.status.due')}</span>}
                  {s && <span className={`rate-text-${s.lastRating} small`}>{t(`practice.rate.${s.lastRating}`)}</span>}
                  <Meter value={mastery(i, s)} />
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
