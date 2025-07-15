import { beforeEach, describe, expect, it, vi } from 'vitest';
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

const mockCanvas = {
  getContext: vi.fn(() => mockContext),
  height: 0,
  style: { height: '', width: '' },
  width: 0,
} as unknown as HTMLCanvasElement;

describe('SimulationCanvas', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockContext.fillStyle = '';
    mockContext.strokeStyle = '';
    mockContext.lineWidth = 0;
  });

  describe('constructor', () => {
    it('should initialize canvas successfully', () => {
      // Arrange & Act
      const canvas = new SimulationCanvas(mockCanvas, 10, 10);

      // Assert
      expect(mockCanvas.getContext).toHaveBeenCalledWith('2d');
      expect(canvas).toBeDefined();
    });

    it('should throw error when canvas context is not available', () => {
      // Arrange
      const nullCanvas = {
        getContext: vi.fn(() => null),
      } as unknown as HTMLCanvasElement;

      // Act & Assert
      expect(() => new SimulationCanvas(nullCanvas, 10, 10)).toThrow(
        'Failed to get 2D context from canvas'
      );
    });
  });

  describe('rendering methods', () => {
    it('should execute clear method without errors', () => {
      // Arrange
      const canvas = new SimulationCanvas(mockCanvas, 10, 10);

      // Act
      canvas.clear();

      // Assert: メソッドが実行されエラーが発生しない
      expect(mockContext.fillRect).toHaveBeenCalled();
    });

    it('should execute drawGrid method without errors', () => {
      // Arrange
      const canvas = new SimulationCanvas(mockCanvas, 2, 2);

      // Act
      canvas.drawGrid();

      // Assert: メソッドが実行されエラーが発生しない
      expect(mockContext.beginPath).toHaveBeenCalled();
      expect(mockContext.stroke).toHaveBeenCalled();
    });

    it('should execute render method without errors', () => {
      // Arrange
      const canvas = new SimulationCanvas(mockCanvas, 10, 10);
      const agents = [
        {
          // biome-ignore lint/style/useNamingConvention: WASM properties use snake_case
          cooperation_rate: 0.8,
          id: '1',
          mobility: 0.5,
          // biome-ignore lint/style/useNamingConvention: WASM properties use snake_case
          movement_strategy: 2,
          score: 100,
          strategy: 0,
          x: 0,
          y: 0,
        },
      ];

      // Act
      canvas.render(agents);

      // Assert: メソッドが実行されエラーが発生しない
      expect(mockContext.fillRect).toHaveBeenCalled();
      expect(mockContext.stroke).toHaveBeenCalled();
    });
  });
});
