// ========================================
// WASM Engine Custom Hook
// ========================================

import { useCallback, useEffect, useRef, useState } from 'react';
import type { AgentData, GridDimensions, SimulationConfig, Statistics } from '../types';
import { ErrorType, withAsyncErrorHandling } from '../utils/error-handler';
import { logger, withAsyncLogging } from '../utils/logger';

// WASM エンジンのインターフェース（実際のWASMモジュールと同期）
interface WasmEngine {
  new (width: number, height: number): WasmEngine;
  initialize_population(population_size: number): void;
  run_generation(): void;
  evolve_population(): void;
  get_agent_data_json(): string;
  get_statistics_json(): string;
  update_config(config: string): void;
  set_config(
    mutation_rate: number,
    crossover_rate: number,
    selection_pressure: number,
    elitism_rate: number
  ): void;
  get_generation(): number;
  reset(): void;
}

export interface UseWasmEngineState {
  engine: WasmEngine | null;
  isInitialized: boolean;
  isLoading: boolean;
  error: string | null;
  generation: number;
}

export interface UseWasmEngineActions {
  initializeEngine: (gridDimensions: GridDimensions) => Promise<void>;
  initializePopulation: (populationSize: number) => Promise<void>;
  runGeneration: () => Promise<void>;
  evolvePopulation: () => Promise<void>;
  updateConfig: (config: SimulationConfig) => Promise<void>;
  getAgentData: () => Promise<AgentData[]>;
  getStatistics: () => Promise<Statistics>;
  resetEngine: () => Promise<void>;
  clearError: () => void;
}

export interface UseWasmEngineResult extends UseWasmEngineState, UseWasmEngineActions {}

