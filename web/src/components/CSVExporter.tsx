import { createSignal } from 'solid-js';
import type { AgentData, Statistics } from '../types';

interface CSVExporterProps {
  agents: AgentData[];
  historyData: Statistics[];
  statistics: Statistics;
}

export default function CSVExporter(props: CSVExporterProps) {
  const [exportType, setExportType] = createSignal<'agents' | 'history' | 'summary'>('agents');

  // エージェントデータをCSV形式に変換
  const exportAgentsCSV = () => {
    if (props.agents.length === 0) {
      alert('エクスポートするエージェントデータがありません。');
      return;
    }

    const headers = ['ID', 'X座標', 'Y座標', '協力率', '移動率', 'スコア'];
    const rows = props.agents.map((agent, index) => [
      index + 1,
      agent.x,
      agent.y,
      agent.cooperation_rate.toFixed(4),
      agent.movement_rate.toFixed(4),
      agent.score.toFixed(4),
    ]);

    const csvContent = [headers, ...rows]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');

    downloadCSV(csvContent, `agents_generation_${props.statistics.generation}.csv`);
  };

  // 履歴データをCSV形式に変換
  const exportHistoryCSV = () => {
    if (props.historyData.length === 0) {
      alert('エクスポートする履歴データがありません。');
      return;
    }

    const headers = ['世代', '個体数', '平均協力率', '平均移動率', '平均スコア'];
    const rows = props.historyData.map(stat => [
      stat.generation,
      stat.population,
      stat.avg_cooperation.toFixed(4),
      stat.avg_movement.toFixed(4),
      stat.avg_score.toFixed(4),
    ]);

    const csvContent = [headers, ...rows]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');

    downloadCSV(csvContent, 'simulation_history.csv');
  };

  // サマリー統計をCSV形式に変換
  const exportSummaryCSV = () => {
    if (props.agents.length === 0) {
      alert('エクスポートするデータがありません。');
      return;
    }

    // 基本統計
    const basicStats = [
      ['統計項目', '値'],
      ['現在の世代', props.statistics.generation],
      ['個体数', props.statistics.population],
      ['平均協力率', props.statistics.avg_cooperation.toFixed(4)],
      ['平均移動率', props.statistics.avg_movement.toFixed(4)],
      ['平均スコア', props.statistics.avg_score.toFixed(4)],
    ];

    // 詳細統計の計算
    const coopRates = props.agents.map(a => a.cooperation_rate);
    const moveRates = props.agents.map(a => a.movement_rate);
    const scores = props.agents.map(a => a.score);

    const cooperationStdDev = Math.sqrt(
      coopRates.reduce((sum, rate) => sum + Math.pow(rate - props.statistics.avg_cooperation, 2), 0) / props.agents.length
    );
    const movementStdDev = Math.sqrt(
      moveRates.reduce((sum, rate) => sum + Math.pow(rate - props.statistics.avg_movement, 2), 0) / props.agents.length
    );
    const scoreStdDev = Math.sqrt(
      scores.reduce((sum, score) => sum + Math.pow(score - props.statistics.avg_score, 2), 0) / props.agents.length
    );

    const detailedStats = [
      ['', ''],
      ['詳細統計', ''],
      ['協力率標準偏差', cooperationStdDev.toFixed(4)],
      ['移動率標準偏差', movementStdDev.toFixed(4)],
      ['スコア標準偏差', scoreStdDev.toFixed(4)],
      ['最高スコア', Math.max(...scores).toFixed(4)],
      ['最低スコア', Math.min(...scores).toFixed(4)],
      ['スコア範囲', (Math.max(...scores) - Math.min(...scores)).toFixed(4)],
    ];

    // 分布データ
    const buckets = 10;
    const coopBuckets = new Array(buckets).fill(0);
    const moveBuckets = new Array(buckets).fill(0);

    for (const agent of props.agents) {
      const coopBucket = Math.min(Math.floor(agent.cooperation_rate * buckets), buckets - 1);
      const moveBucket = Math.min(Math.floor(agent.movement_rate * buckets), buckets - 1);
      coopBuckets[coopBucket]++;
      moveBuckets[moveBucket]++;
    }

    const distributionStats = [
      ['', ''],
      ['協力率分布', ''],
      ['範囲', '個体数', '割合(%)'],
      ...coopBuckets.map((count, i) => [
        `${(i / buckets * 100).toFixed(0)}-${((i + 1) / buckets * 100).toFixed(0)}%`,
        count,
        (count / props.agents.length * 100).toFixed(1),
      ]),
      ['', ''],
      ['移動率分布', ''],
      ['範囲', '個体数', '割合(%)'],
      ...moveBuckets.map((count, i) => [
        `${(i / buckets * 100).toFixed(0)}-${((i + 1) / buckets * 100).toFixed(0)}%`,
        count,
        (count / props.agents.length * 100).toFixed(1),
      ]),
    ];

    const csvContent = [...basicStats, ...detailedStats, ...distributionStats]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');

    downloadCSV(csvContent, `summary_generation_${props.statistics.generation}.csv`);
  };

  // CSVファイルをダウンロード
  const downloadCSV = (content: string, filename: string) => {
    const BOM = '\uFEFF'; // UTF-8 BOM for Excel compatibility
    const blob = new Blob([BOM + content], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // エクスポート実行
  const executeExport = () => {
    switch (exportType()) {
      case 'agents':
        exportAgentsCSV();
        break;
      case 'history':
        exportHistoryCSV();
        break;
      case 'summary':
        exportSummaryCSV();
        break;
    }
  };

  // 全データを一括エクスポート
  const exportAll = () => {
    exportAgentsCSV();
    exportHistoryCSV();
    exportSummaryCSV();
  };

  return (
    <div class="csv-exporter">
      <h3>データエクスポート</h3>
      
      <div class="export-options">
        <div class="export-type-selector">
          <label>
            <input
              type="radio"
              name="exportType"
              value="agents"
              checked={exportType() === 'agents'}
              onChange={() => setExportType('agents')}
            />
            現在のエージェントデータ
          </label>
          <label>
            <input
              type="radio"
              name="exportType"
              value="history"
              checked={exportType() === 'history'}
              onChange={() => setExportType('history')}
            />
            世代推移データ
          </label>
          <label>
            <input
              type="radio"
              name="exportType"
              value="summary"
              checked={exportType() === 'summary'}
              onChange={() => setExportType('summary')}
            />
            統計サマリー
          </label>
        </div>

        <div class="export-description">
          {exportType() === 'agents' && (
            <p>現在の世代のすべてのエージェントの詳細データ（位置、特性、スコア）をエクスポートします。</p>
          )}
          {exportType() === 'history' && (
            <p>シミュレーション開始からの世代ごとの統計データをエクスポートします。</p>
          )}
          {exportType() === 'summary' && (
            <p>現在の状態の統計サマリーと分布データをエクスポートします。</p>
          )}
        </div>
      </div>

      <div class="export-buttons">
        <button class="button" onClick={executeExport}>
          選択したデータをエクスポート
        </button>
        <button class="button" onClick={exportAll}>
          すべてのデータをエクスポート
        </button>
      </div>

      <div class="export-info">
        <h4>エクスポート情報</h4>
        <ul>
          <li>ファイル形式: CSV (UTF-8 BOM付き)</li>
          <li>Excel等の表計算ソフトで開くことができます</li>
          <li>文字エンコーディング: UTF-8</li>
          <li>区切り文字: カンマ</li>
        </ul>
      </div>
    </div>
  );
}