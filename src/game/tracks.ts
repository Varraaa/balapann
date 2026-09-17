/**
 * Track and Vehicle Definitions for Apex Racer 2D
 */

import { CarStats, Checkpoint, Obstacle, NitroPickup, TrackPoint, TrackTheme } from '../types/game';

export const AVAILABLE_CARS: CarStats[] = [
  {
    id: 'red_fury',
    name: 'Red Fury GT',
    tagline: 'Seimbang, bertenaga, dan responsif di setiap tikungan.',
    bodyColor: '#ef4444',
    accentColor: '#ffffff',
    glassColor: '#1e293b',
    wheelColor: '#0f172a',
    maxSpeed: 640,
    acceleration: 1.15,
    handling: 1.05,
    driftFactor: 0.89,
    offroadResist: 0.42,
    nitroStrength: 1.35,
    unlocked: true,
    modelStyle: 'sports'
  },
  {
    id: 'turbo_volt',
    name: 'Turbo Volt EV',
    tagline: 'Hypercar listrik dengan akselerasi instan dan top speed tinggi.',
    bodyColor: '#06b6d4',
    accentColor: '#e0f2fe',
    glassColor: '#0f172a',
    wheelColor: '#1e293b',
    maxSpeed: 720,
    acceleration: 1.35,
    handling: 0.95,
    driftFactor: 0.85,
    offroadResist: 0.35,
    nitroStrength: 1.45,
    unlocked: true,
    modelStyle: 'supercar'
  },
  {
    id: 'drift_phantom',
    name: 'Drift Phantom',
    tagline: 'Raja oversteer JDM dengan kontrol drift paling mulus.',
    bodyColor: '#a855f7',
    accentColor: '#fde047',
    glassColor: '#18181b',
    wheelColor: '#27272a',
    maxSpeed: 620,
    acceleration: 1.1,
    handling: 1.25,
    driftFactor: 0.94,
    offroadResist: 0.40,
    nitroStrength: 1.30,
    unlocked: true,
    modelStyle: 'tuner'
  },
  {
    id: 'desert_marauder',
    name: 'Desert Marauder',
    tagline: 'Tangguh di segala medan, minim penalti kecepatan di luar jalur.',
    bodyColor: '#f97316',
    accentColor: '#1c1917',
    glassColor: '#292524',
    wheelColor: '#1c1917',
    maxSpeed: 600,
    acceleration: 1.05,
    handling: 0.98,
    driftFactor: 0.88,
    offroadResist: 0.70,
    nitroStrength: 1.35,
    unlocked: true,
    modelStyle: 'muscle'
  },
  {
    id: 'cyber_apex',
    name: 'Cyber Apex X',
    tagline: 'Prototipe masa depan dengan nitro boost berdaya ledak super.',
    bodyColor: '#10b981',
    accentColor: '#f43f5e',
    glassColor: '#064e3b',
    wheelColor: '#022c22',
    maxSpeed: 680,
    acceleration: 1.22,
    handling: 1.12,
    driftFactor: 0.90,
    offroadResist: 0.45,
    nitroStrength: 1.55,
    unlocked: true,
    modelStyle: 'prototype'
  }
];

// Helper to generate a smooth circuit track from key points
export function generateTrackCheckpoints(points: TrackPoint[]): Checkpoint[] {
  const checkpoints: Checkpoint[] = [];
  const n = points.length;

  for (let i = 0; i < n; i++) {
    const p1 = points[i];
    const p2 = points[(i + 1) % n];
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    const angle = Math.atan2(dy, dx);
    const width = p1.width ?? 180;

    checkpoints.push({
      id: i,
      x: p1.x,
      y: p1.y,
      angle,
      width
    });
  }

  return checkpoints;
}

