// ========================================
// WASM DTO変換
// ========================================
// wasm-bindgenが返すオブジェクト（WasmAgent/WasmStatistics）を、
// Reactの状態として保持しても安全なプレーンオブジェクトに変換する。
//
// 変換に失敗した場合は例外をそのまま投げる。呼び出し側（useSimulation.ts）が
// 既存のtry/catchでエラー状態として扱うため、ここで「全滅」等と誤認されうる
// 偽のゼロ値データを捏造してはならない。

import type { WasmAgent, WasmStatistics } from '../types/wasm';

export interface PlainAgent {
  // biome-ignore lint/style/useNamingConvention: WASM properties use snake_case
  cooperation_rate: number;
  id: string;
  mobility: number;
  // biome-ignore lint/style/useNamingConvention: WASM properties use snake_case
  movement_strategy: number;
  score: number;
  strategy: number;
  x: number;
  y: number;
}

export interface PlainStatistics {
  // biome-ignore lint/style/useNamingConvention: WASM properties use snake_case
  adaptive_count: number;
  // biome-ignore lint/style/useNamingConvention: WASM properties use snake_case
  all_cooperate_count: number;
  // biome-ignore lint/style/useNamingConvention: WASM properties use snake_case
  all_defect_count: number;
  // biome-ignore lint/style/useNamingConvention: WASM properties use snake_case
  antisocial_count: number;
  // biome-ignore lint/style/useNamingConvention: WASM properties use snake_case
  average_cooperation_rate: number;
  // biome-ignore lint/style/useNamingConvention: WASM properties use snake_case
  average_mobility: number;
  // biome-ignore lint/style/useNamingConvention: WASM properties use snake_case
  average_score: number;
  // biome-ignore lint/style/useNamingConvention: WASM properties use snake_case
  explorer_count: number;
  generation: number;
  // biome-ignore lint/style/useNamingConvention: WASM properties use snake_case
  opportunist_count: number;
  // biome-ignore lint/style/useNamingConvention: WASM properties use snake_case
  pavlov_count: number;
  // biome-ignore lint/style/useNamingConvention: WASM properties use snake_case
  settler_count: number;
  // biome-ignore lint/style/useNamingConvention: WASM properties use snake_case
  social_count: number;
  // biome-ignore lint/style/useNamingConvention: WASM properties use snake_case
  tit_for_tat_count: number;
  // biome-ignore lint/style/useNamingConvention: WASM properties use snake_case
  total_agents: number;
}

export const convertAgentToPlainObject = (agent: WasmAgent): PlainAgent => ({
  // biome-ignore lint/style/useNamingConvention: WASM properties use snake_case
  cooperation_rate: agent.cooperation_rate,
  id: agent.id,
  mobility: agent.mobility,
  // biome-ignore lint/style/useNamingConvention: WASM properties use snake_case
  movement_strategy: agent.movement_strategy,
  score: agent.score,
  strategy: agent.strategy,
  x: agent.x,
  y: agent.y,
});

export const convertAgentsToPlainObjects = (wasmAgents: WasmAgent[]): PlainAgent[] =>
  wasmAgents.map(convertAgentToPlainObject);

export const convertStatsToPlainObject = (wasmStats: WasmStatistics): PlainStatistics => ({
  // biome-ignore lint/style/useNamingConvention: WASM properties use snake_case
  adaptive_count: wasmStats.adaptive_count,
  // biome-ignore lint/style/useNamingConvention: WASM properties use snake_case
  all_cooperate_count: wasmStats.all_cooperate_count,
  // biome-ignore lint/style/useNamingConvention: WASM properties use snake_case
  all_defect_count: wasmStats.all_defect_count,
  // biome-ignore lint/style/useNamingConvention: WASM properties use snake_case
  antisocial_count: wasmStats.antisocial_count,
  // biome-ignore lint/style/useNamingConvention: WASM properties use snake_case
  average_cooperation_rate: wasmStats.average_cooperation_rate,
  // biome-ignore lint/style/useNamingConvention: WASM properties use snake_case
  average_mobility: wasmStats.average_mobility,
  // biome-ignore lint/style/useNamingConvention: WASM properties use snake_case
  average_score: wasmStats.average_score,
  // biome-ignore lint/style/useNamingConvention: WASM properties use snake_case
  explorer_count: wasmStats.explorer_count,
  generation: wasmStats.generation,
  // biome-ignore lint/style/useNamingConvention: WASM properties use snake_case
  opportunist_count: wasmStats.opportunist_count,
  // biome-ignore lint/style/useNamingConvention: WASM properties use snake_case
  pavlov_count: wasmStats.pavlov_count,
  // biome-ignore lint/style/useNamingConvention: WASM properties use snake_case
  settler_count: wasmStats.settler_count,
  // biome-ignore lint/style/useNamingConvention: WASM properties use snake_case
  social_count: wasmStats.social_count,
  // biome-ignore lint/style/useNamingConvention: WASM properties use snake_case
  tit_for_tat_count: wasmStats.tit_for_tat_count,
  // biome-ignore lint/style/useNamingConvention: WASM properties use snake_case
  total_agents: wasmStats.total_agents,
});
