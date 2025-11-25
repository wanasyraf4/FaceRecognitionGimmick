
// A utility to generate futuristic sci-fi sound effects using the Web Audio API
// Advanced synthesis using FM, filtering, and noise buffers for high-tech UI feel.

class SoundEffectsManager {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private noiseBuffer: AudioBuffer | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) {
        this.ctx = new AudioContextClass();
        this.masterGain = this.ctx.createGain();
        this.masterGain.connect(this.ctx.destination);
        this.masterGain.gain.value = 0.4; // Slightly louder master
      }
    }
  }

  init() {
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  private getNoiseBuffer() {
    if (!this.ctx) return null;
    if (!this.noiseBuffer) {
      const bufferSize = this.ctx.sampleRate * 2; // 2 seconds of noise
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }
      this.noiseBuffer = buffer;
    }
    return this.noiseBuffer;
  }

  private createOsc(type: OscillatorType, freq: number, startTime: number) {
    if (!this.ctx || !this.masterGain) return null;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    
    osc.type = type;
    osc.frequency.setValueAtTime(freq, startTime);
    
    osc.connect(gain);
    gain.connect(this.masterGain);
    
    return { osc, gain };
  }

  // 1. Power Up: Heavy bass swell + digital shimmer
  playPowerUp() {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    
    // Bass Sweep
    const bass = this.createOsc('sawtooth', 40, t);
    if (bass) {
      // Low pass filter for the sweep
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(100, t);
      filter.frequency.exponentialRampToValueAtTime(3000, t + 1.2);
      
      bass.osc.disconnect();
      bass.osc.connect(filter);
      filter.connect(bass.gain);

      bass.gain.gain.setValueAtTime(0, t);
      bass.gain.gain.linearRampToValueAtTime(0.6, t + 0.8);
      bass.gain.gain.exponentialRampToValueAtTime(0.01, t + 1.5);
      
      bass.osc.start(t);
      bass.osc.stop(t + 1.5);
    }

    // High Tech Chime
    const osc2 = this.createOsc('sine', 2000, t);
    if (osc2) {
      osc2.gain.gain.setValueAtTime(0, t);
      osc2.gain.gain.linearRampToValueAtTime(0.2, t + 0.5);
      osc2.gain.gain.exponentialRampToValueAtTime(0.001, t + 1.5);
      osc2.osc.frequency.exponentialRampToValueAtTime(4000, t + 0.2);
      osc2.osc.start(t);
      osc2.osc.stop(t + 1.5);
    }
  }

  // 2. Lock On: Sharp, mechanical digital lock
  playLockOn() {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;

    // Fast mechanical sequence
    [0, 0.08, 0.16].forEach((time, i) => {
        const osc = this.createOsc('square', 1200 + (i * 200), t + time);
        if (osc) {
            osc.gain.gain.setValueAtTime(0.15, t + time);
            osc.gain.gain.exponentialRampToValueAtTime(0.001, t + time + 0.05);
            osc.osc.start(t + time);
            osc.osc.stop(t + time + 0.06);
        }
    });

    // Sub-bass impact
    const sub = this.createOsc('triangle', 60, t + 0.16);
    if (sub) {
        sub.gain.gain.setValueAtTime(0.5, t + 0.16);
        sub.gain.gain.exponentialRampToValueAtTime(0.01, t + 0.5);
        sub.osc.frequency.linearRampToValueAtTime(20, t + 0.5);
        sub.osc.start(t + 0.16);
        sub.osc.stop(t + 0.5);
    }
  }

  // 3. Scan Loop: 3D modulated drone
  playScanLoop() {
    if (!this.ctx || !this.masterGain) return () => {};
    const t = this.ctx.currentTime;

    const carrier = this.ctx.createOscillator();
    const modulator = this.ctx.createOscillator();
    const modGain = this.ctx.createGain();
    const mainGain = this.ctx.createGain();
    
    // Stereo panner for movement
    const panner = this.ctx.createStereoPanner();

    carrier.type = 'sawtooth';
    carrier.frequency.setValueAtTime(110, t); // Low A

    modulator.type = 'sine';
    modulator.frequency.setValueAtTime(8, t); // 8Hz flutter
    modGain.gain.value = 20;

    modulator.connect(modGain);
    modGain.connect(carrier.frequency);
    
    // Lowpass to dampen the harsh sawtooth
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 600;
    filter.Q.value = 1;

    carrier.connect(filter);
    filter.connect(mainGain);
    mainGain.connect(panner);
    panner.connect(this.masterGain);

    // Fade in
    mainGain.gain.setValueAtTime(0, t);
    mainGain.gain.linearRampToValueAtTime(0.15, t + 1);

    // Pan LFO
    const panOsc = this.ctx.createOscillator();
    panOsc.frequency.value = 0.5; // Slow pan
    const panGain = this.ctx.createGain();
    panGain.gain.value = 0.8;
    panOsc.connect(panGain);
    panGain.connect(panner.pan);

    carrier.start(t);
    modulator.start(t);
    panOsc.start(t);

    return () => {
        if (!this.ctx) return;
        const stopT = this.ctx.currentTime;
        mainGain.gain.cancelScheduledValues(stopT);
        mainGain.gain.setValueAtTime(mainGain.gain.value, stopT);
        mainGain.gain.linearRampToValueAtTime(0, stopT + 0.5);
        carrier.stop(stopT + 0.5);
        modulator.stop(stopT + 0.5);
        panOsc.stop(stopT + 0.5);
    };
  }

  // 4. Success / Pass: Uplifting ethereal chord
  playSuccess() {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;

    // Clean major chord with delay-like decay
    const freqs = [523.25, 659.25, 783.99, 1046.50, 1318.51];
    freqs.forEach((f, i) => {
        const osc = this.createOsc('sine', f, t + (i * 0.05));
        if (osc) {
            osc.gain.gain.setValueAtTime(0.08, t + (i * 0.05));
            osc.gain.gain.exponentialRampToValueAtTime(0.001, t + (i * 0.05) + 2.0);
            osc.osc.start(t + (i * 0.05));
            osc.osc.stop(t + (i * 0.05) + 2.0);
        }
    });

    // Soft white noise 'air' puff
    const buffer = this.getNoiseBuffer();
    if (buffer) {
        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;
        const noiseGain = this.ctx.createGain();
        const noiseFilter = this.ctx.createBiquadFilter();
        noiseFilter.type = 'highpass';
        noiseFilter.frequency.value = 5000;
        
        noise.connect(noiseFilter);
        noiseFilter.connect(noiseGain);
        noiseGain.connect(this.masterGain);
        
        noiseGain.gain.setValueAtTime(0.1, t);
        noiseGain.gain.exponentialRampToValueAtTime(0.001, t + 1.0);
        noise.start(t);
        noise.stop(t + 1.0);
    }
  }

  // 5. Tag Appear: Sci-fi holographic slide-in (FM Synthesis)
  playTagAppear() {
      if (!this.ctx) return;
      const t = this.ctx.currentTime;

      // FM Bell-like sound
      const carrier = this.ctx.createOscillator();
      const modulator = this.ctx.createOscillator();
      const modGain = this.ctx.createGain();
      const masterEnv = this.ctx.createGain();

      carrier.type = 'sine';
      carrier.frequency.setValueAtTime(800, t);
      carrier.frequency.exponentialRampToValueAtTime(1200, t + 0.1); // Pitch up

      modulator.type = 'square';
      modulator.frequency.setValueAtTime(200, t);
      
      modGain.gain.setValueAtTime(500, t);
      modGain.gain.exponentialRampToValueAtTime(10, t + 0.3); // FM amount decays

      modulator.connect(modGain);
      modGain.connect(carrier.frequency);
      
      carrier.connect(masterEnv);
      masterEnv.connect(this.masterGain!);

      masterEnv.gain.setValueAtTime(0, t);
      masterEnv.gain.linearRampToValueAtTime(0.2, t + 0.05);
      masterEnv.gain.exponentialRampToValueAtTime(0.001, t + 0.6);

      carrier.start(t);
      modulator.start(t);
      carrier.stop(t + 0.6);
      modulator.stop(t + 0.6);
      
      // Accompanying 'swish'
      const buffer = this.getNoiseBuffer();
      if (buffer) {
          const noise = this.ctx.createBufferSource();
          noise.buffer = buffer;
          const nGain = this.ctx.createGain();
          const nFilter = this.ctx.createBiquadFilter();
          
          nFilter.type = 'bandpass';
          nFilter.Q.value = 1;
          nFilter.frequency.setValueAtTime(2000, t);
          nFilter.frequency.linearRampToValueAtTime(6000, t + 0.3);

          noise.connect(nFilter);
          nFilter.connect(nGain);
          nGain.connect(this.masterGain!);

          nGain.gain.setValueAtTime(0.05, t);
          nGain.gain.linearRampToValueAtTime(0, t + 0.3);
          
          noise.start(t);
          noise.stop(t + 0.4);
      }
  }

  // 6. Name Reveal: Fast digital readout
  playDataReveal() {
      if (!this.ctx) return;
      const t = this.ctx.currentTime;
      // Burst of tiny clicks
      for(let i=0; i<5; i++) {
          const osc = this.createOsc('square', 2000 + Math.random()*500, t + i*0.04);
          if (osc) {
              osc.gain.gain.setValueAtTime(0.05, t + i*0.04);
              osc.gain.gain.exponentialRampToValueAtTime(0.001, t + i*0.04 + 0.03);
              osc.osc.start(t + i*0.04);
              osc.osc.stop(t + i*0.04 + 0.03);
          }
      }
  }

  // 7. PEP Alert: Glitchy Warning
  playPepAlert() {
      if (!this.ctx) return;
      const t = this.ctx.currentTime;

      // Two dissonant trills
      [0, 0.15].forEach(start => {
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          
          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(440, t + start);
          osc.frequency.linearRampToValueAtTime(880, t + start + 0.1); // Slide up
          
          // Amplitude Modulation for roughness
          const am = this.ctx.createOscillator();
          am.type = 'square';
          am.frequency.value = 30; // 30Hz rattle
          const amGain = this.ctx.createGain();
          amGain.gain.value = 0.5;
          
          am.connect(amGain);
          amGain.connect(gain.gain);
          
          osc.connect(gain);
          gain.connect(this.masterGain!);

          gain.gain.setValueAtTime(0.3, t + start);
          gain.gain.exponentialRampToValueAtTime(0.01, t + start + 0.3);
          
          osc.start(t + start);
          am.start(t + start);
          osc.stop(t + start + 0.3);
          am.stop(t + start + 0.3);
      });
  }

  // 8. Risk High: Menacing pulse
  playRiskAlert() {
      if (!this.ctx) return;
      const t = this.ctx.currentTime;

      // Low frequency throbs
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(110, t);
      
      // Pitch drop
      osc.frequency.exponentialRampToValueAtTime(55, t + 0.6);

      osc.connect(gain);
      gain.connect(this.masterGain!);

      gain.gain.setValueAtTime(0.5, t);
      // Stutter effect via volume
      gain.gain.setValueAtTime(0.5, t + 0.1);
      gain.gain.setValueAtTime(0, t + 0.15);
      gain.gain.setValueAtTime(0.5, t + 0.2);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.8);

      osc.start(t);
      osc.stop(t + 0.8);
  }

  // 9. Data Typing Tick
  playDataTick() {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    
    // Very short high noise tick filtered
    const osc = this.createOsc('square', 3000, t);
    if (osc) {
        osc.gain.gain.setValueAtTime(0.03, t);
        osc.gain.gain.exponentialRampToValueAtTime(0.001, t + 0.03);
        osc.osc.start(t);
        osc.osc.stop(t + 0.03);
    }
  }
}

export const SoundEffects = new SoundEffectsManager();
