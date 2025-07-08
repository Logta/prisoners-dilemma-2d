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
  const result = wasmAgents.map(agent => {
    try {
      return {
        id: agent.id,
        x: agent.x,
        y: agent.y,
        strategy: agent.strategy,
        movement_strategy: agent.movement_strategy,
        mobility: agent.mobility,
        score: agent.score,
        cooperation_rate: agent.cooperation_rate,
      };
    } catch (err) {
      console.warn('Failed to convert agent:', err);
      return {
        id: '',
        x: 0,
        y: 0,
        strategy: 0,
        movement_strategy: 0,
        mobility: 0,
        score: 0,
        cooperation_rate: 0,
      };
    }
  });
  
  // 強制的にガベージコレクションを促す（開発環境のみ）
  if (typeof window !== 'undefined' && (window as any).gc) {
    try {
      (window as any).gc();
    } catch (e) {
      // gc() is not available in all environments
    }
  }
  
  return result;
};

// Helper function to safely convert WASM statistics to plain JavaScript objects
const convertStatsToPlainObject = (wasmStats: WasmStatistics) => {
  try {
    const result = {
      generation: wasmStats.generation,
      total_agents: wasmStats.total_agents,
      all_cooperate_count: wasmStats.all_cooperate_count,
      all_defect_count: wasmStats.all_defect_count,
      tit_for_tat_count: wasmStats.tit_for_tat_count,
      pavlov_count: wasmStats.pavlov_count,
      explorer_count: wasmStats.explorer_count,
      settler_count: wasmStats.settler_count,
      adaptive_count: wasmStats.adaptive_count,
      opportunist_count: wasmStats.opportunist_count,
      social_count: wasmStats.social_count,
      antisocial_count: wasmStats.antisocial_count,
      average_cooperation_rate: wasmStats.average_cooperation_rate,
      average_mobility: wasmStats.average_mobility,
      average_score: wasmStats.average_score,
    };
    
    // 強制的にガベージコレクションを促す（開発環境のみ）
    if (typeof window !== 'undefined' && (window as any).gc) {
      try {
        (window as any).gc();
      } catch (e) {
        // gc() is not available in all environments
      }
    }
    
    return result;
  } catch (err) {
    console.warn('Failed to convert statistics:', err);
    return {
      generation: 0,
      total_agents: 0,
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
    };
  }
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

  // 強制的にシミュレーションを停止・クリーンアップする関数
  const forceCleanup = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setIsRunning(false);
    isProcessingRef.current = false;
    setStatistics(null);
    setAgents([]);
    setSimulation(null);
    
    if (simulationRef.current) {
      try {
        simulationRef.current.free();
      } catch (err) {
        console.warn('Cleanup warning during force cleanup:', err);
      } finally {
        simulationRef.current = null;
      }
    }
  }, []);

  // エラー時に完全に新しいシミュレーションを作成するフラグ
  const [shouldRecreateSimulation, setShouldRecreateSimulation] = useState(false);

  // エラー時に完全に新しいシミュレーションを作成する関数
  const recreateSimulation = useCallback(() => {
    if (!wasmModule || isProcessingRef.current) return;
    
    console.log('Recreating simulation due to error...');
    
    // 完全なクリーンアップ
    forceCleanup();
    
    // フラグを設定して、useEffectで処理する
    setShouldRecreateSimulation(true);
  }, [wasmModule, forceCleanup]);

  // シミュレーション再作成のuseEffect
  useEffect(() => {
    if (!shouldRecreateSimulation || !wasmModule) return;
    
    const timeoutId = setTimeout(() => {
      try {
        const newSimulation = new wasmModule.WasmSimulation(
          config.gridWidth,
          config.gridHeight,
          config.agentCount
        );

        // 設定を再適用
        if (config.strategyComplexityPenalty) {
          newSimulation.set_strategy_complexity_penalty(true);
          if (config.strategyComplexityPenaltyRate !== undefined) {
            newSimulation.set_strategy_complexity_penalty_rate(
              config.strategyComplexityPenaltyRate
            );
          }
        }

        if (config.torusField !== undefined) {
          newSimulation.set_torus_field(config.torusField);
        }

        simulationRef.current = newSimulation;
        setSimulation(newSimulation);

        // 初期データの取得
        try {
          const stats = newSimulation.get_statistics();
          const plainStats = convertStatsToPlainObject(stats);
          setStatistics(plainStats);
        } catch (err) {
          console.warn('Failed to get initial statistics after recreation:', err);
        }

        try {
          const initialAgents = newSimulation.get_agents();
          const plainAgents = convertAgentsToPlainObjects(initialAgents);
          setAgents(plainAgents);
        } catch (err) {
          console.warn('Failed to get initial agents after recreation:', err);
        }

        setError(null);
        console.log('Simulation recreated successfully');
      } catch (err) {
        console.error('Failed to recreate simulation:', err);
        setError('シミュレーションの復旧に失敗しました。ページを再読み込みするか、Resetボタンをお試しください。');
      }
      
      setShouldRecreateSimulation(false);
    }, 100);

    return () => clearTimeout(timeoutId);
  }, [shouldRecreateSimulation, wasmModule, config]);

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
          const plainStats = convertStatsToPlainObject(stats);
          setStatistics(plainStats);
          // WASMオブジェクトの参照を即座に破棄
          // stats = null;
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
          // WASMオブジェクトの参照を即座に破棄
          // initialAgents = null;
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
      forceCleanup();
    };
  }, [forceCleanup]);

  const step = useCallback(() => {
    if (!simulation || !simulationRef.current || isProcessingRef.current) return;

    // ステップ実行前にもエージェントの存在をチェック
    if (!agents || agents.length === 0) {
      setError('エージェントが配置されていません。リセットしてエージェントを配置してください。');
      return;
    }

    // 統計情報からエージェント数を再確認
    if (statistics && statistics.total_agents === 0) {
      setError('エージェントが配置されていません。リセットしてエージェントを配置してください。');
      return;
    }

    isProcessingRef.current = true;

    try {
      // WASMオブジェクトの参照を即座に処理して破棄
      let plainStats: any = null;
      let plainAgents: any = null;

      // 統計情報の取得と即座の変換・破棄
      try {
        const newStats = simulation.step();
        plainStats = convertStatsToPlainObject(newStats);
        // WASMオブジェクトの参照を即座に破棄
        // newStats = null; // 明示的にnullを設定
      } catch (stepErr) {
        console.error('Failed to get simulation step:', stepErr);
        throw stepErr;
      }

      // エージェント情報の取得と即座の変換・破棄
      try {
        const newAgents = simulation.get_agents();
        plainAgents = convertAgentsToPlainObjects(newAgents);
        // WASMオブジェクトの参照を即座に破棄
        // newAgents = null; // 明示的にnullを設定
      } catch (agentErr) {
        console.error('Failed to get agents:', agentErr);
        throw agentErr;
      }

      // エージェントが存在しない場合はシミュレーションを停止
      if (!plainAgents || plainAgents.length === 0 || plainStats.total_agents === 0) {
        setError('すべてのエージェントが消失しました。シミュレーションを停止します。');
        setIsRunning(false);
        return;
      }

      // 状態の更新
      setStatistics(plainStats);
      setAgents(plainAgents);
    } catch (err) {
      console.error('Simulation step failed:', err);
      setError(err instanceof Error ? err.message : 'Simulation step failed');
      setIsRunning(false);
      
      // 重大なエラーの場合はシミュレーションを再作成
      if (err instanceof Error && err.message.includes('index out of bounds')) {
        console.warn('Critical WASM error detected, recreating simulation');
        recreateSimulation();
      }
    } finally {
      isProcessingRef.current = false;
    }
  }, [simulation, agents, statistics, forceCleanup, recreateSimulation]);

  const start = useCallback(() => {
    if (!simulation || isRunning || isProcessingRef.current) return;

    // エージェントが存在しない場合は開始できない
    if (!agents || agents.length === 0) {
      setError('エージェントが配置されていません。リセットしてエージェントを配置してください。');
      return;
    }

    // 統計情報からエージェント数を再確認
    if (statistics && statistics.total_agents === 0) {
      setError('エージェントが配置されていません。リセットしてエージェントを配置してください。');
      return;
    }

    setIsRunning(true);
    intervalRef.current = window.setInterval(() => {
      // intervalでのstep実行時にもシミュレーションの有効性をチェック
      if (!simulationRef.current) {
        setIsRunning(false);
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
        return;
      }
      
      // シミュレーションの健全性をチェック
      try {
        // 基本的なアクセステストとしてエージェント数をチェック
        if (simulationRef.current && statistics && statistics.total_agents > 0) {
          step();
        } else {
          console.warn('Simulation appears to be in invalid state, stopping');
          setIsRunning(false);
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
          }
        }
      } catch (err) {
        console.error('Error during interval step:', err);
        setIsRunning(false);
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
      }
    }, config.speed);
  }, [simulation, isRunning, step, config.speed, agents, statistics]);

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
      
      // 統計情報の取得と即座の変換・破棄
      const stats = simulation.get_statistics();
      const plainStats = convertStatsToPlainObject(stats);
      // WASMオブジェクトの参照を即座に破棄
      // stats = null;
      
      // エージェント情報の取得と即座の変換・破棄
      const agents = simulation.get_agents();
      const plainAgents = convertAgentsToPlainObjects(agents);
      // WASMオブジェクトの参照を即座に破棄
      // agents = null;

      setStatistics(plainStats);
      setAgents(plainAgents);
      setError(null);
    } catch (err) {
      console.error('Reset failed:', err);
      setError(err instanceof Error ? err.message : 'Reset failed');
      
      // 重大なエラーの場合はシミュレーションを再作成
      if (err instanceof Error && err.message.includes('index out of bounds')) {
        console.warn('Critical WASM error detected during reset, recreating simulation');
        recreateSimulation();
      }
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
    forceCleanup,
    recreateSimulation,
  ]);

  const setStrategyComplexityPenalty = useCallback(
    (enabled: boolean) => {
      if (!simulation || isProcessingRef.current) return;

      try {
        simulation.set_strategy_complexity_penalty(enabled);
      } catch (err) {
        console.error('Failed to set strategy complexity penalty:', err);
        setError(err instanceof Error ? err.message : 'Failed to set strategy complexity penalty');
        
        // 重大なエラーの場合はシミュレーションを再作成
        if (err instanceof Error && err.message.includes('index out of bounds')) {
          console.warn('Critical WASM error detected, recreating simulation');
          recreateSimulation();
        }
      }
    },
    [simulation, forceCleanup, recreateSimulation]
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
        
        // 重大なエラーの場合はシミュレーションを再作成
        if (err instanceof Error && err.message.includes('index out of bounds')) {
          console.warn('Critical WASM error detected, recreating simulation');
          recreateSimulation();
        }
      }
    },
    [simulation, forceCleanup, recreateSimulation]
  );

  const setTorusField = useCallback(
    (enabled: boolean) => {
      if (!simulation || isProcessingRef.current) return;

      try {
        simulation.set_torus_field(enabled);
      } catch (err) {
        console.error('Failed to set torus field:', err);
        setError(err instanceof Error ? err.message : 'Failed to set torus field');
        
        // 重大なエラーの場合はシミュレーションを再作成
        if (err instanceof Error && err.message.includes('index out of bounds')) {
          console.warn('Critical WASM error detected, recreating simulation');
          recreateSimulation();
        }
      }
    },
    [simulation, forceCleanup, recreateSimulation]
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
