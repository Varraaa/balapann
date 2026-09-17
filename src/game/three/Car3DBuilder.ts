/**
 * Procedural 3D Supercar Mesh Builder
 * Constructs authentic, detailed 3D models for:
 * - Lamborghini (Aventador SVJ / Huracán - sharp wedge, Y-lights, massive wing)
 * - Ferrari (488 Pista - sculpted curves, S-duct, quad taillights)
 * - McLaren (720S - teardrop canopy, dihedral curve, high exhausts)
 * - Porsche (911 GT3 RS - iconic round lights, wide rear hips, swan-neck wing)
 * - Bugatti (Chiron - horseshoe grille, sweeping C-line contour, W16 quad exhausts)
 * - Mazda RX-7 Rotary (FD3S - pop-ups, sleek 90s JDM curves, single big-bore cannon)
 */

import * as THREE from 'three';
import { Car3DModelType, CarStats } from '../../types/game';

export interface Car3DInstance {
  root: THREE.Group;
  bodyMesh: THREE.Mesh;
  wheels: {
    frontLeft: THREE.Group;
    frontRight: THREE.Group;
    rearLeft: THREE.Group;
    rearRight: THREE.Group;
  };
  brakeDiscs: THREE.Mesh[];
  headlights: THREE.SpotLight[];
  headlightLens: THREE.Mesh[];
  taillightMesh: THREE.Mesh;
  exhaustPipes: THREE.Vector3[];
  backfireLight: THREE.PointLight;
  nitroFlameMesh: THREE.Mesh;
}

