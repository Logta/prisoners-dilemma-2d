import type { WasmAgent } from '../types/wasm';
import { STRATEGY_COLORS } from '../types/wasm';

export class SimulationCanvas {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private gridWidth: number;
  private gridHeight: number;
  private cellSize = 1;

  constructor(canvas: HTMLCanvasElement, gridWidth: number, gridHeight: number) {
    this.canvas = canvas;
    this.gridWidth = gridWidth;
    this.gridHeight = gridHeight;

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Failed to get 2D context from canvas');
    }
    this.ctx = ctx;

    this.setupCanvas();
  }

  private setupCanvas() {
    const maxSize = Math.min(800, 600); // Max canvas size
    this.cellSize = Math.floor(maxSize / Math.max(this.gridWidth, this.gridHeight));
    
    // Ensure minimum cell size of 4 pixels for visibility
    this.cellSize = Math.max(this.cellSize, 4);

    this.canvas.width = this.gridWidth * this.cellSize;
    this.canvas.height = this.gridHeight * this.cellSize;

    // Set CSS size for high DPI displays
    this.canvas.style.width = `${this.canvas.width}px`;
    this.canvas.style.height = `${this.canvas.height}px`;
  }

  public clear() {
    this.ctx.fillStyle = '#f8f9fa';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
  }

  public drawGrid() {
    this.ctx.strokeStyle = '#e9ecef';
    this.ctx.lineWidth = 0.5;

    // Draw vertical lines
    for (let x = 0; x <= this.gridWidth; x++) {
      const xPos = x * this.cellSize;
      this.ctx.beginPath();
      this.ctx.moveTo(xPos, 0);
      this.ctx.lineTo(xPos, this.canvas.height);
      this.ctx.stroke();
    }

    // Draw horizontal lines
    for (let y = 0; y <= this.gridHeight; y++) {
      const yPos = y * this.cellSize;
      this.ctx.beginPath();
      this.ctx.moveTo(0, yPos);
      this.ctx.lineTo(this.canvas.width, yPos);
      this.ctx.stroke();
    }
  }

  public drawAgents(agents: WasmAgent[]) {
    for (const agent of agents) {
      this.drawAgent(agent);
    }
  }

  private drawAgent(agent: WasmAgent) {
    const x = agent.x * this.cellSize;
    const y = agent.y * this.cellSize;

    // Get base color from strategy
    const baseColor = STRATEGY_COLORS[agent.strategy as keyof typeof STRATEGY_COLORS] || '#6b7280';

    // Modify color based on cooperation rate
    const cooperationRate = agent.cooperation_rate;
    const color = this.blendWithCooperationRate(baseColor, cooperationRate);

    // Use adaptive padding based on cell size for better visibility
    const padding = Math.max(1, Math.floor(this.cellSize * 0.1));
    const agentSize = this.cellSize - (padding * 2);

    // Ensure minimum agent size of 2 pixels
    const finalSize = Math.max(agentSize, 2);
    const finalPadding = Math.max((this.cellSize - finalSize) / 2, 0);

    this.ctx.fillStyle = color;
    this.ctx.fillRect(x + finalPadding, y + finalPadding, finalSize, finalSize);

    // Add border only if there's enough space
    if (this.cellSize >= 4) {
      this.ctx.strokeStyle = '#374151';
      this.ctx.lineWidth = 1;
      this.ctx.strokeRect(x + finalPadding, y + finalPadding, finalSize, finalSize);
    }
  }

  private blendWithCooperationRate(baseColor: string, cooperationRate: number): string {
    // Convert hex to RGB
    const r = Number.parseInt(baseColor.slice(1, 3), 16);
    const g = Number.parseInt(baseColor.slice(3, 5), 16);
    const b = Number.parseInt(baseColor.slice(5, 7), 16);

    // Blend with cooperation rate
    // High cooperation -> brighter, Low cooperation -> darker
    const factor = 0.3 + cooperationRate * 0.7; // Range from 0.3 to 1.0

    const newR = Math.round(r * factor);
    const newG = Math.round(g * factor);
    const newB = Math.round(b * factor);

    return `rgb(${newR}, ${newG}, ${newB})`;
  }

  public render(agents: WasmAgent[]) {
    this.clear();
    this.drawGrid();
    this.drawAgents(agents);
  }

  public resize(gridWidth: number, gridHeight: number) {
    this.gridWidth = gridWidth;
    this.gridHeight = gridHeight;
    this.setupCanvas();
  }
}
