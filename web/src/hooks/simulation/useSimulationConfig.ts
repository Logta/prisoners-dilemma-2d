import { useAtom, useAtomValue, useSetAtom } from 'jotai';
import { useCallback, useEffect, useRef } from 'react';
import {
  wasmManagerAtom,
  wasmConfigAtom,
  isWasmInitializedAtom,
  isLoadingAtom,
} from '../../store/atoms/wasm';
// import { isSimulationRunningAtom } from '../../store/atoms/simulation'; // Removed - not used
import { simulationConfigAtom } from '../../store/atoms/config';
import { resetSimulationAtom, setErrorWithSideEffectsAtom } from '../../store/atoms/actions';

// Types for WASM module
type WasmSimulationManager = any;
type WasmSimulationConfig = any;

export function useSimulationConfig() {
  // Atoms
  const wasmManager = useAtomValue(wasmManagerAtom);
  const [wasmConfig, setWasmConfig] = useAtom(wasmConfigAtom);
  const setWasmManager = useSetAtom(wasmManagerAtom);
  const isInitialized = useAtomValue(isWasmInitializedAtom);
  // const isRunning = useAtomValue(isSimulationRunningAtom); // Removed - not used
  const [isLoading, setIsLoading] = useAtom(isLoadingAtom);
  const simulationConfig = useAtomValue(simulationConfigAtom);
  const resetSimulation = useSetAtom(resetSimulationAtom);
  const setError = useSetAtom(setErrorWithSideEffectsAtom);

  // Refs for WASM instances
  const managerRef = useRef<WasmSimulationManager | null>(null);
  const configRef = useRef<WasmSimulationConfig | null>(null);

  // Sync refs with atoms
  useEffect(() => {
    managerRef.current = wasmManager;
  }, [wasmManager]);

  useEffect(() => {
    configRef.current = wasmConfig;
  }, [wasmConfig]);

  // Update configuration
  const updateConfiguration = useCallback(async () => {
    if (!wasmManager || !isInitialized) return;

    try {
      setIsLoading(true);
      
      // Import WASM module again for new config
      const wasmModule = await import('../../assets/pkg/prisoners_dilemma_2d.js');
      
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
  }, [wasmManager, isInitialized, simulationConfig, setWasmManager, setWasmConfig, resetSimulation, setIsLoading, setError]);

  // Note: Configuration updates are now manual to avoid multiple WASM initializations
  // Call updateConfiguration() when needed rather than automatically on config changes

  return {
    // State
    wasmConfig,
    isLoading,
    
    // Actions
    updateConfiguration,
  };
}