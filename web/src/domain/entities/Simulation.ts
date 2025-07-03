// ========================================
// Simulation Domain Entity
// ========================================

import type { AgentData, GridDimensions, SimulationConfig, Statistics } from '../../types';
import { AgentPopulation } from '../value-objects/AgentPopulation';
import { GenerationNumber } from '../value-objects/GenerationNumber';
import { SimulationId } from '../value-objects/SimulationId';

export class Simulation {
  public readonly id: string;
  public readonly config: SimulationConfig;
  public readonly gridDimensions: GridDimensions;
  private _generation: number = 0;
  private _agents: AgentData[] = [];
  private _statistics: Statistics[] = [];
  private _isRunning: boolean = false;
  private _isPaused: boolean = false;
  private _startTime?: Date;
  private _endTime?: Date;

  constructor(id: string, config: SimulationConfig, gridDimensions: GridDimensions) {
    this.id = id;
    this.config = { ...config };
    this.gridDimensions = { ...gridDimensions };
  }

  // ========================================
  // ビジネスロジック
  // ========================================

  start(): void {
    if (this._isRunning) {
      throw new Error('Simulation is already running');
    }

    this._isRunning = true;
    this._isPaused = false;
    this._startTime = new Date();
    this._endTime = undefined;
  }

  pause(): void {
    if (!this._isRunning || this._isPaused) {
      throw new Error('Cannot pause: simulation is not running or already paused');
    }

    this._isPaused = true;
  }

  resume(): void {
    if (!this._isRunning || !this._isPaused) {
      throw new Error('Cannot resume: simulation is not running or not paused');
    }

    this._isPaused = false;
  }

  stop(): void {
    this._isRunning = false;
    this._isPaused = false;
    this._endTime = new Date();
  }

  reset(): void {
    this.stop();
    this._generation = 0;
    this._agents = [];
    this._statistics = [];
    this._startTime = undefined;
    this._endTime = undefined;
  }

  advanceGeneration(): void {
    if (!this._isRunning || this._isPaused) {
      throw new Error('Cannot advance generation: simulation is not running');
    }

    this._generation++;
  }

  updateAgents(agents: AgentData[]): void {
    this._agents = [...agents];
  }

  addStatistics(stats: Statistics): void {
    // 同じ世代の統計が既に存在する場合は更新
    const existingIndex = this._statistics.findIndex((s) => s.generation === stats.generation);
    if (existingIndex >= 0) {
      this._statistics[existingIndex] = { ...stats };
    } else {
      this._statistics.push({ ...stats });
      // 世代順にソート
      this._statistics.sort((a, b) => a.generation - b.generation);
    }
  }

  // ========================================
  // ドメインルール検証
  // ========================================

  canStart(): boolean {
    return !this._isRunning && this._agents.length > 0;
  }

  canPause(): boolean {
    return this._isRunning && !this._isPaused;
  }

  canResume(): boolean {
    return this._isRunning && this._isPaused;
  }

  canStop(): boolean {
    return this._isRunning;
  }

  hasMinimumPopulation(): boolean {
    return this._agents.length >= this.config.min_population_size || 10;
  }

  hasReachedMaxGenerations(): boolean {
    const maxGenerations = (this.config as any).max_generations || Number.MAX_SAFE_INTEGER;
    return this._generation >= maxGenerations;
  }

  isConverged(): boolean {
    if (this._statistics.length < 10) return false;

    // 最近10世代の平均協力率の変動をチェック
    const recentStats = this._statistics.slice(-10);
    const cooperationRates = recentStats.map((s) => s.avg_cooperation);
    const variance = this.calculateVariance(cooperationRates);

    return variance < 0.001; // 収束閾値
  }

  // ========================================
  // 統計・分析機能
  // ========================================

  getRuntime(): number {
    if (!this._startTime) return 0;

    const endTime = this._endTime || new Date();
    return endTime.getTime() - this._startTime.getTime();
  }

