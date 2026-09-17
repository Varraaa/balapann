/**
 * 2D Canvas Renderer for Apex Racer
 * High-performance rendering pipeline with camera tracking, shadows, lighting, weather effects, and Split-Screen support.
 */

import {
  CarState,
  Checkpoint,
  Obstacle,
  NitroPickup,
  Particle,
  SkidMark,
  TrackPoint,
  TrackTheme,
  WeatherType
} from '../types/game';

export class GameRenderer {
  private ctx: CanvasRenderingContext2D;
  public cameraX: number = 0;
  public cameraY: number = 0;
  public cameraZoom: number = 1.0;
  public screenShake: number = 0;

  // Camera for Player 2 (Split-Screen)
  public camera2X: number = 0;
  public camera2Y: number = 0;
  public camera2Zoom: number = 1.0;

  private rainDrops: { x: number; y: number; speed: number; len: number }[] = [];

  constructor(ctx: CanvasRenderingContext2D) {
    this.ctx = ctx;
    for (let i = 0; i < 120; i++) {
      this.rainDrops.push({
        x: Math.random() * 1600,
        y: Math.random() * 1000,
        speed: 18 + Math.random() * 14,
        len: 12 + Math.random() * 12
      });
    }
  }

  public setScreenShake(amount: number) {
    this.screenShake = Math.max(this.screenShake, amount);
  }

  /**
   * Main render call for Single Player / Online
   */
  public render(
    width: number,
    height: number,
    theme: TrackTheme,
    checkpoints: Checkpoint[],
    cars: CarState[],
    playerCar: CarState,
    obstacles: Obstacle[],
    nitroPickups: NitroPickup[],
    particles: Particle[],
    skidMarks: SkidMark[],
    dt: number,
    weather: WeatherType = 'clear'
  ): void {
    const ctx = this.ctx;

    // Smooth camera tracking on player
    const targetZoom = Math.max(0.72, 1.05 - (playerCar.speed / (playerCar.carStats.maxSpeed * 1.6)) * 0.28);
    this.cameraZoom += (targetZoom - this.cameraZoom) * Math.min(1, dt * 4);

    this.cameraX += (playerCar.x - this.cameraX) * Math.min(1, dt * 8);
    this.cameraY += (playerCar.y - this.cameraY) * Math.min(1, dt * 8);

    // Decay screen shake
    let shakeX = 0;
    let shakeY = 0;
    if (this.screenShake > 0) {
      shakeX = (Math.random() - 0.5) * this.screenShake * 16;
      shakeY = (Math.random() - 0.5) * this.screenShake * 16;
      this.screenShake = Math.max(0, this.screenShake - dt * 3.5);
    }

    // Reset transform
    ctx.setTransform(1, 0, 0, 1, 0, 0);

    // 1. Draw World Background Terrain
    this.renderBackground(width, height, theme, this.cameraX, this.cameraY, this.cameraZoom, weather);

    // Apply Camera Transform
    ctx.save();
    ctx.translate(width / 2 + shakeX, height / 2 + shakeY);
    ctx.scale(this.cameraZoom, this.cameraZoom);
    ctx.translate(-this.cameraX, -this.cameraY);

    // 2. Draw Track (Curbs, Road Surface, Markings, Finish Line)
    this.renderTrack(theme, checkpoints, weather);

    // 3. Draw Skid Marks
    this.renderSkidMarks(skidMarks);

    // 4. Draw Nitro Pickups
    this.renderPickups(nitroPickups);

    // 5. Draw Obstacles (Oils, Rocks, Cones)
    this.renderObstacles(obstacles);

    // 6. Draw Cars (Shadows, Bodies, Headlights, Labels)
    this.renderCars(cars, playerCar, weather);

    // 7. Draw Particles (Smoke, Sparks, Nitro Fire, Confetti)
    this.renderParticles(particles);

    // Restore Camera Transform
    ctx.restore();

    // 8. Weather Ambient Overlays (Rain droplets, Night darkness, Sunset warm glow)
    this.renderWeatherOverlay(width, height, weather, dt);
  }

