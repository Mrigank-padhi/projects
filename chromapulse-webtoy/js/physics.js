/**
 * ChromaPulse Physics & Soft-Body Simulation Engine
 * Handles elastic particle physics, collisions, soft-body spring jelly, and particle effects.
 */

// Math helpers
function dist(x1, y1, x2, y2) {
  return Math.hypot(x2 - x1, y2 - y1);
}

function clamp(val, min, max) {
  return Math.max(min, Math.min(max, val));
}

/**
 * Interactive Elastic Bubble / Particle
 */
class Bubble {
  constructor(x, y, radius = 35, hue = null, vx = 0, vy = 0) {
    this.x = x;
    this.y = y;
    this.radius = radius;
    this.targetRadius = radius;
    this.mass = radius * 0.1;
    this.vx = vx || (Math.random() - 0.5) * 4;
    this.vy = vy || (Math.random() - 0.5) * 4;

    this.hue = hue !== null ? hue : Math.floor(Math.random() * 360);
    this.scaleX = 1.0;
    this.scaleY = 1.0;
    this.squishAngle = 0;

    this.isPopped = false;
    this.isHovered = false;
    this.isDragging = false;
    this.pulsePhase = Math.random() * Math.PI * 2;
    this.shineOffset = Math.random() * 0.3;
  }

  update(width, height, gravityMode, mouse) {
    if (this.isPopped) return;

    // Apply gravity modes
    if (gravityMode === 'earth') {
      this.vy += 0.28;
    } else if (gravityMode === 'inverted') {
      this.vy -= 0.28;
    } else if (gravityMode === 'zero') {
      // Natural gentle cosmic drift
      this.vx += (Math.random() - 0.5) * 0.04;
      this.vy += (Math.random() - 0.5) * 0.04;
    }

    // Cursor interaction (Black hole or Repulsion)
    if (mouse && mouse.active) {
      const d = dist(this.x, this.y, mouse.x, mouse.y);
      if (gravityMode === 'blackhole') {
        if (d > 10 && d < 650) {
          const force = (650 - d) / 650 * 1.6;
          const angle = Math.atan2(mouse.y - this.y, mouse.x - this.x);
          // Swirling spiral orbital force
          const tangent = angle + Math.PI / 2.3;
          this.vx += Math.cos(angle) * force + Math.cos(tangent) * (force * 0.7);
          this.vy += Math.sin(angle) * force + Math.sin(tangent) * (force * 0.7);
        }
      } else if (mouse.tool === 'repel') {
        if (d < 160 && d > 0) {
          const force = (160 - d) / 160 * 1.8;
          const angle = Math.atan2(this.y - mouse.y, this.x - mouse.x);
          this.vx += Math.cos(angle) * force * 5;
          this.vy += Math.sin(angle) * force * 5;
        }
      }
    }

    // Air friction damping
    this.vx *= 0.985;
    this.vy *= 0.985;

    // Cap maximum velocity for stability
    const speed = Math.hypot(this.vx, this.vy);
    const maxSpeed = 22;
    if (speed > maxSpeed) {
      this.vx = (this.vx / speed) * maxSpeed;
      this.vy = (this.vy / speed) * maxSpeed;
    }

    this.x += this.vx;
    this.y += this.vy;

    // Boundary bounce with squish deformation & sound
    const damping = 0.78;
    let bounced = false;

    if (this.x - this.radius < 0) {
      this.x = this.radius;
      this.vx = -this.vx * damping;
      this.squish(0.65, 1.35, 0);
      bounced = true;
    } else if (this.x + this.radius > width) {
      this.x = width - this.radius;
      this.vx = -this.vx * damping;
      this.squish(0.65, 1.35, 0);
      bounced = true;
    }

    if (this.y - this.radius < 0) {
      this.y = this.radius;
      this.vy = -this.vy * damping;
      this.squish(1.35, 0.65, 0);
      bounced = true;
    } else if (this.y + this.radius > height) {
      this.y = height - this.radius;
      this.vy = -this.vy * damping;
      this.squish(1.35, 0.65, 0);
      bounced = true;
    }

    if (bounced && speed > 3.0 && window.soundEngine) {
      const now = performance.now();
      if (!window._lastBounceSound || now - window._lastBounceSound > 45) {
        window._lastBounceSound = now;
        window.soundEngine.playBounce(speed, this.radius);
      }
    }

    // Return squish to resting shape (spring recovery)
    this.scaleX += (1.0 - this.scaleX) * 0.12;
    this.scaleY += (1.0 - this.scaleY) * 0.12;
    this.pulsePhase += 0.04;
  }

