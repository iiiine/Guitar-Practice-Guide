import { ArrowLeft, CircleCheck, Lightbulb, Lock, LockOpen } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { challengesFor, getItem, getSequence, isMastered, unlockBpm } from '../../content';
import { t, tDynamic } from '../../i18n';
import { usePlaybackStore } from '../../playback/store';
import { mastery, suggestBpm, type SelfRating } from '../../practice';
import { changeRhythm, moveToPosition, transpose, transposeName, type EventSequence, type RhythmVariant } from '../../sequence';
import { displayKey } from '../../theory';
import { useNav, type Route } from '../nav';
import { usePractice } from '../practiceStore';
import { ChordDisplay, ControlBar, LayerToggles, Legend, LiveFretboard, LiveTab, Shortcuts, usePlayerKeyboard } from '../player/Player';
import { Meter } from '../ui';

interface Variation {
  transpose: number;
  position: number | null;
  rhythm: RhythmVariant | 'original';
}

const ORIGINAL: Variation = { transpose: 0, position: null, rhythm: 'original' };
const POSITIONS = [1, 3, 5, 7, 8, 10, 12];
const TRANSPOSE_RANGE = Array.from({ length: 12 }, (_, i) => i - 5);

/** 依序套用變化；任何一步沒通過檢查器就回傳 null。 */
function applyVariation(base: EventSequence, v: Variation): EventSequence | null {
  let seq: EventSequence | null = base;
  if (v.transpose !== 0) seq = transpose(seq, v.transpose);
  if (seq && v.position !== null) seq = moveToPosition(seq, v.position);
  if (seq && v.rhythm !== 'original') seq = changeRhythm(seq, v.rhythm);
  return seq;
}

