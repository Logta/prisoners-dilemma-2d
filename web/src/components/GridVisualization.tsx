import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { AgentData, GridSize } from '../types';

interface GridVisualizationProps {
  agents: AgentData[];
  gridSize: GridSize;
}

export default function GridVisualization(props: GridVisualizationProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [lastMousePos, setLastMousePos] = useState({ x: 0, y: 0 });

  // スコアの最大値・最小値を事前計算
  const scoreRange = useMemo(() => {
    if (props.agents.length === 0) return { min: 0, max: 1 };
    let min = Infinity;
    let max = -Infinity;
    for (const agent of props.agents) {
      if (agent.score < min) min = agent.score;
      if (agent.score > max) max = agent.score;
    }
    return { min: min === Infinity ? 0 : min, max: max === -Infinity ? 1 : max };
  }, [props.agents]);

  // キャンバスサイズの計算
  const canvasSize = useMemo(() => {
    const containerWidth = 800;
    const containerHeight = 600;
    const aspectRatio = props.gridSize.width / props.gridSize.height;

    let width = containerWidth;
    let height = containerHeight;

    if (aspectRatio > containerWidth / containerHeight) {
      height = containerWidth / aspectRatio;
    } else {
      width = containerHeight * aspectRatio;
    }

    return { height, width };
  }, [props.gridSize]);

  // セル描画
  const drawGrid = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { width, height } = canvasSize;
    canvas.width = width;
    canvas.height = height;

    // 背景をクリア
    ctx.fillStyle = '#2d2d2d';
    ctx.fillRect(0, 0, width, height);

    const zoom = zoomLevel;
    const offsetPos = offset;
    const cellWidth = (width / props.gridSize.width) * zoom;
    const cellHeight = (height / props.gridSize.height) * zoom;

    // グリッド線を描画（ズームレベルが高い場合のみ）
    if (cellWidth > 2 && cellHeight > 2) {
      ctx.strokeStyle = '#444';
      ctx.lineWidth = 0.5;
      ctx.beginPath();

      for (let x = 0; x <= props.gridSize.width; x++) {
        const xPos = x * cellWidth + offsetPos.x;
        if (xPos >= -cellWidth && xPos <= width + cellWidth) {
          ctx.moveTo(xPos, offsetPos.y);
          ctx.lineTo(xPos, offsetPos.y + props.gridSize.height * cellHeight);
        }
      }

      for (let y = 0; y <= props.gridSize.height; y++) {
        const yPos = y * cellHeight + offsetPos.y;
        if (yPos >= -cellHeight && yPos <= height + cellHeight) {
          ctx.moveTo(offsetPos.x, yPos);
          ctx.lineTo(offsetPos.x + props.gridSize.width * cellWidth, yPos);
        }
      }

      ctx.stroke();
    }

    // エージェントを描画
    for (const agent of props.agents) {
      const x = agent.x * cellWidth + offsetPos.x;
      const y = agent.y * cellHeight + offsetPos.y;

      // 画面外のエージェントはスキップ
      if (x < -cellWidth || x > width + cellWidth || y < -cellHeight || y > height + cellHeight) {
        continue;
      }

      // 協力確率に基づく色（青：協力的、赤：非協力的）
      const coopRate = agent.cooperation_rate;
      const red = Math.floor((1 - coopRate) * 255);
      const blue = Math.floor(coopRate * 255);
      const green = Math.floor(Math.min(red, blue) * 0.5);

      ctx.fillStyle = `rgb(${red}, ${green}, ${blue})`;

      // スコアに基づくサイズ（正規化）
      const normalizedScore =
        scoreRange.max > scoreRange.min 
          ? (agent.score - scoreRange.min) / (scoreRange.max - scoreRange.min) 
          : 0.5;
      const size = Math.max(
        2,
        Math.min(cellWidth * 0.8, cellHeight * 0.8) * (0.3 + normalizedScore * 0.7)
      );

      // 円を描画
      ctx.beginPath();
      ctx.arc(x + cellWidth / 2, y + cellHeight / 2, size / 2, 0, 2 * Math.PI);
      ctx.fill();

      // スコアが高い場合は縁取り
      if (normalizedScore > 0.8) {
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 1;
        ctx.stroke();
      }
    }
  }, [canvasSize, props.agents, props.gridSize, zoomLevel, offset, scoreRange]);

  // マウスイベントハンドラ
  const handleMouseDown = useCallback((e: MouseEvent) => {
    setIsDragging(true);
    setLastMousePos({ x: e.clientX, y: e.clientY });
  }, []);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging) return;

    const deltaX = e.clientX - lastMousePos.x;
    const deltaY = e.clientY - lastMousePos.y;

    setOffset((prev) => ({
      x: prev.x + deltaX,
      y: prev.y + deltaY,
    }));

    setLastMousePos({ x: e.clientX, y: e.clientY });
  }, [isDragging, lastMousePos]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleWheel = useCallback((e: WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    const newZoom = Math.max(0.1, Math.min(10, zoomLevel * delta));
    setZoomLevel(newZoom);
  }, [zoomLevel]);

  // リセットビュー
  const resetView = useCallback(() => {
    setZoomLevel(1);
    setOffset({ x: 0, y: 0 });
  }, []);

  // イベントリスナーの設定
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.addEventListener('mousedown', handleMouseDown);
    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mouseup', handleMouseUp);
    canvas.addEventListener('wheel', handleWheel);

    return () => {
      canvas.removeEventListener('mousedown', handleMouseDown);
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('mouseup', handleMouseUp);
      canvas.removeEventListener('wheel', handleWheel);
    };
  }, [handleMouseDown, handleMouseMove, handleMouseUp, handleWheel]);

  // 描画処理
  useEffect(() => {
    drawGrid();
  }, [drawGrid]);

  return (
    <div className="grid-visualization">
      <div className="grid-controls">
        <button type="button" className="button" onClick={resetView}>
          ビューをリセット
        </button>
        <span className="zoom-info">ズーム: {Math.round(zoomLevel * 100)}%</span>
      </div>
      <div className="canvas-container">
        <canvas
          className="grid-canvas"
          ref={canvasRef}
          style={{ height: `${canvasSize.height}px`, width: `${canvasSize.width}px` }}
        />
        <div className="legend">
          <div className="legend-item">
            <div className="legend-color" style={{ background: 'rgb(0, 0, 255)' }} />
            <span>協力的</span>
          </div>
          <div className="legend-item">
            <div className="legend-color" style={{ background: 'rgb(255, 0, 0)' }} />
            <span>非協力的</span>
          </div>
          <div className="legend-item">
            <span>サイズ: スコア</span>
          </div>
        </div>
      </div>
    </div>
  );
}
