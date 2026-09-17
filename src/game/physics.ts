/**
 * 2D Racing Physics Engine
 * Handles vehicle dynamics, lateral friction, drift kinematics, and collision responses.
 */

import { CarState, CarTelemetry, Obstacle, TrackPoint, WeatherType } from '../types/game';

export interface CollisionEvent {
  type: 'barrier' | 'obstacle' | 'car' | 'curb';
  x: number;
  y: number;
  intensity: number;
}

export class PhysicsEngine {
  // Global physics constants
  public static readonly DRAG = 0.985;
  public static readonly ROLLING_RESISTANCE = 0.988;
  public static readonly BRAKE_POWER = 12.5;
  public static readonly REVERSE_MAX_RATIO = 0.35;

  /**
   * Helper to ensure telemetry object is initialized with realistic defaults
   */
  public static initTelemetry(): CarTelemetry {
    return {
      rpm: 1000,
      gear: 1,
      tireTemp: 82, // optimal starting temp
      brakeDiscTemp: 0,
      bodyRoll: 0,
      bodyPitch: 0,
      slipRatio: 0,
      turboBoost: 0
    };
  }

  /**
   * Updates car state for delta time (dt in seconds)
   */
  public static updateCar(
    car: CarState,
    dt: number,
    isOffroad: boolean,
    onCollision?: (ev: CollisionEvent) => void,
    weather: WeatherType = 'clear'
  ): void {
    if (!car.telemetry) {
      car.telemetry = PhysicsEngine.initTelemetry();
    }

    if (car.finished) {
      // Slow down gradually after finish
      car.throttleInput = 0;
      car.brakeInput = 0.5;
    }

    // Oil slick spin handling
    if (car.spinTimer > 0) {
      car.spinTimer -= dt;
      car.angle += 14.0 * dt; // fast spin
      car.vx *= 0.97;
      car.vy *= 0.97;
      car.speed = Math.hypot(car.vx, car.vy);
      car.x += car.vx * dt;
      car.y += car.vy * dt;
      car.telemetry.rpm = 4500 + Math.random() * 2000;
      car.telemetry.bodyRoll = Math.sin(car.spinTimer * 10) * 0.15;
      return;
    }

    const stats = car.carStats;
    const currentMaxSpeed = car.isNitroActive
      ? stats.maxSpeed * stats.nitroStrength
      : stats.maxSpeed;

    // Weather impact on surface grip
    let weatherGrip = 1.0;
    if (weather === 'rain') {
      weatherGrip = 0.78; // slick wet tarmac
    }

    // Tire Temperature calculation & Grip Modifier
    const telem = car.telemetry;
    // Grip curve based on tire temperature (Optimum: 80 - 100°C)
    let tempGrip = 1.0;
    if (telem.tireTemp < 60) {
      tempGrip = 0.92; // cold tires have less traction
    } else if (telem.tireTemp >= 80 && telem.tireTemp <= 100) {
      tempGrip = 1.05; // sweet spot peak tire grip!
    } else if (telem.tireTemp > 115) {
      tempGrip = Math.max(0.78, 1.05 - (telem.tireTemp - 115) * 0.012); // overheated greasy tires
    }

    // Off-road penalty
    car.offroad = isOffroad;
    const surfaceGrip = (isOffroad ? stats.offroadResist : 1.0) * weatherGrip * tempGrip;
    const effectiveMaxSpeed = currentMaxSpeed * surfaceGrip;

    // Unit forward and lateral vectors
    const forwardX = Math.cos(car.angle);
    const forwardY = Math.sin(car.angle);
    const rightX = -Math.sin(car.angle);
    const rightY = Math.cos(car.angle);

    // Project velocity into forward and lateral components
    const forwardVel = car.vx * forwardX + car.vy * forwardY;
    const lateralVel = car.vx * rightX + car.vy * rightY;

    // Weight transfer calculation:
    // Braking shifts weight to front (front grip+, rear grip-)
    // Acceleration shifts weight to rear (squat)
    let weightFront = 0.5;
    if (car.brakeInput > 0) {
      weightFront = Math.min(0.75, 0.5 + car.brakeInput * 0.25);
    } else if (car.throttleInput > 0) {
      weightFront = Math.max(0.35, 0.5 - car.throttleInput * 0.15);
    }

    // Body Pitch (forward dip on brake, rear squat on accel)
    const targetPitch = (car.throttleInput * 0.05) - (car.brakeInput * 0.08);
    telem.bodyPitch += (targetPitch - telem.bodyPitch) * Math.min(1, dt * 10);

    // Acceleration & Braking
    let targetForwardVel = forwardVel;

    if (car.throttleInput > 0) {
      const accelForce = stats.acceleration * car.throttleInput * surfaceGrip * 620 * dt;
      targetForwardVel += accelForce;
      if (targetForwardVel > effectiveMaxSpeed) {
        targetForwardVel = effectiveMaxSpeed;
      }
      // Turbo spooling
      telem.turboBoost = Math.min(1.0, telem.turboBoost + dt * (car.isNitroActive ? 3.0 : 1.2));
    } else {
      telem.turboBoost = Math.max(0, telem.turboBoost - dt * 2.5);
    }

    if (car.brakeInput > 0) {
      if (targetForwardVel > 15) {
        // Braking while moving forward
        targetForwardVel -= PhysicsEngine.BRAKE_POWER * car.brakeInput * 620 * dt;
        if (targetForwardVel < 0) targetForwardVel = 0;
        // Brake disc heating
        telem.brakeDiscTemp = Math.min(1.0, telem.brakeDiscTemp + car.brakeInput * dt * 0.8);
      } else {
        // Reverse
        const maxReverse = effectiveMaxSpeed * PhysicsEngine.REVERSE_MAX_RATIO;
        targetForwardVel -= stats.acceleration * 0.5 * car.brakeInput * 400 * dt;
        if (targetForwardVel < -maxReverse) targetForwardVel = -maxReverse;
      }
    } else {
      // Brake disc cooling
      telem.brakeDiscTemp = Math.max(0, telem.brakeDiscTemp - dt * 0.25 * (1 + car.speed / 200));
    }

    // Rolling resistance and drag
    targetForwardVel *= Math.pow(PhysicsEngine.ROLLING_RESISTANCE, dt * 60);

    // Dynamic Lateral Friction & Pacejka-inspired slip curve
    let driftFactor = car.isDrifting ? stats.driftFactor : 0.80;
    if (isOffroad) driftFactor = 0.92;
    if (weather === 'rain') driftFactor = Math.min(0.95, driftFactor + 0.06);

    // Lateral friction dampens sideways sliding
    const newLateralVel = lateralVel * Math.pow(driftFactor, dt * 60);

    // Steering: steering sensitivity scales naturally with forward speed
    const speedRatio = Math.min(1.0, Math.abs(forwardVel) / (stats.maxSpeed * 0.28));
    const reverseSign = forwardVel < -5 ? -1 : 1;
    let turnSpeed = stats.handling * 2.9 * car.steerInput * speedRatio * reverseSign;

    if (car.isDrifting && Math.abs(forwardVel) > 75) {
      turnSpeed *= 1.38; // tighter oversteer rotation
    }

    car.angle += turnSpeed * dt;

    // Body Roll (centrifugal lean into turns)
    const targetRoll = Math.max(-0.16, Math.min(0.16, -car.steerInput * (car.speed / stats.maxSpeed) * 0.14));
    telem.bodyRoll += (targetRoll - telem.bodyRoll) * Math.min(1, dt * 12);

    // Slip ratio
    telem.slipRatio = Math.min(1.0, Math.abs(lateralVel) / (Math.abs(forwardVel) + 20));

    // Tire Temperature simulation
    // Increases from drifting, high slip, and hard braking
    const heatGeneration = (car.isDrifting ? 16 : 0) + (telem.slipRatio > 0.35 ? 12 : 0) + (car.brakeInput * 8);
    // Cools down towards ambient 70-80°C
    const targetAmbientTemp = weather === 'rain' ? 68 : 82;
    telem.tireTemp += (heatGeneration * dt * 2.2) - ((telem.tireTemp - targetAmbientTemp) * dt * 0.45);
    telem.tireTemp = Math.max(30, Math.min(140, telem.tireTemp));

    // Reconstruct velocity from forward & lateral components
    const newForwardX = Math.cos(car.angle);
    const newForwardY = Math.sin(car.angle);
    const newRightX = -Math.sin(car.angle);
    const newRightY = Math.cos(car.angle);

    car.vx = targetForwardVel * newForwardX + newLateralVel * newRightX;
    car.vy = targetForwardVel * newForwardY + newLateralVel * newRightY;

    // Air drag
    car.vx *= Math.pow(PhysicsEngine.DRAG, dt * 60);
    car.vy *= Math.pow(PhysicsEngine.DRAG, dt * 60);

    // Update position
    car.x += car.vx * dt;
    car.y += car.vy * dt;

    // Overall scalar speed in km/h scale (~ 0 - 240)
    car.speed = Math.hypot(car.vx, car.vy);

    // Realistic Gearbox and RPM Telemetry
    const speedKmh = car.speed * 0.32;
    // 6 Gears with realistic gear velocity bands
    const gearLimits = [0, 48, 92, 138, 185, 230, 320];
    let currentGear = 1;
    if (forwardVel < -3) {
      currentGear = -1; // Reverse
    } else {
      for (let g = 1; g <= 6; g++) {
        if (speedKmh <= gearLimits[g] || g === 6) {
          currentGear = g;
          break;
        }
      }
    }
    telem.gear = currentGear;

    // Calculate RPM inside current gear
    if (currentGear === -1) {
      telem.rpm = 1000 + Math.min(4500, Math.abs(speedKmh) * 140);
    } else {
      const lowerSpeed = gearLimits[currentGear - 1] || 0;
      const upperSpeed = gearLimits[currentGear];
      const gearFraction = Math.max(0, Math.min(1, (speedKmh - lowerSpeed) / (upperSpeed - lowerSpeed)));

      let targetRpm = 1800 + gearFraction * 6200;
      if (car.throttleInput > 0.8 && gearFraction > 0.96 && currentGear === 6) {
        // Rev limiter bounce at top speed
        targetRpm = 8200 + (Math.random() - 0.5) * 400;
      } else if (car.throttleInput === 0) {
        targetRpm = Math.max(1000, targetRpm * 0.7);
      }
      telem.rpm += (targetRpm - telem.rpm) * Math.min(1, dt * 14);
    }

    // Nitro consumption
    if (car.isNitroActive) {
      car.nitroRemaining -= dt * 35;
      if (car.nitroRemaining <= 0) {
        car.nitroRemaining = 0;
        car.isNitroActive = false;
      }
    }
  }

