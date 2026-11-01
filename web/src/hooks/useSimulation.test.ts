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

  describe('エラー処理と復旧', () => {
    const initialize = async (config = baseConfig) => {
      const view = await renderReadySimulation(config);
      act(() => {
        view.result.current.initializeSimulation();
      });
      return view;
    };

    const silenceConsole = () => {
      vi.spyOn(console, 'error').mockImplementation(() => undefined);
      vi.spyOn(console, 'warn').mockImplementation(() => undefined);
      vi.spyOn(console, 'log').mockImplementation(() => undefined);
    };

    afterEach(() => {
      vi.restoreAllMocks();
    });

    it('通常のエラーはメッセージを表示し、インスタンスは作り直さない', async () => {
      silenceConsole();
      const { result } = await initialize();
      const simulation = result.current.simulation as unknown as MockWasmSimulation;
      vi.spyOn(simulation, 'step').mockImplementationOnce(() => {
        throw new Error('boom');
      });

      act(() => {
        result.current.step();
      });

      expect(result.current.error).toBe('boom');
      expect(result.current.isRunning).toBe(false);
      expect(result.current.simulation).toBe(simulation);
      expect(simulation.freed).toBe(false);
    });

    it('Error以外が投げられた場合は既定のメッセージを使う', async () => {
      silenceConsole();
      const { result } = await initialize();
      const simulation = result.current.simulation as unknown as MockWasmSimulation;
      vi.spyOn(simulation, 'step').mockImplementationOnce(() => {
        // biome-ignore lint/style/useThrowOnlyError: WASM 境界から Error 以外が投げられるケースを再現する
        throw 'not an error';
      });

      act(() => {
        result.current.step();
      });

      expect(result.current.error).toBe('Simulation step failed');
    });

    it.each(['RuntimeError: unreachable', 'index out of bounds: the len is 3'])(
      '重大なWASMエラー（%s）ではインスタンスを作り直す',
      async (message) => {
        silenceConsole();
        const { result } = await initialize();
        const simulation = result.current.simulation as unknown as MockWasmSimulation;
        vi.spyOn(simulation, 'step').mockImplementationOnce(() => {
          throw new Error(message);
        });

        act(() => {
          result.current.step();
        });

        expect(simulation.freed).toBe(true);
        await waitFor(() => expect(result.current.simulation).not.toBeNull());
        expect(result.current.simulation).not.toBe(simulation);
        expect(result.current.error).toBeNull();
        expect(result.current.agents).toHaveLength(baseConfig.agentCount);
        expect(result.current.statistics?.total_agents).toBe(baseConfig.agentCount);
      }
    );

    it('resetで重大なWASMエラーが起きた場合もインスタンスを作り直す', async () => {
      silenceConsole();
      const { result } = await initialize();
      const simulation = result.current.simulation as unknown as MockWasmSimulation;
      vi.spyOn(simulation, 'reset').mockImplementationOnce(() => {
        throw new Error('RuntimeError: memory access out of bounds');
      });

      act(() => {
        result.current.reset();
      });

      expect(simulation.freed).toBe(true);
      await waitFor(() => expect(result.current.simulation).not.toBeNull());
      expect(result.current.simulation).not.toBe(simulation);
    });

    it('step後に全エージェントが消えたら停止してエラーにする', async () => {
      silenceConsole();
      const { result } = await initialize();
      const simulation = result.current.simulation as unknown as MockWasmSimulation;
      vi.spyOn(simulation, 'get_agents').mockReturnValueOnce([]);

      act(() => {
        result.current.step();
      });

      expect(result.current.error).toContain('すべてのエージェントが消失しました');
      expect(result.current.agents).toHaveLength(baseConfig.agentCount);
    });

    it('stepで統計とエージェントを最新の値に更新する', async () => {
      const { result } = await initialize();
      const simulation = result.current.simulation as unknown as MockWasmSimulation;
      simulation.generation = 4;

      act(() => {
        result.current.step();
      });

      expect(simulation.turn).toBe(1);
      expect(result.current.statistics?.generation).toBe(4);
    });

    it('初期統計の取得に失敗してもエージェントは配置される', async () => {
      silenceConsole();
      vi.spyOn(MockWasmSimulation.prototype, 'get_statistics').mockImplementationOnce(() => {
        throw new Error('stats failed');
      });
      const { result } = await initialize();

      expect(result.current.statistics).toBeNull();
      expect(result.current.agents).toHaveLength(baseConfig.agentCount);
      expect(result.current.error).toBeNull();
    });

    it('初期エージェントの取得に失敗しても統計は設定される', async () => {
      silenceConsole();
      vi.spyOn(MockWasmSimulation.prototype, 'get_agents').mockImplementationOnce(() => {
        throw new Error('agents failed');
      });
      const { result } = await initialize();

      expect(result.current.agents).toEqual([]);
      expect(result.current.statistics?.total_agents).toBe(baseConfig.agentCount);
      expect(result.current.error).toBeNull();
    });

    it('再度の初期配置では前のインスタンスを解放する', async () => {
      const { result } = await initialize();
      const first = result.current.simulation as unknown as MockWasmSimulation;

      act(() => {
        result.current.initializeSimulation();
      });

      expect(first.freed).toBe(true);
      expect(result.current.simulation).not.toBe(first);
    });

    it('アンマウント時にインスタンスを解放する', async () => {
      const { result, unmount } = await initialize();
      const simulation = result.current.simulation as unknown as MockWasmSimulation;

      unmount();

      expect(simulation.freed).toBe(true);
    });

    it('resetの失敗はエラーとして表示する', async () => {
      silenceConsole();
      const { result } = await initialize();
      const simulation = result.current.simulation as unknown as MockWasmSimulation;
      vi.spyOn(simulation, 'reset').mockImplementationOnce(() => {
        throw new Error('reset broke');
      });

      act(() => {
        result.current.reset();
      });

      expect(result.current.error).toBe('reset broke');
    });

    it('resetは設定を再適用し、エラーをクリアする', async () => {
      silenceConsole();
      const config = {
        ...baseConfig,
        strategyComplexityPenalty: true,
        strategyComplexityPenaltyRate: 0.4,
        torusField: true,
      };
      const { result } = await initialize(config);
      const simulation = result.current.simulation as unknown as MockWasmSimulation;
      vi.spyOn(simulation, 'step').mockImplementationOnce(() => {
        throw new Error('boom');
      });
      act(() => {
        result.current.step();
      });
      simulation.penaltyEnabled = false;
      simulation.penaltyRate = 0;
      simulation.torusField = false;
      simulation.turn = 5;

      act(() => {
        result.current.reset();
      });

      expect(simulation.turn).toBe(0);
      expect(simulation.penaltyEnabled).toBe(true);
      expect(simulation.penaltyRate).toBe(0.4);
      expect(simulation.torusField).toBe(true);
      expect(result.current.error).toBeNull();
    });

    it.each([
      ['setStrategyComplexityPenalty', 'set_strategy_complexity_penalty', true],
      ['setStrategyComplexityPenaltyRate', 'set_strategy_complexity_penalty_rate', 0.2],
      ['setTorusField', 'set_torus_field', true],
    ] as const)('%sの失敗はエラーとして表示する', async (hookMethod, wasmMethod, value) => {
      silenceConsole();
      const { result } = await initialize();
      const simulation = result.current.simulation as unknown as MockWasmSimulation;
      vi.spyOn(simulation, wasmMethod).mockImplementationOnce(() => {
        throw new Error(`${wasmMethod} broke`);
      });

      act(() => {
        (result.current[hookMethod] as (v: typeof value) => void)(value);
      });

      expect(result.current.error).toBe(`${wasmMethod} broke`);
    });

    it('初期化前のsetterやresetは何もしない', async () => {
      const { result } = await renderReadySimulation();

      act(() => {
        result.current.setStrategyComplexityPenalty(true);
        result.current.setStrategyComplexityPenaltyRate(0.5);
        result.current.setTorusField(true);
        result.current.reset();
      });

      expect(result.current.error).toBeNull();
      expect(result.current.isInitialized).toBe(false);
    });
  });

  describe('自動実行', () => {
    it('startでspeedごとにstepが走り、pauseで止まる', async () => {
      const { result } = await renderReadySimulation();
      act(() => {
        result.current.initializeSimulation();
      });
      const simulation = result.current.simulation as unknown as MockWasmSimulation;

      vi.useFakeTimers();
      act(() => {
        result.current.start();
      });
      act(() => {
        vi.advanceTimersByTime(baseConfig.speed * 3);
      });
      expect(simulation.turn).toBe(3);

      act(() => {
        result.current.pause();
      });
      act(() => {
        vi.advanceTimersByTime(baseConfig.speed * 3);
      });
      expect(simulation.turn).toBe(3);
    });

    it('実行中にspeedを変えると新しい間隔で動く', async () => {
      const view = await renderReadySimulation();
      act(() => {
        view.result.current.initializeSimulation();
      });
      const simulation = view.result.current.simulation as unknown as MockWasmSimulation;

      vi.useFakeTimers();
      act(() => {
        view.result.current.start();
      });
      view.rerender({ ...baseConfig, speed: 1000 });
      act(() => {
        vi.advanceTimersByTime(999);
      });
      expect(simulation.turn).toBe(0);
      act(() => {
        vi.advanceTimersByTime(1);
      });
      expect(simulation.turn).toBe(1);
    });

    it('エージェントがいない状態ではstartせずエラーにする', async () => {
      const { result } = await renderReadySimulation({ ...baseConfig, agentCount: 0 });
      act(() => {
        result.current.initializeSimulation();
      });

      act(() => {
        result.current.start();
      });

      expect(result.current.isRunning).toBe(false);
      expect(result.current.error).toBe(
        'エージェントが配置されていません。初期配置ボタンを押してください。'
      );
    });

    it('初期配置前のstartはエラーにならず何もしない', async () => {
      const { result } = await renderReadySimulation();
      act(() => {
        result.current.start();
      });
      expect(result.current.error).toBeNull();
    });
  });

  describe('状態の整合性チェック', () => {
    const silenceConsole = () => {
      vi.spyOn(console, 'error').mockImplementation(() => undefined);
      vi.spyOn(console, 'warn').mockImplementation(() => undefined);
      vi.spyOn(console, 'log').mockImplementation(() => undefined);
    };

    const zeroStats = () => ({
      ...new MockWasmSimulation(1, 1, 0).get_statistics(),
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    it('step後の統計で総数が0なら停止してエラーにする', async () => {
      const { result } = await renderReadySimulation();
      act(() => {
        result.current.initializeSimulation();
      });
      const simulation = result.current.simulation as unknown as MockWasmSimulation;
      vi.spyOn(simulation, 'step').mockReturnValueOnce(zeroStats());

      act(() => {
        result.current.step();
      });

      expect(result.current.error).toContain('すべてのエージェントが消失しました');
      expect(result.current.statistics?.total_agents).toBe(baseConfig.agentCount);
    });

    it('統計が取れずエージェントもいない場合、stepはエラーにする', async () => {
      silenceConsole();
      vi.spyOn(MockWasmSimulation.prototype, 'get_statistics').mockImplementationOnce(() => {
        throw new Error('stats failed');
      });
      const { result } = await renderReadySimulation({ ...baseConfig, agentCount: 0 });
      act(() => {
        result.current.initializeSimulation();
      });
      const simulation = result.current.simulation as unknown as MockWasmSimulation;

      act(() => {
        result.current.step();
      });

      expect(result.current.error).toContain('エージェントが配置されていません');
      expect(simulation.turn).toBe(0);
    });

    it('エージェントがいても統計の総数が0ならstep/startしない', async () => {
      vi.spyOn(MockWasmSimulation.prototype, 'get_statistics').mockReturnValueOnce(zeroStats());
      const { result } = await renderReadySimulation();
      act(() => {
        result.current.initializeSimulation();
      });
      const simulation = result.current.simulation as unknown as MockWasmSimulation;
      expect(result.current.agents).toHaveLength(baseConfig.agentCount);

      act(() => {
        result.current.step();
      });
      expect(result.current.error).toBe(
        'エージェントが配置されていません。リセットしてエージェントを配置してください。'
      );
      expect(simulation.turn).toBe(0);

      act(() => {
        result.current.start();
      });
      expect(result.current.isRunning).toBe(false);
    });

    it('統計が無い状態で自動実行すると最初のtickで停止する', async () => {
      silenceConsole();
      vi.spyOn(MockWasmSimulation.prototype, 'get_statistics').mockImplementationOnce(() => {
        throw new Error('stats failed');
      });
      const { result } = await renderReadySimulation();
      act(() => {
        result.current.initializeSimulation();
      });
      const simulation = result.current.simulation as unknown as MockWasmSimulation;

      vi.useFakeTimers();
      act(() => {
        result.current.start();
      });
      expect(result.current.isRunning).toBe(true);
      act(() => {
        vi.advanceTimersByTime(baseConfig.speed * 3);
      });

      expect(result.current.isRunning).toBe(false);
      expect(simulation.turn).toBe(0);
    });

    it('自動実行中の重大なエラーで停止し、状態をクリアしてから作り直す', async () => {
      silenceConsole();
      const { result } = await renderReadySimulation();
      act(() => {
        result.current.initializeSimulation();
      });
      const simulation = result.current.simulation as unknown as MockWasmSimulation;
      vi.spyOn(simulation, 'step').mockImplementation(() => {
        throw new Error('RuntimeError: unreachable');
      });

      vi.useFakeTimers();
      act(() => {
        result.current.start();
      });
      act(() => {
        vi.advanceTimersByTime(baseConfig.speed);
      });

      expect(result.current.isRunning).toBe(false);
      expect(result.current.statistics).toBeNull();
      expect(result.current.agents).toEqual([]);
      expect(simulation.step).toHaveBeenCalledTimes(1);

      act(() => {
        vi.advanceTimersByTime(baseConfig.speed * 5);
      });
      // インターバルは止まっており、再作成後のインスタンスで状態が復元される
      expect(simulation.step).toHaveBeenCalledTimes(1);
      expect(result.current.simulation).not.toBe(simulation);
      expect(result.current.agents).toHaveLength(baseConfig.agentCount);
    });

    it('重大なエラーが続いても毎回作り直す', async () => {
      silenceConsole();
      const { result } = await renderReadySimulation();
      act(() => {
        result.current.initializeSimulation();
      });

      for (let i = 0; i < 2; i++) {
        const current = result.current.simulation as unknown as MockWasmSimulation;
        vi.spyOn(current, 'step').mockImplementationOnce(() => {
          throw new Error('RuntimeError: unreachable');
        });
        act(() => {
          result.current.step();
        });
        await waitFor(() => {
          expect(result.current.simulation).not.toBeNull();
          expect(result.current.simulation).not.toBe(current);
        });
      }
    });

    it('作り直し時に統計・エージェントの取得に失敗しても復旧する', async () => {
      silenceConsole();
      const { result } = await renderReadySimulation();
      act(() => {
        result.current.initializeSimulation();
      });
      const simulation = result.current.simulation as unknown as MockWasmSimulation;
      vi.spyOn(simulation, 'step').mockImplementationOnce(() => {
        throw new Error('RuntimeError: unreachable');
      });
      vi.spyOn(MockWasmSimulation.prototype, 'get_statistics').mockImplementationOnce(() => {
        throw new Error('stats failed');
      });
      vi.spyOn(MockWasmSimulation.prototype, 'get_agents').mockImplementationOnce(() => {
        throw new Error('agents failed');
      });

      act(() => {
        result.current.step();
      });
      await waitFor(() => expect(result.current.simulation).not.toBeNull());

      expect(result.current.error).toBeNull();
      expect(result.current.statistics).toBeNull();
      expect(result.current.agents).toEqual([]);
    });

    it('WASMロード前の初期配置は何もしない', () => {
      const { result } = renderHook(() => useSimulation(baseConfig));
      act(() => {
        result.current.initializeSimulation();
      });
      expect(result.current.isInitialized).toBe(false);
    });

    it('再初期配置で統計が取れなければ古い統計を残さない', async () => {
      silenceConsole();
      const { result } = await renderReadySimulation();
      act(() => {
        result.current.initializeSimulation();
      });
      expect(result.current.statistics).not.toBeNull();

      vi.spyOn(MockWasmSimulation.prototype, 'get_statistics').mockImplementationOnce(() => {
        throw new Error('stats failed');
      });
      act(() => {
        result.current.initializeSimulation();
      });

      expect(result.current.statistics).toBeNull();
    });

    it('初期配置で以前のエラーをクリアする', async () => {
      silenceConsole();
      const { result } = await renderReadySimulation();
      act(() => {
        result.current.initializeSimulation();
      });
      const simulation = result.current.simulation as unknown as MockWasmSimulation;
      vi.spyOn(simulation, 'step').mockImplementationOnce(() => {
        throw new Error('boom');
      });
      act(() => {
        result.current.step();
      });
      expect(result.current.error).toBe('boom');

      act(() => {
        result.current.initializeSimulation();
      });
      expect(result.current.error).toBeNull();
    });

    it('resetは新しいエージェント数を反映し、実行中なら停止する', async () => {
      const view = await renderReadySimulation();
      act(() => {
        view.result.current.initializeSimulation();
      });
      vi.useFakeTimers();
      act(() => {
        view.result.current.start();
      });
      view.rerender({ ...baseConfig, agentCount: 4 });

      act(() => {
        view.result.current.reset();
      });

      expect(view.result.current.isRunning).toBe(false);
      expect(view.result.current.agents).toHaveLength(4);
      expect(view.result.current.statistics?.total_agents).toBe(4);
    });

    it.each([
      [
        'setStrategyComplexityPenalty',
        'set_strategy_complexity_penalty',
        true,
        'Failed to set strategy complexity penalty',
      ],
      [
        'setStrategyComplexityPenaltyRate',
        'set_strategy_complexity_penalty_rate',
        0.2,
        'Failed to set strategy complexity penalty rate',
      ],
      ['setTorusField', 'set_torus_field', true, 'Failed to set torus field'],
    ] as const)(
      '%sでError以外が投げられた場合は既定のメッセージを使う',
      async (hookMethod, wasmMethod, value, message) => {
        silenceConsole();
        const { result } = await renderReadySimulation();
        act(() => {
          result.current.initializeSimulation();
        });
        const simulation = result.current.simulation as unknown as MockWasmSimulation;
        vi.spyOn(simulation, wasmMethod).mockImplementationOnce(() => {
          // biome-ignore lint/style/useThrowOnlyError: WASM 境界から Error 以外が投げられるケースを再現する
          throw 'opaque';
        });

        act(() => {
          (result.current[hookMethod] as (v: typeof value) => void)(value);
        });

        expect(result.current.error).toBe(message);
      }
    );

    it('resetでError以外が投げられた場合は既定のメッセージを使う', async () => {
      silenceConsole();
      const { result } = await renderReadySimulation();
      act(() => {
        result.current.initializeSimulation();
      });
      const simulation = result.current.simulation as unknown as MockWasmSimulation;
      vi.spyOn(simulation, 'reset').mockImplementationOnce(() => {
        // biome-ignore lint/style/useThrowOnlyError: WASM 境界から Error 以外が投げられるケースを再現する
        throw 'opaque';
      });

      act(() => {
        result.current.reset();
      });

      expect(result.current.error).toBe('Reset failed');
    });
  });
});