export function PracticePage({ itemId, back }: { itemId: string; back?: Route }) {
  usePlayerKeyboard();
  const go = useNav((s) => s.go);
  const item = getItem(itemId);
  const base = item ? getSequence(item.sequenceId) : getSequence(itemId);
  const schedule = usePractice((s) => s.schedules.get(itemId));
  const rate = usePractice((s) => s.rate);
  const load = usePlaybackStore((s) => s.load);
  const bpm = usePlaybackStore((s) => s.bpm);
  const mode = usePlaybackStore((s) => s.mode);
  const [variation, setVariation] = useState<Variation>(ORIGINAL);
  const [rated, setRated] = useState<{ text: string; unlocked: number } | null>(null);

  // 轉調選單直接列出調名；轉不過去（超出指板、檢查器不過）的調停用
  const keyOptions = useMemo(
    () =>
      base
        ? TRANSPOSE_RANGE.map((n) => {
            const key = displayKey(transposeName(base.key, n), base.scale);
            return { n, key, ok: n === 0 || transpose(base, n) !== null };
          })
        : [],
    [base],
  );
  const varied = useMemo(() => (base ? applyVariation(base, variation) : null), [base, variation]);
  const effective = varied ?? base;
  const suggested = item ? suggestBpm(item, schedule) : base?.tempo ?? 70;

  useEffect(() => {
    if (!effective) return;
    const current = usePlaybackStore.getState();
    const sameItem = current.sequence?.id.split('~')[0] === effective.id.split('~')[0];
    load(effective, { bpm: sameItem ? current.bpm : suggested, targetBpm: item?.targetBpm });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [effective]);

  useEffect(() => () => usePlaybackStore.getState().stop(), []);

  if (!base) return <div className="page">Not found: {itemId}</div>;
  const shown = varied ?? base;
  const challengeCount = challengesFor(itemId).length;

  const onRate = async (r: SelfRating) => {
    const wasMastered = item ? isMastered(item, schedule) : false;
    const res = await rate(itemId, r, bpm, mode);
    const after = usePractice.getState().schedules.get(itemId);
    const unlocked = item && !wasMastered && challengeCount > 0 && isMastered(item, after) ? challengeCount : 0;
    setRated({ text: t('practice.rated', { rating: t(`practice.rate.${r}`), bpm, next: res.next }), unlocked });
  };

  return (
    <div className="practice">
      <div className="practice-main">
        <div className="practice-header">
          <button className="btn btn-ghost btn-sm" onClick={() => go(back ?? { name: 'today' })}>
            <ArrowLeft size={15} />
            {t('practice.back')}
          </button>
          <h2>{item?.title ?? base.title}</h2>
          <div className="chips">
            <span className="chip">{displayKey(shown.key, shown.scale)} {tDynamic(`scale.${shown.scale}`, shown.scale)}</span>
            <span className="chip">{shown.position.from}–{shown.position.to}</span>
          </div>
        </div>
        <div className="stage">
          <LiveFretboard />
          <Legend />
        </div>
        <LiveTab />
        <ControlBar />
        <Shortcuts />
      </div>

      <aside className="practice-side">
        <section className="side-section">
          <h3>{t('practice.goal')}</h3>
          <p className="goal-title">{base.title}</p>
          {item?.challengeOf && (
            <p className="small muted">
              {t('practice.challengeOf')}
              <button className="link small" onClick={() => go({ name: 'practice', itemId: item.challengeOf!, back })}>
                {getItem(item.challengeOf)?.title}
              </button>
            </p>
          )}
          {base.tip && (
            <p className="tip">
              <Lightbulb size={14} />
              <span>{base.tip}</span>
            </p>
          )}
          {base.events.length === 0 && (
            <p className="tip">
              <Lightbulb size={14} />
              <span>{t('practice.jamHint')}</span>
            </p>
          )}
          {item && (
            <>
              <dl className="goal-stats">
                <dt>{t('practice.target')}</dt>
                <dd>{item.targetBpm} BPM</dd>
                <dt>{t('practice.suggested')}</dt>
                <dd>{suggested} BPM</dd>
                {schedule && schedule.bestSmoothBpm > 0 && (
                  <>
                    <dt>{t('practice.best')}</dt>
                    <dd>{schedule.bestSmoothBpm} BPM</dd>
                  </>
                )}
              </dl>
              <Meter value={mastery(item, schedule)} />
            </>
          )}
          {item && challengeCount > 0 && !isMastered(item, schedule) && (
            <p className="notice" style={{ marginTop: 10 }}>
              <Lock size={13} />
              <span>{t('practice.unlockHint', { bpm: unlockBpm(item), n: challengeCount })}</span>
            </p>
          )}
        </section>

        <section className="side-section">
          <ChordDisplay />
        </section>

        <section className="side-section">
          <h3>{t('practice.layers')}</h3>
          <LayerToggles />
        </section>

        {base.events.length > 0 && (
          <section className="side-section">
            <h3>{t('practice.variation')}</h3>
            <div className="stack">
              <label className="field">
                <span>{t('practice.variation.transpose')}</span>
                <select value={variation.transpose} onChange={(e) => setVariation({ ...variation, transpose: Number(e.target.value) })}>
                  {keyOptions.map((o) => (
                    <option key={o.n} value={o.n} disabled={!o.ok}>
                      {o.n === 0 ? `${o.key}（${t('practice.variation.originalKey')}）` : o.ok ? o.key : `${o.key}（${t('practice.variation.unavailable')}）`}
                    </option>
                  ))}
                </select>
              </label>
              <label className="field">
                <span>{t('practice.variation.position')}</span>
                <select
                  value={variation.position ?? ''}
                  onChange={(e) => setVariation({ ...variation, position: e.target.value === '' ? null : Number(e.target.value) })}
                >
                  <option value="">{t('practice.variation.original')}</option>
                  {POSITIONS.map((p) => <option key={p} value={p}>{p}–{p + 4}</option>)}
                </select>
              </label>
              <label className="field">
                <span>{t('practice.variation.rhythm')}</span>
                <select value={variation.rhythm} onChange={(e) => setVariation({ ...variation, rhythm: e.target.value as Variation['rhythm'] })}>
                  <option value="original">{t('practice.variation.original')}</option>
                  <option value="halfTime">{t('practice.variation.halfTime')}</option>
                  <option value="swing">{t('practice.variation.swing')}</option>
                  <option value="straight">{t('practice.variation.straight')}</option>
                </select>
              </label>
              {!varied && <p className="notice small warn">{t('practice.variation.none')}</p>}
            </div>
          </section>
        )}

        {item && (
          <section className="side-section">
            <h3>{t('practice.rate')}</h3>
            <div className="rating">
              {(['smooth', 'stuck', 'cannot'] as const).map((r) => (
                <button key={r} className={`btn rate-${r}`} onClick={() => void onRate(r)}>
                  <span className="rate-dot" />
                  {t(`practice.rate.${r}`)}
                </button>
              ))}
            </div>
            <p className="faint small" style={{ marginTop: 6 }}>{t('practice.rateAt', { bpm })}</p>
            {rated && (
              <div className="stack">
                <p className="notice notice-ok">
                  <CircleCheck size={14} />
                  <span>{rated.text}</span>
                </p>
                {rated.unlocked > 0 && (
                  <p className="notice notice-accent">
                    <LockOpen size={14} />
                    <span>{t('practice.unlocked', { n: rated.unlocked })}</span>
                  </p>
                )}
              </div>
            )}
          </section>
        )}
      </aside>
    </div>
  );
}
