// ========================================
// WASM Simulation Hook - Jotai Integration
// ========================================

import { useAtom, useAtomValue, useSetAtom } from 'jotai';
import { useCallback, useEffect, useRef } from 'react';
import {
  wasmManagerAtom,
  wasmConfigAtom,
  isWasmInitializedAtom,
  isSimulationRunningAtom,
  isLoadingAtom,
  simulationConfigAtom,
  updateSimulationDataAtom,
  setErrorAtom,
  clearErrorAtom,
  resetSimulationAtom,
  currentGenerationAtom,
} from '../store/atoms';
import type { AgentData, Statistics } from '../types';

// Types for WASM module (will be loaded dynamically)
type WasmSimulationManager = any;
type WasmSimulationConfig = any;

export function useWasmSimulation() {
  // Atoms
  const [wasmManager, setWasmManager] = useAtom(wasmManagerAtom);
  const [wasmConfig, setWasmConfig] = useAtom(wasmConfigAtom);
  const [isInitialized, setIsInitialized] = useAtom(isWasmInitializedAtom);
  const [isRunning, setIsRunning] = useAtom(isSimulationRunningAtom);
  const [isLoading, setIsLoading] = useAtom(isLoadingAtom);
  
  const simulationConfig = useAtomValue(simulationConfigAtom);
  const currentGeneration = useAtomValue(currentGenerationAtom);
  
  const updateSimulationData = useSetAtom(updateSimulationDataAtom);
  const setError = useSetAtom(setErrorAtom);
  const clearError = useSetAtom(clearErrorAtom);
  const resetSimulation = useSetAtom(resetSimulationAtom);

  // Refs for cleanup
  const managerRef = useRef<WasmSimulationManager | null>(null);
  const configRef = useRef<WasmSimulationConfig | null>(null);

  // ========================================
  // WASM Initialization
  // ========================================

  const initializeWasm = useCallback(async () => {
    if (isInitialized || isLoading) return;

    try {
      setIsLoading(true);
      clearError();

      console.log('Initializing WASM module...');
      // Dynamic import of WASM module from assets directory
      const wasmModule = await import('../assets/wasm/prisoners_dilemma_2d.js');
      await wasmModule.default(); // Initialize WASM
      
      console.log('Creating simulation manager...');
      const manager = new wasmModule.WasmSimulationManager();
      
      console.log('Creating configuration...');
      const config = new wasmModule.WasmSimulationConfig(
        simulationConfig.world_width,
        simulationConfig.world_height,
        simulationConfig.initial_population,
        simulationConfig.max_generations,
        simulationConfig.battles_per_generation,
        simulationConfig.neighbor_radius,
        simulationConfig.mutation_rate,
        simulationConfig.mutation_strength,
        simulationConfig.elite_ratio,
        simulationConfig.selection_method,
        simulationConfig.crossover_method
      );

      // Initialize simulation
      console.log('Initializing simulation...');
      const initResult = manager.initialize(config);
      console.log('Initialization result:', initResult);

      // Store references
      managerRef.current = manager;
      configRef.current = config;
      setWasmManager(manager);
      setWasmConfig(config);
      setIsInitialized(true);

      console.log('WASM initialization completed successfully');
    } catch (error) {
      console.error('WASM initialization failed:', error);
      setError(error instanceof Error ? error.message : 'WASM initialization failed');
    } finally {
      setIsLoading(false);
    }
  }, [
    isInitialized, 
    isLoading, 
    simulationConfig, 
    setWasmManager, 
    setWasmConfig, 
    setIsInitialized, 
    setIsLoading, 
    setError, 
    clearError
  ]);

  // ========================================
  // Simulation Control
  // ========================================

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

  const stopSimulation = useCallback(() => {
    setIsRunning(false);
  }, [setIsRunning]);

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

  // ========================================
  // Step Execution
  // ========================================

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
  }, [wasmManager, isInitialized, setError]);

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
  }, [wasmManager, isInitialized, setError, setIsRunning]);

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
  }, [wasmManager, wasmConfig, isInitialized, setIsLoading, setError, setIsRunning]);

  // ========================================
  // Data Fetching
  // ========================================

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

  // ========================================
  // Configuration Updates
  // ========================================

  const updateConfiguration = useCallback(async () => {
    if (!wasmManager || !isInitialized) return;

    try {
      setIsLoading(true);
      
      // Import WASM module again for new config
      const wasmModule = await import('../assets/wasm/prisoners_dilemma_2d.js');
      
      // Free old config
      if (configRef.current && typeof configRef.current.free === 'function') {
        configRef.current.free();
      }

      // Create new config
      const newConfig = new wasmModule.WasmSimulationConfig(
        simulationConfig.world_width,
        simulationConfig.world_height,
        simulationConfig.initial_population,
        simulationConfig.max_generations,
        simulationConfig.battles_per_generation,
        simulationConfig.neighbor_radius,
        simulationConfig.mutation_rate,
        simulationConfig.mutation_strength,
        simulationConfig.elite_ratio,
        simulationConfig.selection_method,
        simulationConfig.crossover_method
      );

      // Free old manager and create new one to avoid aliasing issues
      if (managerRef.current && typeof managerRef.current.free === 'function') {
        managerRef.current.free();
      }
      
      const newManager = new wasmModule.WasmSimulationManager();
      newManager.initialize(newConfig);

      // Update all references
      managerRef.current = newManager;
      configRef.current = newConfig;
      setWasmManager(newManager);
      setWasmConfig(newConfig);

      resetSimulation();
      // Don't refresh data immediately as there are no agents yet
      // The data will be populated when the simulation actually starts
      
      console.log('Configuration updated successfully');
    } catch (error) {
      console.error('Failed to update configuration:', error);
      setError(error instanceof Error ? error.message : 'Failed to update configuration');
    } finally {
      setIsLoading(false);
    }
  }, [wasmManager, isInitialized, simulationConfig, setWasmManager, setWasmConfig, resetSimulation, refreshSimulationData, setIsLoading, setError]);

  // ========================================
  // Effects
  // ========================================

  // Initialize WASM on mount
  useEffect(() => {
    if (!isInitialized && !isLoading) {
      initializeWasm();
    }
  }, [initializeWasm, isInitialized, isLoading]);

  // Update configuration when simulation config changes
  useEffect(() => {
    if (isInitialized && !isRunning) {
      updateConfiguration();
    }
  }, [simulationConfig, isInitialized, isRunning]); // Remove updateConfiguration from dependencies

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (managerRef.current && typeof managerRef.current.free === 'function') {
        managerRef.current.free();
      }
      if (configRef.current && typeof configRef.current.free === 'function') {
        configRef.current.free();
      }
    };
  }, []);

  // ========================================
  // Return API
  // ========================================

  return {
    // State
    isInitialized,
    isRunning,
    isLoading,
    
    // Actions
    initializeWasm,
    startSimulation,
    stopSimulation,
    resetSimulation: resetSimulationState,
    runStep,
    runGeneration,
    runMultipleGenerations,
    refreshSimulationData,
    getAgentAt,
    updateConfiguration,
    
    // WASM instances (for advanced usage)
    wasmManager,
    wasmConfig,
  };
}