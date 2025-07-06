// ========================================
// Jotai Global State Management - Clean Architecture対応
// ========================================

import { atom } from 'jotai';
// Types from WASM module - these will be available at runtime
type WasmSimulationManager = any;
type WasmSimulationConfig = any;
type WasmBattleManager = any;
import type { AgentData, Statistics, SimulationConfig } from '../types';

// ========================================
// WASM Instance Atoms
// ========================================

export const wasmManagerAtom = atom<WasmSimulationManager | null>(null);
export const wasmConfigAtom = atom<WasmSimulationConfig | null>(null);
export const wasmBattleManagerAtom = atom<WasmBattleManager | null>(null);

// ========================================
// State Management Atoms
// ========================================

export const isWasmInitializedAtom = atom<boolean>(false);
export const isSimulationRunningAtom = atom<boolean>(false);
export const isLoadingAtom = atom<boolean>(false);
export const errorAtom = atom<string | null>(null);

// ========================================
// Simulation Data Atoms
// ========================================

export const currentGenerationAtom = atom<number>(0);
export const agentsAtom = atom<AgentData[]>([]);
export const statisticsAtom = atom<Statistics>({
  generation: 0,
  population: 0,
  average_score: 0,
  max_score: 0,
  min_score: 0,
  average_cooperation: 0,
  total_battles: 0,
});

// ========================================
// Configuration Atoms
// ========================================

export const simulationConfigAtom = atom<SimulationConfig>({
  world_width: 50,
  world_height: 50,
  initial_population: 100,
  max_generations: 1000,
  battles_per_generation: 100,
  neighbor_radius: 2,
  mutation_rate: 0.1,
  mutation_strength: 0.05,
  elite_ratio: 0.1,
  selection_method: "Tournament",
  crossover_method: "Uniform",
});

// ========================================
// UI State Atoms
// ========================================

export const visualizationModeAtom = atom<'cooperation' | 'score' | 'movement'>('cooperation');
export const showGridAtom = atom<boolean>(true);
export const showCoordinatesAtom = atom<boolean>(false);
export const autoRunAtom = atom<boolean>(false);
export const autoRunSpeedAtom = atom<number>(100); // ms per generation

// ========================================
// History Tracking Atoms
// ========================================

export const generationHistoryAtom = atom<Statistics[]>([]);
export const selectedAgentAtom = atom<AgentData | null>(null);
export const selectedPositionAtom = atom<{ x: number; y: number } | null>(null);

// ========================================
// Derived Atoms (Read-only computed values)
// ========================================

// Grid dimensions derived from config
export const gridDimensionsAtom = atom((get) => {
  const config = get(simulationConfigAtom);
  return {
    width: config.world_width,
    height: config.world_height,
  };
});

// Simulation progress percentage
export const simulationProgressAtom = atom((get) => {
  const config = get(simulationConfigAtom);
  const currentGen = get(currentGenerationAtom);
  return (currentGen / config.max_generations) * 100;
});

// Is simulation finished
export const isSimulationFinishedAtom = atom((get) => {
  const config = get(simulationConfigAtom);
  const currentGen = get(currentGenerationAtom);
  return currentGen >= config.max_generations;
});

// Agent count by type
export const agentStatsByTypeAtom = atom((get) => {
  const agents = get(agentsAtom);
  
  let cooperators = 0;
  let defectors = 0;
  let alive = 0;
  
  agents.forEach(agent => {
    if (agent.is_alive) {
      alive++;
      if (agent.cooperation_tendency > 0.5) {
        cooperators++;
      } else {
        defectors++;
      }
    }
  });
  
  return {
    total: agents.length,
    alive,
    cooperators,
    defectors,
    cooperationRate: alive > 0 ? cooperators / alive : 0,
  };
});

// ========================================
// Action Atoms (Write operations)
// ========================================

// Reset all simulation data
export const resetSimulationAtom = atom(
  null,
  (_get, set) => {
    set(currentGenerationAtom, 0);
    set(agentsAtom, []);
    set(generationHistoryAtom, []);
    set(selectedAgentAtom, null);
    set(selectedPositionAtom, null);
    set(errorAtom, null);
    set(isSimulationRunningAtom, false);
    set(statisticsAtom, {
      generation: 0,
      population: 0,
      average_score: 0,
      max_score: 0,
      min_score: 0,
      average_cooperation: 0,
      total_battles: 0,
    });
  }
);

// Update simulation data
export const updateSimulationDataAtom = atom(
  null,
  (get, set, update: { agents?: AgentData[]; stats?: Statistics; generation?: number }) => {
    if (update.agents) {
      set(agentsAtom, update.agents);
    }
    if (update.stats) {
      set(statisticsAtom, update.stats);
      // Add to history
      const history = get(generationHistoryAtom);
      set(generationHistoryAtom, [...history, update.stats]);
    }
    if (update.generation !== undefined) {
      set(currentGenerationAtom, update.generation);
    }
  }
);

// Set error state
export const setErrorAtom = atom(
  null,
  (_get, set, error: string | null) => {
    set(errorAtom, error);
    if (error) {
      set(isLoadingAtom, false);
      set(isSimulationRunningAtom, false);
    }
  }
);

// Clear error state
export const clearErrorAtom = atom(
  null,
  (_get, set) => {
    set(errorAtom, null);
  }
);

// ========================================
// Configuration Actions
// ========================================

// Update single config property
export const updateConfigAtom = atom(
  null,
  (get, set, update: Partial<SimulationConfig>) => {
    const current = get(simulationConfigAtom);
    set(simulationConfigAtom, { ...current, ...update });
  }
);

// Load preset configuration
export const loadPresetConfigAtom = atom(
  null,
  (get, set, preset: 'small' | 'medium' | 'large' | 'custom') => {
    const presets: Record<string, SimulationConfig> = {
      small: {
        world_width: 30,
        world_height: 30,
        initial_population: 50,
        max_generations: 100,
        battles_per_generation: 50,
        neighbor_radius: 2,
        mutation_rate: 0.1,
        mutation_strength: 0.05,
        elite_ratio: 0.1,
        selection_method: "Tournament",
        crossover_method: "Uniform",
      },
      medium: {
        world_width: 50,
        world_height: 50,
        initial_population: 100,
        max_generations: 500,
        battles_per_generation: 100,
        neighbor_radius: 2,
        mutation_rate: 0.1,
        mutation_strength: 0.05,
        elite_ratio: 0.1,
        selection_method: "Tournament",
        crossover_method: "Uniform",
      },
      large: {
        world_width: 100,
        world_height: 100,
        initial_population: 500,
        max_generations: 1000,
        battles_per_generation: 200,
        neighbor_radius: 3,
        mutation_rate: 0.1,
        mutation_strength: 0.05,
        elite_ratio: 0.15,
        selection_method: "Tournament",
        crossover_method: "Uniform",
      },
      custom: get(simulationConfigAtom), // Keep current config
    };
    
    if (preset !== 'custom') {
      set(simulationConfigAtom, presets[preset]);
    }
  }
);