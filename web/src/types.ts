// ========================================
// Type Definitions for 2D Prisoner's Dilemma
// ========================================

// ========================================
// Agent and Simulation Types
// ========================================

export interface AgentData {
  id: number;
  x: number;
  y: number;
  cooperation_tendency: number;
  aggression_level: number;
  learning_ability: number;
  movement_tendency: number;
  score: number;
  energy: number;
  age: number;
  battles_fought: number;
  fitness: number;
  is_alive: boolean;
}

export interface Statistics {
  generation: number;
  population: number;
  average_score: number;
  max_score: number;
  min_score: number;
  average_cooperation: number;
  total_battles: number;
}

export interface GridDimensions {
  width: number;
  height: number;
}

// ========================================
// Simulation Configuration
// ========================================

export interface SimulationConfig {
  world_width: number;
  world_height: number;
  initial_population: number;
  max_generations: number;
  battles_per_generation: number;
  neighbor_radius: number;
  mutation_rate: number;
  mutation_strength: number;
  elite_ratio: number;
  selection_method: "Tournament" | "Roulette" | "Rank";
  crossover_method: "Uniform" | "OnePoint" | "TwoPoint";
}

// ========================================
// UI State Types
// ========================================

export type VisualizationMode = 'cooperation' | 'score' | 'movement';

export interface UIConfig {
  visualizationMode: VisualizationMode;
  showGrid: boolean;
  showCoordinates: boolean;
  autoRun: boolean;
  autoRunSpeed: number; // ms per generation
}

// ========================================
// Battle and Evolution Types
// ========================================

export interface BattleResult {
  agent1_id: number;
  agent2_id: number;
  agent1_cooperated: boolean;
  agent2_cooperated: boolean;
  agent1_score: number;
  agent2_score: number;
  round: number;
}

export interface PayoffMatrix {
  mutual_cooperation: number;
  mutual_defection: number;
  cooperation_exploited: number;
  defection_advantage: number;
}

// ========================================
// Preset Configurations
// ========================================

export type PresetType = 'small' | 'medium' | 'large' | 'custom';

export interface PresetConfig {
  name: string;
  description: string;
  config: SimulationConfig;
}

// ========================================
// Error and Loading States
// ========================================

export interface ErrorState {
  message: string;
  timestamp: number;
  recoverable: boolean;
}

export interface LoadingState {
  isLoading: boolean;
  operation?: string;
  progress?: number;
}

// ========================================
// Component Props Types
// ========================================

export interface GridComponentProps {
  width?: number;
  height?: number;
  cellSize?: number;
  showGrid?: boolean;
  showCoordinates?: boolean;
  colorMode?: VisualizationMode;
  className?: string;
  'data-testid'?: string;
  onAgentClick?: (agent: AgentData) => void;
  onCellClick?: (x: number, y: number) => void;
}

export interface ControlPanelProps {
  className?: string;
  'data-testid'?: string;
}

export interface StatisticsPanelProps {
  className?: string;
  'data-testid'?: string;
  showHistory?: boolean;
}

// ========================================
// Chart and History Types
// ========================================

export interface GenerationData {
  generation: number;
  statistics: Statistics;
  timestamp: number;
}

export interface ChartDataPoint {
  x: number;
  y: number;
  label?: string;
}

export interface ChartSeries {
  name: string;
  data: ChartDataPoint[];
  color?: string;
}

// ========================================
// Export and Import Types
// ========================================

export interface ExportData {
  config: SimulationConfig;
  history: GenerationData[];
  finalAgents: AgentData[];
  metadata: {
    exportDate: string;
    version: string;
    totalGenerations: number;
  };
}

export interface ImportResult {
  success: boolean;
  data?: ExportData;
  error?: string;
}

// ========================================
// Theme and Styling Types
// ========================================

export interface Theme {
  mode: 'light' | 'dark';
  colors: {
    primary: string;
    secondary: string;
    background: string;
    surface: string;
    text: string;
    textSecondary: string;
    border: string;
    success: string;
    warning: string;
    error: string;
  };
}