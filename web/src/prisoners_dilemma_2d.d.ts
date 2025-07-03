/* tslint:disable */
/* eslint-disable */
export class SimulationEngine {
  free(): void;
  constructor(width: number, height: number);
  populate_agents(density: number): void;
  run_generation(battle_radius: number): number;
  run_generations(count: number, battle_radius: number): number;
  evolve_population_with_config(config_json: string): void;
  evolve_population(selection_method: string, selection_param: number, crossover_method: string, crossover_param: number, mutation_rate: number, mutation_strength: number): void;
  get_agent_data_json(): string;
  get_agent_data(): Array<any>;
  get_statistics_json(): string;
  get_statistics(): object;
  get_generation(): number;
  get_population_size(): number;
  get_grid_dimensions(): object;
  reset(): void;
  set_payoff_matrix(cc: number, cd: number, dc: number, dd: number): void;
}

export type InitInput = RequestInfo | URL | Response | BufferSource | WebAssembly.Module;

export interface InitOutput {
  readonly memory: WebAssembly.Memory;
  readonly __wbg_simulationengine_free: (a: number, b: number) => void;
  readonly simulationengine_new: (a: number, b: number) => [number, number, number];
  readonly simulationengine_populate_agents: (a: number, b: number) => [number, number];
  readonly simulationengine_run_generation: (a: number, b: number) => [number, number, number];
  readonly simulationengine_run_generations: (a: number, b: number, c: number) => [number, number, number];
  readonly simulationengine_evolve_population_with_config: (a: number, b: number, c: number) => [number, number];
  readonly simulationengine_evolve_population: (a: number, b: number, c: number, d: number, e: number, f: number, g: number, h: number, i: number) => [number, number];
  readonly simulationengine_get_agent_data_json: (a: number) => [number, number];
  readonly simulationengine_get_agent_data: (a: number) => any;
  readonly simulationengine_get_statistics_json: (a: number) => [number, number];
  readonly simulationengine_get_statistics: (a: number) => any;
  readonly simulationengine_get_generation: (a: number) => number;
  readonly simulationengine_get_population_size: (a: number) => number;
  readonly simulationengine_get_grid_dimensions: (a: number) => any;
  readonly simulationengine_reset: (a: number) => void;
  readonly simulationengine_set_payoff_matrix: (a: number, b: number, c: number, d: number, e: number) => [number, number];
  readonly __wbindgen_exn_store: (a: number) => void;
  readonly __externref_table_alloc: () => number;
  readonly __wbindgen_export_2: WebAssembly.Table;
  readonly __externref_table_dealloc: (a: number) => void;
  readonly __wbindgen_malloc: (a: number, b: number) => number;
  readonly __wbindgen_realloc: (a: number, b: number, c: number, d: number) => number;
  readonly __wbindgen_free: (a: number, b: number, c: number) => void;
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
