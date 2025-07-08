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
  torusField?: boolean;
}

// Helper function to convert WASM agents to plain JavaScript objects
const convertAgentsToPlainObjects = (wasmAgents: WasmAgent[]) => {
  return wasmAgents.map(agent => ({
    id: agent.id,
    x: agent.x,
    y: agent.y,
    strategy: agent.strategy,
    movement_strategy: agent.movement_strategy,
    mobility: agent.mobility,
    score: agent.score,
    cooperation_rate: agent.cooperation_rate,
  }));
};

export const useSimulation = (config: SimulationConfig) => {
  const { wasmModule, loading: wasmLoading, error: wasmError } = useWasm();
  const [simulation, setSimulation] = useState<WasmSimulation | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [statistics, setStatistics] = useState<WasmStatistics | null>(null);
  const [agents, setAgents] = useState<WasmAgent[]>([]);
  const [error, setError] = useState<string | null>(null);

  const intervalRef = useRef<number | null>(null);
  const simulationRef = useRef<WasmSimulation | null>(null);
  const isProcessingRef = useRef(false);

  // Initialize simulation when WASM module is loaded
  useEffect(() => {
    if (!wasmModule || wasmLoading) return;

    const initializeSimulation = () => {
      if (isProcessingRef.current) return;
      
      isProcessingRef.current = true;
      
      try {
        // Clean up existing simulation before creating new one
        if (simulationRef.current) {
          try {
            simulationRef.current.free();
          } catch (err) {
            console.warn('Previous simulation cleanup warning:', err);
          }
          simulationRef.current = null;
        }

        // Clear stale statistics and agents
        setStatistics(null);
        setAgents([]);

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

        // Apply torus field setting if enabled
        if (config.torusField !== undefined) {
          newSimulation.set_torus_field(config.torusField);
        }

        simulationRef.current = newSimulation;
        setSimulation(newSimulation);

        // Try to get initial data immediately (fallback to empty if fails)
        try {
          const stats = newSimulation.get_statistics();
          // Convert to plain JavaScript object to avoid WASM memory issues
          const plainStats = {
            generation: stats.generation,
            total_agents: stats.total_agents,
            all_cooperate_count: stats.all_cooperate_count,
            all_defect_count: stats.all_defect_count,
            tit_for_tat_count: stats.tit_for_tat_count,
            pavlov_count: stats.pavlov_count,
            explorer_count: stats.explorer_count,
            settler_count: stats.settler_count,
            adaptive_count: stats.adaptive_count,
            opportunist_count: stats.opportunist_count,
            social_count: stats.social_count,
            antisocial_count: stats.antisocial_count,
            average_cooperation_rate: stats.average_cooperation_rate,
            average_mobility: stats.average_mobility,
            average_score: stats.average_score,
          };
          setStatistics(plainStats);
        } catch (err) {
          console.warn('Failed to get initial statistics, using fallback:', err);
          setStatistics({
            generation: 0,
            total_agents: config.agentCount,
            all_cooperate_count: 0,
            all_defect_count: 0,
            tit_for_tat_count: 0,
            pavlov_count: 0,
            explorer_count: 0,
            settler_count: 0,
            adaptive_count: 0,
            opportunist_count: 0,
            social_count: 0,
            antisocial_count: 0,
            average_cooperation_rate: 0,
            average_mobility: 0,
            average_score: 0,
          });
        }

        try {
          const initialAgents = newSimulation.get_agents();
          // Convert to plain JavaScript objects to avoid WASM memory issues
          const plainAgents = convertAgentsToPlainObjects(initialAgents);
          setAgents(plainAgents);
        } catch (err) {
          console.warn('Failed to get initial agents:', err);
          setAgents([]);
        }

        setError(null);
      } catch (err) {
        console.error('Failed to initialize simulation:', err);
        setError(err instanceof Error ? err.message : 'Failed to initialize simulation');
      } finally {
        isProcessingRef.current = false;
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
    config.torusField,
  ]);

  // Clean up simulation on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      // Clear state to prevent accessing freed WASM objects
      setStatistics(null);
      setAgents([]);
      setSimulation(null);
      // Reset processing flag
      isProcessingRef.current = false;
      // Only free simulation if it exists and hasn't been freed already
      if (simulationRef.current) {
        try {
          simulationRef.current.free();
          simulationRef.current = null;
        } catch (err) {
          console.warn('Simulation was already freed or in use:', err);
        }
      }
    };
  }, []);

  const step = useCallback(() => {
    if (!simulation || !simulationRef.current || isProcessingRef.current) return;

    isProcessingRef.current = true;

    try {
      const newStats = simulation.step();
      const newAgents = simulation.get_agents();

      // Convert to plain JavaScript object to avoid WASM memory issues
      const plainStats = {
        generation: newStats.generation,
        total_agents: newStats.total_agents,
        all_cooperate_count: newStats.all_cooperate_count,
        all_defect_count: newStats.all_defect_count,
        tit_for_tat_count: newStats.tit_for_tat_count,
        pavlov_count: newStats.pavlov_count,
        explorer_count: newStats.explorer_count,
        settler_count: newStats.settler_count,
        adaptive_count: newStats.adaptive_count,
        opportunist_count: newStats.opportunist_count,
        social_count: newStats.social_count,
        antisocial_count: newStats.antisocial_count,
        average_cooperation_rate: newStats.average_cooperation_rate,
        average_mobility: newStats.average_mobility,
        average_score: newStats.average_score,
      };

      // Convert agents to plain JavaScript objects to avoid WASM memory issues
      const plainAgents = convertAgentsToPlainObjects(newAgents);

      setStatistics(plainStats);
      setAgents(plainAgents);
    } catch (err) {
      console.error('Simulation step failed:', err);
      setError(err instanceof Error ? err.message : 'Simulation step failed');
      setIsRunning(false);
    } finally {
      isProcessingRef.current = false;
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
    if (!simulation || !simulationRef.current || isProcessingRef.current) return;

    pause();

    isProcessingRef.current = true;

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
      // Reapply torus field setting after reset
      if (config.torusField !== undefined) {
        simulation.set_torus_field(config.torusField);
      }
      
      const stats = simulation.get_statistics();
      // Convert to plain JavaScript object to avoid WASM memory issues
      const plainStats = {
        generation: stats.generation,
        total_agents: stats.total_agents,
        all_cooperate_count: stats.all_cooperate_count,
        all_defect_count: stats.all_defect_count,
        tit_for_tat_count: stats.tit_for_tat_count,
        pavlov_count: stats.pavlov_count,
        explorer_count: stats.explorer_count,
        settler_count: stats.settler_count,
        adaptive_count: stats.adaptive_count,
        opportunist_count: stats.opportunist_count,
        social_count: stats.social_count,
        antisocial_count: stats.antisocial_count,
        average_cooperation_rate: stats.average_cooperation_rate,
        average_mobility: stats.average_mobility,
        average_score: stats.average_score,
      };
      
      const agents = simulation.get_agents();
      // Convert agents to plain JavaScript objects to avoid WASM memory issues
      const plainAgents = convertAgentsToPlainObjects(agents);

      setStatistics(plainStats);
      setAgents(plainAgents);
      setError(null);
    } catch (err) {
      console.error('Reset failed:', err);
      setError(err instanceof Error ? err.message : 'Reset failed');
    } finally {
      isProcessingRef.current = false;
    }
  }, [
    simulation,
    config.agentCount,
    config.strategyComplexityPenalty,
    config.strategyComplexityPenaltyRate,
    config.torusField,
    pause,
  ]);

  const setStrategyComplexityPenalty = useCallback(
    (enabled: boolean) => {
      if (!simulation || isProcessingRef.current) return;

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
      if (!simulation || isProcessingRef.current) return;

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

  const setTorusField = useCallback(
    (enabled: boolean) => {
      if (!simulation || isProcessingRef.current) return;

      try {
        simulation.set_torus_field(enabled);
      } catch (err) {
        console.error('Failed to set torus field:', err);
        setError(err instanceof Error ? err.message : 'Failed to set torus field');
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
    setTorusField,
    simulation,
    start,
    statistics,
    step,
  };
};
