import { useAtomValue, useSetAtom } from 'jotai';
import { useCallback } from 'react';
import { wasmManagerAtom, isWasmInitializedAtom } from '../../store/atoms/wasm';
import { currentGenerationAtom } from '../../store/atoms/simulation';
import { updateSimulationDataAtom, setErrorWithSideEffectsAtom } from '../../store/atoms/actions';
import type { AgentData, Statistics } from '../../types';

export function useSimulationData() {
  // Atoms
  const wasmManager = useAtomValue(wasmManagerAtom);
  const isInitialized = useAtomValue(isWasmInitializedAtom);
  const currentGeneration = useAtomValue(currentGenerationAtom);
  const updateSimulationData = useSetAtom(updateSimulationDataAtom);
  const setError = useSetAtom(setErrorWithSideEffectsAtom);

  // Refresh simulation data
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
        // Handle case where simulation is initialized but has no agents yet
        console.warn('No agents available yet:', error);
        agents = [];
      }

      // Get current statistics
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

      console.log('Refreshed data:', { agents: agents.length, stats });
      
      updateSimulationData({
        agents,
        stats,
        generation: stats.generation,
      });
    } catch (error) {
      console.error('Failed to refresh simulation data:', error);
      setError(error instanceof Error ? error.message : 'Failed to refresh simulation data');
    }
  }, [wasmManager, isInitialized, currentGeneration, updateSimulationData, setError]);

  // Get agent at specific position
  const getAgentAt = useCallback(async (x: number, y: number): Promise<AgentData | null> => {
    if (!wasmManager) return null;

    try {
      const result = wasmManager.get_agent_at(x, y);
      if (!result) return null;
      
      if (typeof result === 'string') {
        try {
          return JSON.parse(result);
        } catch {
          return null;
        }
      }
      return result;
    } catch (error) {
      console.error(`Failed to get agent at (${x}, ${y}):`, error);
      return null;
    }
  }, [wasmManager]);

  return {
    // Actions
    refreshSimulationData,
    getAgentAt,
  };
}