  getAverageGenerationTime(): number {
    if (this._generation === 0 || !this._startTime) return 0;

    return this.getRuntime() / this._generation;
  }

  getLatestStatistics(): Statistics | undefined {
    return this._statistics[this._statistics.length - 1];
  }

  getStatisticsInRange(startGen: number, endGen: number): Statistics[] {
    return this._statistics.filter((s) => s.generation >= startGen && s.generation <= endGen);
  }

  calculatePopulationTrend(): 'increasing' | 'decreasing' | 'stable' {
    if (this._statistics.length < 5) return 'stable';

    const recentStats = this._statistics.slice(-5);
    const populations = recentStats.map((s) => s.population);
    const trend = populations[populations.length - 1] - populations[0];

    if (trend > populations[0] * 0.1) return 'increasing';
    if (trend < -populations[0] * 0.1) return 'decreasing';
    return 'stable';
  }

  calculateCooperationTrend(): number {
    if (this._statistics.length < 2) return 0;

    const firstStat = this._statistics[0];
    const lastStat = this._statistics[this._statistics.length - 1];

    return lastStat.avg_cooperation - firstStat.avg_cooperation;
  }

  getPerformanceMetrics(): {
    generationsPerSecond: number;
    agentsPerGeneration: number;
    cooperationStability: number;
  } {
    const runtime = this.getRuntime() / 1000; // 秒
    const generationsPerSecond = runtime > 0 ? this._generation / runtime : 0;

    const avgPopulation =
      this._statistics.length > 0
        ? this._statistics.reduce((sum, s) => sum + s.population, 0) / this._statistics.length
        : 0;

    const cooperationRates = this._statistics.map((s) => s.avg_cooperation);
    const cooperationStability = 1 - this.calculateVariance(cooperationRates);

    return {
      agentsPerGeneration: avgPopulation,
      cooperationStability: Math.max(0, Math.min(1, cooperationStability)),
      generationsPerSecond,
    };
  }

  // ========================================
  // ヘルパーメソッド
  // ========================================

  private calculateVariance(values: number[]): number {
    if (values.length === 0) return 0;

    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const variance = values.reduce((sum, val) => sum + (val - mean) ** 2, 0) / values.length;

    return variance;
  }

  // ========================================
  // ゲッター
  // ========================================

  get generation(): number {
    return this._generation;
  }

  get agents(): ReadonlyArray<AgentData> {
    return this._agents;
  }

  get statistics(): ReadonlyArray<Statistics> {
    return this._statistics;
  }

  get isRunning(): boolean {
    return this._isRunning;
  }

  get isPaused(): boolean {
    return this._isPaused;
  }

  get status(): 'idle' | 'running' | 'paused' | 'stopped' {
    if (!this._isRunning) return this._startTime ? 'stopped' : 'idle';
    return this._isPaused ? 'paused' : 'running';
  }

  get startTime(): Date | undefined {
    return this._startTime ? new Date(this._startTime) : undefined;
  }

  get endTime(): Date | undefined {
    return this._endTime ? new Date(this._endTime) : undefined;
  }

  // ========================================
  // シリアライゼーション
  // ========================================

  toJSON(): object {
    return {
      agents: this._agents,
      config: this.config,
      endTime: this._endTime?.toISOString(),
      generation: this._generation,
      gridDimensions: this.gridDimensions,
      id: this.id,
      isPaused: this._isPaused,
      isRunning: this._isRunning,
      startTime: this._startTime?.toISOString(),
      statistics: this._statistics,
    };
  }

  static fromJSON(data: any): Simulation {
    const simulation = new Simulation(data.id, data.config, data.gridDimensions);

    simulation._generation = data.generation || 0;
    simulation._agents = data.agents || [];
    simulation._statistics = data.statistics || [];
    simulation._isRunning = data.isRunning || false;
    simulation._isPaused = data.isPaused || false;
    simulation._startTime = data.startTime ? new Date(data.startTime) : undefined;
    simulation._endTime = data.endTime ? new Date(data.endTime) : undefined;

    return simulation;
  }
}
