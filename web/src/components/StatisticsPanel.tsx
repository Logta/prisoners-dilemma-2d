import { createMemo } from 'solid-js';
import type { AgentData, Statistics } from '../types';

interface StatisticsPanelProps {
  agents: AgentData[];
  onShowGraph: () => void;
  statistics: Statistics;
}

export default function StatisticsPanel(props: StatisticsPanelProps) {
  // 詳細統計の計算
  const detailedStats = createMemo(() => {
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

    const coopRates = agents.map(a => a.cooperation_rate);
    const moveRates = agents.map(a => a.movement_rate);
    const scores = agents.map(a => a.score);

    const avgCoop = props.statistics.avg_cooperation;
    const avgMove = props.statistics.avg_movement;
    const avgScore = props.statistics.avg_score;

    const cooperationStdDev = Math.sqrt(
      coopRates.reduce((sum, rate) => sum + Math.pow(rate - avgCoop, 2), 0) / agents.length
    );

    const movementStdDev = Math.sqrt(
      moveRates.reduce((sum, rate) => sum + Math.pow(rate - avgMove, 2), 0) / agents.length
    );

    const scoreStdDev = Math.sqrt(
      scores.reduce((sum, score) => sum + Math.pow(score - avgScore, 2), 0) / agents.length
    );

    return {
      cooperationStdDev,
      maxScore: Math.max(...scores),
      minScore: Math.min(...scores),
      movementStdDev,
      scoreStdDev,
    };
  });

  // 分布データの計算
  const distributionData = createMemo(() => {
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
        range: `${(i / buckets * 100).toFixed(0)}-${((i + 1) / buckets * 100).toFixed(0)}%`,
        count,
        percentage: (count / agents.length * 100).toFixed(1),
      })),
      movement: moveBuckets.map((count, i) => ({
        range: `${(i / buckets * 100).toFixed(0)}-${((i + 1) / buckets * 100).toFixed(0)}%`,
        count,
        percentage: (count / agents.length * 100).toFixed(1),
      })),
    };
  });

  return (
    <div class="statistics-panel">
      <div class="stats-header">
        <h2>統計情報</h2>
        <button class="button graph-button" onClick={props.onShowGraph}>
          グラフ表示
        </button>
      </div>
      
      <div class="stats-section">
        <h3>基本統計</h3>
        <div class="stats-grid">
          <div class="stat-item">
            <span class="stat-value">{props.statistics.generation}</span>
            <span class="stat-label">世代</span>
          </div>
          <div class="stat-item">
            <span class="stat-value">{props.statistics.population}</span>
            <span class="stat-label">個体数</span>
          </div>
          <div class="stat-item">
            <span class="stat-value">{(props.statistics.avg_cooperation * 100).toFixed(1)}%</span>
            <span class="stat-label">平均協力率</span>
          </div>
          <div class="stat-item">
            <span class="stat-value">{(props.statistics.avg_movement * 100).toFixed(1)}%</span>
            <span class="stat-label">平均移動率</span>
          </div>
          <div class="stat-item">
            <span class="stat-value">{props.statistics.avg_score.toFixed(2)}</span>
            <span class="stat-label">平均スコア</span>
          </div>
          <div class="stat-item">
            <span class="stat-value">{detailedStats().scoreStdDev.toFixed(2)}</span>
            <span class="stat-label">スコア標準偏差</span>
          </div>
        </div>
      </div>

      <div class="stats-section">
        <h3>スコア範囲</h3>
        <div class="score-range">
          <div class="range-item">
            <span class="range-label">最高:</span>
            <span class="range-value">{detailedStats().maxScore.toFixed(2)}</span>
          </div>
          <div class="range-item">
            <span class="range-label">最低:</span>
            <span class="range-value">{detailedStats().minScore.toFixed(2)}</span>
          </div>
          <div class="range-item">
            <span class="range-label">範囲:</span>
            <span class="range-value">{(detailedStats().maxScore - detailedStats().minScore).toFixed(2)}</span>
          </div>
        </div>
      </div>

      <div class="stats-section">
        <h3>協力率分布</h3>
        <div class="distribution">
          {distributionData().cooperation.map((bucket, i) => (
            <div class="distribution-bar">
              <span class="bar-label">{bucket.range}</span>
              <div class="bar-container">
                <div 
                  class="bar-fill"
                  style={`width: ${bucket.percentage}%; background-color: hsl(${240 + i * 12}, 70%, 50%);`}
                />
              </div>
              <span class="bar-value">{bucket.count}</span>
            </div>
          ))}
        </div>
      </div>

      <div class="stats-section">
        <h3>移動率分布</h3>
        <div class="distribution">
          {distributionData().movement.map((bucket, i) => (
            <div class="distribution-bar">
              <span class="bar-label">{bucket.range}</span>
              <div class="bar-container">
                <div 
                  class="bar-fill"
                  style={`width: ${bucket.percentage}%; background-color: hsl(${120 + i * 12}, 70%, 50%);`}
                />
              </div>
              <span class="bar-value">{bucket.count}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}