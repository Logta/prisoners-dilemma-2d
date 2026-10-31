import { act, renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { WasmModule, WasmSimulation } from '../types/wasm';
import {
  applyConfig,
  type SimulationInstanceConfig,
  useSimulationInstance,
} from './useSimulationInstance';

const createSimulationMock = () => ({
  free: vi.fn(),
  // biome-ignore lint/style/useNamingConvention: WASM binding uses snake_case from Rust
  set_strategy_complexity_penalty: vi.fn(),
  // biome-ignore lint/style/useNamingConvention: WASM binding uses snake_case from Rust
  set_strategy_complexity_penalty_rate: vi.fn(),
  // biome-ignore lint/style/useNamingConvention: WASM binding uses snake_case from Rust
  set_torus_field: vi.fn(),
});

type SimulationMock = ReturnType<typeof createSimulationMock>;

const baseConfig: SimulationInstanceConfig = { agentCount: 10, gridHeight: 4, gridWidth: 6 };

const createModule = () => {
  const instances: SimulationMock[] = [];
  const ctorArgs: number[][] = [];
  // biome-ignore lint/complexity/useArrowFunction: constructor function is required for `new`
  const WasmSimulation = vi.fn(function (width: number, height: number, agents: number) {
    ctorArgs.push([width, height, agents]);
    const instance = createSimulationMock();
    instances.push(instance);
    return instance;
  });
  // biome-ignore lint/style/useNamingConvention: WASM binding class name from Rust
  const module = { WasmSimulation } as unknown as WasmModule;
  return { ctorArgs, instances, module };
};

describe('applyConfig', () => {
  it('enables the penalty and its rate only when the penalty is on', () => {
    const sim = createSimulationMock();
    applyConfig(sim as unknown as WasmSimulation, {
      ...baseConfig,
      strategyComplexityPenalty: true,
      strategyComplexityPenaltyRate: 0.3,
    });
    expect(sim.set_strategy_complexity_penalty).toHaveBeenCalledWith(true);
    expect(sim.set_strategy_complexity_penalty_rate).toHaveBeenCalledWith(0.3);
    expect(sim.set_torus_field).not.toHaveBeenCalled();
  });

  it('leaves the rate untouched when it is not specified', () => {
    const sim = createSimulationMock();
    applyConfig(sim as unknown as WasmSimulation, {
      ...baseConfig,
      strategyComplexityPenalty: true,
    });
    expect(sim.set_strategy_complexity_penalty).toHaveBeenCalledWith(true);
    expect(sim.set_strategy_complexity_penalty_rate).not.toHaveBeenCalled();
  });

  it('applies a rate of 0 (falsy but defined)', () => {
    const sim = createSimulationMock();
    applyConfig(sim as unknown as WasmSimulation, {
      ...baseConfig,
      strategyComplexityPenalty: true,
      strategyComplexityPenaltyRate: 0,
    });
    expect(sim.set_strategy_complexity_penalty_rate).toHaveBeenCalledWith(0);
  });

  it('does not touch the penalty when it is off', () => {
    const sim = createSimulationMock();
    applyConfig(sim as unknown as WasmSimulation, {
      ...baseConfig,
      strategyComplexityPenalty: false,
      strategyComplexityPenaltyRate: 0.3,
    });
    expect(sim.set_strategy_complexity_penalty).not.toHaveBeenCalled();
    expect(sim.set_strategy_complexity_penalty_rate).not.toHaveBeenCalled();
  });

  it('applies the torus flag whenever it is specified, including false', () => {
    const sim = createSimulationMock();
    applyConfig(sim as unknown as WasmSimulation, { ...baseConfig, torusField: false });
    expect(sim.set_torus_field).toHaveBeenCalledWith(false);
  });
});

describe('useSimulationInstance', () => {
  it('returns null from create while the module is not loaded', () => {
    const { result } = renderHook(() => useSimulationInstance(null, baseConfig));
    let created: WasmSimulation | null = null;
    act(() => {
      created = result.current.create();
    });
    expect(created).toBeNull();
    expect(result.current.isInitialized).toBe(false);
    expect(result.current.simulation).toBeNull();
  });

  it('creates an instance with the grid config and applies options', () => {
    const { ctorArgs, instances, module } = createModule();
    const config = { ...baseConfig, torusField: true };
    const { result } = renderHook(() => useSimulationInstance(module, config));

    act(() => {
      result.current.create();
    });

    expect(ctorArgs).toEqual([[6, 4, 10]]);
    expect(instances[0].set_torus_field).toHaveBeenCalledWith(true);
    expect(result.current.simulation).toBe(instances[0]);
    expect(result.current.simulationRef.current).toBe(instances[0]);
    expect(result.current.isInitialized).toBe(true);
  });

  it('frees the previous instance when re-creating', () => {
    const { instances, module } = createModule();
    const { result } = renderHook(() => useSimulationInstance(module, baseConfig));

    act(() => {
      result.current.create();
    });
    act(() => {
      result.current.create();
    });

    expect(instances).toHaveLength(2);
    expect(instances[0].free).toHaveBeenCalledTimes(1);
    expect(instances[1].free).not.toHaveBeenCalled();
    expect(result.current.simulation).toBe(instances[1]);
  });

  it('dispose frees the instance and resets the state', () => {
    const { instances, module } = createModule();
    const { result } = renderHook(() => useSimulationInstance(module, baseConfig));

    act(() => {
      result.current.create();
    });
    act(() => {
      result.current.dispose();
    });

    expect(instances[0].free).toHaveBeenCalledTimes(1);
    expect(result.current.simulation).toBeNull();
    expect(result.current.simulationRef.current).toBeNull();
    expect(result.current.isInitialized).toBe(false);
  });

  it('swallows errors thrown while freeing', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const { instances, module } = createModule();
    const { result } = renderHook(() => useSimulationInstance(module, baseConfig));

    act(() => {
      result.current.create();
    });
    instances[0].free.mockImplementation(() => {
      throw new Error('already freed');
    });

    expect(() =>
      act(() => {
        result.current.dispose();
      })
    ).not.toThrow();
    expect(warn).toHaveBeenCalled();
    expect(result.current.simulation).toBeNull();
    warn.mockRestore();
  });

  it('frees the instance on unmount', () => {
    const { instances, module } = createModule();
    const { result, unmount } = renderHook(() => useSimulationInstance(module, baseConfig));

    act(() => {
      result.current.create();
    });
    unmount();

    expect(instances[0].free).toHaveBeenCalledTimes(1);
  });
});
