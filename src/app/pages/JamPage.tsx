import { Dices } from 'lucide-react';
import { useEffect, useMemo } from 'react';
import { t, tDynamic } from '../../i18n';
import { usePlaybackStore } from '../../playback/store';
import { jamSequence, rootFret } from '../../sequence/generators';
import { getProgression, JAM_KEYS, keyName, PROGRESSIONS, realize } from '../../theory';
import { ChordDisplay, ControlBar, LayerToggles, Legend, LiveFretboard, Shortcuts, usePlayerKeyboard } from '../player/Player';
import { useSettings, type JamSelection } from '../settingsStore';

const STYLES: JamSelection['style'][] = ['blues-shuffle', 'rock', 'ballad'];

const progLabel = (id: string) => tDynamic(`prog.${id}`, id);
const scaleLabel = (name: string) => tDynamic(`scale.${name}`, name);

export function JamPage() {
  usePlayerKeyboard();
  const jam = useSettings((s) => s.jam);
  const loaded = useSettings((s) => s.loaded);
  const setJam = useSettings((s) => s.setJam);
  const load = usePlaybackStore((s) => s.load);
  const template = getProgression(jam.progressionId);
  const seq = useMemo(
    () => jamSequence({ key: jam.key, progressionId: jam.progressionId, scale: jam.scale, style: jam.style, rootString: jam.rootString }),
    [jam.key, jam.progressionId, jam.scale, jam.style, jam.rootString],
  );

  useEffect(() => {
    if (!loaded) return;
    const current = usePlaybackStore.getState();
    const keepBpm = current.sequence?.id.startsWith('jam:') ? current.bpm : undefined;
    load(seq, { bpm: keepBpm, targetBpm: 200 });
  }, [seq, loaded, load]);

  useEffect(() => () => usePlaybackStore.getState().stop(), []);

  const chooseProgression = (id: string) => {
    const p = getProgression(id);
    setJam({ progressionId: id, style: p.style, scale: p.scales[0] });
  };

  const random = () => {
    const p = PROGRESSIONS[Math.floor(Math.random() * PROGRESSIONS.length)];
    const key = JAM_KEYS[Math.floor(Math.random() * JAM_KEYS.length)];
    setJam({ key, progressionId: p.id, style: p.style, scale: p.scales[0], rootString: Math.random() < 0.5 ? 6 : 5 });
  };

  return (
    <div className="practice">
      <div className="practice-main">
        <div className="practice-header">
          <h2>{t('jam.heading')}</h2>
          <div className="chips">
            <span className="chip">{seq.key}{template.minor ? 'm' : ''}</span>
            <span className="chip">{scaleLabel(seq.scale)}</span>
            <span className="chip">{seq.position.from}–{seq.position.to}</span>
          </div>
        </div>
        <p className="muted small" style={{ margin: 0 }}>{t('jam.intro')}</p>
        <div className="stage">
          <LiveFretboard />
          <Legend />
        </div>
        <ControlBar />
        <Shortcuts />
      </div>

      <aside className="practice-side">
        <section className="side-section">
          <ChordDisplay />
        </section>

        <section className="side-section">
          <div className="card-title">
            <h3 style={{ margin: 0 }}>{t('jam.key')}</h3>
            <button className="btn btn-ghost btn-sm" onClick={random}>
              <Dices size={14} />
              {t('jam.random')}
            </button>
          </div>
          <div className="key-grid">
            {JAM_KEYS.map((k) => (
              <button key={k} className={`btn btn-sm ${jam.key === k ? 'active' : ''}`} onClick={() => setJam({ key: k })}>
                {keyName(k, template.minor)}{template.minor ? 'm' : ''}
              </button>
            ))}
          </div>
        </section>

        <section className="side-section">
          <h3>{t('jam.progression')}</h3>
          <div className="prog-list">
            {PROGRESSIONS.map((p) => {
              const chords = realize(p, keyName(jam.key, p.minor));
              const preview = chords.length > 4 ? [...new Set(chords)].join(' · ') : chords.join(' – ');
              return (
                <button key={p.id} className={`prog ${jam.progressionId === p.id ? 'active' : ''}`} onClick={() => chooseProgression(p.id)}>
                  <span className="name">{progLabel(p.id)}</span>
                  <span className="chords">{preview}</span>
                </button>
              );
            })}
          </div>
        </section>

        <section className="side-section">
          <div className="stack">
            <label className="field">
              <span>{t('jam.scale')}</span>
              <select value={jam.scale} onChange={(e) => setJam({ scale: e.target.value })}>
                {template.scales.map((s) => <option key={s} value={s}>{scaleLabel(s)}</option>)}
              </select>
            </label>
            <div className="field">
              <span>{t('jam.style')}</span>
              <div className="segmented sm">
                {STYLES.map((s) => (
                  <button key={s} className={jam.style === s ? 'active' : ''} onClick={() => setJam({ style: s })}>
                    {tDynamic(`style.${s}`, s)}
                  </button>
                ))}
              </div>
            </div>
            <label className="field">
              <span>{t('jam.position')}</span>
              <select value={jam.rootString} onChange={(e) => setJam({ rootString: Number(e.target.value) as 6 | 5 })}>
                {([6, 5] as const).map((n) => (
                  <option key={n} value={n}>{t('jam.rootString', { n, fret: rootFret(jam.key, n) })}</option>
                ))}
              </select>
            </label>
          </div>
        </section>

        <section className="side-section">
          <h3>{t('practice.layers')}</h3>
          <LayerToggles />
        </section>
      </aside>
    </div>
  );
}
