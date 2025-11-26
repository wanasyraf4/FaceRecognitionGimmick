
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

  // 1. Camera Init: Professional Servo + Optical startup
  playPowerUp() {
    if (!this.ctx || !this.masterGain) return;
    const t = this.ctx.currentTime;

    // Layer 1: "Servo" / Iris Opening (Filtered Noise Sweep)
    // Simulates the mechanical whirr of a lens extending
    const buffer = this.getNoiseBuffer();
    if (buffer) {
        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;
        
        // Bandpass filter moving up in frequency = motor spinning up
        const noiseFilter = this.ctx.createBiquadFilter();
        noiseFilter.type = 'bandpass';
        noiseFilter.Q.value = 4; // Tight resonance for mechanical sound
        noiseFilter.frequency.setValueAtTime(200, t);
        noiseFilter.frequency.exponentialRampToValueAtTime(1500, t + 0.5); // Fast sweep

        const noiseGain = this.ctx.createGain();
        noiseGain.gain.setValueAtTime(0, t);
        noiseGain.gain.linearRampToValueAtTime(0.25, t + 0.1);
        noiseGain.gain.linearRampToValueAtTime(0, t + 0.5);

        noise.connect(noiseFilter);
        noiseFilter.connect(noiseGain);
        noiseGain.connect(this.masterGain);
        
        noise.start(t);
        noise.stop(t + 0.6);
    }

    // Layer 2: Subtle Electronic Capacitor Charge (Sine Sweep)
    const osc = this.ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(400, t);
    osc.frequency.exponentialRampToValueAtTime(1200, t + 0.6); // Pitch up
    
    const oscGain = this.ctx.createGain();
    oscGain.gain.setValueAtTime(0, t);
    oscGain.gain.linearRampToValueAtTime(0.05, t + 0.2); // Very quiet
    oscGain.gain.exponentialRampToValueAtTime(0.001, t + 0.6);

    osc.connect(oscGain);
    oscGain.connect(this.masterGain);
    osc.start(t);
    osc.stop(t + 0.7);

    // Layer 3: Mechanical "Click" (Lens Lock) at the end
    // A quick burst of high pitched square wave
    const click = this.ctx.createOscillator();
    click.type = 'square';
    click.frequency.setValueAtTime(800, t + 0.5);
    
    const clickGain = this.ctx.createGain();
    clickGain.gain.setValueAtTime(0, t + 0.5);
    clickGain.gain.setValueAtTime(0.05, t + 0.5);
    clickGain.gain.exponentialRampToValueAtTime(0.001, t + 0.55); // Short snappy decay

    click.connect(clickGain);
    clickGain.connect(this.masterGain);
    click.start(t + 0.5);
    click.stop(t + 0.6);
  }

  // 2. Lock On (Capture): Professional Digital Shutter Snap
  // Replaces previous sci-fi lock sound with a crisp camera shutter effect
  playLockOn() {
    if (!this.ctx || !this.masterGain) return;
    const t = this.ctx.currentTime;

    // Layer 1: Mechanical Latch (Sharp Click)
    // A very short square wave burst for the "click" of the mechanism
    const latch = this.ctx.createOscillator();
    latch.type = 'square';
    latch.frequency.setValueAtTime(800, t);
    
    const latchGain = this.ctx.createGain();
    latchGain.gain.setValueAtTime(0.1, t);
    latchGain.gain.exponentialRampToValueAtTime(0.001, t + 0.03); // Instant decay

    latch.connect(latchGain);
    latchGain.connect(this.masterGain);
    latch.start(t);
    latch.stop(t + 0.05);

    // Layer 2: Shutter Body (Mirror Slap / Air Movement)
    // Filtered noise to create the "thwack" sound
    const buffer = this.getNoiseBuffer();
    if (buffer) {
        const shutter = this.ctx.createBufferSource();
        shutter.buffer = buffer;

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(1500, t); // Start mid
        filter.frequency.exponentialRampToValueAtTime(300, t + 0.1); // Drop fast to mimic damping

        const shutterGain = this.ctx.createGain();
        shutterGain.gain.setValueAtTime(0.6, t); // Strong initial impact
        shutterGain.gain.exponentialRampToValueAtTime(0.001, t + 0.15); // Quick decay

        shutter.connect(filter);
        filter.connect(shutterGain);
        shutterGain.connect(this.masterGain);
        
        shutter.start(t);
        shutter.stop(t + 0.2);
    }
  }

  // 3. Scan Loop: External File Playback (With Clipping)
  // Plays 'scanning.mp3' and returns a cleanup function to stop it.
  playScanLoop() {
    const audio = new Audio('/sounds/scanning.mp3');
    audio.loop = true; // Loop if the file is shorter than 8s (unlikely for 1:38m)
    audio.volume = 0.6;
    
    audio.play().catch(e => console.log("Scanning audio playback failed. Ensure '/sounds/scanning.mp3' exists.", e));

    // Return cleanup function to "clip" the audio when animation ends
    return () => {
        audio.pause();
        audio.currentTime = 0;
    };
  }

  // 4. Scan Pass (Success): Professional "Ascending Chime"
  // Clean, reassuring, fintech/banking style
  playSuccess() {
    if (!this.ctx || !this.masterGain) return;
    const t = this.ctx.currentTime;

    // Note 1: E5
    const osc1 = this.ctx.createOscillator();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(659.25, t);
    
    const gain1 = this.ctx.createGain();
    gain1.gain.setValueAtTime(0, t);
    gain1.gain.linearRampToValueAtTime(0.1, t + 0.05);
    gain1.gain.exponentialRampToValueAtTime(0.001, t + 0.8);

    osc1.connect(gain1);
    gain1.connect(this.masterGain);
    osc1.start(t);
    osc1.stop(t + 0.8);

    // Note 2: B5 (Perfect 5th up)
    const osc2 = this.ctx.createOscillator();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(987.77, t + 0.15);
    
    const gain2 = this.ctx.createGain();
    gain2.gain.setValueAtTime(0, t + 0.15);
    gain2.gain.linearRampToValueAtTime(0.1, t + 0.2);
    gain2.gain.exponentialRampToValueAtTime(0.001, t + 1.2);

    osc2.connect(gain2);
    gain2.connect(this.masterGain);
    osc2.start(t + 0.15);
    osc2.stop(t + 1.2);
    
    // Subtle warmth (Triangle wave layer on root)
    const warmth = this.ctx.createOscillator();
    warmth.type = 'triangle';
    warmth.frequency.setValueAtTime(329.63, t); // E4
    const warmthGain = this.ctx.createGain();
    warmthGain.gain.setValueAtTime(0.05, t);
    warmthGain.gain.exponentialRampToValueAtTime(0.001, t + 1.0);
    
    warmth.connect(warmthGain);
    warmthGain.connect(this.masterGain);
    warmth.start(t);
    warmth.stop(t + 1.0);
  }

  // 5. Tag Appear: Professional "Digital Verification" Chime
  // Rich, stable pitch (Fundamental + Octave) with a crisp transient. 
  // Sounds like a premium app checklist confirmation.
  playTagAppear() {
      if (!this.ctx || !this.masterGain) return;
      const t = this.ctx.currentTime;

      // Layer 1: Fundamental Tone (Clear, mid-high, stable)
      // C6 approx 1046Hz, adjusted to 1200Hz for brightness
      const osc1 = this.ctx.createOscillator();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(1200, t); 
      
      const gain1 = this.ctx.createGain();
      gain1.gain.setValueAtTime(0, t);
      gain1.gain.linearRampToValueAtTime(0.08, t + 0.01);
      gain1.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
      
      osc1.connect(gain1);
      gain1.connect(this.masterGain);
      osc1.start(t);
      osc1.stop(t + 0.2);

      // Layer 2: Upper Harmonic (Airy/Glassy Texture)
      const osc2 = this.ctx.createOscillator();
      osc2.type = 'triangle'; // Triangle adds a slight richness vs pure sine
      osc2.frequency.setValueAtTime(2400, t); // Perfect Octave up
      
      const gain2 = this.ctx.createGain();
      gain2.gain.setValueAtTime(0, t);
      gain2.gain.linearRampToValueAtTime(0.04, t + 0.01);
      gain2.gain.exponentialRampToValueAtTime(0.001, t + 0.15); // Shorter decay than fundamental

      osc2.connect(gain2);
      gain2.connect(this.masterGain);
      osc2.start(t);
      osc2.stop(t + 0.15);

      // Layer 3: Transient "Click" (Simulates digital switch contact)
      const osc3 = this.ctx.createOscillator();
      osc3.type = 'square';
      osc3.frequency.setValueAtTime(4000, t);
      
      const gain3 = this.ctx.createGain();
      gain3.gain.setValueAtTime(0.02, t);
      gain3.gain.exponentialRampToValueAtTime(0.001, t + 0.02); // Very fast click

      osc3.connect(gain3);
      gain3.connect(this.masterGain);
      osc3.start(t);
      osc3.stop(t + 0.02);
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

  // 7. PEP Alert: "System Attention" Tone
  // Clean, resonant, authoritative but not alarming.
  playPepAlert() {
      if (!this.ctx || !this.masterGain) return;
      const t = this.ctx.currentTime;

      // Two tones: C5 -> D5 (Major 2nd interval - "Notice this")
      [523.25, 587.33].forEach((freq, i) => {
          const osc = this.ctx!.createOscillator();
          osc.type = 'triangle'; // Clear tone
          osc.frequency.setValueAtTime(freq, t + (i * 0.12));
          
          const gain = this.ctx!.createGain();
          gain.gain.setValueAtTime(0, t + (i * 0.12));
          gain.gain.linearRampToValueAtTime(0.1, t + (i * 0.12) + 0.02);
          gain.gain.exponentialRampToValueAtTime(0.001, t + (i * 0.12) + 0.4);
          
          osc.connect(gain);
          gain.connect(this.masterGain!);
          
          osc.start(t + (i * 0.12));
          osc.stop(t + (i * 0.12) + 0.4);
      });
  }

  // 8. Risk High: "Compliance Warning" Pulse
  // Solid, weighted low-frequency sound. Serious.
  playRiskAlert() {
      if (!this.ctx || !this.masterGain) return;
      const t = this.ctx.currentTime;

      // A single, heavy, filtered square wave pulse
      const osc = this.ctx.createOscillator();
      osc.type = 'square';
      osc.frequency.setValueAtTime(110, t); // A2
      
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(800, t);
      filter.Q.value = 2;

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(0.2, t + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.6); // Controlled decay, not too long

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterGain);

      osc.start(t);
      osc.stop(t + 0.6);
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

  // 10. Countdown Beep: Simple digital blip
  playCountdownBeep() {
    if (!this.ctx || !this.masterGain) return;
    const t = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    osc.type = 'square';
    osc.frequency.setValueAtTime(800, t);

    // Filter to make it less harsh
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 1500;

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.05, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.1);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    osc.start(t);
    osc.stop(t + 0.1);
  }
}

export const SoundEffects = new SoundEffectsManager();