  /**
   * Distance from point (px, py) to line segment (x1, y1) -> (x2, y2)
   */
  public static distToSegment(
    px: number,
    py: number,
    x1: number,
    y1: number,
    x2: number,
    y2: number
  ): { dist: number; closestX: number; closestY: number; t: number } {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const lenSq = dx * dx + dy * dy;
    if (lenSq === 0) {
      return { dist: Math.hypot(px - x1, py - y1), closestX: x1, closestY: y1, t: 0 };
    }
    let t = ((px - x1) * dx + (py - y1) * dy) / lenSq;
    t = Math.max(0, Math.min(1, t));
    const closestX = x1 + t * dx;
    const closestY = y1 + t * dy;
    return {
      dist: Math.hypot(px - closestX, py - closestY),
      closestX,
      closestY,
      t
    };
  }

  /**
   * Checks whether the car is on the track road or on the offroad grass/sand/snow.
   */
  public static checkOnTrack(
    carX: number,
    carY: number,
    points: TrackPoint[]
  ): { isOnTrack: boolean; nearestPointIndex: number; trackDist: number } {
    let minDistance = Infinity;
    let nearestIdx = 0;
    const n = points.length;

    for (let i = 0; i < n; i++) {
      const p1 = points[i];
      const p2 = points[(i + 1) % n];
      const res = PhysicsEngine.distToSegment(carX, carY, p1.x, p1.y, p2.x, p2.y);
      if (res.dist < minDistance) {
        minDistance = res.dist;
        nearestIdx = i;
      }
    }

    const roadHalfWidth = (points[nearestIdx].width ?? 180) / 2;
    return {
      isOnTrack: minDistance <= roadHalfWidth,
      nearestPointIndex: nearestIdx,
      trackDist: minDistance
    };
  }

