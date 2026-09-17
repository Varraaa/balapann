/**
 * Procedural Web Audio Engine for Apex Racer 2D
 * High-performance, zero external assets required.
 */

class SoundEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private musicGain: GainNode | null = null;

  // Engine sound nodes
  private engineOsc: OscillatorNode | null = null;
  private engineSubOsc: OscillatorNode | null = null;
  private engineFilter: BiquadFilterNode | null = null;
  private engineGain: GainNode | null = null;
  private isEngineRunning: boolean = false;

  // Drift sound nodes
  private driftNoiseNode: AudioBufferSourceNode | null = null;
  private driftGain: GainNode | null = null;
  private isDrifting: boolean = false;

  // BGM generator
  private bgmInterval: number | null = null;
  private isMusicPlaying: boolean = false;
  private bgmStep: number = 0;

  private soundEnabled: boolean = true;
  private musicEnabled: boolean = true;
  private masterVolume: number = 0.8;

  constructor() {
    // Will be initialized upon first user interaction
  }

  public init() {
    if (this.ctx) return;
    try {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioContextClass();

      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(this.masterVolume, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);

      this.sfxGain = this.ctx.createGain();
      this.sfxGain.gain.setValueAtTime(this.soundEnabled ? 1 : 0, this.ctx.currentTime);
      this.sfxGain.connect(this.masterGain);

      this.musicGain = this.ctx.createGain();
      this.musicGain.gain.setValueAtTime(this.musicEnabled ? 0.35 : 0, this.ctx.currentTime);
      this.musicGain.connect(this.masterGain);

      this.setupEngineSound();
      this.setupDriftSound();
    } catch {
      console.warn('Web Audio API not supported in this browser.');
    }
  }

  public resumeContext() {
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public setSoundEnabled(enabled: boolean) {
    this.soundEnabled = enabled;
    if (this.sfxGain && this.ctx) {
      this.sfxGain.gain.setValueAtTime(enabled ? 1 : 0, this.ctx.currentTime);
    }
    if (!enabled) {
      this.stopEngine();
      this.stopDriftSound();
    }
  }

  public setMusicEnabled(enabled: boolean) {
    this.musicEnabled = enabled;
    if (this.musicGain && this.ctx) {
      this.musicGain.gain.setValueAtTime(enabled ? 0.35 : 0, this.ctx.currentTime);
    }
    if (enabled && !this.isMusicPlaying) {
      this.startBGM();
    } else if (!enabled && this.isMusicPlaying) {
      this.stopBGM();
    }
  }

  public setMasterVolume(vol: number) {
    this.masterVolume = Math.max(0, Math.min(1, vol));
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(this.masterVolume, this.ctx.currentTime);
    }
  }

  // Engine Synth
  private setupEngineSound() {
    if (!this.ctx || !this.sfxGain) return;

    this.engineOsc = this.ctx.createOscillator();
    this.engineSubOsc = this.ctx.createOscillator();
    this.engineFilter = this.ctx.createBiquadFilter();
    this.engineGain = this.ctx.createGain();

    this.engineOsc.type = 'sawtooth';
    this.engineSubOsc.type = 'triangle';

    this.engineOsc.frequency.setValueAtTime(50, this.ctx.currentTime);
    this.engineSubOsc.frequency.setValueAtTime(25, this.ctx.currentTime);

    this.engineFilter.type = 'lowpass';
    this.engineFilter.frequency.setValueAtTime(320, this.ctx.currentTime);
    this.engineFilter.Q.setValueAtTime(4, this.ctx.currentTime);

    this.engineGain.gain.setValueAtTime(0, this.ctx.currentTime);

    this.engineOsc.connect(this.engineFilter);
    this.engineSubOsc.connect(this.engineFilter);
    this.engineFilter.connect(this.engineGain);
    this.engineGain.connect(this.sfxGain);

    this.engineOsc.start();
    this.engineSubOsc.start();
    this.isEngineRunning = true;
  }

  public updateEngine(
    speedNormalized: number,
    throttle: number,
    isNitro: boolean,
    rpm: number = 2000
  ) {
    if (!this.ctx || !this.isEngineRunning || !this.soundEnabled || !this.engineGain || !this.engineOsc || !this.engineFilter) return;

    // RPM based frequency calculation (idle 1000 RPM -> 38Hz, 8500 RPM -> 195Hz)
    const rpmRatio = Math.max(0, Math.min(1, (rpm - 1000) / 7500));
    const baseFreq = 38 + rpmRatio * 165 + (isNitro ? 30 : 0);
    const filterFreq = 180 + rpmRatio * 1600 + (throttle * 500) + (isNitro ? 800 : 0);
    const targetGain = 0.10 + rpmRatio * 0.18 + (throttle * 0.10);

    const now = this.ctx.currentTime;
    this.engineOsc.frequency.setTargetAtTime(baseFreq, now, 0.04);
    if (this.engineSubOsc) {
      this.engineSubOsc.frequency.setTargetAtTime(baseFreq * 0.5, now, 0.04);
    }
    this.engineFilter.frequency.setTargetAtTime(filterFreq, now, 0.05);
    this.engineGain.gain.setTargetAtTime(targetGain, now, 0.04);
  }

  public stopEngine() {
    if (this.engineGain && this.ctx) {
      this.engineGain.gain.setValueAtTime(0, this.ctx.currentTime);
    }
  }

  // Turbo Blow-Off Valve Sound ("pssshhht")
  public playBlowOffValve() {
    if (!this.ctx || !this.sfxGain || !this.soundEnabled) return;
    this.resumeContext();

    const now = this.ctx.currentTime;
    const bufferSize = Math.floor(this.ctx.sampleRate * 0.28);
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.35));
    }

    const whiteNoise = this.ctx.createBufferSource();
    whiteNoise.buffer = noiseBuffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(2800, now);
    filter.frequency.exponentialRampToValueAtTime(1200, now + 0.25);
    filter.Q.setValueAtTime(4.0, now);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.24, now);
    gain.gain.exponentialRampToValueAtTime(0.005, now + 0.26);

    whiteNoise.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);

    whiteNoise.start(now);
  }

  // Exhaust Backfire Pop ("pop! bang!")
  public playBackfire() {
    if (!this.ctx || !this.sfxGain || !this.soundEnabled) return;
    this.resumeContext();

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(140, now);
    osc.frequency.exponentialRampToValueAtTime(35, now + 0.08);

    gain.gain.setValueAtTime(0.35, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + 0.1);
  }

  // Kerb / Rumble Strip Vibration Sound
  public playKerbRumble() {
    if (!this.ctx || !this.sfxGain || !this.soundEnabled) return;
    this.resumeContext();

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'square';
    osc.frequency.setValueAtTime(95, now);
    osc.frequency.linearRampToValueAtTime(75, now + 0.06);

    gain.gain.setValueAtTime(0.18, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.07);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + 0.08);
  }

  // Drift / Tire Screech Synth
  private setupDriftSound() {
    if (!this.ctx || !this.sfxGain) return;

    // Create 1 second of white noise
    const bufferSize = this.ctx.sampleRate;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }

    this.driftGain = this.ctx.createGain();
    this.driftGain.gain.setValueAtTime(0, this.ctx.currentTime);

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1400, this.ctx.currentTime);
    filter.Q.setValueAtTime(3.5, this.ctx.currentTime);

    this.driftNoiseNode = this.ctx.createBufferSource();
    this.driftNoiseNode.buffer = noiseBuffer;
    this.driftNoiseNode.loop = true;

    this.driftNoiseNode.connect(filter);
    filter.connect(this.driftGain);
    this.driftGain.connect(this.sfxGain);

    this.driftNoiseNode.start();
  }

  public setDriftSound(active: boolean, intensity: number = 0.5) {
    if (!this.ctx || !this.driftGain || !this.soundEnabled) return;
    const now = this.ctx.currentTime;
    if (active) {
      const targetGain = Math.min(0.28, Math.max(0.05, intensity * 0.25));
      this.driftGain.gain.setTargetAtTime(targetGain, now, 0.05);
      this.isDrifting = true;
    } else if (this.isDrifting) {
      this.driftGain.gain.setTargetAtTime(0, now, 0.08);
      this.isDrifting = false;
    }
  }

  private stopDriftSound() {
    if (this.driftGain && this.ctx) {
      this.driftGain.gain.setValueAtTime(0, this.ctx.currentTime);
    }
    this.isDrifting = false;
  }

  // Collision Sound
  public playCrash(strength: number = 1.0) {
    if (!this.ctx || !this.sfxGain || !this.soundEnabled) return;
    this.resumeContext();

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(160, now);
    osc.frequency.exponentialRampToValueAtTime(30, now + 0.18);

    gain.gain.setValueAtTime(Math.min(0.6, strength * 0.45), now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + 0.25);
  }

  // Nitro Boost Sound
  public playNitroBoost() {
    if (!this.ctx || !this.sfxGain || !this.soundEnabled) return;
    this.resumeContext();

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(220, now);
    osc.frequency.exponentialRampToValueAtTime(680, now + 0.35);

    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + 0.45);
  }

  // Item pickup chime
  public playPickup() {
    if (!this.ctx || !this.sfxGain || !this.soundEnabled) return;
    this.resumeContext();

    const now = this.ctx.currentTime;
    [587.33, 880, 1174.66].forEach((freq, i) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + i * 0.06);

      gain.gain.setValueAtTime(0.25, now + i * 0.06);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.06 + 0.2);

      osc.connect(gain);
      gain.connect(this.sfxGain!);

      osc.start(now + i * 0.06);
      osc.stop(now + i * 0.06 + 0.22);
    });
  }

  // Oil slick spin sound
  public playOilSpin() {
    if (!this.ctx || !this.sfxGain || !this.soundEnabled) return;
    this.resumeContext();

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(450, now);
    osc.frequency.linearRampToValueAtTime(180, now + 0.3);
    osc.frequency.linearRampToValueAtTime(360, now + 0.6);

    gain.gain.setValueAtTime(0.35, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.65);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + 0.7);
  }

  // Countdown Beeps
  public playCountdown(type: '3' | '2' | '1' | 'go') {
    if (!this.ctx || !this.sfxGain || !this.soundEnabled) return;
    this.resumeContext();

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    const isGo = type === 'go';
    osc.type = isGo ? 'sawtooth' : 'sine';
    osc.frequency.setValueAtTime(isGo ? 880 : 440, now);
    if (isGo) {
      osc.frequency.exponentialRampToValueAtTime(1320, now + 0.4);
    }

    gain.gain.setValueAtTime(isGo ? 0.4 : 0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + (isGo ? 0.6 : 0.25));

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + (isGo ? 0.65 : 0.28));
  }

  // Lap / Finish Fanfare
  public playFinishFanfare() {
    if (!this.ctx || !this.sfxGain || !this.soundEnabled) return;
    this.resumeContext();

    const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
    const now = this.ctx.currentTime;

    notes.forEach((freq, idx) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + idx * 0.12);

      gain.gain.setValueAtTime(0.35, now + idx * 0.12);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.12 + 0.45);

      osc.connect(gain);
      gain.connect(this.sfxGain!);

      osc.start(now + idx * 0.12);
      osc.stop(now + idx * 0.12 + 0.5);
    });
  }

  // Procedural Synthwave BGM Loop
  public startBGM() {
    if (!this.ctx || this.isMusicPlaying || !this.musicEnabled) return;
    this.isMusicPlaying = true;
    this.bgmStep = 0;

    // 130 BPM -> 16th note interval = (60 / 130) / 4 ~ 0.115s
    const stepInterval = (60 / 130) / 2 * 1000; // 8th note tempo

    // Synth bassline notes (frequencies in Hz)
    // Progression: Am - F - C - G
    const bassline = [
      110, 110, 110, 110, // A2
      87.31, 87.31, 87.31, 87.31, // F2
      130.81, 130.81, 130.81, 130.81, // C3
      98.0, 98.0, 98.0, 98.0 // G2
    ];

    const leadArp = [
      440, 523.25, 659.25, 523.25,
      349.23, 440, 523.25, 440,
      523.25, 659.25, 783.99, 659.25,
      392, 493.88, 587.33, 493.88
    ];

    this.bgmInterval = window.setInterval(() => {
      if (!this.ctx || !this.isMusicPlaying || !this.musicGain || !this.musicEnabled) return;

      const now = this.ctx.currentTime;
      const stepIdx = this.bgmStep % 16;

      // Bass note
      const bassOsc = this.ctx.createOscillator();
      const bassGain = this.ctx.createGain();
      bassOsc.type = 'sawtooth';
      bassOsc.frequency.setValueAtTime(bassline[stepIdx], now);

      bassGain.gain.setValueAtTime(0.18, now);
      bassGain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(380, now);

      bassOsc.connect(filter);
      filter.connect(bassGain);
      bassGain.connect(this.musicGain);

      bassOsc.start(now);
      bassOsc.stop(now + 0.2);

      // Lead note
      if (stepIdx % 2 === 0) {
        const leadOsc = this.ctx.createOscillator();
        const leadGain = this.ctx.createGain();
        leadOsc.type = 'triangle';
        leadOsc.frequency.setValueAtTime(leadArp[stepIdx], now);

        leadGain.gain.setValueAtTime(0.12, now);
        leadGain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);

        leadOsc.connect(leadGain);
        leadGain.connect(this.musicGain);

        leadOsc.start(now);
        leadOsc.stop(now + 0.3);
      }

      // Simple arcade snare / hi-hat on every off-beat
      if (stepIdx % 4 === 2) {
        const snareOsc = this.ctx.createOscillator();
        const snareGain = this.ctx.createGain();
        snareOsc.type = 'square';
        snareOsc.frequency.setValueAtTime(180, now);
        snareOsc.frequency.exponentialRampToValueAtTime(40, now + 0.06);

        snareGain.gain.setValueAtTime(0.15, now);
        snareGain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

        snareOsc.connect(snareGain);
        snareGain.connect(this.musicGain);

        snareOsc.start(now);
        snareOsc.stop(now + 0.09);
      }

      this.bgmStep++;
    }, stepInterval);
  }

  public stopBGM() {
    if (this.bgmInterval) {
      clearInterval(this.bgmInterval);
      this.bgmInterval = null;
    }
    this.isMusicPlaying = false;
  }

  public destroy() {
    this.stopEngine();
    this.stopDriftSound();
    this.stopBGM();
    if (this.ctx) {
      this.ctx.close();
      this.ctx = null;
    }
  }
}

export const soundEngine = new SoundEngine();