  /**
   * Split-Screen Render (Dual Viewports: Player 1 Left/Top, Player 2 Right/Bottom)
   */
  public renderSplitScreen(
    width: number,
    height: number,
    theme: TrackTheme,
    checkpoints: Checkpoint[],
    cars: CarState[],
    p1Car: CarState,
    p2Car: CarState,
    obstacles: Obstacle[],
    nitroPickups: NitroPickup[],
    particles: Particle[],
    skidMarks: SkidMark[],
    dt: number,
    weather: WeatherType = 'clear'
  ): void {
    const ctx = this.ctx;
    const isVerticalSplit = width >= 768; // Side-by-side on wide screen, top-down on narrow screen

    const w1 = isVerticalSplit ? width / 2 : width;
    const h1 = isVerticalSplit ? height : height / 2;

    // Smooth cameras
    this.cameraX += (p1Car.x - this.cameraX) * Math.min(1, dt * 8);
    this.cameraY += (p1Car.y - this.cameraY) * Math.min(1, dt * 8);
    this.camera2X += (p2Car.x - this.camera2X) * Math.min(1, dt * 8);
    this.camera2Y += (p2Car.y - this.camera2Y) * Math.min(1, dt * 8);

    // --- Viewport 1: Player 1 ---
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, 0, w1, h1);
    ctx.clip();

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    this.renderBackground(w1, h1, theme, this.cameraX, this.cameraY, this.cameraZoom, weather);

    ctx.save();
    ctx.translate(w1 / 2, h1 / 2);
    ctx.scale(this.cameraZoom * 0.9, this.cameraZoom * 0.9);
    ctx.translate(-this.cameraX, -this.cameraY);

    this.renderTrack(theme, checkpoints, weather);
    this.renderSkidMarks(skidMarks);
    this.renderPickups(nitroPickups);
    this.renderObstacles(obstacles);
    this.renderCars(cars, p1Car, weather);
    this.renderParticles(particles);
    ctx.restore();

    this.renderWeatherOverlay(w1, h1, weather, dt);
    ctx.restore();

    // --- Viewport 2: Player 2 ---
    const x2 = isVerticalSplit ? width / 2 : 0;
    const y2 = isVerticalSplit ? 0 : height / 2;

    ctx.save();
    ctx.beginPath();
    ctx.rect(x2, y2, w1, h1);
    ctx.clip();

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.translate(x2, y2);
    this.renderBackground(w1, h1, theme, this.camera2X, this.camera2Y, this.camera2Zoom, weather);

    ctx.save();
    ctx.translate(w1 / 2, h1 / 2);
    ctx.scale(this.camera2Zoom * 0.9, this.camera2Zoom * 0.9);
    ctx.translate(-this.camera2X, -this.camera2Y);

    this.renderTrack(theme, checkpoints, weather);
    this.renderSkidMarks(skidMarks);
    this.renderPickups(nitroPickups);
    this.renderObstacles(obstacles);
    this.renderCars(cars, p2Car, weather);
    this.renderParticles(particles);
    ctx.restore();

    this.renderWeatherOverlay(w1, h1, weather, dt);
    ctx.restore();

    // --- Divider Line between Viewports ---
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.strokeStyle = '#06b6d4';
    ctx.lineWidth = 4;
    ctx.shadowColor = '#06b6d4';
    ctx.shadowBlur = 10;
    ctx.beginPath();
    if (isVerticalSplit) {
      ctx.moveTo(width / 2, 0);
      ctx.lineTo(width / 2, height);
    } else {
      ctx.moveTo(0, height / 2);
      ctx.lineTo(width, height / 2);
    }
    ctx.stroke();

