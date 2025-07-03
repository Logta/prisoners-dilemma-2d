// ========================================
// Memory Optimizer - メモリ最適化システム
// ========================================

import { logger } from './logger';

export interface MemoryStats {
  jsHeapSizeUsed: number;
  jsHeapSizeTotal: number;
  jsHeapSizeLimit: number;
  wasmMemoryUsed: number;
  wasmMemoryAllocated: number;
  cacheSize: number;
  timestamp: number;
}

export interface MemoryThresholds {
  warningLevel: number; // パーセンテージ
  criticalLevel: number; // パーセンテージ
  gcTriggerLevel: number; // パーセンテージ
}

export interface CacheConfig {
  maxSize: number;
  maxAge: number; // ミリ秒
  gcInterval: number; // ミリ秒
}

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  accessCount: number;
  lastAccessed: number;
}

class MemoryOptimizer {
  private thresholds: MemoryThresholds;
  private cache = new Map<string, CacheEntry<any>>();
  private cacheConfig: CacheConfig;
  private gcInterval: NodeJS.Timeout | null = null;
  private memoryStats: MemoryStats[] = [];
  private weakRefs = new Set<WeakRef<any>>();
  private cleanupCallbacks = new Map<string, () => void>();

  // オブジェクトプール
  private objectPools = new Map<string, any[]>();
  private poolConfigs = new Map<string, { maxSize: number; factory: () => any }>();

  constructor(thresholds?: Partial<MemoryThresholds>, cacheConfig?: Partial<CacheConfig>) {
    this.thresholds = {
      criticalLevel: 85,
      gcTriggerLevel: 80,
      warningLevel: 70,
      ...thresholds,
    };

    this.cacheConfig = {
      gcInterval: 5 * 60 * 1000, // 100MB
      maxAge: 30 * 60 * 1000, // 30分
      maxSize: 100 * 1024 * 1024, // 5分
      ...cacheConfig,
    };

    this.startGarbageCollection();
    this.startMemoryMonitoring();
  }

  // ========================================
  // メモリ監視
  // ========================================

  getMemoryStats(): MemoryStats | null {
    if (!('memory' in performance)) {
      return null;
    }

    const memory = (performance as any).memory;
    return {
      cacheSize: this.calculateCacheSize(),
      jsHeapSizeLimit: memory.jsHeapSizeLimit,
      jsHeapSizeTotal: memory.totalJSHeapSize,
      jsHeapSizeUsed: memory.usedJSHeapSize,
      timestamp: Date.now(),
      wasmMemoryAllocated: this.estimateWasmMemoryAllocated(),
      wasmMemoryUsed: this.estimateWasmMemoryUsage(),
    };
  }

  private startMemoryMonitoring(): void {
    const checkMemory = () => {
      const stats = this.getMemoryStats();
      if (!stats) return;

      this.memoryStats.push(stats);

      // 最大100エントリまで保持
      if (this.memoryStats.length > 100) {
        this.memoryStats = this.memoryStats.slice(-100);
      }

      const usagePercentage = (stats.jsHeapSizeUsed / stats.jsHeapSizeLimit) * 100;

      if (usagePercentage >= this.thresholds.criticalLevel) {
        logger.error(
          'Critical memory usage detected',
          {
            limit: this.formatBytes(stats.jsHeapSizeLimit),
            usagePercentage: usagePercentage.toFixed(2),
            used: this.formatBytes(stats.jsHeapSizeUsed),
          },
          'memory'
        );
        this.emergencyCleanup();
      } else if (usagePercentage >= this.thresholds.warningLevel) {
        logger.warn(
          'High memory usage detected',
          {
            limit: this.formatBytes(stats.jsHeapSizeLimit),
            usagePercentage: usagePercentage.toFixed(2),
            used: this.formatBytes(stats.jsHeapSizeUsed),
          },
          'memory'
        );
      }

      if (usagePercentage >= this.thresholds.gcTriggerLevel) {
        this.triggerGarbageCollection();
      }
    };

    setInterval(checkMemory, 10000); // 10秒ごと
    checkMemory(); // 初回実行
  }

  // ========================================
  // キャッシュ管理
  // ========================================

