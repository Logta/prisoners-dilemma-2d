import { createMemo, createSignal, onMount } from 'solid-js';
import type { AgentData, GridSize } from '../types';

interface GridVisualizationProps {
  agents: AgentData[];
  gridSize: GridSize;
}

export default function GridVisualization(props: GridVisualizationProps) {
  let canvasRef: HTMLCanvasElement | undefined;
  const [zoomLevel, setZoomLevel] = createSignal(1);
  const [offset, setOffset] = createSignal({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = createSignal(false);
  const [lastMousePos, setLastMousePos] = createSignal({ x: 0, y: 0 });

  // キャンバスサイズの計算
  const canvasSize = createMemo(() => {
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
    
    return { width, height };
  });

  // セル描画
  const drawGrid = () => {
    const canvas = canvasRef;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { width, height } = canvasSize();
    canvas.width = width;
    canvas.height = height;

    // 背景をクリア
    ctx.fillStyle = '#2d2d2d';
    ctx.fillRect(0, 0, width, height);

    const zoom = zoomLevel();
    const offsetPos = offset();
    const cellWidth = (width / props.gridSize.width) * zoom;
    const cellHeight = (height / props.gridSize.height) * zoom;

    // グリッド線を描画（ズームレベルが高い場合のみ）
    if (cellWidth > 2 && cellHeight > 2) {
      ctx.strokeStyle = '#444';
      ctx.lineWidth = 0.5;
      ctx.beginPath();
      
      for (let x = 0; x <= props.gridSize.width; x++) {
        const xPos = (x * cellWidth) + offsetPos.x;
        if (xPos >= -cellWidth && xPos <= width + cellWidth) {
          ctx.moveTo(xPos, offsetPos.y);
          ctx.lineTo(xPos, offsetPos.y + (props.gridSize.height * cellHeight));
        }
      }
      
      for (let y = 0; y <= props.gridSize.height; y++) {
        const yPos = (y * cellHeight) + offsetPos.y;
        if (yPos >= -cellHeight && yPos <= height + cellHeight) {
          ctx.moveTo(offsetPos.x, yPos);
          ctx.lineTo(offsetPos.x + (props.gridSize.width * cellWidth), yPos);
        }
      }
      
      ctx.stroke();
    }

    // エージェントを描画
    for (const agent of props.agents) {
      const x = (agent.x * cellWidth) + offsetPos.x;
      const y = (agent.y * cellHeight) + offsetPos.y;
      
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
      const maxScore = Math.max(...props.agents.map(a => a.score), 1);
      const minScore = Math.min(...props.agents.map(a => a.score), 0);
      const normalizedScore = maxScore > minScore 
        ? (agent.score - minScore) / (maxScore - minScore)
        : 0.5;
      const size = Math.max(2, Math.min(cellWidth * 0.8, cellHeight * 0.8) * (0.3 + normalizedScore * 0.7));
      
      // 円を描画
      ctx.beginPath();
      ctx.arc(
        x + cellWidth / 2,
        y + cellHeight / 2,
        size / 2,
        0,
        2 * Math.PI
      );
      ctx.fill();
      
      // スコアが高い場合は縁取り
      if (normalizedScore > 0.8) {
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 1;
        ctx.stroke();
      }
    }
  };

  // マウスイベントハンドラ
  const handleMouseDown = (e: MouseEvent) => {
    setIsDragging(true);
    setLastMousePos({ x: e.clientX, y: e.clientY });
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging()) return;
    
    const last = lastMousePos();
    const deltaX = e.clientX - last.x;
    const deltaY = e.clientY - last.y;
    
    setOffset(prev => ({
      x: prev.x + deltaX,
      y: prev.y + deltaY
    }));
    
    setLastMousePos({ x: e.clientX, y: e.clientY });
    drawGrid();
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleWheel = (e: WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    const newZoom = Math.max(0.1, Math.min(10, zoomLevel() * delta));
    setZoomLevel(newZoom);
    drawGrid();
  };

  // リセットビュー
  const resetView = () => {
    setZoomLevel(1);
    setOffset({ x: 0, y: 0 });
    drawGrid();
  };

  // 描画効果
  onMount(() => {
    if (canvasRef) {
      canvasRef.addEventListener('mousedown', handleMouseDown);
      canvasRef.addEventListener('mousemove', handleMouseMove);
      canvasRef.addEventListener('mouseup', handleMouseUp);
      canvasRef.addEventListener('wheel', handleWheel);
      drawGrid();
    }
  });

  // プロパティ変更時の再描画
  createMemo(() => {
    props.agents;
    props.gridSize;
    // 少し遅延させて描画
    setTimeout(drawGrid, 0);
  });

  return (
    <div class="grid-visualization">
      <div class="grid-controls">
        <button class="button" onClick={resetView}>
          ビューをリセット
        </button>
        <span class="zoom-info">
          ズーム: {Math.round(zoomLevel() * 100)}%
        </span>
      </div>
      <div class="canvas-container">
        <canvas
          ref={canvasRef}
          class="grid-canvas"
          style={`width: ${canvasSize().width}px; height: ${canvasSize().height}px;`}
        />
        <div class="legend">
          <div class="legend-item">
            <div class="legend-color" style="background: rgb(0, 0, 255);" />
            <span>協力的</span>
          </div>
          <div class="legend-item">
            <div class="legend-color" style="background: rgb(255, 0, 0);" />
            <span>非協力的</span>
          </div>
          <div class="legend-item">
            <span>サイズ: スコア</span>
          </div>
        </div>
      </div>
    </div>
  );
}