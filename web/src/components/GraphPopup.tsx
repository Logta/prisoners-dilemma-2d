import { useEffect, useRef, useState } from 'react';
import type { Statistics } from '../types';

interface GraphPopupProps {
  isOpen: boolean;
  onClose: () => void;
  historyData: Statistics[];
}

export default function GraphPopup(props: GraphPopupProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [selectedMetric, setSelectedMetric] = useState<keyof Statistics>('avg_cooperation');

  const drawGraph = () => {
    const canvas = canvasRef.current;
    if (!canvas || !props.isOpen || props.historyData.length === 0) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = 600;
    const height = 400;
    const padding = 60;

    canvas.width = width;
    canvas.height = height;

    // 背景をクリア
    ctx.fillStyle = '#2d2d2d';
    ctx.fillRect(0, 0, width, height);

    const data = props.historyData;
    const metric = selectedMetric;

    // データ範囲を計算
    const values = data.map((d) => d[metric] as number);
    const minValue = Math.min(...values);
    const maxValue = Math.max(...values);
    const valueRange = maxValue - minValue || 1;

    const generations = data.map((d) => d.generation);
    const minGen = Math.min(...generations);
    const maxGen = Math.max(...generations);
    const genRange = maxGen - minGen || 1;

    // 軸を描画
    ctx.strokeStyle = '#666';
    ctx.lineWidth = 1;
    ctx.beginPath();
    // Y軸
    ctx.moveTo(padding, padding);
    ctx.lineTo(padding, height - padding);
    // X軸
    ctx.moveTo(padding, height - padding);
    ctx.lineTo(width - padding, height - padding);
    ctx.stroke();

    // グリッド線
    ctx.strokeStyle = '#444';
    ctx.lineWidth = 0.5;
    ctx.beginPath();

    // 縦のグリッド線
    for (let i = 1; i <= 10; i++) {
      const x = padding + ((width - padding * 2) * i) / 10;
      ctx.moveTo(x, padding);
      ctx.lineTo(x, height - padding);
    }

    // 横のグリッド線
    for (let i = 1; i <= 8; i++) {
      const y = padding + ((height - padding * 2) * i) / 8;
      ctx.moveTo(padding, y);
      ctx.lineTo(width - padding, y);
    }
    ctx.stroke();

    // 軸ラベル
    ctx.fillStyle = '#cccccc';
    ctx.font = '12px Arial';
    ctx.textAlign = 'center';

    // X軸ラベル
    for (let i = 0; i <= 10; i++) {
      const x = padding + ((width - padding * 2) * i) / 10;
      const gen = minGen + (genRange * i) / 10;
      ctx.fillText(Math.round(gen).toString(), x, height - padding + 20);
    }

    // Y軸ラベル
    ctx.textAlign = 'right';
    for (let i = 0; i <= 8; i++) {
      const y = height - padding - ((height - padding * 2) * i) / 8;
      const value = minValue + (valueRange * i) / 8;
      ctx.fillText(value.toFixed(2), padding - 10, y + 4);
    }

    // データをプロット
    if (data.length > 1) {
      ctx.strokeStyle = getMetricColor(metric);
      ctx.fillStyle = getMetricColor(metric);
      ctx.lineWidth = 2;
      ctx.beginPath();

      for (let i = 0; i < data.length; i++) {
        const x = padding + ((data[i].generation - minGen) / genRange) * (width - padding * 2);
        const y = height - padding - ((values[i] - minValue) / valueRange) * (height - padding * 2);

        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }

        // データポイントを描画
        ctx.save();
        ctx.beginPath();
        ctx.arc(x, y, 3, 0, 2 * Math.PI);
        ctx.fill();
        ctx.restore();
      }
      ctx.stroke();
    }

    // タイトルとメトリック名
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 16px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(getMetricLabel(metric), width / 2, 30);

    ctx.fillStyle = '#cccccc';
    ctx.font = '12px Arial';
    ctx.fillText('世代', width / 2, height - 10);

    ctx.save();
    ctx.translate(20, height / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.textAlign = 'center';
    ctx.fillText(getMetricLabel(metric), 0, 0);
    ctx.restore();
  };

  const getMetricColor = (metric: keyof Statistics): string => {
    switch (metric) {
      case 'avg_cooperation':
        return '#4CAF50';
      case 'avg_movement':
        return '#2196F3';
      case 'avg_score':
        return '#FF9800';
      case 'population':
        return '#9C27B0';
      default:
        return '#607D8B';
    }
  };

  const getMetricLabel = (metric: keyof Statistics): string => {
    switch (metric) {
      case 'avg_cooperation':
        return '平均協力率';
      case 'avg_movement':
        return '平均移動率';
      case 'avg_score':
        return '平均スコア';
      case 'population':
        return '個体数';
      case 'generation':
        return '世代';
      default:
        return metric;
    }
  };

  // ESCキーでクローズ
  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      props.onClose();
    }
  };

  useEffect(() => {
    if (props.isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      drawGraph();
    } else {
      document.removeEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [props.isOpen, drawGraph, handleKeyDown]);

  useEffect(() => {
    drawGraph();
  }, [drawGraph]);

  if (!props.isOpen) return null;

  return (
    <div className="graph-popup-overlay" onClick={props.onClose}>
      <div className="graph-popup" onClick={(e) => e.stopPropagation()}>
        <div className="graph-header">
          <h2>統計グラフ</h2>
          <button className="close-button" onClick={props.onClose}>
            ×
          </button>
        </div>

        <div className="graph-controls">
          <label>表示メトリック:</label>
          <select
            onChange={(e) => setSelectedMetric(e.target.value as keyof Statistics)}
            value={selectedMetric}
          >
            <option value="avg_cooperation">平均協力率</option>
            <option value="avg_movement">平均移動率</option>
            <option value="avg_score">平均スコア</option>
            <option value="population">個体数</option>
          </select>
        </div>

        <div className="graph-container">
          <canvas className="graph-canvas" ref={canvasRef} />
        </div>

        <div className="graph-info">
          <p>データポイント数: {props.historyData.length}</p>
          <p>ESCキーまたは外側をクリックで閉じる</p>
        </div>
      </div>
    </div>
  );
}