export class Car3DBuilder {
  /**
   * Creates a detailed 3D car instance
   */
  public static createCar(carStats: CarStats): Car3DInstance {
    const root = new THREE.Group();
    root.name = `car_${carStats.id}`;

    const modelType = carStats.model3D || 'lamborghini';
    const primaryColor = new THREE.Color(carStats.bodyColor);
    const accentColor = new THREE.Color(carStats.accentColor || '#111827');
    const wheelColor = new THREE.Color(carStats.wheelColor || '#1e293b');
    const glassColor = new THREE.Color(carStats.glassColor || '#0f172a');

    // Materials
    const bodyMaterial = new THREE.MeshStandardMaterial({
      color: primaryColor,
      metalness: 0.82,
      roughness: 0.22,
      envMapIntensity: 1.2
    });

    const carbonMaterial = new THREE.MeshStandardMaterial({
      color: accentColor,
      metalness: 0.35,
      roughness: 0.45
    });

    const glassMaterial = new THREE.MeshPhysicalMaterial({
      color: glassColor,
      metalness: 0.1,
      roughness: 0.08,
      transparent: true,
      opacity: 0.65,
      transmission: 0.6,
      ior: 1.5
    });

    const chromeMaterial = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      metalness: 0.95,
      roughness: 0.1
    });

    const tireMaterial = new THREE.MeshStandardMaterial({
      color: 0x18181b,
      metalness: 0.1,
      roughness: 0.85
    });

    const brakeDiscMaterial = new THREE.MeshStandardMaterial({
      color: 0x888888,
      metalness: 0.9,
      roughness: 0.25,
      emissive: 0x000000
    });

    const brakeDiscs: THREE.Mesh[] = [];

    // Helper to build a wheel with rim and brake caliper
    const createWheel = (isFront: boolean, isLeft: boolean): THREE.Group => {
      const wheelGroup = new THREE.Group();

      // Tire
      const tireGeo = new THREE.CylinderGeometry(0.36, 0.36, 0.26, 20);
      tireGeo.rotateZ(Math.PI / 2);
      const tireMesh = new THREE.Mesh(tireGeo, tireMaterial);
      tireMesh.castShadow = true;
      wheelGroup.add(tireMesh);

      // Rim outer lip
      const rimGeo = new THREE.CylinderGeometry(0.25, 0.25, 0.27, 16);
      rimGeo.rotateZ(Math.PI / 2);
      const rimMesh = new THREE.Mesh(
        rimGeo,
        new THREE.MeshStandardMaterial({
          color: wheelColor,
          metalness: 0.9,
          roughness: 0.2
        })
      );
      wheelGroup.add(rimMesh);

      // Spokes (5 twin-spoke pattern)
      for (let s = 0; s < 5; s++) {
        const angle = (s * Math.PI * 2) / 5;
        const spokeGeo = new THREE.BoxGeometry(0.04, 0.22, 0.03);
        const spokeMesh = new THREE.Mesh(spokeGeo, chromeMaterial);
        spokeMesh.position.set((isLeft ? 0.13 : -0.13), Math.sin(angle) * 0.11, Math.cos(angle) * 0.11);
        spokeMesh.rotation.x = angle;
        wheelGroup.add(spokeMesh);
      }

      // Brake Disc
      const discGeo = new THREE.CylinderGeometry(0.20, 0.20, 0.03, 16);
      discGeo.rotateZ(Math.PI / 2);
      const discMesh = new THREE.Mesh(discGeo, brakeDiscMaterial.clone());
      discMesh.position.x = isLeft ? 0.05 : -0.05;
      wheelGroup.add(discMesh);
      brakeDiscs.push(discMesh);

      // Red Brake Caliper
      const caliperGeo = new THREE.BoxGeometry(0.06, 0.12, 0.09);
      const caliperMesh = new THREE.Mesh(
        caliperGeo,
        new THREE.MeshStandardMaterial({
          color: 0xef4444,
          metalness: 0.6,
          roughness: 0.3
        })
      );
      caliperMesh.position.set(isLeft ? 0.06 : -0.06, 0.11, 0);
      wheelGroup.add(caliperMesh);

      return wheelGroup;
    };

    // Build specific car body based on model type
    let mainBodyMesh: THREE.Mesh;
    const exhaustPipes: THREE.Vector3[] = [];

    switch (modelType) {
      case 'lamborghini': {
        // --- LAMBORGHINI AVENTADOR / HURACAN ---
        // Ultra-sharp angular wedge styling
        mainBodyMesh = this.buildLamborghiniBody(bodyMaterial, carbonMaterial, glassMaterial, exhaustPipes);
        break;
      }
      case 'ferrari': {
        // --- FERRARI 488 PISTA / LAFERRARI ---
        // Sculpted aerodynamic curves & S-Duct channel
        mainBodyMesh = this.buildFerrariBody(bodyMaterial, carbonMaterial, glassMaterial, exhaustPipes);
        break;
      }
      case 'mclaren': {
        // --- MCLAREN 720S / P1 ---
        // Teardrop curved canopy & high top exhaust
        mainBodyMesh = this.buildMcLarenBody(bodyMaterial, carbonMaterial, glassMaterial, exhaustPipes);
        break;
      }
      case 'porsche': {
        // --- PORSCHE 911 GT3 RS ---
        // Iconic teardrop fastback & massive swan-neck wing
        mainBodyMesh = this.buildPorscheBody(bodyMaterial, carbonMaterial, glassMaterial, exhaustPipes);
        break;
      }
      case 'bugatti': {
        // --- BUGATTI CHIRON SUPER SPORT ---
        // Signature horseshoe grille & C-Line contour
        mainBodyMesh = this.buildBugattiBody(bodyMaterial, carbonMaterial, glassMaterial, exhaustPipes);
        break;
      }
      case 'rx7':
      default: {
        // --- MAZDA RX-7 FD3S ROTARY ---
        // Sleek 90s JDM flowing body with pop-up housing
        mainBodyMesh = this.buildRX7Body(bodyMaterial, carbonMaterial, glassMaterial, exhaustPipes);
        break;
      }
    }

    root.add(mainBodyMesh);

    // 4 Wheels
    const frontTrack = 0.96;
    const rearTrack = 0.98;
    const wheelbase = 1.35;
    const wheelY = 0.35;

    const frontLeft = createWheel(true, true);
    frontLeft.position.set(frontTrack, wheelY, wheelbase);

    const frontRight = createWheel(true, false);
    frontRight.position.set(-frontTrack, wheelY, wheelbase);

    const rearLeft = createWheel(false, true);
    rearLeft.position.set(rearTrack, wheelY, -wheelbase);

    const rearRight = createWheel(false, false);
    rearRight.position.set(-rearTrack, wheelY, -wheelbase);

    root.add(frontLeft);
    root.add(frontRight);
    root.add(rearLeft);
    root.add(rearRight);

    // Functional Headlights (Projectors + Spotlights)
    const headlights: THREE.SpotLight[] = [];
    const headlightLens: THREE.Mesh[] = [];

    const leftSpot = new THREE.SpotLight(0xffffff, 4.5, 45, Math.PI / 6, 0.45, 1.2);
    leftSpot.position.set(0.65, 0.52, 2.2);
    leftSpot.target.position.set(0.65, 0.2, 12.0);
    root.add(leftSpot);
    root.add(leftSpot.target);
    headlights.push(leftSpot);

    const rightSpot = new THREE.SpotLight(0xffffff, 4.5, 45, Math.PI / 6, 0.45, 1.2);
    rightSpot.position.set(-0.65, 0.52, 2.2);
    rightSpot.target.position.set(-0.65, 0.2, 12.0);
    root.add(rightSpot);
    root.add(rightSpot.target);
    headlights.push(rightSpot);

    // Glowing LED Headlight Glass
    const lensGeo = new THREE.BoxGeometry(0.24, 0.08, 0.04);
    const lensMat = new THREE.MeshStandardMaterial({
      color: 0xe0f2fe,
      emissive: 0x93c5fd,
      emissiveIntensity: 3.0
    });
    const leftLens = new THREE.Mesh(lensGeo, lensMat);
    leftLens.position.set(0.65, 0.52, 2.25);
    leftLens.rotation.y = -0.15;
    root.add(leftLens);
    headlightLens.push(leftLens);

    const rightLens = new THREE.Mesh(lensGeo, lensMat);
    rightLens.position.set(-0.65, 0.52, 2.25);
    rightLens.rotation.y = 0.15;
    root.add(rightLens);
    headlightLens.push(rightLens);

    // Rear Taillight Strip / Glow
    const tailMat = new THREE.MeshStandardMaterial({
      color: 0xef4444,
      emissive: 0xdc2626,
      emissiveIntensity: 2.2
    });
    const tailGeo = new THREE.BoxGeometry(1.6, 0.08, 0.06);
    const taillightMesh = new THREE.Mesh(tailGeo, tailMat);
    taillightMesh.position.set(0, 0.62, -2.25);
    root.add(taillightMesh);

    // Backfire Light Source
    const backfireLight = new THREE.PointLight(0xf97316, 0, 8);
    const primaryExhaust = exhaustPipes[0] || new THREE.Vector3(0, 0.45, -2.35);
    backfireLight.position.copy(primaryExhaust);
    root.add(backfireLight);

    // 3D Nitro Flame Jet Mesh
    const nitroGeo = new THREE.ConeGeometry(0.18, 0.9, 12);
    nitroGeo.rotateX(-Math.PI / 2);
    const nitroMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0
    });
    const nitroFlameMesh = new THREE.Mesh(nitroGeo, nitroMat);
    nitroFlameMesh.position.copy(primaryExhaust).add(new THREE.Vector3(0, 0, -0.45));
    root.add(nitroFlameMesh);

    return {
      root,
      bodyMesh: mainBodyMesh,
      wheels: {
        frontLeft,
        frontRight,
        rearLeft,
        rearRight
      },
      brakeDiscs,
      headlights,
      headlightLens,
      taillightMesh,
      exhaustPipes,
      backfireLight,
      nitroFlameMesh
    };
  }

  /**
   * Lamborghini Aventador SVJ Style:
   * Sharp angular wedge front, hexagonal vents, Y-shaped intake, massive GT wing
   */
  private static buildLamborghiniBody(
    bodyMat: THREE.Material,
    carbonMat: THREE.Material,
    glassMat: THREE.Material,
    exhausts: THREE.Vector3[]
  ): THREE.Mesh {
    const group = new THREE.Group();

    // 1. Lower Wedge Chassis
    const lowerGeo = new THREE.BoxGeometry(1.88, 0.38, 4.4);
    const lowerMesh = new THREE.Mesh(lowerGeo, bodyMat);
    lowerMesh.position.y = 0.42;
    lowerMesh.castShadow = true;
    group.add(lowerMesh);

    // 2. Sharp Nose Wedge
    const noseGeo = new THREE.ConeGeometry(0.95, 1.2, 4);
    noseGeo.rotateY(Math.PI / 4);
    noseGeo.rotateX(-Math.PI / 2);
    const noseMesh = new THREE.Mesh(noseGeo, bodyMat);
    noseMesh.scale.set(1.9, 0.32, 1.0);
    noseMesh.position.set(0, 0.40, 2.3);
    noseMesh.castShadow = true;
    group.add(noseMesh);

    // 3. Cabin Greenhouse (Angular Stealth Fighter Canopy)
    const cabinGeo = new THREE.BoxGeometry(1.42, 0.48, 1.9);
    const cabinMesh = new THREE.Mesh(cabinGeo, glassMat);
    cabinMesh.position.set(0, 0.82, -0.15);
    group.add(cabinMesh);

    // Roof Panel
    const roofGeo = new THREE.BoxGeometry(1.24, 0.05, 1.3);
    const roofMesh = new THREE.Mesh(roofGeo, bodyMat);
    roofMesh.position.set(0, 1.08, -0.2);
    group.add(roofMesh);

    // 4. Side Air Intakes (Massive hexagonal scoops)
    for (const side of [-1, 1]) {
      const scoopGeo = new THREE.BoxGeometry(0.18, 0.32, 0.8);
      const scoopMesh = new THREE.Mesh(scoopGeo, carbonMat);
      scoopMesh.position.set(side * 0.96, 0.52, -0.6);
      group.add(scoopMesh);
    }

    // 5. Massive SVJ Rear Wing & Swan-neck Mounts
    const wingGeo = new THREE.BoxGeometry(1.92, 0.04, 0.38);
    const wingMesh = new THREE.Mesh(wingGeo, carbonMat);
    wingMesh.position.set(0, 1.15, -2.05);
    wingMesh.castShadow = true;
    group.add(wingMesh);

    // Endplates
    for (const side of [-1, 1]) {
      const endGeo = new THREE.BoxGeometry(0.03, 0.22, 0.42);
      const endMesh = new THREE.Mesh(endGeo, carbonMat);
      endMesh.position.set(side * 0.95, 1.15, -2.05);
      group.add(endMesh);
    }

    // Wing uprights
    const uprightGeo = new THREE.BoxGeometry(0.04, 0.45, 0.12);
    for (const side of [-0.42, 0.42]) {
      const upright = new THREE.Mesh(uprightGeo, carbonMat);
      upright.position.set(side, 0.88, -1.95);
      group.add(upright);
    }

    // High Center Dual Exhausts
    exhausts.push(new THREE.Vector3(-0.16, 0.62, -2.28));
    exhausts.push(new THREE.Vector3(0.16, 0.62, -2.28));

    const pipeGeo = new THREE.CylinderGeometry(0.08, 0.08, 0.12, 12);
    pipeGeo.rotateX(Math.PI / 2);
    const pipe1 = new THREE.Mesh(pipeGeo, carbonMat);
    pipe1.position.copy(exhausts[0]);
    group.add(pipe1);
    const pipe2 = new THREE.Mesh(pipeGeo, carbonMat);
    pipe2.position.copy(exhausts[1]);
    group.add(pipe2);

    return group as unknown as THREE.Mesh;
  }

  /**
   * Ferrari 488 Pista / LaFerrari Style:
   * Smooth aerodynamic curves, S-duct front hood depression, sculpted side air dams, quad round taillights
   */
  private static buildFerrariBody(
    bodyMat: THREE.Material,
    carbonMat: THREE.Material,
    glassMat: THREE.Material,
    exhausts: THREE.Vector3[]
  ): THREE.Mesh {
    const group = new THREE.Group();

    // 1. Curvaceous Main Body
    const bodyGeo = new THREE.BoxGeometry(1.85, 0.38, 4.3);
    const bodyMesh = new THREE.Mesh(bodyGeo, bodyMat);
    bodyMesh.position.y = 0.42;
    bodyMesh.castShadow = true;
    group.add(bodyMesh);

    // 2. Sculpted S-Duct Nose (Depressed center airflow channel)
    const noseGeo = new THREE.BoxGeometry(1.7, 0.28, 1.1);
    const noseMesh = new THREE.Mesh(noseGeo, bodyMat);
    noseMesh.position.set(0, 0.38, 2.15);
    group.add(noseMesh);

    // Carbon Front Splitter
    const splitGeo = new THREE.BoxGeometry(1.82, 0.04, 0.4);
    const splitter = new THREE.Mesh(splitGeo, carbonMat);
    splitter.position.set(0, 0.22, 2.45);
    group.add(splitter);

    // 3. Rounded Tear-drop Cabin
    const cabinGeo = new THREE.SphereGeometry(0.85, 16, 12);
    cabinGeo.scale(0.82, 0.55, 1.4);
    const cabinMesh = new THREE.Mesh(cabinGeo, glassMat);
    cabinMesh.position.set(0, 0.82, -0.1);
    group.add(cabinMesh);

    // 4. Scuderia Racing Stripe (White & Navy Center Stripe)
    const stripeMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.3 });
    const stripeGeo = new THREE.BoxGeometry(0.18, 0.02, 4.4);
    const stripeMesh = new THREE.Mesh(stripeGeo, stripeMat);
    stripeMesh.position.set(0, 0.62, 0);
    group.add(stripeMesh);

    // 5. Rear Integrated Ducktail Spoiler
    const spoilerGeo = new THREE.BoxGeometry(1.75, 0.12, 0.25);
    const spoilerMesh = new THREE.Mesh(spoilerGeo, carbonMat);
    spoilerMesh.position.set(0, 0.74, -2.15);
    group.add(spoilerMesh);

    // Exhausts (Dual Outboard Cannons)
    exhausts.push(new THREE.Vector3(-0.45, 0.44, -2.25));
    exhausts.push(new THREE.Vector3(0.45, 0.44, -2.25));

    const pipeGeo = new THREE.CylinderGeometry(0.075, 0.075, 0.12, 12);
    pipeGeo.rotateX(Math.PI / 2);
    for (const ex of exhausts) {
      const p = new THREE.Mesh(pipeGeo, carbonMat);
      p.position.copy(ex);
      group.add(p);
    }

    return group as unknown as THREE.Mesh;
  }

  /**
   * McLaren 720S / P1 Style:
   * Teardrop shaped canopy, eye-socket headlights, dramatic curved roof scoop, active rear wing
   */
  private static buildMcLarenBody(
    bodyMat: THREE.Material,
    carbonMat: THREE.Material,
    glassMat: THREE.Material,
    exhausts: THREE.Vector3[]
  ): THREE.Mesh {
    const group = new THREE.Group();

    // 1. Lower Chassis
    const bodyGeo = new THREE.BoxGeometry(1.84, 0.36, 4.35);
    const bodyMesh = new THREE.Mesh(bodyGeo, bodyMat);
    bodyMesh.position.y = 0.40;
    group.add(bodyMesh);

    // 2. Teardrop Canopy with full 360 glass bubble
    const domeGeo = new THREE.SphereGeometry(0.88, 16, 12);
    domeGeo.scale(0.82, 0.60, 1.55);
    const domeMesh = new THREE.Mesh(domeGeo, glassMat);
    domeMesh.position.set(0, 0.80, -0.05);
    group.add(domeMesh);

    // Roof Scoop Intake (P1 Style)
    const scoopGeo = new THREE.BoxGeometry(0.24, 0.12, 0.65);
    const scoopMesh = new THREE.Mesh(scoopGeo, carbonMat);
    scoopMesh.position.set(0, 1.12, -0.3);
    group.add(scoopMesh);

    // 3. Eye-Socket Headlight recesses
    for (const side of [-1, 1]) {
      const socketGeo = new THREE.BoxGeometry(0.32, 0.18, 0.35);
      const socketMesh = new THREE.Mesh(socketGeo, carbonMat);
      socketMesh.position.set(side * 0.68, 0.48, 2.1);
      group.add(socketMesh);
    }

    // 4. High-Mounted Twin Exhausts (Exits directly between the taillights)
    exhausts.push(new THREE.Vector3(-0.2, 0.72, -2.25));
    exhausts.push(new THREE.Vector3(0.2, 0.72, -2.25));

    const pipeGeo = new THREE.CylinderGeometry(0.08, 0.08, 0.12, 12);
    pipeGeo.rotateX(Math.PI / 2);
    for (const ex of exhausts) {
      const p = new THREE.Mesh(pipeGeo, carbonMat);
      p.position.copy(ex);
      group.add(p);
    }

    // Active Curved Carbon Wing
    const wingGeo = new THREE.BoxGeometry(1.78, 0.03, 0.36);
    const wingMesh = new THREE.Mesh(wingGeo, carbonMat);
    wingMesh.position.set(0, 0.98, -2.12);
    wingMesh.rotation.x = -0.08;
    group.add(wingMesh);

    return group as unknown as THREE.Mesh;
  }

  /**
   * Porsche 911 GT3 RS Style:
   * Classic rear-engine teardrop silhouette, round iconic projector eyes, wide rear fender hips, massive swan-neck carbon wing
   */
  private static buildPorscheBody(
    bodyMat: THREE.Material,
    carbonMat: THREE.Material,
    glassMat: THREE.Material,
    exhausts: THREE.Vector3[]
  ): THREE.Mesh {
    const group = new THREE.Group();

    // 1. Classic 911 Base Body
    const bodyGeo = new THREE.BoxGeometry(1.78, 0.38, 4.3);
    const bodyMesh = new THREE.Mesh(bodyGeo, bodyMat);
    bodyMesh.position.y = 0.42;
    group.add(bodyMesh);

    // 2. Distinctive Wide Rear Wheel Fenders (Hips)
    for (const side of [-1, 1]) {
      const hipGeo = new THREE.BoxGeometry(0.22, 0.38, 1.4);
      const hipMesh = new THREE.Mesh(hipGeo, bodyMat);
      hipMesh.position.set(side * 0.94, 0.45, -1.2);
      group.add(hipMesh);
    }

    // 3. Fastback Cabin sloping all the way to rear engine deck
    const cabinGeo = new THREE.BoxGeometry(1.36, 0.52, 2.1);
    const cabinMesh = new THREE.Mesh(cabinGeo, glassMat);
    cabinMesh.position.set(0, 0.86, -0.25);
    group.add(cabinMesh);

    // 4. Iconic Round Headlight Pods
    for (const side of [-1, 1]) {
      const podGeo = new THREE.CylinderGeometry(0.16, 0.16, 0.28, 16);
      podGeo.rotateX(Math.PI / 2.2);
      const podMesh = new THREE.Mesh(podGeo, bodyMat);
      podMesh.position.set(side * 0.65, 0.56, 1.95);
      group.add(podMesh);
    }

    // 5. Massive GT3 RS Swan-Neck Carbon Wing
    const wingGeo = new THREE.BoxGeometry(1.88, 0.04, 0.44);
    const wingMesh = new THREE.Mesh(wingGeo, carbonMat);
    wingMesh.position.set(0, 1.28, -2.05);
    group.add(wingMesh);

    // Top-mounted Swan Neck Uprights
    for (const side of [-0.38, 0.38]) {
      const uprightGeo = new THREE.BoxGeometry(0.04, 0.55, 0.16);
      const upright = new THREE.Mesh(uprightGeo, carbonMat);
      upright.position.set(side, 1.02, -1.95);
      upright.rotation.x = -0.15;
      group.add(upright);
    }

    // Dual Center Titanium Exhausts
    exhausts.push(new THREE.Vector3(-0.12, 0.38, -2.25));
    exhausts.push(new THREE.Vector3(0.12, 0.38, -2.25));

    const pipeGeo = new THREE.CylinderGeometry(0.075, 0.075, 0.12, 12);
    pipeGeo.rotateX(Math.PI / 2);
    for (const ex of exhausts) {
      const p = new THREE.Mesh(pipeGeo, carbonMat);
      p.position.copy(ex);
      group.add(p);
    }

    return group as unknown as THREE.Mesh;
  }

  /**
   * Bugatti Chiron Super Sport Style:
   * Horseshoe center grille, sweeping C-line two-tone curve, ultra-wide low stance, quad-stacked exhaust
   */
  private static buildBugattiBody(
    bodyMat: THREE.Material,
    carbonMat: THREE.Material,
    glassMat: THREE.Material,
    exhausts: THREE.Vector3[]
  ): THREE.Mesh {
    const group = new THREE.Group();

    // 1. Ultra-Wide Hypercar Body
    const bodyGeo = new THREE.BoxGeometry(1.96, 0.40, 4.5);
    const bodyMesh = new THREE.Mesh(bodyGeo, bodyMat);
    bodyMesh.position.y = 0.42;
    group.add(bodyMesh);

    // 2. Iconic Horseshoe Grille
    const horseGeo = new THREE.CylinderGeometry(0.24, 0.24, 0.38, 16);
    horseGeo.rotateZ(Math.PI / 2);
    const horseMesh = new THREE.Mesh(horseGeo, carbonMat);
    horseMesh.position.set(0, 0.38, 2.38);
    group.add(horseMesh);

    // 3. Sweeping Bugatti "C-Line" Side Contours (Signature Two-Tone Arch)
    for (const side of [-1, 1]) {
      const cCurveGeo = new THREE.TorusGeometry(0.85, 0.08, 12, 24, Math.PI);
      cCurveGeo.rotateY(side * Math.PI / 2);
      const cCurve = new THREE.Mesh(cCurveGeo, carbonMat);
      cCurve.position.set(side * 0.98, 0.72, -0.2);
      group.add(cCurve);
    }

    // 4. Low Cabin & Exposed W16 Engine Bay
    const cabinGeo = new THREE.BoxGeometry(1.42, 0.44, 1.8);
    const cabinMesh = new THREE.Mesh(cabinGeo, glassMat);
    cabinMesh.position.set(0, 0.82, 0.1);
    group.add(cabinMesh);

    // Quad Stacked Exhaust Cannons (2 left, 2 right vertically stacked)
    exhausts.push(new THREE.Vector3(-0.35, 0.46, -2.32));
    exhausts.push(new THREE.Vector3(-0.35, 0.32, -2.32));
    exhausts.push(new THREE.Vector3(0.35, 0.46, -2.32));
    exhausts.push(new THREE.Vector3(0.35, 0.32, -2.32));

    const pipeGeo = new THREE.CylinderGeometry(0.065, 0.065, 0.12, 12);
    pipeGeo.rotateX(Math.PI / 2);
    for (const ex of exhausts) {
      const p = new THREE.Mesh(pipeGeo, carbonMat);
      p.position.copy(ex);
      group.add(p);
    }

    return group as unknown as THREE.Mesh;
  }

  /**
   * Mazda RX-7 FD3S Rotary Style:
   * Flowing 90s JDM curves, pop-up headlight outlines, large front intercooler intake, massive single titanium cannon exhaust
   */
  private static buildRX7Body(
    bodyMat: THREE.Material,
    carbonMat: THREE.Material,
    glassMat: THREE.Material,
    exhausts: THREE.Vector3[]
  ): THREE.Mesh {
    const group = new THREE.Group();

    // 1. Sleek JDM Coupe Body
    const bodyGeo = new THREE.BoxGeometry(1.74, 0.36, 4.2);
    const bodyMesh = new THREE.Mesh(bodyGeo, bodyMat);
    bodyMesh.position.y = 0.40;
    group.add(bodyMesh);

    // 2. Smooth Long Hood with Pop-Up Headlight outlines
    const hoodGeo = new THREE.BoxGeometry(1.62, 0.14, 1.4);
    const hoodMesh = new THREE.Mesh(hoodGeo, bodyMat);
    hoodMesh.position.set(0, 0.52, 1.2);
    group.add(hoodMesh);

    for (const side of [-1, 1]) {
      const popGeo = new THREE.BoxGeometry(0.28, 0.05, 0.32);
      const popMesh = new THREE.Mesh(popGeo, bodyMat);
      popMesh.position.set(side * 0.55, 0.58, 1.7);
      group.add(popMesh);
    }

    // 3. Curved Bubble Fastback Greenhouse (FD3S Double Bubble Roof)
    const bubbleGeo = new THREE.SphereGeometry(0.82, 16, 12);
    bubbleGeo.scale(0.85, 0.54, 1.55);
    const bubbleMesh = new THREE.Mesh(bubbleGeo, glassMat);
    bubbleMesh.position.set(0, 0.78, -0.2);
    group.add(bubbleMesh);

    // 4. JDM Curved Wing (Mazdaspeed Style)
    const wingGeo = new THREE.BoxGeometry(1.72, 0.04, 0.35);
    const wingMesh = new THREE.Mesh(wingGeo, carbonMat);
    wingMesh.position.set(0, 0.96, -2.0);
    group.add(wingMesh);

    // 5. Large Single Angled Titanium Exhaust Cannon (Classic Tuner Style)
    const mainExhaust = new THREE.Vector3(0.55, 0.28, -2.18);
    exhausts.push(mainExhaust);

    const cannonGeo = new THREE.CylinderGeometry(0.11, 0.11, 0.22, 14);
    cannonGeo.rotateX(Math.PI / 2.1);
    cannonGeo.rotateY(0.12);
    const cannonMesh = new THREE.Mesh(
      cannonGeo,
      new THREE.MeshStandardMaterial({
        color: 0x38bdf8, // titanium heat-treated blue tip
        metalness: 0.95,
        roughness: 0.15
      })
    );
    cannonMesh.position.copy(mainExhaust);
    group.add(cannonMesh);

    return group as unknown as THREE.Mesh;
  }
}
