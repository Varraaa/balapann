/**
 * Types and interfaces for Apex Racer 2D
 */

export interface Vector2D {
  x: number;
  y: number;
}

export type EngineSoundType =
  | 'v12_lambo'
  | 'v8_ferrari'
  | 'v8_mclaren'
  | 'flat6_porsche'
  | 'w16_bugatti'
  | 'rotary_rx7';

export type Car3DModelType =
  | 'lamborghini'
  | 'ferrari'
  | 'mclaren'
  | 'porsche'
  | 'bugatti'
  | 'rx7';

export type CameraViewMode = 'chase' | 'hood' | 'cockpit' | 'helicopter';

export interface CarStats {
  id: string;
  name: string;
  brand: string;
  tagline: string;
  bodyColor: string;
  accentColor: string;
  glassColor: string;
  wheelColor: string;
  maxSpeed: number;        // pixels/units per second (~500 - 850)
  acceleration: number;    // acceleration rate
  handling: number;        // turn rate & responsiveness
  driftFactor: number;     // how easily it slides (0.88 - 0.96)
  offroadResist: number;   // speed retention on grass/sand (0.35 - 0.65)
  nitroStrength: number;   // boost multiplier
  unlocked: boolean;
  modelStyle: 'sports' | 'supercar' | 'muscle' | 'tuner' | 'prototype';
  model3D: Car3DModelType;
  engineType: EngineSoundType;
  engineSpecs: string;
  redlineRpm: number;
  idleRpm: number;
}

export interface Obstacle {
  id: string;
  type: 'rock' | 'oil' | 'cone';
  x: number;
  y: number;
  radius: number;
  angle?: number;
  vx?: number;
  vy?: number;
  active: boolean;
}

export interface NitroPickup {
  id: string;
  x: number;
  y: number;
  radius: number;
  collected: boolean;
  respawnTimer: number;
}

export interface TrackPoint {
  x: number;
  y: number;
  width?: number; // road width at this point (default e.g. 170)
}

export interface Checkpoint {
  id: number;
  x: number;
  y: number;
  angle: number;
  width: number;
}

export interface TrackTheme {
  id: string;
  name: string;
  description: string;
  difficulty: 'Mudah' | 'Sedang' | 'Sulit';
  laps: number;
  bgColor: string;          // grass, sand, snow, or city ground
  bgPatternColor: string;
  roadColor: string;
  roadBorderColor: string;
  curbColor1: string;
  curbColor2: string;
  skidMarkColor: string;
  particleColor: string;
  ambientLight: string;
  points: TrackPoint[];
  obstacles: Obstacle[];
  nitroPickups: NitroPickup[];
  previewGradient: [string, string];
  trackStyle?: 'monza' | 'tokyo' | 'monaco' | 'desert';
  skyColor?: string;
  hasTunnels?: boolean;
  hasOcean?: boolean;
  hasSkyscrapers?: boolean;
}

export type WeatherType = 'clear' | 'sunset' | 'night' | 'rain';
export type GameMode = 'single' | 'splitscreen' | 'online' | 'single_player' | 'split_screen' | 'online_multiplayer';

export interface CarTelemetry {
  rpm: number;             // 1000 to 8500
  gear: number | string;   // 1 to 6 (or 'R', 'N')
  tireTemp: number;        // Celsius, normal 85-95C
  brakeDiscTemp: number;   // 0 to 1, glow intensity
  bodyRoll: number;        // lean angle in radians
  bodyPitch: number;       // forward/backward dip
  slipRatio: number;       // 0 to 1 tire slip amount
  turboBoost: number;      // 0 to 1 turbo pressure
}

export interface CarState {
  id: string;
  isPlayer: boolean;
  playerIndex?: 1 | 2;     // for split-screen: 1 = P1, 2 = P2
  name: string;
  carStats: CarStats;
  x: number;
  y: number;
  vx: number;
  vy: number;
  angle: number;           // in radians
  angularVelocity: number;
  speed: number;           // magnitude in facing direction
  steerInput: number;      // -1 to 1
  throttleInput: number;   // 0 to 1
  brakeInput: number;      // 0 to 1
  isDrifting: boolean;
  isNitroActive: boolean;
  nitroRemaining: number;  // 0 to 100
  nitroCapacity: number;
  spinTimer: number;       // from oil slick
  currentLap: number;
  nextCheckpointIdx: number;
  lapTimes: number[];
  currentLapTime: number;
  totalRaceTime: number;
  finished: boolean;
  rank: number;
  wrongWay: boolean;
  offroad: boolean;
  stuckTimer: number;      // for AI recovery
  targetWaypointIdx: number;
  // Enhanced Realism Telemetry
  telemetry: CarTelemetry;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  color: string;
  type: 'smoke' | 'spark' | 'flame' | 'debris' | 'confetti' | 'splash' | 'rain';
  rotation?: number;
  rotSpeed?: number;
}

export interface SkidMark {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  alpha: number;
  color: string;
}

export interface GameSettings {
  difficulty: 'easy' | 'medium' | 'hard';
  laps: number;
  soundEnabled: boolean;
  musicEnabled: boolean;
  volume: number;
  touchControls: boolean;
  showMinimap: boolean;
  weather: WeatherType;
  manualGearbox: boolean;
}

export interface OnlinePlayer {
  id: string;
  name: string;
  isHost: boolean;
  isReady: boolean;
  carStats: CarStats;
  ping?: number;
}

export interface NetworkCarPacket {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  angle: number;
  speed: number;
  steerInput: number;
  throttleInput: number;
  brakeInput: number;
  isDrifting: boolean;
  isNitroActive: boolean;
  nitroRemaining: number;
  currentLap: number;
  nextCheckpointIdx: number;
  currentLapTime: number;
  totalRaceTime: number;
  finished: boolean;
  telemetry: CarTelemetry;
}

export interface QuickChatMessage {
  id: string;
  senderName: string;
  text: string;
  timestamp: number;
}

export type GameView =
  | 'menu'
  | 'select_car'
  | 'select_track'
  | 'settings'
  | 'help'
  | 'racing'
  | 'splitscreen_lobby'
  | 'splitscreen_racing'
  | 'online_lobby'
  | 'online_racing'
  | 'finished';
