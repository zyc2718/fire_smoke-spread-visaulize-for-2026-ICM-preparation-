import { Cell, CellType, Grid, SimulationConfig } from '../types';
import { 
  GRID_WIDTH, GRID_HEIGHT, NUM_FLOORS, 
  AMBIENT_TEMP, IGNITION_TEMP, MAX_TEMP, 
  WALL_FAILURE_TEMP, WALL_DECAY_RATE,
  COOLING_RATE, SMOKE_DECAY, HEAT_TRANSFER, 
  SMOKE_RISE_RATE 
} from '../constants';

export class SimulationEngine {
  floors: Grid[];
  config: SimulationConfig;

  constructor() {
    this.floors = Array.from({ length: NUM_FLOORS }, () => this.createEmptyGrid());
    this.config = {
      windSpeed: 0,
      windDirection: 0,
      diffusionRate: 0.1,
      verticalConductivity: 0.08,
    };
    this.initializeBuilding();
  }

  private createEmptyGrid(): Grid {
    const grid: Grid = [];
    for (let y = 0; y < GRID_HEIGHT; y++) {
      const row: Cell[] = [];
      for (let x = 0; x < GRID_WIDTH; x++) {
        row.push({
          type: CellType.EMPTY,
          temperature: AMBIENT_TEMP,
          fuel: 0,
          integrity: 100, // Structural health
          smoke: 0,
          fire: 0,
          vx: 0,
          vy: 0,
        });
      }
      grid.push(row);
    }
    return grid;
  }

  private initializeBuilding() {
    this.floors.forEach((grid, floorIndex) => {
      for (let y = 0; y < GRID_HEIGHT; y++) {
        for (let x = 0; x < GRID_WIDTH; x++) {
          // Exterior Walls
          if (x === 0 || x === GRID_WIDTH - 1 || y === 0 || y === GRID_HEIGHT - 1) {
            grid[y][x].type = CellType.WALL;
            grid[y][x].integrity = 100;
            continue;
          }

          // Interior Layout (Procedural)
          // Create corridors and rooms
          const isCorridor = (x % 20 > 8 && x % 20 < 12) || (y % 15 > 6 && y % 15 < 9);
          
          if (!isCorridor) {
             if (x % 20 === 0 || y % 15 === 0) {
                // Interior walls with gaps
                if (Math.random() > 0.15) {
                   grid[y][x].type = CellType.WALL;
                   grid[y][x].integrity = 100;
                }
             } else {
                // Fuel loading (Furniture)
                if (Math.random() > 0.3) {
                  grid[y][x].type = CellType.FUEL;
                  grid[y][x].fuel = 70 + Math.random() * 30;
                }
             }
          }
        }
      }
    });
  }

  public ignite(floorIndex: number, x: number, y: number) {
    if (floorIndex >= 0 && floorIndex < NUM_FLOORS) {
      if (x > 0 && x < GRID_WIDTH - 1 && y > 0 && y < GRID_HEIGHT - 1) {
        const cell = this.floors[floorIndex][y][x];
        
        // CHIMNEY EFFECT: If already burning, breach ceiling and ignite floor above
        if (cell.fire > 0.5 || cell.temperature > 600) {
           cell.temperature += 500; // Superheat current
           cell.smoke += 50;
           
           if (floorIndex < NUM_FLOORS - 1) {
             const cellAbove = this.floors[floorIndex + 1][y][x];
             cellAbove.temperature = MAX_TEMP;
             cellAbove.fire = 1.0;
             cellAbove.type = cellAbove.type === CellType.WALL ? CellType.EMPTY : cellAbove.type; // Blow out wall above if exists
             cellAbove.fuel = Math.max(50, cellAbove.fuel);
             
             // Recursively propagate up if that one is also hot? 
             // For now, one click = one level jump.
           }
        } else {
          // Standard Ignition
          cell.temperature = 900;
          cell.fire = 1.0;
          cell.fuel = Math.max(50, cell.fuel);
        }
      }
    }
  }

  public reset() {
    this.floors = Array.from({ length: NUM_FLOORS }, () => this.createEmptyGrid());
    this.initializeBuilding();
  }

