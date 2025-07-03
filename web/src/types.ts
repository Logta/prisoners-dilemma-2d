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
}

export interface GridSize {
  height: number;
  width: number;
}