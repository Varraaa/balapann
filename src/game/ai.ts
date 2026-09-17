/**
 * AI Driver Controller for Competitor Cars
 */

import { CarState, Checkpoint, Obstacle, TrackPoint } from '../types/game';

export class AIController {
  public static updateAI(
    car: CarState,
    dt: number,
    checkpoints: Checkpoint[],
    trackPoints: TrackPoint[],
    obstacles: Obstacle[],
    otherCars: CarState[],
    difficulty: 'easy' | 'medium' | 'hard'
  ): void {
    if (car.finished) {
      car.throttleInput = 0;
      car.brakeInput = 0.5;
      car.steerInput = 0;
      return;
    }

    // Identify current target waypoint
    const currentCpIdx = car.nextCheckpointIdx % checkpoints.length;
    const nextCpIdx = (currentCpIdx + 1) % checkpoints.length;

    // Lookahead waypoint: combine current and next checkpoint for smoother lines
    const cp = checkpoints[currentCpIdx];
    const nextCp = checkpoints[nextCpIdx];

    // Difficulty settings
    let targetSpeedRatio = 0.82;
    let lookaheadWeight = 0.35;
    let nitroChance = 0.005;

    if (difficulty === 'easy') {
      targetSpeedRatio = 0.72;
      lookaheadWeight = 0.15;
      nitroChance = 0.001;
    } else if (difficulty === 'hard') {
      targetSpeedRatio = 0.96;
      lookaheadWeight = 0.55;
      nitroChance = 0.012;
    }

    // Blended target point
    let targetX = cp.x * (1 - lookaheadWeight) + nextCp.x * lookaheadWeight;
    let targetY = cp.y * (1 - lookaheadWeight) + nextCp.y * lookaheadWeight;

    // Add slight offset based on car id to prevent all AI cars from forming an identical train
    const carOffsetAngle = cp.angle + Math.PI / 2;
    const laneOffset = ((car.id.charCodeAt(car.id.length - 1) % 5) - 2) * 26;
    targetX += Math.cos(carOffsetAngle) * laneOffset;
    targetY += Math.sin(carOffsetAngle) * laneOffset;

    // Obstacle avoidance
    for (const obs of obstacles) {
      if (!obs.active) continue;
      const d = Math.hypot(obs.x - car.x, obs.y - car.y);
      if (d < 140) {
        // Steer away from obstacle
        const awayAngle = Math.atan2(car.y - obs.y, car.x - obs.x);
        targetX += Math.cos(awayAngle) * 70;
        targetY += Math.sin(awayAngle) * 70;
      }
    }

    // Car avoidance: steer slightly if right behind another car
    for (const other of otherCars) {
      if (other.id === car.id) continue;
      const d = Math.hypot(other.x - car.x, other.y - car.y);
      if (d < 70) {
        const awayAngle = Math.atan2(car.y - other.y, car.x - other.x);
        targetX += Math.cos(awayAngle) * 50;
        targetY += Math.sin(awayAngle) * 50;
      }
    }

    // Vector to target
    const dx = targetX - car.x;
    const dy = targetY - car.y;
    const desiredAngle = Math.atan2(dy, dx);

    // Angle difference normalized to [-PI, PI]
    let angleDiff = desiredAngle - car.angle;
    while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
    while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;

    // Check if stuck
    if (car.speed < 25 && !car.finished) {
      car.stuckTimer += dt;
    } else {
      car.stuckTimer = Math.max(0, car.stuckTimer - dt * 2);
    }

    if (car.stuckTimer > 1.4) {
      // Execute unstick maneuver: reverse with steer opposite to angleDiff
      car.throttleInput = 0;
      car.brakeInput = 0.9;
      car.steerInput = angleDiff > 0 ? -1 : 1;
      car.isDrifting = false;
      if (car.stuckTimer > 2.8) {
        car.stuckTimer = 0; // reset
      }
      return;
    }

    // Steering input: proportional control with deadzone
    const steerSensitivity = difficulty === 'hard' ? 2.5 : 1.8;
    car.steerInput = Math.max(-1, Math.min(1, angleDiff * steerSensitivity));

    // Throttle / Braking logic
    const currentSpeed = car.speed;
    const maxSpeed = car.carStats.maxSpeed * targetSpeedRatio;
    const turnSeverity = Math.abs(angleDiff);

    // If approaching a very sharp corner, slow down to avoid overshooting
    if (turnSeverity > 0.8 && currentSpeed > maxSpeed * 0.5) {
      car.throttleInput = 0.2;
      car.brakeInput = difficulty === 'hard' ? 0.3 : 0.6;
      car.isDrifting = difficulty === 'hard' && turnSeverity > 1.1;
    } else if (turnSeverity > 0.45 && currentSpeed > maxSpeed * 0.75) {
      car.throttleInput = 0.5;
      car.brakeInput = 0.1;
      car.isDrifting = false;
    } else {
      car.throttleInput = 1.0;
      car.brakeInput = 0;
      car.isDrifting = false;

      // Use nitro on straights
      if (turnSeverity < 0.25 && car.nitroRemaining > 25 && Math.random() < nitroChance) {
        car.isNitroActive = true;
      }
    }
  }
}
