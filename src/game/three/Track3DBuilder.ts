/**
 * Procedural 3D Track & Environment Builder
 * Constructs rich 3D race circuits from track path points with:
 * - 3D Ribbon Road with camber/banking, curbs, and road markings
 * - Distinct 3D Environments (Monza GP, Neon Tokyo Highway, Monaco Riviera, Red Rock Canyon)
 * - 3D Obstacles (Traffic cones, rocks, oil slicks)
 * - 3D Floating Nitro Gems
 */

import * as THREE from 'three';
import { Checkpoint, Obstacle, NitroPickup, TrackTheme } from '../../types/game';

export interface Track3DInstance {
  root: THREE.Group;
  roadMesh: THREE.Mesh;
  curbMeshes: THREE.Mesh[];
  decorations: THREE.Group;
  obstaclesMap: Map<string, THREE.Group>;
  nitroPadsMap: Map<string, THREE.Group>;
  environmentLights: THREE.Light[];
  skyMesh?: THREE.Mesh;
  waterMesh?: THREE.Mesh;
  tunnelBoundingBoxes?: THREE.Box3[];
}

export class Track3DBuilder {
  /**
   * Scale factor from 2D game coords (pixels ~0-2500) to 3D world units
   * 1 pixel ~ 0.15 meters
   */
  public static readonly SCALE = 0.14;

  public static to3D(x: number, y: number, zElevation = 0): THREE.Vector3 {
    return new THREE.Vector3(
      x * this.SCALE,
      zElevation,
      y * this.SCALE
    );
  }

