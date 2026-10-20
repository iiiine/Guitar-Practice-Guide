import { getItem } from '../../content';
import { t } from '../../i18n';
import { mastery } from '../../practice';
import { usePractice } from '../practiceStore';
import { Meter } from '../ui';

const fmt = (iso: string | Date) =>
  new Date(iso).toLocaleString('zh-TW', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false });

export function LogPage() {
  const { logs, schedules } = usePractice();
  const sorted = [...logs].reverse();
  return (
    <div className="page">
      <div className="page-header">
        <h1>{t('log.heading')}</h1>
      </div>
      {logs.length === 0 ? (
        <div className="card empty-state">
          <p>{t('log.empty')}</p>
        </div>
      ) : (
        <div className="log-grid">
          <section className="card">
            <h3 style={{ marginBottom: 8 }}>{t('log.schedule')}</h3>
            <table className="table">
              <thead>
                <tr>
                  <th>{t('log.item')}</th>
                  <th>{t('log.rating')}</th>
                  <th>{t('log.bpm')}</th>
                  <th style={{ width: 140 }}>{t('log.mastery')}</th>
                  <th>{t('log.due')}</th>
                </tr>
              </thead>
              <tbody>
                {[...schedules.values()].map((s) => {
                  const it = getItem(s.itemId);
                  return (
                    <tr key={s.itemId}>
                      <td>{it?.title ?? s.itemId}</td>
                      <td className={`rate-text-${s.lastRating}`}>{t(`practice.rate.${s.lastRating}`)}</td>
                      <td className="num">{s.lastBpm}</td>
                      <td>{it && <Meter value={mastery(it, s)} />}</td>
                      <td className="num">{fmt(s.card.due)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </section>
          <section className="card">
            <h3 style={{ marginBottom: 8 }}>{t('log.heading')}</h3>
            <table className="table">
              <thead>
                <tr>
                  <th>{t('log.date')}</th>
                  <th>{t('log.item')}</th>
                  <th>{t('log.rating')}</th>
                  <th>{t('log.bpm')}</th>
                  <th>{t('log.mode')}</th>
                </tr>
              </thead>
              <tbody>
                {sorted.map((l) => (
                  <tr key={l.id}>
                    <td className="num">{fmt(l.date)}</td>
                    <td>{getItem(l.itemId)?.title ?? l.itemId}</td>
                    <td className={`rate-text-${l.rating}`}>{t(`practice.rate.${l.rating}`)}</td>
                    <td className="num">{l.bpm}</td>
                    <td>{t(`controls.mode.${l.mode}`)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        </div>
      )}
    </div>
  );
}
