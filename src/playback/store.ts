import { create } from 'zustand';
import type { PlayMode } from '../practice/types';
import { assignRoles } from '../sequence/roles';
import { beatsPerBar, sequenceLength, type EventSequence, type NoteEvent } from '../sequence/types';
import { engine, type MixState } from './engine';

export interface LoopState {
  enabled: boolean;
  /** 1 起算、含頭含尾 */
  fromBar: number;
  toBar: number;
}

interface PlaybackState {
  sequence: EventSequence | null;
  beat: number;
  playing: boolean;
  audioReady: boolean;
  bpm: number;
  targetBpm: number;
  mode: PlayMode;
  loop: LoopState;
  mix: MixState;
  speedUp: number;
  countIn: boolean;
  stepIndex: number;
  loops: number;
  /** 試聽中（不循環、播完即停） */
  auditioning: string | null;
}

interface PlaybackActions {
  load(seq: EventSequence, opts?: { bpm?: number; targetBpm?: number }): void;
  togglePlay(): Promise<void>;
  stop(): void;
  setBpm(bpm: number): void;
  nudgeBpm(delta: number): void;
  setMode(mode: PlayMode): void;
  setLoop(loop: Partial<LoopState>): void;
  setMix(mix: Partial<MixState>): void;
  setSpeedUp(n: number): void;
  setCountIn(on: boolean): void;
  stepNext(): void;
  stepPrev(): void;
  seekBeat(beat: number): void;
  audition(seq: EventSequence): Promise<void>;
}

export const MIN_BPM = 30;
export const MAX_BPM = 240;

const MODE_MIX: Record<PlayMode, MixState> = {
  demo: { guide: true, backing: true, metronome: false },
  follow: { guide: false, backing: true, metronome: true },
  step: { guide: true, backing: false, metronome: false },
};

/** 逐步模式的落點：每個不同的起點是一步。 */
export function stepOnsets(seq: EventSequence | null): number[] {
  if (!seq) return [];
  return [...new Set(seq.events.map((e) => Math.round(e.start * 1000) / 1000))].sort((a, b) => a - b);
}

function eventsAt(seq: EventSequence, beat: number): NoteEvent[] {
  return seq.events.filter((e) => Math.abs(e.start - beat) < 1e-3);
}

