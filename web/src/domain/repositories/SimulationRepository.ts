// ========================================
// Simulation Repository Interface
// ========================================

import type { Simulation } from '../entities/Simulation';
import type { SimulationId } from '../value-objects/SimulationId';

export interface SimulationRepository {
  // 永続化
  save(simulation: Simulation): Promise<void>;

  // 取得
  findById(id: SimulationId): Promise<Simulation | null>;
  findAll(): Promise<Simulation[]>;
  findByStatus(status: 'idle' | 'running' | 'paused' | 'stopped'): Promise<Simulation[]>;

  // 削除
  delete(id: SimulationId): Promise<void>;
  deleteAll(): Promise<void>;

  // 存在確認
  exists(id: SimulationId): Promise<boolean>;

  // クエリ
  findRecent(limit: number): Promise<Simulation[]>;
  findByGenerationRange(minGeneration: number, maxGeneration: number): Promise<Simulation[]>;

  // カウント
  count(): Promise<number>;
  countByStatus(status: 'idle' | 'running' | 'paused' | 'stopped'): Promise<number>;
}

// エクスポート用ヘルパータイプ
export interface SimulationQueryOptions {
  status?: 'idle' | 'running' | 'paused' | 'stopped';
  minGeneration?: number;
  maxGeneration?: number;
  limit?: number;
  offset?: number;
}

export interface SimulationSearchResult {
  simulations: Simulation[];
  totalCount: number;
  hasMore: boolean;
}
