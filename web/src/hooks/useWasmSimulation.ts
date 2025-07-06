// ========================================
// WASM Simulation Hook - Composed from smaller hooks
// ========================================

import { useWasmManager } from './simulation/useWasmManager';
import { useSimulationControl } from './simulation/useSimulationControl';
import { useSimulationExecution } from './simulation/useSimulationExecution';
import { useSimulationData } from './simulation/useSimulationData';
import { useSimulationConfig } from './simulation/useSimulationConfig';

export function useWasmSimulation() {
  // Compose functionality from smaller hooks
  const wasmManager = useWasmManager();
  const simulationControl = useSimulationControl();
  const simulationExecution = useSimulationExecution();
  const simulationData = useSimulationData();
  const simulationConfig = useSimulationConfig();

  // ========================================
  // Return composed API
  // ========================================

  return {
    // State from WASM manager
    isInitialized: wasmManager.isInitialized,
    isLoading: wasmManager.isLoading || simulationExecution.isLoading || simulationConfig.isLoading,
    
    // State from simulation control
    isRunning: simulationControl.isRunning,
    
    // Actions from WASM manager
    initializeWasm: wasmManager.initializeWasm,
    
    // Actions from simulation control
    startSimulation: simulationControl.startSimulation,
    stopSimulation: simulationControl.stopSimulation,
    resetSimulation: simulationControl.resetSimulation,
    
    // Actions from simulation execution
    runStep: simulationExecution.runStep,
    runGeneration: simulationExecution.runGeneration,
    runMultipleGenerations: simulationExecution.runMultipleGenerations,
    
    // Actions from simulation data
    refreshSimulationData: simulationData.refreshSimulationData,
    getAgentAt: simulationData.getAgentAt,
    
    // Actions from simulation config
    updateConfiguration: simulationConfig.updateConfiguration,
    
    // WASM instances (for advanced usage)
    wasmManager: wasmManager.wasmManager,
    wasmConfig: wasmManager.wasmConfig,
  };
}