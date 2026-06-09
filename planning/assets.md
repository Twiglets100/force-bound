# Procedural Assets & Audio

ForceBound leverages dynamic in-browser generation for visuals and audio. This avoids external dependencies and makes deployment completely lightweight.

## 1. Visual Aesthetics & Theme (CSS)

The game uses a **Retro-Futuristic Science Terminal** theme.

### Color Tokens (HSL)
- **Background**: `hsl(230, 25%, 7%)` (Deep Space Dark Blue)
- **Glass Panel**: `hsla(230, 25%, 12%, 0.7)` with `backdrop-filter: blur(10px)`
- **Gravity (Purple)**: `hsl(271, 76%, 53%)`
- **Electromagnetism (Cyan)**: `hsl(180, 100%, 50%)`
- **Entropy (Green)**: `hsl(110, 100%, 54%)`
- **Resonance (Pink)**: `hsl(330, 100%, 50%)`

### CSS Scanline & Glow Effects
We apply a CRT scanline overlay and flickering animation to give a hardware terminal appearance:
```css
.crt-overlay {
  position: absolute;
  top: 0; left: 0; width: 100%; height: 100%;
  background: linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.25) 50%), linear-gradient(90deg, rgba(255, 0, 0, 0.06), rgba(0, 255, 0, 0.02), rgba(0, 0, 255, 0.06));
  background-size: 100% 4px, 6px 100%;
  pointer-events: none;
  z-index: 999;
}
.glow-text {
  text-shadow: 0 0 10px currentColor, 0 0 20px currentColor;
}
```

---

## 2. Procedural SVG Creature Assets

Rather than loading PNGs, we draw Forces on-the-fly inside `<svg>` elements. This allows us to animate them dynamically with CSS and JS.

### Vector Designs

1. **Graviton (Gravity)**
   - Visual: Concentric orbital rings spinning around a central black vortex.
   - SVG Blueprint:
     ```xml
     <svg viewBox="0 0 100 100">
       <defs>
         <radialGradient id="vortexGrad" cx="50%" cy="50%" r="50%">
           <stop offset="0%" stop-color="#000" />
           <stop offset="70%" stop-color="#8a2be2" stop-opacity="0.8" />
           <stop offset="100%" stop-color="#000" stop-opacity="0" />
         </radialGradient>
       </defs>
       <!-- Rotating Rings -->
       <circle cx="50" cy="50" r="35" stroke="#8a2be2" stroke-width="1.5" fill="none" stroke-dasharray="10 5" class="spin-clockwise" />
       <circle cx="50" cy="50" r="22" stroke="#d580ff" stroke-width="1" fill="none" stroke-dasharray="5 15" class="spin-counter" />
       <!-- Gravitational Core -->
       <circle cx="50" cy="50" r="12" fill="url(#vortexGrad)" class="pulse" />
     </svg>
     ```

2. **Electron (Electromagnetism)**
   - Visual: A sparking central lightning nucleus surrounded by rapid orbiting nodes.
   - SVG Blueprint:
     ```xml
     <svg viewBox="0 0 100 100">
       <!-- Jagged path for static charge -->
       <path d="M50 20 L45 45 L55 45 L48 60 L58 55 L50 80" stroke="#00f2ff" stroke-width="3" fill="none" stroke-linecap="round" class="sparkle" />
       <!-- Moving orbital nodes -->
       <ellipse cx="50" cy="50" rx="40" ry="10" stroke="#00f2ff" stroke-width="0.5" fill="none" transform="rotate(30 50 50)" />
       <ellipse cx="50" cy="50" rx="40" ry="10" stroke="#00f2ff" stroke-width="0.5" fill="none" transform="rotate(-30 50 50)" />
       <circle cx="50" cy="50" r="4" fill="#ffd700" class="orbit-node-1" />
     </svg>
     ```

3. **Entropist (Entropy)**
   - Visual: A cloud of decaying, green geometric fragments drifting apart.
   - SVG Blueprint:
     ```xml
     <svg viewBox="0 0 100 100">
       <!-- Particle cluster with random animations -->
       <polygon points="50,30 55,45 40,40" fill="#39ff14" opacity="0.8" class="drift-1" />
       <polygon points="30,50 45,55 35,65" fill="#32cd32" opacity="0.6" class="drift-2" />
       <polygon points="70,45 65,60 75,55" fill="#228b22" opacity="0.7" class="drift-3" />
     </svg>
     ```

---

## 3. Synthesized Sound Effects (Web Audio API)

We instantiate a global `AudioManager` which initializes the `AudioContext` on user interaction.

```javascript
class AudioManager {
  constructor() {
    this.ctx = null;
  }
  init() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    }
  }
  
  playClick() {
    this.init();
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(600, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(800, this.ctx.currentTime + 0.05);
    
    gain.gain.setValueAtTime(0.1, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.05);
    
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    
    osc.start();
    osc.stop(this.ctx.currentTime + 0.05);
  }
  
  playLaserSiphon(duration = 0.5) {
    this.init();
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(200, this.ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(1200, this.ctx.currentTime + duration);
    
    gain.gain.setValueAtTime(0.08, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);
    
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    
    osc.start();
    osc.stop(this.ctx.currentTime + duration);
  }
}
```
*We will implement similar logic for hits, level ups, and encounters.*
