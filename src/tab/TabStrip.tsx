import { ChevronDown, ChevronRight } from 'lucide-react';
import { memo } from 'react';
import { t } from '../i18n';
import { beatsPerBar, sequenceLength, type EventSequence, type NoteEvent } from '../sequence/types';
import { STRINGS } from '../theory';

interface Props {
  sequence: EventSequence;
  beat: number;
  collapsed: boolean;
  onToggle(): void;
  onSeek(beat: number): void;
  barsPerPage?: number;
}

const LINE = 13;
const TOP = 24;
const BEAT_W = 72;
const LEFT = 26;

function techSuffix(e: NoteEvent): string {
  return (e.technique ?? [])
    .map((tq) => {
      switch (tq.type) {
        case 'bend':
          return `b${tq.amount >= 2 ? '' : '½'}`;
        case 'slide':
          return `/${tq.toFret}`;
        case 'vibrato':
          return '~';
        case 'hammer':
          return 'h';
        case 'pull':
          return 'p';
        case 'mute':
          return 'x';
        case 'ghost':
          return '()';
      }
    })
    .join('');
}

/** 六線譜窄條：2–4 小節一頁，跟著播放翻頁；點音符跳轉。 */
function TabStripImpl({ sequence, beat, collapsed, onToggle, onSeek, barsPerPage = 4 }: Props) {
  const bar = beatsPerBar(sequence);
  const total = sequenceLength(sequence);
  const pageBeats = bar * barsPerPage;
  const page = Math.floor(Math.max(0, Math.min(beat, total - 1e-6)) / pageBeats);
  const from = page * pageBeats;
  const to = Math.min(total, from + pageBeats);
  const width = LEFT + (to - from) * BEAT_W + 10;
  const height = TOP + LINE * 5 + 16;
  const visible = sequence.events.filter((e) => e.start >= from - 1e-6 && e.start < to - 1e-6);
  const x = (b: number) => LEFT + (b - from) * BEAT_W;

  return (
    <div className={`tabstrip ${collapsed ? 'collapsed' : ''}`}>
      <button className="tab-toggle" onClick={onToggle} title={collapsed ? t('tab.expand') : t('tab.collapse')}>
        {collapsed ? <ChevronRight size={13} /> : <ChevronDown size={13} />}
        TAB
      </button>
      {!collapsed && (
        <svg viewBox={`0 0 ${width} ${height}`} className="tab-svg" preserveAspectRatio="xMinYMid meet">
          {STRINGS.map((s) => (
            <line key={s} x1={LEFT - 8} x2={width - 6} y1={TOP + (s - 1) * LINE} y2={TOP + (s - 1) * LINE} className="tab-line" />
          ))}
          {Array.from({ length: Math.round((to - from) / bar) + 1 }, (_, i) => (
            <line key={i} x1={x(from + i * bar) - 8} x2={x(from + i * bar) - 8} y1={TOP} y2={TOP + LINE * 5} className="tab-bar" />
          ))}
          {sequence.chords
            .filter((c) => c.start < to && c.end > from)
            .map((c, i) => (
              <text key={i} x={x(Math.max(c.start, from))} y={12} className="tab-chord">
                {c.symbol}
              </text>
            ))}
          {visible.map((e, i) => {
            const active = beat >= e.start && beat < e.start + Math.max(e.duration, 0.2);
            return (
              <g key={i} className={`tab-note ${active ? 'active' : ''}`} onClick={() => onSeek(e.start)}>
                <rect x={x(e.start) - 6} y={TOP + (e.string - 1) * LINE - 6} width={12 + techSuffix(e).length * 6} height={12} className="tab-note-bg" />
                <text x={x(e.start)} y={TOP + (e.string - 1) * LINE + 4} className={`tab-num role-${e.role ?? 'scaleTone'}`}>
                  {e.fret}
                  {techSuffix(e)}
                </text>
              </g>
            );
          })}
          {beat >= from && beat < to && <line x1={x(beat)} x2={x(beat)} y1={TOP - 10} y2={TOP + LINE * 5 + 8} className="tab-playhead" />}
          <text x={width - 8} y={height - 3} className="tab-page">
            {page + 1}/{Math.ceil(total / pageBeats)}
          </text>
        </svg>
      )}
    </div>
  );
}

export const TabStrip = memo(TabStripImpl);
