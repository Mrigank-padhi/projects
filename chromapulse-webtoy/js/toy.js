/**
 * ChromaPulse Main Toy Controller & Interaction Loop
 * Coordinates game loop, UI interactions, mode switching, achievements, and combos.
 */

class ChromaPulseToy {
  constructor() {
    this.canvas = document.getElementById('toy-canvas');
    this.ctx = this.canvas.getContext('2d');

    // Display & Dimensions
    this.width = window.innerWidth;
    this.height = window.innerHeight;

    // Toy Modes: 'sandbox', 'jelly', 'bubblewrap', 'chaos'
    this.currentMode = 'sandbox';
    this.gravityMode = 'earth'; // 'earth', 'zero', 'inverted', 'blackhole'
    this.cursorTool = 'slice';  // 'slice', 'pop', 'repel'
    this.currentTheme = 'cyber';

    // Entities
    this.bubbles = [];
    this.sparkles = [];
    this.floatingTexts = [];
    this.confetti = [];
    this.jelly = null;
    this.bubbleWrapCells = [];

    // Slice Trail Tracking
    this.sliceTrail = [];
    this.maxTrailPoints = 8;

    // Mouse / Touch State
    this.mouse = {
      x: 0,
      y: 0,
      lastX: 0,
      lastY: 0,
      isDown: false,
      active: false,
      tool: this.cursorTool
    };

    // Stats & Gamification
    this.score = 0;
    this.highScore = parseInt(localStorage.getItem('chromapulse_highscore') || '0', 10);
    this.combo = 0;
    this.comboTimer = null;
    this.jellyPokeCount = 0;
    this.bubblesSlicedInStroke = 0;

    // Chaos Button State
    this.chaosStage = 0;
    this.chaosMaxStage = 10;
    this.isDiscoMode = false;
    this.isShaking = false;

    // Achievements system
    this.achievements = {
      FIRST_POP: { id: 'FIRST_POP', title: 'First Pop!', desc: 'Popped your first bubble', unlocked: false, icon: '🫧' },
      SLICE_NINJA: { id: 'SLICE_NINJA', title: 'Bubble Ninja', desc: 'Sliced 3+ bubbles in one continuous swipe', unlocked: false, icon: '⚔️' },
      COMBO_KING: { id: 'COMBO_KING', title: 'Combo Maestro', desc: 'Achieved a 10x Pop Combo', unlocked: false, icon: '🔥' },
      JELLY_WHISPERER: { id: 'JELLY_WHISPERER', title: 'Jelly Whisperer', desc: 'Poked and jiggled Blobby 12 times', unlocked: false, icon: '🍮' },
      WRAP_MASTER: { id: 'WRAP_MASTER', title: 'Tactile Zen', desc: 'Popped an entire sheet of bubble wrap', unlocked: false, icon: '📦' },
      CHAOS_SURVIVOR: { id: 'CHAOS_SURVIVOR', title: 'The Red Button', desc: 'Pushed the forbidden button to Supernova', unlocked: false, icon: '🚨' },
      KONAMI_CODE: { id: 'KONAMI_CODE', title: 'Retro Hacker', desc: 'Discovered the legendary Konami Code', unlocked: false, icon: '👾' },
      MEME_LORD: { id: 'MEME_LORD', title: 'Meme Connoisseur', desc: 'Explored the Meme Soundboard & Soundtracks', unlocked: false, icon: '🗿' }
    };
    this.loadAchievements();

    // Konami Code sequence tracker
    this.konamiSequence = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'];
    this.konamiIndex = 0;

    // Audio Visualizer Canvas
    this.visualizerCanvas = document.getElementById('audio-visualizer');
    this.vizCtx = this.visualizerCanvas ? this.visualizerCanvas.getContext('2d') : null;

    // Initialize
    this.init();
  }

  init() {
    this.resize();
    window.addEventListener('resize', () => this.resize());

    // Setup input listeners
    this.setupMouseEvents();
    this.setupTouchEvents();
    this.setupKeyboardEvents();
    this.setupUIControls();

    // Spawn initial entities
    this.setupMode(this.currentMode);

    // Update initial highscore UI
    this.updateScoreUI();

    // Start 60fps main loop
    requestAnimationFrame((t) => this.loop(t));
  }

  resize() {
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    this.canvas.width = this.width;
    this.canvas.height = this.height;

    if (this.jelly) {
      this.jelly.center.x = this.width / 2;
      this.jelly.center.y = this.height / 2;
    }

    if (this.currentMode === 'bubblewrap') {
      this.initBubbleWrapGrid();
    }
  }

