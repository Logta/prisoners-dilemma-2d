// ========================================
// Simulation Controller Hook - シミュレーションとWASMエンジンの統合制御
// ========================================

import { useCallback, useEffect, useRef, useState } from 'react';
import { useApplicationContext } from '../contexts/ApplicationContext';
import { useSimulationContext } from '../contexts/SimulationContext';
import type { GridDimensions, SimulationConfig } from '../types';

export interface SimulationControllerState {
  isRunning: boolean;
  isPaused: boolean;
  generation: number;
  fps: number;
  lastGenerationTime: number;
  isAutoRunning: boolean;
}

export interface SimulationControllerActions {
  // 基本制御
  start: () => Promise<void>;
  pause: () => Promise<void>;
  resume: () => Promise<void>;
  stop: () => Promise<void>;
  reset: () => Promise<void>;
  step: () => Promise<void>; // 1世代だけ進める

  // 自動実行制御
  startAutoRun: (intervalMs?: number) => void;
  stopAutoRun: () => void;
  setAutoRunInterval: (intervalMs: number) => void;

  // 設定制御
  createNew: (config: SimulationConfig, gridDimensions: GridDimensions) => Promise<void>;
  updateConfiguration: (config: Partial<SimulationConfig>) => Promise<void>;

  // データ同期
  syncData: () => Promise<void>;
}

export interface UseSimulationControllerResult
  extends SimulationControllerState,
    SimulationControllerActions {}

