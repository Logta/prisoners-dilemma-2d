// ========================================
// PerformanceDashboard Organism Component
// ========================================

import type React from 'react';
import { useEffect, useState } from 'react';
import { useTheme } from '../../contexts/ApplicationContext';
import { useMemoryOptimizer } from '../../utils/memory-optimizer';
import { usePerformanceMonitor } from '../../utils/performance-monitor';
import { Badge } from '../atoms/Badge';
import { Button } from '../atoms/Button';
import { StatCard } from '../molecules/StatCard';

export interface PerformanceDashboardProps {
  className?: string;
  'data-testid'?: string;
}

export function PerformanceDashboard({
  className = '',
  'data-testid': testId,
}: PerformanceDashboardProps) {
  const { theme } = useTheme();
  const {
    metrics: performanceMetrics,
    alerts: performanceAlerts,
    clearAlerts,
    getReport: getPerformanceReport,
  } = usePerformanceMonitor();

  const { memoryStats, getReport: getMemoryReport, clearCache } = useMemoryOptimizer();

  const [showDetails, setShowDetails] = useState(false);
  const [performanceReport, setPerformanceReport] = useState<any>(null);
  const [memoryReport, setMemoryReport] = useState<any>(null);

  // レポート更新
  useEffect(() => {
    const updateReports = () => {
      setPerformanceReport(getPerformanceReport());
      setMemoryReport(getMemoryReport());
    };

    updateReports();
    const interval = setInterval(updateReports, 10000); // 10秒ごと

    return () => clearInterval(interval);
  }, [getPerformanceReport, getMemoryReport]);

  const containerStyle: React.CSSProperties = {
    backgroundColor: theme.backgroundColor,
    border: `1px solid ${theme.mode === 'dark' ? '#444' : '#e0e0e0'}`,
    borderRadius: '8px',
    boxShadow:
      theme.mode === 'dark' ? '0 2px 4px rgba(0, 0, 0, 0.3)' : '0 2px 4px rgba(0, 0, 0, 0.1)',
    padding: '1.5rem',
  };

  const sectionStyle: React.CSSProperties = {
    borderBottom: `1px solid ${theme.mode === 'dark' ? '#333' : '#f0f0f0'}`,
    marginBottom: '2rem',
    paddingBottom: '1.5rem',
  };

  const sectionTitleStyle: React.CSSProperties = {
    alignItems: 'center',
    color: theme.textColor,
    display: 'flex',
    fontSize: '1.125rem',
    fontWeight: '600',
    gap: '0.5rem',
    marginBottom: '1rem',
  };

  const gridStyle: React.CSSProperties = {
    display: 'grid',
    gap: '1rem',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
  };

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / k ** i).toFixed(2)) + ' ' + sizes[i];
  };

  const getMemoryUsageVariant = (percentage: number) => {
    if (percentage >= 85) return 'danger';
    if (percentage >= 70) return 'warning';
    return 'success';
  };

  const getFrameRateVariant = (fps: number) => {
    if (fps >= 55) return 'success';
    if (fps >= 30) return 'warning';
    return 'danger';
  };

  return (
    <div className={className} data-testid={testId} style={containerStyle}>
      {/* パフォーマンスメトリクス */}
      <div style={sectionStyle}>
        <h3 style={sectionTitleStyle}>
          <span>⚡</span>
          パフォーマンスメトリクス
        </h3>

        <div style={gridStyle}>
          <StatCard
            icon="📈"
            title="フレームレート"
            trend={
              performanceMetrics && performanceMetrics.frameRate >= 55
                ? 'up'
                : performanceMetrics && performanceMetrics.frameRate >= 30
                  ? 'stable'
                  : 'down'
            }
            value={
              performanceMetrics ? `${performanceMetrics.frameRate.toFixed(1)} FPS` : '計測中...'
            }
            variant={
              performanceMetrics ? getFrameRateVariant(performanceMetrics.frameRate) : 'default'
            }
          />

          <StatCard
            icon="🎨"
            subtitle="目標: < 16.67ms (60 FPS)"
            title="レンダリング時間"
            value={
              performanceMetrics ? `${performanceMetrics.renderTime.toFixed(2)} ms` : '計測中...'
            }
            variant={
              performanceMetrics && performanceMetrics.renderTime > 16.67 ? 'warning' : 'success'
            }
          />

          <StatCard
            icon="⚙️"
            subtitle="WASM処理時間"
            title="WASM実行時間"
            value={
              performanceMetrics
                ? `${performanceMetrics.wasmExecutionTime.toFixed(2)} ms`
                : '計測中...'
            }
            variant={
              performanceMetrics && performanceMetrics.wasmExecutionTime > 10
                ? 'warning'
                : 'success'
            }
          />

          <StatCard
            icon="🔄"
            subtitle="DOM操作時間"
            title="DOM更新時間"
            value={
              performanceMetrics ? `${performanceMetrics.domUpdateTime.toFixed(2)} ms` : '計測中...'
            }
            variant={
              performanceMetrics && performanceMetrics.domUpdateTime > 5 ? 'warning' : 'success'
            }
          />
        </div>
      </div>

      {/* メモリ使用状況 */}
      <div style={sectionStyle}>
        <h3 style={sectionTitleStyle}>
          <span>💾</span>
          メモリ使用状況
        </h3>

        <div style={gridStyle}>
          <StatCard
            icon="📊"
            subtitle={memoryStats ? `/ ${formatBytes(memoryStats.jsHeapSizeLimit)}` : ''}
            title="JS ヒープ使用量"
            trendValue={
              memoryStats
                ? `${((memoryStats.jsHeapSizeUsed / memoryStats.jsHeapSizeLimit) * 100).toFixed(1)}%`
                : undefined
            }
            value={memoryStats ? formatBytes(memoryStats.jsHeapSizeUsed) : '計測中...'}
            variant={
              memoryStats
                ? getMemoryUsageVariant(
                    (memoryStats.jsHeapSizeUsed / memoryStats.jsHeapSizeLimit) * 100
                  )
                : 'default'
            }
          />

          <StatCard
            icon="🔧"
            subtitle="WebAssembly使用量"
            title="WASM メモリ"
            value={memoryStats ? formatBytes(memoryStats.wasmMemoryUsed) : '計測中...'}
            variant="info"
          />

          <StatCard
            icon="💿"
            subtitle={memoryReport ? `${memoryReport.cacheInfo.entries} エントリ` : ''}
            title="キャッシュサイズ"
            value={memoryReport ? formatBytes(memoryReport.cacheInfo.size) : '計測中...'}
            variant="secondary"
          />

          <StatCard
            icon="🎯"
            subtitle="キャッシュ効率"
            title="キャッシュヒット率"
            value={memoryReport ? `${memoryReport.cacheInfo.hitRate.toFixed(1)}%` : '計測中...'}
            variant={memoryReport && memoryReport.cacheInfo.hitRate > 80 ? 'success' : 'warning'}
          />
        </div>
      </div>

      {/* アラート */}
      {performanceAlerts.length > 0 && (
        <div style={sectionStyle}>
          <h3 style={sectionTitleStyle}>
            <span>⚠️</span>
            パフォーマンスアラート
            <Badge size="small" variant="danger">
              {performanceAlerts.length}
            </Badge>
          </h3>

          <div
            style={{
              backgroundColor: theme.mode === 'dark' ? '#222' : '#f8f9fa',
              borderRadius: '4px',
              maxHeight: '200px',
              overflowY: 'auto',
              padding: '1rem',
            }}
          >
            {performanceAlerts.slice(-5).map((alert, index) => (
              <div
                key={index}
                style={{
                  backgroundColor: alert.type === 'critical' ? '#fff5f5' : '#fffbeb',
                  border: `1px solid ${alert.type === 'critical' ? '#fed7d7' : '#fef3c7'}`,
                  borderRadius: '4px',
                  marginBottom: '1rem',
                  padding: '0.75rem',
                }}
              >
                <div
                  style={{
                    alignItems: 'center',
                    display: 'flex',
                    gap: '0.5rem',
                    marginBottom: '0.5rem',
                  }}
                >
                  <Badge size="small" variant={alert.type === 'critical' ? 'danger' : 'warning'}>
                    {alert.type.toUpperCase()}
                  </Badge>
                  <span style={{ fontSize: '0.875rem', fontWeight: '500' }}>{alert.message}</span>
                </div>

                <div style={{ color: '#6b7280', fontSize: '0.75rem' }}>
                  {alert.metric}: {alert.value.toFixed(2)} (閾値: {alert.threshold})
                </div>

                {alert.suggestions.length > 0 && (
                  <details style={{ marginTop: '0.5rem' }}>
                    <summary
                      style={{
                        color: theme.primaryColor,
                        cursor: 'pointer',
                        fontSize: '0.75rem',
                      }}
                    >
                      改善提案を表示
                    </summary>
                    <ul
                      style={{
                        color: '#6b7280',
                        fontSize: '0.75rem',
                        marginTop: '0.5rem',
                        paddingLeft: '1rem',
                      }}
                    >
                      {alert.suggestions.map((suggestion, i) => (
                        <li key={i} style={{ marginBottom: '0.25rem' }}>
                          {suggestion}
                        </li>
                      ))}
                    </ul>
                  </details>
                )}
              </div>
            ))}
          </div>

          <div style={{ marginTop: '1rem' }}>
            <Button onClick={clearAlerts} size="small" variant="outline">
              アラートをクリア
            </Button>
          </div>
        </div>
      )}

      {/* コントロール */}
      <div style={sectionStyle}>
        <h3 style={sectionTitleStyle}>
          <span>🔧</span>
          メモリ管理
        </h3>

        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '1rem',
            marginBottom: '1rem',
          }}
        >
          <Button icon="🗑️" onClick={() => clearCache()} size="small" variant="secondary">
            キャッシュクリア
          </Button>

          <Button
            icon="♻️"
            onClick={() => {
              if ((window as any).gc) {
                (window as any).gc();
              } else {
                alert('手動GCはChrome開発者ツールでのみ利用可能です');
              }
            }}
            size="small"
            variant="outline"
          >
            強制GC
          </Button>

          <Button
            icon="📋"
            onClick={() => setShowDetails(!showDetails)}
            size="small"
            variant="primary"
          >
            {showDetails ? '詳細を非表示' : '詳細を表示'}
          </Button>
        </div>
      </div>

      {/* 詳細情報 */}
      {showDetails && (
        <div style={sectionStyle}>
          <h3 style={sectionTitleStyle}>
            <span>📊</span>
            詳細レポート
          </h3>

          <div
            style={{
              display: 'grid',
              gap: '2rem',
              gridTemplateColumns: '1fr 1fr',
            }}
          >
            {/* パフォーマンスレポート */}
            <div>
              <h4
                style={{
                  color: theme.textColor,
                  fontSize: '1rem',
                  fontWeight: '600',
                  marginBottom: '1rem',
                }}
              >
                パフォーマンス分析
              </h4>

              {performanceReport && (
                <div
                  style={{
                    backgroundColor: theme.mode === 'dark' ? '#222' : '#f8f9fa',
                    borderRadius: '4px',
                    fontSize: '0.875rem',
                    padding: '1rem',
                  }}
                >
                  <div style={{ marginBottom: '0.5rem' }}>
                    <strong>平均フレームレート:</strong>{' '}
                    {performanceReport.summary.averageFrameRate.toFixed(1)} FPS
                  </div>
                  <div style={{ marginBottom: '0.5rem' }}>
                    <strong>平均レンダリング時間:</strong>{' '}
                    {performanceReport.summary.averageRenderTime.toFixed(2)} ms
                  </div>
                  <div style={{ marginBottom: '0.5rem' }}>
                    <strong>アラート総数:</strong> {performanceReport.summary.totalAlerts}
                  </div>
                  <div style={{ marginBottom: '1rem' }}>
                    <strong>クリティカルアラート:</strong>{' '}
                    {performanceReport.summary.criticalAlerts}
                  </div>

                  <div>
                    <strong>推奨事項:</strong>
                    <ul style={{ marginTop: '0.5rem', paddingLeft: '1rem' }}>
                      {performanceReport.recommendations.map((rec: string, i: number) => (
                        <li key={i} style={{ marginBottom: '0.25rem' }}>
                          {rec}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </div>

            {/* メモリレポート */}
            <div>
              <h4
                style={{
                  color: theme.textColor,
                  fontSize: '1rem',
                  fontWeight: '600',
                  marginBottom: '1rem',
                }}
              >
                メモリ分析
              </h4>

              {memoryReport && (
                <div
                  style={{
                    backgroundColor: theme.mode === 'dark' ? '#222' : '#f8f9fa',
                    borderRadius: '4px',
                    fontSize: '0.875rem',
                    padding: '1rem',
                  }}
                >
                  <div style={{ marginBottom: '0.5rem' }}>
                    <strong>現在の使用量:</strong>{' '}
                    {formatBytes(memoryReport.current?.jsHeapSizeUsed || 0)}
                  </div>
                  <div style={{ marginBottom: '0.5rem' }}>
                    <strong>キャッシュエントリ数:</strong> {memoryReport.cacheInfo.entries}
                  </div>
                  <div style={{ marginBottom: '0.5rem' }}>
                    <strong>キャッシュヒット率:</strong> {memoryReport.cacheInfo.hitRate.toFixed(1)}
                    %
                  </div>
                  <div style={{ marginBottom: '1rem' }}>
                    <strong>WASM使用量:</strong>{' '}
                    {formatBytes(memoryReport.current?.wasmMemoryUsed || 0)}
                  </div>

                  <div>
                    <strong>推奨事項:</strong>
                    <ul style={{ marginTop: '0.5rem', paddingLeft: '1rem' }}>
                      {memoryReport.recommendations.map((rec: string, i: number) => (
                        <li key={i} style={{ marginBottom: '0.25rem' }}>
                          {rec}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
