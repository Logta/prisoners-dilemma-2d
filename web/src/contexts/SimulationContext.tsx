// ========================================
// Simulation Context
// ========================================

import React, { createContext, type ReactNode, useContext } from 'react';
import { type UseSimulationResult, useSimulation } from '../hooks/useSimulation';
import { type UseWasmEngineResult, useWasmEngine } from '../hooks/useWasmEngine';

export interface SimulationContextValue {
  simulation: UseSimulationResult;
  wasmEngine: UseWasmEngineResult;
}

const SimulationContext = createContext<SimulationContextValue | null>(null);

export interface SimulationProviderProps {
  children: ReactNode;
  initialSimulationId?: string;
}

export function SimulationProvider({ children, initialSimulationId }: SimulationProviderProps) {
  const simulation = useSimulation(initialSimulationId);
  const wasmEngine = useWasmEngine();

  const contextValue: SimulationContextValue = {
    simulation,
    wasmEngine,
  };

  return <SimulationContext.Provider value={contextValue}>{children}</SimulationContext.Provider>;
}

export function useSimulationContext(): SimulationContextValue {
  const context = useContext(SimulationContext);

  if (!context) {
    throw new Error('useSimulationContext must be used within a SimulationProvider');
  }

  return context;
}

// 個別フックのエクスポート（便利関数）
export function useSimulationState() {
  const { simulation } = useSimulationContext();
  return simulation;
}

export function useWasmEngineState() {
  const { wasmEngine } = useSimulationContext();
  return wasmEngine;
}
