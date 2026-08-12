// ========================================
// WASMシミュレーションインスタンスのライフサイクル管理
// ========================================
// WasmSimulationオブジェクトの生成・設定適用・解放のみを責務とする。
// ステップ実行やポーリング等「進行」に関するロジックは useSimulation.ts 側が持つ。

import { useCallback, useEffect, useRef, useState } from 'react';
import type { WasmModule, WasmSimulation } from '../types/wasm';

export interface SimulationInstanceConfig {
  gridWidth: number;
  gridHeight: number;
  agentCount: number;
  strategyComplexityPenalty?: boolean;
  strategyComplexityPenaltyRate?: number;
  torusField?: boolean;
}

export const applyConfig = (simulation: WasmSimulation, config: SimulationInstanceConfig): void => {
  if (config.strategyComplexityPenalty) {
    simulation.set_strategy_complexity_penalty(true);
    if (config.strategyComplexityPenaltyRate !== undefined) {
      simulation.set_strategy_complexity_penalty_rate(config.strategyComplexityPenaltyRate);
    }
  }

  if (config.torusField !== undefined) {
    simulation.set_torus_field(config.torusField);
  }
};

const freeSafely = (simulation: WasmSimulation | null): void => {
  if (!simulation) {
    return;
  }

  try {
    if (typeof simulation.free === 'function') {
      simulation.free();
    }
  } catch (err) {
    console.warn('WASMシミュレーションの解放中に警告が発生しました:', err);
  }
};

export const useSimulationInstance = (
  wasmModule: WasmModule | null,
  config: SimulationInstanceConfig
) => {
  const [simulation, setSimulation] = useState<WasmSimulation | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const simulationRef = useRef<WasmSimulation | null>(null);

  // 現在保持しているインスタンスを解放し、状態をクリアする
  const dispose = useCallback(() => {
    freeSafely(simulationRef.current);
    simulationRef.current = null;
    setSimulation(null);
    setIsInitialized(false);
  }, []);

  // 新しいシミュレーションインスタンスを生成し、設定を適用したうえで保持する。
  // 既存のインスタンスがあれば先に解放する。
  const create = useCallback((): WasmSimulation | null => {
    if (!wasmModule) {
      return null;
    }

    freeSafely(simulationRef.current);

    const newSimulation = new wasmModule.WasmSimulation(
      config.gridWidth,
      config.gridHeight,
      config.agentCount
    );
    applyConfig(newSimulation, {
      agentCount: config.agentCount,
      gridHeight: config.gridHeight,
      gridWidth: config.gridWidth,
      strategyComplexityPenalty: config.strategyComplexityPenalty,
      strategyComplexityPenaltyRate: config.strategyComplexityPenaltyRate,
      torusField: config.torusField,
    });

    simulationRef.current = newSimulation;
    setSimulation(newSimulation);
    setIsInitialized(true);

    return newSimulation;
  }, [
    wasmModule,
    config.gridWidth,
    config.gridHeight,
    config.agentCount,
    config.strategyComplexityPenalty,
    config.strategyComplexityPenaltyRate,
    config.torusField,
  ]);

  // アンマウント時は必ず解放する
  useEffect(() => {
    return () => {
      freeSafely(simulationRef.current);
      simulationRef.current = null;
    };
  }, []);

  return {
    create,
    dispose,
    isInitialized,
    simulation,
    simulationRef,
  };
};
