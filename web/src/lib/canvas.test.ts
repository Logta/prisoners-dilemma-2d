import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { WasmAgent } from '../types/wasm';
import { StrategyType } from '../types/wasm';
import { SimulationCanvas } from './canvas';

// Mock Canvas API
const mockContext = {
  beginPath: vi.fn(),
  fillRect: vi.fn(),
  fillStyle: '',
  lineTo: vi.fn(),
  lineWidth: 0,
  moveTo: vi.fn(),
  stroke: vi.fn(),
  strokeRect: vi.fn(),
  strokeStyle: '',
};

const createMockCanvas = () =>
  ({
    getContext: vi.fn(() => mockContext),
    height: 0,
    style: { height: '', width: '' },
    width: 0,
  }) as unknown as HTMLCanvasElement;

const makeAgent = (overrides: Partial<WasmAgent> = {}): WasmAgent => ({
  // biome-ignore lint/style/useNamingConvention: WASM properties use snake_case
  cooperation_rate: 0.8,
  id: '1',
  mobility: 0.5,
  // biome-ignore lint/style/useNamingConvention: WASM properties use snake_case
  movement_strategy: 0,
  score: 100,
  strategy: StrategyType.AllCooperate,
  x: 0,
  y: 0,
  ...overrides,
});

describe('SimulationCanvas', () => {
  let mockCanvas: HTMLCanvasElement;

  beforeEach(() => {
    vi.clearAllMocks();
    mockContext.fillStyle = '';
    mockContext.strokeStyle = '';
    mockContext.lineWidth = 0;
    mockCanvas = createMockCanvas();
  });

  describe('constructor', () => {
    it('initializes with a 2D context', () => {
      const canvas = new SimulationCanvas(mockCanvas, 10, 10);

      expect(mockCanvas.getContext).toHaveBeenCalledWith('2d');
      expect(canvas).toBeDefined();
    });

    it('throws when a 2D context is not available', () => {
      const nullCanvas = { getContext: vi.fn(() => null) } as unknown as HTMLCanvasElement;

      expect(() => new SimulationCanvas(nullCanvas, 10, 10)).toThrow(
        'Failed to get 2D context from canvas'
      );
    });

    it('sizes the canvas so cells fit within the 600px max dimension', () => {
      new SimulationCanvas(mockCanvas, 10, 10);

      // maxSize(600) / gridWidth(10) = cellSize 60
      expect(mockCanvas.width).toBe(600);
      expect(mockCanvas.height).toBe(600);
    });

    it('enforces a minimum cell size of 4px for large grids', () => {
      new SimulationCanvas(mockCanvas, 1000, 1000);

      // 600/1000 は 4px 未満になるため、最小セルサイズ4pxにクランプされる
      expect(mockCanvas.width).toBe(4000);
      expect(mockCanvas.height).toBe(4000);
    });
  });

  describe('clear', () => {
    it('fills the entire canvas with the background color', () => {
      const canvas = new SimulationCanvas(mockCanvas, 10, 10);

      canvas.clear();

      expect(mockContext.fillRect).toHaveBeenCalledWith(0, 0, mockCanvas.width, mockCanvas.height);
      expect(mockContext.fillStyle).toBe('#f8f9fa');
    });
  });

  describe('drawGrid', () => {
    it('draws one line per row and column boundary', () => {
      const canvas = new SimulationCanvas(mockCanvas, 2, 3);

      canvas.drawGrid();

      // 縦線: gridWidth+1本、横線: gridHeight+1本
      expect(mockContext.beginPath).toHaveBeenCalledTimes(2 + 1 + (3 + 1));
      expect(mockContext.stroke).toHaveBeenCalledTimes(2 + 1 + (3 + 1));
    });
  });

  describe('render / drawAgents', () => {
    it('draws each agent colored by strategy, blended by cooperation rate', () => {
      const canvas = new SimulationCanvas(mockCanvas, 10, 10);
      const agent = makeAgent({
        // biome-ignore lint/style/useNamingConvention: WASM properties use snake_case
        cooperation_rate: 0.8,
        strategy: StrategyType.AllCooperate,
        x: 0,
        y: 0,
      });

      canvas.render([agent]);

      // cellSize=60, padding=max(1, floor(60*0.1))=6, size=60-12=48
      expect(mockContext.fillRect).toHaveBeenLastCalledWith(6, 6, 48, 48);

      // STRATEGY_COLORS[AllCooperate]='#22c55e'(34,197,94), factor=0.3+0.8*0.7=0.86
      // -> round(34*0.86)=29, round(197*0.86)=169, round(94*0.86)=81
      expect(mockContext.fillStyle).toBe('rgb(29, 169, 81)');
    });

    it('positions agents according to their grid coordinates', () => {
      const canvas = new SimulationCanvas(mockCanvas, 10, 10);
      const agent = makeAgent({ x: 3, y: 2 });

      canvas.render([agent]);

      // x=3*60+6=186, y=2*60+6=126
      expect(mockContext.fillRect).toHaveBeenLastCalledWith(186, 126, 48, 48);
    });

    it('draws a border around each agent when the cell is large enough', () => {
      const canvas = new SimulationCanvas(mockCanvas, 10, 10);

      canvas.render([makeAgent()]);

      expect(mockContext.strokeRect).toHaveBeenCalledWith(6, 6, 48, 48);
      expect(mockContext.strokeStyle).toBe('#374151');
      expect(mockContext.lineWidth).toBe(1);
    });

    it('falls back to a neutral color for an unrecognized strategy id', () => {
      const canvas = new SimulationCanvas(mockCanvas, 10, 10);
      const agent = makeAgent({
        // biome-ignore lint/style/useNamingConvention: WASM properties use snake_case
        cooperation_rate: 1,
        strategy: 99 as WasmAgent['strategy'],
      });

      canvas.render([agent]);

      // フォールバック色 '#6b7280' (107,114,128), factor=0.3+1*0.7=1.0
      expect(mockContext.fillStyle).toBe('rgb(107, 114, 128)');
    });

    it('draws every agent passed in', () => {
      const canvas = new SimulationCanvas(mockCanvas, 10, 10);
      const agents = [
        makeAgent({ x: 0, y: 0 }),
        makeAgent({ x: 1, y: 0 }),
        makeAgent({ x: 2, y: 0 }),
      ];

      canvas.render(agents);

      expect(mockContext.fillRect).toHaveBeenCalledTimes(agents.length + 1); // +1 は clear()
    });
  });

  describe('resize', () => {
    it('recomputes the canvas size for the new grid dimensions', () => {
      const canvas = new SimulationCanvas(mockCanvas, 10, 10);

      canvas.resize(20, 20);

      // maxSize(600) / gridWidth(20) = cellSize 30
      expect(mockCanvas.width).toBe(600);
      expect(mockCanvas.height).toBe(600);
    });
  });
});