  /**
   * Handles collision response between car and outer track boundary walls
   */
  public static handleTrackWallCollision(
    car: CarState,
    points: TrackPoint[],
    onCollision?: (ev: CollisionEvent) => void
  ): void {
    const n = points.length;
    let minDistance = Infinity;
    let closestPointX = 0;
    let closestPointY = 0;
    let segmentWidth = 180;

    for (let i = 0; i < n; i++) {
      const p1 = points[i];
      const p2 = points[(i + 1) % n];
      const res = PhysicsEngine.distToSegment(car.x, car.y, p1.x, p1.y, p2.x, p2.y);
      if (res.dist < minDistance) {
        minDistance = res.dist;
        closestPointX = res.closestX;
        closestPointY = res.closestY;
        segmentWidth = p1.width ?? 180;
      }
    }

    // Barrier boundary is slightly outside the painted road (e.g. half-width + 60)
    const maxAllowedDist = segmentWidth / 2 + 65;
    if (minDistance > maxAllowedDist) {
      // Car breached the outer soft barrier: bounce back gently toward track center
      const dx = car.x - closestPointX;
      const dy = car.y - closestPointY;
      const currentDist = Math.hypot(dx, dy) || 1;
      const normalX = dx / currentDist;
      const normalY = dy / currentDist;

      // Push back to boundary
      car.x = closestPointX + normalX * maxAllowedDist;
      car.y = closestPointY + normalY * maxAllowedDist;

      // Reflect velocity vector
      const dot = car.vx * normalX + car.vy * normalY;
      if (dot > 0) {
        car.vx -= 1.4 * dot * normalX;
        car.vy -= 1.4 * dot * normalY;
        car.vx *= 0.6;
        car.vy *= 0.6;

        if (onCollision && Math.hypot(car.vx, car.vy) > 60) {
          onCollision({
            type: 'barrier',
            x: car.x,
            y: car.y,
            intensity: Math.min(1.0, Math.hypot(car.vx, car.vy) / 300)
          });
        }
      }
    }
  }

