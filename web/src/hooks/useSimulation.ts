import { useCallback, useEffect, useRef, useState } from 'react';
import type { WasmAgent, WasmSimulation, WasmStatistics } from '../types/wasm';
import { useWasm } from './useWasm';

interface SimulationConfig {
  gridWidth: number;
  gridHeight: number;
  agentCount: number;
  speed: number; // milliseconds between steps
  strategyComplexityPenalty?: boolean;
  strategyComplexityPenaltyRate?: number; // 0.0 to 1.0
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

    const initializeSimulation = () => {
      try {
        const newSimulation = new wasmModule.WasmSimulation(
          config.gridWidth,
          config.gridHeight,
          config.agentCount
        );

        // Apply strategy complexity penalty if enabled
        if (config.strategyComplexityPenalty) {
          newSimulation.set_strategy_complexity_penalty(true);
          if (config.strategyComplexityPenaltyRate !== undefined) {
            newSimulation.set_strategy_complexity_penalty_rate(
              config.strategyComplexityPenaltyRate
            );
          }
        }

        setSimulation(newSimulation);

        // Safe statistics retrieval with delay
        setTimeout(() => {
          try {
            const stats = newSimulation.get_statistics();
            setStatistics(stats);
          } catch (err) {
            console.warn('Failed to get initial statistics:', err);
            setStatistics(null);
          }

          try {
            const initialAgents = newSimulation.get_agents();
            setAgents(initialAgents);
          } catch (err) {
            console.warn('Failed to get initial agents:', err);
            setAgents([]);
          }
        }, 10);

        setError(null);
      } catch (err) {
        console.error('Failed to initialize simulation:', err);
        setError(err instanceof Error ? err.message : 'Failed to initialize simulation');
      }
    };

    initializeSimulation();
  }, [
    wasmModule,
    wasmLoading,
    config.gridWidth,
    config.gridHeight,
    config.agentCount,
    config.strategyComplexityPenalty,
    config.strategyComplexityPenaltyRate,
  ]);

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
      // Reapply strategy complexity penalty setting after reset
      if (config.strategyComplexityPenalty !== undefined) {
        simulation.set_strategy_complexity_penalty(config.strategyComplexityPenalty);
        if (
          config.strategyComplexityPenalty &&
          config.strategyComplexityPenaltyRate !== undefined
        ) {
          simulation.set_strategy_complexity_penalty_rate(config.strategyComplexityPenaltyRate);
        }
      }
      setStatistics(simulation.get_statistics());
      setAgents(simulation.get_agents());
      setError(null);
    } catch (err) {
      console.error('Reset failed:', err);
      setError(err instanceof Error ? err.message : 'Reset failed');
    }
  }, [
    simulation,
    config.agentCount,
    config.strategyComplexityPenalty,
    config.strategyComplexityPenaltyRate,
    pause,
  ]);

  const setStrategyComplexityPenalty = useCallback(
    (enabled: boolean) => {
      if (!simulation) return;

      try {
        simulation.set_strategy_complexity_penalty(enabled);
      } catch (err) {
        console.error('Failed to set strategy complexity penalty:', err);
        setError(err instanceof Error ? err.message : 'Failed to set strategy complexity penalty');
      }
    },
    [simulation]
  );

  const setStrategyComplexityPenaltyRate = useCallback(
    (rate: number) => {
      if (!simulation) return;

      try {
        simulation.set_strategy_complexity_penalty_rate(rate);
      } catch (err) {
        console.error('Failed to set strategy complexity penalty rate:', err);
        setError(
          err instanceof Error ? err.message : 'Failed to set strategy complexity penalty rate'
        );
      }
    },
    [simulation]
  );

  // Update interval when speed changes
  useEffect(() => {
    if (isRunning && intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = window.setInterval(step, config.speed);
    }
  }, [config.speed, isRunning, step]);

  return {
    agents,
    error: wasmError || error,
    isRunning,
    loading: wasmLoading || !simulation,
    pause,
    reset,
    setStrategyComplexityPenalty,
    setStrategyComplexityPenaltyRate,
    simulation,
    start,
    statistics,
    step,
  };
};
