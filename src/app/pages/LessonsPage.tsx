import { CircleCheck, Lock } from 'lucide-react';
import { content } from '../../content';
import { t } from '../../i18n';
import { useNav } from '../nav';
import { isUnlocked, usePractice } from '../practiceStore';

export function LessonsPage() {
  const go = useNav((s) => s.go);
  const progress = usePractice((s) => s.progress);
  return (
    <div className="page">
      <div className="page-header">
        <h1>{t('lessons.heading')}</h1>
      </div>
      <div className="lesson-grid">
        {content.lessons.map((l) => {
          const p = progress.get(l.id);
          const unlocked = isUnlocked(l.id, progress);
          return (
            <button
              key={l.id}
              className={`card lesson-card ${unlocked ? '' : 'locked'} ${p?.completedAt ? 'completed' : ''}`}
              onClick={() => go({ name: 'lesson', id: l.id })}
            >
              <div className="lesson-num">{l.order}</div>
              <div>
                <h2>{l.title}</h2>
                <p>{l.subtitle}</p>
                {p?.completedAt ? (
                  <span className="badge badge-apply"><CircleCheck size={12} />{t('lessons.completed')}</span>
                ) : p?.startedAt ? (
                  <span className="badge badge-new">{t('lessons.started')}</span>
                ) : !unlocked ? (
                  <span className="badge"><Lock size={11} />{t('lessons.locked')}</span>
                ) : null}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
