export const GRID_WIDTH = 60;
export const GRID_HEIGHT = 40;
export const NUM_FLOORS = 3;

// Physics Constants
export const AMBIENT_TEMP = 20;
export const IGNITION_TEMP = 250; // Increased slightly for realism
export const MAX_TEMP = 1500; // Steel melting point range
export const WALL_FAILURE_TEMP = 800; // Concrete spalling / drywall failure
export const WALL_DECAY_RATE = 0.5; // Damage per tick when > FAILURE_TEMP

export const COOLING_RATE = 0.985;
export const SMOKE_DECAY = 0.99;
export const FIRE_SPREAD_CHANCE = 0.12;
export const HEAT_TRANSFER = 0.25;
export const SMOKE_RISE_RATE = 0.4; // Higher rise rate for dramatic effect

// Colors
export const COLOR_WALL = '#334155'; // Slate 700
export const COLOR_WALL_HOT = '#7f1d1d'; // Red 900
export const COLOR_EMPTY = '#020617'; // Slate 950
export const COLOR_FUEL = '#3f3f46'; // Zinc 700