  public static buildTrack(theme: TrackTheme, checkpoints: Checkpoint[]): Track3DInstance {
    const root = new THREE.Group();
    root.name = `track_${theme.id}`;

    const decorations = new THREE.Group();
    decorations.name = 'decorations';
    root.add(decorations);

    const environmentLights: THREE.Light[] = [];
    const curbMeshes: THREE.Mesh[] = [];
    const obstaclesMap = new Map<string, THREE.Group>();
    const nitroPadsMap = new Map<string, THREE.Group>();
    let waterMesh: THREE.Mesh | undefined;

    const trackStyle = theme.trackStyle || (theme.id.includes('tokyo') ? 'tokyo' : theme.id.includes('oasis') || theme.id.includes('desert') ? 'desert' : theme.id.includes('monaco') || theme.id.includes('frost') ? 'monaco' : 'monza');

    // 1. Build Smooth 3D Spline from Points
    const splinePoints: THREE.Vector3[] = [];
    const n = theme.points.length;

    for (let i = 0; i < n; i++) {
      const pt = theme.points[i];
      let elevation = 0;

      // Map-specific elevation profile
      if (trackStyle === 'monaco') {
        // Coastal mountain climbs and drops
        elevation = Math.sin((i / n) * Math.PI * 2) * 14 + (i > n * 0.4 && i < n * 0.7 ? 8 : 0);
      } else if (trackStyle === 'desert') {
        // Canyon rolling dips
        elevation = Math.cos((i / n) * Math.PI * 4) * 6;
      } else if (trackStyle === 'tokyo') {
        // Elevated overpass highway
        elevation = 7.0 + Math.sin((i / n) * Math.PI * 2) * 3;
      } else {
        // Flat Monza circuit with subtle undulations
        elevation = Math.sin((i / n) * Math.PI * 2) * 2;
      }

      splinePoints.push(this.to3D(pt.x, pt.y, elevation));
    }

    const curve = new THREE.CatmullRomCurve3(splinePoints, true, 'centripetal');
    const segments = 320;
    const sampledPoints = curve.getSpacedPoints(segments);

    // 2. Extrude Road Ribbon Mesh
    const roadWidth = (theme.points[0]?.width || 200) * this.SCALE;
    const halfWidth = roadWidth / 2;

    const roadVertices: number[] = [];
    const roadNormals: number[] = [];
    const roadUvs: number[] = [];
    const roadIndices: number[] = [];

    const curbLeftVertices: number[] = [];
    const curbRightVertices: number[] = [];
    const curbLeftIndices: number[] = [];
    const curbRightIndices: number[] = [];

    const up = new THREE.Vector3(0, 1, 0);

    for (let i = 0; i <= segments; i++) {
      const idx = i % segments;
      const pt = sampledPoints[idx];
      const nextPt = sampledPoints[(idx + 1) % segments];

      const tangent = new THREE.Vector3().subVectors(nextPt, pt).normalize();
      const normal = new THREE.Vector3().crossVectors(tangent, up).normalize();

      // Road banking on turns
      const prevIdx = (idx - 1 + segments) % segments;
      const prevPt = sampledPoints[prevIdx];
      const prevTan = new THREE.Vector3().subVectors(pt, prevPt).normalize();
      const curvature = tangent.angleTo(prevTan);
      const bankAmount = THREE.MathUtils.clamp(curvature * 1.5, -0.15, 0.15);

      const leftNormal = normal.clone().multiplyScalar(halfWidth);
      const rightNormal = normal.clone().multiplyScalar(-halfWidth);

      const pLeft = pt.clone().add(leftNormal);
      const pRight = pt.clone().add(rightNormal);

      pLeft.y += bankAmount * halfWidth;
      pRight.y -= bankAmount * halfWidth;

      // Road Vertices (Center, Left, Right)
      const baseVIdx = i * 2;
      roadVertices.push(pLeft.x, pLeft.y, pLeft.z);
      roadVertices.push(pRight.x, pRight.y, pRight.z);

      roadNormals.push(0, 1, 0, 0, 1, 0);
      roadUvs.push(0, i * 0.25, 1, i * 0.25);

      if (i < segments) {
        roadIndices.push(
          baseVIdx, baseVIdx + 1, baseVIdx + 2,
          baseVIdx + 1, baseVIdx + 3, baseVIdx + 2
        );
      }

      // Curbs (Ribbons on left and right)
      const curbW = 1.2;
      const curbH = 0.18;

      const cLeftOuter = pLeft.clone().add(normal.clone().multiplyScalar(curbW));
      cLeftOuter.y += curbH;
      const cRightOuter = pRight.clone().add(normal.clone().multiplyScalar(-curbW));
      cRightOuter.y += curbH;

      const cIdx = i * 2;
      curbLeftVertices.push(pLeft.x, pLeft.y, pLeft.z);
      curbLeftVertices.push(cLeftOuter.x, cLeftOuter.y, cLeftOuter.z);

      curbRightVertices.push(pRight.x, pRight.y, pRight.z);
      curbRightVertices.push(cRightOuter.x, cRightOuter.y, cRightOuter.z);

      if (i < segments) {
        curbLeftIndices.push(cIdx, cIdx + 1, cIdx + 2, cIdx + 1, cIdx + 3, cIdx + 2);
        curbRightIndices.push(cIdx, cIdx + 1, cIdx + 2, cIdx + 1, cIdx + 3, cIdx + 2);
      }
    }

    // Road Geometry & Material
    const roadGeo = new THREE.BufferGeometry();
    roadGeo.setAttribute('position', new THREE.Float32BufferAttribute(roadVertices, 3));
    roadGeo.setAttribute('normal', new THREE.Float32BufferAttribute(roadNormals, 3));
    roadGeo.setAttribute('uv', new THREE.Float32BufferAttribute(roadUvs, 2));
    roadGeo.setIndex(roadIndices);
    roadGeo.computeVertexNormals();

    const roadMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(theme.roadColor || '#27272a'),
      metalness: 0.15,
      roughness: trackStyle === 'tokyo' ? 0.25 : 0.75, // Tokyo is wet & glossy
      polygonOffset: true,
      polygonOffsetFactor: -1,
      polygonOffsetUnits: -1
    });

    const roadMesh = new THREE.Mesh(roadGeo, roadMat);
    roadMesh.receiveShadow = true;
    root.add(roadMesh);

    // Curbs Material (Alternating Red/White or Pink/Cyan for Tokyo)
    const curbMat1 = new THREE.MeshStandardMaterial({
      color: new THREE.Color(theme.curbColor1 || '#ef4444'),
      roughness: 0.6
    });

    const curbLeftGeo = new THREE.BufferGeometry();
    curbLeftGeo.setAttribute('position', new THREE.Float32BufferAttribute(curbLeftVertices, 3));
    curbLeftGeo.setIndex(curbLeftIndices);
    curbLeftGeo.computeVertexNormals();
    const curbLeftMesh = new THREE.Mesh(curbLeftGeo, curbMat1);
    root.add(curbLeftMesh);
    curbMeshes.push(curbLeftMesh);

    const curbRightGeo = new THREE.BufferGeometry();
    curbRightGeo.setAttribute('position', new THREE.Float32BufferAttribute(curbRightVertices, 3));
    curbRightGeo.setIndex(curbRightIndices);
    curbRightGeo.computeVertexNormals();
    const curbRightMesh = new THREE.Mesh(curbRightGeo, curbMat1);
    root.add(curbRightMesh);
    curbMeshes.push(curbRightMesh);

    // 3. Ground Terrain Mesh
    const terrainGeo = new THREE.PlaneGeometry(800, 800, 48, 48);
    terrainGeo.rotateX(-Math.PI / 2);

    let groundColor = 0x15803d; // Monza lush grass
    let groundRoughness = 0.9;

    if (trackStyle === 'tokyo') {
      groundColor = 0x050811; // Deep dark bay water
      groundRoughness = 0.15;
    } else if (trackStyle === 'desert') {
      groundColor = 0xd97706; // Red rock sand
      groundRoughness = 0.95;
    } else if (trackStyle === 'monaco') {
      groundColor = 0x0369a1; // Mediterranean blue
      groundRoughness = 0.2;
    }

    const terrainMat = new THREE.MeshStandardMaterial({
      color: groundColor,
      roughness: groundRoughness,
      metalness: trackStyle === 'tokyo' || trackStyle === 'monaco' ? 0.4 : 0.05
    });

    const terrainMesh = new THREE.Mesh(terrainGeo, terrainMat);
    terrainMesh.position.set(160, -0.4, 160);
    terrainMesh.receiveShadow = true;
    root.add(terrainMesh);

    if (trackStyle === 'monaco' || trackStyle === 'tokyo') {
      waterMesh = terrainMesh;
    }

    // 4. Build Detailed Scenery by Track Style
    switch (trackStyle) {
      case 'monza':
        this.buildMonzaScenery(decorations, sampledPoints, environmentLights);
        break;
      case 'tokyo':
        this.buildTokyoScenery(decorations, sampledPoints, environmentLights);
        break;
      case 'monaco':
        this.buildMonacoScenery(decorations, sampledPoints, environmentLights);
        break;
      case 'desert':
      default:
        this.buildDesertScenery(decorations, sampledPoints, environmentLights);
        break;
    }

    // 5. Build 3D Obstacles
    for (const obs of theme.obstacles) {
      const obsGroup = this.create3DObstacle(obs);
      root.add(obsGroup);
      obstaclesMap.set(obs.id, obsGroup);
    }

    // 6. Build 3D Floating Nitro Pads
    for (const nitro of theme.nitroPickups) {
      const nitroGroup = this.create3DNitroPad(nitro);
      root.add(nitroGroup);
      nitroPadsMap.set(nitro.id, nitroGroup);
    }

    // 7. Start / Finish Line Banner Gantry
    if (sampledPoints.length > 0) {
      const startPt = sampledPoints[0];
      const gantry = this.buildStartFinishGantry(startPt, theme.name);
      decorations.add(gantry);
    }

    return {
      root,
      roadMesh,
      curbMeshes,
      decorations,
      obstaclesMap,
      nitroPadsMap,
      environmentLights,
      waterMesh
    };
  }

  /**
   * Monza GP: Grandstands, pit buildings, red/white tire walls, cypress trees, distance hills
   */
  private static buildMonzaScenery(
    group: THREE.Group,
    points: THREE.Vector3[],
    lights: THREE.Light[]
  ) {
    // Grandstand along start straight
    const grandstand = new THREE.Group();
    const standGeo = new THREE.BoxGeometry(45, 12, 14);
    const standMat = new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.8 });
    const standMesh = new THREE.Mesh(standGeo, standMat);
    standMesh.position.set(points[0].x - 22, 6, points[0].z - 28);
    standMesh.castShadow = true;
    grandstand.add(standMesh);

    // Colorful crowd texture block
    const crowdGeo = new THREE.BoxGeometry(43, 6, 12);
    const crowdMat = new THREE.MeshStandardMaterial({ color: 0xdc2626, roughness: 0.9 });
    const crowd = new THREE.Mesh(crowdGeo, crowdMat);
    crowd.position.set(points[0].x - 22, 10, points[0].z - 28);
    grandstand.add(crowd);

    // Grandstand Roof Canopy
    const roofGeo = new THREE.BoxGeometry(48, 1, 18);
    const roofMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.4 });
    const roof = new THREE.Mesh(roofGeo, roofMat);
    roof.position.set(points[0].x - 22, 14, points[0].z - 26);
    grandstand.add(roof);

    group.add(grandstand);

    // Trees scattered along track borders
    const treeGeo = new THREE.ConeGeometry(3.5, 9, 8);
    const trunkGeo = new THREE.CylinderGeometry(0.6, 0.8, 3, 6);
    const leafMat = new THREE.MeshStandardMaterial({ color: 0x166534, roughness: 0.9 });
    const trunkMat = new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.9 });

    for (let i = 0; i < points.length; i += 8) {
      const pt = points[i];
      const offsetSide = (i % 16 === 0 ? 1 : -1) * (20 + Math.random() * 18);
      const treeGroup = new THREE.Group();

      const leaves = new THREE.Mesh(treeGeo, leafMat);
      leaves.position.y = 6.5;
      leaves.castShadow = true;
      treeGroup.add(leaves);

      const trunk = new THREE.Mesh(trunkGeo, trunkMat);
      trunk.position.y = 1.5;
      trunk.castShadow = true;
      treeGroup.add(trunk);

      treeGroup.position.set(pt.x + offsetSide, pt.y, pt.z + (Math.random() - 0.5) * 10);
      group.add(treeGroup);
    }
  }

  /**
   * Tokyo Expressway: High-rise skyscrapers with glowing windows, neon signs, viaduct pillars
   */
  private static buildTokyoScenery(
    group: THREE.Group,
    points: THREE.Vector3[],
    lights: THREE.Light[]
  ) {
    // 1. Viaduct Concrete Pillars under elevated highway
    const pillarGeo = new THREE.CylinderGeometry(1.6, 1.8, 12, 12);
    const pillarMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.8 });

    for (let i = 0; i < points.length; i += 12) {
      const pt = points[i];
      const pillar = new THREE.Mesh(pillarGeo, pillarMat);
      pillar.position.set(pt.x, (pt.y - 6) / 2, pt.z);
      group.add(pillar);
    }

    // 2. Tokyo Skyline Skyscrapers
    const towerMat1 = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      metalness: 0.8,
      roughness: 0.3
    });
    const neonCyanMat = new THREE.MeshStandardMaterial({
      color: 0x06b6d4,
      emissive: 0x06b6d4,
      emissiveIntensity: 3.0
    });
    const neonPinkMat = new THREE.MeshStandardMaterial({
      color: 0xec4899,
      emissive: 0xec4899,
      emissiveIntensity: 3.0
    });

    for (let i = 0; i < 28; i++) {
      const h = 45 + Math.random() * 80;
      const w = 18 + Math.random() * 22;
      const towerGeo = new THREE.BoxGeometry(w, h, w);
      const tower = new THREE.Mesh(towerGeo, towerMat1);

      const angle = (i / 28) * Math.PI * 2;
      const dist = 130 + Math.random() * 120;
      tower.position.set(160 + Math.cos(angle) * dist, h / 2 - 5, 160 + Math.sin(angle) * dist);
      group.add(tower);

      // Rooftop Neon Strip / Antenna
      const neonGeo = new THREE.BoxGeometry(w * 0.9, 1.5, w * 0.9);
      const neonMesh = new THREE.Mesh(neonGeo, i % 2 === 0 ? neonCyanMat : neonPinkMat);
      neonMesh.position.set(tower.position.x, h - 4, tower.position.z);
      group.add(neonMesh);
    }

    // Overhead highway lighting
    for (let i = 0; i < points.length; i += 24) {
      const pt = points[i];
      const streetLight = new THREE.PointLight(0x38bdf8, 3.5, 45);
      streetLight.position.set(pt.x, pt.y + 7, pt.z);
      group.add(streetLight);
      lights.push(streetLight);
    }
  }

  /**
   * Monaco Riviera: Cliff faces, coastal rocks, rock tunnel, luxury palm trees
   */
  private static buildMonacoScenery(
    group: THREE.Group,
    points: THREE.Vector3[],
    lights: THREE.Light[]
  ) {
    // Massive Rock Cliffs along one side
    const cliffMat = new THREE.MeshStandardMaterial({ color: 0x78716c, roughness: 0.95 });
    for (let i = 0; i < 16; i++) {
      const cliffGeo = new THREE.DodecahedronGeometry(22 + Math.random() * 18, 1);
      const cliff = new THREE.Mesh(cliffGeo, cliffMat);
      cliff.scale.set(1.4, 2.0, 1.4);
      cliff.position.set(220 + Math.cos(i) * 90, 20, 80 + Math.sin(i) * 90);
      cliff.castShadow = true;
      group.add(cliff);
    }

    // Palm Trees along coastal boulevard
    const trunkGeo = new THREE.CylinderGeometry(0.35, 0.55, 8, 8);
    const palmMat = new THREE.MeshStandardMaterial({ color: 0xa8a29e, roughness: 0.9 });
    const leafMat = new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.7 });

    for (let i = 0; i < points.length; i += 10) {
      const pt = points[i];
      const palm = new THREE.Group();

      const trunk = new THREE.Mesh(trunkGeo, palmMat);
      trunk.position.y = 4;
      trunk.rotation.z = (Math.random() - 0.5) * 0.2;
      palm.add(trunk);

      // Fronds
      for (let f = 0; f < 6; f++) {
        const frondGeo = new THREE.BoxGeometry(0.4, 0.1, 4.5);
        const frond = new THREE.Mesh(frondGeo, leafMat);
        frond.position.set(0, 8, 0);
        frond.rotation.y = (f * Math.PI) / 3;
        frond.rotation.x = 0.45;
        palm.add(frond);
      }

      palm.position.set(pt.x + 14, pt.y, pt.z + 14);
      group.add(palm);
    }
  }

  /**
   * Red Rock Canyon: Towering sandstone buttes, canyon monoliths, desert cactus
   */
  private static buildDesertScenery(
    group: THREE.Group,
    points: THREE.Vector3[],
    lights: THREE.Light[]
  ) {
    const canyonMat = new THREE.MeshStandardMaterial({
      color: 0x9a3412, // Burnt orange red rock
      roughness: 0.95
    });

    for (let i = 0; i < 22; i++) {
      const h = 28 + Math.random() * 45;
      const w = 24 + Math.random() * 32;
      const butteGeo = new THREE.CylinderGeometry(w * 0.7, w, h, 8);
      const butte = new THREE.Mesh(butteGeo, canyonMat);

      const angle = (i / 22) * Math.PI * 2;
      const dist = 110 + Math.random() * 110;
      butte.position.set(160 + Math.cos(angle) * dist, h / 2 - 2, 160 + Math.sin(angle) * dist);
      butte.castShadow = true;
      group.add(butte);
    }

    // Cactus models
    const cactusGeo = new THREE.CylinderGeometry(0.35, 0.35, 4.5, 8);
    const cactusMat = new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.85 });

    for (let i = 0; i < points.length; i += 14) {
      const pt = points[i];
      const cactus = new THREE.Mesh(cactusGeo, cactusMat);
      cactus.position.set(pt.x + (i % 2 === 0 ? 18 : -18), pt.y + 2.2, pt.z + 5);
      group.add(cactus);
    }
  }

  /**
   * 3D Obstacle Factory
   */
  private static create3DObstacle(obs: Obstacle): THREE.Group {
    const group = new THREE.Group();
    group.name = `obstacle_${obs.id}`;
    const pos = this.to3D(obs.x, obs.y, 0);
    group.position.copy(pos);

    if (obs.type === 'cone') {
      // 3D Traffic Cone (Orange with reflective white stripe)
      const coneGeo = new THREE.ConeGeometry(0.32, 0.82, 12);
      const coneMat = new THREE.MeshStandardMaterial({
        color: 0xf97316,
        roughness: 0.4
      });
      const coneMesh = new THREE.Mesh(coneGeo, coneMat);
      coneMesh.position.y = 0.41;
      coneMesh.castShadow = true;
      group.add(coneMesh);

      // Reflective Band
      const bandGeo = new THREE.CylinderGeometry(0.22, 0.25, 0.2, 12);
      const bandMat = new THREE.MeshStandardMaterial({
        color: 0xffffff,
        roughness: 0.15
      });
      const band = new THREE.Mesh(bandGeo, bandMat);
      band.position.y = 0.38;
      group.add(band);

      // Base
      const baseGeo = new THREE.BoxGeometry(0.75, 0.06, 0.75);
      const base = new THREE.Mesh(baseGeo, coneMat);
      base.position.y = 0.03;
      group.add(base);
    } else if (obs.type === 'rock') {
      // 3D Bolder / Rock
      const rockGeo = new THREE.DodecahedronGeometry(0.75, 1);
      const rockMat = new THREE.MeshStandardMaterial({
        color: 0x57534e,
        roughness: 0.95
      });
      const rockMesh = new THREE.Mesh(rockGeo, rockMat);
      rockMesh.position.y = 0.55;
      rockMesh.scale.set(1.2, 0.9, 1.1);
      rockMesh.castShadow = true;
      group.add(rockMesh);
    } else {
      // 3D Oil Slick (Glossy puddle)
      const oilGeo = new THREE.CircleGeometry(1.6, 16);
      oilGeo.rotateX(-Math.PI / 2);
      const oilMat = new THREE.MeshStandardMaterial({
        color: 0x09090b,
        metalness: 0.9,
        roughness: 0.05
      });
      const oilMesh = new THREE.Mesh(oilGeo, oilMat);
      oilMesh.position.y = 0.02;
      group.add(oilMesh);
    }

    return group;
  }

  /**
   * 3D Floating Nitro Pad
   */
  private static create3DNitroPad(nitro: NitroPickup): THREE.Group {
    const group = new THREE.Group();
    group.name = `nitro_${nitro.id}`;
    const pos = this.to3D(nitro.x, nitro.y, 0.8);
    group.position.copy(pos);

    // Glowing Octahedron Crystal
    const gemGeo = new THREE.OctahedronGeometry(0.65, 0);
    const gemMat = new THREE.MeshStandardMaterial({
      color: 0x06b6d4,
      emissive: 0x0284c7,
      emissiveIntensity: 2.5,
      metalness: 0.8,
      roughness: 0.1
    });
    const gemMesh = new THREE.Mesh(gemGeo, gemMat);
    group.add(gemMesh);

    // Point Light Aura
    const light = new THREE.PointLight(0x38bdf8, 2.5, 8);
    group.add(light);

    // Ground Ring Decal
    const ringGeo = new THREE.RingGeometry(0.9, 1.15, 24);
    ringGeo.rotateX(-Math.PI / 2);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      side: THREE.DoubleSide
    });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.position.y = -0.75;
    group.add(ring);

    return group;
  }

  /**
   * Start / Finish Gantry with Overhead Timer & Chequered Pattern
   */
  private static buildStartFinishGantry(pt: THREE.Vector3, trackName: string): THREE.Group {
    const gantry = new THREE.Group();
    gantry.position.copy(pt);

    const metalMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.8, roughness: 0.3 });
    const postGeo = new THREE.BoxGeometry(0.8, 8, 0.8);

    // Left and Right Posts
    const leftPost = new THREE.Mesh(postGeo, metalMat);
    leftPost.position.set(16, 4, 0);
    gantry.add(leftPost);

    const rightPost = new THREE.Mesh(postGeo, metalMat);
    rightPost.position.set(-16, 4, 0);
    gantry.add(rightPost);

    // Overhead Truss Bar
    const barGeo = new THREE.BoxGeometry(33, 1.4, 1.2);
    const bar = new THREE.Mesh(barGeo, metalMat);
    bar.position.set(0, 8, 0);
    gantry.add(bar);

    // Banner Plate
    const bannerGeo = new THREE.BoxGeometry(18, 2.4, 0.2);
    const bannerMat = new THREE.MeshStandardMaterial({
      color: 0x0284c7,
      emissive: 0x0369a1,
      emissiveIntensity: 0.8
    });
    const banner = new THREE.Mesh(bannerGeo, bannerMat);
    banner.position.set(0, 8, 0.6);
    gantry.add(banner);

    return gantry;
  }
}
