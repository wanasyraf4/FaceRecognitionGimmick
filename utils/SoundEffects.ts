
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

  // 5. Tag Appear: Sci-fi holographic slide-in (Clean, Airy, High-Tech)
  // Used for: eKYC and World Check
  playTagAppear() {
      if (!this.ctx || !this.masterGain) return;
      const t = this.ctx.currentTime;

      // Element 1: "Air Swish" - Highpass filtered noise sweep
      const buffer = this.getNoiseBuffer();
      if (buffer) {
          const noise = this.ctx.createBufferSource();
          noise.buffer = buffer;
          
          const noiseFilter = this.ctx.createBiquadFilter();
          noiseFilter.type = 'highpass';
          noiseFilter.frequency.setValueAtTime(2000, t);
          noiseFilter.frequency.exponentialRampToValueAtTime(8000, t + 0.3); // Sweep up
          
          const noiseGain = this.ctx.createGain();
          noiseGain.gain.setValueAtTime(0, t);
          noiseGain.gain.linearRampToValueAtTime(0.06, t + 0.1);
          noiseGain.gain.exponentialRampToValueAtTime(0.001, t + 0.4);

          noise.connect(noiseFilter);
          noiseFilter.connect(noiseGain);
          noiseGain.connect(this.masterGain);
          
          noise.start(t);
          noise.stop(t + 0.5);
      }

      // Element 2: "Glass Ping" - A pure sine tone with very fast envelope
      const osc = this.ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1600, t);
      osc.frequency.exponentialRampToValueAtTime(1800, t + 0.05);
      
      const oscGain = this.ctx.createGain();
      oscGain.gain.setValueAtTime(0, t);
      oscGain.gain.linearRampToValueAtTime(0.08, t + 0.02);
      oscGain.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
      
      osc.connect(oscGain);
      oscGain.connect(this.masterGain);
      
      osc.start(t);
      osc.stop(t + 0.3);
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

  // 7. PEP Alert: Sharp Digital Alert (More refined than the old rattle)
  playPepAlert() {
      if (!this.ctx || !this.masterGain) return;
      const t = this.ctx.currentTime;

      // Rapid, sharp double-beep
      [0, 0.15].forEach(start => {
          const osc = this.ctx.createOscillator();
          osc.type = 'sawtooth'; // More bite than sine
          osc.frequency.setValueAtTime(880, t + start);
          
          // Lowpass to round off the harsh edge slightly
          const filter = this.ctx.createBiquadFilter();
          filter.type = 'lowpass';
          filter.frequency.value = 3000;

          const gain = this.ctx.createGain();
          gain.gain.setValueAtTime(0.1, t + start);
          gain.gain.exponentialRampToValueAtTime(0.001, t + start + 0.1);
          
          osc.connect(filter);
          filter.connect(gain);
          gain.connect(this.masterGain!);
          
          osc.start(t + start);
          osc.stop(t + start + 0.12);
      });
  }

  // 8. Risk High: Ominous Cinematic Impact (Futuristic "Braam")
  playRiskAlert() {
      if (!this.ctx || !this.masterGain) return;
      const t = this.ctx.currentTime;

      // Layer 1: Deep Bass Sawtooth (The "Growl")
      const osc1 = this.ctx.createOscillator();
      osc1.type = 'sawtooth';
      osc1.frequency.setValueAtTime(55, t); // Low A
      
      const filter1 = this.ctx.createBiquadFilter();
      filter1.type = 'lowpass';
      filter1.frequency.setValueAtTime(100, t);
      filter1.frequency.exponentialRampToValueAtTime(600, t + 0.3); // Opens up aggressively
      filter1.frequency.exponentialRampToValueAtTime(100, t + 1.0); // Closes back
      filter1.Q.value = 5; // High resonance for that "laser-like" edge

      const gain1 = this.ctx.createGain();
      gain1.gain.setValueAtTime(0, t);
      gain1.gain.linearRampToValueAtTime(0.5, t + 0.05);
      gain1.gain.exponentialRampToValueAtTime(0.001, t + 1.5);

      osc1.connect(filter1);
      filter1.connect(gain1);
      gain1.connect(this.masterGain);

      // Layer 2: Dissonant Tension (Tritone above)
      const osc2 = this.ctx.createOscillator();
      osc2.type = 'sawtooth';
      osc2.frequency.setValueAtTime(82, t); // ~Eb (Tritone of A)
      
      const filter2 = this.ctx.createBiquadFilter();
      filter2.type = 'bandpass';
      filter2.frequency.setValueAtTime(300, t);
      
      const gain2 = this.ctx.createGain();
      gain2.gain.setValueAtTime(0, t);
      gain2.gain.linearRampToValueAtTime(0.15, t + 0.1);
      gain2.gain.exponentialRampToValueAtTime(0.001, t + 1.0);

      osc2.connect(filter2);
      filter2.connect(gain2);
      gain2.connect(this.masterGain);

      osc1.start(t);
      osc2.start(t);
      osc1.stop(t + 1.5);
      osc2.stop(t + 1.5);
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