export const TRACK_THEMES: TrackTheme[] = [
  {
    id: 'city_gp',
    name: 'Asphalt City GP',
    description: 'Sirkuit kota berkecepatan tinggi dengan aspal mulus, trotoar kota, dan rintangan traffic cone.',
    difficulty: 'Mudah',
    laps: 3,
    bgColor: '#15803d',          // emerald grass
    bgPatternColor: '#166534',
    roadColor: '#334155',        // slate dark asphalt
    roadBorderColor: '#64748b',
    curbColor1: '#ef4444',       // red
    curbColor2: '#ffffff',       // white
    skidMarkColor: 'rgba(15, 23, 42, 0.45)',
    particleColor: '#cbd5e1',
    ambientLight: 'rgba(255, 255, 255, 0.0)',
    previewGradient: ['#3b82f6', '#1d4ed8'],
    points: [
      { x: 500, y: 1400, width: 210 },  // Start / Finish line
      { x: 1100, y: 1400, width: 200 },
      { x: 1700, y: 1350, width: 190 },
      { x: 2150, y: 1100, width: 180 }, // Turn 1
      { x: 2200, y: 650, width: 180 },
      { x: 1850, y: 350, width: 190 },  // Turn 2
      { x: 1350, y: 400, width: 180 },
      { x: 1100, y: 650, width: 180 },  // Chicane
      { x: 800, y: 550, width: 180 },
      { x: 450, y: 700, width: 190 },   // Hairpin
      { x: 350, y: 1050, width: 200 },
    ],
    obstacles: [
      { id: 'c1', type: 'cone', x: 1400, y: 1380, radius: 14, vx: 0, vy: 0, angle: 0, active: true },
      { id: 'c2', type: 'cone', x: 1430, y: 1420, radius: 14, vx: 0, vy: 0, angle: 0, active: true },
      { id: 'oil1', type: 'oil', x: 1950, y: 420, radius: 26, active: true },
      { id: 'c3', type: 'cone', x: 1120, y: 620, radius: 14, vx: 0, vy: 0, angle: 0, active: true },
      { id: 'rock1', type: 'rock', x: 480, y: 650, radius: 22, active: true },
      { id: 'oil2', type: 'oil', x: 370, y: 1150, radius: 28, active: true }
    ],
    nitroPickups: [
      { id: 'n1', x: 1350, y: 1400, radius: 20, collected: false, respawnTimer: 0 },
      { id: 'n2', x: 2100, y: 850, radius: 20, collected: false, respawnTimer: 0 },
      { id: 'n3', x: 600, y: 600, radius: 20, collected: false, respawnTimer: 0 }
    ]
  },
  {
    id: 'desert_oasis',
    name: 'Desert Oasis Circuit',
    description: 'Trek berdebu di tengah gurun dengan tikungan lebar, batu cadas terjal, dan jebakan pasir licin.',
    difficulty: 'Sedang',
    laps: 3,
    bgColor: '#d97706',          // warm desert sand
    bgPatternColor: '#b45309',
    roadColor: '#78350f',        // baked clay/dirt track
    roadBorderColor: '#92400e',
    curbColor1: '#f59e0b',       // yellow
    curbColor2: '#1f2937',       // black
    skidMarkColor: 'rgba(69, 26, 3, 0.5)',
    particleColor: '#fcd34d',
    ambientLight: 'rgba(245, 158, 11, 0.08)',
    previewGradient: ['#f59e0b', '#b45309'],
    points: [
      { x: 600, y: 1600, width: 220 }, // Start / Finish
      { x: 1200, y: 1600, width: 210 },
      { x: 1900, y: 1500, width: 200 },
      { x: 2400, y: 1200, width: 190 },
      { x: 2500, y: 700, width: 190 },  // Long sweeper
      { x: 2200, y: 350, width: 200 },
      { x: 1500, y: 300, width: 210 },
      { x: 1100, y: 450, width: 190 },  // Canyon turn
      { x: 800, y: 750, width: 190 },
      { x: 1200, y: 950, width: 190 },  // S-Curve
      { x: 1100, y: 1250, width: 200 },
      { x: 500, y: 1200, width: 210 }
    ],
    obstacles: [
      { id: 'r1', type: 'rock', x: 2050, y: 1420, radius: 24, active: true },
      { id: 'r2', type: 'rock', x: 2350, y: 550, radius: 25, active: true },
      { id: 'oil1', type: 'oil', x: 1350, y: 320, radius: 30, active: true },
      { id: 'c1', type: 'cone', x: 1180, y: 920, radius: 14, vx: 0, vy: 0, angle: 0, active: true },
      { id: 'r3', type: 'rock', x: 950, y: 1220, radius: 26, active: true }
    ],
    nitroPickups: [
      { id: 'n1', x: 1500, y: 1580, radius: 20, collected: false, respawnTimer: 0 },
      { id: 'n2', x: 1800, y: 310, radius: 20, collected: false, respawnTimer: 0 },
      { id: 'n3', x: 950, y: 800, radius: 20, collected: false, respawnTimer: 0 }
    ]
  },
  {
    id: 'neon_tokyo',
    name: 'Neon Tokyo Highway',
    description: 'Balapan malam hari bermandikan lampu neon dengan aspal basah mengkilap dan lintasan teknis sempit.',
    difficulty: 'Sulit',
    laps: 3,
    bgColor: '#090d16',          // midnight navy dark
    bgPatternColor: '#0f172a',
    roadColor: '#1e1e2d',        // wet reflective dark asphalt
    roadBorderColor: '#06b6d4',  // glowing cyan
    curbColor1: '#ec4899',       // neon pink
    curbColor2: '#06b6d4',       // neon cyan
    skidMarkColor: 'rgba(6, 182, 212, 0.4)',
    particleColor: '#38bdf8',
    ambientLight: 'rgba(14, 165, 233, 0.12)',
    previewGradient: ['#06b6d4', '#ec4899'],
    points: [
      { x: 500, y: 1500, width: 200 }, // Start
      { x: 1100, y: 1500, width: 190 },
      { x: 1650, y: 1450, width: 180 },
      { x: 2100, y: 1250, width: 170 },
      { x: 2350, y: 850, width: 170 },
      { x: 2150, y: 450, width: 180 },
      { x: 1650, y: 350, width: 180 },
      { x: 1300, y: 550, width: 170 }, // Double hairpin
      { x: 1500, y: 850, width: 170 },
      { x: 1150, y: 1100, width: 170 },
      { x: 700, y: 950, width: 180 },
      { x: 400, y: 1150, width: 190 }
    ],
    obstacles: [
      { id: 'oil1', type: 'oil', x: 1850, y: 1370, radius: 28, active: true },
      { id: 'c1', type: 'cone', x: 2280, y: 700, radius: 14, vx: 0, vy: 0, angle: 0, active: true },
      { id: 'c2', type: 'cone', x: 2310, y: 730, radius: 14, vx: 0, vy: 0, angle: 0, active: true },
      { id: 'oil2', type: 'oil', x: 1420, y: 720, radius: 28, active: true },
      { id: 'rock1', type: 'rock', x: 1200, y: 1050, radius: 22, active: true },
      { id: 'oil3', type: 'oil', x: 550, y: 1050, radius: 26, active: true }
    ],
    nitroPickups: [
      { id: 'n1', x: 1350, y: 1480, radius: 20, collected: false, respawnTimer: 0 },
      { id: 'n2', x: 1850, y: 380, radius: 20, collected: false, respawnTimer: 0 },
      { id: 'n3', x: 950, y: 1000, radius: 20, collected: false, respawnTimer: 0 }
    ]
  },
  {
    id: 'alpine_frost',
    name: 'Alpine Frostbite',
    description: 'Sirkuit es di pegunungan bersalju dengan lintasan licin yang menuntut keahlian drift tingkat tinggi.',
    difficulty: 'Sulit',
    laps: 3,
    bgColor: '#f1f5f9',          // pure crisp snow
    bgPatternColor: '#e2e8f0',
    roadColor: '#94a3b8',        // frozen ice-gray road
    roadBorderColor: '#38bdf8',
    curbColor1: '#0284c7',       // ice blue
    curbColor2: '#ffffff',       // white
    skidMarkColor: 'rgba(51, 65, 85, 0.4)',
    particleColor: '#e0f2fe',
    ambientLight: 'rgba(56, 189, 248, 0.08)',
    previewGradient: ['#38bdf8', '#0284c7'],
    points: [
      { x: 550, y: 1550, width: 210 },
      { x: 1250, y: 1550, width: 200 },
      { x: 1850, y: 1400, width: 190 },
      { x: 2300, y: 1050, width: 190 },
      { x: 2100, y: 600, width: 180 },
      { x: 1600, y: 400, width: 190 },
      { x: 1100, y: 400, width: 190 },
      { x: 750, y: 650, width: 180 },
      { x: 950, y: 950, width: 180 },
      { x: 500, y: 1150, width: 190 }
    ],
    obstacles: [
      { id: 'r1', type: 'rock', x: 1550, y: 1480, radius: 24, active: true },
      { id: 'oil1', type: 'oil', x: 2200, y: 850, radius: 30, active: true },
      { id: 'c1', type: 'cone', x: 1350, y: 420, radius: 14, vx: 0, vy: 0, angle: 0, active: true },
      { id: 'c2', type: 'cone', x: 1380, y: 390, radius: 14, vx: 0, vy: 0, angle: 0, active: true },
      { id: 'r2', type: 'rock', x: 820, y: 800, radius: 25, active: true }
    ],
    nitroPickups: [
      { id: 'n1', x: 950, y: 1550, radius: 20, collected: false, respawnTimer: 0 },
      { id: 'n2', x: 1350, y: 390, radius: 20, collected: false, respawnTimer: 0 },
      { id: 'n3', x: 700, y: 1050, radius: 20, collected: false, respawnTimer: 0 }
    ]
  }
];
