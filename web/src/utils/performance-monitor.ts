// ========================================
// Performance Monitor - パフォーマンス監視システム
// ========================================

import { logger } from './logger';

export interface PerformanceMetrics {
  timestamp: number;
  frameRate: number;
  memoryUsage: {
    used: number;
    total: number;
    percentage: number;
  };
  renderTime: number;
  wasmExecutionTime: number;
  domUpdateTime: number;
  networkLatency: number;
  cacheHitRate: number;
}

export interface PerformanceThresholds {
  minFrameRate: number;
  maxMemoryUsage: number;
  maxRenderTime: number;
  maxWasmExecutionTime: number;
  maxDomUpdateTime: number;
}

export interface PerformanceAlert {
  type: 'warning' | 'critical';
  metric: keyof PerformanceMetrics;
  value: number;
  threshold: number;
  message: string;
  timestamp: number;
  suggestions: string[];
}

class PerformanceMonitor {
  private metrics: PerformanceMetrics[] = [];
  private thresholds: PerformanceThresholds;
  private alerts: PerformanceAlert[] = [];
  private observers: PerformanceObserver[] = [];
  private frameCounter = 0;
  private lastFrameTime = 0;
  private isMonitoring = false;
  private onAlertCallbacks: Array<(alert: PerformanceAlert) => void> = [];

  // メモリ監視用
  private memoryObserver: any = null;
  private wasmMemoryStats = { allocated: 0, used: 0 };

  constructor(thresholds?: Partial<PerformanceThresholds>) {
    this.thresholds = {
      maxDomUpdateTime: 5,
      maxMemoryUsage: 100 * 1024 * 1024, // 100MB
      maxRenderTime: 16.67, // 60FPS相当
      maxWasmExecutionTime: 10,
      minFrameRate: 30,
      ...thresholds,
    };

    this.setupObservers();
  }

  // ========================================
  // 監視開始・停止
  // ========================================

  start(): void {
    if (this.isMonitoring) return;

    this.isMonitoring = true;
    this.frameCounter = 0;
    this.lastFrameTime = performance.now();

    logger.info(
      'Performance monitoring started',
      {
        thresholds: this.thresholds,
      },
      'performance'
    );

    // フレームレート監視
    this.startFrameRateMonitoring();

    // メモリ監視
    this.startMemoryMonitoring();

    // 定期的なメトリクス収集
    this.startPeriodicCollection();
  }

  stop(): void {
    if (!this.isMonitoring) return;

    this.isMonitoring = false;

    // オブザーバーの停止
    this.observers.forEach((observer) => observer.disconnect());
    this.observers = [];

    if (this.memoryObserver) {
      clearInterval(this.memoryObserver);
      this.memoryObserver = null;
    }

    logger.info(
      'Performance monitoring stopped',
      {
        totalAlerts: this.alerts.length,
        totalMetrics: this.metrics.length,
      },
      'performance'
    );
  }

  // ========================================
  // パフォーマンス測定
  // ========================================

  measureRenderTime<T>(operation: () => T, label?: string): T {
    const start = performance.now();
    const result = operation();
    const duration = performance.now() - start;

    this.recordRenderTime(duration, label);
    return result;
  }

  async measureAsyncRenderTime<T>(operation: () => Promise<T>, label?: string): Promise<T> {
    const start = performance.now();
    const result = await operation();
    const duration = performance.now() - start;

    this.recordRenderTime(duration, label);
    return result;
  }

  measureWasmExecution<T>(operation: () => T, label?: string): T {
    const start = performance.now();
    const result = operation();
    const duration = performance.now() - start;

    this.recordWasmExecutionTime(duration, label);
    return result;
  }

  measureDomUpdate<T>(operation: () => T, label?: string): T {
    const start = performance.now();
    const result = operation();
    const duration = performance.now() - start;

    this.recordDomUpdateTime(duration, label);
    return result;
  }

  // ========================================
  // メトリクス記録
  // ========================================

  private recordRenderTime(duration: number, label?: string): void {
    if (duration > this.thresholds.maxRenderTime) {
      this.createAlert(
        'warning',
        'renderTime',
        duration,
        this.thresholds.maxRenderTime,
        `レンダリング時間が閾値を超えました${label ? ` (${label})` : ''}`,
        [
          'React.memo()を使用してコンポーネントの再レンダリングを抑制',
          'useMemo()やuseCallback()で重い計算をメモ化',
          'Virtual Scrollingを実装して大量データの描画を最適化',
          'Canvas要素の使用を検討',
        ]
      );
    }

    logger.debug(
      `Render time: ${duration.toFixed(2)}ms${label ? ` (${label})` : ''}`,
      {
        duration,
        label,
        threshold: this.thresholds.maxRenderTime,
      },
      'performance'
    );
  }

