/**
 * Core Game Canvas Controller & Racing Loop
 * Supports Single Player, Split-Screen (2 Players on 1 Screen), and Online P2P Multiplayer
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  CarState,
  CarStats,
  Checkpoint,
  GameMode,
  GameSettings,
  Obstacle,
  NitroPickup,
  TrackTheme,
  WeatherType
} from '../types/game';
import { AVAILABLE_CARS, generateTrackCheckpoints } from '../game/tracks';
import { PhysicsEngine, CollisionEvent } from '../game/physics';
import { AIController } from '../game/ai';
import { ParticleSystem } from '../game/particles';
import { GameRenderer } from '../game/renderer';
import { soundEngine } from '../audio/soundEngine';
import { multiplayerManager } from '../game/multiplayer';
import { HUD } from './HUD';
import { TouchControls } from './TouchControls';
import { RaceFinishModal } from './RaceFinishModal';

interface GameCanvasProps {
  selectedCar: CarStats;
  selectedTrack: TrackTheme;
  settings: GameSettings;
  gameMode?: GameMode;
  player2CarStats?: CarStats;
  weather?: WeatherType;
  roomCode?: string;
  onFinishRace: (bestLap: number, totalTime: number, rank: number) => void;
  onQuitToMenu: () => void;
  onChangeTrack: () => void;
}

export const GameCanvas: React.FC<GameCanvasProps> = ({
  selectedCar,
  selectedTrack,
  settings,
  gameMode = 'single_player',
  player2CarStats,
  weather = 'clear',
  roomCode,
  onFinishRace,
  onQuitToMenu,
  onChangeTrack
}) => {
  const activeWeather: WeatherType = (weather as WeatherType) || 'clear';
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Gameplay state
  const [countdown, setCountdown] = useState<number>(3);
  const [isFinished, setIsFinished] = useState<boolean>(false);
  const [soundActive, setSoundActive] = useState<boolean>(settings.soundEnabled);

  // Keep live references for the 60fps loop to avoid React re-render lag
  const stateRef = useRef<{
    playerCar: CarState;
    player2Car: CarState | null;
    aiCars: CarState[];
    checkpoints: Checkpoint[];
    obstacles: Obstacle[];
    nitroPickups: NitroPickup[];
    particleSystem: ParticleSystem;
    renderer: GameRenderer | null;
    keys: Record<string, boolean>;
    touchInputs: {
      steer: number;
      throttle: number;
      brake: number;
      drift: boolean;
      nitro: boolean;
    };
    raceStarted: boolean;
    countdownValue: number;
    lastTime: number;
    animationFrameId: number | null;
    networkSyncTimer: number;
  }>({
    playerCar: null as unknown as CarState,
    player2Car: null,
    aiCars: [],
    checkpoints: [],
    obstacles: [],
    nitroPickups: [],
    particleSystem: new ParticleSystem(),
    renderer: null,
    keys: {},
    touchInputs: { steer: 0, throttle: 0, brake: 0, drift: false, nitro: false },
    raceStarted: false,
    countdownValue: 3,
    lastTime: performance.now(),
    animationFrameId: null,
    networkSyncTimer: 0
  });

  // State exposed to React UI (HUD)
  const [hudPlayerCar, setHudPlayerCar] = useState<CarState | null>(null);
  const [hudPlayer2Car, setHudPlayer2Car] = useState<CarState | null>(null);
  const [hudAllCars, setHudAllCars] = useState<CarState[]>([]);

  const isSplitScreen = gameMode === 'split_screen' || gameMode === 'splitscreen';
  const isOnline = gameMode === 'online_multiplayer' || gameMode === 'online';

  // Initialize Race & Cars
  const initRace = useCallback(() => {
    const theme = selectedTrack;
    const cps = generateTrackCheckpoints(theme.points);
    const startCp = cps[0];
    const trackAngle = startCp.angle;

    // Build Obstacles clone
    const obstaclesClone: Obstacle[] = theme.obstacles.map((obs) => ({ ...obs }));
    const nitroClone: NitroPickup[] = theme.nitroPickups.map((np) => ({ ...np }));

    // Start positions staggered in grid
    const spawnOffsets = [
      { forward: 40, lateral: -28 }, // P1 (Pole position)
      { forward: -25, lateral: 28 },  // P2 or AI 1
      { forward: -90, lateral: -28 }, // AI 2
      { forward: -155, lateral: 28 }  // AI 3
    ];

    const cosA = Math.cos(trackAngle);
    const sinA = Math.sin(trackAngle);
    const perpX = -sinA;
    const perpY = cosA;

    // 1. Create Player 1 Car
    const playerSpawn = spawnOffsets[0];
    const playerX = startCp.x + cosA * playerSpawn.forward + perpX * playerSpawn.lateral;
    const playerY = startCp.y + sinA * playerSpawn.forward + perpY * playerSpawn.lateral;

    const playerCar: CarState = {
      id: 'player_1',
      isPlayer: true,
      playerIndex: isSplitScreen ? 1 : undefined,
      name: isSplitScreen ? 'Pemain 1' : 'Kamu',
      carStats: selectedCar,
      x: playerX,
      y: playerY,
      vx: 0,
      vy: 0,
      angle: trackAngle,
      angularVelocity: 0,
      speed: 0,
      steerInput: 0,
      throttleInput: 0,
      brakeInput: 0,
      isDrifting: false,
      isNitroActive: false,
      nitroRemaining: 60,
      nitroCapacity: 100,
      spinTimer: 0,
      currentLap: 1,
      nextCheckpointIdx: 1,
      lapTimes: [],
      currentLapTime: 0,
      totalRaceTime: 0,
      finished: false,
      rank: 1,
      wrongWay: false,
      offroad: false,
      stuckTimer: 0,
      targetWaypointIdx: 1,
      telemetry: PhysicsEngine.initTelemetry()
    };

    // 2. Create Player 2 Car if in Split-Screen mode
    let p2Car: CarState | null = null;
    if (isSplitScreen) {
      const p2Spawn = spawnOffsets[1];
      const p2X = startCp.x + cosA * p2Spawn.forward + perpX * p2Spawn.lateral;
      const p2Y = startCp.y + sinA * p2Spawn.forward + perpY * p2Spawn.lateral;
      const p2Stats = player2CarStats || AVAILABLE_CARS[1];

      p2Car = {
        id: 'player_2',
        isPlayer: true,
        playerIndex: 2,
        name: 'Pemain 2',
        carStats: p2Stats,
        x: p2X,
        y: p2Y,
        vx: 0,
        vy: 0,
        angle: trackAngle,
        angularVelocity: 0,
        speed: 0,
        steerInput: 0,
        throttleInput: 0,
        brakeInput: 0,
        isDrifting: false,
        isNitroActive: false,
        nitroRemaining: 60,
        nitroCapacity: 100,
        spinTimer: 0,
        currentLap: 1,
        nextCheckpointIdx: 1,
        lapTimes: [],
        currentLapTime: 0,
        totalRaceTime: 0,
        finished: false,
        rank: 2,
        wrongWay: false,
        offroad: false,
        stuckTimer: 0,
        targetWaypointIdx: 1,
        telemetry: PhysicsEngine.initTelemetry()
      };
    }

    // 3. Create AI Competitor Cars
    const otherCarsPool = AVAILABLE_CARS.filter(
      (c) => c.id !== selectedCar.id && (!p2Car || c.id !== p2Car.carStats.id)
    );
    const aiCars: CarState[] = [];
    const aiNames = ['Apex Razor', 'Viper Blitz', 'Sonic Bolt', 'Shadow Drift'];

    // In split-screen we only spawn 2 AI cars, in single player we spawn 3
    const aiCount = isSplitScreen ? 2 : isOnline ? 0 : 3;
    const startIndex = isSplitScreen ? 2 : 1;

    for (let i = 0; i < aiCount; i++) {
      const carStat = otherCarsPool[i % otherCarsPool.length];
      const spawn = spawnOffsets[startIndex + i] || { forward: -180, lateral: 0 };
      const aiX = startCp.x + cosA * spawn.forward + perpX * spawn.lateral;
      const aiY = startCp.y + sinA * spawn.forward + perpY * spawn.lateral;

      aiCars.push({
        id: `ai_${i + 1}`,
        isPlayer: false,
        name: aiNames[i] || `AI Driver ${i + 1}`,
        carStats: carStat,
        x: aiX,
        y: aiY,
        vx: 0,
        vy: 0,
        angle: trackAngle,
        angularVelocity: 0,
        speed: 0,
        steerInput: 0,
        throttleInput: 0,
        brakeInput: 0,
        isDrifting: false,
        isNitroActive: false,
        nitroRemaining: 60,
        nitroCapacity: 100,
        spinTimer: 0,
        currentLap: 1,
        nextCheckpointIdx: 1,
        lapTimes: [],
        currentLapTime: 0,
        totalRaceTime: 0,
        finished: false,
        rank: i + 3,
        wrongWay: false,
        offroad: false,
        stuckTimer: 0,
        targetWaypointIdx: 1,
        telemetry: PhysicsEngine.initTelemetry()
      });
    }

    stateRef.current.playerCar = playerCar;
    stateRef.current.player2Car = p2Car;
    stateRef.current.aiCars = aiCars;
    stateRef.current.checkpoints = cps;
    stateRef.current.obstacles = obstaclesClone;
    stateRef.current.nitroPickups = nitroClone;
    stateRef.current.particleSystem.clear();
    stateRef.current.raceStarted = false;
    stateRef.current.countdownValue = 3;
    stateRef.current.lastTime = performance.now();
    stateRef.current.networkSyncTimer = 0;

    setCountdown(3);
    setIsFinished(false);
    setHudPlayerCar({ ...playerCar });
    setHudPlayer2Car(p2Car ? { ...p2Car } : null);
    setHudAllCars(p2Car ? [playerCar, p2Car, ...aiCars] : [playerCar, ...aiCars]);

    soundEngine.init();
    soundEngine.setSoundEnabled(settings.soundEnabled);
    soundEngine.setMusicEnabled(settings.musicEnabled);
  }, [selectedCar, selectedTrack, settings, isSplitScreen, isOnline, player2CarStats]);

  // Reset player car back to nearest checkpoint if stuck
  const handleResetCar = useCallback(() => {
    const s = stateRef.current;
    if (!s.playerCar) return;

    const cps = s.checkpoints;
    const targetCp = cps[(s.playerCar.nextCheckpointIdx - 1 + cps.length) % cps.length];
    s.playerCar.x = targetCp.x;
    s.playerCar.y = targetCp.y;
    s.playerCar.angle = targetCp.angle;
    s.playerCar.vx = 0;
    s.playerCar.vy = 0;
    s.playerCar.speed = 0;
    s.playerCar.spinTimer = 0;
    s.particleSystem.addSparks(targetCp.x, targetCp.y, 14);
  }, []);

  // Keyboard Input Handlers
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      stateRef.current.keys[e.code] = true;

      if (e.code === 'KeyR') {
        handleResetCar();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      stateRef.current.keys[e.code] = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [handleResetCar]);

  // Connect online multiplayer callbacks
  useEffect(() => {
    if (!isOnline) return;

    multiplayerManager.setCallbacks({
      onRemoteCarUpdate: (packet) => {
        const s = stateRef.current;
        // Find existing remote car or create one
        let remote = s.aiCars.find((c) => c.id === packet.id);
        if (!remote) {
          const matchedStats = AVAILABLE_CARS[s.aiCars.length % AVAILABLE_CARS.length];
          remote = {
            id: packet.id,
            isPlayer: false,
            name: 'Teman Online',
            carStats: matchedStats,
            x: packet.x,
            y: packet.y,
            vx: packet.vx,
            vy: packet.vy,
            angle: packet.angle,
            angularVelocity: 0,
            speed: packet.speed,
            steerInput: packet.steerInput,
            throttleInput: packet.throttleInput,
            brakeInput: packet.brakeInput,
            isDrifting: packet.isDrifting,
            isNitroActive: packet.isNitroActive,
            nitroRemaining: packet.nitroRemaining,
            nitroCapacity: 100,
            spinTimer: 0,
            currentLap: packet.currentLap,
            nextCheckpointIdx: packet.nextCheckpointIdx,
            lapTimes: [],
            currentLapTime: packet.currentLapTime,
            totalRaceTime: packet.totalRaceTime,
            finished: packet.finished,
            rank: 2,
            wrongWay: false,
            offroad: false,
            stuckTimer: 0,
            targetWaypointIdx: 1,
            telemetry: packet.telemetry || PhysicsEngine.initTelemetry()
          };
          s.aiCars.push(remote);
        } else {
          // Smooth remote interpolation
          remote.x = remote.x * 0.4 + packet.x * 0.6;
          remote.y = remote.y * 0.4 + packet.y * 0.6;
          remote.vx = packet.vx;
          remote.vy = packet.vy;
          remote.angle = packet.angle;
          remote.speed = packet.speed;
          remote.steerInput = packet.steerInput;
          remote.throttleInput = packet.throttleInput;
          remote.brakeInput = packet.brakeInput;
          remote.isDrifting = packet.isDrifting;
          remote.isNitroActive = packet.isNitroActive;
          remote.nitroRemaining = packet.nitroRemaining;
          remote.currentLap = packet.currentLap;
          remote.nextCheckpointIdx = packet.nextCheckpointIdx;
          remote.currentLapTime = packet.currentLapTime;
          remote.totalRaceTime = packet.totalRaceTime;
          remote.finished = packet.finished;
          if (packet.telemetry) {
            remote.telemetry = packet.telemetry;
          }
        }
      }
    });
  }, [isOnline]);

  // Start countdown timer sequence
  useEffect(() => {
    initRace();

    const timer1 = setTimeout(() => {
      soundEngine.playCountdown('3');
      setCountdown(3);
      stateRef.current.countdownValue = 3;
    }, 400);

    const timer2 = setTimeout(() => {
      soundEngine.playCountdown('2');
      setCountdown(2);
      stateRef.current.countdownValue = 2;
    }, 1400);

    const timer3 = setTimeout(() => {
      soundEngine.playCountdown('1');
      setCountdown(1);
      stateRef.current.countdownValue = 1;
    }, 2400);

    const timer4 = setTimeout(() => {
      soundEngine.playCountdown('go');
      setCountdown(0);
      stateRef.current.countdownValue = 0;
      stateRef.current.raceStarted = true;
      if (settings.musicEnabled) {
        soundEngine.startBGM();
      }
    }, 3400);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      clearTimeout(timer4);
      soundEngine.stopEngine();
    };
  }, [initRace, settings.musicEnabled]);

  // Main 60FPS Game Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const renderer = new GameRenderer(ctx);
    stateRef.current.renderer = renderer;

    let hudSyncCounter = 0;

    const collisionCallback = (ev: CollisionEvent) => {
      soundEngine.playCrash(ev.intensity);
      renderer.setScreenShake(ev.intensity * 0.8);
      stateRef.current.particleSystem.addSparks(ev.x, ev.y, Math.round(ev.intensity * 12));
    };

    const loop = (currentTime: number) => {
      const dt = Math.min(0.06, (currentTime - stateRef.current.lastTime) / 1000);
      stateRef.current.lastTime = currentTime;

      const s = stateRef.current;
      const {
        playerCar,
        player2Car,
        aiCars,
        checkpoints,
        obstacles,
        nitroPickups,
        particleSystem,
        keys,
        touchInputs
      } = s;

      if (!playerCar) {
        s.animationFrameId = requestAnimationFrame(loop);
        return;
      }

      // 1. Process Player 1 Inputs (WASD + Space + Left Shift, or Touch)
      let p1Steer = touchInputs.steer;
      let p1Throttle = touchInputs.throttle;
      let p1Brake = touchInputs.brake;
      let p1Drift = touchInputs.drift;
      let p1Nitro = touchInputs.nitro;

      if (keys['KeyA']) p1Steer = -1;
      if (keys['KeyD']) p1Steer = 1;
      if (keys['KeyW']) p1Throttle = 1;
      if (keys['KeyS']) p1Brake = 1;
      if (keys['Space']) p1Drift = true;
      if (keys['ShiftLeft'] || keys['KeyN']) p1Nitro = true;

      // In single-player, arrow keys also control Player 1 for ease of use
      if (!isSplitScreen) {
        if (keys['ArrowLeft']) p1Steer = -1;
        if (keys['ArrowRight']) p1Steer = 1;
        if (keys['ArrowUp']) p1Throttle = 1;
        if (keys['ArrowDown']) p1Brake = 1;
      }

      // Lock controls until countdown completes
      if (!s.raceStarted) {
        p1Throttle = 0;
        p1Brake = 0;
        p1Steer = 0;
        p1Drift = false;
        p1Nitro = false;
      }

      playerCar.steerInput = p1Steer;
      playerCar.throttleInput = p1Throttle;
      playerCar.brakeInput = p1Brake;
      playerCar.isDrifting = p1Drift;

      if (p1Nitro && playerCar.nitroRemaining > 5 && !playerCar.isNitroActive) {
        playerCar.isNitroActive = true;
        soundEngine.playNitroBoost();
      }

      // 2. Process Player 2 Inputs (Split-Screen: Arrow Keys + Num0 / Slash / Enter)
      if (isSplitScreen && player2Car) {
        let p2Steer = 0;
        let p2Throttle = 0;
        let p2Brake = 0;
        let p2Drift = false;
        let p2Nitro = false;

        if (keys['ArrowLeft']) p2Steer = -1;
        if (keys['ArrowRight']) p2Steer = 1;
        if (keys['ArrowUp']) p2Throttle = 1;
        if (keys['ArrowDown']) p2Brake = 1;
        if (keys['Numpad0'] || keys['Slash'] || keys['Period']) p2Drift = true;
        if (keys['Enter'] || keys['ShiftRight']) p2Nitro = true;

        if (!s.raceStarted) {
          p2Throttle = 0;
          p2Brake = 0;
          p2Steer = 0;
          p2Drift = false;
          p2Nitro = false;
        }

        player2Car.steerInput = p2Steer;
        player2Car.throttleInput = p2Throttle;
        player2Car.brakeInput = p2Brake;
        player2Car.isDrifting = p2Drift;

        if (p2Nitro && player2Car.nitroRemaining > 5 && !player2Car.isNitroActive) {
          player2Car.isNitroActive = true;
          soundEngine.playNitroBoost();
        }
      }

      // 3. Update AI Competitors
      for (const ai of aiCars) {
        AIController.updateAI(
          ai,
          dt,
          checkpoints,
          selectedTrack.points,
          obstacles,
          player2Car ? [playerCar, player2Car, ...aiCars] : [playerCar, ...aiCars],
          settings.difficulty
        );
      }

      // 4. Physics & Track Collisions for all vehicles
      const allCars = player2Car ? [playerCar, player2Car, ...aiCars] : [playerCar, ...aiCars];

      for (const car of allCars) {
        const trackCheck = PhysicsEngine.checkOnTrack(car.x, car.y, selectedTrack.points);
        PhysicsEngine.updateCar(
          car,
          dt,
          !trackCheck.isOnTrack,
          car.isPlayer ? collisionCallback : undefined,
          activeWeather
        );
        PhysicsEngine.handleTrackWallCollision(
          car,
          selectedTrack.points,
          car.isPlayer ? collisionCallback : undefined
        );

        // Kerb vibration rumble
        if (trackCheck.isOnTrack && Math.hypot(car.vx, car.vy) > 120 && Math.random() < 0.08) {
          if (car.isPlayer && (car.x % 40 < 5 || car.y % 40 < 5)) {
            soundEngine.playKerbRumble();
          }
        }

        // Obstacles collision
        for (const obs of obstacles) {
          PhysicsEngine.handleObstacleCollision(car, obs, car.isPlayer ? collisionCallback : undefined);
        }

        // Checkpoint & Lap Progression
        const nCp = checkpoints.length;
        const currentCp = checkpoints[car.nextCheckpointIdx];
        const distToCp = Math.hypot(currentCp.x - car.x, currentCp.y - car.y);

        if (distToCp < currentCp.width * 0.8) {
          car.nextCheckpointIdx = (car.nextCheckpointIdx + 1) % nCp;

          // If crossed start/finish line (index 1 is right after index 0)
          if (car.nextCheckpointIdx === 1) {
            if (car.currentLapTime > 4) {
              car.lapTimes.push(car.currentLapTime);
              car.currentLapTime = 0;
              car.currentLap += 1;

              if (car.isPlayer) {
                soundEngine.playPickup();
                particleSystem.addConfetti(currentCp.x, currentCp.y, 30);
              }

              // Finished race check
              if (car.currentLap > selectedTrack.laps && !car.finished) {
                car.finished = true;
                if (car.isPlayer && !isFinished) {
                  soundEngine.playFinishFanfare();
                  particleSystem.addConfetti(car.x, car.y, 80);
                  setIsFinished(true);
                  const bestLap = Math.min(...car.lapTimes);
                  onFinishRace(bestLap, car.totalRaceTime, car.rank);
                }
              }
            }
          }
        }

        // Timing updates
        if (s.raceStarted && !car.finished) {
          car.currentLapTime += dt;
          car.totalRaceTime += dt;
        }

        // Wrong-way detection
        if (car.isPlayer && car.speed > 80) {
          const cpVecX = currentCp.x - car.x;
          const cpVecY = currentCp.y - car.y;
          const cpAngle = Math.atan2(cpVecY, cpVecX);
          let diff = Math.abs(car.angle - cpAngle);
          while (diff > Math.PI) diff = Math.abs(diff - Math.PI * 2);
          car.wrongWay = diff > 2.2;
        } else if (car.isPlayer) {
          car.wrongWay = false;
        }
      }

      // 5. Car-to-Car Collisions
      for (let i = 0; i < allCars.length; i++) {
        for (let j = i + 1; j < allCars.length; j++) {
          PhysicsEngine.handleCarCollision(
            allCars[i],
            allCars[j],
            allCars[i].isPlayer || allCars[j].isPlayer ? collisionCallback : undefined
          );
        }
      }

      // 6. Dynamic Obstacles (Moving traffic cones)
      PhysicsEngine.updateObstacles(obstacles, dt);

      // 7. Nitro Pickups handling
      for (const np of nitroPickups) {
        if (np.collected) {
          np.respawnTimer -= dt;
          if (np.respawnTimer <= 0) {
            np.collected = false;
          }
        } else {
          for (const car of allCars) {
            const d = Math.hypot(np.x - car.x, np.y - car.y);
            if (d < np.radius + 20) {
              np.collected = true;
              np.respawnTimer = 12;
              car.nitroRemaining = Math.min(car.nitroCapacity, car.nitroRemaining + 45);
              if (car.isPlayer) {
                soundEngine.playPickup();
                particleSystem.addSparks(np.x, np.y, 18);
              }
              break;
            }
          }
        }
      }

      // 8. Calculate Real-Time Race Rankings
      const rankedCars = [...allCars].sort((a, b) => {
        if (a.finished && !b.finished) return -1;
        if (!a.finished && b.finished) return 1;
        if (a.currentLap !== b.currentLap) return b.currentLap - a.currentLap;
        if (a.nextCheckpointIdx !== b.nextCheckpointIdx) return b.nextCheckpointIdx - a.nextCheckpointIdx;

        const cp = checkpoints[a.nextCheckpointIdx % checkpoints.length];
        const distA = Math.hypot(cp.x - a.x, cp.y - a.y);
        const distB = Math.hypot(cp.x - b.x, cp.y - b.y);
        return distA - distB;
      });

      rankedCars.forEach((c, idx) => {
        c.rank = idx + 1;
      });

      // 9. Particle and Skid Effects
      for (const car of allCars) {
        if ((car.isDrifting || (car.brakeInput > 0.4 && car.speed > 100)) && car.speed > 50) {
          const rearDist = 18;
          const wheelDist = 12;
          const rx1 = car.x - Math.cos(car.angle) * rearDist - Math.sin(car.angle) * wheelDist;
          const ry1 = car.y - Math.sin(car.angle) * rearDist + Math.cos(car.angle) * wheelDist;
          const rx2 = car.x - Math.cos(car.angle) * rearDist + Math.sin(car.angle) * wheelDist;
          const ry2 = car.y - Math.sin(car.angle) * rearDist - Math.cos(car.angle) * wheelDist;

          particleSystem.addSkidMark(
            rx1,
            ry1,
            rx1 + car.vx * dt * 0.4,
            ry1 + car.vy * dt * 0.4,
            selectedTrack.skidMarkColor
          );
          particleSystem.addSkidMark(
            rx2,
            ry2,
            rx2 + car.vx * dt * 0.4,
            ry2 + car.vy * dt * 0.4,
            selectedTrack.skidMarkColor
          );
          particleSystem.addTireSmoke(rx1, ry1);
          particleSystem.addTireSmoke(rx2, ry2);
        }

        if (car.isNitroActive) {
          const exhaustX = car.x - Math.cos(car.angle) * 22;
          const exhaustY = car.y - Math.sin(car.angle) * 22;
          particleSystem.addNitroFlames(exhaustX, exhaustY, car.angle);
        }

        if (car.offroad && car.speed > 60) {
          particleSystem.addTireSmoke(car.x, car.y, selectedTrack.particleColor);
        }
      }

      particleSystem.update(dt);

      // 10. Sound synchronization (Engine RPM & Turbo)
      const normSpeed = playerCar.speed / playerCar.carStats.maxSpeed;
      soundEngine.updateEngine(normSpeed, playerCar.throttleInput, playerCar.isNitroActive);
      soundEngine.setDriftSound(playerCar.isDrifting && playerCar.speed > 70, normSpeed);

      // 11. Online Multiplayer Broadcast Synchronization (~30Hz)
      if (isOnline) {
        s.networkSyncTimer += dt;
        if (s.networkSyncTimer >= 0.033) {
          s.networkSyncTimer = 0;
          multiplayerManager.sendCarPacket(playerCar);
        }
      }

      // 12. Canvas Rendering (Split-Screen vs Single-Screen)
      const width = canvas.width;
      const height = canvas.height;

      if (isSplitScreen && player2Car) {
        renderer.renderSplitScreen(
          width,
          height,
          selectedTrack,
          checkpoints,
          allCars,
          playerCar,
          player2Car,
          obstacles,
          nitroPickups,
          particleSystem.particles,
          particleSystem.skidMarks,
          dt,
          activeWeather
        );
      } else {
        renderer.render(
          width,
          height,
          selectedTrack,
          checkpoints,
          allCars,
          playerCar,
          obstacles,
          nitroPickups,
          particleSystem.particles,
          particleSystem.skidMarks,
          dt,
          activeWeather
        );
      }

      // 13. Sync React HUD state (~10fps throttled)
      hudSyncCounter++;
      if (hudSyncCounter % 4 === 0) {
        setHudPlayerCar({ ...playerCar });
        if (player2Car) setHudPlayer2Car({ ...player2Car });
        setHudAllCars([...allCars]);
      }

      s.animationFrameId = requestAnimationFrame(loop);
    };

    const handleResize = () => {
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.scale(dpr, dpr);
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    stateRef.current.animationFrameId = requestAnimationFrame(loop);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (stateRef.current.animationFrameId) {
        cancelAnimationFrame(stateRef.current.animationFrameId);
      }
      soundEngine.stopEngine();
      soundEngine.setDriftSound(false);
      soundEngine.stopBGM();
    };
  }, [selectedTrack, settings.difficulty, onFinishRace, isSplitScreen, isOnline, activeWeather]);

  const toggleSound = () => {
    const next = !soundActive;
    setSoundActive(next);
    soundEngine.setSoundEnabled(next);
    soundEngine.setMusicEnabled(next);
  };

  return (
    <div className="relative w-full h-full min-h-screen bg-slate-950 select-none overflow-hidden touch-none">
      {/* 2D Canvas */}
      <canvas
        ref={canvasRef}
        id="racing-canvas"
        className="w-full h-full absolute inset-0 block cursor-crosshair"
      />

      {/* Floating HUD with Real-time Telemetry & Cockpit */}
      {hudPlayerCar && (
        <HUD
          playerCar={hudPlayerCar}
          player2Car={hudPlayer2Car}
          allCars={hudAllCars}
          theme={selectedTrack}
          countdown={countdown}
          soundEnabled={soundActive}
          onToggleSound={toggleSound}
          onResetCar={handleResetCar}
          onQuitToMenu={onQuitToMenu}
          gameMode={gameMode}
          roomCode={roomCode}
        />
      )}

      {/* Touch Controls Overlay for Mobile / Tablet */}
      {settings.touchControls && !isFinished && !isSplitScreen && (
        <TouchControls
          onSteerChange={(steer) => {
            stateRef.current.touchInputs.steer = steer;
          }}
          onThrottleChange={(throttle) => {
            stateRef.current.touchInputs.throttle = throttle;
          }}
          onBrakeChange={(brake) => {
            stateRef.current.touchInputs.brake = brake;
          }}
          onDriftChange={(drift) => {
            stateRef.current.touchInputs.drift = drift;
          }}
          onNitroTrigger={(active) => {
            stateRef.current.touchInputs.nitro = active;
          }}
        />
      )}

      {/* Finish Results Modal */}
      {isFinished && hudPlayerCar && (
        <RaceFinishModal
          playerCar={hudPlayerCar}
          allCars={hudAllCars}
          theme={selectedTrack}
          onRestart={initRace}
          onChangeTrack={onChangeTrack}
          onMainMenu={onQuitToMenu}
        />
      )}
    </div>
  );
};