  public update() {
    const nextFloors = this.floors.map(grid => 
      grid.map(row => row.map(cell => ({ ...cell })))
    );

    for (let f = 0; f < NUM_FLOORS; f++) {
      for (let y = 1; y < GRID_HEIGHT - 1; y++) {
        for (let x = 1; x < GRID_WIDTH - 1; x++) {
          const currentCell = this.floors[f][y][x];
          const nextCell = nextFloors[f][y][x];

          // --- WALL DYNAMICS (New) ---
          if (currentCell.type === CellType.WALL) {
             // Wall Failure Logic
             if (currentCell.temperature > WALL_FAILURE_TEMP) {
               nextCell.integrity -= WALL_DECAY_RATE;
               // If integrity fails, wall collapses into empty space (or debris)
               if (nextCell.integrity <= 0) {
                 nextCell.type = CellType.EMPTY;
                 nextCell.integrity = 0;
                 nextCell.temperature += 200; // Burst of heat from collapse/flashover
               }
             }
             
             // Walls conduct heat but don't burn
             // Calculate conduction from neighbors
             let activeNeighbors = 0;
             let tempSum = 0;
             const neighbors = [
                this.floors[f][y-1][x], this.floors[f][y+1][x],
                this.floors[f][y][x-1], this.floors[f][y][x+1]
             ];
             neighbors.forEach(n => {
                tempSum += n.temperature;
                activeNeighbors++;
             });
             
             // Slow conduction for walls
             if (activeNeighbors > 0) {
                const avg = tempSum / activeNeighbors;
                nextCell.temperature += (avg - currentCell.temperature) * 0.05;
             }
             
             // Natural Cooling
             nextCell.temperature *= 0.99;
             continue; // Skip combustion logic for walls
          }

          // --- FLUID DYNAMICS & COMBUSTION ---

          // 1. Diffusion & Convection
          let avgTemp = 0;
          let avgSmoke = 0;
          let neighborCount = 0;
          
          const neighbors = [
            this.floors[f][y - 1][x],
            this.floors[f][y + 1][x],
            this.floors[f][y][x - 1],
            this.floors[f][y][x + 1],
          ];

          neighbors.forEach(n => {
             // Walls block diffusion partially unless hot
             const isWall = n.type === CellType.WALL;
             avgTemp += n.temperature; // Heat conducts through walls
             if (!isWall) avgSmoke += n.smoke; // Smoke blocked by walls
             else avgSmoke += n.smoke * 0.1; // Small leak
             neighborCount++;
          });

          if (neighborCount > 0) {
            avgTemp /= neighborCount;
            // Smoke diffusion is tricky with walls
            // Simplified:
            nextCell.smoke = nextCell.smoke * 0.5 + (avgSmoke / (neighborCount)) * 0.5;
          }

          const diff = avgTemp - currentCell.temperature;
          nextCell.temperature += diff * HEAT_TRANSFER;
          
          // 2. Combustion
          if (currentCell.type === CellType.FUEL && currentCell.fuel > 0) {
            if (currentCell.temperature > IGNITION_TEMP) {
               const ignitionRandom = Math.random();
               // Higher temp = guaranteed fire
               if (currentCell.temperature > IGNITION_TEMP * 1.5 || ignitionRandom < 0.15) {
                 nextCell.fire = Math.min(1, currentCell.fire + 0.15);
                 nextCell.temperature += 60; // Exothermic
                 nextCell.fuel -= 0.6; 
                 nextCell.smoke += 8; 
               }
            }
          }
          
          // Sustain existing fire
          if (currentCell.fire > 0 && currentCell.fuel > 0) {
             nextCell.temperature += 30;
             nextCell.fuel -= 0.3;
             nextCell.smoke += 4;
             
             // Burn out
             if (nextCell.fuel <= 0) {
                nextCell.fire = 0;
                nextCell.type = CellType.EMPTY;
             }
          } else {
             nextCell.fire *= 0.8; // Die out if no fuel
          }

          // 3. Cooling & Decay
          nextCell.temperature = (nextCell.temperature - AMBIENT_TEMP) * COOLING_RATE + AMBIENT_TEMP;
          nextCell.smoke *= SMOKE_DECAY;

          // 4. Vertical Dynamics (Multi-floor interaction)
          if (f > 0) {
             const cellBelow = this.floors[f - 1][y][x];
             
             // Heat rises significantly
             const heatRise = (cellBelow.temperature - AMBIENT_TEMP) * this.config.verticalConductivity;
             nextCell.temperature += heatRise;
             
             // Smoke rises
             // If the cell below is a wall, it blocks smoke, unless it's broken
             if (cellBelow.type !== CellType.WALL) {
                const risingSmoke = cellBelow.smoke * SMOKE_RISE_RATE;
                nextCell.smoke += risingSmoke;
             }
          }
          
          // Remove smoke that rose away from this floor (if not top floor)
          if (f < NUM_FLOORS - 1) {
             // We can't easily check the cell above's wall status in current architecture efficiently 
             // without checking floors[f+1].
             const cellAbove = this.floors[f+1][y][x];
             if (cellAbove.type !== CellType.WALL) {
                nextCell.smoke -= nextCell.smoke * SMOKE_RISE_RATE * 0.8; 
             }
          }

          // Clamping
          nextCell.temperature = Math.min(nextCell.temperature, MAX_TEMP);
          nextCell.smoke = Math.min(nextCell.smoke, 100);
          nextCell.integrity = Math.max(0, nextCell.integrity);
        }
      }
    }

    this.floors = nextFloors;
  }
}