import { ArrowRight, Minus, Pause, Play, Plus, Settings2, Square, StepBack, StepForward } from 'lucide-react';
import { useEffect } from 'react';
import { LEGEND_COLORS } from '../../fretboard/colors';
import { Fretboard } from '../../fretboard/Fretboard';
import { computeVisual } from '../../fretboard/visual';
import { t } from '../../i18n';
import { usePlaybackStore } from '../../playback/store';
import { beatsPerBar, sequenceLength } from '../../sequence/types';
import { TabStrip } from '../../tab/TabStrip';
import { LAYER_KEYS, useSettings } from '../settingsStore';
import { Popover, Switch } from '../ui';

/** 指板（訂閱拍點，只有它跟著 60fps 重繪） */
export function LiveFretboard() {
  const sequence = usePlaybackStore((s) => s.sequence);
  const beat = usePlaybackStore((s) => s.beat);
  const layers = useSettings((s) => s.layers);
  const labelMode = useSettings((s) => s.labelMode);
  if (!sequence) return null;
  return <Fretboard sequence={sequence} beat={beat} layers={layers} labelMode={labelMode} toolbar={<LabelModeSwitch />} />;
}

const LABEL_MODES = ['interval', 'note', 'both'] as const;

/** 指板右上角：音程／音名／兩者（快捷鍵 N 循環切換） */
function LabelModeSwitch() {
  const labelMode = useSettings((s) => s.labelMode);
  const setLabelMode = useSettings((s) => s.setLabelMode);
  return (
    <div className="segmented sm fb-label-switch" role="group" aria-label={t('practice.labelMode')}>
      {LABEL_MODES.map((m) => (
        <button key={m} className={labelMode === m ? 'active' : ''} onClick={() => setLabelMode(m)}>
          {t(`practice.labelMode.${m}`)}
        </button>
      ))}
    </div>
  );
}

export function LiveTab() {
  const sequence = usePlaybackStore((s) => s.sequence);
  const beat = usePlaybackStore((s) => s.beat);
  const seekBeat = usePlaybackStore((s) => s.seekBeat);
  const collapsed = useSettings((s) => s.tabCollapsed);
  const toggleTab = useSettings((s) => s.toggleTab);
  if (!sequence || sequence.events.length === 0) return null;
  return <TabStrip sequence={sequence} beat={beat} collapsed={collapsed} onToggle={toggleTab} onSeek={seekBeat} />;
}

export function ChordDisplay() {
  const sequence = usePlaybackStore((s) => s.sequence);
  const beat = usePlaybackStore((s) => s.beat);
  if (!sequence) return null;
  const vis = computeVisual(sequence, beat);
  return (
    <div className="chord-display">
      <div>
        <div className="faint">{t('practice.currentChord')}</div>
        <div className="chord-now">{vis.chord?.symbol ?? t('practice.noChord')}</div>
      </div>
      <ArrowRight size={18} className="chord-arrow" />
      <div className="next-col">
        <div className="faint">{t('practice.nextChord')}</div>
        <div className="chord-next">{vis.nextChord?.symbol ?? t('practice.noChord')}</div>
      </div>
    </div>
  );
}

function Position() {
  const sequence = usePlaybackStore((s) => s.sequence);
  const raw = usePlaybackStore((s) => s.beat);
  const playing = usePlaybackStore((s) => s.playing);
  if (!sequence) return null;
  const bar = beatsPerBar(sequence);
  const total = Math.round(sequenceLength(sequence) / bar);
  // 預備拍倒數只在播放中顯示；停止時一律顯示開頭位置
  const beat = playing ? raw : Math.max(0, raw);
  if (beat < 0) return <span className="position count-in">{`-${Math.ceil(-beat)}`}</span>;
  const barNo = Math.min(Math.floor(beat / bar) + 1, total);
  const beatNo = Math.floor(beat % bar) + 1;
  const pad = (n: number) => String(n).padStart(2, '0');
  return <span className="position">{`${pad(barNo)} / ${pad(total)} · ${beatNo}`}</span>;
}

