import { useAtom, useAtomValue, useSetAtom } from 'jotai';
import { useCallback, useEffect, useRef } from 'react';
import {
  wasmManagerAtom,
  wasmConfigAtom,
  isWasmInitializedAtom,
  isLoadingAtom,
} from '../../store/atoms/wasm';
import { simulationConfigAtom } from '../../store/atoms/config';
import { clearErrorAtom } from '../../store/atoms/error';
import { setErrorWithSideEffectsAtom } from '../../store/atoms/actions';

// Types for WASM module (will be loaded dynamically)
type WasmSimulationManager = any;
type WasmSimulationConfig = any;

export function useWasmManager() {
  // Atoms
  const [wasmManager, setWasmManager] = useAtom(wasmManagerAtom);
  const [wasmConfig, setWasmConfig] = useAtom(wasmConfigAtom);
  const [isInitialized, setIsInitialized] = useAtom(isWasmInitializedAtom);
  const [isLoading, setIsLoading] = useAtom(isLoadingAtom);
  
  const simulationConfig = useAtomValue(simulationConfigAtom);
  const setError = useSetAtom(setErrorWithSideEffectsAtom);
  const clearError = useSetAtom(clearErrorAtom);

  // Refs for cleanup
  const managerRef = useRef<WasmSimulationManager | null>(null);
  const configRef = useRef<WasmSimulationConfig | null>(null);

  // Initialize WASM (only runs once)
  const initializeWasm = useCallback(async () => {
    if (isInitialized || isLoading) return;

    try {
      setIsLoading(true);
      clearError();

      console.log('Initializing WASM module...');
      // Dynamic import of WASM module from assets directory
      const wasmModule = await import('../../assets/pkg/prisoners_dilemma_2d.js');
      await wasmModule.default(); // Initialize WASM
      
      console.log('Creating simulation manager...');
      const manager = new wasmModule.WasmSimulationManager();
      
      console.log('Creating configuration...');
      // Get current config from atom value at initialization time
      const currentConfig = simulationConfig;
      const config = new wasmModule.WasmSimulationConfig(
        currentConfig.world_width,
        currentConfig.world_height,
        currentConfig.initial_population,
        currentConfig.max_generations,
        currentConfig.battles_per_generation,
        currentConfig.neighbor_radius,
        currentConfig.mutation_rate,
        currentConfig.mutation_strength,
        currentConfig.elite_ratio,
        currentConfig.selection_method,
        currentConfig.crossover_method
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
    setWasmManager, 
    setWasmConfig, 
    setIsInitialized, 
    setIsLoading, 
    setError, 
    clearError
  ]);

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

  // Initialize WASM on mount
  useEffect(() => {
    if (!isInitialized && !isLoading) {
      initializeWasm();
    }
  }, [initializeWasm, isInitialized, isLoading]);

  return {
    // State
    wasmManager,
    wasmConfig,
    isInitialized,
    isLoading,
    
    // Actions
    initializeWasm,
    setWasmManager,
    setWasmConfig,
    
    // Refs (for advanced usage)
    managerRef,
    configRef,
  };
}