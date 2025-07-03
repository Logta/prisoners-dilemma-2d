// ========================================
// Simulation Domain Service
// ========================================

import { AgentData, type SimulationConfig, type Statistics } from '../../types';
import { Simulation } from '../entities/Simulation';
import { AgentPopulation } from '../value-objects/AgentPopulation';
import { GenerationNumber } from '../value-objects/GenerationNumber';
import { SimulationId } from '../value-objects/SimulationId';

export class SimulationDomainService {
  // ========================================
  // シミュレーション管理
  // ========================================

  static canMergeSimulations(sim1: Simulation, sim2: Simulation): boolean {
    // 同じ設定で実行されたシミュレーションのみマージ可能
    return (
      SimulationDomainService.configsAreCompatible(sim1.config, sim2.config) &&
      sim1.gridDimensions.width === sim2.gridDimensions.width &&
      sim1.gridDimensions.height === sim2.gridDimensions.height
    );
  }

  static mergeSimulations(primary: Simulation, secondary: Simulation): Simulation {
    if (!SimulationDomainService.canMergeSimulations(primary, secondary)) {
      throw new Error('Simulations cannot be merged due to incompatible configurations');
    }

    const mergedId = SimulationId.generate();
    const merged = new Simulation(mergedId.value, primary.config, primary.gridDimensions);

    // 統計データをマージ
    const allStats = [...primary.statistics, ...secondary.statistics];
    allStats.forEach((stat) => merged.addStatistics(stat));

    // より進んだ世代のエージェントを使用
    const primaryLatest = primary.getLatestStatistics();
    const secondaryLatest = secondary.getLatestStatistics();

    if (primaryLatest && secondaryLatest) {
      const moreAdvanced =
        primaryLatest.generation > secondaryLatest.generation ? primary : secondary;
      merged.updateAgents([...moreAdvanced.agents]);
    }

    return merged;
  }

  // ========================================
  // パフォーマンス分析
  // ========================================

  static analyzeEvolutionEfficiency(simulation: Simulation): EvolutionEfficiencyAnalysis {
    const stats = simulation.statistics;
    if (stats.length < 2) {
      return {
        convergenceRate: 0,
        diversityMaintenance: 0,
        efficiency: 0,
        recommendation: 'Insufficient data for analysis',
      };
    }

    // 協力率の改善効率
    const firstCooperation = stats[0].avg_cooperation;
    const lastCooperation = stats[stats.length - 1].avg_cooperation;
    const cooperationImprovement = lastCooperation - firstCooperation;

    // 世代あたりの改善率
    const generationSpan = stats[stats.length - 1].generation - stats[0].generation;
    const improvementRate = generationSpan > 0 ? cooperationImprovement / generationSpan : 0;

    // 多様性の維持度
    const diversityValues = stats.map((s) => s.std_cooperation);
    const avgDiversity =
      diversityValues.reduce((sum, val) => sum + val, 0) / diversityValues.length;

    // 収束率（変動の減少度）
    const recentStats = stats.slice(-10);
    const recentVariation = SimulationDomainService.calculateVariation(
      recentStats.map((s) => s.avg_cooperation)
    );
    const convergenceRate = 1 - recentVariation;

    const efficiency = Math.max(0, Math.min(1, improvementRate * 10));

    return {
      convergenceRate,
      diversityMaintenance: avgDiversity,
      efficiency,
      recommendation: SimulationDomainService.generateEfficiencyRecommendation(
        efficiency,
        convergenceRate,
        avgDiversity
      ),
    };
  }

  static compareSimulationPerformance(sim1: Simulation, sim2: Simulation): SimulationComparison {
    const perf1 = sim1.getPerformanceMetrics();
    const perf2 = sim2.getPerformanceMetrics();

    const analysis1 = SimulationDomainService.analyzeEvolutionEfficiency(sim1);
    const analysis2 = SimulationDomainService.analyzeEvolutionEfficiency(sim2);

    return {
      efficiencyComparison: {
        difference: Math.abs(analysis1.efficiency - analysis2.efficiency),
        winner: analysis1.efficiency > analysis2.efficiency ? 'simulation1' : 'simulation2',
      },
      recommendation: SimulationDomainService.generateComparisonRecommendation(
        analysis1,
        analysis2
      ),
      speedComparison: {
        ratio:
          Math.max(perf1.generationsPerSecond, perf2.generationsPerSecond) /
          Math.min(perf1.generationsPerSecond, perf2.generationsPerSecond),
        winner:
          perf1.generationsPerSecond > perf2.generationsPerSecond ? 'simulation1' : 'simulation2',
      },
      stabilityComparison: {
        difference: Math.abs(perf1.cooperationStability - perf2.cooperationStability),
        winner:
          perf1.cooperationStability > perf2.cooperationStability ? 'simulation1' : 'simulation2',
      },
    };
  }

