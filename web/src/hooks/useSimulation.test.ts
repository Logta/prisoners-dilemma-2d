import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useSimulation } from './useSimulation';

type MockWasmAgent = {
  id: string;
  x: number;
  y: number;
  strategy: number;
  // biome-ignore lint/style/useNamingConvention: WASM binding uses snake_case from Rust
  movement_strategy: number;
  mobility: number;
  score: number;
  // biome-ignore lint/style/useNamingConvention: WASM binding uses snake_case from Rust
  cooperation_rate: number;
};

class MockWasmSimulation {
  width: number;
  height: number;
  agentCount: number;
  generation = 0;
  turn = 0;
  freed = false;
  torusField = false;
  penaltyEnabled = false;
  penaltyRate = 0;

  constructor(width: number, height: number, agentCount: number) {
    this.width = width;
    this.height = height;
    this.agentCount = agentCount;
  }

  step() {
    this.turn += 1;
    return this.statistics();
  }

  // biome-ignore lint/style/useNamingConvention: WASM binding uses snake_case from Rust
  get_agents(): MockWasmAgent[] {
    return Array.from({ length: this.agentCount }, (_, i) => ({
      // biome-ignore lint/style/useNamingConvention: WASM binding uses snake_case from Rust
      cooperation_rate: 0.5,
      id: `agent-${i}`,
      mobility: 0.5,
      // biome-ignore lint/style/useNamingConvention: WASM binding uses snake_case from Rust
      movement_strategy: 0,
      score: 0,
      strategy: 0,
      x: i % this.width,
      y: Math.floor(i / this.width),
    }));
  }

  // biome-ignore lint/style/useNamingConvention: WASM binding uses snake_case from Rust
  get_statistics() {
    return this.statistics();
  }

  // biome-ignore lint/style/useNamingConvention: WASM binding uses snake_case from Rust
  get_grid_width() {
    return this.width;
  }

  // biome-ignore lint/style/useNamingConvention: WASM binding uses snake_case from Rust
  get_grid_height() {
    return this.height;
  }

  // biome-ignore lint/style/useNamingConvention: WASM binding uses snake_case from Rust
  get_generation() {
    return this.generation;
  }

  // biome-ignore lint/style/useNamingConvention: WASM binding uses snake_case from Rust
  get_turn() {
    return this.turn;
  }

  reset(agentCount: number) {
    this.agentCount = agentCount;
    this.generation = 0;
    this.turn = 0;
  }

  // biome-ignore lint/style/useNamingConvention: WASM binding uses snake_case from Rust
  set_strategy_complexity_penalty(enabled: boolean) {
    this.penaltyEnabled = enabled;
  }

  // biome-ignore lint/style/useNamingConvention: WASM binding uses snake_case from Rust
  set_strategy_complexity_penalty_rate(rate: number) {
    this.penaltyRate = rate;
  }

  // biome-ignore lint/style/useNamingConvention: WASM binding uses snake_case from Rust
  set_torus_field(enabled: boolean) {
    this.torusField = enabled;
  }

  free() {
    this.freed = true;
  }

  private statistics() {
    return {
      // biome-ignore lint/style/useNamingConvention: WASM binding uses snake_case from Rust
      adaptive_count: 0,
      // biome-ignore lint/style/useNamingConvention: WASM binding uses snake_case from Rust
      all_cooperate_count: this.agentCount,
      // biome-ignore lint/style/useNamingConvention: WASM binding uses snake_case from Rust
      all_defect_count: 0,
      // biome-ignore lint/style/useNamingConvention: WASM binding uses snake_case from Rust
      antisocial_count: 0,
      // biome-ignore lint/style/useNamingConvention: WASM binding uses snake_case from Rust
      average_cooperation_rate: 0.5,
      // biome-ignore lint/style/useNamingConvention: WASM binding uses snake_case from Rust
      average_mobility: 0.5,
      // biome-ignore lint/style/useNamingConvention: WASM binding uses snake_case from Rust
      average_score: 0,
      // biome-ignore lint/style/useNamingConvention: WASM binding uses snake_case from Rust
      explorer_count: this.agentCount,
      generation: this.generation,
      // biome-ignore lint/style/useNamingConvention: WASM binding uses snake_case from Rust
      opportunist_count: 0,
      // biome-ignore lint/style/useNamingConvention: WASM binding uses snake_case from Rust
      pavlov_count: 0,
      // biome-ignore lint/style/useNamingConvention: WASM binding uses snake_case from Rust
      settler_count: 0,
      // biome-ignore lint/style/useNamingConvention: WASM binding uses snake_case from Rust
      social_count: 0,
      // biome-ignore lint/style/useNamingConvention: WASM binding uses snake_case from Rust
      tit_for_tat_count: 0,
      // biome-ignore lint/style/useNamingConvention: WASM binding uses snake_case from Rust
      total_agents: this.agentCount,
    };
  }
}

vi.mock('@/assets/pkg/prisoners_dilemma_2d.js', () => ({
  default: vi.fn().mockResolvedValue(undefined),
  // biome-ignore lint/style/useNamingConvention: WASM binding uses snake_case from Rust
  set_panic_hook: vi.fn(),
  // biome-ignore lint/style/useNamingConvention: WASM binding class name from Rust
  WasmSimulation: MockWasmSimulation,
}));

