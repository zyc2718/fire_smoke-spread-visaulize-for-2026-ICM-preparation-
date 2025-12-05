# PyroFlow: Advanced Fire Dynamics Simulation

## Overview
PyroFlow is a high-fidelity, cellular automata-based fire simulation designed to model heat propagation, combustion spread, and smoke diffusion across multiple building floors. 

This tool is intended for visualizing fire hazards, understanding vertical fire spread mechanisms (chimney effect), and analyzing structural integrity failures under thermal stress.

## Key Features

### 1. Thermodynamics Engine
*   **Heat Conduction:** Simulates heat transfer between cells and through walls.
*   **Combustion:** Fuel-based fire model with ignition thresholds and burn rates.
*   **Smoke Diffusion:** Fluid-like smoke behavior with rising currents and density accumulation.

### 2. Structural Failure Model
*   **Wall Integrity:** Walls are not invincible. If wall temperature exceeds **800°C** (the critical failure point for many construction materials), structural integrity degrades.
*   **Breach Events:** When integrity reaches 0%, the wall collapses, allowing fire and smoke to rush into adjacent rooms rapidly.

### 3. Vertical Propagation (Chimney Effect)
*   **Natural Rise:** Heat and smoke naturally rise from Floor $N$ to Floor $N+1$.
*   **Forced Breach:** Users can simulate a catastrophic ceiling failure by **double-clicking** (or clicking again) on an already burning active fire. This forces the fire to breach the ceiling immediately and ignite the floor above at the same coordinate.

## Usage Guide

### Controls
*   **Play / Pause:** Toggles the simulation tick engine.
*   **Reset:** Clears all fire, smoke, and restores walls/fuel to initial state.
*   **Ignite:** Click anywhere on the grid to spawn a fire source (Temperature: 900°C).
*   **Force Spread:** Click an existing fire to trigger vertical propagation.

### Reading the Visualization
*   **Walls:** 
    *   **Dark Grey:** Solid, cool wall.
    *   **Red/Glowing:** Superheated wall (>600°C).
    *   **Black/Cracked:** Structural failure imminent.
*   **Fire:**
    *   **White/Yellow:** Intense core heat.
    *   **Orange:** Standard combustion.
*   **Smoke:**
    *   **Blue-Grey Overlay:** Represents smoke density.
*   **Global Haze:** As total smoke mass increases, the entire application interface becomes hazy, simulating reduced visibility in a fire scenario.

## AI Analysis
Click "Generate Report" to send current simulation metrics to the Google Gemini API. It acts as a Fire Safety Officer, providing tactical assessment and evacuation priorities based on the real-time data.

## Technical Details
*   **Algorithm:** 2D Cellular Automata with multi-layer state (Temp, Fuel, Smoke, Fire, Integrity).
*   **Rendering:** HTML5 Canvas + D3.js color scales.
*   **Stack:** React, TypeScript, TailwindCSS.
