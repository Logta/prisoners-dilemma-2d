import { useEffect, useRef } from 'react';
import { SimulationCanvas } from '../lib/canvas';
import type { WasmAgent } from '../types/wasm';

interface SimulationGridProps {
  agents: WasmAgent[];
  gridWidth: number;
  gridHeight: number;
  className?: string;
}

export const SimulationGrid: React.FC<SimulationGridProps> = ({
  agents,
  gridWidth,
  gridHeight,
  className = '',
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<SimulationCanvas | null>(null);

  // Initialize canvas renderer
  useEffect(() => {
    if (!canvasRef.current) {
      return;
    }

    try {
      rendererRef.current = new SimulationCanvas(canvasRef.current, gridWidth, gridHeight);
    } catch (error) {
      console.error('Failed to initialize canvas renderer:', error);
    }
  }, [gridWidth, gridHeight]);

  // Render agents when they change
  useEffect(() => {
    if (!rendererRef.current) {
      return;
    }

    rendererRef.current.render(agents);
  }, [agents]);

  // Handle grid size changes
  useEffect(() => {
    if (!rendererRef.current) {
      return;
    }

    rendererRef.current.resize(gridWidth, gridHeight);
  }, [gridWidth, gridHeight]);

  return (
    <div className={`relative ${className}`}>
      <canvas className="rounded-lg border border-gray-300 shadow-sm" ref={canvasRef} />
      <div className="absolute top-2 right-2 rounded bg-white bg-opacity-90 p-2 text-xs">
        <div className="grid grid-cols-2 gap-1 text-center">
          <div className="flex items-center gap-1">
            <div className="h-3 w-3 rounded bg-green-500" />
            <span>常に協力</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="h-3 w-3 rounded bg-red-500" />
            <span>常に裏切り</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="h-3 w-3 rounded bg-blue-500" />
            <span>しっぺ返し</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="h-3 w-3 rounded bg-amber-500" />
            <span>パブロフ</span>
          </div>
        </div>
        <div className="mt-2 text-gray-600">
          <div>明るさ = 協力率</div>
        </div>
      </div>
    </div>
  );
};