export function useWasmEngine(): UseWasmEngineResult {
  const [state, setState] = useState<UseWasmEngineState>({
    engine: null,
    error: null,
    generation: 0,
    isInitialized: false,
    isLoading: false,
  });

  const engineRef = useRef<WasmEngine | null>(null);
  const wasmModuleRef = useRef<any>(null);

  // ステート更新ヘルパー
  const updateState = useCallback((updates: Partial<UseWasmEngineState>) => {
    setState((prev) => ({ ...prev, ...updates }));
  }, []);

  // エラーハンドリングヘルパー
  const handleError = useCallback(
    (error: Error | string) => {
      const errorMessage = error instanceof Error ? error.message : error;
      updateState({ error: errorMessage, isLoading: false });
      console.error('WASM Engine error:', errorMessage);
    },
    [updateState]
  );

  // WASMモジュールの動的ロード
  const loadWasmModule = useCallback(async () => {
    try {
      if (wasmModuleRef.current) {
        return wasmModuleRef.current;
      }

      // WASMモジュールを動的インポート
      const wasmModule = await import('/pkg/prisoners_dilemma_2d.js');
      await wasmModule.default(); // WASM初期化

      wasmModuleRef.current = wasmModule;
      return wasmModule;
    } catch (error) {
      throw new Error(`Failed to load WASM module: ${error}`);
    }
  }, []);

  // ========================================
  // エンジン管理アクション
  // ========================================

  const initializeEngine = useCallback(
    async (gridDimensions: GridDimensions): Promise<void> => {
      try {
        updateState({ error: null, isLoading: true });

        const wasmModule = await loadWasmModule();
        const engine = new wasmModule.SimulationEngine(gridDimensions.width, gridDimensions.height);

        engineRef.current = engine;
        updateState({
          engine,
          generation: 0,
          isInitialized: true,
          isLoading: false,
        });
      } catch (error) {
        handleError(error as Error);
        throw error;
      }
    },
    [loadWasmModule, updateState, handleError]
  );

  const initializePopulation = useCallback(
    async (populationSize: number): Promise<void> => {
      if (!engineRef.current) {
        throw new Error('Engine not initialized');
      }

      try {
        updateState({ error: null, isLoading: true });

        engineRef.current.initialize_population(populationSize);

        updateState({ isLoading: false });
      } catch (error) {
        handleError(error as Error);
        throw error;
      }
    },
    [updateState, handleError]
  );

  const runGeneration = useCallback(async (): Promise<void> => {
    if (!engineRef.current) {
      throw new Error('Engine not initialized');
    }

    try {
      updateState({ error: null, isLoading: true });

      engineRef.current.run_generation();
      const generation = engineRef.current.get_generation();

      updateState({
        generation,
        isLoading: false,
      });
    } catch (error) {
      handleError(error as Error);
      throw error;
    }
  }, [updateState, handleError]);

  const evolvePopulation = useCallback(async (): Promise<void> => {
    if (!engineRef.current) {
      throw new Error('Engine not initialized');
    }

    try {
      updateState({ error: null, isLoading: true });

      engineRef.current.evolve_population();
      const generation = engineRef.current.get_generation();

      updateState({
        generation,
        isLoading: false,
      });
    } catch (error) {
      handleError(error as Error);
      throw error;
    }
  }, [updateState, handleError]);

  const updateConfig = useCallback(
    async (config: SimulationConfig): Promise<void> => {
      if (!engineRef.current) {
        throw new Error('Engine not initialized');
      }

      try {
        updateState({ error: null, isLoading: true });

        engineRef.current.set_config(
          config.mutation_rate,
          config.crossover_rate,
          config.selection_pressure,
          config.elitism_rate
        );

        updateState({ isLoading: false });
      } catch (error) {
        handleError(error as Error);
        throw error;
      }
    },
    [updateState, handleError]
  );

  const resetEngine = useCallback(async (): Promise<void> => {
    if (!engineRef.current) {
      throw new Error('Engine not initialized');
    }

    try {
      updateState({ error: null, isLoading: true });

      engineRef.current.reset();

      updateState({
        generation: 0,
        isLoading: false,
      });
    } catch (error) {
      handleError(error as Error);
      throw error;
    }
  }, [updateState, handleError]);

  // ========================================
  // データ取得アクション
  // ========================================

  const getAgentData = useCallback(async (): Promise<AgentData[]> => {
    if (!engineRef.current) {
      throw new Error('Engine not initialized');
    }

    try {
      const jsonData = engineRef.current.get_agent_data_json();
      const agentData = JSON.parse(jsonData);

      // データの妥当性検証
      if (!Array.isArray(agentData)) {
        throw new Error('Invalid agent data format');
      }

      return agentData;
    } catch (error) {
      handleError(error as Error);
      throw error;
    }
  }, [handleError]);

  const getStatistics = useCallback(async (): Promise<Statistics> => {
    if (!engineRef.current) {
      throw new Error('Engine not initialized');
    }

    try {
      const jsonData = engineRef.current.get_statistics_json();
      const statistics = JSON.parse(jsonData);

      // データの妥当性検証
      if (typeof statistics.generation !== 'number' || typeof statistics.population !== 'number') {
        throw new Error('Invalid statistics data format');
      }

      return statistics;
    } catch (error) {
      handleError(error as Error);
      throw error;
    }
  }, [handleError]);

  // ========================================
  // ユーティリティアクション
  // ========================================

  const clearError = useCallback(() => {
    updateState({ error: null });
  }, [updateState]);

  // ========================================
  // クリーンアップ効果
  // ========================================

  useEffect(() => {
    return () => {
      // コンポーネントのアンマウント時にエンジンをクリーンアップ
      if (engineRef.current) {
        try {
          engineRef.current.reset();
        } catch (error) {
          console.warn('Failed to cleanup WASM engine:', error);
        }
        engineRef.current = null;
      }
    };
  }, []);

  // ========================================
  // 戻り値
  // ========================================

  return {
    // State
    ...state,
    clearError,
    evolvePopulation,
    getAgentData,
    getStatistics,

    // Actions
    initializeEngine,
    initializePopulation,
    resetEngine,
    runGeneration,
    updateConfig,
  };
}
