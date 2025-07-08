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
    if (!canvasRef.current) return;

    try {
      rendererRef.current = new SimulationCanvas(canvasRef.current, gridWidth, gridHeight);
    } catch (error) {
      console.error('Failed to initialize canvas renderer:', error);
    }
  }, [gridWidth, gridHeight]);

  // Render agents when they change
  useEffect(() => {
    if (!rendererRef.current) return;

    rendererRef.current.render(agents);
  }, [agents]);

  // Handle grid size changes
  useEffect(() => {
    if (!rendererRef.current) return;

    rendererRef.current.resize(gridWidth, gridHeight);
  }, [gridWidth, gridHeight]);

  return (
    <div className={`relative ${className}`}>
      <canvas className="border border-gray-300 rounded-lg shadow-sm" ref={canvasRef} />
      <div className="absolute top-2 right-2 bg-white bg-opacity-90 rounded p-2 text-xs">
        <div className="grid grid-cols-2 gap-1 text-center">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-green-500 rounded"></div>
            <span>Always Cooperate</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-red-500 rounded"></div>
            <span>Always Defect</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-blue-500 rounded"></div>
            <span>Tit for Tat</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-amber-500 rounded"></div>
            <span>Pavlov</span>
          </div>
        </div>
        <div className="mt-2 text-gray-600">
          <div>Brightness = Cooperation Rate</div>
        </div>
      </div>
    </div>
  );
};