function PlaybackSettings() {
  const s = usePlaybackStore();
  if (!s.sequence) return null;
  const totalBars = Math.max(1, Math.round(sequenceLength(s.sequence) / beatsPerBar(s.sequence)));
  const barOptions = Array.from({ length: totalBars }, (_, i) => i + 1);
  return (
    <Popover
      trigger={(open, toggle) => (
        <button className={`btn btn-icon ${open ? 'active' : ''}`} onClick={toggle} title={t('controls.settings')} aria-label={t('controls.settings')}>
          <Settings2 size={16} />
        </button>
      )}
    >
      {s.mode !== 'step' && (
        <>
          <h3>{t('controls.loop')}</h3>
          <Switch checked={s.loop.enabled} onChange={(v) => s.setLoop({ enabled: v })} label={t('controls.loop')} />
          <div className="loop-range">
            <select value={s.loop.fromBar} onChange={(e) => s.setLoop({ fromBar: Number(e.target.value) })} disabled={!s.loop.enabled}>
              {barOptions.map((b) => <option key={b} value={b}>{b}</option>)}
            </select>
            <span className="faint">{t('controls.loopTo')}</span>
            <select value={s.loop.toBar} onChange={(e) => s.setLoop({ toBar: Number(e.target.value) })} disabled={!s.loop.enabled}>
              {barOptions.map((b) => <option key={b} value={b}>{b}</option>)}
            </select>
            <span className="faint">{t('controls.loopBars')}</span>
          </div>
          <hr />
        </>
      )}
      <h3>{t('controls.sound')}</h3>
      <Switch checked={s.mix.guide} onChange={(v) => s.setMix({ guide: v })} label={t('controls.guide')} />
      {s.mode !== 'step' && (
        <>
          <Switch checked={s.mix.backing} onChange={(v) => s.setMix({ backing: v })} label={t('controls.backing')} />
          <Switch checked={s.mix.metronome} onChange={(v) => s.setMix({ metronome: v })} label={t('controls.metronome')} />
        </>
      )}
      {s.mode === 'follow' && (
        <>
          <hr />
          <h3>{t('controls.followOpts')}</h3>
          <Switch checked={s.countIn} onChange={(v) => s.setCountIn(v)} label={t('controls.countIn')} />
          <div className="switch-row">
            <span>{t('controls.speedUp')}</span>
            <select value={s.speedUp} onChange={(e) => s.setSpeedUp(Number(e.target.value))}>
              {[0, 1, 2, 3, 5].map((n) => <option key={n} value={n}>{n === 0 ? '—' : `+${n} BPM`}</option>)}
            </select>
          </div>
        </>
      )}
    </Popover>
  );
}

