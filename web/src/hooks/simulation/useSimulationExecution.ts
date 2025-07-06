import { useAtom, useAtomValue, useSetAtom } from 'jotai';
import { useCallback } from 'react';
import {
  wasmManagerAtom,
  wasmConfigAtom,
  isWasmInitializedAtom,
  isLoadingAtom,
} from '../../store/atoms/wasm';
import {
  isSimulationRunningAtom,
  currentGenerationAtom,
} from '../../store/atoms/simulation';
import { updateSimulationDataAtom, setErrorWithSideEffectsAtom } from '../../store/atoms/actions';
import type { AgentData, Statistics } from '../../types';

export function useSimulationExecution() {
  // Atoms
  const wasmManager = useAtomValue(wasmManagerAtom);
  const wasmConfig = useAtomValue(wasmConfigAtom);
  const isInitialized = useAtomValue(isWasmInitializedAtom);
  const [isLoading, setIsLoading] = useAtom(isLoadingAtom);
  const setIsRunning = useSetAtom(isSimulationRunningAtom);
  const setError = useSetAtom(setErrorWithSideEffectsAtom);

  const updateSimulationData = useSetAtom(updateSimulationDataAtom);

  // Refresh simulation data (inline to avoid circular dependency)
  const refreshSimulationData = useCallback(async () => {
    if (!wasmManager || !isInitialized) {
      throw new Error('Simulation not initialized');
    }

    try {
      // Get current agents
      let agents: AgentData[] = [];
      try {
        const agentsResult = wasmManager.get_current_agents();
        
        if (typeof agentsResult === 'string') {
          try {
            agents = JSON.parse(agentsResult);
          } catch {
            console.warn('Failed to parse agents result');
          }
        } else if (agentsResult) {
          agents = agentsResult;
        }
      } catch (error) {
        console.warn('No agents available yet:', error);
        agents = [];
      }

      // Get current statistics
      const currentGeneration = wasmManager.get_current_generation?.() || 0;
      let stats: Statistics = {
        generation: currentGeneration,
        population: agents.length,
        average_score: 0,
        max_score: 0,
        min_score: 0,
        average_cooperation: 0,
        total_battles: 0,
      };
      
      try {
        const statsResult = wasmManager.get_current_stats();
        if (typeof statsResult === 'string') {
          try {
            stats = JSON.parse(statsResult);
          } catch {
            console.warn('Failed to parse stats result');
          }
        } else if (statsResult) {
          stats = statsResult;
        }
      } catch (error) {
        console.warn('Failed to get stats:', error);
      }

      updateSimulationData({
        agents,
        stats,
        generation: stats.generation,
      });
    } catch (error) {
      console.error('Failed to refresh simulation data:', error);
      setError(error instanceof Error ? error.message : 'Failed to refresh simulation data');
    }
  }, [wasmManager, isInitialized, updateSimulationData, setError]);

  // Run single step
  const runStep = useCallback(async () => {
    if (!wasmManager || !isInitialized) return;

    try {
      const result = wasmManager.step();
      console.log('Step result:', result);
      await refreshSimulationData();
    } catch (error) {
      console.error('Failed to run step:', error);
      setError(error instanceof Error ? error.message : 'Failed to run step');
    }
  }, [wasmManager, isInitialized, refreshSimulationData, setError]);

  // Run single generation
  const runGeneration = useCallback(async () => {
    if (!wasmManager || !isInitialized) return;

    try {
      const result = wasmManager.run_generation();
      console.log('Generation result:', result);
      await refreshSimulationData();
      
      // Check if simulation is finished
      if (wasmManager.is_finished()) {
        setIsRunning(false);
        console.log('Simulation completed');
      }
    } catch (error) {
      console.error('Failed to run generation:', error);
      setError(error instanceof Error ? error.message : 'Failed to run generation');
    }
  }, [wasmManager, isInitialized, refreshSimulationData, setError, setIsRunning]);

  // Run multiple generations
  const runMultipleGenerations = useCallback(async (generations: number) => {
    if (!wasmManager || !wasmConfig || !isInitialized) return;

    try {
      setIsLoading(true);
      const result = wasmManager.run_simulation(wasmConfig, generations);
      console.log(`Ran ${generations} generations:`, result);
      await refreshSimulationData();
      
      // Check if simulation is finished
      if (wasmManager.is_finished()) {
        setIsRunning(false);
        console.log('Simulation completed');
      }
    } catch (error) {
      console.error(`Failed to run ${generations} generations:`, error);
      setError(error instanceof Error ? error.message : `Failed to run ${generations} generations`);
    } finally {
      setIsLoading(false);
    }
  }, [wasmManager, wasmConfig, isInitialized, refreshSimulationData, setIsLoading, setError, setIsRunning]);

  return {
    // State
    isLoading,
    
    // Actions
    runStep,
    runGeneration,
    runMultipleGenerations,
  };
}