  private recordWasmExecutionTime(duration: number, label?: string): void {
    this.wasmMemoryStats.used = duration;

    if (duration > this.thresholds.maxWasmExecutionTime) {
      this.createAlert(
        'warning',
        'wasmExecutionTime',
        duration,
        this.thresholds.maxWasmExecutionTime,
        `WASM実行時間が閾値を超えました${label ? ` (${label})` : ''}`,
        [
          'バッチ処理でWASM呼び出し回数を削減',
          'Web Workersで重い処理を別スレッドに移行',
          'アルゴリズムの最適化を検討',
          'データ構造の見直し',
        ]
      );
    }

    logger.debug(
      `WASM execution time: ${duration.toFixed(2)}ms${label ? ` (${label})` : ''}`,
      {
        duration,
        label,
        threshold: this.thresholds.maxWasmExecutionTime,
      },
      'performance'
    );
  }

  private recordDomUpdateTime(duration: number, label?: string): void {
    if (duration > this.thresholds.maxDomUpdateTime) {
      this.createAlert(
        'warning',
        'domUpdateTime',
        duration,
        this.thresholds.maxDomUpdateTime,
        `DOM更新時間が閾値を超えました${label ? ` (${label})` : ''}`,
        [
          'DocumentFragmentを使用してDOM操作をバッチ化',
          'CSSアニメーションでJavaScriptアニメーションを置換',
          '不要なDOM要素の削除',
          'transform/opacityプロパティの使用でGPUアクセラレーションを活用',
        ]
      );
    }

    logger.debug(
      `DOM update time: ${duration.toFixed(2)}ms${label ? ` (${label})` : ''}`,
      {
        duration,
        label,
        threshold: this.thresholds.maxDomUpdateTime,
      },
      'performance'
    );
  }

  // ========================================
  // 自動監視セットアップ
  // ========================================

