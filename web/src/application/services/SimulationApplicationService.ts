// ========================================
// Simulation Application Service
// ========================================

import { Simulation } from '../../domain/entities/Simulation';
import type { SimulationRepository } from '../../domain/repositories/SimulationRepository';
import {
  type OptimizationGoal,
  SimulationDomainService,
} from '../../domain/services/SimulationDomainService';
import { AgentPopulation } from '../../domain/value-objects/AgentPopulation';
import { GenerationNumber } from '../../domain/value-objects/GenerationNumber';
import { SimulationId } from '../../domain/value-objects/SimulationId';
import type { AgentData, GridDimensions, SimulationConfig, Statistics } from '../../types';

export class SimulationApplicationService {
  constructor(private simulationRepository: SimulationRepository) {}

  // ========================================
  // シミュレーション作成・管理
  // ========================================

  async createSimulation(
    config: SimulationConfig,
    gridDimensions: GridDimensions
  ): Promise<{ simulationId: string }> {
    const id = SimulationId.generate();
    const simulation = new Simulation(id.value, config, gridDimensions);

    await this.simulationRepository.save(simulation);

    return { simulationId: id.value };
  }

  async startSimulation(simulationId: string): Promise<void> {
    const id = new SimulationId(simulationId);
    const simulation = await this.simulationRepository.findById(id);

    if (!simulation) {
      throw new Error(`Simulation with id ${simulationId} not found`);
    }

    if (!simulation.canStart()) {
      throw new Error('Simulation cannot be started in its current state');
    }

    simulation.start();
    await this.simulationRepository.save(simulation);
  }

  async pauseSimulation(simulationId: string): Promise<void> {
    const id = new SimulationId(simulationId);
    const simulation = await this.simulationRepository.findById(id);

    if (!simulation) {
      throw new Error(`Simulation with id ${simulationId} not found`);
    }

    simulation.pause();
    await this.simulationRepository.save(simulation);
  }

  async resumeSimulation(simulationId: string): Promise<void> {
    const id = new SimulationId(simulationId);
    const simulation = await this.simulationRepository.findById(id);

    if (!simulation) {
      throw new Error(`Simulation with id ${simulationId} not found`);
    }

    simulation.resume();
    await this.simulationRepository.save(simulation);
  }

  async stopSimulation(simulationId: string): Promise<void> {
    const id = new SimulationId(simulationId);
    const simulation = await this.simulationRepository.findById(id);

    if (!simulation) {
      throw new Error(`Simulation with id ${simulationId} not found`);
    }

    simulation.stop();
    await this.simulationRepository.save(simulation);
  }

  async resetSimulation(simulationId: string): Promise<void> {
    const id = new SimulationId(simulationId);
    const simulation = await this.simulationRepository.findById(id);

    if (!simulation) {
      throw new Error(`Simulation with id ${simulationId} not found`);
    }

    simulation.reset();
    await this.simulationRepository.save(simulation);
  }

  // ========================================
  // データ更新
  // ========================================

  async updateSimulationAgents(simulationId: string, agents: AgentData[]): Promise<void> {
    const id = new SimulationId(simulationId);
    const simulation = await this.simulationRepository.findById(id);

    if (!simulation) {
      throw new Error(`Simulation with id ${simulationId} not found`);
    }

    simulation.updateAgents(agents);
    await this.simulationRepository.save(simulation);
  }

  async advanceGeneration(simulationId: string, newStats: Statistics): Promise<void> {
    const id = new SimulationId(simulationId);
    const simulation = await this.simulationRepository.findById(id);

    if (!simulation) {
      throw new Error(`Simulation with id ${simulationId} not found`);
    }

    simulation.advanceGeneration();
    simulation.addStatistics(newStats);
    await this.simulationRepository.save(simulation);
  }

  // ========================================
  // クエリとレポート
  // ========================================

  async getSimulation(simulationId: string): Promise<Simulation | null> {
    const id = new SimulationId(simulationId);
    return await this.simulationRepository.findById(id);
  }

  async getAllSimulations(): Promise<Simulation[]> {
    return await this.simulationRepository.findAll();
  }

  async getRunningSimulations(): Promise<Simulation[]> {
    return await this.simulationRepository.findByStatus('running');
  }

  async getSimulationStatistics(
    simulationId: string,
    startGeneration?: number,
    endGeneration?: number
  ): Promise<Statistics[]> {
    const id = new SimulationId(simulationId);
    const simulation = await this.simulationRepository.findById(id);

    if (!simulation) {
      throw new Error(`Simulation with id ${simulationId} not found`);
    }

    if (startGeneration !== undefined && endGeneration !== undefined) {
      return simulation.getStatisticsInRange(startGeneration, endGeneration);
    }

    return [...simulation.statistics];
  }

