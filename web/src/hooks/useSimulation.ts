// ========================================
// Simulation Custom Hook
// ========================================

import { useCallback, useEffect, useRef, useState } from 'react';
import { SimulationApplicationService } from '../application/services/SimulationApplicationService';
import type { Simulation } from '../domain/entities/Simulation';
import { LocalStorageSimulationRepository } from '../infrastructure/repositories/LocalStorageSimulationRepository';
import type { AgentData, GridDimensions, SimulationConfig, Statistics } from '../types';
import { ErrorType, withAsyncErrorHandling } from '../utils/error-handler';
import { logger, withAsyncLogging } from '../utils/logger';

// シングルトンでサービスを管理
const simulationRepository = new LocalStorageSimulationRepository();
const simulationService = new SimulationApplicationService(simulationRepository);

export interface UseSimulationState {
  currentSimulation: Simulation | null;
  isLoading: boolean;
  error: string | null;
  isRunning: boolean;
  isPaused: boolean;
}

export interface UseSimulationActions {
  // シミュレーション管理
  createSimulation: (config: SimulationConfig, gridDimensions: GridDimensions) => Promise<string>;
  loadSimulation: (id: string) => Promise<void>;
  startSimulation: () => Promise<void>;
  pauseSimulation: () => Promise<void>;
  resumeSimulation: () => Promise<void>;
  stopSimulation: () => Promise<void>;
  resetSimulation: () => Promise<void>;

  // データ更新
  updateAgents: (agents: AgentData[]) => Promise<void>;
  advanceGeneration: (newStats: Statistics) => Promise<void>;

  // ユーティリティ
  clearError: () => void;
  refreshSimulation: () => Promise<void>;
}

export interface UseSimulationResult extends UseSimulationState, UseSimulationActions {}

