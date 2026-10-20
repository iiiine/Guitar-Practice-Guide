import { ChevronRight, CircleCheck, Play } from 'lucide-react';
import { content, orderedItems, unlockedChallenges } from '../../content';
import { t } from '../../i18n';
import { buildDailyMenu, mastery, menuMinutes, suggestBpm } from '../../practice';
import { useNav } from '../nav';
import { activeLessonIds, usePractice } from '../practiceStore';
import { Meter } from '../ui';

function isToday(iso: string): boolean {
  const d = new Date(iso);
  const n = new Date();
  return d.getFullYear() === n.getFullYear() && d.getMonth() === n.getMonth() && d.getDate() === n.getDate();
}

function Steps() {
  return (
    <div className="steps">
      <span>{t('today.step1')}</span>
      <ChevronRight size={14} />
      <span>{t('today.step2')}</span>
      <ChevronRight size={14} />
      <span>{t('today.step3')}</span>
    </div>
  );
}

export function TodayPage() {
  const go = useNav((s) => s.go);
  const { schedules, progress, logs } = usePractice();
  const active = activeLessonIds(progress);
  const challenges = unlockedChallenges(schedules).map((c) => c.item);
  const menu = buildDailyMenu({ items: orderedItems(), schedules, activeLessonIds: active, now: new Date(), challenges });
  const doneToday = new Set(logs.filter((l) => isToday(l.date)).map((l) => l.itemId));
  const lessonTitle = (id?: string) => content.lessons.find((l) => l.id === id)?.title;

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>{t('today.heading')}</h1>
          <Steps />
        </div>
        {active.length > 0 && (
          <div className="faint small mono">
            {t('today.minutes', { n: menuMinutes(menu) })} · {t('today.stats', { n: doneToday.size })}
          </div>
        )}
      </div>

      {active.length === 0 ? (
        <div className="card empty-state">
          <p>{t('today.empty')}</p>
          <button className="btn btn-primary btn-lg" onClick={() => go({ name: 'lesson', id: content.lessons[0].id })}>
            {t('today.startLesson')}
            <ChevronRight size={16} />
          </button>
        </div>
      ) : (
        <ol className="list">
          {menu.map(({ item, reason }, i) => {
            const sched = schedules.get(item.id);
            const done = doneToday.has(item.id);
            const open = () => go({ name: 'practice', itemId: item.id, back: { name: 'today' } });
            return (
              <li key={item.id} className={`list-row ${done ? 'done' : ''}`}>
                <span className="list-index">{String(i + 1).padStart(2, '0')}</span>
                <span className={`badge badge-${reason}`}>{t(`today.reason.${reason}`)}</span>
                <div className="list-main">
                  <button className="link list-title" onClick={open}>{item.title}</button>
                  <div className="list-meta">
                    <span>{lessonTitle(item.lessonId)}</span>
                    <span>{t(`kind.${item.kind}`)}</span>
                    <span className="mono">{item.minutes} min</span>
                    <span className="mono">{suggestBpm(item, sched)} BPM</span>
                  </div>
                  <Meter value={mastery(item, sched)} />
                </div>
                <div className="list-end">
                  {done && (
                    <span className="badge badge-apply">
                      <CircleCheck size={12} />
                      {t('today.done')}
                    </span>
                  )}
                  <button className="btn btn-icon" onClick={open} aria-label={item.title}>
                    <Play size={14} fill="currentColor" />
                  </button>
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}