  setupMode(mode) {
    this.currentMode = mode;
    this.bubbles = [];
    this.sparkles = [];
    this.floatingTexts = [];
    this.confetti = [];

    // Hide / Show mode specific DOM overlays
    const chaosContainer = document.getElementById('chaos-container');
    const gravityControls = document.getElementById('gravity-selector');
    const toolControls = document.getElementById('tool-selector');
    const wrapControls = document.getElementById('bubblewrap-actions');

    if (chaosContainer) {
      chaosContainer.classList.toggle('active', mode === 'chaos');
    }
    if (gravityControls) {
      gravityControls.style.display = (mode === 'sandbox') ? 'flex' : 'none';
    }
    if (toolControls) {
      toolControls.style.display = (mode === 'sandbox') ? 'flex' : 'none';
    }
    if (wrapControls) {
      wrapControls.style.display = (mode === 'bubblewrap') ? 'flex' : 'none';
    }

    if (mode === 'sandbox') {
      // Spawn batch of colorful bubbles
      const count = Math.min(22, Math.floor((this.width * this.height) / 38000));
      for (let i = 0; i < count; i++) {
        const radius = 25 + Math.random() * 35;
        const x = radius + Math.random() * (this.width - radius * 2);
        const y = radius + Math.random() * (this.height - radius * 2);
        this.bubbles.push(new Bubble(x, y, radius));
      }
    } else if (mode === 'jelly') {
      this.jelly = new SoftBodyJelly(this.width / 2, this.height / 2, Math.min(130, this.width * 0.16));
    } else if (mode === 'bubblewrap') {
      this.initBubbleWrapGrid();
    } else if (mode === 'chaos') {
      this.resetChaosButton();
    }
  }