  squish(sx, sy, angle = 0) {
    this.scaleX = sx;
    this.scaleY = sy;
    this.squishAngle = angle;
  }

  draw(ctx, theme) {
    if (this.isPopped) return;

    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.squishAngle);
    ctx.scale(this.scaleX, this.scaleY);

    const pulse = Math.sin(this.pulsePhase) * 1.5;
    const r = Math.max(5, this.radius + pulse);

    // Glowing radial gradient
    const grad = ctx.createRadialGradient(
      -r * 0.3, -r * 0.3, r * 0.1,
      0, 0, r
    );

    if (theme === 'pastel') {
      grad.addColorStop(0, `hsla(${this.hue}, 85%, 85%, 0.85)`);
      grad.addColorStop(0.7, `hsla(${this.hue}, 70%, 70%, 0.5)`);
      grad.addColorStop(1, `hsla(${this.hue}, 75%, 60%, 0.95)`);
    } else if (theme === 'vaporwave') {
      grad.addColorStop(0, `hsla(${this.hue}, 100%, 75%, 0.8)`);
      grad.addColorStop(0.6, `hsla(${(this.hue + 60) % 360}, 90%, 55%, 0.45)`);
      grad.addColorStop(1, `hsla(${(this.hue + 120) % 360}, 100%, 50%, 0.9)`);
    } else { // cyber / cosmic
      grad.addColorStop(0, `hsla(${this.hue}, 100%, 80%, 0.9)`);
      grad.addColorStop(0.6, `hsla(${this.hue}, 95%, 55%, 0.4)`);
      grad.addColorStop(1, `hsla(${this.hue}, 100%, 50%, 0.85)`);
    }

    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.fillStyle = grad;

    // Outer neon glow
    ctx.shadowColor = `hsl(${this.hue}, 100%, 60%)`;
    ctx.shadowBlur = this.isHovered ? 25 : 12;
    ctx.fill();

    // Specular highlight gleam
    ctx.beginPath();
    ctx.ellipse(-r * 0.35, -r * 0.38, r * 0.32, r * 0.18, -Math.PI / 4, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.65)';
    ctx.shadowBlur = 0;
    ctx.fill();

    // Subtle rim ring
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.strokeStyle = `hsla(${this.hue}, 100%, 90%, 0.6)`;
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.restore();
  }
}

/**
 * Sparkle / Shard particle for bubble pop bursts
 */
class Sparkle {
  constructor(x, y, hue) {
    this.x = x;
    this.y = y;
    const angle = Math.random() * Math.PI * 2;
    const speed = 2 + Math.random() * 8;
    this.vx = Math.cos(angle) * speed;
    this.vy = Math.sin(angle) * speed;
    this.radius = 2 + Math.random() * 4;
    this.hue = hue;
    this.alpha = 1.0;
    this.decay = 0.025 + Math.random() * 0.035;
  }

  update() {
    this.x += this.vx;
    this.y += this.vy;
    this.vx *= 0.95;
    this.vy *= 0.95;
    this.vy += 0.1; // gravity
    this.alpha -= this.decay;
  }

  draw(ctx) {
    if (this.alpha <= 0) return;
    ctx.save();
    ctx.globalAlpha = Math.max(0, this.alpha);
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fillStyle = `hsl(${this.hue}, 100%, 70%)`;
    ctx.shadowColor = `hsl(${this.hue}, 100%, 60%)`;
    ctx.shadowBlur = 8;
    ctx.fill();
    ctx.restore();
  }
}

/**
 * Floating Text Popup (+10, COMBO x3, etc.)
 */
class FloatingText {
  constructor(text, x, y, color = '#ffffff') {
    this.text = text;
    this.x = x;
    this.y = y;
    this.vy = -2.2;
    this.alpha = 1.0;
    this.color = color;
    this.scale = 0.6;
    this.targetScale = 1.2;
  }

  update() {
    this.y += this.vy;
    this.vy *= 0.96;
    this.scale += (this.targetScale - this.scale) * 0.18;
    this.alpha -= 0.022;
  }

