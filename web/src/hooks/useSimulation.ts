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
  const result = wasmAgents.map((agent) => {
    try {
      return {
        // biome-ignore lint/style/useNamingConvention: WASM properties use snake_case
        cooperation_rate: agent.cooperation_rate,
        id: agent.id,
        mobility: agent.mobility,
        // biome-ignore lint/style/useNamingConvention: WASM properties use snake_case
        movement_strategy: agent.movement_strategy,
        score: agent.score,
        strategy: agent.strategy,
        x: agent.x,
        y: agent.y,
      };
    } catch (err) {
      console.warn('Failed to convert agent:', err);
      return {
        // biome-ignore lint/style/useNamingConvention: WASM properties use snake_case
        cooperation_rate: 0,
        id: '',
        mobility: 0,
        // biome-ignore lint/style/useNamingConvention: WASM properties use snake_case
        movement_strategy: 0,
        score: 0,
        strategy: 0,
        x: 0,
        y: 0,
      };
    }
  });

  // 強制的にガベージコレクションを促す（開発環境のみ）
  // biome-ignore lint/suspicious/noExplicitAny: Window.gc is not in standard types
  if (typeof window !== 'undefined' && (window as any).gc) {
    try {
      // biome-ignore lint/suspicious/noExplicitAny: Window.gc is not in standard types
      (window as any).gc();
    } catch (_e) {
      // gc() is not available in all environments
    }
  }

  return result;
};

