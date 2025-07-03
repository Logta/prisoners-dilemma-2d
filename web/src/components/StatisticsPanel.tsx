import { useMemo } from 'react';
import type { AgentData, Statistics } from '../types';

interface StatisticsPanelProps {
  agents: AgentData[];
  onShowGraph: () => void;
  statistics: Statistics;
}

export default function StatisticsPanel(props: StatisticsPanelProps) {
  // 詳細統計の計算
  const detailedStats = useMemo(() => {
    const agents = props.agents;
    if (agents.length === 0) {
      return {
        cooperationStdDev: 0,
        maxScore: 0,
        minScore: 0,
        movementStdDev: 0,
        scoreStdDev: 0,
      };
    }

    const coopRates = agents.map((a) => a.cooperation_rate);
    const moveRates = agents.map((a) => a.movement_rate);
    const scores = agents.map((a) => a.score);

    const avgCoop = props.statistics.avg_cooperation;
    const avgMove = props.statistics.avg_movement;
    const avgScore = props.statistics.avg_score;

    const cooperationStdDev = Math.sqrt(
      coopRates.reduce((sum, rate) => sum + (rate - avgCoop) ** 2, 0) / agents.length
    );

    const movementStdDev = Math.sqrt(
      moveRates.reduce((sum, rate) => sum + (rate - avgMove) ** 2, 0) / agents.length
    );

    const scoreStdDev = Math.sqrt(
      scores.reduce((sum, score) => sum + (score - avgScore) ** 2, 0) / agents.length
    );

    return {
      cooperationStdDev,
      maxScore: Math.max(...scores),
      minScore: Math.min(...scores),
      movementStdDev,
      scoreStdDev,
    };
  }, [props.agents, props.statistics]);

  // 分布データの計算
  const distributionData = useMemo(() => {
    const agents = props.agents;
    if (agents.length === 0) return { cooperation: [], movement: [] };

    const buckets = 10;
    const coopBuckets = new Array(buckets).fill(0);
    const moveBuckets = new Array(buckets).fill(0);

    for (const agent of agents) {
      const coopBucket = Math.min(Math.floor(agent.cooperation_rate * buckets), buckets - 1);
      const moveBucket = Math.min(Math.floor(agent.movement_rate * buckets), buckets - 1);
      coopBuckets[coopBucket]++;
      moveBuckets[moveBucket]++;
    }

    return {
      cooperation: coopBuckets.map((count, i) => ({
        count,
        percentage: ((count / agents.length) * 100).toFixed(1),
        range: `${((i / buckets) * 100).toFixed(0)}-${(((i + 1) / buckets) * 100).toFixed(0)}%`,
      })),
      movement: moveBuckets.map((count, i) => ({
        count,
        percentage: ((count / agents.length) * 100).toFixed(1),
        range: `${((i / buckets) * 100).toFixed(0)}-${(((i + 1) / buckets) * 100).toFixed(0)}%`,
      })),
    };
  }, [props.agents]);

  return (
    <div className="statistics-panel">
      <div className="stats-header">
        <h2>統計情報</h2>
        <button className="button graph-button" onClick={props.onShowGraph}>
          グラフ表示
        </button>
      </div>

      <div className="stats-section">
        <h3>基本統計</h3>
        <div className="stats-grid">
          <div className="stat-item">
            <span className="stat-value">{props.statistics.generation}</span>
            <span className="stat-label">世代</span>
          </div>
          <div className="stat-item">
            <span className="stat-value">{props.statistics.population}</span>
            <span className="stat-label">個体数</span>
          </div>
          <div className="stat-item">
            <span className="stat-value">
              {(props.statistics.avg_cooperation * 100).toFixed(1)}%
            </span>
            <span className="stat-label">平均協力率</span>
          </div>
          <div className="stat-item">
            <span className="stat-value">{(props.statistics.avg_movement * 100).toFixed(1)}%</span>
            <span className="stat-label">平均移動率</span>
          </div>
          <div className="stat-item">
            <span className="stat-value">{props.statistics.avg_score.toFixed(2)}</span>
            <span className="stat-label">平均スコア</span>
          </div>
          <div className="stat-item">
            <span className="stat-value">{detailedStats.scoreStdDev.toFixed(2)}</span>
            <span className="stat-label">スコア標準偏差</span>
          </div>
        </div>
      </div>

      <div className="stats-section">
        <h3>スコア範囲</h3>
        <div className="score-range">
          <div className="range-item">
            <span className="range-label">最高:</span>
            <span className="range-value">{detailedStats.maxScore.toFixed(2)}</span>
          </div>
          <div className="range-item">
            <span className="range-label">最低:</span>
            <span className="range-value">{detailedStats.minScore.toFixed(2)}</span>
          </div>
          <div className="range-item">
            <span className="range-label">範囲:</span>
            <span className="range-value">
              {(detailedStats.maxScore - detailedStats.minScore).toFixed(2)}
            </span>
          </div>
        </div>
      </div>

      <div className="stats-section">
        <h3>協力率分布</h3>
        <div className="distribution">
          {distributionData.cooperation.map((bucket, i) => (
            <div className="distribution-bar" key={i}>
              <span className="bar-label">{bucket.range}</span>
              <div className="bar-container">
                <div
                  className="bar-fill"
                  style={{
                    backgroundColor: `hsl(${240 + i * 12}, 70%, 50%)`,
                    width: `${bucket.percentage}%`,
                  }}
                />
              </div>
              <span className="bar-value">{bucket.count}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="stats-section">
        <h3>移動率分布</h3>
        <div className="distribution">
          {distributionData.movement.map((bucket, i) => (
            <div className="distribution-bar" key={i}>
              <span className="bar-label">{bucket.range}</span>
              <div className="bar-container">
                <div
                  className="bar-fill"
                  style={{
                    backgroundColor: `hsl(${120 + i * 12}, 70%, 50%)`,
                    width: `${bucket.percentage}%`,
                  }}
                />
              </div>
              <span className="bar-value">{bucket.count}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
