// ========================================
// LocalStorage Simulation Repository Implementation
// ========================================

import { Simulation } from '../../domain/entities/Simulation';
import type {
  SimulationQueryOptions,
  SimulationRepository,
  SimulationSearchResult,
} from '../../domain/repositories/SimulationRepository';
import { SimulationId } from '../../domain/value-objects/SimulationId';

export class LocalStorageSimulationRepository implements SimulationRepository {
  private readonly storageKey = 'prisoners-dilemma-simulations';
  private readonly indexKey = 'prisoners-dilemma-simulation-index';

  // ========================================
  // 永続化
  // ========================================

  async save(simulation: Simulation): Promise<void> {
    try {
      const serialized = JSON.stringify(simulation.toJSON());
      localStorage.setItem(`${this.storageKey}:${simulation.id}`, serialized);

      // インデックスを更新
      await this.updateIndex(simulation.id);
    } catch (error) {
      throw new Error(`Failed to save simulation: ${error}`);
    }
  }

  // ========================================
  // 取得
  // ========================================

  async findById(id: SimulationId): Promise<Simulation | null> {
    try {
      const key = `${this.storageKey}:${id.value}`;
      const serialized = localStorage.getItem(key);

      if (!serialized) {
        return null;
      }

      const data = JSON.parse(serialized);
      return Simulation.fromJSON(data);
    } catch (error) {
      console.error(`Failed to load simulation ${id.value}:`, error);
      return null;
    }
  }

  async findAll(): Promise<Simulation[]> {
    try {
      const index = await this.getIndex();
      const simulations: Simulation[] = [];

      for (const id of index) {
        const simulation = await this.findById(new SimulationId(id));
        if (simulation) {
          simulations.push(simulation);
        }
      }

      return simulations;
    } catch (error) {
      console.error('Failed to load all simulations:', error);
      return [];
    }
  }

  async findByStatus(status: 'idle' | 'running' | 'paused' | 'stopped'): Promise<Simulation[]> {
    const allSimulations = await this.findAll();
    return allSimulations.filter((sim) => sim.status === status);
  }

  async findRecent(limit: number): Promise<Simulation[]> {
    const allSimulations = await this.findAll();

    // 開始時刻でソート（新しい順）
    const sorted = allSimulations.sort((a, b) => {
      const timeA = a.startTime?.getTime() || 0;
      const timeB = b.startTime?.getTime() || 0;
      return timeB - timeA;
    });

    return sorted.slice(0, limit);
  }

  async findByGenerationRange(minGeneration: number, maxGeneration: number): Promise<Simulation[]> {
    const allSimulations = await this.findAll();
    return allSimulations.filter(
      (sim) => sim.generation >= minGeneration && sim.generation <= maxGeneration
    );
  }

  // ========================================
  // 削除
  // ========================================

  async delete(id: SimulationId): Promise<void> {
    try {
      const key = `${this.storageKey}:${id.value}`;
      localStorage.removeItem(key);

      // インデックスから削除
      await this.removeFromIndex(id.value);
    } catch (error) {
      throw new Error(`Failed to delete simulation: ${error}`);
    }
  }

  async deleteAll(): Promise<void> {
    try {
      const index = await this.getIndex();

      // 各シミュレーションを削除
      for (const id of index) {
        const key = `${this.storageKey}:${id}`;
        localStorage.removeItem(key);
      }

      // インデックスをクリア
      localStorage.removeItem(this.indexKey);
    } catch (error) {
      throw new Error(`Failed to delete all simulations: ${error}`);
    }
  }

  // ========================================
  // 存在確認
  // ========================================

  async exists(id: SimulationId): Promise<boolean> {
    const key = `${this.storageKey}:${id.value}`;
    return localStorage.getItem(key) !== null;
  }

  // ========================================
  // カウント
  // ========================================

  async count(): Promise<number> {
    const index = await this.getIndex();
    return index.length;
  }

