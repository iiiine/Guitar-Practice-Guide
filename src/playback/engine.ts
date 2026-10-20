import * as Tone from 'tone';
import type { PlayMode } from '../practice/types';
import { beatsPerBar, sequenceLength, type EventSequence, type NoteEvent, type StringNumber } from '../sequence/types';
import { midiAt } from '../theory';
import { generateBacking, type BackingEvent } from './backing';

/**
 * 播放引擎：唯一能操作 Tone.js 的地方。
 * 單一時鐘 —— 聲音、節拍器、伴奏都排在同一個 Transport 上，
 * 畫面透過 getBeat() 讀取同一個 Transport 的位置。
 */

export interface LoadOptions {
  mode: PlayMode;
  /** 循環區段（拍，序列座標） */
  loop: { enabled: boolean; from: number; to: number };
  countIn: boolean;
}

export interface MixState {
  guide: boolean;
  backing: boolean;
  metronome: boolean;
}

type Voices = {
  guitar: Tone.MonoSynth[];
  kick: Tone.MembraneSynth;
  snare: Tone.NoiseSynth;
  hat: Tone.MetalSynth;
  bass: Tone.MonoSynth;
  comp: Tone.PolySynth;
  click: Tone.Synth;
  guideBus: Tone.Volume;
  backingBus: Tone.Volume;
  clickBus: Tone.Volume;
};

const freq = (midi: number) => Tone.Frequency(midi, 'midi').toFrequency();

class PlaybackEngine {
  private voices: Voices | null = null;
  private seq: EventSequence | null = null;
  private opts: LoadOptions = { mode: 'demo', loop: { enabled: true, from: 0, to: 4 }, countIn: false };
  private preroll = 0;
  private rafId = 0;
  private tickListeners = new Set<(beat: number) => void>();
  private loopListeners = new Set<() => void>();
  private endListeners = new Set<() => void>();
  private loopHandlerInstalled = false;

  get transport() {
    return Tone.getTransport();
  }

  get ready(): boolean {
    return this.voices !== null;
  }

