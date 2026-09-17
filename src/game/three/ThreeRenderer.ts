/**
 * High-Performance Three.js 3D Racing Renderer
 * Features:
 * - Dynamic 3D Chase / Hood / Cockpit Cameras with speed FOV warp and corner banking
 * - 3D Split-Screen Viewport Support (Dual 3D camera rendering for local 2-player mabar)
 * - Dynamic 3D Car Synchronizer (wheel spin, front steering, suspension pitch/squat/roll, brake glow)
 * - 3D Weather System (Rain streaks, Night headlights with light cones, Sunset lighting)
 * - 3D Particle System (Tire smoke, sparks, nitro fire jets)
 */

import * as THREE from 'three';
import {
  CameraViewMode,
  CarState,
  Checkpoint,
  Obstacle,
  NitroPickup,
  TrackTheme,
  WeatherType
} from '../../types/game';
import { Car3DBuilder, Car3DInstance } from './Car3DBuilder';
import { Track3DBuilder, Track3DInstance } from './Track3DBuilder';

export class ThreeRenderer {
  public renderer: THREE.WebGLRenderer;
  public scene: THREE.Scene;

  // Player 1 Camera
  public camera1: THREE.PerspectiveCamera;
  public camera1Mode: CameraViewMode = 'chase';

  // Player 2 Camera (Split Screen)
  public camera2: THREE.PerspectiveCamera;
  public camera2Mode: CameraViewMode = 'chase';

  // Lighting
  private sunLight: THREE.DirectionalLight;
  private hemiLight: THREE.HemisphereLight;
  private ambientLight: THREE.AmbientLight;

  // Track & Environment
  private trackInstance: Track3DInstance | null = null;
  private currentTrackTheme: TrackTheme | null = null;

  // Cars Pool
  private carInstances: Map<string, Car3DInstance> = new Map();

  // 3D Weather & Particles
  private rainParticles: THREE.Points | null = null;
  private rainGeo: THREE.BufferGeometry | null = null;
  private tireSmokeParticles: THREE.Group;

  private canvas: HTMLCanvasElement;
  private screenShake1 = 0;
  private screenShake2 = 0;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;

    // Initialize WebGL Renderer
    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      powerPreference: 'high-performance',
      logarithmicDepthBuffer: false
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.setSize(canvas.clientWidth, canvas.clientHeight, false);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.1;

    // Scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x38bdf8); // sky blue default
    this.scene.fog = new THREE.FogExp2(0x93c5fd, 0.0025);

    // Camera 1 (Main Player)
    const aspect = canvas.clientWidth / canvas.clientHeight;
    this.camera1 = new THREE.PerspectiveCamera(62, aspect, 0.3, 1200);
    this.camera1.position.set(0, 8, 18);

    // Camera 2 (Player 2 for Split Screen)
    this.camera2 = new THREE.PerspectiveCamera(62, aspect, 0.3, 1200);
    this.camera2.position.set(0, 8, 18);

    // Main Directional Sun Light
    this.sunLight = new THREE.DirectionalLight(0xffffff, 2.2);
    this.sunLight.position.set(80, 140, 60);
    this.sunLight.castShadow = true;
    this.sunLight.shadow.mapSize.width = 2048;
    this.sunLight.shadow.mapSize.height = 2048;
    this.sunLight.shadow.camera.near = 10;
    this.sunLight.shadow.camera.far = 380;
    this.sunLight.shadow.camera.left = -90;
    this.sunLight.shadow.camera.right = 90;
    this.sunLight.shadow.camera.top = 90;
    this.sunLight.shadow.camera.bottom = -90;
    this.sunLight.shadow.bias = -0.0006;
    this.scene.add(this.sunLight);

    // Hemisphere Ambient Skylight
    this.hemiLight = new THREE.HemisphereLight(0xe0f2fe, 0x1e293b, 1.2);
    this.scene.add(this.hemiLight);

    this.ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    this.scene.add(this.ambientLight);

    // Particle Group
    this.tireSmokeParticles = new THREE.Group();
    this.scene.add(this.tireSmokeParticles);