  async countByStatus(status: 'idle' | 'running' | 'paused' | 'stopped'): Promise<number> {
    const simulations = await this.findByStatus(status);
    return simulations.length;
  }

  // ========================================
  // 高度なクエリ
  // ========================================

  async search(options: SimulationQueryOptions): Promise<SimulationSearchResult> {
    let simulations = await this.findAll();

    // ステータスフィルタ
    if (options.status) {
      simulations = simulations.filter((sim) => sim.status === options.status);
    }

    // 世代範囲フィルタ
    if (options.minGeneration !== undefined) {
      simulations = simulations.filter((sim) => sim.generation >= options.minGeneration!);
    }
    if (options.maxGeneration !== undefined) {
      simulations = simulations.filter((sim) => sim.generation <= options.maxGeneration!);
    }

    const totalCount = simulations.length;

    // ページネーション
    if (options.offset !== undefined) {
      simulations = simulations.slice(options.offset);
    }
    if (options.limit !== undefined) {
      simulations = simulations.slice(0, options.limit);
    }

    const hasMore = options.limit ? totalCount > (options.offset || 0) + options.limit : false;

    return {
      hasMore,
      simulations,
      totalCount,
    };
  }

  // ========================================
  // ユーティリティ・メンテナンス
  // ========================================

  async getStorageUsage(): Promise<{ used: number; available: number; percentage: number }> {
    try {
      // LocalStorageの概算使用量を計算
      let used = 0;
      const index = await this.getIndex();

      for (const id of index) {
        const key = `${this.storageKey}:${id}`;
        const value = localStorage.getItem(key);
        if (value) {
          used += key.length + value.length;
        }
      }

      // ブラウザの制限は通常5MB程度
      const available = 5 * 1024 * 1024; // 5MB in bytes
      const percentage = (used / available) * 100;

      return { available, percentage, used };
    } catch (error) {
      return { available: 5 * 1024 * 1024, percentage: 0, used: 0 };
    }
  }

  async cleanup(): Promise<{ cleaned: number; errors: string[] }> {
    const errors: string[] = [];
    let cleaned = 0;

    try {
      const index = await this.getIndex();
      const validIds: string[] = [];

      for (const id of index) {
        try {
          const simulation = await this.findById(new SimulationId(id));
          if (simulation) {
            validIds.push(id);
          } else {
            // 破損したデータを削除
            const key = `${this.storageKey}:${id}`;
            localStorage.removeItem(key);
            cleaned++;
          }
        } catch (error) {
          errors.push(`Failed to validate simulation ${id}: ${error}`);
          // 破損したデータを削除
          const key = `${this.storageKey}:${id}`;
          localStorage.removeItem(key);
          cleaned++;
        }
      }

      // インデックスを更新
      await this.setIndex(validIds);

      return { cleaned, errors };
    } catch (error) {
      errors.push(`Cleanup failed: ${error}`);
      return { cleaned, errors };
    }
  }

  // ========================================
  // プライベートメソッド
  // ========================================

  private async getIndex(): Promise<string[]> {
    try {
      const indexData = localStorage.getItem(this.indexKey);
      return indexData ? JSON.parse(indexData) : [];
    } catch (error) {
      console.error('Failed to load simulation index:', error);
      return [];
    }
  }

  private async setIndex(index: string[]): Promise<void> {
    try {
      localStorage.setItem(this.indexKey, JSON.stringify(index));
    } catch (error) {
      throw new Error(`Failed to update simulation index: ${error}`);
    }
  }

  private async updateIndex(id: string): Promise<void> {
    const index = await this.getIndex();
    if (!index.includes(id)) {
      index.push(id);
      await this.setIndex(index);
    }
  }

  private async removeFromIndex(id: string): Promise<void> {
    const index = await this.getIndex();
    const filteredIndex = index.filter((indexId) => indexId !== id);
    await this.setIndex(filteredIndex);
  }
}
