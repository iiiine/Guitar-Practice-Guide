import { Check, Play } from 'lucide-react';
import { getGenre, getItem } from '../../content';
import { t } from '../../i18n';
import { mastery } from '../../practice';
import { useNav } from '../nav';
import { usePractice } from '../practiceStore';
import { Meter } from '../ui';

export function BluesPage() {
  const go = useNav((s) => s.go);
  const schedules = usePractice((s) => s.schedules);
  const genre = getGenre('blues');
  if (!genre) return null;
  const back = { name: 'blues' } as const;
  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>{genre.title}</h1>
          <p>{genre.description}</p>
        </div>
        <button className="btn btn-primary btn-lg" onClick={() => go({ name: 'practice', itemId: genre.jamItemId, back })}>
          <Play size={16} fill="currentColor" />
          {t('genre.jam')}
        </button>
      </div>
      <div className="split">
        <section className="card">
          <h3 style={{ marginBottom: 12 }}>{t('genre.feel')}</h3>
          <ul className="feel-list">
            {genre.feel.map((f, i) => (
              <li key={i}>
                <Check size={14} />
                <span>{f}</span>
              </li>
            ))}
          </ul>
        </section>
        <section className="card">
          <h3 style={{ marginBottom: 8 }}>{t('genre.items')}</h3>
          <ul className="item-list">
            {genre.itemIds.map((id) => {
              const it = getItem(id);
              if (!it) return null;
              return (
                <li key={id} style={{ gridTemplateColumns: '52px 1fr 90px' }}>
                  <span className="badge">{t(`kind.${it.kind}`)}</span>
                  <button className="link" onClick={() => go({ name: 'practice', itemId: id, back })}>{it.title}</button>
                  <Meter value={mastery(it, schedules.get(id))} />
                </li>
              );
            })}
          </ul>
        </section>
      </div>
    </div>
  );
}