  setCache<T>(key: string, data: T, maxAge?: number): void {
    // キャッシュサイズチェック
    if (this.calculateCacheSize() > this.cacheConfig.maxSize) {
      this.cleanupCache();
    }

    const entry: CacheEntry<T> = {
      accessCount: 0,
      data,
      lastAccessed: Date.now(),
      timestamp: Date.now(),
    };

    this.cache.set(key, entry);

    logger.debug(
      'Cache entry added',
      {
        key,
        size: this.estimateObjectSize(data),
        totalCacheSize: this.cache.size,
      },
      'memory'
    );
  }

  getCache<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    const age = Date.now() - entry.timestamp;
    const maxAge = this.cacheConfig.maxAge;

    if (age > maxAge) {
      this.cache.delete(key);
      logger.debug('Cache entry expired', { age, key }, 'memory');
      return null;
    }

    entry.accessCount++;
    entry.lastAccessed = Date.now();
    return entry.data;
  }

  clearCache(pattern?: string): void {
    if (pattern) {
      const regex = new RegExp(pattern);
      for (const key of this.cache.keys()) {
        if (regex.test(key)) {
          this.cache.delete(key);
        }
      }
      logger.info('Cache cleared by pattern', { pattern }, 'memory');
    } else {
      this.cache.clear();
      logger.info('All cache cleared', {}, 'memory');
    }
  }

  private cleanupCache(): void {
    const now = Date.now();
    let removedCount = 0;

    // 期限切れエントリを削除
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > this.cacheConfig.maxAge) {
        this.cache.delete(key);
        removedCount++;
      }
    }

    // まだ容量が大きい場合はLRU削除
    if (this.calculateCacheSize() > this.cacheConfig.maxSize) {
      const entries = Array.from(this.cache.entries());
      entries.sort((a, b) => a[1].lastAccessed - b[1].lastAccessed);

      const targetSize = this.cacheConfig.maxSize * 0.8; // 80%まで削減
      while (this.calculateCacheSize() > targetSize && entries.length > 0) {
        const [key] = entries.shift()!;
        this.cache.delete(key);
        removedCount++;
      }
    }

    logger.info(
      'Cache cleanup completed',
      {
        cacheSize: this.formatBytes(this.calculateCacheSize()),
        remainingEntries: this.cache.size,
        removedEntries: removedCount,
      },
      'memory'
    );
  }

  // ========================================
  // オブジェクトプール管理
  // ========================================

  createObjectPool<T>(
    name: string,
    factory: () => T,
    maxSize = 100,
    resetFunction?: (obj: T) => void
  ): void {
    this.poolConfigs.set(name, { factory, maxSize });
    this.objectPools.set(name, []);

    logger.info('Object pool created', { maxSize, name }, 'memory');
  }

  getFromPool<T>(name: string): T | null {
    const pool = this.objectPools.get(name);
    const config = this.poolConfigs.get(name);

    if (!pool || !config) {
      logger.warn('Object pool not found', { name }, 'memory');
      return null;
    }

    if (pool.length > 0) {
      return pool.pop() as T;
    }

    // プールが空の場合は新しいオブジェクトを作成
    return config.factory() as T;
  }

  returnToPool<T>(name: string, obj: T, resetFunction?: (obj: T) => void): void {
    const pool = this.objectPools.get(name);
    const config = this.poolConfigs.get(name);

    if (!pool || !config) {
      logger.warn('Object pool not found for return', { name }, 'memory');
      return;
    }

    if (pool.length >= config.maxSize) {
      return; // プールが満杯の場合はオブジェクトを破棄
    }

    if (resetFunction) {
      resetFunction(obj);
    }

    pool.push(obj);
  }

  clearObjectPool(name: string): void {
    const pool = this.objectPools.get(name);
    if (pool) {
      pool.length = 0;
      logger.info('Object pool cleared', { name }, 'memory');
    }
  }

  // ========================================
  // WeakRef管理
  // ========================================

  trackWeakRef<T extends object>(obj: T, cleanupCallback?: () => void): WeakRef<T> {
    const weakRef = new WeakRef(obj);
    this.weakRefs.add(weakRef);

    if (cleanupCallback) {
      // WeakRefには直接コールバックを関連付けられないため、
      // 定期的なクリーンアップ時にチェック
      const id = Math.random().toString(36);
      this.cleanupCallbacks.set(id, cleanupCallback);
    }

    return weakRef;
  }

  private cleanupWeakRefs(): void {
    let cleanedCount = 0;
    const callbacksToExecute: Array<() => void> = [];

    for (const weakRef of this.weakRefs) {
      if (weakRef.deref() === undefined) {
        this.weakRefs.delete(weakRef);
        cleanedCount++;
      }
    }

    // クリーンアップコールバックの実行
    for (const [id, callback] of this.cleanupCallbacks) {
      // 実際の実装では、WeakRefとコールバックの関連を
      // より効率的に管理する必要がある
      try {
        callback();
      } catch (error) {
        logger.error('Cleanup callback failed', error as Error, { id }, 'memory');
      }
    }

    if (cleanedCount > 0) {
      logger.debug('WeakRef cleanup completed', { cleanedCount }, 'memory');
    }
  }

  // ========================================
  // ガベージコレクション
  // ========================================

  private startGarbageCollection(): void {
    this.gcInterval = setInterval(() => {
      this.performGarbageCollection();
    }, this.cacheConfig.gcInterval);
  }

  private performGarbageCollection(): void {
    logger.debug('Starting garbage collection', {}, 'memory');

    const startTime = performance.now();
    const startStats = this.getMemoryStats();

    // キャッシュクリーンアップ
    this.cleanupCache();

    // WeakRefクリーンアップ
    this.cleanupWeakRefs();

    // 手動GC（開発環境でのみ）
    if (process.env.NODE_ENV === 'development' && (window as any).gc) {
      (window as any).gc();
    }

    const endTime = performance.now();
    const endStats = this.getMemoryStats();

    if (startStats && endStats) {
      const memoryFreed = startStats.jsHeapSizeUsed - endStats.jsHeapSizeUsed;
      logger.info(
        'Garbage collection completed',
        {
          cacheSize: this.cache.size,
          duration: `${(endTime - startTime).toFixed(2)}ms`,
          memoryFreed: this.formatBytes(memoryFreed),
          weakRefsCount: this.weakRefs.size,
        },
        'memory'
      );
    }
  }

  private triggerGarbageCollection(): void {
    logger.info('Triggering emergency garbage collection', {}, 'memory');
    this.performGarbageCollection();
  }

  private emergencyCleanup(): void {
    logger.warn('Performing emergency memory cleanup', {}, 'memory');

    // 緊急時のクリーンアップ
    this.clearCache();

    // オブジェクトプールをクリア
    for (const name of this.objectPools.keys()) {
      this.clearObjectPool(name);
    }

    // WeakRefクリーンアップ
    this.cleanupWeakRefs();

    // 強制GC
    if ((window as any).gc) {
      (window as any).gc();
    }

    logger.warn('Emergency cleanup completed', {}, 'memory');
  }

  // ========================================
  // ユーティリティメソッド
  // ========================================

  private calculateCacheSize(): number {
    let totalSize = 0;
    for (const entry of this.cache.values()) {
      totalSize += this.estimateObjectSize(entry.data);
    }
    return totalSize;
  }

  private estimateObjectSize(obj: any): number {
    // 簡易的なオブジェクトサイズ推定
    const str = JSON.stringify(obj);
    return str.length * 2; // Unicode文字のバイト数推定
  }

  private estimateWasmMemoryUsage(): number {
    // WASMメモリ使用量の推定（実装依存）
    if (typeof WebAssembly !== 'undefined' && (window as any).wasmMemory) {
      return (window as any).wasmMemory.buffer.byteLength;
    }
    return 0;
  }

  private estimateWasmMemoryAllocated(): number {
    // WASM割り当てメモリの推定（実装依存）
    return this.estimateWasmMemoryUsage(); // 簡略化
  }

  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / k ** i).toFixed(2)) + ' ' + sizes[i];
  }

  // ========================================
  // 公開API
  // ========================================

  getMemoryReport(): {
    current: MemoryStats | null;
    history: MemoryStats[];
    cacheInfo: {
      size: number;
      entries: number;
      hitRate: number;
    };
    recommendations: string[];
  } {
    const current = this.getMemoryStats();
    const history = this.memoryStats.slice(-10); // 最新10エントリ

    // キャッシュヒット率の計算（簡略化）
    let totalAccess = 0;
    let totalHits = 0;
    for (const entry of this.cache.values()) {
      totalAccess += entry.accessCount;
      totalHits += entry.accessCount > 0 ? 1 : 0;
    }
    const hitRate = totalAccess > 0 ? (totalHits / this.cache.size) * 100 : 0;

    const recommendations = this.generateRecommendations(current);

    return {
      cacheInfo: {
        entries: this.cache.size,
        hitRate,
        size: this.calculateCacheSize(),
      },
      current,
      history,
      recommendations,
    };
  }

  private generateRecommendations(stats: MemoryStats | null): string[] {
    const recommendations: string[] = [];

    if (!stats) {
      recommendations.push('メモリ統計が利用できません。最新のブラウザをご使用ください。');
      return recommendations;
    }

    const usagePercentage = (stats.jsHeapSizeUsed / stats.jsHeapSizeLimit) * 100;

    if (usagePercentage > 85) {
      recommendations.push('メモリ使用量が危険レベルです。ページの再読み込みを検討してください。');
      recommendations.push('大きなデータセットの処理を分割してください。');
    } else if (usagePercentage > 70) {
      recommendations.push(
        'メモリ使用量が多いです。不要なデータのクリーンアップを実行してください。'
      );
    }

    if (this.cache.size > 1000) {
      recommendations.push(
        'キャッシュエントリが多すぎます。キャッシュ戦略の見直しを検討してください。'
      );
    }

    if (stats.wasmMemoryUsed > 50 * 1024 * 1024) {
      // 50MB
      recommendations.push('WASMメモリ使用量が多いです。データ処理の最適化を検討してください。');
    }

    if (recommendations.length === 0) {
      recommendations.push('メモリ使用量は適切なレベルです。');
    }

    return recommendations;
  }

  updateThresholds(newThresholds: Partial<MemoryThresholds>): void {
    this.thresholds = { ...this.thresholds, ...newThresholds };
    logger.info('Memory thresholds updated', { thresholds: this.thresholds }, 'memory');
  }

  updateCacheConfig(newConfig: Partial<CacheConfig>): void {
    this.cacheConfig = { ...this.cacheConfig, ...newConfig };
    logger.info('Cache config updated', { config: this.cacheConfig }, 'memory');
  }

  destroy(): void {
    if (this.gcInterval) {
      clearInterval(this.gcInterval);
      this.gcInterval = null;
    }

    this.clearCache();
    this.weakRefs.clear();
    this.cleanupCallbacks.clear();

    for (const name of this.objectPools.keys()) {
      this.clearObjectPool(name);
    }

    logger.info('Memory optimizer destroyed', {}, 'memory');
  }
}