  initBubbleWrapGrid() {
    this.bubbleWrapCells = [];
    const cellSize = Math.min(68, Math.floor(Math.min(this.width, this.height) / 7.5));
    const padding = 16;
    const cols = Math.floor((this.width - padding * 2) / (cellSize + 12));
    const rows = Math.floor((this.height - 180) / (cellSize + 12));

    const startX = (this.width - (cols * (cellSize + 12))) / 2 + cellSize / 2;
    const startY = 110 + (this.height - 180 - (rows * (cellSize + 12))) / 2 + cellSize / 2;

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        this.bubbleWrapCells.push({
          x: startX + c * (cellSize + 12),
          y: startY + r * (cellSize + 12),
          radius: cellSize / 2,
          isPopped: false,
          hue: (c * 15 + r * 20) % 360,
          popScale: 1.0
        });
      }
    }
  }

  setupMouseEvents() {
    this.canvas.addEventListener('mousemove', (e) => {
      this.mouse.lastX = this.mouse.x;
      this.mouse.lastY = this.mouse.y;
      this.mouse.x = e.clientX;
      this.mouse.y = e.clientY;
      this.mouse.active = true;

      // Add to slice trail
      this.sliceTrail.push({ x: e.clientX, y: e.clientY, time: Date.now() });
      if (this.sliceTrail.length > this.maxTrailPoints) {
        this.sliceTrail.shift();
      }

      // Check slice collision in sandbox mode
      if (this.currentMode === 'sandbox' && this.cursorTool === 'slice' && this.mouse.isDown) {
        this.checkSliceCollisions(this.mouse.lastX, this.mouse.lastY, this.mouse.x, this.mouse.y);
      }

      // Tickle jelly if moving fast over it
      if (this.currentMode === 'jelly' && this.jelly) {
        const d = dist(this.mouse.x, this.mouse.y, this.jelly.center.x, this.jelly.center.y);
        if (d < this.jelly.baseRadius * 1.2) {
          const moveSpeed = dist(this.mouse.x, this.mouse.y, this.mouse.lastX, this.mouse.lastY);
          if (moveSpeed > 8) {
            this.jelly.poke(this.mouse.x, this.mouse.y, 12);
          }
        }
      }
    });

    this.canvas.addEventListener('mousedown', (e) => {
      if (window.soundEngine) window.soundEngine.resumeContext();
      this.mouse.isDown = true;
      this.mouse.x = e.clientX;
      this.mouse.y = e.clientY;
      this.mouse.lastX = e.clientX;
      this.mouse.lastY = e.clientY;
      this.bubblesSlicedInStroke = 0;

      this.handlePointerDown(e.clientX, e.clientY);
    });

    window.addEventListener('mouseup', () => {
      this.mouse.isDown = false;
      if (this.jelly) {
        if (this.jelly.isGrabbed) {
          this.jelly.isGrabbed = false;
          this.jelly.grabbedIndex = -1;
          if (window.soundEngine) window.soundEngine.playJellySquish(2.2);
        }
      }
    });

    this.canvas.addEventListener('mouseleave', () => {
      this.mouse.active = false;
      this.mouse.isDown = false;
    });
  }

  setupTouchEvents() {
    this.canvas.addEventListener('touchstart', (e) => {
      if (window.soundEngine) window.soundEngine.resumeContext();
      const touch = e.touches[0];
      if (!touch) return;
      this.mouse.isDown = true;
      this.mouse.active = true;
      this.mouse.x = touch.clientX;
      this.mouse.y = touch.clientY;
      this.mouse.lastX = touch.clientX;
      this.mouse.lastY = touch.clientY;
      this.bubblesSlicedInStroke = 0;
      this.handlePointerDown(touch.clientX, touch.clientY);
    }, { passive: false });

    this.canvas.addEventListener('touchmove', (e) => {
      e.preventDefault();
      const touch = e.touches[0];
      if (!touch) return;
      this.mouse.lastX = this.mouse.x;
      this.mouse.lastY = this.mouse.y;
      this.mouse.x = touch.clientX;
      this.mouse.y = touch.clientY;

      this.sliceTrail.push({ x: touch.clientX, y: touch.clientY, time: Date.now() });
      if (this.sliceTrail.length > this.maxTrailPoints) {
        this.sliceTrail.shift();
      }

      if (this.currentMode === 'sandbox' && this.cursorTool === 'slice') {
        this.checkSliceCollisions(this.mouse.lastX, this.mouse.lastY, this.mouse.x, this.mouse.y);
      }
    }, { passive: false });

    window.addEventListener('touchend', () => {
      this.mouse.isDown = false;
      if (this.jelly && this.jelly.isGrabbed) {
        this.jelly.isGrabbed = false;
        this.jelly.grabbedIndex = -1;
      }
    });
  }

  handlePointerDown(x, y) {
    if (this.currentMode === 'sandbox') {
      // If clicking directly on a bubble, pop or squish it
      let hitBubble = false;
      for (let i = this.bubbles.length - 1; i >= 0; i--) {
        const b = this.bubbles[i];
        if (dist(x, y, b.x, b.y) <= b.radius) {
          hitBubble = true;
          if (this.cursorTool === 'pop') {
            this.popBubble(b, i);
          } else {
            // Give it a kick/squish impulse
            b.squish(0.6, 1.4, Math.random() * Math.PI);
            b.vx += (Math.random() - 0.5) * 12;
            b.vy -= 8;
            if (window.soundEngine) window.soundEngine.playBounce(12, b.radius);
          }
          break;
        }
      }

      // If clicked on empty space, spawn a new elastic bubble!
      if (!hitBubble && this.bubbles.length < 50) {
        const radius = 22 + Math.random() * 32;
        const newBubble = new Bubble(x, y, radius);
        newBubble.vy = -6; // Initial pop up
        this.bubbles.push(newBubble);
        if (window.soundEngine) window.soundEngine.playPop(1.3, 0.4);
        this.floatingTexts.push(new FloatingText('✨', x, y - 20, '#00f5ff'));
      }

    } else if (this.currentMode === 'jelly' && this.jelly) {
      // Check if clicked near jelly perimeter to grab, or body to poke
      let nearestDist = 9999;
      let nearestIdx = -1;
      for (let i = 0; i < this.jelly.numPoints; i++) {
        const p = this.jelly.points[i];
        const d = dist(x, y, p.x, p.y);
        if (d < nearestDist) {
          nearestDist = d;
          nearestIdx = i;
        }
      }

      if (nearestDist < 50) {
        this.jelly.isGrabbed = true;
        this.jelly.grabbedIndex = nearestIdx;
        this.jellyPokeCount++;
        if (window.soundEngine) window.soundEngine.playJellySquish(1.8);
      } else if (dist(x, y, this.jelly.center.x, this.jelly.center.y) < this.jelly.baseRadius * 1.4) {
        this.jelly.poke(x, y, 65);
        this.jellyPokeCount++;
        this.floatingTexts.push(new FloatingText('BOING!', x, y - 30, '#ff6ec7'));
      }

      if (this.jellyPokeCount >= 12) {
        this.unlockAchievement('JELLY_WHISPERER');
      }

    } else if (this.currentMode === 'bubblewrap') {
      this.checkBubbleWrapClick(x, y);
    }
  }

  checkBubbleWrapClick(x, y) {
    let unpoppedLeft = 0;
    for (const cell of this.bubbleWrapCells) {
      if (!cell.isPopped) {
        unpoppedLeft++;
        if (dist(x, y, cell.x, cell.y) <= cell.radius) {
          cell.isPopped = true;
          cell.popScale = 1.35;
          this.addScore(15);
          this.registerCombo();

          // ASMR pop sound
          if (window.soundEngine) {
            window.soundEngine.playPop(0.9 + Math.random() * 0.4, 0.3);
          }

          // Sparkles
          for (let k = 0; k < 6; k++) {
            this.sparkles.push(new Sparkle(cell.x, cell.y, cell.hue));
          }

          unpoppedLeft--;
          break;
        }
      }
    }

    if (unpoppedLeft === 0 && this.bubbleWrapCells.length > 0) {
      this.unlockAchievement('WRAP_MASTER');
      this.triggerConfetti(this.width / 2, this.height / 2);
    }
  }

  checkSliceCollisions(x1, y1, x2, y2) {
    for (let i = this.bubbles.length - 1; i >= 0; i--) {
      const b = this.bubbles[i];
      // Check distance from line segment (x1,y1)-(x2,y2) to circle (b.x, b.y)
      if (this.distToSegment(b.x, b.y, x1, y1, x2, y2) <= b.radius) {
        this.sliceBubble(b, i);
      }
    }
  }

  distToSegment(px, py, x1, y1, x2, y2) {
    const l2 = (x2 - x1) ** 2 + (y2 - y1) ** 2;
    if (l2 === 0) return dist(px, py, x1, y1);
    let t = ((px - x1) * (x2 - x1) + (py - y1) * (y2 - y1)) / l2;
    t = Math.max(0, Math.min(1, t));
    return dist(px, py, x1 + t * (x2 - x1), y1 + t * (y2 - y1));
  }

  sliceBubble(b, index) {
    this.bubbles.splice(index, 1);
    this.bubblesSlicedInStroke++;

    if (window.soundEngine) {
      window.soundEngine.playSlice();
      window.soundEngine.playPop(1.4, 0.3);
    }

    this.addScore(25 * (this.combo + 1));
    this.registerCombo();

    // Floating text
    this.floatingTexts.push(new FloatingText(`Sliced! +${25 * (this.combo + 1)}`, b.x, b.y, `hsl(${b.hue}, 100%, 70%)`));

    // Spawn 2 baby bubbles if size is large enough
    if (b.radius > 20) {
      const rNew = b.radius * 0.65;
      const b1 = new Bubble(b.x - 12, b.y, rNew, (b.hue + 20) % 360, b.vx - 3, b.vy);
      const b2 = new Bubble(b.x + 12, b.y, rNew, (b.hue - 20 + 360) % 360, b.vx + 3, b.vy);
      this.bubbles.push(b1, b2);
    }

    // Sparkles
    for (let k = 0; k < 12; k++) {
      this.sparkles.push(new Sparkle(b.x, b.y, b.hue));
    }

    if (this.bubblesSlicedInStroke >= 3) {
      this.unlockAchievement('SLICE_NINJA');
    }
    this.unlockAchievement('FIRST_POP');
  }

  popBubble(b, index) {
    this.bubbles.splice(index, 1);

    if (window.soundEngine) {
      window.soundEngine.playPop(1.0 + (50 - b.radius) * 0.02, b.radius / 50);
    }

    this.addScore(10 * (this.combo + 1));
    this.registerCombo();

    this.floatingTexts.push(new FloatingText(`+${10 * (this.combo + 1)}`, b.x, b.y, `hsl(${b.hue}, 100%, 75%)`));

    // Sparkle burst
    for (let k = 0; k < 14; k++) {
      this.sparkles.push(new Sparkle(b.x, b.y, b.hue));
    }

    this.unlockAchievement('FIRST_POP');
  }

  registerCombo() {
    this.combo++;
    if (this.combo > 1 && window.soundEngine) {
      window.soundEngine.playCombo(this.combo);
    }

    if (this.combo >= 10) {
      this.unlockAchievement('COMBO_KING');
    }

    this.updateComboUI();

    clearTimeout(this.comboTimer);
    this.comboTimer = setTimeout(() => {
      this.combo = 0;
      this.updateComboUI();
    }, 2200);
  }

  addScore(pts) {
    this.score += pts;
    if (this.score > this.highScore) {
      this.highScore = this.score;
      localStorage.setItem('chromapulse_highscore', this.highScore.toString());
    }
    this.updateScoreUI();
  }

  updateScoreUI() {
    const scoreEl = document.getElementById('stat-score');
    const highScoreEl = document.getElementById('stat-highscore');
    if (scoreEl) scoreEl.textContent = this.score.toLocaleString();
    if (highScoreEl) highScoreEl.textContent = this.highScore.toLocaleString();
  }

  updateComboUI() {
    const comboEl = document.getElementById('stat-combo');
    const comboBadge = document.getElementById('combo-badge');
    if (comboEl) comboEl.textContent = `x${this.combo}`;
    if (comboBadge) {
      comboBadge.classList.toggle('active', this.combo > 1);
      comboBadge.style.animation = 'none';
      comboBadge.offsetHeight; // trigger reflow
      comboBadge.style.animation = null;
    }
  }

  triggerConfetti(x, y, count = 40) {
    for (let i = 0; i < count; i++) {
      this.confetti.push(new ConfettiParticle(x, y));
    }
  }

  setupKeyboardEvents() {
    window.addEventListener('keydown', (e) => {
      // Konami Code Detection
      if (e.key === this.konamiSequence[this.konamiIndex]) {
        this.konamiIndex++;
        if (this.konamiIndex === this.konamiSequence.length) {
          this.konamiIndex = 0;
          this.triggerKonamiSurprise();
        }
      } else {
        this.konamiIndex = 0;
      }

      // Hotkeys
      if (e.code === 'Space') {
        e.preventDefault();
        this.triggerBlast();
      } else if (e.key.toLowerCase() === 'c') {
        this.triggerConfetti(this.width / 2, this.height * 0.3, 60);
        if (window.soundEngine) window.soundEngine.playAchievement();
      } else if (e.key.toLowerCase() === 'd') {
        this.toggleDisco();
      } else if (e.key.toLowerCase() === 'g') {
        this.cycleGravity();
      }
    });
  }

  triggerKonamiSurprise() {
    this.unlockAchievement('KONAMI_CODE');
    this.triggerConfetti(this.width / 2, this.height / 2, 100);
    if (window.soundEngine) window.soundEngine.playAchievement();
    this.floatingTexts.push(new FloatingText('👾 KONAMI OVERDRIVE! 👾', this.width / 2, this.height * 0.4, '#00f5ff'));

    // Spawn 30 rainbow bubbles in a circle
    for (let i = 0; i < 30; i++) {
      const angle = (i / 30) * Math.PI * 2;
      const b = new Bubble(
        this.width / 2 + Math.cos(angle) * 80,
        this.height / 2 + Math.sin(angle) * 80,
        28,
        i * 12,
        Math.cos(angle) * 9,
        Math.sin(angle) * 9
      );
      this.bubbles.push(b);
    }
  }

  triggerBlast() {
    if (this.currentMode === 'sandbox') {
      // Pop all bubbles on screen simultaneously!
      while (this.bubbles.length > 0) {
        const b = this.bubbles.pop();
        for (let k = 0; k < 8; k++) {
          this.sparkles.push(new Sparkle(b.x, b.y, b.hue));
        }
      }
      if (window.soundEngine) window.soundEngine.playPop(0.8, 1.0);
      this.floatingTexts.push(new FloatingText('SUPERNOVA BLAST! 💥', this.width / 2, this.height / 2, '#ff007f'));
    } else if (this.currentMode === 'bubblewrap') {
      // Pop all remaining bubbles
      for (const cell of this.bubbleWrapCells) {
        if (!cell.isPopped) {
          cell.isPopped = true;
          cell.popScale = 1.35;
          for (let k = 0; k < 4; k++) {
            this.sparkles.push(new Sparkle(cell.x, cell.y, cell.hue));
          }
        }
      }
      if (window.soundEngine) window.soundEngine.playPop(1.1, 0.8);
      this.triggerConfetti(this.width / 2, this.height / 2, 45);
      this.unlockAchievement('WRAP_MASTER');
    }
  }

  cycleGravity() {
    const modes = ['earth', 'zero', 'inverted', 'blackhole'];
    const nextIdx = (modes.indexOf(this.gravityMode) + 1) % modes.length;
    this.setGravity(modes[nextIdx]);
  }

  setGravity(mode) {
    this.gravityMode = mode;
    document.querySelectorAll('.gravity-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.gravity === mode);
    });
    this.floatingTexts.push(new FloatingText(`Gravity: ${mode.toUpperCase()}`, this.width / 2, 100, '#00f5ff'));
  }

  toggleDisco() {
    this.isDiscoMode = !this.isDiscoMode;
    document.body.classList.toggle('disco-mode', this.isDiscoMode);
  }

  setupUIControls() {
    // Mode Switcher Dock
    document.querySelectorAll('.mode-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        if (window.soundEngine) {
          window.soundEngine.resumeContext();
          window.soundEngine.playClick();
        }
        document.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.setupMode(btn.dataset.mode);
      });
    });

    // Gravity Switcher
    document.querySelectorAll('.gravity-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        if (window.soundEngine) window.soundEngine.playClick();
        this.setGravity(btn.dataset.gravity);
      });
    });

    // Cursor Tool Switcher
    document.querySelectorAll('.tool-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        if (window.soundEngine) window.soundEngine.playClick();
        document.querySelectorAll('.tool-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.cursorTool = btn.dataset.tool;
        this.mouse.tool = this.cursorTool;
      });
    });

    // Sound Pack Dropdown
    const soundSelect = document.getElementById('sound-pack-select');
    if (soundSelect) {
      soundSelect.addEventListener('change', (e) => {
        if (window.soundEngine) {
          window.soundEngine.setSoundPack(e.target.value);
          window.soundEngine.playPop(1.0);
        }
      });
    }

    // Theme Picker
    const themeSelect = document.getElementById('theme-select');
    if (themeSelect) {
      themeSelect.addEventListener('change', (e) => {
        this.currentTheme = e.target.value;
        document.body.setAttribute('data-theme', this.currentTheme);
        if (window.soundEngine) window.soundEngine.playClick();
      });
    }

    // Volume Slider & Mute
    const volSlider = document.getElementById('volume-slider');
    const muteBtn = document.getElementById('mute-btn');
    if (volSlider) {
      volSlider.addEventListener('input', (e) => {
        if (window.soundEngine) window.soundEngine.setVolume(parseFloat(e.target.value));
      });
    }
    if (muteBtn) {
      muteBtn.addEventListener('click', () => {
        if (window.soundEngine) {
          const muted = window.soundEngine.toggleMute();
          muteBtn.classList.toggle('muted', muted);
          muteBtn.innerHTML = muted ? '🔇' : '🔊';
        }
      });
    }

    // Reset Bubble Wrap Button
    const resetWrapBtn = document.getElementById('reset-wrap-btn');
    if (resetWrapBtn) {
      resetWrapBtn.addEventListener('click', () => {
        this.initBubbleWrapGrid();
        if (window.soundEngine) window.soundEngine.playPop(1.5, 0.5);
      });
    }

    // Snapshot Photo Button
    const snapBtn = document.getElementById('snapshot-btn');
    if (snapBtn) {
      snapBtn.addEventListener('click', () => this.captureSnapshot());
    }

    // Modals: Achievements & Help
    this.setupModals();

    // Chaos Button Setup
    this.setupChaosButton();
  }

  setupChaosButton() {
    const chaosBtn = document.getElementById('chaos-button');
    if (!chaosBtn) return;

    const messages = [
      "DO NOT CLICK",
      "Hey! I said DO NOT click.",
      "Seriously? Stop that right now.",
      "You're making a huge mistake.",
      "WARNING: Containment breach imminent!",
      "Are your fingers glued to the mouse?!",
      "ACTIVATING LOW-GRAVITY DISCO!",
      "CRITICAL: SYSTEM OVERHEATING 🔥",
      "3... 2... 1... BRACE FOR IMPACT!",
      "BOOOOOOOOOOOOOM! 💥"
    ];

    chaosBtn.addEventListener('click', () => {
      this.chaosStage++;
      if (window.soundEngine) window.soundEngine.playChaos(this.chaosStage);

      // Button wiggle / dodge
      const dodgeX = (Math.random() - 0.5) * 80;
      const dodgeY = (Math.random() - 0.5) * 60;
      chaosBtn.style.transform = `translate(${dodgeX}px, ${dodgeY}px) scale(${1 + this.chaosStage * 0.05})`;

      // Screen shake
      document.body.classList.add('screen-shake');
      setTimeout(() => document.body.classList.remove('screen-shake'), 350);

      // Update text
      const msgIndex = Math.min(this.chaosStage, messages.length - 1);
      chaosBtn.textContent = messages[msgIndex];

      // Add chaos effects per stage
      if (this.chaosStage === 4) {
        this.triggerConfetti(this.width / 2, this.height / 2, 25);
      } else if (this.chaosStage === 6) {
        this.toggleDisco();
      } else if (this.chaosStage >= 10) {
        // Supernova explosion!
        this.unlockAchievement('CHAOS_SURVIVOR');
        this.triggerConfetti(this.width / 2, this.height / 2, 120);

        // Spawn 40 cosmic bubbles
        for (let i = 0; i < 40; i++) {
          const angle = Math.random() * Math.PI * 2;
          const speed = 4 + Math.random() * 12;
          this.bubbles.push(new Bubble(
            this.width / 2,
            this.height / 2,
            20 + Math.random() * 25,
            Math.floor(Math.random() * 360),
            Math.cos(angle) * speed,
            Math.sin(angle) * speed
          ));
        }

        setTimeout(() => {
          this.resetChaosButton();
        }, 4000);
      }
    });
  }

  resetChaosButton() {
    this.chaosStage = 0;
    const chaosBtn = document.getElementById('chaos-button');
    if (chaosBtn) {
      chaosBtn.textContent = "DO NOT CLICK";
      chaosBtn.style.transform = 'translate(0, 0) scale(1)';
    }
  }

  setupModals() {
    // Achievements modal
    const achBtn = document.getElementById('achievements-btn');
    const achModal = document.getElementById('achievements-modal');
    const achClose = document.getElementById('close-achievements');

    if (achBtn && achModal) {
      achBtn.addEventListener('click', () => {
        this.renderAchievementsList();
        achModal.classList.add('active');
        if (window.soundEngine) window.soundEngine.playClick();
      });
    }
    if (achClose && achModal) {
      achClose.addEventListener('click', () => achModal.classList.remove('active'));
    }

    // Help modal
    const helpBtn = document.getElementById('help-btn');
    const helpModal = document.getElementById('help-modal');
    const helpClose = document.getElementById('close-help');

    if (helpBtn && helpModal) {
      helpBtn.addEventListener('click', () => {
        helpModal.classList.add('active');
        if (window.soundEngine) window.soundEngine.playClick();
      });
    }
    if (helpClose && helpModal) {
      helpClose.addEventListener('click', () => helpModal.classList.remove('active'));
    }

    // Meme Soundboard Modal
    const memeBtn = document.getElementById('meme-board-btn');
    const memeModal = document.getElementById('meme-modal');
    const memeClose = document.getElementById('close-meme');

    if (memeBtn && memeModal) {
      memeBtn.addEventListener('click', () => {
        memeModal.classList.add('active');
        if (window.soundEngine) window.soundEngine.playClick();
      });
    }
    if (memeClose && memeModal) {
      memeClose.addEventListener('click', () => memeModal.classList.remove('active'));
    }

    // Meme SFX Buttons
    document.querySelectorAll('.meme-sfx-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const soundKey = btn.dataset.sound;
        if (window.soundEngine) {
          window.soundEngine.playMeme(soundKey);
        }
        this.unlockAchievement('MEME_LORD');
        this.floatingTexts.push(new FloatingText(`${btn.textContent}!`, this.width / 2, this.height * 0.4, '#ff007f'));
        this.addScore(10);
      });
    });

    // Soundtrack Play/Pause Buttons
    document.querySelectorAll('.st-play-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const trackKey = btn.dataset.track;
        if (window.soundEngine) {
          const isPlaying = window.soundEngine.toggleMemeSoundtrack(trackKey);
          // Update all soundtrack item styles
          document.querySelectorAll('.soundtrack-item').forEach(item => {
            const itemTrack = item.dataset.track;
            const playBtn = item.querySelector('.st-play-btn');
            if (itemTrack === trackKey && isPlaying) {
              item.classList.add('playing');
              if (playBtn) playBtn.textContent = '⏸ Pause';
            } else {
              item.classList.remove('playing');
              if (playBtn) playBtn.textContent = '▶ Play';
            }
          });

          if (isPlaying) {
            this.unlockAchievement('MEME_LORD');
            this.floatingTexts.push(new FloatingText(`🎵 Playing: ${trackKey.toUpperCase()}`, this.width / 2, 110, '#00f5ff'));
          }
        }
      });
    });

    // Close on backdrop click
    [achModal, helpModal, memeModal].forEach(modal => {
      if (modal) {
        modal.addEventListener('click', (e) => {
          if (e.target === modal) modal.classList.remove('active');
        });
      }
    });
  }

  unlockAchievement(id) {
    const ach = this.achievements[id];
    if (!ach || ach.unlocked) return;

    ach.unlocked = true;
    localStorage.setItem(`chromapulse_ach_${id}`, 'true');

    if (window.soundEngine) {
      window.soundEngine.playAchievement();
    }

    // Show achievement notification toast
    const toast = document.getElementById('achievement-toast');
    if (toast) {
      toast.querySelector('.ach-icon').textContent = ach.icon;
      toast.querySelector('.ach-title').textContent = ach.title;
      toast.querySelector('.ach-desc').textContent = ach.desc;
      toast.classList.add('show');
      setTimeout(() => toast.classList.remove('show'), 4200);
    }
  }

  loadAchievements() {
    for (const key in this.achievements) {
      if (localStorage.getItem(`chromapulse_ach_${key}`) === 'true') {
        this.achievements[key].unlocked = true;
      }
    }
  }

  renderAchievementsList() {
    const listEl = document.getElementById('achievements-list');
    if (!listEl) return;
    listEl.innerHTML = '';

    for (const key in this.achievements) {
      const ach = this.achievements[key];
      const item = document.createElement('div');
      item.className = `achievement-item ${ach.unlocked ? 'unlocked' : 'locked'}`;
      item.innerHTML = `
        <div class="ach-icon-circle">${ach.unlocked ? ach.icon : '🔒'}</div>
        <div class="ach-info">
          <h4>${ach.title}</h4>
          <p>${ach.desc}</p>
        </div>
        <div class="ach-status">${ach.unlocked ? 'UNLOCKED' : 'LOCKED'}</div>
      `;
      listEl.appendChild(item);
    }
  }

  captureSnapshot() {
    // Render current frame to an image and download
    const link = document.createElement('a');
    link.download = `ChromaPulse-Art-${Date.now()}.png`;
    link.href = this.canvas.toDataURL('image/png');
    link.click();
    this.floatingTexts.push(new FloatingText('📸 Snapshot Saved!', this.width / 2, this.height * 0.4, '#00f5ff'));
    if (window.soundEngine) window.soundEngine.playPop(1.5, 0.4);
  }

  /**
   * Main 60FPS Game Loop
   */
  loop(timestamp) {
    this.ctx.clearRect(0, 0, this.width, this.height);

    // 1. Draw Mode Entities
    if (this.currentMode === 'sandbox') {
      this.updateAndDrawSandbox();
    } else if (this.currentMode === 'jelly') {
      this.updateAndDrawJelly();
    } else if (this.currentMode === 'bubblewrap') {
      this.updateAndDrawBubbleWrap();
    } else if (this.currentMode === 'chaos') {
      // In chaos mode, draw ambient floating bubbles behind button
      this.updateAndDrawSandbox();
    }

    // 2. Draw Slice Blade Trail
    this.drawSliceTrail();

    // 3. Draw Sparkles
    for (let i = this.sparkles.length - 1; i >= 0; i--) {
      const s = this.sparkles[i];
      s.update();
      s.draw(this.ctx);
      if (s.alpha <= 0) this.sparkles.splice(i, 1);
    }

    // 4. Draw Floating Text Popups
    for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
      const ft = this.floatingTexts[i];
      ft.update();
      ft.draw(this.ctx);
      if (ft.alpha <= 0) this.floatingTexts.splice(i, 1);
    }

    // 5. Draw Confetti Ribbons
    for (let i = this.confetti.length - 1; i >= 0; i--) {
      const c = this.confetti[i];
      c.update();
      c.draw(this.ctx);
      if (c.alpha <= 0) this.confetti.splice(i, 1);
    }

    // 6. Draw Audio Visualizer Bars in HUD
    this.drawAudioVisualizer();

    requestAnimationFrame((t) => this.loop(t));
  }

  updateAndDrawSandbox() {
    // Bubble-to-bubble elastic collision resolution
    for (let i = 0; i < this.bubbles.length; i++) {
      for (let j = i + 1; j < this.bubbles.length; j++) {
        const b1 = this.bubbles[i];
        const b2 = this.bubbles[j];
        const d = dist(b1.x, b1.y, b2.x, b2.y);
        const minDist = b1.radius + b2.radius;

        if (d < minDist && d > 0) {
          // Normal vector
          const nx = (b2.x - b1.x) / d;
          const ny = (b2.y - b1.y) / d;

          // Overlap resolution
          const overlap = (minDist - d) * 0.5;
          b1.x -= nx * overlap;
          b1.y -= ny * overlap;
          b2.x += nx * overlap;
          b2.y += ny * overlap;

          // Elastic bounce
          const kx = b1.vx - b2.vx;
          const ky = b1.vy - b2.vy;
          const p = 2 * (nx * kx + ny * ky) / (b1.mass + b2.mass);

          b1.vx -= p * b2.mass * nx;
          b1.vy -= p * b2.mass * ny;
          b2.vx += p * b1.mass * nx;
          b2.vy += p * b1.mass * ny;

          // Subtle squish
          b1.squish(0.85, 1.15, Math.atan2(ny, nx));
          b2.squish(0.85, 1.15, Math.atan2(ny, nx));

          const relSpeed = Math.hypot(kx, ky);
          if (relSpeed > 3.5 && window.soundEngine) {
            const now = performance.now();
            if (!window._lastBubbleBounce || now - window._lastBubbleBounce > 50) {
              window._lastBubbleBounce = now;
              window.soundEngine.playBounce(relSpeed, (b1.radius + b2.radius) * 0.5);
            }
          }
        }
      }
    }

    // Update & draw each bubble
    for (let i = 0; i < this.bubbles.length; i++) {
      const b = this.bubbles[i];
      b.isHovered = dist(this.mouse.x, this.mouse.y, b.x, b.y) <= b.radius;
      b.update(this.width, this.height, this.gravityMode, this.mouse);
      b.draw(this.ctx, this.currentTheme);
    }
  }

  updateAndDrawJelly() {
    if (!this.jelly) return;
    this.jelly.update(this.width, this.height, this.mouse);
    this.jelly.draw(this.ctx, this.mouse, this.currentTheme);
  }

  updateAndDrawBubbleWrap() {
    for (const cell of this.bubbleWrapCells) {
      this.ctx.save();
      this.ctx.translate(cell.x, cell.y);

      if (cell.popScale > 1.0) {
        cell.popScale += (1.0 - cell.popScale) * 0.15;
      }
      this.ctx.scale(cell.popScale, cell.popScale);

      const r = cell.radius;

      if (cell.isPopped) {
        // Popped flattened bubble look
        this.ctx.beginPath();
        this.ctx.arc(0, 0, r * 0.82, 0, Math.PI * 2);
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
        this.ctx.fill();

        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
        this.ctx.lineWidth = 2;
        this.ctx.stroke();

        // Little wrinkly crinkles
        this.ctx.beginPath();
        this.ctx.moveTo(-r * 0.3, -r * 0.2);
        this.ctx.lineTo(r * 0.3, r * 0.2);
        this.ctx.moveTo(r * 0.2, -r * 0.3);
        this.ctx.lineTo(-r * 0.2, r * 0.3);
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
        this.ctx.lineWidth = 1.5;
        this.ctx.stroke();

      } else {
        // Unpopped 3D tactile bubble dome
        const grad = this.ctx.createRadialGradient(
          -r * 0.35, -r * 0.35, r * 0.1,
          0, 0, r
        );
        grad.addColorStop(0, `hsla(${cell.hue}, 90%, 80%, 0.85)`);
        grad.addColorStop(0.7, `hsla(${cell.hue}, 80%, 55%, 0.4)`);
        grad.addColorStop(1, `hsla(${cell.hue}, 100%, 45%, 0.75)`);

        this.ctx.beginPath();
        this.ctx.arc(0, 0, r, 0, Math.PI * 2);
        this.ctx.fillStyle = grad;
        this.ctx.shadowColor = `hsl(${cell.hue}, 100%, 60%)`;
        this.ctx.shadowBlur = 14;
        this.ctx.fill();

        // Highlight
        this.ctx.beginPath();
        this.ctx.ellipse(-r * 0.35, -r * 0.35, r * 0.35, r * 0.18, -Math.PI / 4, 0, Math.PI * 2);
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        this.ctx.shadowBlur = 0;
        this.ctx.fill();
      }

      this.ctx.restore();
    }
  }

  drawSliceTrail() {
    if (this.sliceTrail.length < 2) return;
    this.ctx.save();
    for (let i = 1; i < this.sliceTrail.length; i++) {
      const p1 = this.sliceTrail[i - 1];
      const p2 = this.sliceTrail[i];
      const alpha = (i / this.sliceTrail.length);
      const width = alpha * 8;

      this.ctx.beginPath();
      this.ctx.moveTo(p1.x, p1.y);
      this.ctx.lineTo(p2.x, p2.y);
      this.ctx.strokeStyle = `rgba(0, 245, 255, ${alpha * 0.9})`;
      this.ctx.lineWidth = width;
      this.ctx.lineCap = 'round';
      this.ctx.shadowColor = '#00f5ff';
      this.ctx.shadowBlur = 12;
      this.ctx.stroke();
    }
    this.ctx.restore();
  }

  drawAudioVisualizer() {
    if (!this.vizCtx || !window.soundEngine) return;
    const data = window.soundEngine.getVisualizerData();
    const w = this.visualizerCanvas.width;
    const h = this.visualizerCanvas.height;

    this.vizCtx.clearRect(0, 0, w, h);
    const barCount = 12;
    const barWidth = w / barCount - 2;

    for (let i = 0; i < barCount; i++) {
      const val = data[i * 2] || 0;
      const barHeight = Math.max(3, (val / 255) * h);
      const x = i * (barWidth + 2);
      const y = h - barHeight;

      this.vizCtx.fillStyle = `hsl(${180 + i * 15}, 100%, 65%)`;
      this.vizCtx.fillRect(x, y, barWidth, barHeight);
    }
  }
}

// Instant Web Audio unlock on initial user gesture
['click', 'touchstart', 'keydown'].forEach(evt => {
  window.addEventListener(evt, () => {
    if (window.soundEngine) window.soundEngine.resumeContext();
  }, { once: true });
});

// Instantiate toy on DOM load
window.addEventListener('DOMContentLoaded', () => {
  window.chromaPulse = new ChromaPulseToy();
});
