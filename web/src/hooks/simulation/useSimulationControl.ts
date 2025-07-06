import { useAtom, useAtomValue, useSetAtom } from 'jotai';
import { useCallback } from 'react';
import { wasmManagerAtom, wasmConfigAtom } from '../../store/atoms/wasm';
import { 
  isSimulationRunningAtom,
  currentGenerationAtom,
} from '../../store/atoms/simulation';
import { resetSimulationAtom, updateSimulationDataAtom, setErrorWithSideEffectsAtom } from '../../store/atoms/actions';
import { clearErrorAtom } from '../../store/atoms/error';
import type { AgentData, Statistics } from '../../types';

export function useSimulationControl() {
  // Atoms
  const wasmManager = useAtomValue(wasmManagerAtom);
  const wasmConfig = useAtomValue(wasmConfigAtom);
  const [isRunning, setIsRunning] = useAtom(isSimulationRunningAtom);
  const currentGeneration = useAtomValue(currentGenerationAtom);
  
  const setError = useSetAtom(setErrorWithSideEffectsAtom);
  const clearError = useSetAtom(clearErrorAtom);
  const resetSimulation = useSetAtom(resetSimulationAtom);
  const updateSimulationData = useSetAtom(updateSimulationDataAtom);

  // Start simulation
  const startSimulation = useCallback(async () => {
    if (!wasmManager || !wasmConfig || isRunning) return;

    try {
      setIsRunning(true);
      clearError();

      // Reset simulation data
      resetSimulation();

      console.log('Starting simulation...');
      // Reset and re-initialize the WASM simulation
      wasmManager.reset();
      const initResult = wasmManager.initialize(wasmConfig);
      console.log('Re-initialization result:', initResult);
      
      // Refresh data after initialization
      try {
        const agentsResult = wasmManager.get_current_agents();
        let agents: AgentData[] = [];
        
        if (typeof agentsResult === 'string') {
          try {
            agents = JSON.parse(agentsResult);
          } catch {
            console.warn('Failed to parse agents result');
          }
        } else if (agentsResult) {
          agents = agentsResult;
        }

        const statsResult = wasmManager.get_current_stats();
        let stats: Statistics = {
          generation: currentGeneration,
          population: agents.length,
          average_score: 0,
          max_score: 0,
          min_score: 0,
          average_cooperation: 0,
          total_battles: 0,
        };
        
        if (typeof statsResult === 'string') {
          try {
            stats = JSON.parse(statsResult);
          } catch {
            console.warn('Failed to parse stats result');
          }
        } else if (statsResult) {
          stats = statsResult;
        }

        console.log('Initial data:', { agents: agents.length, stats });
        
        updateSimulationData({
          agents,
          stats,
          generation: stats.generation,
        });
      } catch (dataError) {
        console.error('Failed to get initial data:', dataError);
        throw dataError;
      }
      
    } catch (error) {
      console.error('Failed to start simulation:', error);
      setError(error instanceof Error ? error.message : 'Failed to start simulation');
      setIsRunning(false);
    }
  }, [wasmManager, wasmConfig, isRunning, setIsRunning, clearError, resetSimulation, currentGeneration, updateSimulationData, setError]);

  // Stop simulation
  const stopSimulation = useCallback(() => {
    setIsRunning(false);
  }, [setIsRunning]);

  // Reset simulation
  const resetSimulationState = useCallback(() => {
    if (!wasmManager) return;

    try {
      wasmManager.reset();
      resetSimulation();
      console.log('Simulation reset successfully');
    } catch (error) {
      console.error('Failed to reset simulation:', error);
      setError(error instanceof Error ? error.message : 'Failed to reset simulation');
    }
  }, [wasmManager, resetSimulation, setError]);

  return {
    // State
    isRunning,
    
    // Actions
    startSimulation,
    stopSimulation,
    resetSimulation: resetSimulationState,
  };
}