  private setupObservers(): void {
    // Performance Observer APIをサポートしている場合
    if (typeof PerformanceObserver !== 'undefined') {
      // Long Task Observer
      try {
        const longTaskObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (entry.duration > 50) {
              // 50ms以上のロングタスク
              this.createAlert(
                'warning',
                'renderTime',
                entry.duration,
                50,
                'ロングタスクが検出されました',
                [
                  'コードスプリッティングで処理を分割',
                  'RequestIdleCallbackを使用して処理を遅延',
                  'Web Workersで重い処理を分離',
                  'time-slicingパターンの実装',
                ]
              );
            }
          }
        });
        longTaskObserver.observe({ entryTypes: ['longtask'] });
        this.observers.push(longTaskObserver);
      } catch (error) {
        logger.warn('Long task observer not supported', { error }, 'performance');
      }

      // Layout Shift Observer
      try {
        const layoutShiftObserver = new PerformanceObserver((list) => {
          let cumulativeScore = 0;
          for (const entry of list.getEntries()) {
            if (!entry.hadRecentInput) {
              cumulativeScore += (entry as any).value;
            }
          }

          if (cumulativeScore > 0.1) {
            // CLSが0.1を超える場合
            this.createAlert(
              'warning',
              'renderTime',
              cumulativeScore,
              0.1,
              'レイアウトシフトが検出されました',
              [
                '画像とiframe要素にwidth/height属性を設定',
                'Webフォントのfont-displayプロパティを適切に設定',
                '動的コンテンツの事前スペース確保',
                'アニメーションにtransformプロパティを使用',
              ]
            );
          }
        });
        layoutShiftObserver.observe({ entryTypes: ['layout-shift'] });
        this.observers.push(layoutShiftObserver);
      } catch (error) {
        logger.warn('Layout shift observer not supported', { error }, 'performance');
      }
    }
  }

  private startFrameRateMonitoring(): void {
    const measureFrame = () => {
      if (!this.isMonitoring) return;

      const now = performance.now();
      this.frameCounter++;

      // 1秒ごとにFPSを計算
      if (now - this.lastFrameTime >= 1000) {
        const fps = (this.frameCounter * 1000) / (now - this.lastFrameTime);
        this.frameCounter = 0;
        this.lastFrameTime = now;

        if (fps < this.thresholds.minFrameRate) {
          this.createAlert(
            'warning',
            'frameRate',
            fps,
            this.thresholds.minFrameRate,
            'フレームレートが低下しています',
            [
              'React DevToolsでコンポーネントのレンダリング頻度をチェック',
              '不要な状態更新を削減',
              'リストレンダリングの最適化',
              'デバウンシング・スロットリングの実装',
            ]
          );
        }

        // メトリクスに記録
        this.updateCurrentMetrics({ frameRate: fps });
      }

      requestAnimationFrame(measureFrame);
    };

    requestAnimationFrame(measureFrame);
  }

  private startMemoryMonitoring(): void {
    const measureMemory = () => {
      if (!this.isMonitoring) return;

      // Performance.memory APIがサポートされている場合
      if ('memory' in performance) {
        const memory = (performance as any).memory;
        const memoryUsage = {
          percentage: (memory.usedJSHeapSize / memory.totalJSHeapSize) * 100,
          total: memory.totalJSHeapSize,
          used: memory.usedJSHeapSize,
        };

        if (memoryUsage.used > this.thresholds.maxMemoryUsage) {
          this.createAlert(
            'critical',
            'memoryUsage',
            memoryUsage.used,
            this.thresholds.maxMemoryUsage,
            'メモリ使用量が危険レベルに達しています',
            [
              'メモリリークの原因となるイベントリスナーを適切に削除',
              '大きなオブジェクトの参照を適切に解除',
              'WeakMapやWeakSetの使用を検討',
              'ページ再読み込みを実行してメモリをクリア',
            ]
          );
        }

        this.updateCurrentMetrics({ memoryUsage });
      }
    };

    // 5秒ごとにメモリ使用量をチェック
    this.memoryObserver = setInterval(measureMemory, 5000);
    measureMemory(); // 初回実行
  }

  private startPeriodicCollection(): void {
    const collectMetrics = () => {
      if (!this.isMonitoring) return;

      const currentTime = performance.now();
      const currentMetrics: Partial<PerformanceMetrics> = {
        cacheHitRate: this.calculateCacheHitRate(),
        networkLatency: this.calculateNetworkLatency(),
        timestamp: currentTime,
      };

      this.updateCurrentMetrics(currentMetrics);

      setTimeout(collectMetrics, 10000); // 10秒ごと
    };

    setTimeout(collectMetrics, 1000); // 1秒後に開始
  }

  // ========================================
  // ヘルパーメソッド
  // ========================================

  private updateCurrentMetrics(updates: Partial<PerformanceMetrics>): void {
    const currentMetrics: PerformanceMetrics = {
      cacheHitRate: 0,
      domUpdateTime: 0,
      frameRate: 0,
      memoryUsage: { percentage: 0, total: 0, used: 0 },
      networkLatency: 0,
      renderTime: 0,
      timestamp: performance.now(),
      wasmExecutionTime: 0,
      ...updates,
    };

    this.metrics.push(currentMetrics);

    // 最大1000エントリまで保持
    if (this.metrics.length > 1000) {
      this.metrics = this.metrics.slice(-1000);
    }
  }

  private calculateNetworkLatency(): number {
    // Navigation Timing APIを使用
    if ('timing' in performance) {
      const timing = performance.timing;
      return timing.responseEnd - timing.requestStart;
    }
    return 0;
  }

  private calculateCacheHitRate(): number {
    // Resource Timing APIを使用してキャッシュヒット率を推定
    const resources = performance.getEntriesByType('resource');
    if (resources.length === 0) return 0;

    const cachedResources = resources.filter(
      (resource: any) =>
        resource.transferSize === 0 || resource.transferSize < resource.decodedBodySize
    );

    return (cachedResources.length / resources.length) * 100;
  }

  private createAlert(
    type: 'warning' | 'critical',
    metric: keyof PerformanceMetrics,
    value: number,
    threshold: number,
    message: string,
    suggestions: string[]
  ): void {
    const alert: PerformanceAlert = {
      message,
      metric,
      suggestions,
      threshold,
      timestamp: performance.now(),
      type,
      value,
    };

    this.alerts.push(alert);

    // 最大100アラートまで保持
    if (this.alerts.length > 100) {
      this.alerts = this.alerts.slice(-100);
    }

    // ログ記録
    const logLevel = type === 'critical' ? 'error' : 'warn';
    logger[logLevel](
      message,
      {
        metric,
        suggestions,
        threshold,
        value,
      },
      'performance'
    );

    // コールバック実行
    this.onAlertCallbacks.forEach((callback) => {
      try {
        callback(alert);
      } catch (error) {
        logger.error('Error in performance alert callback', error as Error, {}, 'performance');
      }
    });
  }

  // ========================================
  // 公開API
  // ========================================

  getCurrentMetrics(): PerformanceMetrics | null {
    return this.metrics.length > 0 ? this.metrics[this.metrics.length - 1] : null;
  }

  getMetricsHistory(count = 100): PerformanceMetrics[] {
    return this.metrics.slice(-count);
  }

  getAlerts(type?: 'warning' | 'critical'): PerformanceAlert[] {
    return type ? this.alerts.filter((alert) => alert.type === type) : this.alerts;
  }

  onAlert(callback: (alert: PerformanceAlert) => void): () => void {
    this.onAlertCallbacks.push(callback);

    return () => {
      const index = this.onAlertCallbacks.indexOf(callback);
      if (index > -1) {
        this.onAlertCallbacks.splice(index, 1);
      }
    };
  }

  updateThresholds(newThresholds: Partial<PerformanceThresholds>): void {
    this.thresholds = { ...this.thresholds, ...newThresholds };
    logger.info('Performance thresholds updated', { thresholds: this.thresholds }, 'performance');
  }

  generateReport(): {
    summary: {
      averageFrameRate: number;
      averageMemoryUsage: number;
      averageRenderTime: number;
      totalAlerts: number;
      criticalAlerts: number;
    };
    recommendations: string[];
  } {
    if (this.metrics.length === 0) {
      return {
        recommendations: ['パフォーマンス監視を開始してデータを収集してください'],
        summary: {
          averageFrameRate: 0,
          averageMemoryUsage: 0,
          averageRenderTime: 0,
          criticalAlerts: 0,
          totalAlerts: 0,
        },
      };
    }

    const summary = {
      averageFrameRate: this.metrics.reduce((sum, m) => sum + m.frameRate, 0) / this.metrics.length,
      averageMemoryUsage:
        this.metrics.reduce((sum, m) => sum + m.memoryUsage.used, 0) / this.metrics.length,
      averageRenderTime:
        this.metrics.reduce((sum, m) => sum + m.renderTime, 0) / this.metrics.length,
      criticalAlerts: this.alerts.filter((a) => a.type === 'critical').length,
      totalAlerts: this.alerts.length,
    };

    const recommendations = this.generateRecommendations(summary);

    return { recommendations, summary };
  }

  private generateRecommendations(summary: any): string[] {
    const recommendations: string[] = [];

    if (summary.averageFrameRate < 30) {
      recommendations.push('フレームレートが低いです。コンポーネントの最適化を検討してください。');
    }

    if (summary.averageMemoryUsage > 50 * 1024 * 1024) {
      // 50MB
      recommendations.push('メモリ使用量が多いです。メモリリークの確認をお勧めします。');
    }

    if (summary.averageRenderTime > 10) {
      recommendations.push('レンダリング時間が長いです。Virtual DOMの最適化を検討してください。');
    }

    if (summary.criticalAlerts > 0) {
      recommendations.push('クリティカルなパフォーマンス問題があります。緊急の対応が必要です。');
    }

    if (recommendations.length === 0) {
      recommendations.push('パフォーマンスは良好です。現在の最適化レベルを維持してください。');
    }

    return recommendations;
  }

  clearData(): void {
    this.metrics = [];
    this.alerts = [];
    logger.info('Performance monitoring data cleared', {}, 'performance');
  }
}

// ========================================
// シングルトンインスタンス
// ========================================

export const performanceMonitor = new PerformanceMonitor();

// ========================================
// React Hook
// ========================================

export function usePerformanceMonitor() {
  const [metrics, setMetrics] = React.useState<PerformanceMetrics | null>(null);
  const [alerts, setAlerts] = React.useState<PerformanceAlert[]>([]);

  React.useEffect(() => {
    performanceMonitor.start();

    const unsubscribeAlert = performanceMonitor.onAlert((alert) => {
      setAlerts((prev) => [...prev, alert]);
    });

    const interval = setInterval(() => {
      const currentMetrics = performanceMonitor.getCurrentMetrics();
      setMetrics(currentMetrics);
    }, 1000);

    return () => {
      performanceMonitor.stop();
      unsubscribeAlert();
      clearInterval(interval);
    };
  }, []);

  return {
    alerts,
    clearAlerts: () => setAlerts([]),
    getReport: () => performanceMonitor.generateReport(),
    measureDom: performanceMonitor.measureDomUpdate.bind(performanceMonitor),
    measureRender: performanceMonitor.measureRenderTime.bind(performanceMonitor),
    measureWasm: performanceMonitor.measureWasmExecution.bind(performanceMonitor),
    metrics,
  };
}
