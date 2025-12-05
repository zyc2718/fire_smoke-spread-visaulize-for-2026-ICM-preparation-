import React, { useRef, useEffect } from 'react';
import { CellType, Grid } from '../types';
import { GRID_WIDTH, GRID_HEIGHT, COLOR_WALL, COLOR_WALL_HOT, MAX_TEMP, WALL_FAILURE_TEMP } from '../constants';
import * as d3 from 'd3';

interface FloorCanvasProps {
  grid: Grid;
  floorIndex: number;
  onIgnite: (floor: number, x: number, y: number) => void;
  width: number;
  height: number;
}

const FloorCanvas: React.FC<FloorCanvasProps> = ({ grid, floorIndex, onIgnite, width, height }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: false }); // Optimize for no transparency on bg
    if (!ctx) return;

    const cellW = width / GRID_WIDTH;
    const cellH = height / GRID_HEIGHT;

    // 1. Background (Void)
    ctx.fillStyle = '#020617';
    ctx.fillRect(0, 0, width, height);

    for (let y = 0; y < GRID_HEIGHT; y++) {
      for (let x = 0; x < GRID_WIDTH; x++) {
        const cell = grid[y][x];
        const cx = Math.floor(x * cellW);
        const cy = Math.floor(y * cellH);
        const cw = Math.ceil(cellW);
        const ch = Math.ceil(cellH);

        // --- LAYER 1: STRUCTURE ---
        if (cell.type === CellType.WALL) {
          // Scientific Visualization: Structural Integrity
          // If Temp > 800, color shifts to Red. If Integrity < 100, it darkens/cracks.
          
          if (cell.temperature > WALL_FAILURE_TEMP * 0.5) {
             const heatRatio = Math.min(1, (cell.temperature - 200) / (MAX_TEMP - 200));
             const baseColor = d3.interpolateRgb(COLOR_WALL, COLOR_WALL_HOT)(heatRatio);
             
             // Integrity darkening
             const integrityFactor = cell.integrity / 100;
             ctx.fillStyle = d3.interpolateRgb('#000000', baseColor)(integrityFactor);
          } else {
             ctx.fillStyle = COLOR_WALL;
          }
          ctx.fillRect(cx, cy, cw, ch);
          continue; // Walls are drawn, check overlays next
        } 
        
        // Fuel / Floor rendering
        if (cell.type === CellType.FUEL) {
          const fuelRatio = cell.fuel / 100;
          const greyVal = Math.floor(30 + 40 * fuelRatio);
          ctx.fillStyle = `rgb(${greyVal},${greyVal},${greyVal})`;
          ctx.fillRect(cx, cy, cw, ch);
        }

        // --- LAYER 2: THERMAL RADIATION (HEATMAP) ---
        // Only draw significant heat to keep it clean
        if (cell.temperature > 100) {
           const t = Math.min(1, cell.temperature / MAX_TEMP);
           // Magma palette is good for scientific heat
           ctx.fillStyle = d3.interpolateMagma(t);
           // Use globalAlpha for blending heat onto floor
           ctx.globalAlpha = 0.6 * t; 
           ctx.fillRect(cx, cy, cw, ch);
           ctx.globalAlpha = 1.0;
        }

        // --- LAYER 3: FIRE ---
        if (cell.fire > 0.05) {
           const flicker = Math.random() * 0.15;
           const intensity = Math.min(1, cell.fire + flicker);
           // Core is yellow/white, edge is orange
           ctx.fillStyle = intensity > 0.8 ? '#fff7ed' : '#fb923c';
           
           // Draw shape based on intensity (simulating organic fire)
           const shrink = (1 - intensity) * (cellW * 0.4);
           ctx.fillRect(cx + shrink, cy + shrink, cw - shrink*2, ch - shrink*2);
        }
      }
    }

    // --- LAYER 4: SMOKE (Volumetric Approximation) ---
    // We draw smoke as a separate pass for better blending
    ctx.globalCompositeOperation = 'screen'; // Additive-ish blending for smoke in dark mode? 
    // Actually, 'source-over' with alpha is better for grey smoke.
    ctx.globalCompositeOperation = 'source-over';

    for (let y = 0; y < GRID_HEIGHT; y++) {
      for (let x = 0; x < GRID_WIDTH; x++) {
         const cell = grid[y][x];
         if (cell.smoke > 5) {
            const cx = Math.floor(x * cellW);
            const cy = Math.floor(y * cellH);
            const cw = Math.ceil(cellW);
            const ch = Math.ceil(cellH);

            // Density map
            const density = Math.min(0.95, cell.smoke / 80);
            
            // Color: Smoke gets darker and thicker
            // Grey-blueish for scientific smoke visibility
            ctx.fillStyle = `rgba(148, 163, 184, ${density})`; 
            ctx.fillRect(cx, cy, cw, ch);
         }
      }
    }

  }, [grid, width, height]);

  const handleClick = (e: React.MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = Math.floor(((e.clientX - rect.left) / width) * GRID_WIDTH);
    const y = Math.floor(((e.clientY - rect.top) / height) * GRID_HEIGHT);
    onIgnite(floorIndex, x, y);
  };

  return (
    <div className="relative border border-slate-700 rounded-lg overflow-hidden bg-slate-950 shadow-lg transition-transform hover:scale-[1.005]">
      <div className="absolute top-2 left-2 z-10 pointer-events-none flex gap-2">
        <span className="bg-black/70 backdrop-blur px-2 py-0.5 rounded text-[10px] font-mono text-cyan-400 border border-cyan-900/50 shadow-sm">
          LEVEL {floorIndex + 1}
        </span>
      </div>
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        onClick={handleClick}
        className="cursor-crosshair block"
      />
    </div>
  );
};

export default FloorCanvas;