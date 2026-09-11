# 🫧 ChromaPulse — The Hyper-Delight Sensory Web Toy

> **Submission for GitHub Community SRM (GCSRM) Recruitment 2026**  
> **Track:** Web Development (Year 1) — **Option A: Build a Web Toy**  
> **Tech Stack:** Vanilla HTML5, CSS3, JavaScript (ES6+), Procedural Web Audio API  

[![Live Demo](https://img.shields.io/badge/Live%20Demo-Vercel%20%7C%20GitHub%20Pages-00f5ff?style=for-the-badge&logo=vercel)](https://your-deployment-link.vercel.app)
[![Submission Track](https://img.shields.io/badge/GCSRM-Recruitment%202026-ff007f?style=for-the-badge&logo=github)](https://github.com)
[![Zero Dependencies](https://img.shields.io/badge/Dependencies-Zero%20(Pure%20Vanilla)-success?style=for-the-badge)](#)

---

## 👨‍💻 Candidate Details
- **Candidate Name:** [Your Name Here]
- **Registration / Roll No:** [Your Roll Number Here]
- **Department / Year:** B.Tech — 1st Year (2026)
- **GitHub Repository:** [https://github.com/your-username/chromapulse-webtoy](https://github.com/your-username/chromapulse-webtoy)
- **Live Deployment Link:** [https://your-username.github.io/chromapulse-webtoy/](https://your-username.github.io/chromapulse-webtoy/)
- **Demo Video Link:** [Link to Loom / Drive / YouTube / Twitter video]

---

## 🌟 Project Overview

**ChromaPulse** is an interactive, kinetic web toy and sensory sandbox designed to delight the senses with fluid physics, elastic deformations, high-fidelity procedural acoustics, and escalating chaos. 

Built with **zero external libraries or bloated build tools**, ChromaPulse runs natively at 60 FPS in any modern web browser. It turns the user's cursor or touch gestures into a playful musical instrument and tactile stress reliever.

---

## 🎮 Core Interactions & Toy Modes

ChromaPulse features **4 distinct interactive modes**, far exceeding the 3-interaction minimum requirement:

### 1. 🫧 Kinetic Bubble & Particle Sandbox
- **Spawn & Bounce:** Click or tap any empty space on the canvas to birth bouncy neon bubbles with mass, momentum, and elastic squash-and-stretch collisions.
- **⚔️ Slice Blade (Fruit Ninja style):** Swipe across bubbles to cleanly bifurcate them into musical arpeggio bursts and sparkling particle cascades.
- **🎯 Tactile Popper:** Direct-click bursting for fast stress relief.
- **🛡️ Magnetic Repulsion:** Cursor acts as a force field pushing bubbles away.
- **Four Gravity Presets:**
  - `⬇️ Gravity` — Natural downward bounce.
  - `🛸 Zero-G` — Serene cosmic drift.
  - `⬆️ Inverted` — Floating helium balloon buoyancy.
  - `🌀 Vortex Black Hole` — Cursor becomes a gravitational singularity that draws bubbles into swirling orbital galaxies.

### 2. 🍮 Squishy Soft-Body "Blobby"
- **Spring-Damper Mesh Physics:** An organic gelatinous creature built with a radial spring network.
- **Poke & Stretch:** Click and pull any point along Blobby's perimeter to stretch its elastic body; release to watch it oscillate and snap back with a boing sound.
- **Kawaii Expressive Face:** Eyes dynamically track your cursor, blink naturally, and morph into joyful crescents `(^_^)` with cute blush cheeks when tickled!

### 3. 📦 Bubble Wrap ASMR Grid
- **Tactile 3D Grid:** A sheet of air bubbles rendered with realistic depth, lighting, and wrinkly deflation states.
- **Acoustic Snaps:** Every popped cell plays high-frequency resonant bubble-wrap snaps.
- **Combo Multipliers:** Rapid popping elevates combo streaks (`x2`, `x5`, `x10`).
- **Supernova Blast:** Hit "Pop All" or press <kbd>Space</kbd> for an instant screen-wide popping celebration with confetti ribbons.

### 4. 🚨 The Cursed "DO NOT CLICK" Chaos Button
- An escalating behavioral easter egg that begs the user to leave it alone.
- **10 Escalating Stages:**
  1. Mild warning blips.
  2. Button starts dodging cursor attempts.
  3. Screen shake tremors.
  4. Confetti warning burst.
  5. Low-gravity psychedelic disco strobe mode.
  6. Nuclear alarms and bass drops.
  7. **Supernova Super-Explosion** triggering 40+ rainbow cosmic bubbles and unlocking the *"Curiosity Killed the Cat"* achievement!

---

## 🎵 Procedural Synth & Meme Soundboard Engine

ChromaPulse provides a hybrid audio architecture: a **100% synthesized procedural Web Audio engine** coupled with an **interactive Meme Soundboard & Soundtrack Radio** (stored locally with automated online CDN fallback):

- **🎧 ASMR Pops:** Resonant frequency-modulated downward pitch sweeps coupled with bandpass filtration for crisp tactile snaps.
- **🎐 Crystal Zen:** Pentatonic scale chimes (*C4 to C6*) calculated dynamically from collision velocities and bubble radii.
- **👾 8-Bit Arcade:** Retro square waves with fast upward frequency arpeggios.
- **⚡ Cyber Synth:** Lowpass resonant sawtooth sweeps with punchy attack envelopes.
- **🔥 Dank Memes Sound Pack:** Turns bubble pops and squishes into Vine Booms, Bruhs, Roblox Oofs, Taco Bell Dongs, and Emotional Damage!
- **🗿 Meme Soundboard & Soundtracks:**
  - **Loopable BGM Soundtracks:** *Coffin Dance (Astronomia)*, *Bad to the Bone (Guitar Riff Meme)*, *Among Us Trap Remix*.
  - **Instant SFX Board:** *Vine Boom, Bruh, Emotional Damage, Taco Bell Bong, Roblox Oof, Windows XP Error, MLG Airhorn, Anime WOW, Bonk Doge, Yeet!*.
- **Live Equalizer Visualizer:** Real-time Web Audio `AnalyserNode` frequency spectrum dancing in the header HUD.
- **Volume & Mute Controls:** Fine-tuned master gain with quick mute toggle.

---

## 🏆 Bonus Criteria Satisfied

| Bonus Requirement | ChromaPulse Implementation |
| :--- | :--- |
| **Animations** | Fluid 60 FPS requestAnimationFrame canvas loop, squash-and-stretch deformation, floating text popups, sparkle particle bursts, confetti ribbons, and screen-shake tremors. |
| **Sound Effects & Soundtracks** | Polyphonic Web Audio synthesizer + **Online Meme Soundtracks & Soundboard** (Coffin Dance, Bad to the Bone, Among Us, Vine Boom, Bruh, Oof, etc.) with velocity-scaled bounce harmonics, slice whooshes, jelly squelches, and fanfare arpeggios. |
| **Themes / Dark Mode** | 4 customizable visual themes: **Cyber Neon**, **Pastel Dream**, **Deep Cosmic**, and **Retro Vaporwave**. |
| **Score System** | Real-time score counter, combo multiplier (`x2` to `x10+`), and combo countdown timer. |
| **Local Storage** | Best score is persistently stored in `localStorage` alongside unlocked achievement badges. |
| **Achievements System** | 8 unlockable badges (e.g., *Bubble Ninja*, *Combo Maestro*, *Jelly Whisperer*, *Tactile Zen*, *The Red Button*, *Meme Connoisseur*). |
| **Easter Eggs** | • **Konami Code** (<kbd>↑</kbd> <kbd>↑</kbd> <kbd>↓</kbd> <kbd>↓</kbd> <kbd>←</kbd> <kbd>→</kbd> <kbd>←</kbd> <kbd>→</kbd> <kbd>B</kbd> <kbd>A</kbd>) unlocks Konami Overdrive.<br>• <kbd>C</kbd> trigger confetti shower.<br>• <kbd>D</kbd> toggles Disco Strobe.<br>• <kbd>G</kbd> cycles gravity.<br>• Meme Soundboard modal triggers celebratory floating popups! |

---

## 🚀 Quick Start & Local Setup

ChromaPulse requires **zero build steps or node_modules**.

### Method 1: Open Directly
Simply double-click `index.html` in any modern browser (Chrome, Edge, Firefox, Safari).

### Method 2: Local Server (Recommended for audio autoplay)
```bash
# Using Python (built-in on Windows/Mac/Linux)
python -m http.server 8000

# OR using Node.js
npx serve .
```
Then open `http://localhost:8000` in your web browser.

---

## 🌐 Free 1-Click Deployment Guide

### Deploying to GitHub Pages
1. Create a public repository on GitHub named `chromapulse-webtoy`.
2. Push this folder to your repository:
   ```bash
   git init
   git add .
   git commit -m "feat: ChromaPulse Web Toy for GCSRM 2026"
   git branch -M main
   git remote add origin https://github.com/your-username/chromapulse-webtoy.git
   git push -u origin main
   ```
3. In your GitHub repo, go to **Settings** > **Pages**.
4. Under **Branch**, select `main` and `/ (root)`, then click **Save**.
5. Your website will be live at `https://your-username.github.io/chromapulse-webtoy/` in seconds!

### Deploying to Vercel
1. Go to [vercel.com](https://vercel.com) and click **Add New Project**.
2. Select your `chromapulse-webtoy` repository.
3. Click **Deploy** (no build command needed).

---

## 🎬 Video Demonstration Checklist

When recording your 60-90 second demonstration video for GCSRM submission:
1. **0:00 - 0:15:** Introduce yourself and showcase **Bubble Sandbox** (spawn bubbles, slice across them with the blade, show the sound visualizer dancing).
2. **0:15 - 0:30:** Switch gravity to **Vortex Black Hole** to demonstrate orbital particle swarms; switch sound pack to **Crystal Zen** to demonstrate procedural chimes.
3. **0:30 - 0:45:** Click **Squishy Blobby**, drag and stretch Blobby, tickle its face to trigger happy anime eyes `(^_^)`.
4. **0:45 - 1:00:** Switch to **Bubble Wrap ASMR**, pop bubbles rapidly to build a combo streak, then hit **Pop All** for a confetti explosion.
5. **1:00 - 1:15:** Switch to **DO NOT CLICK** and click the button through escalating stages until the final supernova screen shake!
6. **1:15 - 1:20:** Show the **Achievements Modal** and **Theme Switcher**.

---

## 📁 File Structure

```
chromapulse-webtoy/
├── index.html         # Semantic layout, glassmorphic HUD, mode dock, modals
├── style.css          # CSS variables, glassmorphic styling, animations, responsive design
├── js/
│   ├── audio.js       # Procedural Web Audio API synthesizer (Zen, ASMR, Arcade, Synth)
│   ├── physics.js     # Elastic collisions, particle systems, soft-body jelly mesh
│   └── toy.js         # Input handlers, game loop, combos, achievements, easter eggs
└── README.md          # Project documentation & recruitment submission guide
```

---

*Crafted with passion for the GitHub Community SRM (GCSRM) Recruitment 2026.*