  // ========================================
  // 設定最適化
  // ========================================

  static optimizeConfigurationForGoal(
    currentConfig: SimulationConfig,
    goal: OptimizationGoal,
    currentStats: Statistics[]
  ): SimulationConfig {
    const optimized = { ...currentConfig };

    switch (goal) {
      case 'maximize_cooperation':
        optimized.mutation_rate = Math.max(0.01, currentConfig.mutation_rate * 0.8);
        optimized.selection_pressure = Math.min(5.0, currentConfig.selection_pressure * 1.2);
        break;

      case 'maximize_diversity':
        optimized.mutation_rate = Math.min(0.3, currentConfig.mutation_rate * 1.5);
        optimized.selection_pressure = Math.max(1.0, currentConfig.selection_pressure * 0.8);
        break;

      case 'faster_convergence':
        optimized.selection_pressure = Math.min(5.0, currentConfig.selection_pressure * 1.4);
        optimized.elitism_rate = Math.min(0.3, currentConfig.elitism_rate * 1.2);
        break;

      case 'prevent_stagnation':
        if (currentStats.length >= 10) {
          const recentVariation = SimulationDomainService.calculateVariation(
            currentStats.slice(-10).map((s) => s.avg_cooperation)
          );
          if (recentVariation < 0.01) {
            optimized.mutation_rate = Math.min(0.3, currentConfig.mutation_rate * 2.0);
          }
        }
        break;
    }

    return optimized;
  }

  // ========================================
  // ヘルパーメソッド
  // ========================================

  private static configsAreCompatible(
    config1: SimulationConfig,
    config2: SimulationConfig
  ): boolean {
    const tolerance = 0.01;
    return (
      Math.abs(config1.mutation_rate - config2.mutation_rate) < tolerance &&
      Math.abs(config1.crossover_rate - config2.crossover_rate) < tolerance &&
      Math.abs(config1.selection_pressure - config2.selection_pressure) < tolerance
    );
  }

  private static calculateVariation(values: number[]): number {
    if (values.length < 2) return 0;

    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const variance = values.reduce((sum, val) => sum + (val - mean) ** 2, 0) / values.length;

    return Math.sqrt(variance);
  }

  private static generateEfficiencyRecommendation(
    efficiency: number,
    convergenceRate: number,
    diversity: number
  ): string {
    if (efficiency < 0.3) {
      return 'Low efficiency. Consider increasing mutation rate or adjusting selection pressure.';
    }
    if (convergenceRate > 0.9 && diversity < 0.1) {
      return 'High convergence with low diversity. Risk of premature convergence.';
    }
    if (efficiency > 0.7 && diversity > 0.2) {
      return 'Good balance of efficiency and diversity. Continue current settings.';
    }
    return 'Performance is adequate. Monitor for stagnation.';
  }

  private static generateComparisonRecommendation(
    analysis1: EvolutionEfficiencyAnalysis,
    analysis2: EvolutionEfficiencyAnalysis
  ): string {
    const effDiff = analysis1.efficiency - analysis2.efficiency;
    const divDiff = analysis1.diversityMaintenance - analysis2.diversityMaintenance;

    if (Math.abs(effDiff) < 0.1 && Math.abs(divDiff) < 0.1) {
      return 'Simulations perform similarly. Consider runtime efficiency.';
    }
    if (effDiff > 0.2) {
      return 'Simulation 1 shows significantly better efficiency.';
    }
    if (effDiff < -0.2) {
      return 'Simulation 2 shows significantly better efficiency.';
    }
    return 'Mixed results. Consider specific goals when choosing configuration.';
  }
}

// ========================================
// 型定義
// ========================================

export interface EvolutionEfficiencyAnalysis {
  efficiency: number;
  convergenceRate: number;
  diversityMaintenance: number;
  recommendation: string;
}

export interface SimulationComparison {
  speedComparison: {
    winner: 'simulation1' | 'simulation2';
    ratio: number;
  };
  efficiencyComparison: {
    winner: 'simulation1' | 'simulation2';
    difference: number;
  };
  stabilityComparison: {
    winner: 'simulation1' | 'simulation2';
    difference: number;
  };
  recommendation: string;
}

export type OptimizationGoal =
  | 'maximize_cooperation'
  | 'maximize_diversity'
  | 'faster_convergence'
  | 'prevent_stagnation';