const baseConfig = {
  agentCount: 10,
  gridHeight: 5,
  gridWidth: 5,
  speed: 100,
};

// wasmロード完了まで待ち、フックを利用可能な状態にするヘルパー
const renderReadySimulation = async (config = baseConfig) => {
  const view = renderHook((props) => useSimulation(props), { initialProps: config });
  await waitFor(() => expect(view.result.current.loading).toBe(false));
  return view;
};

describe('useSimulation', () => {
  afterEach(() => {
    vi.clearAllMocks();
    vi.useRealTimers();
  });

  describe('初期化前', () => {
    it('WASMロード完了までloadingがtrueのまま', () => {
      const { result } = renderHook(() => useSimulation(baseConfig));

      expect(result.current.loading).toBe(true);
      expect(result.current.isInitialized).toBe(false);
      expect(result.current.agents).toEqual([]);
    });

    it('初期配置前はstepを呼んでも何も起きない', async () => {
      const { result } = await renderReadySimulation();

      act(() => {
        result.current.step();
      });

      expect(result.current.agents).toEqual([]);
      expect(result.current.error).toBeNull();
    });
  });

  describe('initializeSimulation', () => {
    it('指定したagentCount分のエージェントを配置する', async () => {
      const { result } = await renderReadySimulation();

      act(() => {
        result.current.initializeSimulation();
      });

      expect(result.current.isInitialized).toBe(true);
      expect(result.current.agents).toHaveLength(baseConfig.agentCount);
      expect(result.current.statistics?.total_agents).toBe(baseConfig.agentCount);
      expect(result.current.error).toBeNull();
    });
  });

  describe('step', () => {
    it('turnを進め、統計とエージェントを更新する', async () => {
      const { result } = await renderReadySimulation();

      act(() => {
        result.current.initializeSimulation();
      });

      act(() => {
        result.current.step();
      });

      expect(result.current.statistics?.total_agents).toBe(baseConfig.agentCount);
      expect(result.current.error).toBeNull();
    });

    it('エージェントが0体になった場合はエラーにして停止する', async () => {
      const { result } = await renderReadySimulation({ ...baseConfig, agentCount: 0 });

      act(() => {
        result.current.initializeSimulation();
      });

      act(() => {
        result.current.step();
      });

      expect(result.current.error).toContain('エージェントが配置されていません');
    });
  });

  describe('start / pause', () => {
    it('startで一定間隔ごとにstepが実行され、pauseで止まる', async () => {
      const { result } = await renderReadySimulation();

      act(() => {
        result.current.initializeSimulation();
      });

      vi.useFakeTimers();
      act(() => {
        result.current.start();
      });
      expect(result.current.isRunning).toBe(true);

      const turnBefore = result.current.statistics?.generation ?? 0;
      act(() => {
        vi.advanceTimersByTime(baseConfig.speed * 3);
      });

      // 3回分のインターバルが経過しても総エージェント数は変わらず、停止していない
      expect(result.current.isRunning).toBe(true);
      expect(result.current.statistics?.total_agents).toBe(baseConfig.agentCount);
      expect(result.current.statistics?.generation).toBe(turnBefore);

      act(() => {
        result.current.pause();
      });
      expect(result.current.isRunning).toBe(false);
    });

    it('初期配置前はstartしても実行状態にならない', async () => {
      const { result } = await renderReadySimulation();

      act(() => {
        result.current.start();
      });

      expect(result.current.isRunning).toBe(false);
      expect(result.current.isInitialized).toBe(false);
    });
  });

  describe('reset', () => {
    it('エージェント数を再設定し、設定を再適用する', async () => {
      const { result } = await renderReadySimulation();

      act(() => {
        result.current.initializeSimulation();
      });

      act(() => {
        result.current.setTorusField(true);
      });

      act(() => {
        result.current.reset();
      });

      expect(result.current.agents).toHaveLength(baseConfig.agentCount);
      expect(result.current.statistics?.generation).toBe(0);
      expect(result.current.error).toBeNull();
    });
  });

  describe('setter群', () => {
    it('setStrategyComplexityPenaltyRateがWASM側のメソッドを呼ぶ', async () => {
      const { result } = await renderReadySimulation();

      act(() => {
        result.current.initializeSimulation();
      });

      const simulation = result.current.simulation as unknown as MockWasmSimulation;

      act(() => {
        result.current.setStrategyComplexityPenalty(true);
        result.current.setStrategyComplexityPenaltyRate(0.5);
      });

      expect(simulation.penaltyEnabled).toBe(true);
      expect(simulation.penaltyRate).toBe(0.5);
    });

    it('setTorusFieldがWASM側のメソッドを呼ぶ', async () => {
      const { result } = await renderReadySimulation();

      act(() => {
        result.current.initializeSimulation();
      });

      const simulation = result.current.simulation as unknown as MockWasmSimulation;

      act(() => {
        result.current.setTorusField(true);
      });

      expect(simulation.torusField).toBe(true);
    });
  });
});
