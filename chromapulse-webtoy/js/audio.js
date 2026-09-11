/**
 * ChromaPulse Procedural & Meme Web Audio Engine
 * Combines procedural Web Audio API synthesis with iconic meme sound effects
 * and meme soundtracks (local & online CDN fallback).
 * 
 * Bulletproof audio pipeline: direct HTML5 Audio for meme clips (zero CORS silencing),
 * plus Web Audio API synthesis for procedural soundscapes.
 */

class SoundEngine {
  constructor() {
    this.ctx = null;
    this.masterGain = null;
    this.analyser = null;
    this.isMuted = false;
    this.volume = 0.7;
    this.currentPack = 'asmr'; // 'zen', 'asmr', 'arcade', 'synth', 'meme'
    this.isInitialized = false;

    // Pentatonic scale frequencies for Zen Chimes (C4 to C6)
    this.pentatonicNotes = [261.63, 293.66, 329.63, 392.00, 440.00, 523.25, 587.33, 659.25, 783.99, 880.00, 1046.50];
    this.synthChords = [130.81, 164.81, 196.00, 246.94, 261.63, 329.63, 392.00, 493.88];

    // Registry of Meme Sounds & Soundtracks
    this.memeSounds = {
      'vine-boom': { name: 'Vine Boom', emoji: '💥', file: 'vine-boom.mp3' },
      'bruh': { name: 'Bruh', emoji: '🗿', file: 'bruh.mp3' },
      'emotional-damage': { name: 'Emotional Damage', emoji: '💔', file: 'emotional-damage.mp3' },
      'taco-bell': { name: 'Taco Bell Bong', emoji: '🔔', file: 'taco-bell.mp3' },
      'oof': { name: 'Roblox Oof', emoji: '🤕', file: 'oof.mp3' },
      'WinError': { name: 'Windows Error', emoji: '🖥️', file: 'WinError.mp3' },
      'airhorn': { name: 'MLG Airhorn', emoji: '🎺', file: 'airhorn.mp3' },
      'anime-wow': { name: 'Anime WOW', emoji: '👁️', file: 'anime-wow.mp3' },
      'bonk': { name: 'Bonk Doge', emoji: '🏏', file: 'bonk.mp3' },
      'yeet': { name: 'Yeet!', emoji: '🚀', file: 'yeet.mp3' },
      'amongus': { name: 'Among Us Trap', emoji: '🛸', file: 'amongus.mp3', isSoundtrack: true },
      'badtothebone': { name: 'Bad to the Bone Riff', emoji: '🎸', file: 'badtothebone.mp3', isSoundtrack: true },
      'coffin-dance': { name: 'Coffin Dance (Astronomia)', emoji: '⚰️', file: 'coffin-dance.mp3', isSoundtrack: true }
    };

    // Preloaded audio elements cache
    this.preloadedAudios = {};
    this.currentBgm = null;
    this.currentBgmKey = null;
    this.isBgmPlaying = false;
    this.lastMemePlayTime = 0;

    // Preload audio elements
    this.preloadMemeAudio();
  }

  /**
   * Preloads meme audio instances for zero-latency playback
   */
  preloadMemeAudio() {
    for (const key in this.memeSounds) {
      const entry = this.memeSounds[key];
      const audio = new Audio();
      audio.preload = 'auto';
      audio.src = `./sounds/${entry.file}`;
      this.preloadedAudios[key] = audio;
    }
  }

  /**
   * Initializes the Web Audio context on user gesture
   */
  init() {
    if (this.isInitialized) return;

    try {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (!AudioContextClass) return;

      this.ctx = new AudioContextClass();

      // Master Gain
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(this.volume, this.ctx.currentTime);

      // Analyser for real-time visualizer
      this.analyser = this.ctx.createAnalyser();
      this.analyser.fftSize = 64;
      this.analyser.smoothingTimeConstant = 0.8;

      this.masterGain.connect(this.analyser);
      this.analyser.connect(this.ctx.destination);

      this.isInitialized = true;
    } catch (e) {
      console.warn('Web Audio init:', e);
    }
  }

