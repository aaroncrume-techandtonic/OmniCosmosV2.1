export type AmbientType = 'void' | 'winds' | 'chimes';

export class AmbientService {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private activeNodes: AudioNode[] = [];
  private chimeInterval: any = null;

  init() {
    if (!this.ctx) {
       const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
       this.ctx = new AudioContext();
       this.masterGain = this.ctx.createGain();
       this.masterGain.gain.value = 0.15; // Default subtle volume
       this.masterGain.connect(this.ctx.destination);
    }
    if (this.ctx.state === 'suspended') {
        this.ctx.resume().catch(e => console.error("Audio resume failed", e));
    }
  }

  play(type: AmbientType) {
    this.stop(); // Stop current sounds
    
    if (type === 'void') return;

    this.init(); // Ensure context exists
    if (!this.ctx || !this.masterGain) return;

    if (type === 'winds') this.startWinds();
    if (type === 'chimes') this.startChimes();
  }

  setVolume(volume: number) {
    if (this.masterGain && this.ctx) {
      // Smooth transition to new volume
      try {
        this.masterGain.gain.setTargetAtTime(volume, this.ctx.currentTime, 0.1);
      } catch (e) {
        this.masterGain.gain.value = volume;
      }
    }
  }

  stop() {
    // Stop and disconnect all continuous nodes
    this.activeNodes.forEach(n => {
        try {
            n.disconnect();
            if ((n as any).stop) (n as any).stop();
        } catch(e) {}
    });
    this.activeNodes = [];

    // Clear interval for rhythmic sounds
    if (this.chimeInterval) {
        clearInterval(this.chimeInterval);
        this.chimeInterval = null;
    }
  }
  
  private startWinds() {
     if (!this.ctx || !this.masterGain) return;

     // Brown/Pinkish Noise generation
     const bufferSize = 2 * this.ctx.sampleRate;
     const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
     const output = buffer.getChannelData(0);
     let lastOut = 0;
     for (let i = 0; i < bufferSize; i++) {
         const white = Math.random() * 2 - 1;
         output[i] = (lastOut + (0.02 * white)) / 1.02;
         lastOut = output[i];
         output[i] *= 3.5; // Compensate for gain loss
     }
     
     const noise = this.ctx.createBufferSource();
     noise.buffer = buffer;
     noise.loop = true;
     
     // Lowpass Filter to create "wind" effect from noise
     const filter = this.ctx.createBiquadFilter();
     filter.type = 'lowpass';
     filter.frequency.value = 400; 
     
     // LFO to modulate the filter frequency (simulate gusting wind)
     const lfo = this.ctx.createOscillator();
     lfo.type = 'sine';
     lfo.frequency.value = 0.1; // Slow gusts
     const lfoGain = this.ctx.createGain();
     lfoGain.gain.value = 300; // Modulation depth
     
     lfo.connect(lfoGain);
     lfoGain.connect(filter.frequency);
     
     noise.connect(filter);
     filter.connect(this.masterGain);
     
     noise.start();
     lfo.start();
     
     this.activeNodes.push(noise, filter, lfo, lfoGain);
  }

  private startChimes() {
     if (!this.ctx || !this.masterGain) return;

     const scheduleChime = () => {
         if (!this.ctx || !this.masterGain) return;
         const osc = this.ctx.createOscillator();
         const gain = this.ctx.createGain();
         
         // Pentatonic scale frequencies
         const freqs = [261.63, 293.66, 329.63, 392.00, 440.00, 523.25]; 
         // Randomly pick frequency and occasionally shift octave
         const freq = freqs[Math.floor(Math.random() * freqs.length)] * (Math.random() > 0.7 ? 2 : 1);
         
         osc.frequency.value = freq;
         osc.type = 'sine'; // Sine waves sound like pure bells/chimes
         
         // Envelope
         const now = this.ctx.currentTime;
         gain.gain.setValueAtTime(0, now);
         gain.gain.linearRampToValueAtTime(0.2, now + 0.1); // Fast attack
         gain.gain.exponentialRampToValueAtTime(0.001, now + 5); // Long decay
         
         osc.connect(gain);
         gain.connect(this.masterGain!);
         
         osc.start();
         osc.stop(now + 5);
     };

     scheduleChime(); // Play one immediately
     this.chimeInterval = setInterval(scheduleChime, 4000);
  }
  
  cleanup() {
      this.stop();
      if (this.ctx) {
          this.ctx.close().catch(e => console.error("Audio close failed", e));
          this.ctx = null;
      }
  }
}