    this.setupRainEffect();
  }

  public resize(width: number, height: number) {
    this.renderer.setSize(width, height, false);
    const aspect = width / height;
    this.camera1.aspect = aspect;
    this.camera1.updateProjectionMatrix();
    this.camera2.aspect = aspect;
    this.camera2.updateProjectionMatrix();
  }

  public setScreenShake(amount: number, playerIndex: 1 | 2 = 1) {
    if (playerIndex === 1) {
      this.screenShake1 = Math.max(this.screenShake1, amount);
    } else {
      this.screenShake2 = Math.max(this.screenShake2, amount);
    }
  }

  public cycleCameraMode(playerIndex: 1 | 2 = 1): CameraViewMode {
    const modes: CameraViewMode[] = ['chase', 'hood', 'cockpit', 'helicopter'];
    if (playerIndex === 1) {
      const idx = modes.indexOf(this.camera1Mode);
      this.camera1Mode = modes[(idx + 1) % modes.length];
      return this.camera1Mode;
    } else {
      const idx = modes.indexOf(this.camera2Mode);
      this.camera2Mode = modes[(idx + 1) % modes.length];
      return this.camera2Mode;
    }
  }

  /**
   * Load and initialize 3D Track Mesh & Environment
   */
  public loadTrack(theme: TrackTheme, checkpoints: Checkpoint[]) {
    if (this.trackInstance) {
      this.scene.remove(this.trackInstance.root);
    }
    this.currentTrackTheme = theme;
    this.trackInstance = Track3DBuilder.buildTrack(theme, checkpoints);
    this.scene.add(this.trackInstance.root);
  }

  /**
   * Configure 3D Lighting & Atmosphere for Weather
   */
  public applyWeather(weather: WeatherType) {
    if (!this.currentTrackTheme) return;
    const isTokyo = this.currentTrackTheme.id.includes('tokyo');

    if (weather === 'night' || isTokyo) {
      this.scene.background = new THREE.Color(0x050711);
      this.scene.fog = new THREE.FogExp2(0x080b18, 0.0035);
      this.sunLight.intensity = 0.25;
      this.sunLight.color.setHex(0x1e3a8a);
      this.hemiLight.intensity = 0.35;
      this.ambientLight.intensity = 0.3;
      if (this.rainParticles) this.rainParticles.visible = weather === 'rain';
    } else if (weather === 'sunset') {
      this.scene.background = new THREE.Color(0xf97316);
      this.scene.fog = new THREE.FogExp2(0xc2410c, 0.002);
      this.sunLight.intensity = 2.4;
      this.sunLight.color.setHex(0xfb923c);
      this.sunLight.position.set(120, 35, 40);
      this.hemiLight.intensity = 0.9;
      this.ambientLight.intensity = 0.5;
      if (this.rainParticles) this.rainParticles.visible = false;
    } else if (weather === 'rain') {
      this.scene.background = new THREE.Color(0x334155);
      this.scene.fog = new THREE.FogExp2(0x475569, 0.005);
      this.sunLight.intensity = 1.0;
      this.sunLight.color.setHex(0x94a3b8);
      this.hemiLight.intensity = 0.7;
      this.ambientLight.intensity = 0.4;
      if (this.rainParticles) this.rainParticles.visible = true;
    } else {
      // Clear
      this.scene.background = new THREE.Color(0x38bdf8);
      this.scene.fog = new THREE.FogExp2(0x93c5fd, 0.0018);
      this.sunLight.intensity = 2.2;
      this.sunLight.color.setHex(0xffffff);
      this.sunLight.position.set(80, 140, 60);
      this.hemiLight.intensity = 1.2;
      this.ambientLight.intensity = 0.5;
      if (this.rainParticles) this.rainParticles.visible = false;
    }
  }

  /**
   * Synchronize or Instantiate 3D Car Model
   */
  private getOrCreateCar(car: CarState): Car3DInstance {
    let instance = this.carInstances.get(car.id);
    if (!instance) {
      instance = Car3DBuilder.createCar(car.carStats);
      this.scene.add(instance.root);
      this.carInstances.set(car.id, instance);
    }
    return instance;
  }

  /**
   * Main 3D Render Loop
   */
  public render(
    width: number,
    height: number,
    allCars: CarState[],
    player1Car: CarState,
    player2Car: CarState | null,
    obstacles: Obstacle[],
    nitroPickups: NitroPickup[],
    dt: number,
    weather: WeatherType = 'clear',
    isSplitScreen = false
  ) {
    this.applyWeather(weather);

    // 1. Update All 3D Cars
    for (const car of allCars) {
      this.updateCar3D(car, dt, weather);
    }

    // 2. Animate Track Objects (Floating nitro gems, rotating obstacles)
    this.updateTrackObjects(nitroPickups, obstacles, dt);

    // 3. Animate Weather Particles
    if (this.rainParticles && this.rainParticles.visible) {
      this.updateRain(player1Car.x, player1Car.y, dt);
    }

    // 4. Camera & Viewport Rendering
    if (isSplitScreen && player2Car) {
      // Split Screen 3D Mode (Dual Viewports)
      const halfW = Math.floor(width / 2);

      this.renderer.setScissorTest(true);

      // --- PLAYER 1 VIEWPORT (LEFT) ---
      this.renderer.setViewport(0, 0, halfW, height);
      this.renderer.setScissor(0, 0, halfW, height);
      this.camera1.aspect = halfW / height;
      this.camera1.updateProjectionMatrix();
      this.updateCamera(this.camera1, player1Car, this.camera1Mode, this.screenShake1, dt);
      this.renderer.render(this.scene, this.camera1);

      // --- PLAYER 2 VIEWPORT (RIGHT) ---
      this.renderer.setViewport(halfW, 0, width - halfW, height);
      this.renderer.setScissor(halfW, 0, width - halfW, height);
      this.camera2.aspect = (width - halfW) / height;
      this.camera2.updateProjectionMatrix();
      this.updateCamera(this.camera2, player2Car, this.camera2Mode, this.screenShake2, dt);
      this.renderer.render(this.scene, this.camera2);

      this.renderer.setScissorTest(false);
    } else {
      // Single Screen 3D Mode (Full Viewport)
      this.renderer.setViewport(0, 0, width, height);
      this.camera1.aspect = width / height;
      this.camera1.updateProjectionMatrix();
      this.updateCamera(this.camera1, player1Car, this.camera1Mode, this.screenShake1, dt);
      this.renderer.render(this.scene, this.camera1);
    }

    // Decay screen shake
    this.screenShake1 = Math.max(0, this.screenShake1 - dt * 3.5);
    this.screenShake2 = Math.max(0, this.screenShake2 - dt * 3.5);
  }

  /**
   * Synchronize 2D Physics car state into realistic 3D mesh behavior
   */
  private updateCar3D(car: CarState, dt: number, weather: WeatherType) {
    const inst = this.getOrCreateCar(car);

    // 3D Position mapping
    const pos3D = Track3DBuilder.to3D(car.x, car.y, 0);
    inst.root.position.x = pos3D.x;
    inst.root.position.z = pos3D.z;

    // Track surface height elevation
    inst.root.position.y = 0;

    // Yaw Heading: 2D angle (radians) -> Three.js Y-axis rotation
    // Note: In 2D, angle 0 is pointing along +X. In Three.js, +Z is forward or -Z.
    // Convert 2D angle: car.angle is counter-clockwise or clockwise from +X.
    inst.root.rotation.y = -car.angle + Math.PI / 2;

    // Realistic 3D Body Dynamics (Suspension Pitch, Squat & Roll)
    const telemetry = car.telemetry;
    const speed = Math.hypot(car.vx, car.vy);
    const speedRatio = Math.min(1.0, speed / (car.carStats.maxSpeed || 600));

    // Pitch: forward lean on hard braking, squat back on heavy acceleration
    const targetPitch = telemetry ? (telemetry.bodyPitch * 0.45) : (car.speed < 0 ? 0.04 : -0.02);
    // Roll: side tilt on high-G cornering
    const targetRoll = telemetry ? (telemetry.bodyRoll * 0.40) : 0;

    inst.bodyMesh.rotation.x = THREE.MathUtils.lerp(inst.bodyMesh.rotation.x, targetPitch, dt * 8);
    inst.bodyMesh.rotation.z = THREE.MathUtils.lerp(inst.bodyMesh.rotation.z, targetRoll, dt * 8);

    // 4 Wheels: Rotate with speed (rolling forward)
    const rollSpeed = (speed * dt * 0.28);
    inst.wheels.frontLeft.rotation.x += rollSpeed;
    inst.wheels.frontRight.rotation.x += rollSpeed;
    inst.wheels.rearLeft.rotation.x += rollSpeed;
    inst.wheels.rearRight.rotation.x += rollSpeed;

    // Front Wheels: Steer angle
    const steerAngle = THREE.MathUtils.clamp(-car.angularVelocity * 2.2, -0.45, 0.45);
    inst.wheels.frontLeft.rotation.y = steerAngle;
    inst.wheels.frontRight.rotation.y = steerAngle;

    // Brake Discs: Thermal glow on heavy braking
    const brakeHeat = telemetry?.brakeDiscTemp || 20;
    const isBraking = brakeHeat > 180;
    const glowIntensity = Math.min(3.5, Math.max(0, (brakeHeat - 150) / 120));

    for (const disc of inst.brakeDiscs) {
      const mat = disc.material as THREE.MeshStandardMaterial;
      if (isBraking) {
        mat.emissive.setHex(0xf97316);
        mat.emissiveIntensity = glowIntensity;
      } else {
        mat.emissive.setHex(0x000000);
      }
    }

    // Headlights (Turn on automatically at Night, Rain, or Sunset)
    const lightsOn = weather === 'night' || weather === 'rain' || weather === 'sunset' || car.isPlayer;
    for (const spot of inst.headlights) {
      spot.intensity = lightsOn ? (weather === 'night' ? 6.5 : 3.0) : 0;
    }

    // Taillights / Brake lights
    const tailMat = inst.taillightMesh.material as THREE.MeshStandardMaterial;
    if (brakeHeat > 60 || car.speed < 0) {
      tailMat.emissiveIntensity = 4.5;
    } else {
      tailMat.emissiveIntensity = 1.5;
    }

    // 3D Nitro Jet Flame
    if (car.isNitroActive) {
      inst.nitroFlameMesh.visible = true;
      const pulse = 0.8 + Math.random() * 0.4;
      inst.nitroFlameMesh.scale.set(pulse, 1.2 * pulse, pulse);
      (inst.nitroFlameMesh.material as THREE.MeshBasicMaterial).opacity = 0.95;
    } else {
      inst.nitroFlameMesh.visible = false;
    }

    // Exhaust Backfire Point Light on high-RPM overrun
    const isBackfiring = car.throttleInput < 0.1 && (car.telemetry?.rpm || 0) > 6800;
    if (isBackfiring) {
      inst.backfireLight.intensity = 4.0;
    } else {
      inst.backfireLight.intensity = 0;
    }
  }

  /**
   * Smooth dynamic 3D camera controller
   */
  private updateCamera(
    cam: THREE.PerspectiveCamera,
    car: CarState,
    mode: CameraViewMode,
    shake: number,
    dt: number
  ) {
    const pos3D = Track3DBuilder.to3D(car.x, car.y, 0);
    const forward = new THREE.Vector3(
      Math.sin(instToYaw(car.angle)),
      0,
      Math.cos(instToYaw(car.angle))
    ).normalize();

    const speed = Math.hypot(car.vx, car.vy);
    const speedRatio = Math.min(1.0, speed / (car.carStats.maxSpeed || 650));

    // Dynamic Speed FOV Warp (pulls back for high speed sensation)
    const targetFov = car.isNitroActive ? 74 : (60 + speedRatio * 10);
    cam.fov = THREE.MathUtils.lerp(cam.fov, targetFov, dt * 4);

    let shakeOffset = new THREE.Vector3(0, 0, 0);
    if (shake > 0) {
      shakeOffset.set(
        (Math.random() - 0.5) * shake * 1.5,
        (Math.random() - 0.5) * shake * 0.8,
        (Math.random() - 0.5) * shake * 1.5
      );
    }

    switch (mode) {
      case 'hood': {
        // Front Bumper / Hood View
        const hoodPos = pos3D.clone()
          .add(forward.clone().multiplyScalar(1.6))
          .add(new THREE.Vector3(0, 0.9, 0))
          .add(shakeOffset);
        cam.position.lerp(hoodPos, dt * 16);

        const lookAtTarget = pos3D.clone().add(forward.clone().multiplyScalar(30));
        cam.lookAt(lookAtTarget);
        break;
      }

      case 'cockpit': {
        // Driver Eye Point
        const driverPos = pos3D.clone()
          .add(forward.clone().multiplyScalar(-0.2))
          .add(new THREE.Vector3(0, 1.15, 0))
          .add(shakeOffset);
        cam.position.lerp(driverPos, dt * 18);

        const lookAtTarget = pos3D.clone().add(forward.clone().multiplyScalar(25));
        cam.lookAt(lookAtTarget);
        break;
      }

      case 'helicopter': {
        // High Tactical Vantage
        const heliPos = pos3D.clone()
          .add(forward.clone().multiplyScalar(-24))
          .add(new THREE.Vector3(0, 32, 0))
          .add(shakeOffset);
        cam.position.lerp(heliPos, dt * 4);
        cam.lookAt(pos3D.x, 1, pos3D.z);
        break;
      }

      case 'chase':
      default: {
        // Third-Person Dynamic Chase Cam
        const followDistance = 7.5 + speedRatio * 2.8;
        const cameraHeight = 3.4 + speedRatio * 0.6;

        const targetPos = pos3D.clone()
          .sub(forward.clone().multiplyScalar(followDistance))
          .add(new THREE.Vector3(0, cameraHeight, 0))
          .add(shakeOffset);

        // Smooth camera lerp
        cam.position.lerp(targetPos, THREE.MathUtils.clamp(dt * 7.5, 0, 1));

        // Look slightly ahead of car
        const lookTarget = pos3D.clone()
          .add(forward.clone().multiplyScalar(10))
          .add(new THREE.Vector3(0, 1.2, 0));
        cam.lookAt(lookTarget);
        break;
      }
    }
  }

  /**
   * Update Floating Nitro Pads & Obstacles
   */
  private updateTrackObjects(nitroPickups: NitroPickup[], obstacles: Obstacle[], dt: number) {
    if (!this.trackInstance) return;

    // Nitro Crystals: Float bobbing & spin
    for (const nitro of nitroPickups) {
      const obj = this.trackInstance.nitroPadsMap.get(nitro.id);
      if (obj) {
        obj.visible = !nitro.collected;
        if (obj.visible) {
          obj.rotation.y += dt * 2.4;
          obj.position.y = 0.8 + Math.sin(Date.now() * 0.0035 + obj.position.x) * 0.25;
        }
      }
    }

    // Dynamic Traffic Cones: Roll/flip when hit
    for (const obs of obstacles) {
      const obj = this.trackInstance.obstaclesMap.get(obs.id);
      if (obj && obs.type === 'cone' && (obs.vx !== 0 || obs.vy !== 0)) {
        obj.position.x = obs.x * Track3DBuilder.SCALE;
        obj.position.z = obs.y * Track3DBuilder.SCALE;
        if (obs.angle) {
          obj.rotation.y = -obs.angle;
        }
      }
    }
  }

  /**
   * 3D Rain Streaks System
   */
  private setupRainEffect() {
    const rainCount = 1800;
    const vertices: number[] = [];

    for (let i = 0; i < rainCount; i++) {
      vertices.push(
        (Math.random() - 0.5) * 160,
        Math.random() * 45,
        (Math.random() - 0.5) * 160
      );
    }

    this.rainGeo = new THREE.BufferGeometry();
    this.rainGeo.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));

    const rainMat = new THREE.PointsMaterial({
      color: 0x93c5fd,
      size: 0.25,
      transparent: true,
      opacity: 0.65
    });

    this.rainParticles = new THREE.Points(this.rainGeo, rainMat);
    this.rainParticles.visible = false;
    this.scene.add(this.rainParticles);
  }

  private updateRain(carX: number, carY: number, dt: number) {
    if (!this.rainParticles || !this.rainGeo) return;
    const centerPos = Track3DBuilder.to3D(carX, carY, 0);
    this.rainParticles.position.x = centerPos.x;
    this.rainParticles.position.z = centerPos.z;

    const positions = this.rainGeo.attributes.position.array as Float32Array;
    for (let i = 1; i < positions.length; i += 3) {
      positions[i] -= dt * 42;
      if (positions[i] < 0) {
        positions[i] = 40;
      }
    }
    this.rainGeo.attributes.position.needsUpdate = true;
  }

  public dispose() {
    this.renderer.dispose();
  }
}

function instToYaw(angleRad: number): number {
  return -angleRad + Math.PI / 2;
}