  /** 必須在使用者手勢內呼叫（瀏覽器音訊政策）。 */
  async init(): Promise<void> {
    if (this.voices) return;
    await Tone.start();
    Tone.getContext().lookAhead = 0.05;
    const master = new Tone.Volume(-6).toDestination();
    const reverb = new Tone.Reverb({ decay: 1.6, wet: 0.18 }).connect(master);
    const guideBus = new Tone.Volume(-4).connect(reverb);
    const backingBus = new Tone.Volume(-8).connect(reverb);
    const clickBus = new Tone.Volume(-6).connect(master);
    const drive = new Tone.Distortion({ distortion: 0.18, wet: 0.5 }).connect(guideBus);

    const guitar = Array.from({ length: 6 }, () =>
      new Tone.MonoSynth({
        oscillator: { type: 'sawtooth' },
        filter: { type: 'lowpass', Q: 1.5, rolloff: -24 },
        filterEnvelope: { attack: 0.002, decay: 0.35, sustain: 0.25, release: 0.4, baseFrequency: 260, octaves: 3.6 },
        envelope: { attack: 0.003, decay: 0.4, sustain: 0.45, release: 0.35 },
        volume: -8,
      }).connect(drive),
    );

    const kick = new Tone.MembraneSynth({ pitchDecay: 0.03, octaves: 6, envelope: { attack: 0.001, decay: 0.3, sustain: 0 }, volume: -4 }).connect(backingBus);
    const snare = new Tone.NoiseSynth({ noise: { type: 'white' }, envelope: { attack: 0.001, decay: 0.14, sustain: 0 }, volume: -14 }).connect(backingBus);
    const hat = new Tone.MetalSynth({ envelope: { attack: 0.001, decay: 0.05, release: 0.01 }, harmonicity: 5.1, modulationIndex: 32, resonance: 4000, octaves: 1.5, volume: -30 }).connect(backingBus);
    hat.frequency.value = 300;
    const bass = new Tone.MonoSynth({
      oscillator: { type: 'triangle' },
      filter: { type: 'lowpass', Q: 1 },
      filterEnvelope: { attack: 0.005, decay: 0.2, sustain: 0.4, baseFrequency: 120, octaves: 2.5 },
      envelope: { attack: 0.005, decay: 0.25, sustain: 0.6, release: 0.15 },
      volume: -4,
    }).connect(backingBus);
    const compFilter = new Tone.Filter(1800, 'lowpass').connect(backingBus);
    const comp = new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: 'fattriangle', count: 3, spread: 18 },
      envelope: { attack: 0.01, decay: 0.3, sustain: 0.5, release: 0.4 },
      volume: -16,
    }).connect(compFilter);
    const click = new Tone.Synth({ oscillator: { type: 'square' }, envelope: { attack: 0.001, decay: 0.04, sustain: 0, release: 0.01 }, volume: -10 }).connect(clickBus);

    this.voices = { guitar, kick, snare, hat, bass, comp, click, guideBus, backingBus, clickBus };
    if (this.seq) this.schedule();
  }

  setMix(mix: MixState): void {
    if (!this.voices) return;
    this.voices.guideBus.mute = !mix.guide;
    this.voices.backingBus.mute = !mix.backing;
    this.voices.clickBus.mute = !mix.metronome;
  }

  /** 載入序列並重新排程；保留目前位置。 */
  load(seq: EventSequence, opts: LoadOptions): void {
    const beat = this.seq ? this.getBeat() : 0;
    const sameSeq = this.seq?.id === seq.id;
    this.seq = seq;
    this.opts = opts;
    this.schedule();
    if (sameSeq) this.seek(Math.max(opts.loop.enabled ? opts.loop.from : 0, beat));
    else this.seek(opts.loop.enabled ? opts.loop.from : 0);
  }

  private ticks(beat: number): number {
    return Math.round((beat + this.preroll) * this.transport.PPQ);
  }

  private schedule(): void {
    const tr = this.transport;
    tr.cancel(0);
    if (!this.seq) return;
    const seq = this.seq;
    const bar = beatsPerBar(seq);
    const length = sequenceLength(seq);
    this.preroll = this.opts.mode === 'follow' && this.opts.countIn ? bar : 0;

    if (this.opts.loop.enabled) {
      tr.loop = true;
      tr.setLoopPoints(`${this.ticks(this.opts.loop.from)}i`, `${this.ticks(this.opts.loop.to)}i`);
    } else {
      tr.loop = false;
      tr.schedule(() => {
        Tone.getDraw().schedule(() => {
          this.pause();
          this.seek(0);
          this.endListeners.forEach((l) => l());
        }, Tone.now());
      }, `${this.ticks(length)}i`);
    }
    if (!this.loopHandlerInstalled) {
      tr.on('loop', () => this.loopListeners.forEach((l) => l()));
      this.loopHandlerInstalled = true;
    }

    if (!this.voices) return;
    // 節拍器（含預備拍）
    for (let b = -this.preroll; b < length; b++) {
      const accent = ((b % bar) + bar) % bar === 0;
      tr.schedule((time) => this.voices?.click.triggerAttackRelease(accent ? 'C6' : 'G5', 0.03, time, accent ? 1 : 0.6), `${this.ticks(b)}i`);
    }
    if (this.preroll > 0) {
      // 預備拍一定要聽得到，所以獨立於節拍器開關
      for (let b = -this.preroll; b < 0; b++) {
        tr.schedule((time) => {
          if (this.voices?.clickBus.mute) this.voices?.click.triggerAttackRelease('E6', 0.03, time, 0.8);
        }, `${this.ticks(b)}i`);
      }
    }
    for (const e of generateBacking(seq)) {
      tr.schedule((time) => this.playBacking(e, time), `${this.ticks(e.start)}i`);
    }
    for (const e of seq.events) {
      tr.schedule((time) => this.playGuitar(e, time), `${this.ticks(e.start)}i`);
    }
  }

  private seconds(beats: number): number {
    return (beats * 60) / this.transport.bpm.value;
  }

  private playBacking(e: BackingEvent, time: number): void {
    const v = this.voices;
    if (!v) return;
    const dur = this.seconds(e.duration);
    switch (e.instrument) {
      case 'kick':
        v.kick.triggerAttackRelease('C1', dur, time, e.velocity);
        break;
      case 'snare':
        v.snare.triggerAttackRelease(dur, time, e.velocity);
        break;
      case 'hat':
        v.hat.triggerAttackRelease(300, dur, time, e.velocity);
        break;
      case 'bass':
        if (e.midi) v.bass.triggerAttackRelease(freq(e.midi[0]), dur, time, e.velocity);
        break;
      case 'comp':
        if (e.midi) v.comp.triggerAttackRelease(e.midi.map(freq), dur, time, e.velocity);
        break;
    }
  }

  private playGuitar(e: NoteEvent, time: number): void {
    const v = this.voices;
    if (!v) return;
    const synth = v.guitar[e.string - 1];
    const base = midiAt(e.string, e.fret);
    const techniques = e.technique ?? [];
    const has = (type: string) => techniques.some((t) => t.type === type);
    let dur = this.seconds(e.duration) * 0.95;
    let vel = 0.85;
    if (has('hammer') || has('pull')) vel = 0.55;
    if (has('mute')) {
      dur = Math.min(dur, 0.08);
      vel = 0.45;
    }
    if (has('ghost')) vel = 0.2;
    synth.triggerAttackRelease(freq(base), dur, time, vel);

    for (const t of techniques) {
      if (t.type === 'bend') {
        const hold = Math.min(0.06, dur * 0.15);
        const rise = Math.min(0.22, dur * 0.4);
        synth.frequency.setValueAtTime(freq(base), time + hold);
        synth.frequency.linearRampToValueAtTime(freq(base + t.amount), time + hold + rise);
        if (t.release) synth.frequency.linearRampToValueAtTime(freq(base), time + dur * 0.9);
      } else if (t.type === 'slide') {
        const target = midiAt(e.string as StringNumber, t.toFret);
        synth.frequency.setValueAtTime(freq(base), time + dur * 0.25);
        synth.frequency.linearRampToValueAtTime(freq(target), time + dur * 0.6);
      }
    }
    if (has('vibrato')) {
      const bendT = techniques.find((t) => t.type === 'bend');
      const center = freq(base + (bendT?.type === 'bend' ? bendT.amount : 0));
      const depth = center * (Math.pow(2, 0.35 / 12) - 1);
      for (let tt = time + Math.min(0.3, dur * 0.3), up = true; tt < time + dur; tt += 0.09, up = !up) {
        synth.frequency.linearRampToValueAtTime(center + (up ? depth : -depth), tt);
      }
    }
  }

  /** 逐步模式／點擊試音：立即發聲，不經過 Transport。 */
  previewNotes(events: NoteEvent[]): void {
    if (!this.voices) return;
    const now = Tone.now();
    for (const e of events) this.playGuitar(e, now);
  }

  play(): void {
    if (!this.voices) return;
    if (this.transport.state !== 'started') this.transport.start();
    this.startRaf();
  }

  pause(): void {
    this.transport.pause();
    this.stopRaf();
    this.emitTick();
  }

  stop(): void {
    this.transport.stop();
    this.stopRaf();
    this.seek(this.opts.loop.enabled ? this.opts.loop.from : 0);
  }

  /** 跳到序列的某一拍。播放中從預備拍之後開始；停止時會重新包含預備拍。 */
  seek(beat: number): void {
    const target = this.transport.state === 'started' || beat > 0 ? beat : -this.preroll;
    this.transport.ticks = Math.max(0, this.ticks(target));
    this.emitTick();
  }

  setBpm(bpm: number): void {
    this.transport.bpm.value = bpm;
  }

  get isPlaying(): boolean {
    return this.transport.state === 'started';
  }

  /** 目前「聽到的」位置（拍，序列座標；預備拍時為負數）。 */
  getBeat(): number {
    const tr = this.transport;
    const ticks = tr.state === 'started' ? tr.getTicksAtTime(Tone.immediate()) : tr.ticks;
    return ticks / tr.PPQ - this.preroll;
  }

  onTick(fn: (beat: number) => void): () => void {
    this.tickListeners.add(fn);
    return () => this.tickListeners.delete(fn);
  }

  onLoop(fn: () => void): () => void {
    this.loopListeners.add(fn);
    return () => this.loopListeners.delete(fn);
  }

  onEnd(fn: () => void): () => void {
    this.endListeners.add(fn);
    return () => this.endListeners.delete(fn);
  }

  private emitTick(): void {
    const beat = this.getBeat();
    this.tickListeners.forEach((l) => l(beat));
  }

  private startRaf(): void {
    if (this.rafId) return;
    const loop = () => {
      this.emitTick();
      this.rafId = requestAnimationFrame(loop);
    };
    this.rafId = requestAnimationFrame(loop);
  }

  private stopRaf(): void {
    cancelAnimationFrame(this.rafId);
    this.rafId = 0;
  }
}

export const engine = new PlaybackEngine();
