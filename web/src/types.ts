// ========================================
// エージェントとシミュレーション関連
// ========================================

export interface AgentData {
  x: number;
  y: number;
  cooperation_rate: number;
  movement_rate: number;
  score: number;
}

export interface Statistics {
  generation: number;
  population: number;
  avg_cooperation: number;
  avg_movement: number;
  avg_score: number;
  min_cooperation: number;
  max_cooperation: number;
  std_cooperation: number;
}

export interface GridSize {
  height: number;
  width: number;
}

export interface GridDimensions {
  width: number;
  height: number;
}

// ========================================
// シミュレーション設定
// ========================================

export interface SimulationConfig {
  battle_radius: number;
  selection_method: string;
  selection_param: number;
  crossover_method: string;
  crossover_param: number;
  mutation_rate: number;
  mutation_strength: number;
}

export type SelectionMethod = "top_percent" | "tournament" | "roulette_wheel";
export type CrossoverMethod = "one_point" | "two_point" | "uniform";

// ========================================
// 利得マトリックス
// ========================================

export interface PayoffMatrix {
  cooperate_cooperate: number;
  cooperate_defect: number;
  defect_cooperate: number;
  defect_defect: number;
}

// ========================================
// エラーハンドリング
// ========================================

export interface SimulationError {
  code: string;
  message: string;
}

// ========================================
// プリセット管理
// ========================================

export interface PresetData {
  name: string;
  description?: string;
  config: SimulationConfig;
  gridSize: GridSize;
  agentDensity: number;
  payoffMatrix?: PayoffMatrix;
  createdAt: Date;
}

// ========================================
// チャート・グラフ関連
// ========================================

export interface ChartDataPoint {
  generation: number;
  value: number;
  label?: string;
}

export interface HistoryData {
  statistics: Statistics[];
  totalGenerations: number;
  startTime: Date;
  endTime?: Date;
}

// ========================================
// UI状態管理
// ========================================

export interface UIState {
  isRunning: boolean;
  isPaused: boolean;
  showGraph: boolean;
  selectedMetric: keyof Statistics;
  animationSpeed: number;
  gridZoom: number;
}

// ========================================
// パフォーマンス監視
// ========================================

export interface PerformanceMetrics {
  averageGenerationTime: number;
  totalSimulationTime: number;
  memoryUsage?: number;
  frameRate?: number;
}

// ========================================
// イベントタイプ
// ========================================

export type SimulationEvent = 
  | { type: 'SIMULATION_STARTED'; payload: { config: SimulationConfig } }
  | { type: 'GENERATION_COMPLETED'; payload: { generation: number; statistics: Statistics } }
  | { type: 'EVOLUTION_COMPLETED'; payload: { generation: number; populationSize: number } }
  | { type: 'SIMULATION_PAUSED'; payload: { generation: number } }
  | { type: 'SIMULATION_RESET'; payload: {} }
  | { type: 'ERROR_OCCURRED'; payload: { error: SimulationError } };

// ========================================
// 型ガード
// ========================================

export function isValidGridSize(size: any): size is GridSize {
  return (
    typeof size === 'object' &&
    typeof size.width === 'number' &&
    typeof size.height === 'number' &&
    size.width > 0 &&
    size.height > 0 &&
    size.width <= 2000 &&
    size.height <= 2000
  );
}

export function isValidDensity(density: any): density is number {
  return typeof density === 'number' && density >= 0 && density <= 1;
}

export function isValidSelectionMethod(method: any): method is SelectionMethod {
  return ['top_percent', 'tournament', 'roulette_wheel'].includes(method);
}

export function isValidCrossoverMethod(method: any): method is CrossoverMethod {
  return ['one_point', 'two_point', 'uniform'].includes(method);
}
