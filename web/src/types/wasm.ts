export interface WasmAgent {
  readonly id: string;
  readonly x: number;
  readonly y: number;
  readonly strategy: number;
  readonly movement_strategy: number;
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
  readonly explorer_count: number;
  readonly settler_count: number;
  readonly adaptive_count: number;
  readonly opportunist_count: number;
  readonly social_count: number;
  readonly antisocial_count: number;
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
  movement_strategy_name(strategy_id: number): string;
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
} as const;

export const STRATEGY_COLORS = {
  [StrategyType.AllCooperate]: '#22c55e', // green
  [StrategyType.AllDefect]: '#ef4444', // red
  [StrategyType.TitForTat]: '#3b82f6', // blue
  [StrategyType.Pavlov]: '#f59e0b', // amber
} as const;

export const MovementStrategyType = {
  Explorer: 0,
  Settler: 1,
  Adaptive: 2,
  Opportunist: 3,
  Social: 4,
  Antisocial: 5,
} as const;

export type MovementStrategyType = (typeof MovementStrategyType)[keyof typeof MovementStrategyType];

export const MOVEMENT_STRATEGY_NAMES = {
  [MovementStrategyType.Explorer]: 'Explorer',
  [MovementStrategyType.Settler]: 'Settler',
  [MovementStrategyType.Adaptive]: 'Adaptive',
  [MovementStrategyType.Opportunist]: 'Opportunist',
  [MovementStrategyType.Social]: 'Social',
  [MovementStrategyType.Antisocial]: 'Antisocial',
} as const;

export const MOVEMENT_STRATEGY_COLORS = {
  [MovementStrategyType.Explorer]: '#10b981', // emerald
  [MovementStrategyType.Settler]: '#8b5cf6', // violet
  [MovementStrategyType.Adaptive]: '#06b6d4', // cyan
  [MovementStrategyType.Opportunist]: '#f97316', // orange
  [MovementStrategyType.Social]: '#ec4899', // pink
  [MovementStrategyType.Antisocial]: '#6b7280', // gray
} as const;