export function useSimulationController(): UseSimulationControllerResult {
  const { simulation, wasmEngine } = useSimulationContext();
  const { addNotification, setError, setLoading } = useApplicationContext();

  const [controllerState, setControllerState] = useState<SimulationControllerState>({
    fps: 0,
    generation: 0,
    isAutoRunning: false,
    isPaused: false,
    isRunning: false,
    lastGenerationTime: 0,
  });

  const autoRunIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const autoRunIntervalMs = useRef<number>(1000); // デフォルト1秒
  const fpsCounterRef = useRef<{ lastTime: number; frameCount: number }>({
    frameCount: 0,
    lastTime: 0,
  });

  // ステート更新ヘルパー
  const updateControllerState = useCallback((updates: Partial<SimulationControllerState>) => {
    setControllerState((prev) => ({ ...prev, ...updates }));
  }, []);

  // FPS計算
  const updateFPS = useCallback(() => {
    const now = performance.now();
    const { lastTime, frameCount } = fpsCounterRef.current;

    if (now - lastTime >= 1000) {
      // 1秒間隔でFPS更新
      const fps = frameCount;
      updateControllerState({ fps });
      fpsCounterRef.current = { frameCount: 0, lastTime: now };
    } else {
      fpsCounterRef.current.frameCount++;
    }
  }, [updateControllerState]);

  // ========================================
  // 基本制御アクション
  // ========================================

  const start = useCallback(async (): Promise<void> => {
    try {
      setLoading(true);

      if (!wasmEngine.isInitialized) {
        throw new Error('WASM engine is not initialized');
      }

      await simulation.startSimulation();
      updateControllerState({
        isPaused: false,
        isRunning: true,
        lastGenerationTime: performance.now(),
      });

      addNotification({
        autoClose: true,
        duration: 3000,
        message: 'シミュレーションを開始しました',
        title: 'シミュレーション開始',
        type: 'success',
      });
    } catch (error) {
      setError(error instanceof Error ? error.message : String(error));
      throw error;
    } finally {
      setLoading(false);
    }
  }, [
    wasmEngine.isInitialized,
    simulation,
    updateControllerState,
    addNotification,
    setError,
    setLoading,
  ]);

  const pause = useCallback(async (): Promise<void> => {
    try {
      await simulation.pauseSimulation();
      updateControllerState({ isPaused: true });

      // 自動実行も停止
      if (autoRunIntervalRef.current) {
        clearInterval(autoRunIntervalRef.current);
        autoRunIntervalRef.current = null;
        updateControllerState({ isAutoRunning: false });
      }

      addNotification({
        autoClose: true,
        duration: 2000,
        message: 'シミュレーションを一時停止しました',
        title: 'シミュレーション一時停止',
        type: 'info',
      });
    } catch (error) {
      setError(error instanceof Error ? error.message : String(error));
      throw error;
    }
  }, [simulation, updateControllerState, addNotification, setError]);

  const resume = useCallback(async (): Promise<void> => {
    try {
      await simulation.resumeSimulation();
      updateControllerState({
        isPaused: false,
        lastGenerationTime: performance.now(),
      });

      addNotification({
        autoClose: true,
        duration: 2000,
        message: 'シミュレーションを再開しました',
        title: 'シミュレーション再開',
        type: 'success',
      });
    } catch (error) {
      setError(error instanceof Error ? error.message : String(error));
      throw error;
    }
  }, [simulation, updateControllerState, addNotification, setError]);

  const stop = useCallback(async (): Promise<void> => {
    try {
      // 自動実行停止
      if (autoRunIntervalRef.current) {
        clearInterval(autoRunIntervalRef.current);
        autoRunIntervalRef.current = null;
      }

      await simulation.stopSimulation();
      updateControllerState({
        fps: 0,
        isAutoRunning: false,
        isPaused: false,
        isRunning: false,
      });

      addNotification({
        autoClose: true,
        duration: 2000,
        message: 'シミュレーションを停止しました',
        title: 'シミュレーション停止',
        type: 'info',
      });
    } catch (error) {
      setError(error instanceof Error ? error.message : String(error));
      throw error;
    }
  }, [simulation, updateControllerState, addNotification, setError]);

  const reset = useCallback(async (): Promise<void> => {
    try {
      setLoading(true);

      // 自動実行停止
      if (autoRunIntervalRef.current) {
        clearInterval(autoRunIntervalRef.current);
        autoRunIntervalRef.current = null;
      }

      await Promise.all([simulation.resetSimulation(), wasmEngine.resetEngine()]);

      updateControllerState({
        fps: 0,
        generation: 0,
        isAutoRunning: false,
        isPaused: false,
        isRunning: false,
      });

      addNotification({
        autoClose: true,
        duration: 2000,
        message: 'シミュレーションをリセットしました',
        title: 'シミュレーションリセット',
        type: 'info',
      });
    } catch (error) {
      setError(error instanceof Error ? error.message : String(error));
      throw error;
    } finally {
      setLoading(false);
    }
  }, [simulation, wasmEngine, updateControllerState, addNotification, setError, setLoading]);

  const step = useCallback(async (): Promise<void> => {
    try {
      if (!wasmEngine.isInitialized) {
        throw new Error('WASM engine is not initialized');
      }

      const startTime = performance.now();

      // 1世代実行
      await wasmEngine.runGeneration();
      await wasmEngine.evolvePopulation();

      // データ同期
      const [agentData, statistics] = await Promise.all([
        wasmEngine.getAgentData(),
        wasmEngine.getStatistics(),
      ]);

      await simulation.updateAgents(agentData);
      await simulation.advanceGeneration(statistics);

      const endTime = performance.now();
      const generationTime = endTime - startTime;

      updateControllerState({
        generation: statistics.generation,
        lastGenerationTime: generationTime,
      });

      updateFPS();
    } catch (error) {
      setError(error instanceof Error ? error.message : String(error));
      throw error;
    }
  }, [wasmEngine, simulation, updateControllerState, updateFPS, setError]);

  // ========================================
  // 自動実行制御
  // ========================================

  const startAutoRun = useCallback(
    (intervalMs: number = autoRunIntervalMs.current) => {
      if (autoRunIntervalRef.current) {
        clearInterval(autoRunIntervalRef.current);
      }

      autoRunIntervalMs.current = intervalMs;
      updateControllerState({ isAutoRunning: true });

      autoRunIntervalRef.current = setInterval(async () => {
        try {
          if (controllerState.isRunning && !controllerState.isPaused) {
            await step();
          }
        } catch (error) {
          console.error('Auto-run step failed:', error);
          stopAutoRun();
        }
      }, intervalMs);

      addNotification({
        autoClose: true,
        duration: 3000,
        message: `${intervalMs}ms間隔で自動実行を開始しました`,
        title: '自動実行開始',
        type: 'info',
      });
    },
    [
      controllerState.isRunning,
      controllerState.isPaused,
      step,
      updateControllerState,
      addNotification,
    ]
  );

  const stopAutoRun = useCallback(() => {
    if (autoRunIntervalRef.current) {
      clearInterval(autoRunIntervalRef.current);
      autoRunIntervalRef.current = null;
    }

    updateControllerState({ isAutoRunning: false });

    addNotification({
      autoClose: true,
      duration: 2000,
      message: '自動実行を停止しました',
      title: '自動実行停止',
      type: 'info',
    });
  }, [updateControllerState, addNotification]);

  const setAutoRunInterval = useCallback(
    (intervalMs: number) => {
      autoRunIntervalMs.current = intervalMs;

      if (controllerState.isAutoRunning) {
        // 実行中の場合は再起動
        startAutoRun(intervalMs);
      }
    },
    [controllerState.isAutoRunning, startAutoRun]
  );

  // ========================================
  // 設定制御
  // ========================================

  const createNew = useCallback(
    async (config: SimulationConfig, gridDimensions: GridDimensions): Promise<void> => {
      try {
        setLoading(true);

        // 既存の自動実行を停止
        if (autoRunIntervalRef.current) {
          clearInterval(autoRunIntervalRef.current);
          autoRunIntervalRef.current = null;
        }

        // エンジン初期化
        await wasmEngine.initializeEngine(gridDimensions);
        await wasmEngine.updateConfig(config);
        await wasmEngine.initializePopulation(config.population_size);

        // シミュレーション作成
        const simulationId = await simulation.createSimulation(config, gridDimensions);

        // 初期データ同期
        await syncData();

        updateControllerState({
          fps: 0,
          generation: 0,
          isAutoRunning: false,
          isPaused: false,
          isRunning: false,
        });

        addNotification({
          autoClose: true,
          duration: 3000,
          message: '新しいシミュレーションを作成しました',
          title: '新規シミュレーション作成',
          type: 'success',
        });
      } catch (error) {
        setError(error instanceof Error ? error.message : String(error));
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [wasmEngine, simulation, updateControllerState, addNotification, setError, setLoading]
  );

  const updateConfiguration = useCallback(
    async (config: Partial<SimulationConfig>): Promise<void> => {
      try {
        if (!simulation.currentSimulation) {
          throw new Error('No simulation loaded');
        }

        const newConfig = { ...simulation.currentSimulation.config, ...config };
        await wasmEngine.updateConfig(newConfig);

        addNotification({
          autoClose: true,
          duration: 2000,
          message: 'シミュレーション設定を更新しました',
          title: '設定更新',
          type: 'success',
        });
      } catch (error) {
        setError(error instanceof Error ? error.message : String(error));
        throw error;
      }
    },
    [simulation.currentSimulation, wasmEngine, addNotification, setError]
  );

  // ========================================
  // データ同期
  // ========================================

  const syncData = useCallback(async (): Promise<void> => {
    try {
      if (!wasmEngine.isInitialized) {
        return;
      }

      const [agentData, statistics] = await Promise.all([
        wasmEngine.getAgentData(),
        wasmEngine.getStatistics(),
      ]);

      await simulation.updateAgents(agentData);

      updateControllerState({
        generation: statistics.generation,
      });
    } catch (error) {
      console.error('Data sync failed:', error);
      // データ同期エラーは表示しない（頻繁に発生する可能性があるため）
    }
  }, [wasmEngine.isInitialized, wasmEngine, simulation, updateControllerState]);

  // ========================================
  // 効果とクリーンアップ
  // ========================================

  // シミュレーション状態の同期
  useEffect(() => {
    updateControllerState({
      isPaused: simulation.isPaused,
      isRunning: simulation.isRunning,
    });
  }, [simulation.isRunning, simulation.isPaused, updateControllerState]);

  // WASMエンジン世代数の同期
  useEffect(() => {
    updateControllerState({
      generation: wasmEngine.generation,
    });
  }, [wasmEngine.generation, updateControllerState]);

  // クリーンアップ
  useEffect(() => {
    return () => {
      if (autoRunIntervalRef.current) {
        clearInterval(autoRunIntervalRef.current);
      }
    };
  }, []);

  // ========================================
  // 戻り値
  // ========================================

  return {
    // State
    ...controllerState,
    createNew,
    pause,
    reset,
    resume,
    setAutoRunInterval,

    // Actions
    start,
    startAutoRun,
    step,
    stop,
    stopAutoRun,
    syncData,
    updateConfiguration,
  };
}
