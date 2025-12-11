
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

class AudioService {
  private ctx: AudioContext | null = null;
  private ambientSource: AudioBufferSourceNode | null = null;
  private masterGain: GainNode | null = null;
  private ambientGain: GainNode | null = null;
  private buffers: Record<string, AudioBuffer> = {};

  // Initialize AudioContext - must be called on user gesture
  init() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = 0.3; // Master volume
      this.masterGain.connect(this.ctx.destination);

      this.ambientGain = this.ctx.createGain();
      this.ambientGain.gain.value = 0.0;
      this.ambientGain.connect(this.masterGain);
      
      this.generateBuffers();
    }

    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  private generateBuffers() {
    if (!this.ctx) return;

    // 1. White Noise Buffer (used for bulldoze)
    const sampleRate = this.ctx.sampleRate;
    const duration = 2.0;
    const bufferSize = sampleRate * duration;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, sampleRate);
    const data = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    this.buffers['noise'] = noiseBuffer;
  }

  startAmbient() {
    if (!this.ctx) this.init();
    if (!this.ctx || this.ambientSource) return;

    // Create Brown Noise for city rumble
    const bufferSize = 2 * this.ctx.sampleRate;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    let lastOut = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      data[i] = (lastOut + (0.02 * white)) / 1.02;
      lastOut = data[i];
      data[i] *= 3.5; // Compensate for gain loss
    }

    this.ambientSource = this.ctx.createBufferSource();
    this.ambientSource.buffer = buffer;
    this.ambientSource.loop = true;

    // Lowpass filter to muffle it into background noise
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 180;

    this.ambientSource.connect(filter);
    filter.connect(this.ambientGain!);
    
    this.ambientSource.start();

    // Fade in
    this.ambientGain!.gain.linearRampToValueAtTime(0.5, this.ctx.currentTime + 3);
  }

  play(sound: 'build' | 'bulldoze' | 'click' | 'error' | 'success') {
    if (!this.ctx) return;
    if (this.ctx.state === 'suspended') this.ctx.resume();
    
    const t = this.ctx.currentTime;

    switch (sound) {
      case 'click':
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.connect(gain);
        gain.connect(this.masterGain!);

        osc.type = 'sine';
        osc.frequency.setValueAtTime(800, t);
        osc.frequency.exponentialRampToValueAtTime(1200, t + 0.05);

        gain.gain.setValueAtTime(0.1, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.05);

        osc.start(t);
        osc.stop(t + 0.05);
        break;

      case 'error':
        const oscErr = this.ctx.createOscillator();
        const gainErr = this.ctx.createGain();
        oscErr.connect(gainErr);
        gainErr.connect(this.masterGain!);

        oscErr.type = 'sawtooth';
        oscErr.frequency.setValueAtTime(150, t);
        oscErr.frequency.linearRampToValueAtTime(100, t + 0.15);

        gainErr.gain.setValueAtTime(0.2, t);
        gainErr.gain.exponentialRampToValueAtTime(0.001, t + 0.15);

        oscErr.start(t);
        oscErr.stop(t + 0.15);
        break;

      case 'build':
        // 1. Thud
        const oscBuild = this.ctx.createOscillator();
        const gainBuild = this.ctx.createGain();
        oscBuild.connect(gainBuild);
        gainBuild.connect(this.masterGain!);

        oscBuild.type = 'triangle';
        oscBuild.frequency.setValueAtTime(120, t);
        oscBuild.frequency.exponentialRampToValueAtTime(40, t + 0.1);

        gainBuild.gain.setValueAtTime(0.3, t);
        gainBuild.gain.exponentialRampToValueAtTime(0.001, t + 0.15);

        oscBuild.start(t);
        oscBuild.stop(t + 0.15);

        // 2. High metallic click
        const oscClick = this.ctx.createOscillator();
        const gainClick = this.ctx.createGain();
        oscClick.connect(gainClick);
        gainClick.connect(this.masterGain!);

        oscClick.type = 'square';
        oscClick.frequency.setValueAtTime(1200, t);
        gainClick.gain.setValueAtTime(0.05, t);
        gainClick.gain.exponentialRampToValueAtTime(0.001, t + 0.05);
        
        oscClick.start(t);
        oscClick.stop(t + 0.05);
        break;

      case 'bulldoze':
        if (!this.buffers['noise']) return;
        const noise = this.ctx.createBufferSource();
        noise.buffer = this.buffers['noise'];
        const noiseGain = this.ctx.createGain();
        const filter = this.ctx.createBiquadFilter();

        noise.connect(filter);
        filter.connect(noiseGain);
        noiseGain.connect(this.masterGain!);

        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(800, t);
        filter.frequency.exponentialRampToValueAtTime(100, t + 0.3);

        noiseGain.gain.setValueAtTime(0.3, t);
        noiseGain.gain.exponentialRampToValueAtTime(0.001, t + 0.3);

        noise.start(t);
        noise.stop(t + 0.3);
        break;

      case 'success':
        // Major Triad Arpeggio (C Major)
        const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
        notes.forEach((freq, i) => {
          const oscS = this.ctx!.createOscillator();
          const gainS = this.ctx!.createGain();
          oscS.connect(gainS);
          gainS.connect(this.masterGain!);

          oscS.type = 'sine';
          oscS.frequency.value = freq;

          const start = t + i * 0.06;
          const dur = 0.5;

          gainS.gain.setValueAtTime(0, start);
          gainS.gain.linearRampToValueAtTime(0.1, start + 0.05);
          gainS.gain.exponentialRampToValueAtTime(0.001, start + dur);

          oscS.start(start);
          oscS.stop(start + dur);
        });
        break;
    }
  }
}

export const audioService = new AudioService();