export function useSimulation(initialSimulationId?: string): UseSimulationResult {
  const [state, setState] = useState<UseSimulationState>({
    currentSimulation: null,
    error: null,
    isLoading: false,
    isPaused: false,
    isRunning: false,
  });

  const currentSimulationRef = useRef<Simulation | null>(null);

  // ステート更新ヘルパー
  const updateState = useCallback((updates: Partial<UseSimulationState>) => {
    setState((prev) => ({ ...prev, ...updates }));
  }, []);

  // エラーハンドリングヘルパー
  const handleError = useCallback(
    (error: Error | string) => {
      const errorMessage = error instanceof Error ? error.message : error;
      updateState({ error: errorMessage, isLoading: false });
      console.error('Simulation error:', errorMessage);
    },
    [updateState]
  );

  // シミュレーション同期ヘルパー
  const syncSimulationState = useCallback(
    (simulation: Simulation | null) => {
      currentSimulationRef.current = simulation;
      updateState({
        currentSimulation: simulation,
        isPaused: simulation?.isPaused || false,
        isRunning: simulation?.isRunning || false,
      });
    },
    [updateState]
  );

  // ========================================
  // シミュレーション管理アクション
  // ========================================

  const createSimulation = useCallback(
    withAsyncLogging(
      withAsyncErrorHandling(
        async (config: SimulationConfig, gridDimensions: GridDimensions): Promise<string> => {
          updateState({ error: null, isLoading: true });

          logger.info('Creating new simulation', { config, gridDimensions }, 'simulation');

          const result = await simulationService.createSimulation(config, gridDimensions);
          const simulation = await simulationService.getSimulation(result.simulationId);

          syncSimulationState(simulation);
          updateState({ isLoading: false });

          logger.info(
            'Simulation created successfully',
            { simulationId: result.simulationId },
            'simulation'
          );

          return result.simulationId;
        },
        ErrorType.SIMULATION,
        { action: 'createSimulation', component: 'useSimulation' }
      ),
      'simulation',
      'createSimulation'
    ),
    [updateState, handleError, syncSimulationState]
  );

  const loadSimulation = useCallback(
    async (id: string): Promise<void> => {
      try {
        updateState({ error: null, isLoading: true });

        const simulation = await simulationService.getSimulation(id);
        if (!simulation) {
          throw new Error(`Simulation with id ${id} not found`);
        }

        syncSimulationState(simulation);
        updateState({ isLoading: false });
      } catch (error) {
        handleError(error as Error);
        throw error;
      }
    },
    [updateState, handleError, syncSimulationState]
  );

  const startSimulation = useCallback(async (): Promise<void> => {
    if (!currentSimulationRef.current) {
      throw new Error('No simulation loaded');
    }

    try {
      updateState({ error: null, isLoading: true });

      await simulationService.startSimulation(currentSimulationRef.current.id);
      const updated = await simulationService.getSimulation(currentSimulationRef.current.id);

      syncSimulationState(updated);
      updateState({ isLoading: false });
    } catch (error) {
      handleError(error as Error);
      throw error;
    }
  }, [updateState, handleError, syncSimulationState]);

  const pauseSimulation = useCallback(async (): Promise<void> => {
    if (!currentSimulationRef.current) {
      throw new Error('No simulation loaded');
    }

    try {
      updateState({ error: null, isLoading: true });

      await simulationService.pauseSimulation(currentSimulationRef.current.id);
      const updated = await simulationService.getSimulation(currentSimulationRef.current.id);

      syncSimulationState(updated);
      updateState({ isLoading: false });
    } catch (error) {
      handleError(error as Error);
      throw error;
    }
  }, [updateState, handleError, syncSimulationState]);

  const resumeSimulation = useCallback(async (): Promise<void> => {
    if (!currentSimulationRef.current) {
      throw new Error('No simulation loaded');
    }

    try {
      updateState({ error: null, isLoading: true });

      await simulationService.resumeSimulation(currentSimulationRef.current.id);
      const updated = await simulationService.getSimulation(currentSimulationRef.current.id);

      syncSimulationState(updated);
      updateState({ isLoading: false });
    } catch (error) {
      handleError(error as Error);
      throw error;
    }
  }, [updateState, handleError, syncSimulationState]);

  const stopSimulation = useCallback(async (): Promise<void> => {
    if (!currentSimulationRef.current) {
      throw new Error('No simulation loaded');
    }

    try {
      updateState({ error: null, isLoading: true });

      await simulationService.stopSimulation(currentSimulationRef.current.id);
      const updated = await simulationService.getSimulation(currentSimulationRef.current.id);

      syncSimulationState(updated);
      updateState({ isLoading: false });
    } catch (error) {
      handleError(error as Error);
      throw error;
    }
  }, [updateState, handleError, syncSimulationState]);

  const resetSimulation = useCallback(async (): Promise<void> => {
    if (!currentSimulationRef.current) {
      throw new Error('No simulation loaded');
    }

    try {
      updateState({ error: null, isLoading: true });

      await simulationService.resetSimulation(currentSimulationRef.current.id);
      const updated = await simulationService.getSimulation(currentSimulationRef.current.id);

      syncSimulationState(updated);
      updateState({ isLoading: false });
    } catch (error) {
      handleError(error as Error);
      throw error;
    }
  }, [updateState, handleError, syncSimulationState]);

  // ========================================
  // データ更新アクション
  // ========================================

  const updateAgents = useCallback(
    async (agents: AgentData[]): Promise<void> => {
      if (!currentSimulationRef.current) {
        throw new Error('No simulation loaded');
      }

      try {
        await simulationService.updateSimulationAgents(currentSimulationRef.current.id, agents);
        const updated = await simulationService.getSimulation(currentSimulationRef.current.id);

        syncSimulationState(updated);
      } catch (error) {
        handleError(error as Error);
        throw error;
      }
    },
    [handleError, syncSimulationState]
  );

  const advanceGeneration = useCallback(
    async (newStats: Statistics): Promise<void> => {
      if (!currentSimulationRef.current) {
        throw new Error('No simulation loaded');
      }

      try {
        await simulationService.advanceGeneration(currentSimulationRef.current.id, newStats);
        const updated = await simulationService.getSimulation(currentSimulationRef.current.id);

        syncSimulationState(updated);
      } catch (error) {
        handleError(error as Error);
        throw error;
      }
    },
    [handleError, syncSimulationState]
  );

  // ========================================
  // ユーティリティアクション
  // ========================================

  const clearError = useCallback(() => {
    updateState({ error: null });
  }, [updateState]);

  const refreshSimulation = useCallback(async (): Promise<void> => {
    if (!currentSimulationRef.current) {
      return;
    }

    try {
      updateState({ error: null, isLoading: true });

      const updated = await simulationService.getSimulation(currentSimulationRef.current.id);
      syncSimulationState(updated);

      updateState({ isLoading: false });
    } catch (error) {
      handleError(error as Error);
      throw error;
    }
  }, [updateState, handleError, syncSimulationState]);

  // ========================================
  // 初期化効果
  // ========================================

  useEffect(() => {
    if (initialSimulationId) {
      loadSimulation(initialSimulationId).catch(console.error);
    }
  }, [initialSimulationId, loadSimulation]);

  // ========================================
  // 戻り値
  // ========================================

  return {
    // State
    ...state,
    advanceGeneration,
    clearError,

    // Actions
    createSimulation,
    loadSimulation,
    pauseSimulation,
    refreshSimulation,
    resetSimulation,
    resumeSimulation,
    startSimulation,
    stopSimulation,
    updateAgents,
  };
}
