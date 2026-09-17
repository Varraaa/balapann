/**
 * Track and Vehicle Definitions for Apex Racer 3D
 * Features 6 iconic authentic supercars with realistic acoustic sound engine models:
 * - Lamborghini Aventador SVJ (6.5L Naturally Aspirated V12, 8,500 RPM)
 * - Ferrari 488 Pista (3.9L Twin-Turbo Flat-Plane V8, 8,000 RPM)
 * - McLaren 720S (4.0L Twin-Turbo M840T V8, 8,500 RPM)
 * - Porsche 911 GT3 RS (4.0L Naturally Aspirated Boxer-6, 9,000 RPM)
 * - Bugatti Chiron Super Sport (8.0L Quad-Turbo W16, 7,100 RPM)
 * - Mazda RX-7 FD3S (1.3L 13B-REW Twin-Rotor Sequential Turbo, 8,200 RPM)
 */

import { CarStats, Checkpoint, Obstacle, NitroPickup, TrackPoint, TrackTheme } from '../types/game';

export const AVAILABLE_CARS: CarStats[] = [
  {
    id: 'lamborghini',
    name: 'Lamborghini Aventador SVJ',
    brand: 'Lamborghini',
    tagline: 'Raungan V12 legendaris 770 HP dengan aerodinamika aktif ALA dan bodi sudut tajam agresif.',
    bodyColor: '#f59e0b',       // Giallo Auge / Pearl Yellow-Orange
    accentColor: '#09090b',     // Carbon fiber black
    glassColor: '#0f172a',
    wheelColor: '#18181b',
    maxSpeed: 770,
    acceleration: 1.36,
    handling: 1.18,
    driftFactor: 0.90,
    offroadResist: 0.40,
    nitroStrength: 1.48,
    unlocked: true,
    modelStyle: 'supercar',
    model3D: 'lamborghini',
    engineType: 'v12_lambo',
    engineSpecs: '6.5L Naturally Aspirated V12 (8,500 RPM / 770 HP)',
    redlineRpm: 8500,
    idleRpm: 1000
  },
  {
    id: 'ferrari',
    name: 'Ferrari 488 Pista',
    brand: 'Ferrari',
    tagline: 'Keluaran suara sopran khas Flat-Plane V8 Italia, saluran S-Duct tajam, dan manuver super presisi.',
    bodyColor: '#dc2626',       // Rosso Corsa
    accentColor: '#ffffff',     // Scuderia white racing stripe
    glassColor: '#111827',
    wheelColor: '#27272a',
    maxSpeed: 760,
    acceleration: 1.40,
    handling: 1.25,
    driftFactor: 0.92,
    offroadResist: 0.42,
    nitroStrength: 1.42,
    unlocked: true,
    modelStyle: 'supercar',
    model3D: 'ferrari',
    engineType: 'v8_ferrari',
    engineSpecs: '3.9L Twin-Turbo Flat-Plane V8 (8,000 RPM / 720 HP)',
    redlineRpm: 8000,
    idleRpm: 1000
  },
  {
    id: 'mclaren',
    name: 'McLaren 720S Spider',
    brand: 'McLaren',
    tagline: 'Desain kanopi tetesan air (teardrop), desis turbo twin-scroll, dan akselerasi roket.',
    bodyColor: '#ea580c',       // Papaya Spark Orange
    accentColor: '#18181b',     // Satin carbon
    glassColor: '#0284c7',
    wheelColor: '#0f172a',
    maxSpeed: 780,
    acceleration: 1.42,
    handling: 1.22,
    driftFactor: 0.88,
    offroadResist: 0.38,
    nitroStrength: 1.50,
    unlocked: true,
    modelStyle: 'supercar',
    model3D: 'mclaren',
    engineType: 'v8_mclaren',
    engineSpecs: '4.0L Twin-Turbo M840T V8 (8,500 RPM / 720 HP)',
    redlineRpm: 8500,
    idleRpm: 950
  },
  {
    id: 'porsche',
    name: 'Porsche 911 GT3 RS',
    brand: 'Porsche',
    tagline: 'Raungan murni mesin Boxer 6-silinder 9,000 RPM, sayap swan-neck raksasa, dan raja tikungan sirkuit.',
    bodyColor: '#0284c7',       // Miami Blue
    accentColor: '#09090b',     // Carbon composite
    glassColor: '#0f172a',
    wheelColor: '#18181b',
    maxSpeed: 740,
    acceleration: 1.32,
    handling: 1.38,
    driftFactor: 0.94,
    offroadResist: 0.45,
    nitroStrength: 1.38,
    unlocked: true,
    modelStyle: 'sports',
    model3D: 'porsche',
    engineType: 'flat6_porsche',
    engineSpecs: '4.0L Naturally Aspirated Boxer-6 (9,000 RPM / 525 HP)',
    redlineRpm: 9000,
    idleRpm: 950
  },
  {
    id: 'bugatti',
    name: 'Bugatti Chiron Super Sport',
    brand: 'Bugatti',
    tagline: 'Monster 1,600 HP bermesin W16 Quad-Turbo 8.0L dengan akselerasi brutal dan top speed tak tertandingi.',
    bodyColor: '#1d4ed8',       // French Racing Blue
    accentColor: '#09090b',     // Gloss Black two-tone
    glassColor: '#030712',
    wheelColor: '#38bdf8',
    maxSpeed: 840,
    acceleration: 1.48,
    handling: 1.02,
    driftFactor: 0.85,
    offroadResist: 0.36,
    nitroStrength: 1.55,
    unlocked: true,
    modelStyle: 'prototype',
    model3D: 'bugatti',
    engineType: 'w16_bugatti',
    engineSpecs: '8.0L Quad-Turbo W16 (7,100 RPM / 1,600 HP)',
    redlineRpm: 7100,
    idleRpm: 900
  },
  {
    id: 'rx7',
    name: 'Mazda RX-7 FD3S Rotary',
    brand: 'Mazda',
    tagline: 'Ikon JDM legendaris dengan getaran brap-brap idle 13B Rotary, dengungan putaran tinggi, dan kontrol drift paling lincah.',
    bodyColor: '#eab308',       // Sunburst Yellow
    accentColor: '#18181b',     // Midnight Black
    glassColor: '#1e293b',
    wheelColor: '#38bdf8',     // Heat-treated titanium rim
    maxSpeed: 710,
    acceleration: 1.28,
    handling: 1.34,
    driftFactor: 0.97,          // King of drift
    offroadResist: 0.44,
    nitroStrength: 1.40,
    unlocked: true,
    modelStyle: 'tuner',
    model3D: 'rx7',
    engineType: 'rotary_rx7',
    engineSpecs: '1.3L 13B-REW Twin-Rotor Sequential Turbo (8,200 RPM / 350 HP)',
    redlineRpm: 8200,
    idleRpm: 850
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
    id: 'monza_gp',
    name: 'Monza GP International Circuit',
    description: 'Sirkuit balap Formula 1 dengan trek lurus panjang berkecepatan tinggi, chicane Variante del Rettifilo, tikungan Parabolica bertanggul, tribun penonton grandstand, dan padang rumput hijau.',
    difficulty: 'Mudah',
    laps: 3,
    trackStyle: 'monza',
    bgColor: '#15803d',          // emerald grass
    bgPatternColor: '#166534',
    roadColor: '#27272a',        // modern race tarmac
    roadBorderColor: '#64748b',
    curbColor1: '#ef4444',       // red
    curbColor2: '#ffffff',       // white
    skidMarkColor: 'rgba(15, 23, 42, 0.55)',
    particleColor: '#cbd5e1',
    ambientLight: 'rgba(255, 255, 255, 0.0)',
    previewGradient: ['#15803d', '#1d4ed8'],
    points: [
      { x: 500, y: 1500, width: 220 },  // Pit Straight / Start Finish
      { x: 1200, y: 1500, width: 210 }, // Flat-out Straight
      { x: 1800, y: 1450, width: 200 },
      { x: 2250, y: 1200, width: 190 }, // Curva Grande
      { x: 2350, y: 700, width: 180 },  // Lesmo Curves
      { x: 2000, y: 350, width: 180 },
      { x: 1400, y: 400, width: 180 },  // Variante Ascari Chicane
      { x: 1100, y: 650, width: 180 },
      { x: 800, y: 550, width: 180 },
      { x: 450, y: 750, width: 200 },   // Parabolica Entry
      { x: 350, y: 1150, width: 210 }   // Parabolica High-Speed Sweeper
    ],
    obstacles: [
      { id: 'c1', type: 'cone', x: 1450, y: 1480, radius: 14, vx: 0, vy: 0, angle: 0, active: true },
      { id: 'c2', type: 'cone', x: 1480, y: 1520, radius: 14, vx: 0, vy: 0, angle: 0, active: true },
      { id: 'oil1', type: 'oil', x: 2100, y: 450, radius: 26, active: true },
      { id: 'c3', type: 'cone', x: 1120, y: 630, radius: 14, vx: 0, vy: 0, angle: 0, active: true },
      { id: 'rock1', type: 'rock', x: 480, y: 720, radius: 22, active: true }
    ],
    nitroPickups: [
      { id: 'n1', x: 1350, y: 1500, radius: 20, collected: false, respawnTimer: 0 },
      { id: 'n2', x: 2180, y: 950, radius: 20, collected: false, respawnTimer: 0 },
      { id: 'n3', x: 600, y: 650, radius: 20, collected: false, respawnTimer: 0 }
    ]
  },
  {
    id: 'neon_tokyo',
    name: 'Tokyo Shuto Expressway C1',
    description: 'Jalan layang tol metropolitan Tokyo di malam hari dengan gedung pencakar langit berlampu neon, tiang beton viaduct, lampu jalan gantung, dan aspal basah mengkilap.',
    difficulty: 'Sulit',
    laps: 3,
    trackStyle: 'tokyo',
    hasTunnels: true,
    hasSkyscrapers: true,
    bgColor: '#050711',          // deep midnight bay
    bgPatternColor: '#0a0f1d',
    roadColor: '#181824',        // dark wet reflective asphalt
    roadBorderColor: '#06b6d4',  // glowing neon cyan barrier
    curbColor1: '#ec4899',       // neon pink
    curbColor2: '#06b6d4',       // neon cyan
    skidMarkColor: 'rgba(6, 182, 212, 0.45)',
    particleColor: '#38bdf8',
    ambientLight: 'rgba(14, 165, 233, 0.15)',
    previewGradient: ['#06b6d4', '#ec4899'],
    points: [
      { x: 500, y: 1600, width: 200 },  // Toll Gate Start
      { x: 1150, y: 1600, width: 190 }, // Bay Bridge Viaduct
      { x: 1750, y: 1500, width: 180 },
      { x: 2200, y: 1250, width: 170 }, // Ginza Loop Overpass
      { x: 2400, y: 800, width: 170 },
      { x: 2100, y: 400, width: 180 },  // Roppongi Tunnel Entry
      { x: 1550, y: 350, width: 180 },  // Underground Tunnel Section
      { x: 1200, y: 600, width: 170 },  // Double S-curve
      { x: 1400, y: 900, width: 170 },
      { x: 1050, y: 1200, width: 170 }, // Akihabara Neon Chicanes
      { x: 650, y: 1050, width: 180 },
      { x: 380, y: 1250, width: 190 }
    ],
    obstacles: [
      { id: 'oil1', type: 'oil', x: 1900, y: 1400, radius: 28, active: true },
      { id: 'c1', type: 'cone', x: 2320, y: 650, radius: 14, vx: 0, vy: 0, angle: 0, active: true },
      { id: 'c2', type: 'cone', x: 2350, y: 680, radius: 14, vx: 0, vy: 0, angle: 0, active: true },
      { id: 'oil2', type: 'oil', x: 1350, y: 750, radius: 28, active: true },
      { id: 'rock1', type: 'rock', x: 1120, y: 1150, radius: 22, active: true }
    ],
    nitroPickups: [
      { id: 'n1', x: 1400, y: 1580, radius: 20, collected: false, respawnTimer: 0 },
      { id: 'n2', x: 1750, y: 360, radius: 20, collected: false, respawnTimer: 0 },
      { id: 'n3', x: 850, y: 1100, radius: 20, collected: false, respawnTimer: 0 }
    ]
  },
  {
    id: 'monaco_coastal',
    name: 'Monaco Coastal Riviera Pass',
    description: 'Jalan pesisir Laut Mediterania dengan tebing terjal berbatu, terowongan pegunungan, pemandangan kapal pesiar yacht, dan tikungan tusuk konde (hairpin) legendaris.',
    difficulty: 'Sulit',
    laps: 3,
    trackStyle: 'monaco',
    hasOcean: true,
    hasTunnels: true,
    bgColor: '#0284c7',          // Mediterranean azure sea
    bgPatternColor: '#0369a1',
    roadColor: '#334155',        // coastal seaside tarmac
    roadBorderColor: '#cbd5e1',
    curbColor1: '#dc2626',       // red
    curbColor2: '#ffffff',       // white
    skidMarkColor: 'rgba(15, 23, 42, 0.45)',
    particleColor: '#e0f2fe',
    ambientLight: 'rgba(56, 189, 248, 0.08)',
    previewGradient: ['#0284c7', '#38bdf8'],
    points: [
      { x: 550, y: 1550, width: 210 },  // Harbor Boulevard Start
      { x: 1250, y: 1550, width: 200 }, // Ste Devote Corner
      { x: 1850, y: 1400, width: 190 }, // Beau Rivage Hill Climb
      { x: 2300, y: 1050, width: 190 }, // Massenet Cliffside
      { x: 2100, y: 600, width: 180 },  // Casino Square
      { x: 1600, y: 400, width: 190 },  // Mirabeau Descent
      { x: 1100, y: 400, width: 190 },  // Grand Hotel Hairpin (Tightest turn)
      { x: 750, y: 650, width: 180 },   // Portier Coast Entry
      { x: 950, y: 950, width: 180 },   // Tunnel Section
      { x: 500, y: 1150, width: 190 }   // Chicane & Swimming Pool Section
    ],
    obstacles: [
      { id: 'r1', type: 'rock', x: 1600, y: 1460, radius: 24, active: true },
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
  },
  {
    id: 'desert_oasis',
    name: 'Red Rock Canyon Speedway',
    description: 'Sirkuit ngarai batu merah gurun dengan tikungan lebar bergradien tinggi (banked corners), formasi batu monolith terjal, dan lintasan tanah liat yang menantang.',
    difficulty: 'Sedang',
    laps: 3,
    trackStyle: 'desert',
    bgColor: '#d97706',          // warm red sand
    bgPatternColor: '#b45309',
    roadColor: '#78350f',        // baked canyon clay road
    roadBorderColor: '#92400e',
    curbColor1: '#f59e0b',       // yellow
    curbColor2: '#1f2937',       // black
    skidMarkColor: 'rgba(69, 26, 3, 0.5)',
    particleColor: '#fcd34d',
    ambientLight: 'rgba(245, 158, 11, 0.08)',
    previewGradient: ['#f59e0b', '#b45309'],
    points: [
      { x: 600, y: 1600, width: 220 }, // Canyon Floor Start
      { x: 1250, y: 1600, width: 210 },
      { x: 1950, y: 1500, width: 200 },
      { x: 2450, y: 1200, width: 190 }, // Big Sweeping Banked Curve
      { x: 2500, y: 700, width: 190 },
      { x: 2200, y: 350, width: 200 },  // Mesa Climb
      { x: 1500, y: 300, width: 210 },  // Natural Rock Bridge
      { x: 1050, y: 450, width: 190 },  // Canyon Squeeze
      { x: 750, y: 800, width: 190 },
      { x: 1200, y: 1000, width: 190 }, // Dry Riverbed S-Curve
      { x: 1100, y: 1300, width: 200 },
      { x: 500, y: 1250, width: 210 }
    ],
    obstacles: [
      { id: 'r1', type: 'rock', x: 2100, y: 1420, radius: 24, active: true },
      { id: 'r2', type: 'rock', x: 2380, y: 550, radius: 25, active: true },
      { id: 'oil1', type: 'oil', x: 1350, y: 320, radius: 30, active: true },
      { id: 'c1', type: 'cone', x: 1150, y: 950, radius: 14, vx: 0, vy: 0, angle: 0, active: true },
      { id: 'r3', type: 'rock', x: 920, y: 1260, radius: 26, active: true }
    ],
    nitroPickups: [
      { id: 'n1', x: 1550, y: 1580, radius: 20, collected: false, respawnTimer: 0 },
      { id: 'n2', x: 1850, y: 310, radius: 20, collected: false, respawnTimer: 0 },
      { id: 'n3', x: 900, y: 850, radius: 20, collected: false, respawnTimer: 0 }
    ]
  }
];
