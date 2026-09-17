/**
 * Particle and Skid Mark Systems
 */

import { Particle, SkidMark } from '../types/game';

export class ParticleSystem {
  public particles: Particle[] = [];
  public skidMarks: SkidMark[] = [];
  private maxSkidMarks: number = 300;
  private maxParticles: number = 220;

  public update(dt: number): void {
    // Update active particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life += dt;
      if (p.life >= p.maxLife) {
        this.particles.splice(i, 1);
        continue;
      }

      p.x += p.vx * dt;
      p.y += p.vy * dt;

      if (p.rotation !== undefined && p.rotSpeed !== undefined) {
        p.rotation += p.rotSpeed * dt;
      }

      // Physics damping depending on type
      if (p.type === 'smoke' || p.type === 'splash') {
        p.vx *= 0.94;
        p.vy *= 0.94;
        p.size += dt * 14; // expand
      } else if (p.type === 'spark') {
        p.vx *= 0.92;
        p.vy *= 0.92;
      } else if (p.type === 'flame') {
        p.size = Math.max(0, p.size - dt * 18);
      }
    }

    // Skid marks slowly fade after time
    if (this.skidMarks.length > this.maxSkidMarks) {
      this.skidMarks.splice(0, this.skidMarks.length - this.maxSkidMarks);
    }
  }

  public addTireSmoke(x: number, y: number, color: string = 'rgba(240, 240, 240, 0.45)'): void {
    if (this.particles.length >= this.maxParticles) return;
    this.particles.push({
      x: x + (Math.random() - 0.5) * 8,
      y: y + (Math.random() - 0.5) * 8,
      vx: (Math.random() - 0.5) * 25,
      vy: (Math.random() - 0.5) * 25,
      life: 0,
      maxLife: 0.4 + Math.random() * 0.25,
      size: 6 + Math.random() * 8,
      color,
      type: 'smoke'
    });
  }

  public addNitroFlames(x: number, y: number, angle: number): void {
    if (this.particles.length >= this.maxParticles) return;
    const spread = (Math.random() - 0.5) * 0.4;
    const speed = 120 + Math.random() * 80;
    const flameAngle = angle + Math.PI + spread;

    const colors = ['#38bdf8', '#06b6d4', '#f59e0b', '#ef4444'];
    const color = colors[Math.floor(Math.random() * colors.length)];

    this.particles.push({
      x: x + (Math.random() - 0.5) * 6,
      y: y + (Math.random() - 0.5) * 6,
      vx: Math.cos(flameAngle) * speed,
      vy: Math.sin(flameAngle) * speed,
      life: 0,
      maxLife: 0.2 + Math.random() * 0.15,
      size: 8 + Math.random() * 6,
      color,
      type: 'flame'
    });
  }

  public addSparks(x: number, y: number, count: number = 8): void {
    for (let i = 0; i < count; i++) {
      if (this.particles.length >= this.maxParticles) break;
      const angle = Math.random() * Math.PI * 2;
      const speed = 80 + Math.random() * 160;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 0,
        maxLife: 0.25 + Math.random() * 0.2,
        size: 3 + Math.random() * 2,
        color: Math.random() > 0.3 ? '#fbbf24' : '#ffffff',
        type: 'spark'
      });
    }
  }

  public addConfetti(x: number, y: number, count: number = 40): void {
    const palette = ['#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#a855f7', '#ec4899'];
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 60 + Math.random() * 220;
      this.particles.push({
        x: x + (Math.random() - 0.5) * 80,
        y: y + (Math.random() - 0.5) * 80,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 50,
        life: 0,
        maxLife: 1.5 + Math.random() * 1.0,
        size: 6 + Math.random() * 5,
        color: palette[Math.floor(Math.random() * palette.length)],
        type: 'confetti',
        rotation: Math.random() * Math.PI * 2,
        rotSpeed: (Math.random() - 0.5) * 8
      });
    }
  }

  public addSkidMark(x1: number, y1: number, x2: number, y2: number, color: string = 'rgba(20, 20, 25, 0.35)'): void {
    this.skidMarks.push({
      x1,
      y1,
      x2,
      y2,
      alpha: 0.35,
      color
    });
  }

  public clear(): void {
    this.particles = [];
    this.skidMarks = [];
  }
}
