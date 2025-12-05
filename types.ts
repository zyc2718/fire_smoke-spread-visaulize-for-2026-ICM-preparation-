export enum CellType {
  EMPTY = 0,
  WALL = 1,
  FUEL = 2, // Wood, carpet, etc.
}

export interface Cell {
  type: CellType;
  temperature: number; // 0 to 1000+
  fuel: number; // 0 to 100
  integrity: number; // 0 to 100 (for walls)
  smoke: number; // 0 to 100 density
  fire: number; // 0 (none) to 1 (full intensity)
  vx: number; // Velocity X (for advection)
  vy: number; // Velocity Y
}

export interface SimulationConfig {
  windSpeed: number;
  windDirection: number; // 0-360 degrees
  diffusionRate: number;
  verticalConductivity: number;
}

export interface SimulationStats {
  activeFireCells: number;
  totalSmokeMass: number;
  averageTemperature: number;
  floorStats: {
    floorIndex: number;
    dangerLevel: number; // 0-100
  }[];
}

export type Grid = Cell[][];