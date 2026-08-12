import { useCallback, useEffect, useRef, useState } from 'react';
import { convertAgentsToPlainObjects, convertStatsToPlainObject } from '../lib/wasmConversion';
import type { WasmAgent, WasmSimulation, WasmStatistics } from '../types/wasm';
import { applyConfig, useSimulationInstance } from './useSimulationInstance';
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

// wasm-bindgenのpanicメッセージには 'index out of bounds' や 'RuntimeError' が含まれる。
// この種のエラーはWASM側の内部状態が壊れている可能性が高く、続行せずインスタンスごと
// 作り直す（recreateSimulation）べき「重大なエラー」として扱う。
const isCriticalWasmError = (err: unknown): boolean =>
  err instanceof Error &&
  (err.message.includes('index out of bounds') || err.message.includes('RuntimeError'));

const getErrorMessage = (err: unknown, fallback: string): string =>
  err instanceof Error ? err.message : fallback;

export const useSimulation = (config: SimulationConfig) => {
  const { wasmModule, loading: wasmLoading, error: wasmError } = useWasm();
  const { simulation, simulationRef, isInitialized, create, dispose } = useSimulationInstance(
    wasmModule,
    config
  );
  const [isRunning, setIsRunning] = useState(false);
  const [statistics, setStatistics] = useState<WasmStatistics | null>(null);
  const [agents, setAgents] = useState<WasmAgent[]>([]);
  const [error, setError] = useState<string | null>(null);

  const intervalRef = useRef<number | null>(null);
  const isProcessingRef = useRef(false);

  const stopInterval = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  // シミュレーションを完全に停止・破棄する
  const forceCleanup = useCallback(() => {
    stopInterval();
    setIsRunning(false);
    isProcessingRef.current = false;
    setStatistics(null);
    setAgents([]);
    dispose();
  }, [stopInterval, dispose]);

  // エラー時に完全に新しいシミュレーションを作成するフラグ
  const [shouldRecreateSimulation, setShouldRecreateSimulation] = useState(false);

  // 重大なWASMエラー発生時、シミュレーションを作り直す
  const recreateSimulation = useCallback(() => {
    if (!wasmModule || isProcessingRef.current || shouldRecreateSimulation) {
      return;
    }

    // biome-ignore lint/suspicious/noConsole: This is intentional debug logging for critical errors
    console.log('Recreating simulation due to critical error');

    forceCleanup();
    setShouldRecreateSimulation(true);
  }, [wasmModule, forceCleanup, shouldRecreateSimulation]);

  // WASM呼び出し失敗時の共通処理: エラーメッセージを設定し、重大なエラーであれば
  // シミュレーションを作り直す。step/reset/各種setterから共通で利用する。
  const handleWasmError = useCallback(
    (err: unknown, logLabel: string, fallbackMessage: string) => {
      console.error(logLabel, err);
      setError(getErrorMessage(err, fallbackMessage));
      if (isCriticalWasmError(err)) {
        console.warn('Critical WASM error detected, recreating simulation');
        recreateSimulation();
      }
    },
    [recreateSimulation]
  );

  // シミュレーション再作成のuseEffect（processing中の競合を避けるため一拍おいて実行）
  useEffect(() => {
    if (!(shouldRecreateSimulation && wasmModule)) {
      return;
    }

    const timeoutId = setTimeout(() => {
      try {
        const newSimulation = create();
        if (!newSimulation) {
          throw new Error('WASMモジュールが読み込まれていません');
        }

        try {
          setStatistics(convertStatsToPlainObject(newSimulation.get_statistics()));
        } catch (err) {
          console.warn('Failed to get initial statistics after recreation:', err);
        }

        try {
          setAgents(convertAgentsToPlainObjects(newSimulation.get_agents()));
        } catch (err) {
          console.warn('Failed to get initial agents after recreation:', err);
        }

        setError(null);
      } catch (err) {
        console.error('Failed to recreate simulation:', err);
        setError(
          'シミュレーションの復旧に失敗しました。ページを再読み込みするか、Resetボタンをお試しください。'
        );
      }

      setShouldRecreateSimulation(false);
    }, 100);

    return () => clearTimeout(timeoutId);
  }, [shouldRecreateSimulation, wasmModule, create]);

  // 手動での初期配置
  const initializeSimulation = useCallback(() => {
    if (!wasmModule || wasmLoading || isProcessingRef.current) {
      return;
    }

    isProcessingRef.current = true;

    try {
      setStatistics(null);
      setAgents([]);

      const newSimulation = create();
      if (!newSimulation) {
        throw new Error('WASMモジュールが読み込まれていません');
      }

      try {
        setStatistics(convertStatsToPlainObject(newSimulation.get_statistics()));
      } catch (err) {
        console.warn('Failed to get initial statistics:', err);
      }

      try {
        setAgents(convertAgentsToPlainObjects(newSimulation.get_agents()));
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
  }, [wasmModule, wasmLoading, create]);

  // アンマウント時にクリーンアップ
  useEffect(() => {
    return () => {
      forceCleanup();
    };
  }, [forceCleanup]);

  // simulationRefが指す実体が、この時点で購読しているsimulationと一致しているかを確認する。
  // 非同期の再作成処理と競合した場合、途中でインスタンスが差し替わることがあるための防御。
  const isSimulationStale = useCallback(
    () => simulation !== simulationRef.current,
    [simulation, simulationRef]
  );

  // stepの本体（前提条件のチェック・エラーハンドリングはstep側が担う）
  const runStepOnce = useCallback(
    (currentSimulation: WasmSimulation) => {
      if (isSimulationStale()) {
        console.warn('Simulation object is invalid, stopping step execution');
        setIsRunning(false);
        return;
      }

      const plainStats = convertStatsToPlainObject(currentSimulation.step());

      if (isSimulationStale()) {
        console.warn('Simulation object became invalid after step, stopping');
        setIsRunning(false);
        return;
      }

      const plainAgents = convertAgentsToPlainObjects(currentSimulation.get_agents());

      if (plainAgents.length === 0 || plainStats.total_agents === 0) {
        setError('すべてのエージェントが消失しました。シミュレーションを停止します。');
        setIsRunning(false);
        return;
      }

      setStatistics(plainStats);
      setAgents(plainAgents);
    },
    [isSimulationStale]
  );

  const step = useCallback(() => {
    if (!(simulation && simulationRef.current)) {
      return;
    }
    if (isProcessingRef.current) {
      return;
    }
    if (!agents || agents.length === 0) {
      setError('エージェントが配置されていません。リセットしてエージェントを配置してください。');
      return;
    }
    if (statistics && statistics.total_agents === 0) {
      setError('エージェントが配置されていません。リセットしてエージェントを配置してください。');
      return;
    }

    isProcessingRef.current = true;

    try {
      runStepOnce(simulation);
    } catch (err) {
      handleWasmError(err, 'Simulation step failed:', 'Simulation step failed');
      setIsRunning(false);
    } finally {
      isProcessingRef.current = false;
    }
  }, [simulation, simulationRef, agents, statistics, runStepOnce, handleWasmError]);

  // ポーリングの1tick分。start()時のsetIntervalと、速度変更時の再設定の両方から
  // 必ずこの関数を経由させることで、両者のヘルスチェックの実装が乖離しないようにする。
  const runTick = useCallback(() => {
    if (!simulationRef.current) {
      stopInterval();
      setIsRunning(false);
      return;
    }

    if (isProcessingRef.current) {
      return;
    }

    if (!statistics || statistics.total_agents === 0) {
      console.warn('Simulation appears to be in invalid state, stopping');
      stopInterval();
      setIsRunning(false);
      return;
    }

    step();
  }, [simulationRef, statistics, step, stopInterval]);

  const startInterval = useCallback(() => {
    stopInterval();
    intervalRef.current = window.setInterval(runTick, config.speed);
  }, [stopInterval, runTick, config.speed]);

  const start = useCallback(() => {
    if (!simulation || isRunning || isProcessingRef.current) {
      return;
    }

    if (!isInitialized) {
      setError('シミュレーションが初期化されていません。初期配置ボタンを押してください。');
      return;
    }

    if (!agents || agents.length === 0) {
      setError('エージェントが配置されていません。初期配置ボタンを押してください。');
      return;
    }

    if (statistics && statistics.total_agents === 0) {
      setError('エージェントが配置されていません。リセットしてエージェントを配置してください。');
      return;
    }

    setIsRunning(true);
    startInterval();
  }, [simulation, isRunning, isInitialized, agents, statistics, startInterval]);

  const pause = useCallback(() => {
    stopInterval();
    setIsRunning(false);
  }, [stopInterval]);

  const reset = useCallback(() => {
    if (!(simulation && simulationRef.current) || isProcessingRef.current) {
      return;
    }

    if (!isInitialized) {
      initializeSimulation();
      return;
    }

    pause();
    isProcessingRef.current = true;

    try {
      simulation.reset(config.agentCount);
      applyConfig(simulation, config);

      const plainStats = convertStatsToPlainObject(simulation.get_statistics());
      const plainAgents = convertAgentsToPlainObjects(simulation.get_agents());

      setStatistics(plainStats);
      setAgents(plainAgents);
      setError(null);
    } catch (err) {
      handleWasmError(err, 'Reset failed:', 'Reset failed');
    } finally {
      isProcessingRef.current = false;
    }
  }, [
    simulation,
    simulationRef,
    isInitialized,
    config,
    pause,
    initializeSimulation,
    handleWasmError,
  ]);

  const setStrategyComplexityPenalty = useCallback(
    (enabled: boolean) => {
      if (!simulation || isProcessingRef.current) {
        return;
      }

      try {
        simulation.set_strategy_complexity_penalty(enabled);
      } catch (err) {
        handleWasmError(
          err,
          'Failed to set strategy complexity penalty:',
          'Failed to set strategy complexity penalty'
        );
      }
    },
    [simulation, handleWasmError]
  );

  const setStrategyComplexityPenaltyRate = useCallback(
    (rate: number) => {
      if (!simulation || isProcessingRef.current) {
        return;
      }

      try {
        simulation.set_strategy_complexity_penalty_rate(rate);
      } catch (err) {
        handleWasmError(
          err,
          'Failed to set strategy complexity penalty rate:',
          'Failed to set strategy complexity penalty rate'
        );
      }
    },
    [simulation, handleWasmError]
  );

  const setTorusField = useCallback(
    (enabled: boolean) => {
      if (!simulation || isProcessingRef.current) {
        return;
      }

      try {
        simulation.set_torus_field(enabled);
      } catch (err) {
        handleWasmError(err, 'Failed to set torus field:', 'Failed to set torus field');
      }
    },
    [simulation, handleWasmError]
  );

  // 速度変更時はインターバルを張り直す。startIntervalの依存にconfig.speedが
  // 含まれるため、速度が変わればこのeffectも再実行される。runTickを介することで
  // start()時と同じヘルスチェックが必ず適用される。
  useEffect(() => {
    if (isRunning) {
      startInterval();
    }
  }, [isRunning, startInterval]);

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