// Helper function to safely convert WASM statistics to plain JavaScript objects
const convertStatsToPlainObject = (wasmStats: WasmStatistics) => {
  try {
    const result = {
      // biome-ignore lint/style/useNamingConvention: WASM properties use snake_case
      adaptive_count: wasmStats.adaptive_count,
      // biome-ignore lint/style/useNamingConvention: WASM properties use snake_case
      all_cooperate_count: wasmStats.all_cooperate_count,
      // biome-ignore lint/style/useNamingConvention: WASM properties use snake_case
      all_defect_count: wasmStats.all_defect_count,
      // biome-ignore lint/style/useNamingConvention: WASM properties use snake_case
      antisocial_count: wasmStats.antisocial_count,
      // biome-ignore lint/style/useNamingConvention: WASM properties use snake_case
      average_cooperation_rate: wasmStats.average_cooperation_rate,
      // biome-ignore lint/style/useNamingConvention: WASM properties use snake_case
      average_mobility: wasmStats.average_mobility,
      // biome-ignore lint/style/useNamingConvention: WASM properties use snake_case
      average_score: wasmStats.average_score,
      // biome-ignore lint/style/useNamingConvention: WASM properties use snake_case
      explorer_count: wasmStats.explorer_count,
      generation: wasmStats.generation,
      // biome-ignore lint/style/useNamingConvention: WASM properties use snake_case
      opportunist_count: wasmStats.opportunist_count,
      // biome-ignore lint/style/useNamingConvention: WASM properties use snake_case
      pavlov_count: wasmStats.pavlov_count,
      // biome-ignore lint/style/useNamingConvention: WASM properties use snake_case
      settler_count: wasmStats.settler_count,
      // biome-ignore lint/style/useNamingConvention: WASM properties use snake_case
      social_count: wasmStats.social_count,
      // biome-ignore lint/style/useNamingConvention: WASM properties use snake_case
      tit_for_tat_count: wasmStats.tit_for_tat_count,
      // biome-ignore lint/style/useNamingConvention: WASM properties use snake_case
      total_agents: wasmStats.total_agents,
    };

    // 強制的にガベージコレクションを促す（開発環境のみ）
    // biome-ignore lint/suspicious/noExplicitAny: Window.gc is not in standard types
    if (typeof window !== 'undefined' && (window as any).gc) {
      try {
        // biome-ignore lint/suspicious/noExplicitAny: Window.gc is not in standard types
        (window as any).gc();
      } catch (_e) {
        // gc() is not available in all environments
      }
    }

    return result;
  } catch (err) {
    console.warn('Failed to convert statistics:', err);
    return {
      // biome-ignore lint/style/useNamingConvention: WASM properties use snake_case
      adaptive_count: 0,
      // biome-ignore lint/style/useNamingConvention: WASM properties use snake_case
      all_cooperate_count: 0,
      // biome-ignore lint/style/useNamingConvention: WASM properties use snake_case
      all_defect_count: 0,
      // biome-ignore lint/style/useNamingConvention: WASM properties use snake_case
      antisocial_count: 0,
      // biome-ignore lint/style/useNamingConvention: WASM properties use snake_case
      average_cooperation_rate: 0,
      // biome-ignore lint/style/useNamingConvention: WASM properties use snake_case
      average_mobility: 0,
      // biome-ignore lint/style/useNamingConvention: WASM properties use snake_case
      average_score: 0,
      // biome-ignore lint/style/useNamingConvention: WASM properties use snake_case
      explorer_count: 0,
      generation: 0,
      // biome-ignore lint/style/useNamingConvention: WASM properties use snake_case
      opportunist_count: 0,
      // biome-ignore lint/style/useNamingConvention: WASM properties use snake_case
      pavlov_count: 0,
      // biome-ignore lint/style/useNamingConvention: WASM properties use snake_case
      settler_count: 0,
      // biome-ignore lint/style/useNamingConvention: WASM properties use snake_case
      social_count: 0,
      // biome-ignore lint/style/useNamingConvention: WASM properties use snake_case
      tit_for_tat_count: 0,
      // biome-ignore lint/style/useNamingConvention: WASM properties use snake_case
      total_agents: 0,
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
  const [isInitialized, setIsInitialized] = useState(false);

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
    setIsInitialized(false);

    if (simulationRef.current) {
      try {
        // Check if the simulation is still valid before freeing
        if (typeof simulationRef.current.free === 'function') {
          simulationRef.current.free();
        }
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
    if (!wasmModule || isProcessingRef.current || shouldRecreateSimulation) {
      return;
    }

    // biome-ignore lint/suspicious/noConsole: This is intentional debug logging for critical errors
    console.log('Recreating simulation due to critical error');

    // 完全なクリーンアップ
    forceCleanup();

    // フラグを設定して、useEffectで処理する
    setShouldRecreateSimulation(true);
  }, [wasmModule, forceCleanup, shouldRecreateSimulation]);

  // シミュレーション再作成のuseEffect
  useEffect(() => {
    if (!(shouldRecreateSimulation && wasmModule)) {
      return;
    }

    // biome-ignore lint/complexity/noExcessiveCognitiveComplexity: Complex error recovery logic required
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
      } catch (err) {
        console.error('Failed to recreate simulation:', err);
        setError(
          // biome-ignore lint/nursery/noSecrets: This is a Japanese error message, not a secret
          'シミュレーションの復旧に失敗しました。ページを再読み込みするか、Resetボタンをお試しください。'
        );
      }

      setShouldRecreateSimulation(false);
    }, 100);

    return () => clearTimeout(timeoutId);
  }, [shouldRecreateSimulation, wasmModule, config]);

  // Manual initialization function
  const initializeSimulation = useCallback(() => {
    if (!wasmModule || wasmLoading || isProcessingRef.current) {
      return;
    }

    // biome-ignore lint/complexity/noExcessiveCognitiveComplexity: Initialization requires complex error handling
    const performInitialization = () => {
      if (isProcessingRef.current) {
        return;
      }

      isProcessingRef.current = true;

      try {
        // Clean up existing simulation before creating new one
        if (simulationRef.current) {
          try {
            // Check if the simulation is still valid before freeing
            if (typeof simulationRef.current.free === 'function') {
              simulationRef.current.free();
            }
          } catch (err) {
            console.warn('Previous simulation cleanup warning:', err);
          } finally {
            simulationRef.current = null;
          }
        }

        // Clear stale statistics and agents
        setStatistics(null);
        setAgents([]);

        // Create new simulation with agents
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

        // Get initial data
        try {
          const stats = newSimulation.get_statistics();
          const plainStats = convertStatsToPlainObject(stats);
          setStatistics(plainStats);
        } catch (err) {
          console.warn('Failed to get initial statistics:', err);
        }

        try {
          const initialAgents = newSimulation.get_agents();
          const plainAgents = convertAgentsToPlainObjects(initialAgents);
          setAgents(plainAgents);
        } catch (err) {
          console.warn('Failed to get initial agents:', err);
          setAgents([]);
        }

        setError(null);
        setIsInitialized(true);
      } catch (err) {
        console.error('Failed to initialize simulation:', err);
        setError(err instanceof Error ? err.message : 'Failed to initialize simulation');
        setIsInitialized(false);
      } finally {
        isProcessingRef.current = false;
      }
    };

    performInitialization();
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

  // biome-ignore lint/complexity/noExcessiveCognitiveComplexity: Step function requires complex validation and error handling
  const step = useCallback(() => {
    if (!(simulation && simulationRef.current) || isProcessingRef.current) {
      return;
    }

    // ステップ実行前にもエージェントの存在をチェック
    if (!agents || agents.length === 0) {
      // biome-ignore lint/nursery/noSecrets: This is a Japanese error message, not a secret
      setError('エージェントが配置されていません。リセットしてエージェントを配置してください。');
      return;
    }

    // 統計情報からエージェント数を再確認
    if (statistics && statistics.total_agents === 0) {
      // biome-ignore lint/nursery/noSecrets: This is a Japanese error message, not a secret
      setError('エージェントが配置されていません。リセットしてエージェントを配置してください。');
      return;
    }

    isProcessingRef.current = true;

    try {
      // シミュレーションの有効性を再確認
      if (!(simulation && simulationRef.current) || simulation !== simulationRef.current) {
        console.warn('Simulation object is invalid, stopping step execution');
        setIsRunning(false);
        return;
      }

      // step()を実行して統計情報を取得
      let newStats: WasmStatistics;
      try {
        newStats = simulation.step();
      } catch (stepErr) {
        console.error('Failed to execute step:', stepErr);
        throw stepErr;
      }

      // 統計情報の変換
      const plainStats = convertStatsToPlainObject(newStats);

      // エージェント情報の取得（step実行後にもう一度有効性をチェック）
      if (!(simulation && simulationRef.current) || simulation !== simulationRef.current) {
        console.warn('Simulation object became invalid after step, stopping');
        setIsRunning(false);
        return;
      }

      let newAgents: WasmAgent[];
      try {
        newAgents = simulation.get_agents();
      } catch (agentErr) {
        console.error('Failed to get agents:', agentErr);
        throw agentErr;
      }

      // エージェント情報の変換
      const plainAgents = convertAgentsToPlainObjects(newAgents);

      // エージェントが存在しない場合はシミュレーションを停止
      if (!plainAgents || plainAgents.length === 0 || plainStats.total_agents === 0) {
        // biome-ignore lint/nursery/noSecrets: This is a Japanese error message, not a secret
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
      if (
        err instanceof Error &&
        (err.message.includes('index out of bounds') || err.message.includes('RuntimeError'))
      ) {
        console.warn('Critical WASM error detected, recreating simulation');
        recreateSimulation();
      }
    } finally {
      isProcessingRef.current = false;
    }
  }, [simulation, agents, statistics, recreateSimulation]);

  const start = useCallback(() => {
    if (!simulation || isRunning || isProcessingRef.current) {
      return;
    }

    // 初期化されていない場合は開始できない
    if (!isInitialized) {
      // biome-ignore lint/nursery/noSecrets: This is a Japanese error message, not a secret
      setError('シミュレーションが初期化されていません。初期配置ボタンを押してください。');
      return;
    }

    // エージェントが存在しない場合は開始できない
    if (!agents || agents.length === 0) {
      // biome-ignore lint/nursery/noSecrets: This is a Japanese error message, not a secret
      setError('エージェントが配置されていません。初期配置ボタンを押してください。');
      return;
    }

    // 統計情報からエージェント数を再確認
    if (statistics && statistics.total_agents === 0) {
      // biome-ignore lint/nursery/noSecrets: This is a Japanese error message, not a secret
      setError('エージェントが配置されていません。リセットしてエージェントを配置してください。');
      return;
    }

    setIsRunning(true);
    // biome-ignore lint/complexity/noExcessiveCognitiveComplexity: Interval handler requires complex simulation health checks
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
        if (
          simulationRef.current &&
          statistics &&
          statistics.total_agents > 0 &&
          !isProcessingRef.current
        ) {
          step();
        } else if (isProcessingRef.current) {
          // 処理中の場合はスキップ
          return;
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
  }, [simulation, isRunning, step, config.speed, agents, statistics, isInitialized]);

  const pause = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setIsRunning(false);
  }, []);

  // biome-ignore lint/complexity/noExcessiveCognitiveComplexity: Reset function requires complex configuration reapplication
  const reset = useCallback(() => {
    if (!(simulation && simulationRef.current) || isProcessingRef.current) {
      return;
    }

    // 初期化されていない場合は初期化を実行
    if (!isInitialized) {
      initializeSimulation();
      return;
    }

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
    isInitialized,
    config.agentCount,
    config.strategyComplexityPenalty,
    config.strategyComplexityPenaltyRate,
    config.torusField,
    pause,
    initializeSimulation,
    recreateSimulation,
  ]);

  const setStrategyComplexityPenalty = useCallback(
    (enabled: boolean) => {
      if (!simulation || isProcessingRef.current) {
        return;
      }

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
    [simulation, recreateSimulation]
  );

  const setStrategyComplexityPenaltyRate = useCallback(
    (rate: number) => {
      if (!simulation || isProcessingRef.current) {
        return;
      }

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
    [simulation, recreateSimulation]
  );

  const setTorusField = useCallback(
    (enabled: boolean) => {
      if (!simulation || isProcessingRef.current) {
        return;
      }

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
    [simulation, recreateSimulation]
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
    initializeSimulation,
    isInitialized,
    isRunning,
    loading: wasmLoading,
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
