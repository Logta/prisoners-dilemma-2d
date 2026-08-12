// wasm/pkg配下はビルド生成物のためtype-onlyでインポートする（実行時コードには含めない）。
// Rust側のMovementStrategyにバリアントが追加・削除された場合、下部の
// MOVEMENT_STRATEGY_NAMES_EXHAUSTIVE_CHECK が型エラーとなり、この手書きの対応表を
// 更新し忘れることを防ぐ。
import type { WasmMovementStrategy } from '@/assets/pkg/prisoners_dilemma_2d';

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
  [StrategyType.AllCooperate]: '常に協力',
  [StrategyType.AllDefect]: '常に裏切り',
  [StrategyType.TitForTat]: 'しっぺ返し',
  [StrategyType.Pavlov]: 'パブロフ',
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
  [MovementStrategyType.Explorer]: '探検者',
  [MovementStrategyType.Settler]: '定住者',
  [MovementStrategyType.Adaptive]: '適応者',
  [MovementStrategyType.Opportunist]: '機会主義者',
  [MovementStrategyType.Social]: '社交的',
  [MovementStrategyType.Antisocial]: '非社交的',
} as const;

export const MOVEMENT_STRATEGY_COLORS = {
  [MovementStrategyType.Explorer]: '#10b981', // emerald
  [MovementStrategyType.Settler]: '#8b5cf6', // violet
  [MovementStrategyType.Adaptive]: '#06b6d4', // cyan
  [MovementStrategyType.Opportunist]: '#f97316', // orange
  [MovementStrategyType.Social]: '#ec4899', // pink
  [MovementStrategyType.Antisocial]: '#6b7280', // gray
} as const;

// コンパイル時のドリフト検出: Rust側のWasmMovementStrategy（wasm-bindgen生成）に
// バリアントが追加・削除されると、この代入がtsc上で型エラーになる。
// 利用側は存在しないが、exportすることでnoUnusedLocalsの対象外にしている。
export const MOVEMENT_STRATEGY_NAMES_EXHAUSTIVE_CHECK: Record<WasmMovementStrategy, string> =
  MOVEMENT_STRATEGY_NAMES;
