export interface WasmAgent {
  readonly id: string;
  readonly x: number;
  readonly y: number;
  readonly strategy: number;
  readonly mobility: number;
  readonly score: number;
  readonly cooperation_rate: number;
}

export interface WasmStatistics {
  readonly generation: number;
  readonly total_agents: number;
  readonly all_cooperate_count: number;
  readonly all_defect_count: number;
  readonly tit_for_tat_count: number;
  readonly pavlov_count: number;
  readonly average_cooperation_rate: number;
  readonly average_mobility: number;
  readonly average_score: number;
}

export interface WasmSimulation {
  step(): WasmStatistics;
  get_agents(): WasmAgent[];
  get_statistics(): WasmStatistics;
  get_grid_width(): number;
  get_grid_height(): number;
  get_generation(): number;
  get_turn(): number;
  reset(agent_count: number): void;
  set_strategy_complexity_penalty(enabled: boolean): void;
  set_strategy_complexity_penalty_rate(rate: number): void;
  set_torus_field(enabled: boolean): void;
  free(): void;
}

export interface WasmSimulationConstructor {
  new (width: number, height: number, agent_count: number): WasmSimulation;
}

export interface WasmModule {
  WasmSimulation: WasmSimulationConstructor;
  set_panic_hook(): void;
  greet(name: string): void;
}

export const StrategyType = {
  AllCooperate: 0,
  AllDefect: 1,
  Pavlov: 3,
  TitForTat: 2,
} as const;

export type StrategyType = (typeof StrategyType)[keyof typeof StrategyType];

export const STRATEGY_NAMES = {
  [StrategyType.AllCooperate]: 'Always Cooperate',
  [StrategyType.AllDefect]: 'Always Defect',
  [StrategyType.TitForTat]: 'Tit for Tat',
  [StrategyType.Pavlov]: 'Pavlov',
};

export const STRATEGY_COLORS = {
  [StrategyType.AllCooperate]: '#22c55e', // green
  [StrategyType.AllDefect]: '#ef4444', // red
  [StrategyType.TitForTat]: '#3b82f6', // blue
  [StrategyType.Pavlov]: '#f59e0b', // amber
};