  draw(ctx) {
    if (this.alpha <= 0) return;
    ctx.save();
    ctx.globalAlpha = Math.max(0, this.alpha);
    ctx.font = `900 ${Math.round(18 * this.scale)}px 'Segoe UI', system-ui, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = this.color;
    ctx.shadowColor = this.color;
    ctx.shadowBlur = 10;
    ctx.fillText(this.text, this.x, this.y);
    ctx.restore();
  }
}

/**
 * Confetti Ribbon Particle for celebrations
 */
class ConfettiParticle {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    const angle = Math.random() * Math.PI * 2;
    const speed = 4 + Math.random() * 12;
    this.vx = Math.cos(angle) * speed;
    this.vy = Math.sin(angle) * speed - 4;
    this.width = 6 + Math.random() * 8;
    this.height = 10 + Math.random() * 10;
    this.rotation = Math.random() * Math.PI * 2;
    this.rotationSpeed = (Math.random() - 0.5) * 0.2;
    this.hue = Math.floor(Math.random() * 360);
    this.alpha = 1.0;
    this.decay = 0.008 + Math.random() * 0.012;
  }

  update() {
    this.x += this.vx;
    this.y += this.vy;
    this.vy += 0.25; // gravity
    this.vx *= 0.98;
    this.rotation += this.rotationSpeed;
    this.alpha -= this.decay;
  }

  draw(ctx) {
    if (this.alpha <= 0) return;
    ctx.save();
    ctx.globalAlpha = Math.max(0, this.alpha);
    ctx.translate(this.x, this.y);
    ctx.rotate(this.rotation);
    ctx.fillStyle = `hsl(${this.hue}, 100%, 60%)`;
    ctx.fillRect(-this.width / 2, -this.height / 2, this.width, this.height);
    ctx.restore();
  }
}

/**
 * Soft-Body Squishy Jelly Creature ("Blobby")
 * Point-mass spring-damper mesh with expressive interactive eyes.
 */
class SoftBodyJelly {
  constructor(cx, cy, radius = 95, numPoints = 20) {
    this.baseRadius = radius;
    this.center = { x: cx, y: cy, vx: 0, vy: 0 };
    this.numPoints = numPoints;
    this.points = [];
    this.springK = 0.045; // Spring stiffness
    this.damping = 0.88;  // Velocity damping
    this.hue = 280;       // Purple/magenta by default
    this.isGrabbed = false;
    this.grabbedIndex = -1;
    this.blinkTimer = 120;
    this.isBlinking = false;
    this.happyTimer = 0;

    // Initialize perimeter vertices
    for (let i = 0; i < numPoints; i++) {
      const angle = (i / numPoints) * Math.PI * 2;
      this.points.push({
        x: cx + Math.cos(angle) * radius,
        y: cy + Math.sin(angle) * radius,
        baseAngle: angle,
        vx: 0,
        vy: 0,
        targetRadius: radius
      });
    }
  }

  update(width, height, mouse) {
    // Center mass dynamics
    this.center.x += this.center.vx;
    this.center.y += this.center.vy;
    this.center.vx *= 0.94;
    this.center.vy *= 0.94;

    // Keep center roughly in bounds
    this.center.x = clamp(this.center.x, this.baseRadius * 1.2, width - this.baseRadius * 1.2);
    this.center.y = clamp(this.center.y, this.baseRadius * 1.2, height - this.baseRadius * 1.2);

    // Update perimeter springs
    for (let i = 0; i < this.numPoints; i++) {
      const p = this.points[i];

      if (this.isGrabbed && this.grabbedIndex === i && mouse) {
        // Dragged by user
        p.x = mouse.x;
        p.y = mouse.y;
        p.vx = (mouse.x - mouse.lastX || 0);
        p.vy = (mouse.y - mouse.lastY || 0);
      } else {
        // Radial spring force to center
        const targetX = this.center.x + Math.cos(p.baseAngle) * p.targetRadius;
        const targetY = this.center.y + Math.sin(p.baseAngle) * p.targetRadius;

        const fx = (targetX - p.x) * this.springK;
        const fy = (targetY - p.y) * this.springK;

        p.vx += fx;
        p.vy += fy;

        // Neighbor spring force (shape retention)
        const prev = this.points[(i - 1 + this.numPoints) % this.numPoints];
        const next = this.points[(i + 1) % this.numPoints];

        const avgX = (prev.x + next.x) * 0.5;
        const avgY = (prev.y + next.y) * 0.5;

        p.vx += (avgX - p.x) * (this.springK * 0.6);
        p.vy += (avgY - p.y) * (this.springK * 0.6);

        // Apply velocity & damping
        p.vx *= this.damping;
        p.vy *= this.damping;
        p.x += p.vx;
        p.y += p.vy;

        // Screen bounds bounce
        if (p.x < 10) { p.x = 10; p.vx *= -0.5; }
        if (p.x > width - 10) { p.x = width - 10; p.vx *= -0.5; }
        if (p.y < 10) { p.y = 10; p.vy *= -0.5; }
        if (p.y > height - 10) { p.y = height - 10; p.vy *= -0.5; }
      }
    }

    // Pull center towards average of points
    let sumX = 0, sumY = 0;
    for (let i = 0; i < this.numPoints; i++) {
      sumX += this.points[i].x;
      sumY += this.points[i].y;
    }
    const avgCenterX = sumX / this.numPoints;
    const avgCenterY = sumY / this.numPoints;
    this.center.x += (avgCenterX - this.center.x) * 0.05;
    this.center.y += (avgCenterY - this.center.y) * 0.05;

    // Blinking logic
    this.blinkTimer--;
    if (this.blinkTimer <= 0) {
      this.isBlinking = true;
      if (this.blinkTimer <= -8) {
        this.isBlinking = false;
        this.blinkTimer = 140 + Math.floor(Math.random() * 100);
      }
    }

    if (this.happyTimer > 0) {
      this.happyTimer--;
    }
  }

  poke(x, y, force = 45) {
    this.happyTimer = 40;
    for (let i = 0; i < this.numPoints; i++) {
      const p = this.points[i];
      const d = dist(x, y, p.x, p.y);
      if (d < 150) {
        const angle = Math.atan2(p.y - y, p.x - x);
        const power = (150 - d) / 150 * force;
        p.vx += Math.cos(angle) * power;
        p.vy += Math.sin(angle) * power;
      }
    }
    if (window.soundEngine) {
      window.soundEngine.playJellySquish(1.4);
    }
  }

  draw(ctx, mouse, theme) {
    if (this.points.length < 3) return;

    ctx.save();

    // Draw Smooth Jelly Body using Bezier curves
    ctx.beginPath();
    const firstMid = {
      x: (this.points[0].x + this.points[this.numPoints - 1].x) * 0.5,
      y: (this.points[0].y + this.points[this.numPoints - 1].y) * 0.5
    };
    ctx.moveTo(firstMid.x, firstMid.y);

    for (let i = 0; i < this.numPoints; i++) {
      const p = this.points[i];
      const next = this.points[(i + 1) % this.numPoints];
      const mid = {
        x: (p.x + next.x) * 0.5,
        y: (p.y + next.y) * 0.5
      };
      ctx.quadraticCurveTo(p.x, p.y, mid.x, mid.y);
    }
    ctx.closePath();

    // Luscious Jelly Gradient
    const jellyGrad = ctx.createRadialGradient(
      this.center.x - this.baseRadius * 0.35,
      this.center.y - this.baseRadius * 0.35,
      this.baseRadius * 0.1,
      this.center.x,
      this.center.y,
      this.baseRadius * 1.3
    );

    if (theme === 'pastel') {
      jellyGrad.addColorStop(0, 'rgba(255, 182, 230, 0.95)');
      jellyGrad.addColorStop(0.6, 'rgba(215, 128, 255, 0.75)');
      jellyGrad.addColorStop(1, 'rgba(148, 85, 240, 0.9)');
    } else if (theme === 'vaporwave') {
      jellyGrad.addColorStop(0, 'rgba(255, 110, 199, 0.95)');
      jellyGrad.addColorStop(0.6, 'rgba(92, 225, 230, 0.75)');
      jellyGrad.addColorStop(1, 'rgba(123, 44, 191, 0.9)');
    } else {
      jellyGrad.addColorStop(0, 'rgba(0, 245, 255, 0.95)');
      jellyGrad.addColorStop(0.5, 'rgba(180, 0, 255, 0.8)');
      jellyGrad.addColorStop(1, 'rgba(255, 0, 128, 0.95)');
    }

    ctx.fillStyle = jellyGrad;
    ctx.shadowColor = 'rgba(215, 60, 255, 0.65)';
    ctx.shadowBlur = 35;
    ctx.fill();

    // Shiny specular highlight curve
    ctx.save();
    ctx.clip();
    ctx.beginPath();
    ctx.ellipse(
      this.center.x - this.baseRadius * 0.3,
      this.center.y - this.baseRadius * 0.45,
      this.baseRadius * 0.5,
      this.baseRadius * 0.22,
      -Math.PI / 6,
      0,
      Math.PI * 2
    );
    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.shadowBlur = 0;
    ctx.fill();
    ctx.restore();

    // Outer neon stroke
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.lineWidth = 3;
    ctx.stroke();

    // Expressive Eyes
    this.drawFace(ctx, mouse);

    ctx.restore();
  }

  drawFace(ctx, mouse) {
    const eyeSpacing = this.baseRadius * 0.42;
    const eyeY = this.center.y - this.baseRadius * 0.12;
    const leftEyeX = this.center.x - eyeSpacing;
    const rightEyeX = this.center.x + eyeSpacing;
    const eyeRadius = this.baseRadius * 0.16;

    // Pupil target direction following mouse
    let dx = 0, dy = 0;
    if (mouse && mouse.active) {
      const angle = Math.atan2(mouse.y - eyeY, mouse.x - this.center.x);
      const lookDist = Math.min(eyeRadius * 0.45, dist(this.center.x, eyeY, mouse.x, mouse.y) * 0.04);
      dx = Math.cos(angle) * lookDist;
      dy = Math.sin(angle) * lookDist;
    }

    // Happy Eyes (^_^) when poked/tickled
    if (this.happyTimer > 0) {
      ctx.lineWidth = 4;
      ctx.strokeStyle = '#ffffff';
      ctx.lineCap = 'round';

      // Left eye arch
      ctx.beginPath();
      ctx.arc(leftEyeX, eyeY, eyeRadius * 0.9, Math.PI * 1.15, Math.PI * 1.85);
      ctx.stroke();

      // Right eye arch
      ctx.beginPath();
      ctx.arc(rightEyeX, eyeY, eyeRadius * 0.9, Math.PI * 1.15, Math.PI * 1.85);
      ctx.stroke();

      // Cute blush cheeks
      ctx.fillStyle = 'rgba(255, 100, 150, 0.65)';
      ctx.beginPath();
      ctx.arc(leftEyeX - 10, eyeY + 14, 8, 0, Math.PI * 2);
      ctx.arc(rightEyeX + 10, eyeY + 14, 8, 0, Math.PI * 2);
      ctx.fill();

      // Happy open smile
      ctx.beginPath();
      ctx.arc(this.center.x, eyeY + 10, 12, 0.2, Math.PI - 0.2);
      ctx.stroke();

    } else if (this.isBlinking) {
      // Blinking closed eye slits
      ctx.lineWidth = 3.5;
      ctx.strokeStyle = '#ffffff';
      ctx.lineCap = 'round';

      ctx.beginPath();
      ctx.moveTo(leftEyeX - eyeRadius, eyeY);
      ctx.lineTo(leftEyeX + eyeRadius, eyeY);
      ctx.moveTo(rightEyeX - eyeRadius, eyeY);
      ctx.lineTo(rightEyeX + eyeRadius, eyeY);
      ctx.stroke();

    } else {
      // Big round anime/kawaii eyes
      [leftEyeX, rightEyeX].forEach((eyeX) => {
        // Eye White
        ctx.beginPath();
        ctx.arc(eyeX, eyeY, eyeRadius, 0, Math.PI * 2);
        ctx.fillStyle = '#ffffff';
        ctx.fill();

        // Dark Pupil
        ctx.beginPath();
        ctx.arc(eyeX + dx, eyeY + dy, eyeRadius * 0.65, 0, Math.PI * 2);
        ctx.fillStyle = '#111827';
        ctx.fill();

        // Big Specular Glint
        ctx.beginPath();
        ctx.arc(eyeX + dx - eyeRadius * 0.22, eyeY + dy - eyeRadius * 0.22, eyeRadius * 0.28, 0, Math.PI * 2);
        ctx.fillStyle = '#ffffff';
        ctx.fill();

        // Small Secondary Glint
        ctx.beginPath();
        ctx.arc(eyeX + dx + eyeRadius * 0.22, eyeY + dy + eyeRadius * 0.22, eyeRadius * 0.12, 0, Math.PI * 2);
        ctx.fillStyle = '#ffffff';
        ctx.fill();
      });

      // Cute Little Mouth
      ctx.lineWidth = 2.5;
      ctx.strokeStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(this.center.x, eyeY + 12, 7, 0.2, Math.PI - 0.2);
      ctx.stroke();
    }
  }
}

// Export classes to window scope
window.Bubble = Bubble;
window.Sparkle = Sparkle;
window.FloatingText = FloatingText;
window.ConfettiParticle = ConfettiParticle;
window.SoftBodyJelly = SoftBodyJelly;
window.dist = dist;
window.clamp = clamp;