export const usePlaybackStore = create<PlaybackState & PlaybackActions>((set, get) => {
  const pushToEngine = () => {
    const { sequence, mode, loop, countIn, auditioning } = get();
    if (!sequence) return;
    const bar = beatsPerBar(sequence);
    engine.load(sequence, {
      mode,
      countIn,
      loop: auditioning
        ? { enabled: false, from: 0, to: sequenceLength(sequence) }
        : { enabled: loop.enabled, from: (loop.fromBar - 1) * bar, to: loop.toBar * bar },
    });
  };

  engine.onTick((beat) => {
    if (get().mode !== 'step' || get().playing) set({ beat });
  });
  engine.onLoop(() => {
    const { mode, speedUp, bpm, targetBpm } = get();
    set((s) => ({ loops: s.loops + 1 }));
    if (mode === 'follow' && speedUp > 0 && bpm < targetBpm) {
      const next = Math.min(targetBpm, bpm + speedUp);
      engine.setBpm(next);
      set({ bpm: next });
    }
  });
  engine.onEnd(() => {
    set({ playing: false, auditioning: null });
    pushToEngine();
  });

  const ensureAudio = async () => {
    if (!engine.ready) {
      await engine.init();
      engine.setMix(get().mix);
      engine.setBpm(get().bpm);
      set({ audioReady: true });
    }
  };

  return {
    sequence: null,
    beat: 0,
    playing: false,
    audioReady: false,
    bpm: 70,
    targetBpm: 100,
    mode: 'demo',
    loop: { enabled: true, fromBar: 1, toBar: 4 },
    mix: MODE_MIX.demo,
    speedUp: 2,
    countIn: true,
    stepIndex: 0,
    loops: 0,
    auditioning: null,

    load(seq, opts) {
      if (get().playing) engine.pause();
      const withRoles = assignRoles(seq);
      const bars = Math.max(1, Math.round(sequenceLength(seq) / beatsPerBar(seq)));
      const bpm = opts?.bpm ?? seq.tempo;
      set({
        sequence: withRoles,
        bpm,
        targetBpm: opts?.targetBpm ?? Math.max(bpm, seq.tempo),
        loop: { enabled: true, fromBar: 1, toBar: bars },
        playing: false,
        beat: 0,
        stepIndex: 0,
        loops: 0,
        auditioning: null,
      });
      engine.setBpm(bpm);
      pushToEngine();
    },

    async togglePlay() {
      const s = get();
      if (s.mode === 'step') {
        await ensureAudio();
        get().stepNext();
        return;
      }
      if (!s.sequence) return;
      await ensureAudio();
      if (s.auditioning) {
        set({ auditioning: null });
        pushToEngine();
      }
      if (engine.isPlaying) {
        engine.pause();
        set({ playing: false });
      } else {
        engine.play();
        set({ playing: true });
      }
    },

    stop() {
      engine.stop();
      set({ playing: false, loops: 0, stepIndex: 0, beat: get().mode === 'step' ? stepOnsets(get().sequence)[0] ?? 0 : get().beat });
    },

    setBpm(bpm) {
      const v = Math.round(Math.min(MAX_BPM, Math.max(MIN_BPM, bpm)));
      engine.setBpm(v);
      set({ bpm: v });
    },

    nudgeBpm(delta) {
      get().setBpm(get().bpm + delta);
    },

    setMode(mode) {
      engine.pause();
      const mix = MODE_MIX[mode];
      engine.setMix(mix);
      set({ mode, mix, playing: false, loops: 0 });
      pushToEngine();
      if (mode === 'step') {
        const first = stepOnsets(get().sequence)[0] ?? 0;
        set({ stepIndex: 0, beat: first + 1e-3 });
      }
    },

    setLoop(loop) {
      const seq = get().sequence;
      const total = seq ? Math.max(1, Math.round(sequenceLength(seq) / beatsPerBar(seq))) : 1;
      const next = { ...get().loop, ...loop };
      next.fromBar = Math.min(total, Math.max(1, next.fromBar));
      next.toBar = Math.min(total, Math.max(next.fromBar, next.toBar));
      set({ loop: next });
      pushToEngine();
    },

    setMix(mix) {
      const next = { ...get().mix, ...mix };
      engine.setMix(next);
      set({ mix: next });
    },

    setSpeedUp(n) {
      set({ speedUp: Math.max(0, Math.min(10, n)) });
    },

    setCountIn(on) {
      set({ countIn: on });
      pushToEngine();
    },

    stepNext() {
      const { sequence, stepIndex } = get();
      const onsets = stepOnsets(sequence);
      if (!sequence || onsets.length === 0) return;
      const started = get().beat > onsets[stepIndex] - 1e-6 && get().beat < onsets[stepIndex] + 0.01;
      const idx = started ? (stepIndex + 1) % onsets.length : stepIndex;
      set({ stepIndex: idx, beat: onsets[idx] + 1e-3 });
      if (get().mix.guide) engine.previewNotes(eventsAt(sequence, onsets[idx]));
    },

    stepPrev() {
      const { sequence, stepIndex } = get();
      const onsets = stepOnsets(sequence);
      if (!sequence || onsets.length === 0) return;
      const idx = (stepIndex - 1 + onsets.length) % onsets.length;
      set({ stepIndex: idx, beat: onsets[idx] + 1e-3 });
      if (get().mix.guide) engine.previewNotes(eventsAt(sequence, onsets[idx]));
    },

    seekBeat(beat) {
      const { mode, sequence } = get();
      if (mode === 'step') {
        const onsets = stepOnsets(sequence);
        const idx = Math.max(0, onsets.findIndex((o) => o >= beat - 1e-3));
        set({ stepIndex: idx, beat: (onsets[idx] ?? 0) + 1e-3 });
        if (sequence && get().audioReady) engine.previewNotes(eventsAt(sequence, onsets[idx]));
        return;
      }
      engine.seek(beat);
      set({ beat });
    },

    async audition(seq) {
      await ensureAudio();
      const s = get();
      if (s.auditioning === seq.id && engine.isPlaying) {
        engine.pause();
        set({ playing: false, auditioning: null });
        return;
      }
      engine.pause();
      const mix = { guide: true, backing: true, metronome: false };
      engine.setMix(mix);
      engine.setBpm(seq.tempo);
      set({ sequence: assignRoles(seq), mode: 'demo', mix, bpm: seq.tempo, auditioning: seq.id, beat: 0 });
      pushToEngine();
      engine.seek(0);
      engine.play();
      set({ playing: true });
    },
  };
});
