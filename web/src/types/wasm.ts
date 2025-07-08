export interface WasmAgent {
  readonly id: string;
  readonly x: number;
  readonly y: number;
  readonly strategy: number;
  // biome-ignore lint/style/useNamingConvention: WASM binding uses snake_case from Rust
  readonly movement_strategy: number;
  readonly mobility: number;
  readonly score: number;
  // biome-ignore lint/style/useNamingConvention: WASM binding uses snake_case from Rust
  readonly cooperation_rate: number;
}

export interface WasmStatistics {
  readonly generation: number;
  // biome-ignore lint/style/useNamingConvention: WASM binding uses snake_case from Rust
  readonly total_agents: number;
  // biome-ignore lint/style/useNamingConvention: WASM binding uses snake_case from Rust
  readonly all_cooperate_count: number;
  // biome-ignore lint/style/useNamingConvention: WASM binding uses snake_case from Rust
  readonly all_defect_count: number;
  // biome-ignore lint/style/useNamingConvention: WASM binding uses snake_case from Rust
  readonly tit_for_tat_count: number;
  // biome-ignore lint/style/useNamingConvention: WASM binding uses snake_case from Rust
  readonly pavlov_count: number;
  // biome-ignore lint/style/useNamingConvention: WASM binding uses snake_case from Rust
  readonly explorer_count: number;
  // biome-ignore lint/style/useNamingConvention: WASM binding uses snake_case from Rust
  readonly settler_count: number;
  // biome-ignore lint/style/useNamingConvention: WASM binding uses snake_case from Rust
  readonly adaptive_count: number;
  // biome-ignore lint/style/useNamingConvention: WASM binding uses snake_case from Rust
  readonly opportunist_count: number;
  // biome-ignore lint/style/useNamingConvention: WASM binding uses snake_case from Rust
  readonly social_count: number;
  // biome-ignore lint/style/useNamingConvention: WASM binding uses snake_case from Rust
  readonly antisocial_count: number;
  // biome-ignore lint/style/useNamingConvention: WASM binding uses snake_case from Rust
  readonly average_cooperation_rate: number;
  // biome-ignore lint/style/useNamingConvention: WASM binding uses snake_case from Rust
  readonly average_mobility: number;
  // biome-ignore lint/style/useNamingConvention: WASM binding uses snake_case from Rust
  readonly average_score: number;
}

export interface WasmSimulation {
  step(): WasmStatistics;
  // biome-ignore lint/style/useNamingConvention: WASM binding uses snake_case from Rust
  get_agents(): WasmAgent[];
  // biome-ignore lint/style/useNamingConvention: WASM binding uses snake_case from Rust
  get_statistics(): WasmStatistics;
  // biome-ignore lint/style/useNamingConvention: WASM binding uses snake_case from Rust
  get_grid_width(): number;
  // biome-ignore lint/style/useNamingConvention: WASM binding uses snake_case from Rust
  get_grid_height(): number;
  // biome-ignore lint/style/useNamingConvention: WASM binding uses snake_case from Rust
  get_generation(): number;
  // biome-ignore lint/style/useNamingConvention: WASM binding uses snake_case from Rust
  get_turn(): number;
  reset(agentCount: number): void;
  // biome-ignore lint/style/useNamingConvention: WASM binding uses snake_case from Rust
  set_strategy_complexity_penalty(enabled: boolean): void;
  // biome-ignore lint/style/useNamingConvention: WASM binding uses snake_case from Rust
  set_strategy_complexity_penalty_rate(rate: number): void;
  // biome-ignore lint/style/useNamingConvention: WASM binding uses snake_case from Rust
  set_torus_field(enabled: boolean): void;
  free(): void;
}

export interface WasmSimulationConstructor {
  new (width: number, height: number, agentCount: number): WasmSimulation;
}

export interface WasmModule {
  // biome-ignore lint/style/useNamingConvention: WASM binding class name from Rust
  WasmSimulation: WasmSimulationConstructor;
  // biome-ignore lint/style/useNamingConvention: WASM binding uses snake_case from Rust
  movement_strategy_name(strategyId: number): string;
  // biome-ignore lint/style/useNamingConvention: WASM binding uses snake_case from Rust
  set_panic_hook(): void;
  greet(name: string): void;
}

export const StrategyType = {
  // biome-ignore lint/style/useNamingConvention: Strategy names match Rust enum variants
  AllCooperate: 0,
  // biome-ignore lint/style/useNamingConvention: Strategy names match Rust enum variants
  AllDefect: 1,
  // biome-ignore lint/style/useNamingConvention: Strategy names match Rust enum variants
  Pavlov: 3,
  // biome-ignore lint/style/useNamingConvention: Strategy names match Rust enum variants
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
  // biome-ignore lint/style/useNamingConvention: Movement strategy names match Rust enum variants
  Adaptive: 2,
  // biome-ignore lint/style/useNamingConvention: Movement strategy names match Rust enum variants
  Antisocial: 5,
  // biome-ignore lint/style/useNamingConvention: Movement strategy names match Rust enum variants
  Explorer: 0,
  // biome-ignore lint/style/useNamingConvention: Movement strategy names match Rust enum variants
  Opportunist: 3,
  // biome-ignore lint/style/useNamingConvention: Movement strategy names match Rust enum variants
  Settler: 1,
  // biome-ignore lint/style/useNamingConvention: Movement strategy names match Rust enum variants
  Social: 4,
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
