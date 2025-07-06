import { atom } from 'jotai';
import type { SimulationConfig } from '../../types';

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