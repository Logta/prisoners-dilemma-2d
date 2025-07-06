/* tslint:disable */
/* eslint-disable */
/**
 * 標準的なシミュレーション設定を作成
 */
export function create_standard_config(): WasmSimulationConfig;
/**
 * パニックフックを設定
 */
export function main(): void;
/**
 * WebAssembly用の戦闘マネージャー
 */
export class WasmBattleManager {
  free(): void;
  constructor();
  /**
   * カスタム利得マトリクスで戦闘マネージャーを作成
   */
  static with_payoff_matrix(mutual_cooperation: number, mutual_defection: number, cooperation_exploited: number, defection_advantage: number): WasmBattleManager;
  /**
   * 戦闘を実行
   */
  execute_battle(agent1_id: bigint, agent2_id: bigint, agents_json: string): any;
  /**
   * 戦闘履歴を取得
   */
  get_battle_history(agent_id: bigint, opponent_id?: bigint | null, limit?: number | null): any;
  /**
   * 現在のラウンドを取得
   */
  current_round(): number;
  /**
   * ラウンドを進める
   */
  advance_round(): void;
  /**
   * 履歴をクリア
   */
  clear_history(): void;
}
/**
 * WebAssembly用のシミュレーション設定
 */
export class WasmSimulationConfig {
  free(): void;
  constructor(world_width: number, world_height: number, initial_population: number, max_generations: number, battles_per_generation: number, neighbor_radius: number, mutation_rate: number, mutation_strength: number, elite_ratio: number, selection_method: string, crossover_method: string);
  readonly world_width: number;
  readonly world_height: number;
  readonly initial_population: number;
  readonly max_generations: number;
  readonly battles_per_generation: number;
  readonly neighbor_radius: number;
  readonly mutation_rate: number;
  readonly mutation_strength: number;
  readonly elite_ratio: number;
  selection_method: string;
  crossover_method: string;
}
/**
 * WebAssembly用のシミュレーションマネージャー
 */
export class WasmSimulationManager {
  free(): void;
  constructor();
  /**
   * シミュレーションを初期化
   */
  initialize(config: WasmSimulationConfig): any;
  /**
   * 指定世代数のシミュレーションを実行
   */
  run_simulation(config: WasmSimulationConfig, generations: number): any;
  /**
   * 1ステップ実行
   */
  step(): any;
  /**
   * 1世代実行
   */
  run_generation(): any;
  /**
   * 現在の統計を取得
   */
  get_current_stats(): any;
  /**
   * 現在のエージェント情報を取得
   */
  get_current_agents(): any;
  /**
   * 指定位置のエージェントを取得
   */
  get_agent_at(x: number, y: number): any;
  /**
   * シミュレーションが完了しているかチェック
   */
  is_finished(): boolean;
  /**
   * シミュレーションをリセット
   */
  reset(): void;
}

export type InitInput = RequestInfo | URL | Response | BufferSource | WebAssembly.Module;

export interface InitOutput {
  readonly memory: WebAssembly.Memory;
  readonly __wbg_wasmsimulationconfig_free: (a: number, b: number) => void;
  readonly wasmsimulationconfig_new: (a: number, b: number, c: number, d: number, e: number, f: number, g: number, h: number, i: number, j: number, k: number, l: number, m: number) => number;
  readonly wasmsimulationconfig_world_width: (a: number) => number;
  readonly wasmsimulationconfig_world_height: (a: number) => number;
  readonly wasmsimulationconfig_max_generations: (a: number) => number;
  readonly wasmsimulationconfig_battles_per_generation: (a: number) => number;
  readonly wasmsimulationconfig_neighbor_radius: (a: number) => number;
  readonly wasmsimulationconfig_mutation_rate: (a: number) => number;
  readonly wasmsimulationconfig_mutation_strength: (a: number) => number;
  readonly wasmsimulationconfig_elite_ratio: (a: number) => number;
  readonly wasmsimulationconfig_selection_method: (a: number) => [number, number];
  readonly wasmsimulationconfig_crossover_method: (a: number) => [number, number];
  readonly wasmsimulationconfig_set_selection_method: (a: number, b: number, c: number) => void;
  readonly wasmsimulationconfig_set_crossover_method: (a: number, b: number, c: number) => void;
  readonly __wbg_wasmsimulationmanager_free: (a: number, b: number) => void;
  readonly wasmsimulationmanager_new: () => number;
  readonly wasmsimulationmanager_initialize: (a: number, b: number) => [number, number, number];
  readonly wasmsimulationmanager_run_simulation: (a: number, b: number, c: number) => [number, number, number];
  readonly wasmsimulationmanager_step: (a: number) => [number, number, number];
  readonly wasmsimulationmanager_run_generation: (a: number) => [number, number, number];
  readonly wasmsimulationmanager_get_current_stats: (a: number) => [number, number, number];
  readonly wasmsimulationmanager_get_current_agents: (a: number) => [number, number, number];
  readonly wasmsimulationmanager_get_agent_at: (a: number, b: number, c: number) => [number, number, number];
  readonly wasmsimulationmanager_is_finished: (a: number) => [number, number, number];
  readonly wasmsimulationmanager_reset: (a: number) => void;
  readonly __wbg_wasmbattlemanager_free: (a: number, b: number) => void;
  readonly wasmbattlemanager_new: () => number;
  readonly wasmbattlemanager_with_payoff_matrix: (a: number, b: number, c: number, d: number) => number;
  readonly wasmbattlemanager_execute_battle: (a: number, b: bigint, c: bigint, d: number, e: number) => [number, number, number];
  readonly wasmbattlemanager_get_battle_history: (a: number, b: bigint, c: number, d: bigint, e: number) => [number, number, number];
  readonly wasmbattlemanager_current_round: (a: number) => number;
  readonly wasmbattlemanager_advance_round: (a: number) => void;
  readonly wasmbattlemanager_clear_history: (a: number) => void;
  readonly create_standard_config: () => number;
  readonly main: () => void;
  readonly wasmsimulationconfig_initial_population: (a: number) => number;
  readonly __wbindgen_exn_store: (a: number) => void;
  readonly __externref_table_alloc: () => number;
  readonly __wbindgen_export_2: WebAssembly.Table;
  readonly __wbindgen_malloc: (a: number, b: number) => number;
  readonly __wbindgen_realloc: (a: number, b: number, c: number, d: number) => number;
  readonly __wbindgen_free: (a: number, b: number, c: number) => void;
  readonly __externref_table_dealloc: (a: number) => void;
  readonly __wbindgen_start: () => void;
}

export type SyncInitInput = BufferSource | WebAssembly.Module;
/**
* Instantiates the given `module`, which can either be bytes or
* a precompiled `WebAssembly.Module`.
*
* @param {{ module: SyncInitInput }} module - Passing `SyncInitInput` directly is deprecated.
*
* @returns {InitOutput}
*/
export function initSync(module: { module: SyncInitInput } | SyncInitInput): InitOutput;

/**
* If `module_or_path` is {RequestInfo} or {URL}, makes a request and
* for everything else, calls `WebAssembly.instantiate` directly.
*
* @param {{ module_or_path: InitInput | Promise<InitInput> }} module_or_path - Passing `InitInput` directly is deprecated.
*
* @returns {Promise<InitOutput>}
*/
export default function __wbg_init (module_or_path?: { module_or_path: InitInput | Promise<InitInput> } | InitInput | Promise<InitInput>): Promise<InitOutput>;
