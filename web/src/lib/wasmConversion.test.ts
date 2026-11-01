import { describe, expect, it } from 'vitest';
import type { WasmAgent, WasmStatistics } from '../types/wasm';
import {
  convertAgentsToPlainObjects,
  convertAgentToPlainObject,
  convertStatsToPlainObject,
} from './wasmConversion';

// wasm-bindgen のオブジェクトはゲッター経由で値を返すため、それを模したオブジェクトを作る
const withGetters = <T extends object>(values: T): T => {
  const target = Object.create({ extra: 'prototype-only' });
  for (const [key, value] of Object.entries(values)) {
    Object.defineProperty(target, key, { enumerable: false, get: () => value });
  }
  return target as T;
};

const agentValues: WasmAgent = {
  // biome-ignore lint/style/useNamingConvention: WASM properties use snake_case
  cooperation_rate: 0.25,
  id: 'agent-1',
  mobility: 0.75,
  // biome-ignore lint/style/useNamingConvention: WASM properties use snake_case
  movement_strategy: 3,
  score: 42,
  strategy: 2,
  x: 7,
  y: 9,
};

const statsValues: WasmStatistics = {
  // biome-ignore lint/style/useNamingConvention: WASM properties use snake_case
  adaptive_count: 3,
  // biome-ignore lint/style/useNamingConvention: WASM properties use snake_case
  all_cooperate_count: 4,
  // biome-ignore lint/style/useNamingConvention: WASM properties use snake_case
  all_defect_count: 5,
  // biome-ignore lint/style/useNamingConvention: WASM properties use snake_case
  antisocial_count: 6,
  // biome-ignore lint/style/useNamingConvention: WASM properties use snake_case
  average_cooperation_rate: 0.5,
  // biome-ignore lint/style/useNamingConvention: WASM properties use snake_case
  average_mobility: 0.6,
  // biome-ignore lint/style/useNamingConvention: WASM properties use snake_case
  average_score: 12.5,
  // biome-ignore lint/style/useNamingConvention: WASM properties use snake_case
  explorer_count: 7,
  generation: 8,
  // biome-ignore lint/style/useNamingConvention: WASM properties use snake_case
  opportunist_count: 9,
  // biome-ignore lint/style/useNamingConvention: WASM properties use snake_case
  pavlov_count: 10,
  // biome-ignore lint/style/useNamingConvention: WASM properties use snake_case
  settler_count: 11,
  // biome-ignore lint/style/useNamingConvention: WASM properties use snake_case
  social_count: 12,
  // biome-ignore lint/style/useNamingConvention: WASM properties use snake_case
  tit_for_tat_count: 13,
  // biome-ignore lint/style/useNamingConvention: WASM properties use snake_case
  total_agents: 18,
};

describe('wasmConversion', () => {
  it('copies every agent field into a plain object', () => {
    const plain = convertAgentToPlainObject(withGetters(agentValues));
    expect(plain).toStrictEqual(agentValues);
    expect(Object.getPrototypeOf(plain)).toBe(Object.prototype);
  });

  it('converts each agent in order', () => {
    const second = { ...agentValues, id: 'agent-2', x: 1 };
    const plain = convertAgentsToPlainObjects([withGetters(agentValues), withGetters(second)]);
    expect(plain).toStrictEqual([agentValues, second]);
    expect(convertAgentsToPlainObjects([])).toStrictEqual([]);
  });

  it('copies every statistics field into a plain object', () => {
    const plain = convertStatsToPlainObject(withGetters(statsValues));
    expect(plain).toStrictEqual(statsValues);
  });
});