    // Center Badge "P1 ⚡ P2"
    ctx.fillStyle = '#0f172a';
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 2;
    const cx = isVerticalSplit ? width / 2 : width / 2;
    const cy = isVerticalSplit ? 32 : height / 2;
    ctx.beginPath();
    ctx.roundRect(cx - 45, cy - 14, 90, 28, 8);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 12px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('P1 VS P2', cx, cy);
    ctx.restore();
  }

  private renderBackground(
    width: number,
    height: number,
    theme: TrackTheme,
    camX: number,
    camY: number,
    zoom: number,
    weather: WeatherType
  ): void {
    const ctx = this.ctx;
    let bgColor = theme.bgColor;
    if (weather === 'night') {
      bgColor = '#090d16';
    } else if (weather === 'sunset') {
      bgColor = '#3b1c1c';
    } else if (weather === 'rain') {
      bgColor = '#0f172a';
    }

    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, width, height);

    // Subtle pattern or grid moving with camera
    ctx.save();
    ctx.strokeStyle = theme.bgPatternColor;
    ctx.lineWidth = 1;
    ctx.globalAlpha = weather === 'night' ? 0.12 : 0.25;

    const gridSize = 100 * zoom;
    const offsetX = (width / 2 - camX * zoom) % gridSize;
    const offsetY = (height / 2 - camY * zoom) % gridSize;

    ctx.beginPath();
    for (let x = offsetX; x < width; x += gridSize) {
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
    }
    for (let y = offsetY; y < height; y += gridSize) {
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
    }
    ctx.stroke();
    ctx.restore();
  }

  private renderTrack(theme: TrackTheme, checkpoints: Checkpoint[], weather: WeatherType = 'clear'): void {
    const ctx = this.ctx;
    const points = theme.points;
    const n = points.length;
    if (n < 3) return;

    // Helper to trace smooth closed loop path
    const traceSmoothPath = () => {
      ctx.beginPath();
      ctx.moveTo(points[0].x, points[0].y);
      for (let i = 0; i < n; i++) {
        const p0 = points[(i - 1 + n) % n];
        const p1 = points[i];
        const p2 = points[(i + 1) % n];
        const p3 = points[(i + 2) % n];

        // Catmull-Rom or cubic midpoint
        const mid1X = (p1.x + p2.x) / 2;
        const mid1Y = (p1.y + p2.y) / 2;
        ctx.quadraticCurveTo(p1.x, p1.y, mid1X, mid1Y);
      }
      ctx.closePath();
    };

    // 1. Curbs / Kerbs outer border (thick striped look)
    const baseWidth = points[0].width ?? 180;
    const curbWidth = baseWidth + 36;

    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // Primary curb color
    ctx.lineWidth = curbWidth;
    ctx.strokeStyle = theme.curbColor1;
    traceSmoothPath();
    ctx.stroke();

    // Dash pattern for alternating curb color
    ctx.save();
    ctx.lineWidth = curbWidth;
    ctx.strokeStyle = theme.curbColor2;
    ctx.setLineDash([40, 40]);
    traceSmoothPath();
    ctx.stroke();
    ctx.restore();

    // 2. Main Road Surface
    ctx.lineWidth = baseWidth;
    let roadColor = theme.roadColor;
    if (weather === 'rain') roadColor = '#1e293b';
    else if (weather === 'night') roadColor = '#181f2c';
    ctx.strokeStyle = roadColor;
    traceSmoothPath();
    ctx.stroke();

    // Rain wet glossy sheen on asphalt
    if (weather === 'rain') {
      ctx.save();
      ctx.lineWidth = baseWidth - 28;
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
      traceSmoothPath();
      ctx.stroke();
      ctx.restore();
    }

    // 3. Road edge borders
    ctx.save();
    ctx.lineWidth = baseWidth - 10;
    ctx.strokeStyle = roadColor;
    traceSmoothPath();
    ctx.stroke();
    ctx.restore();

    // 4. White Center Dashed Lane Markings
    ctx.save();
    ctx.lineWidth = 4;
    ctx.strokeStyle = '#ffffff';
    ctx.globalAlpha = weather === 'night' ? 0.75 : 0.55;
    ctx.setLineDash([30, 35]);
    traceSmoothPath();
    ctx.stroke();
    ctx.restore();

    // 5. Start / Finish Line
    if (checkpoints.length > 0) {
      const startCp = checkpoints[0];
      const pNext = points[1];
      const angle = Math.atan2(pNext.y - points[0].y, pNext.x - points[0].x);
      const perpAngle = angle + Math.PI / 2;
      const roadW = (points[0].width ?? 180);

      ctx.save();
      ctx.translate(startCp.x, startCp.y);
      ctx.rotate(angle);

      // Checkered finish line
      const rows = 2;
      const cols = 12;
      const squareW = 16;
      const squareH = roadW / cols;

      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          ctx.fillStyle = (r + c) % 2 === 0 ? '#ffffff' : '#0f172a';
          ctx.fillRect(
            (r - 1) * squareW,
            -roadW / 2 + c * squareH,
            squareW,
            squareH
          );
        }
      }

      // Finish banner text on road
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 13px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('FINISH', -squareW * 2, 0);

      ctx.restore();
    }
  }

  private renderSkidMarks(skidMarks: SkidMark[]): void {
    const ctx = this.ctx;
    ctx.save();
    ctx.lineCap = 'round';
    ctx.lineWidth = 5;

    for (const sm of skidMarks) {
      ctx.strokeStyle = sm.color;
      ctx.beginPath();
      ctx.moveTo(sm.x1, sm.y1);
      ctx.lineTo(sm.x2, sm.y2);
      ctx.stroke();
    }
    ctx.restore();
  }

  private renderPickups(nitroPickups: NitroPickup[]): void {
    const ctx = this.ctx;
    const now = Date.now() / 1000;

    for (const pickup of nitroPickups) {
      if (pickup.collected) continue;

      const floatOffset = Math.sin(now * 4 + pickup.x) * 4;
      const py = pickup.y + floatOffset;

      ctx.save();
      ctx.translate(pickup.x, py);

      // Glowing aura
      const auraGrad = ctx.createRadialGradient(0, 0, 4, 0, 0, pickup.radius + 14);
      auraGrad.addColorStop(0, 'rgba(6, 182, 212, 0.7)');
      auraGrad.addColorStop(1, 'rgba(6, 182, 212, 0)');
      ctx.fillStyle = auraGrad;
      ctx.beginPath();
      ctx.arc(0, 0, pickup.radius + 14, 0, Math.PI * 2);
      ctx.fill();

      // Nitro Canister Body
      ctx.fillStyle = '#06b6d4';
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2.5;

      ctx.beginPath();
      ctx.roundRect(-9, -15, 18, 30, 6);
      ctx.fill();
      ctx.stroke();

      // Cap
      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(-6, -18, 12, 4);

      // Nitro text or bolt symbol
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 10px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('N₂O', 0, 0);

      ctx.restore();
    }
  }

  private renderObstacles(obstacles: Obstacle[]): void {
    const ctx = this.ctx;

    for (const obs of obstacles) {
      if (!obs.active) continue;

      ctx.save();
      ctx.translate(obs.x, obs.y);

      if (obs.type === 'oil') {
        // Oil puddle
        ctx.fillStyle = '#18181b';
        ctx.strokeStyle = 'rgba(168, 85, 247, 0.6)'; // purple sheen
        ctx.lineWidth = 3;

        ctx.beginPath();
        // Slightly irregular blob
        const r = obs.radius;
        ctx.moveTo(r, 0);
        ctx.bezierCurveTo(r, r * 0.8, -r * 0.8, r, -r, 0);
        ctx.bezierCurveTo(-r, -r * 0.9, r * 0.7, -r, r, 0);
        ctx.fill();
        ctx.stroke();

        // Oil shine highlight
        ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
        ctx.beginPath();
        ctx.ellipse(-r * 0.2, -r * 0.2, r * 0.4, r * 0.2, Math.PI / 4, 0, Math.PI * 2);
        ctx.fill();
      } else if (obs.type === 'rock') {
        // Rock with 3D facet look
        const r = obs.radius;

        // Shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
        ctx.beginPath();
        ctx.ellipse(3, 4, r + 2, r * 0.8, 0, 0, Math.PI * 2);
        ctx.fill();

        // Stone base
        ctx.fillStyle = '#64748b';
        ctx.beginPath();
        ctx.arc(0, 0, r, 0, Math.PI * 2);
        ctx.fill();

        // Light facet
        ctx.fillStyle = '#94a3b8';
        ctx.beginPath();
        ctx.arc(-r * 0.3, -r * 0.3, r * 0.6, 0, Math.PI * 2);
        ctx.fill();

        // Dark contour
        ctx.strokeStyle = '#334155';
        ctx.lineWidth = 2;
        ctx.stroke();
      } else if (obs.type === 'cone') {
        // Traffic cone (can be knocked over & rotate)
        if (obs.angle !== undefined) {
          ctx.rotate(obs.angle);
        }

        // Shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.beginPath();
        ctx.ellipse(2, 3, obs.radius + 3, obs.radius * 0.8, 0, 0, Math.PI * 2);
        ctx.fill();

        // Base square
        ctx.fillStyle = '#f97316';
        ctx.fillRect(-obs.radius, -obs.radius, obs.radius * 2, obs.radius * 2);

        // Center cone circle
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(0, 0, obs.radius * 0.65, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#ea580c';
        ctx.beginPath();
        ctx.arc(0, 0, obs.radius * 0.4, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
    }
  }

  private renderCars(cars: CarState[], playerCar: CarState, weather: WeatherType = 'clear'): void {
    const ctx = this.ctx;

    for (const car of cars) {
      ctx.save();
      ctx.translate(car.x, car.y);
      ctx.rotate(car.angle);

      // 1. Headlight beam illumination on the road
      const beamIntensity = weather === 'night' ? 0.65 : 0.35;
      const beamGrad = ctx.createRadialGradient(45, 0, 10, 190, 0, 160);
      beamGrad.addColorStop(0, `rgba(255, 255, 225, ${beamIntensity})`);
      beamGrad.addColorStop(1, 'rgba(255, 255, 200, 0)');

      ctx.fillStyle = beamGrad;
      ctx.beginPath();
      ctx.moveTo(18, -12);
      ctx.lineTo(210, -55);
      ctx.lineTo(210, 55);
      ctx.lineTo(18, 12);
      ctx.closePath();
      ctx.fill();

      // 2. Drop Shadow (shifted slightly by body pitch & roll)
      const roll = car.telemetry?.bodyRoll || 0;
      const pitch = car.telemetry?.bodyPitch || 0;
      ctx.fillStyle = 'rgba(0, 0, 0, 0.42)';
      ctx.beginPath();
      ctx.roundRect(-22 + pitch * 4, -13 + roll * 4, 44, 26, 7);
      ctx.fill();

      // 3. Wheels (4 tires)
      const wheelW = 11;
      const wheelH = 6;
      ctx.fillStyle = car.carStats.wheelColor;

      // Front Wheels (steerable angle)
      const steerAngle = car.steerInput * 0.35;
      // Front Left
      ctx.save();
      ctx.translate(13, -13);
      ctx.rotate(steerAngle);
      ctx.fillRect(-wheelW / 2, -wheelH / 2, wheelW, wheelH);
      ctx.restore();

      // Front Right
      ctx.save();
      ctx.translate(13, 13);
      ctx.rotate(steerAngle);
      ctx.fillRect(-wheelW / 2, -wheelH / 2, wheelW, wheelH);
      ctx.restore();

      // Rear Left
      ctx.fillRect(-17, -16, wheelW, wheelH);
      // Rear Right
      ctx.fillRect(-17, 10, wheelW, wheelH);

      // 3b. Glowing Brake Discs / Calipers (Thermal Simulation)
      const brakeHeat = car.telemetry?.brakeDiscTemp || 0;
      if (brakeHeat > 0.18) {
        ctx.save();
        const glowColor = brakeHeat > 0.65 ? 'rgba(254, 240, 138, 0.95)' : 'rgba(249, 115, 22, 0.85)';
        ctx.fillStyle = glowColor;
        ctx.shadowColor = '#f97316';
        ctx.shadowBlur = brakeHeat * 8;
        // Front discs
        ctx.beginPath();
        ctx.arc(13, -13, 3.5, 0, Math.PI * 2);
        ctx.arc(13, 13, 3.5, 0, Math.PI * 2);
        // Rear discs
        ctx.arc(-17, -13, 3.5, 0, Math.PI * 2);
        ctx.arc(-17, 13, 3.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // 4. Car Chassis Body with Dynamic Weight Transfer (Pitch & Roll offsets)
      ctx.save();
      ctx.translate(-pitch * 14, -roll * 12);
      ctx.rotate(-roll * 0.4);

      ctx.fillStyle = car.carStats.bodyColor;
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 2;

      ctx.beginPath();
      // Aerodynamic top-down sports car silhouette
      ctx.roundRect(-20, -12, 40, 24, 6);
      ctx.fill();
      ctx.stroke();

      // Racing Stripes / Accent Color
      ctx.fillStyle = car.carStats.accentColor;
      ctx.fillRect(-18, -3, 36, 6);

      // Windshield & Cabin Glass
      ctx.fillStyle = car.carStats.glassColor;
      ctx.beginPath();
      ctx.roundRect(-4, -8, 16, 16, 4);
      ctx.fill();

      // Rear Spoiler / Wing
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(-22, -11, 4, 22);

      // Headlights
      ctx.fillStyle = '#fef08a';
      ctx.fillRect(18, -10, 3, 5);
      ctx.fillRect(18, 5, 3, 5);

      // Taillights (glow red if braking)
      const isBraking = car.brakeInput > 0.1;
      ctx.fillStyle = isBraking ? '#ff0000' : '#b91c1c';
      ctx.fillRect(-21, -9, 2, 4);
      ctx.fillRect(-21, 5, 2, 4);

      if (isBraking) {
        // Red brake glow aura
        ctx.fillStyle = 'rgba(239, 68, 68, 0.4)';
        ctx.beginPath();
        ctx.arc(-22, -7, 6, 0, Math.PI * 2);
        ctx.arc(-22, 7, 6, 0, Math.PI * 2);
        ctx.fill();
      }

      // Exhaust Backfire Flames (Spits fire at high RPM or deceleration)
      const rpm = car.telemetry?.rpm || 1000;
      const isBackfiring = (rpm > 6000 && car.throttleInput < 0.2) || car.isNitroActive;
      if (isBackfiring && Math.random() < 0.45) {
        ctx.fillStyle = '#f59e0b';
        ctx.beginPath();
        ctx.arc(-24, -8, 3.5, 0, Math.PI * 2);
        ctx.arc(-24, 6, 3.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#38bdf8'; // blue core
        ctx.beginPath();
        ctx.arc(-23, -8, 2, 0, Math.PI * 2);
        ctx.arc(-23, 6, 2, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore(); // restore chassis body transform
      ctx.restore(); // restore car transform

      // 5. Name and Indicator Tag above car
      ctx.save();
      ctx.translate(car.x, car.y - 30);
      ctx.font = 'bold 11px sans-serif';
      ctx.textAlign = 'center';

      if (car.playerIndex === 1) {
        // Player 1 badge (Split Screen)
        ctx.fillStyle = '#0284c7';
        ctx.beginPath();
        ctx.roundRect(-28, -14, 56, 16, 4);
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.fillText('P1: KAMU', 0, -2);
      } else if (car.playerIndex === 2) {
        // Player 2 badge (Split Screen)
        ctx.fillStyle = '#ea580c';
        ctx.beginPath();
        ctx.roundRect(-30, -14, 60, 16, 4);
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.fillText('P2: TEMAN', 0, -2);
      } else if (car.isPlayer) {
        // Solo Player badge
        ctx.fillStyle = '#2563eb';
        ctx.beginPath();
        ctx.roundRect(-22, -14, 44, 16, 4);
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.fillText('KAMU', 0, -2);
      } else {
        // AI or Online Opponent tag
        ctx.fillStyle = 'rgba(15, 23, 42, 0.8)';
        const label = `${car.rank > 0 ? `#${car.rank} ` : ''}${car.name}`;
        const metrics = ctx.measureText(label);
        ctx.beginPath();
        ctx.roundRect(-metrics.width / 2 - 6, -13, metrics.width + 12, 15, 4);
        ctx.fill();

        ctx.fillStyle = '#f8fafc';
        ctx.fillText(label, 0, -2);
      }
      ctx.restore();
    }
  }

  /**
   * Environmental Shaders & Overlays (Rain, Night, Sunset)
   */
  private renderWeatherOverlay(
    width: number,
    height: number,
    weather: WeatherType,
    dt: number
  ): void {
    const ctx = this.ctx;

    if (weather === 'night') {
      // Dark atmospheric vignette
      ctx.save();
      ctx.fillStyle = 'rgba(5, 8, 16, 0.45)';
      ctx.fillRect(0, 0, width, height);

      const vignette = ctx.createRadialGradient(
        width / 2,
        height / 2,
        width * 0.3,
        width / 2,
        height / 2,
        width * 0.75
      );
      vignette.addColorStop(0, 'rgba(0, 0, 0, 0)');
      vignette.addColorStop(1, 'rgba(3, 7, 18, 0.65)');
      ctx.fillStyle = vignette;
      ctx.fillRect(0, 0, width, height);
      ctx.restore();
    } else if (weather === 'sunset') {
      // Warm golden hour ambient tint
      ctx.save();
      ctx.fillStyle = 'rgba(249, 115, 22, 0.12)';
      ctx.fillRect(0, 0, width, height);
      ctx.restore();
    } else if (weather === 'rain') {
      // Rainy mist and moving raindrops
      ctx.save();
      ctx.fillStyle = 'rgba(15, 23, 42, 0.2)';
      ctx.fillRect(0, 0, width, height);

      ctx.strokeStyle = 'rgba(186, 230, 253, 0.6)';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      for (const drop of this.rainDrops) {
        drop.y += drop.speed;
        drop.x -= drop.speed * 0.35; // diagonal wind
        if (drop.y > height) {
          drop.y = -20;
          drop.x = Math.random() * (width + 200);
        }
        ctx.moveTo(drop.x, drop.y);
        ctx.lineTo(drop.x - drop.len * 0.35, drop.y + drop.len);
      }
      ctx.stroke();
      ctx.restore();
    }
  }

  private renderParticles(particles: Particle[]): void {
    const ctx = this.ctx;

    for (const p of particles) {
      const alpha = Math.max(0, 1 - p.life / p.maxLife);
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.translate(p.x, p.y);

      if (p.rotation !== undefined) {
        ctx.rotate(p.rotation);
      }

      ctx.fillStyle = p.color;

      if (p.type === 'confetti') {
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
      } else if (p.type === 'spark') {
        ctx.beginPath();
        ctx.arc(0, 0, p.size, 0, Math.PI * 2);
        ctx.fill();
      } else {
        // Smoke or flame circle
        ctx.beginPath();
        ctx.arc(0, 0, p.size, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
    }
  }
}