export function ControlBar() {
  const s = usePlaybackStore();
  if (!s.sequence) return null;
  return (
    <div className="controlbar">
      <div className="cb-group">
        {s.mode === 'step' ? (
          <>
            <button className="btn btn-icon btn-lg" onClick={() => s.stepPrev()} title={t('controls.stepPrev')} aria-label={t('controls.stepPrev')}>
              <StepBack size={18} />
            </button>
            <button className="btn btn-primary btn-lg" onClick={() => void s.togglePlay()}>
              <StepForward size={18} />
              {t('controls.stepNext')}
            </button>
          </>
        ) : (
          <>
            <button
              className="btn btn-primary btn-icon btn-lg"
              onClick={() => void s.togglePlay()}
              title={s.playing ? t('controls.pause') : t('controls.play')}
              aria-label={s.playing ? t('controls.pause') : t('controls.play')}
            >
              {s.playing ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" />}
            </button>
            <button className="btn btn-icon btn-lg" onClick={() => s.stop()} title={t('controls.stop')} aria-label={t('controls.stop')}>
              <Square size={14} fill="currentColor" />
            </button>
          </>
        )}
        <Position />
      </div>

      {s.mode !== 'step' && (
        <>
          <div className="cb-divider" />
          <div className="cb-group">
            <button className="btn btn-icon btn-sm" onClick={() => s.nudgeBpm(-5)} aria-label="BPM -5">
              <Minus size={14} />
            </button>
            <input className="bpm-input" type="number" value={s.bpm} onChange={(e) => s.setBpm(Number(e.target.value))} aria-label="BPM" />
            <button className="btn btn-icon btn-sm" onClick={() => s.nudgeBpm(5)} aria-label="BPM +5">
              <Plus size={14} />
            </button>
            <span className="bpm-label">BPM</span>
          </div>
        </>
      )}

      <div className="cb-divider" />
      <div className="segmented">
        {(['demo', 'follow', 'step'] as const).map((m) => (
          <button key={m} className={s.mode === m ? 'active' : ''} onClick={() => s.setMode(m)}>
            {t(`controls.mode.${m}`)}
          </button>
        ))}
      </div>

      <div className="cb-spacer" />
      {!s.audioReady && <span className="audio-hint">{t('controls.audioHint')}</span>}
      <PlaybackSettings />
    </div>
  );
}

export function LayerToggles() {
  const layers = useSettings((s) => s.layers);
  const toggleLayer = useSettings((s) => s.toggleLayer);
  return (
    <div className="stack">
      <div className="layers">
        {LAYER_KEYS.map((k, i) => (
          <label key={k} className="switch layer-row">
            <kbd>{i + 1}</kbd>
            <span>{t(`practice.layer.${k}`)}</span>
            <input type="checkbox" checked={layers[k]} onChange={() => toggleLayer(k)} />
            <span className="switch-track" />
          </label>
        ))}
      </div>
    </div>
  );
}

const SHAPE_FILL = '#c9ccd6';

/** 圖例：形狀代表角色、顏色代表音程 */
export function Legend() {
  return (
    <div className="legend">
      <span><svg width="13" height="13"><rect x="1" y="1" width="11" height="11" rx="2.5" fill={SHAPE_FILL} /></svg>{t('legend.root')}</span>
      <span><svg width="13" height="13"><circle cx="6.5" cy="6.5" r="5.5" fill={SHAPE_FILL} /></svg>{t('legend.chordTone')}</span>
      <span><svg width="13" height="13"><circle cx="6.5" cy="6.5" r="3.5" fill={SHAPE_FILL} /></svg>{t('legend.scaleTone')}</span>
      <span><svg width="13" height="13"><polygon points="6.5,1 12,6.5 6.5,12 1,6.5" fill={SHAPE_FILL} /></svg>{t('legend.passing')}</span>
      <span><svg width="13" height="13"><circle cx="6.5" cy="6.5" r="5" fill="none" stroke={SHAPE_FILL} strokeDasharray="2.5 2" /></svg>{t('legend.next')}</span>
      <span className="legend-sep" />
      {(['root', 'third', 'fifth', 'seventh', 'blue', 'other'] as const).map((k) => (
        <span key={k}>
          <svg width="10" height="10"><circle cx="5" cy="5" r="5" fill={LEGEND_COLORS[k]} /></svg>
          {t(k === 'root' ? 'legend.root' : `legend.${k}`)}
        </span>
      ))}
    </div>
  );
}

export function Shortcuts() {
  return (
    <div className="shortcuts">
      <span><kbd>Space</kbd>{t('shortcut.play')}</span>
      <span><kbd>↑</kbd><kbd>↓</kbd>{t('shortcut.bpm5')}</span>
      <span><kbd>←</kbd><kbd>→</kbd>{t('shortcut.bpm1')}</span>
      <span><kbd>1</kbd>–<kbd>5</kbd>{t('shortcut.layers')}</span>
      <span><kbd>N</kbd>{t('shortcut.labels')}</span>
    </div>
  );
}

/** 鍵盤快捷鍵：Space 播放／暫停（逐步＝前進）、方向鍵 BPM、數字鍵疊層、N 標籤 */
export function usePlayerKeyboard(): void {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA') return;
      const pb = usePlaybackStore.getState();
      if (e.code === 'Space') {
        e.preventDefault();
        void pb.togglePlay();
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        pb.nudgeBpm(5);
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        pb.nudgeBpm(-5);
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        if (pb.mode === 'step') pb.stepNext();
        else pb.nudgeBpm(1);
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        if (pb.mode === 'step') pb.stepPrev();
        else pb.nudgeBpm(-1);
      } else if (/^[1-5]$/.test(e.key)) {
        useSettings.getState().toggleLayer(LAYER_KEYS[Number(e.key) - 1]);
      } else if (e.key === 'n' || e.key === 'N') {
        const st = useSettings.getState();
        st.setLabelMode(LABEL_MODES[(LABEL_MODES.indexOf(st.labelMode) + 1) % LABEL_MODES.length]);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);
}
