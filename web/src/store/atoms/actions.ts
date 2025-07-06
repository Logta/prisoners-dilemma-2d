import { atom } from 'jotai';
import type { AgentData, Statistics } from '../../types';
import { 
  currentGenerationAtom, 
  agentsAtom, 
  statisticsAtom, 
  generationHistoryAtom, 
  selectedAgentAtom, 
  selectedPositionAtom, 
  isSimulationRunningAtom 
} from './simulation';
import { errorAtom, setErrorAtom } from './error';
import { isLoadingAtom } from './wasm';

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

// Set error with side effects (stops loading and simulation)
export const setErrorWithSideEffectsAtom = atom(
  null,
  (_get, set, error: string | null) => {
    set(setErrorAtom, error);
    if (error) {
      set(isLoadingAtom, false);
      set(isSimulationRunningAtom, false);
    }
  }
);