  /**
   * Collision between two cars (elastic impulse)
   */
  public static handleCarCollision(
    carA: CarState,
    carB: CarState,
    onCollision?: (ev: CollisionEvent) => void
  ): void {
    const dx = carB.x - carA.x;
    const dy = carB.y - carA.y;
    const dist = Math.hypot(dx, dy);
    const minDist = 38; // collision diameter of cars

    if (dist < minDist && dist > 0.001) {
      const nx = dx / dist;
      const ny = dy / dist;
      const overlap = (minDist - dist) / 2;

      // Separate them
      carA.x -= nx * overlap;
      carA.y -= ny * overlap;
      carB.x += nx * overlap;
      carB.y += ny * overlap;

      // Relative velocity
      const rvx = carB.vx - carA.vx;
      const rvy = carB.vy - carA.vy;
      const velAlongNormal = rvx * nx + rvy * ny;

      if (velAlongNormal < 0) {
        const restitution = 0.55;
        const impulse = -(1 + restitution) * velAlongNormal * 0.5;

        carA.vx -= impulse * nx;
        carA.vy -= impulse * ny;
        carB.vx += impulse * nx;
        carB.vy += impulse * ny;

        if (onCollision && Math.abs(impulse) > 40) {
          onCollision({
            type: 'car',
            x: (carA.x + carB.x) / 2,
            y: (carA.y + carB.y) / 2,
            intensity: Math.min(1.0, Math.abs(impulse) / 250)
          });
        }
      }
    }
  }

  /**
   * Car collision with obstacles (Rock, Oil, Cone)
   */
  public static handleObstacleCollision(
    car: CarState,
    obstacle: Obstacle,
    onCollision?: (ev: CollisionEvent) => void
  ): void {
    if (!obstacle.active) return;

    const dx = obstacle.x - car.x;
    const dy = obstacle.y - car.y;
    const dist = Math.hypot(dx, dy);
    const hitDist = obstacle.radius + 18; // car half-radius

    if (dist < hitDist) {
      if (obstacle.type === 'oil') {
        // Triggers spin out!
        if (car.spinTimer <= 0) {
          car.spinTimer = 1.1;
          if (onCollision) {
            onCollision({ type: 'obstacle', x: obstacle.x, y: obstacle.y, intensity: 0.8 });
          }
        }
      } else if (obstacle.type === 'rock') {
        // Solid heavy obstacle - bounce car back
        const nx = dx / (dist || 1);
        const ny = dy / (dist || 1);
        const overlap = hitDist - dist;

        car.x -= nx * overlap;
        car.y -= ny * overlap;

        const dot = car.vx * nx + car.vy * ny;
        if (dot > 0) {
          car.vx -= 1.6 * dot * nx;
          car.vy -= 1.6 * dot * ny;
          car.vx *= 0.45;
          car.vy *= 0.45;

          if (onCollision) {
            onCollision({ type: 'obstacle', x: obstacle.x, y: obstacle.y, intensity: 1.0 });
          }
        }
      } else if (obstacle.type === 'cone') {
        // Cone is knockable! Impart velocity to cone
        const speed = Math.hypot(car.vx, car.vy);
        obstacle.vx = (car.vx * 0.7 + (Math.random() - 0.5) * 100);
        obstacle.vy = (car.vy * 0.7 + (Math.random() - 0.5) * 100);
        car.vx *= 0.94; // slight slowdown
        car.vy *= 0.94;

        if (onCollision && speed > 50) {
          onCollision({ type: 'obstacle', x: obstacle.x, y: obstacle.y, intensity: 0.35 });
        }
      }
    }
  }

  /**
   * Updates physical motion of dynamic obstacles (like moving traffic cones)
   */
  public static updateObstacles(obstacles: Obstacle[], dt: number): void {
    for (const obs of obstacles) {
      if (obs.type === 'cone' && (obs.vx !== undefined && obs.vy !== undefined)) {
        obs.x += (obs.vx || 0) * dt;
        obs.y += (obs.vy || 0) * dt;
        obs.vx! *= Math.pow(0.92, dt * 60);
        obs.vy! *= Math.pow(0.92, dt * 60);
        if (obs.angle !== undefined) {
          obs.angle += (obs.vx! + obs.vy!) * 0.02;
        }
      }
    }
  }
}