// ========================================
// シングルトンインスタンス
// ========================================

export const memoryOptimizer = new MemoryOptimizer();

// ========================================
// React Hook
// ========================================

export function useMemoryOptimizer() {
  const [memoryStats, setMemoryStats] = React.useState<MemoryStats | null>(null);

  React.useEffect(() => {
    const updateStats = () => {
      const stats = memoryOptimizer.getMemoryStats();
      setMemoryStats(stats);
    };

    updateStats();
    const interval = setInterval(updateStats, 5000); // 5秒ごと

    return () => clearInterval(interval);
  }, []);

  return {
    clearCache: memoryOptimizer.clearCache.bind(memoryOptimizer),
    createObjectPool: memoryOptimizer.createObjectPool.bind(memoryOptimizer),
    getCache: memoryOptimizer.getCache.bind(memoryOptimizer),
    getFromPool: memoryOptimizer.getFromPool.bind(memoryOptimizer),
    getReport: () => memoryOptimizer.getMemoryReport(),
    memoryStats,
    returnToPool: memoryOptimizer.returnToPool.bind(memoryOptimizer),
    setCache: memoryOptimizer.setCache.bind(memoryOptimizer),
    trackWeakRef: memoryOptimizer.trackWeakRef.bind(memoryOptimizer),
  };
}
