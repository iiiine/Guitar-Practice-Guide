import { memo, useMemo, useRef, type ReactNode } from 'react';
import type { EventSequence, NoteEvent } from '../sequence/types';
import {
  chromaAt,
  getChord,
  getScale,
  inferRole,
  intervalLabel,
  landingPoints,
  MAX_FRET,
  midiAt,
  noteNameAt,
  positionsOf,
  prefersFlats,
  semitonesFrom,
  STRINGS,
  type NoteRole,
} from '../theory';
import { INTERVAL_COLORS, ROLE_SHAPE } from './colors';
import { computeVisual, followWindow, VIEW_FRETS } from './visual';

export interface Layers {
  scale: boolean;
  landing: boolean;
  labels: boolean;
  trail: boolean;
  next: boolean;
}

/** 標籤：音程（R、b3…）／音名（C、D…）／兩者（當下的音同時顯示音名與音程） */
export type LabelMode = 'interval' | 'note' | 'both';

interface Props {
  sequence: EventSequence;
  beat: number;
  layers: Layers;
  labelMode: LabelMode;
  /** 指板右上角的工具列（例如標籤切換） */
  toolbar?: ReactNode;
}

const FW = 64; // 每格寬
const SH = 46; // 弦距
const LEFT = 56; // 空弦區
const TOP = 26;
const HEIGHT = TOP * 2 + SH * 5 + 16;
const WIDTH = LEFT + FW * VIEW_FRETS;
const INLAYS = [3, 5, 7, 9, 15, 17, 19, 21];

const xOf = (fret: number) => (fret === 0 ? -FW * 0.45 : (fret - 0.5) * FW);
const yOf = (string: number) => TOP + (string - 1) * SH;

function Shape({
  role,
  x,
  y,
  fill,
  stroke,
  opacity = 1,
  scale = 1,
  dashed = false,
}: {
  role: NoteRole;
  x: number;
  y: number;
  fill: string;
  stroke: string;
  opacity?: number;
  scale?: number;
  dashed?: boolean;
}) {
  const shape = ROLE_SHAPE[role];
  const common = {
    fill,
    stroke,
    strokeWidth: 2.5,
    opacity,
    strokeDasharray: dashed ? '4 3' : undefined,
  };
  const r = (shape === 'small' ? 10 : 14) * scale;
  if (shape === 'square') return <rect x={x - r} y={y - r} width={r * 2} height={r * 2} rx={5} {...common} />;
  if (shape === 'diamond')
    return <polygon points={`${x},${y - r} ${x + r},${y} ${x},${y + r} ${x - r},${y}`} {...common} />;
  return <circle cx={x} cy={y} r={r} {...common} />;
}

function Techniques({ e, y }: { e: NoteEvent; y: number }) {
  const x = xOf(e.fret);
  return (
    <>
      {e.technique?.map((t, i) => {
        if (t.type === 'bend') {
          return (
            <g key={i} className="fb-tech">
              <path d={`M ${x + 14} ${y} Q ${x + 30} ${y} ${x + 30} ${y - 26}`} fill="none" strokeWidth={2.5} />
              <path d={`M ${x + 24} ${y - 20} L ${x + 30} ${y - 28} L ${x + 36} ${y - 20}`} fill="none" strokeWidth={2.5} />
              <text x={x + 40} y={y - 22} className="fb-tech-label">
                {t.amount >= 2 ? 'full' : t.amount === 1 ? '½' : `${t.amount}`}
              </text>
            </g>
          );
        }
        if (t.type === 'slide') {
          const x2 = xOf(t.toFret);
          return (
            <g key={i} className="fb-tech">
              <line x1={x + 16} y1={y} x2={x2 - 16} y2={y} strokeWidth={3} />
              <path d={`M ${x2 - 24} ${y - 6} L ${x2 - 15} ${y} L ${x2 - 24} ${y + 6}`} fill="none" strokeWidth={3} />
            </g>
          );
        }
        if (t.type === 'vibrato') {
          return (
            <path
              key={i}
              className="fb-tech"
              d={`M ${x - 14} ${y - 22} q 4 -5 7 0 t 7 0 t 7 0 t 7 0`}
              fill="none"
              strokeWidth={2}
            />
          );
        }
        return null;
      })}
    </>
  );
}

