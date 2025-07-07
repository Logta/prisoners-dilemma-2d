import { useCallback, useEffect, useRef, useState } from 'react';
import type { WasmSimulation, WasmStatistics, WasmAgent } from '../types/wasm';
import { useWasm } from './useWasm';

interface SimulationConfig {
  gridWidth: number;
  gridHeight: number;
  agentCount: number;
  speed: number; // milliseconds between steps
}

export const useSimulation = (config: SimulationConfig) => {
  const { wasmModule, loading: wasmLoading, error: wasmError } = useWasm();
  const [simulation, setSimulation] = useState<WasmSimulation | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [statistics, setStatistics] = useState<WasmStatistics | null>(null);
  const [agents, setAgents] = useState<WasmAgent[]>([]);
  const [error, setError] = useState<string | null>(null);
  
  const intervalRef = useRef<number | null>(null);

  // Initialize simulation when WASM module is loaded
  useEffect(() => {
    if (!wasmModule || wasmLoading) return;

    try {
      const newSimulation = new wasmModule.WasmSimulation(
        config.gridWidth,
        config.gridHeight,
        config.agentCount
      );
      
      setSimulation(newSimulation);
      setStatistics(newSimulation.get_statistics());
      setAgents(newSimulation.get_agents());
      setError(null);
    } catch (err) {
      console.error('Failed to initialize simulation:', err);
      setError(err instanceof Error ? err.message : 'Failed to initialize simulation');
    }
  }, [wasmModule, wasmLoading, config.gridWidth, config.gridHeight, config.agentCount]);

  // Clean up simulation on unmount
  useEffect(() => {
    return () => {
      if (simulation) {
        simulation.free();
      }
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [simulation]);

  const step = useCallback(() => {
    if (!simulation) return;

    try {
      const newStats = simulation.step();
      const newAgents = simulation.get_agents();
      
      setStatistics(newStats);
      setAgents(newAgents);
    } catch (err) {
      console.error('Simulation step failed:', err);
      setError(err instanceof Error ? err.message : 'Simulation step failed');
      setIsRunning(false);
    }
  }, [simulation]);

  const start = useCallback(() => {
    if (!simulation || isRunning) return;

    setIsRunning(true);
    intervalRef.current = window.setInterval(step, config.speed);
  }, [simulation, isRunning, step, config.speed]);

  const pause = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setIsRunning(false);
  }, []);

  const reset = useCallback(() => {
    if (!simulation) return;

    pause();
    
    try {
      simulation.reset(config.agentCount);
      setStatistics(simulation.get_statistics());
      setAgents(simulation.get_agents());
      setError(null);
    } catch (err) {
      console.error('Reset failed:', err);
      setError(err instanceof Error ? err.message : 'Reset failed');
    }
  }, [simulation, config.agentCount, pause]);

  // Update interval when speed changes
  useEffect(() => {
    if (isRunning && intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = window.setInterval(step, config.speed);
    }
  }, [config.speed, isRunning, step]);

  return {
    simulation,
    isRunning,
    statistics,
    agents,
    loading: wasmLoading || !simulation,
    error: wasmError || error,
    start,
    pause,
    reset,
    step,
  };
};