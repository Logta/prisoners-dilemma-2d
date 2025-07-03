// ========================================
// StatisticsPanel Organism Component
// ========================================

import React, { useMemo } from 'react';
import { useTheme } from '../../contexts/ApplicationContext';
import { useSimulationContext } from '../../contexts/SimulationContext';
import { Statistics } from '../../types';
import { StatCard } from '../molecules/StatCard';

export interface StatisticsPanelProps {
  className?: string;
  'data-testid'?: string;
}

export function StatisticsPanel({ className = '', 'data-testid': testId }: StatisticsPanelProps) {
  const { simulation } = useSimulationContext();
  const { theme } = useTheme();

  const currentSimulation = simulation.currentSimulation;
  const statistics = currentSimulation?.statistics || [];
  const latestStats = currentSimulation?.getLatestStatistics();

  // トレンド計算
  const trends = useMemo(() => {
    if (statistics.length < 2) {
      return {
        cooperation: 'stable' as const,
        movement: 'stable' as const,
        population: 'stable' as const,
        score: 'stable' as const,
      };
    }

    const recent = statistics.slice(-5);
    const older = statistics.slice(-10, -5);

    if (recent.length === 0 || older.length === 0) {
      return {
        cooperation: 'stable' as const,
        movement: 'stable' as const,
        population: 'stable' as const,
        score: 'stable' as const,
      };
    }

    const recentAvg = {
      cooperation: recent.reduce((sum, s) => sum + s.avg_cooperation, 0) / recent.length,
      movement: recent.reduce((sum, s) => sum + s.avg_movement, 0) / recent.length,
      population: recent.reduce((sum, s) => sum + s.population, 0) / recent.length,
      score: recent.reduce((sum, s) => sum + s.avg_score, 0) / recent.length,
    };

    const olderAvg = {
      cooperation: older.reduce((sum, s) => sum + s.avg_cooperation, 0) / older.length,
      movement: older.reduce((sum, s) => sum + s.avg_movement, 0) / older.length,
      population: older.reduce((sum, s) => sum + s.population, 0) / older.length,
      score: older.reduce((sum, s) => sum + s.avg_score, 0) / older.length,
    };

    const threshold = 0.05; // 5%の変化を閾値とする

    return {
      cooperation:
        recentAvg.cooperation > olderAvg.cooperation * (1 + threshold)
          ? 'up'
          : recentAvg.cooperation < olderAvg.cooperation * (1 - threshold)
            ? 'down'
            : 'stable',
      movement:
        recentAvg.movement > olderAvg.movement * (1 + threshold)
          ? 'up'
          : recentAvg.movement < olderAvg.movement * (1 - threshold)
            ? 'down'
            : 'stable',
      population:
        recentAvg.population > olderAvg.population * (1 + threshold)
          ? 'up'
          : recentAvg.population < olderAvg.population * (1 - threshold)
            ? 'down'
            : 'stable',
      score:
        recentAvg.score > olderAvg.score * (1 + threshold)
          ? 'up'
          : recentAvg.score < olderAvg.score * (1 - threshold)
            ? 'down'
            : 'stable',
    };
  }, [statistics]);

  // パフォーマンスメトリクス
  const performanceMetrics = currentSimulation?.getPerformanceMetrics();

  const panelStyle = {
    backgroundColor: theme.backgroundColor,
    border: `1px solid ${theme.mode === 'dark' ? '#444' : '#e0e0e0'}`,
    borderRadius: '8px',
    boxShadow:
      theme.mode === 'dark' ? '0 2px 4px rgba(0, 0, 0, 0.3)' : '0 2px 4px rgba(0, 0, 0, 0.1)',
    padding: '1.5rem',
  };

  const sectionStyle = {
    marginBottom: '2rem',
  };

  const sectionTitleStyle = {
    alignItems: 'center',
    color: theme.textColor,
    display: 'flex',
    fontSize: '1.125rem',
    fontWeight: '600',
    gap: '0.5rem',
    marginBottom: '1rem',
  };

  const gridStyle = {
    display: 'grid',
    gap: '1rem',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
  };

  if (!latestStats) {
    return (
      <div className={className} data-testid={testId} style={panelStyle}>
        <div
          style={{
            color: theme.mode === 'dark' ? '#888' : '#6c757d',
            padding: '3rem',
            textAlign: 'center',
          }}
        >
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📊</div>
          <h3>統計データなし</h3>
          <p>シミュレーションを開始すると統計情報が表示されます</p>
        </div>
      </div>
    );
  }

  return (
    <div className={className} data-testid={testId} style={panelStyle}>
      {/* 基本統計 */}
      <div style={sectionStyle}>
        <h3 style={sectionTitleStyle}>
          <span>📈</span>
          基本統計
        </h3>

        <div style={gridStyle}>
          <StatCard icon="🔄" title="世代" value={latestStats.generation} variant="primary" />

          <StatCard
            icon="👥"
            title="人口"
            trend={trends.population}
            trendValue={
              trends.population !== 'stable'
                ? `${Math.abs((statistics[statistics.length - 1]?.population || 0) - (statistics[statistics.length - 6]?.population || 0))}`
                : undefined
            }
            value={latestStats.population}
            variant="info"
          />

          <StatCard
            icon="🤝"
            title="平均協力率"
            trend={trends.cooperation}
            trendValue={
              trends.cooperation !== 'stable'
                ? `${Math.abs(((latestStats.avg_cooperation || 0) - (statistics[statistics.length - 6]?.avg_cooperation || 0)) * 100).toFixed(1)}%`
                : undefined
            }
            value={`${(latestStats.avg_cooperation * 100).toFixed(1)}%`}
            variant="success"
          />

          <StatCard
            icon="🏆"
            title="平均スコア"
            trend={trends.score}
            trendValue={
              trends.score !== 'stable'
                ? `${Math.abs((latestStats.avg_score || 0) - (statistics[statistics.length - 6]?.avg_score || 0)).toFixed(2)}`
                : undefined
            }
            value={latestStats.avg_score.toFixed(2)}
            variant="warning"
          />
        </div>
      </div>

      {/* 詳細統計 */}
      <div style={sectionStyle}>
        <h3 style={sectionTitleStyle}>
          <span>🔍</span>
          詳細統計
        </h3>

        <div style={gridStyle}>
          <StatCard
            icon="⬆️"
            subtitle="人口中の最高協力率"
            title="最大協力率"
            value={`${(latestStats.max_cooperation * 100).toFixed(1)}%`}
            variant="success"
          />

          <StatCard
            icon="⬇️"
            subtitle="人口中の最低協力率"
            title="最小協力率"
            value={`${(latestStats.min_cooperation * 100).toFixed(1)}%`}
            variant="danger"
          />

          <StatCard
            icon="📊"
            subtitle="人口の多様性指標"
            title="協力率標準偏差"
            value={`${(latestStats.std_cooperation * 100).toFixed(1)}%`}
            variant="info"
          />

          <StatCard
            icon="🏃"
            subtitle="エージェントの活動性"
            title="平均移動率"
            trend={trends.movement}
            value={`${(latestStats.avg_movement * 100).toFixed(1)}%`}
            variant="secondary"
          />
        </div>
      </div>

      {/* パフォーマンス指標 */}
      {performanceMetrics && (
        <div style={sectionStyle}>
          <h3 style={sectionTitleStyle}>
            <span>⚡</span>
            パフォーマンス
          </h3>

          <div style={gridStyle}>
            <StatCard
              icon="🚀"
              subtitle="実行速度"
              title="世代/秒"
              value={performanceMetrics.generationsPerSecond.toFixed(2)}
              variant="primary"
            />

            <StatCard
              icon="👥"
              subtitle="平均人口サイズ"
              title="世代あたりエージェント数"
              value={performanceMetrics.agentsPerGeneration.toFixed(0)}
              variant="info"
            />

            <StatCard
              icon="🎯"
              subtitle="協力率の安定度"
              title="協力安定性"
              value={`${(performanceMetrics.cooperationStability * 100).toFixed(1)}%`}
              variant="success"
            />

            <StatCard
              icon="⏱️"
              subtitle="累計実行時間"
              title="実行時間"
              value={
                currentSimulation ? `${(currentSimulation.getRuntime() / 1000).toFixed(1)}s` : '0s'
              }
              variant="secondary"
            />
          </div>
        </div>
      )}

      {/* 収束指標 */}
      <div style={sectionStyle}>
        <h3 style={sectionTitleStyle}>
          <span>🎯</span>
          収束状況
        </h3>

        <div
          style={{
            display: 'grid',
            gap: '1rem',
            gridTemplateColumns: '1fr 1fr',
          }}
        >
          <StatCard
            icon={currentSimulation?.isConverged() ? '🔒' : '🔄'}
            title="収束状態"
            value={currentSimulation?.isConverged() ? '収束済み' : '進化中'}
            variant={currentSimulation?.isConverged() ? 'warning' : 'success'}
          />

          <StatCard
            icon={
              currentSimulation?.calculatePopulationTrend() === 'increasing'
                ? '📈'
                : currentSimulation?.calculatePopulationTrend() === 'decreasing'
                  ? '📉'
                  : '➡️'
            }
            title="人口トレンド"
            value={currentSimulation?.calculatePopulationTrend() || 'stable'}
            variant={
              currentSimulation?.calculatePopulationTrend() === 'increasing'
                ? 'success'
                : currentSimulation?.calculatePopulationTrend() === 'decreasing'
                  ? 'danger'
                  : 'info'
            }
          />
        </div>
      </div>

      {/* 統計履歴サマリー */}
      {statistics.length > 0 && (
        <div
          style={{
            backgroundColor: theme.mode === 'dark' ? '#222' : '#f8f9fa',
            borderRadius: '4px',
            color: theme.mode === 'dark' ? '#b0b0b0' : '#6c757d',
            fontSize: '0.875rem',
            marginTop: '1.5rem',
            padding: '1rem',
          }}
        >
          <div
            style={{
              display: 'grid',
              gap: '1rem',
              gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
            }}
          >
            <div>
              <strong>総世代数:</strong> {statistics.length}
            </div>
            <div>
              <strong>最大人口:</strong> {Math.max(...statistics.map((s) => s.population))}
            </div>
            <div>
              <strong>最高スコア:</strong>{' '}
              {Math.max(...statistics.map((s) => s.avg_score)).toFixed(2)}
            </div>
            <div>
              <strong>協力トレンド:</strong>{' '}
              {(currentSimulation?.calculateCooperationTrend() || 0).toFixed(3)}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