function FretboardImpl({ sequence, beat, layers, labelMode, toolbar }: Props) {
  const fromRef = useRef(0);
  const vis = computeVisual(sequence, beat);
  const win = followWindow(sequence, beat, fromRef.current);
  fromRef.current = win.from;

  const scale = useMemo(() => getScale(sequence.key, sequence.scale), [sequence.key, sequence.scale]);
  const flats = prefersFlats(sequence.key, sequence.scale) || scale.notes.some((n) => n.includes('b'));
  const chordSymbol = vis.chord?.symbol;
  const ref = vis.referenceChroma;

  const noteLabel = (string: NoteEvent['string'], fret: number) => {
    const chroma = chromaAt(string, fret);
    const inScale = scale.chromas.indexOf(chroma);
    return inScale >= 0 ? scale.notes[inScale] : noteNameAt(string, fret, flats);
  };
  const intervalText = (string: NoteEvent['string'], fret: number) => {
    const iv = intervalLabel(chromaAt(string, fret), ref);
    return iv === '1' ? 'R' : iv;
  };
  // 「兩者」模式：主標籤用音名，音程只在當下的音旁邊加小標
  const label = (string: NoteEvent['string'], fret: number) =>
    labelMode === 'interval' ? intervalText(string, fret) : noteLabel(string, fret);
  const colorOf = (string: NoteEvent['string'], fret: number, bendAmount = 0) =>
    INTERVAL_COLORS[semitonesFrom(chromaAt(string, fret) + bendAmount, ref)];
  const roleOf = (string: NoteEvent['string'], fret: number) => inferRole(midiAt(string, fret), scale, chordSymbol);

  // 疊層只畫在建議把位內（±1 品），讓使用者看清楚「這個手型」
  const lo = Math.max(0, win.from - 1, sequence.position.from - 1);
  const hi = Math.min(MAX_FRET, win.to + 1, sequence.position.to + 1);
  const scalePositions = layers.scale ? positionsOf(scale.chromas, lo, hi) : [];
  const landing = layers.landing && chordSymbol ? landingPoints(chordSymbol, lo, hi) : [];
  const nextLanding =
    layers.landing && vis.nextChord && vis.nextChord.symbol !== chordSymbol ? landingPoints(vis.nextChord.symbol, lo, hi) : [];
  const nextChordChromas = vis.nextChord ? getChord(vis.nextChord.symbol).chromas : [];
  const currentKeys = new Set(vis.current.map((e) => `${e.string}:${e.fret}`));
  const shift = LEFT - win.from * FW + (win.from === 0 ? 0 : FW * 0.15);

  return (
    <div className="fretboard-wrap">
      <div className="fb-head">
        <MiniBoard from={win.from} to={win.to} current={vis.current} />
        {toolbar}
      </div>
      <svg className="fretboard" viewBox={`0 0 ${WIDTH} ${HEIGHT}`} role="img" aria-label="fretboard">
        <defs>
          <clipPath id="fb-clip">
            <rect x={0} y={0} width={WIDTH} height={HEIGHT} />
          </clipPath>
        </defs>
        <g clipPath="url(#fb-clip)">
          <g className="fb-scroll" style={{ transform: `translateX(${shift}px)` }}>
            <rect x={0} y={TOP - 12} width={FW * MAX_FRET} height={SH * 5 + 24} fill="#202226" rx={3} />
            {INLAYS.map((f) => (
              <circle key={f} cx={xOf(f)} cy={TOP + SH * 2.5} r={6} className="fb-inlay" />
            ))}
            <circle cx={xOf(12)} cy={TOP + SH * 1.5} r={6} className="fb-inlay" />
            <circle cx={xOf(12)} cy={TOP + SH * 3.5} r={6} className="fb-inlay" />
            {Array.from({ length: MAX_FRET + 1 }, (_, f) => (
              <line
                key={f}
                x1={f * FW}
                x2={f * FW}
                y1={TOP - 12}
                y2={TOP + SH * 5 + 12}
                className={f === 0 ? 'fb-nut' : 'fb-fret'}
              />
            ))}
            {Array.from({ length: MAX_FRET }, (_, i) => (
              <text key={i} x={xOf(i + 1)} y={HEIGHT - 4} className="fb-fretnum">
                {i + 1}
              </text>
            ))}
            {STRINGS.map((s) => (
              <line key={s} x1={-FW} x2={FW * MAX_FRET} y1={yOf(s)} y2={yOf(s)} className="fb-string" strokeWidth={0.8 + s * 0.35} />
            ))}

            {/* 音階疊層 */}
            {scalePositions.map((p) => {
              const role = roleOf(p.string, p.fret);
              if (currentKeys.has(`${p.string}:${p.fret}`)) return null;
              return (
                <g key={`s${p.string}:${p.fret}`} opacity={0.38}>
                  <Shape role={role} x={xOf(p.fret)} y={yOf(p.string)} fill="var(--fb-dot)" stroke={colorOf(p.string, p.fret)} scale={0.8} />
                  {layers.labels && (
                    <text x={xOf(p.fret)} y={yOf(p.string) + 4} className="fb-label fb-label-dim">
                      {label(p.string, p.fret)}
                    </text>
                  )}
                </g>
              );
            })}

            {/* 下一個和弦的落點預告：小點 */}
            {nextLanding.map((p) => (
              <circle
                key={`nl${p.string}:${p.fret}`}
                cx={xOf(p.fret) + 15}
                cy={yOf(p.string) - 13}
                r={4}
                className="fb-next-landing"
              />
            ))}

            {/* 目前和弦的安全落點：發光外圈 */}
            {landing.map((p) => (
              <g key={`l${p.string}:${p.fret}`} className="fb-landing">
                <Shape
                  role={p.role}
                  x={xOf(p.fret)}
                  y={yOf(p.string)}
                  fill="none"
                  stroke={colorOf(p.string, p.fret)}
                  opacity={nextChordChromas.includes(chromaAt(p.string, p.fret)) ? 0.95 : 0.7}
                  scale={1.1}
                />
              </g>
            ))}

            {/* 殘影：漸淡，顯示路徑 */}
            {layers.trail && (
              <>
                {vis.trail.length > 1 && (
                  <polyline
                    points={[...vis.trail].reverse().map((t) => `${xOf(t.e.fret)},${yOf(t.e.string)}`).concat(
                      vis.current.slice(0, 1).map((e) => `${xOf(e.fret)},${yOf(e.string)}`),
                    ).join(' ')}
                    className="fb-path"
                  />
                )}
                {vis.trail.map((t, i) => (
                  <Shape
                    key={`t${i}`}
                    role={t.e.role ?? 'scaleTone'}
                    x={xOf(t.e.fret)}
                    y={yOf(t.e.string)}
                    fill={colorOf(t.e.string, t.e.fret)}
                    stroke="none"
                    opacity={0.15 + 0.4 * t.fade}
                    scale={0.85}
                  />
                ))}
              </>
            )}

            {/* 下一個音：空心外框 */}
            {layers.next &&
              vis.next.map((e, i) => (
                <g key={`n${i}`}>
                  <Shape role={e.role ?? 'scaleTone'} x={xOf(e.fret)} y={yOf(e.string)} fill="none" stroke="#e6e8eb" dashed scale={1.15} />
                  {e.finger !== undefined && e.finger > 0 && (
                    <text x={xOf(e.fret)} y={yOf(e.string) - 20} className="fb-finger">
                      {e.finger}
                    </text>
                  )}
                </g>
              ))}

            {/* 當下的音：實心、最亮 */}
            {vis.current.map((e, i) => {
              const bendT = e.technique?.find((t) => t.type === 'bend');
              const bendAmt = bendT?.type === 'bend' ? bendT.amount : 0;
              const color = colorOf(e.string, e.fret, bendAmt);
              return (
                <g key={`c${i}`} className="fb-current">
                  <Shape role={e.role ?? 'scaleTone'} x={xOf(e.fret)} y={yOf(e.string)} fill={color} stroke="#ffffff" scale={1.25} />
                  <text x={xOf(e.fret)} y={yOf(e.string) + 5} className="fb-label fb-label-current">
                    {label(e.string, e.fret)}
                  </text>
                  {labelMode === 'both' && (
                    <g className="fb-sub">
                      <rect x={xOf(e.fret) + 11} y={yOf(e.string) + 9} width={22} height={14} rx={3} />
                      <text x={xOf(e.fret) + 22} y={yOf(e.string) + 19.5}>
                        {intervalText(e.string, e.fret)}
                      </text>
                    </g>
                  )}
                  {e.finger !== undefined && e.finger > 0 && (
                    <text x={xOf(e.fret)} y={yOf(e.string) - 22} className="fb-finger fb-finger-current">
                      {e.finger}
                    </text>
                  )}
                  <g stroke={color}>
                    <Techniques e={e} y={yOf(e.string)} />
                  </g>
                </g>
              );
            })}
          </g>
        </g>
      </svg>
    </div>
  );
}

/** 迷你全指板：標示目前視窗與當下的音。 */
function MiniBoard({ from, to, current }: { from: number; to: number; current: NoteEvent[] }) {
  const w = 8;
  const h = 4;
  const W = w * (MAX_FRET + 1);
  return (
    <svg className="miniboard" viewBox={`0 0 ${W} ${h * 6 + 4}`} preserveAspectRatio="none" aria-hidden>
      <rect x={0} y={0} width={W} height={h * 6 + 4} className="mini-bg" />
      {[...INLAYS, 12].map((f) => (
        <rect key={f} x={f * w + w / 2 - 1} y={h * 3} width={2} height={2} className="mini-inlay" />
      ))}
      <rect x={from * w} y={0} width={(to - from + 1) * w} height={h * 6 + 4} className="mini-window" />
      {current.map((e, i) => (
        <rect key={i} x={e.fret * w + 1} y={(e.string - 1) * h + 2} width={w - 2} height={h} className="mini-note" />
      ))}
    </svg>
  );
}

export const Fretboard = memo(FretboardImpl);