  resumeContext() {
    if (!this.isInitialized) {
      this.init();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  setSoundPack(pack) {
    if (['zen', 'asmr', 'arcade', 'synth', 'meme'].includes(pack)) {
      this.currentPack = pack;
    }
  }

  setVolume(vol) {
    this.volume = Math.max(0, Math.min(1, vol));
    if (this.masterGain && this.ctx && !this.isMuted) {
      this.masterGain.gain.setTargetAtTime(this.volume, this.ctx.currentTime, 0.05);
    }
    if (this.currentBgm) {
      this.currentBgm.volume = this.isMuted ? 0 : this.volume;
    }
  }

  toggleMute() {
    this.isMuted = !this.isMuted;
    if (this.masterGain && this.ctx) {
      const target = this.isMuted ? 0 : this.volume;
      this.masterGain.gain.setTargetAtTime(target, this.ctx.currentTime, 0.05);
    }
    if (this.currentBgm) {
      this.currentBgm.volume = this.isMuted ? 0 : this.volume;
    }
    return this.isMuted;
  }

  getVisualizerData() {
    const bufferLength = this.analyser ? this.analyser.frequencyBinCount : 32;
    const dataArray = new Uint8Array(bufferLength);

    if (this.analyser) {
      this.analyser.getByteFrequencyData(dataArray);
    }

    // If BGM or recent meme is playing, stimulate visualizer bars so they groove live
    const now = performance.now();
    const isMemeActive = (now - this.lastMemePlayTime < 1200);

    if ((this.isBgmPlaying || isMemeActive) && !this.isMuted) {
      const t = now * 0.008;
      for (let i = 0; i < dataArray.length; i++) {
        const beat = (Math.sin(t * 2.5 + i * 0.4) * 0.5 + 0.5) * (isMemeActive ? 240 : 190);
        dataArray[i] = Math.max(dataArray[i], Math.floor(beat * this.volume));
      }
    }

    return dataArray;
  }

  /**
   * Plays a meme sound effect directly via HTML5 Audio
   * (Does NOT use createMediaElementSource, guaranteeing zero CORS / zero file:// silencing)
   */
  playMeme(soundKey, customVolume = 1.0) {
    if (this.isMuted) return;
    this.resumeContext();

    const entry = this.memeSounds[soundKey];
    if (!entry) return;

    this.lastMemePlayTime = performance.now();

    const localSrc = `./sounds/${entry.file}`;
    const cdnSrc = `https://cdn.jsdelivr.net/gh/3kh0/soundboard@main/sounds/${entry.file}`;

    // Create or clone fresh Audio instance to support rapid overlapping sounds
    const audio = new Audio();
    audio.volume = Math.max(0, Math.min(1.0, this.volume * customVolume));
    audio.src = localSrc;

    // Direct playback with fallback on error
    const playAttempt = audio.play();
    if (playAttempt !== undefined) {
      playAttempt.catch(err => {
        // If local file blocked by strict file:// sandbox, try CDN
        console.warn(`Local audio play for ${soundKey} failed, trying CDN:`, err);
        const cdnAudio = new Audio(cdnSrc);
        cdnAudio.volume = Math.max(0, Math.min(1.0, this.volume * customVolume));
        cdnAudio.play().catch(cdnErr => {
          console.warn(`CDN play failed for ${soundKey}:`, cdnErr);
          this.playProceduralFallback(soundKey);
        });
      });
    }

    // Also attach onerror in case network/loading fails
    audio.onerror = () => {
      if (audio.src !== cdnSrc) {
        audio.src = cdnSrc;
        audio.play().catch(() => this.playProceduralFallback(soundKey));
      }
    };
  }

  /**
   * Controls Background Meme Soundtracks (Coffin Dance, Bad to the Bone, Among Us)
   */
  toggleMemeSoundtrack(trackKey) {
    this.resumeContext();

    // If currently playing this exact track, pause it
    if (this.isBgmPlaying && this.currentBgmKey === trackKey) {
      this.pauseMemeSoundtrack();
      return false;
    }

    // Stop existing soundtrack if different
    if (this.currentBgm) {
      this.currentBgm.pause();
      this.currentBgm.currentTime = 0;
    }

    const entry = this.memeSounds[trackKey];
    if (!entry) return false;

    const localSrc = `./sounds/${entry.file}`;
    const cdnSrc = `https://cdn.jsdelivr.net/gh/3kh0/soundboard@main/sounds/${entry.file}`;

    const audio = new Audio();
    audio.src = localSrc;
    audio.loop = true;
    audio.volume = this.isMuted ? 0 : this.volume * 0.9;

    audio.onerror = () => {
      if (audio.src !== cdnSrc) {
        audio.src = cdnSrc;
        audio.play();
      }
    };

    const playPromise = audio.play();
    if (playPromise !== undefined) {
      playPromise.then(() => {
        this.currentBgm = audio;
        this.currentBgmKey = trackKey;
        this.isBgmPlaying = true;
      }).catch(err => {
        console.warn('Soundtrack local playback error, trying CDN:', err);
        audio.src = cdnSrc;
        audio.play().then(() => {
          this.currentBgm = audio;
          this.currentBgmKey = trackKey;
          this.isBgmPlaying = true;
        }).catch(e => console.error('Soundtrack play prevented:', e));
      });
    }

    this.currentBgm = audio;
    this.currentBgmKey = trackKey;
    this.isBgmPlaying = true;
    return true;
  }

  pauseMemeSoundtrack() {
    if (this.currentBgm) {
      this.currentBgm.pause();
      this.isBgmPlaying = false;
    }
  }

  resumeMemeSoundtrack() {
    if (this.currentBgm) {
      this.currentBgm.play();
      this.isBgmPlaying = true;
    }
  }

  /**
   * Procedural Fallback if audio fails
   */
  playProceduralFallback(key) {
    if (key === 'vine-boom') {
      this.playChaos(9);
    } else if (key === 'airhorn') {
      this.playAchievement();
    } else {
      this.playPop(1.2);
    }
  }

  /**
   * Universal Pop Sound tailored to current sound pack
   */
  playPop(pitchMod = 1.0, relativeSize = 0.5) {
    if (this.isMuted) return;
    this.resumeContext();

    if (this.currentPack === 'meme') {
      // Random punchy meme sounds for pops!
      const popMemes = ['vine-boom', 'bruh', 'oof', 'taco-bell', 'bonk', 'yeet', 'emotional-damage'];
      const pick = popMemes[Math.floor(Math.random() * popMemes.length)];
      this.playMeme(pick, 0.85);
      return;
    }

    if (!this.ctx) return;
    const t = this.ctx.currentTime;

    if (this.currentPack === 'zen') {
      const noteIdx = Math.floor(Math.random() * this.pentatonicNotes.length);
      const baseFreq = this.pentatonicNotes[noteIdx] * (0.8 + (1 - relativeSize) * 0.5);

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(baseFreq, t);

      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(0.35, t + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.6);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(t);
      osc.stop(t + 0.65);

    } else if (this.currentPack === 'asmr') {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      const startFreq = 750 * pitchMod;
      const endFreq = 90 * pitchMod;

      osc.type = 'sine';
      osc.frequency.setValueAtTime(startFreq, t);
      osc.frequency.exponentialRampToValueAtTime(Math.max(20, endFreq), t + 0.045);

      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(400 * pitchMod, t);
      filter.Q.setValueAtTime(3.5, t);

      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(0.65, t + 0.004);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.05);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterGain);

      osc.start(t);
      osc.stop(t + 0.055);

    } else if (this.currentPack === 'arcade') {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'square';
      const baseFreq = 440 * pitchMod;
      osc.frequency.setValueAtTime(baseFreq, t);
      osc.frequency.linearRampToValueAtTime(baseFreq * 2.2, t + 0.06);

      gain.gain.setValueAtTime(0.25, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.08);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(t);
      osc.stop(t + 0.09);

    } else if (this.currentPack === 'synth') {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(1200 * pitchMod, t);
      osc.frequency.exponentialRampToValueAtTime(180, t + 0.09);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(3500, t);
      filter.frequency.exponentialRampToValueAtTime(200, t + 0.09);
      filter.Q.setValueAtTime(6.0, t);

      gain.gain.setValueAtTime(0.3, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.1);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterGain);

      osc.start(t);
      osc.stop(t + 0.11);
    }
  }

  /**
   * Physical bounce sound
   */
  playBounce(velocity = 1.0, size = 30) {
    if (this.isMuted) return;
    this.resumeContext();

    if (this.currentPack === 'meme' && Math.random() < 0.25) {
      this.playMeme('bonk', 0.65);
      return;
    }

    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    const normalizedVel = Math.min(1.0, Math.max(0.1, velocity / 15));
    const freq = Math.max(80, 420 - size * 4);

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, t);
    osc.frequency.exponentialRampToValueAtTime(freq * 0.7, t + 0.04);

    gain.gain.setValueAtTime(0.08 * normalizedVel, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.045);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(t);
    osc.stop(t + 0.05);
  }

  /**
   * Slice / Whoosh sound effect
   */
  playSlice() {
    if (this.isMuted) return;
    this.resumeContext();

    if (this.currentPack === 'meme') {
      if (Math.random() < 0.5) {
        this.playMeme('anime-wow', 0.9);
      } else {
        this.playMeme('yeet', 0.9);
      }
      return;
    }

    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(800, t);
    osc.frequency.exponentialRampToValueAtTime(220, t + 0.08);

    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1400, t);
    filter.Q.setValueAtTime(1.5, t);

    gain.gain.setValueAtTime(0.2, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.08);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    osc.start(t);
    osc.stop(t + 0.09);
  }

  /**
   * Squishy Jelly Stretch / Squelch sound
   */
  playJellySquish(stretch = 1.0) {
    if (this.isMuted) return;
    this.resumeContext();

    if (this.currentPack === 'meme' && Math.random() < 0.55) {
      this.playMeme(Math.random() < 0.5 ? 'oof' : 'bruh', 0.85);
      return;
    }

    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    const baseFreq = 180 + Math.min(300, stretch * 50);
    osc.frequency.setValueAtTime(baseFreq, t);
    osc.frequency.linearRampToValueAtTime(baseFreq * 1.5, t + 0.04);
    osc.frequency.exponentialRampToValueAtTime(baseFreq * 0.8, t + 0.12);

    gain.gain.setValueAtTime(0.18, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.13);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(t);
    osc.stop(t + 0.14);
  }

  /**
   * Escalating sounds for the DO NOT CLICK Chaos Button
   */
  playChaos(stage) {
    if (this.isMuted) return;
    this.resumeContext();

    if (stage === 1) {
      this.playMeme('vine-boom', 0.9);
    } else if (stage === 3) {
      this.playMeme('bruh', 1.0);
    } else if (stage === 5) {
      this.playMeme('WinError', 1.0);
    } else if (stage === 7) {
      this.playMeme('emotional-damage', 1.0);
    } else if (stage >= 10) {
      this.playMeme('coffin-dance', 1.0);
    } else {
      if (!this.ctx) return;
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(300, t);
      osc.frequency.exponentialRampToValueAtTime(40, t + 0.6);
      gain.gain.setValueAtTime(0.5, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.7);
      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(t);
      osc.stop(t + 0.75);
    }
  }

  /**
   * Rising combo sound
   */
  playCombo(combo) {
    if (this.isMuted) return;
    this.resumeContext();

    if (combo >= 5 && Math.random() < 0.35) {
      this.playMeme('airhorn', 0.9);
      return;
    }

    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    const baseIndex = (combo % 8);
    const freq = this.pentatonicNotes[baseIndex % this.pentatonicNotes.length];

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq * 1.5, t);

    gain.gain.setValueAtTime(0.25, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.2);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(t);
    osc.stop(t + 0.22);
  }

  /**
   * Triumphant Achievement Fanfare
   */
  playAchievement() {
    if (this.isMuted) return;
    this.resumeContext();

    if (Math.random() < 0.4) {
      this.playMeme('airhorn', 0.9);
      return;
    }

    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    const notes = [523.25, 659.25, 783.99, 1046.50];

    notes.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const noteTime = t + idx * 0.08;

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, noteTime);

      gain.gain.setValueAtTime(0, noteTime);
      gain.gain.linearRampToValueAtTime(0.3, noteTime + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, noteTime + 0.4);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(noteTime);
      osc.stop(noteTime + 0.45);
    });
  }

  /**
   * UI Click sound
   */
  playClick() {
    if (this.isMuted) return;
    this.resumeContext();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(900, t);
    osc.frequency.exponentialRampToValueAtTime(300, t + 0.03);

    gain.gain.setValueAtTime(0.12, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.03);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(t);
    osc.stop(t + 0.035);
  }
}

// Export singleton instance
window.soundEngine = new SoundEngine();
