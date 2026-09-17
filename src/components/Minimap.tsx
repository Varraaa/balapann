/**
 * Minimap Radar Component
 * Renders the track layout and real-time racer blips.
 */

import React, { useEffect, useRef } from 'react';
import { CarState, TrackPoint, TrackTheme } from '../types/game';

interface MinimapProps {
  theme: TrackTheme;
  cars: CarState[];
  playerCar: CarState;
}

export const Minimap: React.FC<MinimapProps> = ({ theme, cars, playerCar }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    ctx.clearRect(0, 0, width, height);

    // Compute bounding box of track
    const points = theme.points;
    if (!points || points.length === 0) return;

    let minX = Infinity, maxX = -Infinity;
    let minY = Infinity, maxY = -Infinity;

    points.forEach(p => {
      if (p.x < minX) minX = p.x;
      if (p.x > maxX) maxX = p.x;
      if (p.y < minY) minY = p.y;
      if (p.y > maxY) maxY = p.y;
    });

    const padding = 20;
    const trackWidth = (maxX - minX) || 1;
    const trackHeight = (maxY - minY) || 1;

    const scale = Math.min((width - padding * 2) / trackWidth, (height - padding * 2) / trackHeight);
    const offsetX = (width - trackWidth * scale) / 2 - minX * scale;
    const offsetY = (height - trackHeight * scale) / 2 - minY * scale;

    const toMapX = (wx: number) => wx * scale + offsetX;
    const toMapY = (wy: number) => wy * scale + offsetY;

    // Draw Track Line
    ctx.beginPath();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
    ctx.lineWidth = 14 * scale;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    ctx.moveTo(toMapX(points[0].x), toMapY(points[0].y));
    for (let i = 1; i < points.length; i++) {
      ctx.lineTo(toMapX(points[i].x), toMapY(points[i].y));
    }
    ctx.closePath();
    ctx.stroke();

    // Start/Finish blip
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(toMapX(points[0].x), toMapY(points[0].y), 3.5, 0, Math.PI * 2);
    ctx.fill();

    // Draw AI Competitors
    for (const car of cars) {
      if (car.isPlayer) continue;
      ctx.fillStyle = car.carStats.bodyColor;
      ctx.beginPath();
      ctx.arc(toMapX(car.x), toMapY(car.y), 3.5, 0, Math.PI * 2);
      ctx.fill();
    }

    // Draw Player (Larger, glowing dot)
    ctx.fillStyle = '#38bdf8';
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(toMapX(playerCar.x), toMapY(playerCar.y), 5.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

  }, [theme, cars, playerCar.x, playerCar.y]);

  return (
    <div
      id="game-minimap-container"
      className="relative rounded-xl overflow-hidden bg-slate-950/80 backdrop-blur-md border border-slate-700/60 shadow-lg p-2"
    >
      <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400 mb-1 px-1">
        Radar Lintasan
      </div>
      <canvas
        ref={canvasRef}
        width={140}
        height={110}
        className="rounded-lg block"
      />
    </div>
  );
};