  async getSimulationPerformanceReport(simulationId: string): Promise<SimulationPerformanceReport> {
    const id = new SimulationId(simulationId);
    const simulation = await this.simulationRepository.findById(id);

    if (!simulation) {
      throw new Error(`Simulation with id ${simulationId} not found`);
    }

    const performanceMetrics = simulation.getPerformanceMetrics();
    const efficiencyAnalysis = SimulationDomainService.analyzeEvolutionEfficiency(simulation);
    const trend = simulation.calculateCooperationTrend();
    const populationTrend = simulation.calculatePopulationTrend();

    return {
      cooperationTrend: trend,
      efficiencyAnalysis,
      generation: simulation.generation,
      hasReachedMaxGenerations: simulation.hasReachedMaxGenerations(),
      isConverged: simulation.isConverged(),
      performanceMetrics,
      populationTrend,
      runtime: simulation.getRuntime(),
      simulationId: simulation.id,
      status: simulation.status,
    };
  }

  // ========================================
  // 分析・比較
  // ========================================

  async compareSimulations(simulationId1: string, simulationId2: string): Promise<any> {
    const id1 = new SimulationId(simulationId1);
    const id2 = new SimulationId(simulationId2);

    const [sim1, sim2] = await Promise.all([
      this.simulationRepository.findById(id1),
      this.simulationRepository.findById(id2),
    ]);

    if (!sim1 || !sim2) {
      throw new Error('One or both simulations not found');
    }

    return SimulationDomainService.compareSimulationPerformance(sim1, sim2);
  }

  async optimizeConfiguration(
    simulationId: string,
    goal: OptimizationGoal
  ): Promise<SimulationConfig> {
    const id = new SimulationId(simulationId);
    const simulation = await this.simulationRepository.findById(id);

    if (!simulation) {
      throw new Error(`Simulation with id ${simulationId} not found`);
    }

    return SimulationDomainService.optimizeConfigurationForGoal(simulation.config, goal, [
      ...simulation.statistics,
    ]);
  }

  // ========================================
  // データエクスポート
  // ========================================

  async exportSimulationData(simulationId: string, format: 'json' | 'csv'): Promise<string> {
    const id = new SimulationId(simulationId);
    const simulation = await this.simulationRepository.findById(id);

    if (!simulation) {
      throw new Error(`Simulation with id ${simulationId} not found`);
    }

    switch (format) {
      case 'json':
        return JSON.stringify(simulation.toJSON(), null, 2);

      case 'csv':
        return this.generateCSV(simulation);

      default:
        throw new Error(`Unsupported export format: ${format}`);
    }
  }

  private generateCSV(simulation: Simulation): string {
    const headers = [
      'generation',
      'population',
      'avg_cooperation',
      'avg_movement',
      'avg_score',
      'min_cooperation',
      'max_cooperation',
      'std_cooperation',
    ];

    const rows = simulation.statistics.map((stat) => [
      stat.generation,
      stat.population,
      stat.avg_cooperation,
      stat.avg_movement,
      stat.avg_score,
      stat.min_cooperation,
      stat.max_cooperation,
      stat.std_cooperation,
    ]);

    const csvContent = [headers, ...rows].map((row) => row.join(',')).join('\n');

    return csvContent;
  }

  // ========================================
  // バッチ操作
  // ========================================

  async deleteSimulation(simulationId: string): Promise<void> {
    const id = new SimulationId(simulationId);
    await this.simulationRepository.delete(id);
  }

  async deleteAllSimulations(): Promise<void> {
    await this.simulationRepository.deleteAll();
  }

  async getSimulationCount(): Promise<number> {
    return await this.simulationRepository.count();
  }
}

// ========================================
// 型定義
// ========================================

export interface SimulationPerformanceReport {
  simulationId: string;
  status: 'idle' | 'running' | 'paused' | 'stopped';
  generation: number;
  runtime: number;
  performanceMetrics: {
    generationsPerSecond: number;
    agentsPerGeneration: number;
    cooperationStability: number;
  };
  efficiencyAnalysis: {
    efficiency: number;
    convergenceRate: number;
    diversityMaintenance: number;
    recommendation: string;
  };
  cooperationTrend: number;
  populationTrend: 'increasing' | 'decreasing' | 'stable';
  isConverged: boolean;
  hasReachedMaxGenerations: boolean;
}
