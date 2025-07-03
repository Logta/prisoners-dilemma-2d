// ========================================
// Evolution Strategies - 高レベルな進化戦略
// ========================================

use crate::core::{Agent, SimulationWorld};
use crate::evolution::{
    ArithmeticCrossover, OnePointCrossover, TwoPointCrossover, UniformCrossover,
};
use crate::evolution::{EvolutionConfig, EvolutionError, EvolutionResult, GeneticAlgorithm};
use crate::evolution::{GaussianMutation, PolynomialMutation, UniformMutation};
use crate::evolution::{RankSelection, RouletteSelection, TournamentSelection};
use serde::{Deserialize, Serialize};

/// 進化戦略の種類
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub enum EvolutionStrategyType {
    Classic,
    Elitist,
    SteadyState,
    IslandModel,
    Adaptive,
    MultiObjective,
}

/// 進化戦略ファクトリ
pub struct EvolutionStrategyFactory;

impl EvolutionStrategyFactory {
    /// 戦略タイプに基づいて遺伝的アルゴリズムを作成
    pub fn create_strategy(
        strategy_type: EvolutionStrategyType,
        custom_config: Option<EvolutionConfig>,
    ) -> Box<dyn EvolutionStrategy> {
        match strategy_type {
            EvolutionStrategyType::Classic => Box::new(ClassicEvolution::new(custom_config)),
            EvolutionStrategyType::Elitist => Box::new(ElitistEvolution::new(custom_config)),
            EvolutionStrategyType::SteadyState => {
                Box::new(SteadyStateEvolution::new(custom_config))
            }
            EvolutionStrategyType::IslandModel => {
                Box::new(IslandModelEvolution::new(custom_config))
            }
            EvolutionStrategyType::Adaptive => Box::new(AdaptiveEvolution::new(custom_config)),
            EvolutionStrategyType::MultiObjective => {
                Box::new(MultiObjectiveEvolution::new(custom_config))
            }
        }
    }

    /// 設定に基づいて最適な戦略を推奨
    pub fn recommend_strategy(
        population_size: usize,
        problem_complexity: f64,
        convergence_speed_priority: bool,
    ) -> EvolutionStrategyType {
        match (
            population_size,
            problem_complexity,
            convergence_speed_priority,
        ) {
            (size, _, true) if size < 100 => EvolutionStrategyType::Elitist,
            (size, complexity, false) if size > 500 && complexity > 0.7 => {
                EvolutionStrategyType::IslandModel
            }
            (_, complexity, _) if complexity > 0.8 => EvolutionStrategyType::Adaptive,
            (size, _, _) if size > 200 => EvolutionStrategyType::SteadyState,
            _ => EvolutionStrategyType::Classic,
        }
    }
}

/// 進化戦略の共通インターフェース
pub trait EvolutionStrategy: Send + Sync {
    fn evolve(&mut self, world: &SimulationWorld) -> Result<EvolutionResult, EvolutionError>;
    fn get_config(&self) -> &EvolutionConfig;
    fn update_config(&mut self, config: EvolutionConfig);
    fn reset(&mut self);
}

/// クラシック遺伝的アルゴリズム
pub struct ClassicEvolution {
    algorithm: GeneticAlgorithm,
    generations_run: u32,
}

impl ClassicEvolution {
    pub fn new(custom_config: Option<EvolutionConfig>) -> Self {
        let config = custom_config.unwrap_or_else(|| EvolutionConfig {
            mutation_rate: 0.1,
            crossover_rate: 0.8,
            elitism_rate: 0.0, // クラシックではエリートなし
            ..EvolutionConfig::default()
        });

        let algorithm = GeneticAlgorithm::new(
            Box::new(RouletteSelection),
            Box::new(OnePointCrossover),
            Box::new(GaussianMutation::new(0.1)),
            config,
        );

        Self {
            algorithm,
            generations_run: 0,
        }
    }
}

impl EvolutionStrategy for ClassicEvolution {
    fn evolve(&mut self, world: &SimulationWorld) -> Result<EvolutionResult, EvolutionError> {
        let result = self.algorithm.evolve(world)?;
        self.generations_run += 1;
        Ok(result)
    }

    fn get_config(&self) -> &EvolutionConfig {
        &self.algorithm.config
    }

    fn update_config(&mut self, config: EvolutionConfig) {
        self.algorithm.config = config;
    }

    fn reset(&mut self) {
        self.generations_run = 0;
    }
}

/// エリート保存戦略
pub struct ElitistEvolution {
    algorithm: GeneticAlgorithm,
    generations_run: u32,
}

impl ElitistEvolution {
    pub fn new(custom_config: Option<EvolutionConfig>) -> Self {
        let config = custom_config.unwrap_or_else(|| EvolutionConfig {
            mutation_rate: 0.05,
            crossover_rate: 0.9,
            elitism_rate: 0.2, // 20%をエリート保存
            ..EvolutionConfig::default()
        });

        let algorithm = GeneticAlgorithm::new(
            Box::new(TournamentSelection::new(3)),
            Box::new(TwoPointCrossover),
            Box::new(GaussianMutation::new(0.05)),
            config,
        );

        Self {
            algorithm,
            generations_run: 0,
        }
    }
}

impl EvolutionStrategy for ElitistEvolution {
    fn evolve(&mut self, world: &SimulationWorld) -> Result<EvolutionResult, EvolutionError> {
        let result = self.algorithm.evolve(world)?;
        self.generations_run += 1;
        Ok(result)
    }

    fn get_config(&self) -> &EvolutionConfig {
        &self.algorithm.config
    }

    fn update_config(&mut self, config: EvolutionConfig) {
        self.algorithm.config = config;
    }

    fn reset(&mut self) {
        self.generations_run = 0;
    }
}

/// 定常状態遺伝的アルゴリズム
pub struct SteadyStateEvolution {
    algorithm: GeneticAlgorithm,
    replacement_rate: f64,
    generations_run: u32,
}

impl SteadyStateEvolution {
    pub fn new(custom_config: Option<EvolutionConfig>) -> Self {
        let config = custom_config.unwrap_or_else(|| EvolutionConfig {
            mutation_rate: 0.08,
            crossover_rate: 0.85,
            elitism_rate: 0.05,
            ..EvolutionConfig::default()
        });

        let algorithm = GeneticAlgorithm::new(
            Box::new(TournamentSelection::new(2)),
            Box::new(UniformCrossover::new(0.5)),
            Box::new(GaussianMutation::new(0.08)),
            config,
        );

        Self {
            algorithm,
            replacement_rate: 0.1, // 毎世代10%を置換
            generations_run: 0,
        }
    }
}

impl EvolutionStrategy for SteadyStateEvolution {
    fn evolve(&mut self, world: &SimulationWorld) -> Result<EvolutionResult, EvolutionError> {
        // 定常状態では少数のエージェントのみを置換
        let mut result = self.algorithm.evolve(world)?;

        let replacement_count = (world.agents.len() as f64 * self.replacement_rate) as usize;
        result.new_generation.truncate(replacement_count.max(1));

        self.generations_run += 1;
        Ok(result)
    }

    fn get_config(&self) -> &EvolutionConfig {
        &self.algorithm.config
    }

    fn update_config(&mut self, config: EvolutionConfig) {
        self.algorithm.config = config;
    }

    fn reset(&mut self) {
        self.generations_run = 0;
    }
}

/// 島モデル進化
pub struct IslandModelEvolution {
    islands: Vec<GeneticAlgorithm>,
    migration_rate: f64,
    migration_interval: u32,
    generations_run: u32,
}

impl IslandModelEvolution {
    pub fn new(custom_config: Option<EvolutionConfig>) -> Self {
        let config = custom_config.unwrap_or_default();

        // 4つの島を作成（異なる戦略）
        let islands = vec![
            GeneticAlgorithm::new(
                Box::new(TournamentSelection::new(2)),
                Box::new(OnePointCrossover),
                Box::new(GaussianMutation::new(0.1)),
                config.clone(),
            ),
            GeneticAlgorithm::new(
                Box::new(RouletteSelection),
                Box::new(TwoPointCrossover),
                Box::new(UniformMutation::new(0.2)),
                config.clone(),
            ),
            GeneticAlgorithm::new(
                Box::new(RankSelection::new(1.5)),
                Box::new(UniformCrossover::new(0.5)),
                Box::new(PolynomialMutation::new(20.0)),
                config.clone(),
            ),
            GeneticAlgorithm::new(
                Box::new(TournamentSelection::new(3)),
                Box::new(ArithmeticCrossover::new(0.5)),
                Box::new(GaussianMutation::new(0.05)),
                config,
            ),
        ];

        Self {
            islands,
            migration_rate: 0.05,
            migration_interval: 10,
            generations_run: 0,
        }
    }

    fn migrate_agents(&mut self, populations: &mut [Vec<Agent>]) {
        if populations.len() < 2 {
            return;
        }

        let migration_count = (populations[0].len() as f64 * self.migration_rate) as usize;
        if migration_count == 0 {
            return;
        }

        // 環状移住: 0->1->2->3->0
        for i in 0..populations.len() {
            let next_island = (i + 1) % populations.len();

            // 最高適応度のエージェントを選択して移住
            let mut emigrants = Vec::new();
            populations[i].sort_by(|a, b| {
                b.fitness()
                    .partial_cmp(&a.fitness())
                    .unwrap_or(std::cmp::Ordering::Equal)
            });

            for _ in 0..migration_count.min(populations[i].len()) {
                if let Some(agent) = populations[i].pop() {
                    emigrants.push(agent);
                }
            }

            // 移住先の島に追加
            populations[next_island].extend(emigrants);
        }
    }
}

impl EvolutionStrategy for IslandModelEvolution {
    fn evolve(&mut self, world: &SimulationWorld) -> Result<EvolutionResult, EvolutionError> {
        // 人口を島に分割
        let island_size = world.agents.len() / self.islands.len();
        let mut island_populations: Vec<Vec<Agent>> = Vec::new();

        for i in 0..self.islands.len() {
            let start = i * island_size;
            let end = if i == self.islands.len() - 1 {
                world.agents.len()
            } else {
                (i + 1) * island_size
            };

            island_populations.push(world.agents[start..end].to_vec());
        }

        // 各島で進化
        let mut evolved_populations = Vec::new();
        for (i, population) in island_populations.iter().enumerate() {
            let island_world = SimulationWorld {
                dimensions: world.dimensions,
                agents: population.clone(),
                generation: world.generation,
                environment: world.environment.clone(),
            };

            let result = self.islands[i].evolve(&island_world)?;
            evolved_populations.push(result.new_generation);
        }

        // 移住実行
        if self.generations_run % self.migration_interval == 0 {
            self.migrate_agents(&mut evolved_populations);
        }

        // 全島の人口を統合
        let mut combined_population = Vec::new();
        for mut pop in evolved_populations {
            combined_population.append(&mut pop);
        }

        self.generations_run += 1;

        // 統合結果を返す
        Ok(EvolutionResult {
            new_generation: combined_population,
            metrics: crate::evolution::EvolutionMetrics {
                generation_time: std::time::Duration::from_millis(0),
                fitness_improvement: 0.0,
                max_fitness_improvement: 0.0,
                diversity_score: 0.0,
                selection_intensity: 2.0,
                mutation_rate: 0.1,
                crossover_rate: 0.8,
                population_size: world.agents.len(),
            },
            convergence_info: crate::evolution::ConvergenceInfo {
                diversity_score: 0.0,
                fitness_variance: 0.0,
                is_converged: false,
                generations_to_convergence: None,
            },
        })
    }

    fn get_config(&self) -> &EvolutionConfig {
        &self.islands[0].config
    }

    fn update_config(&mut self, config: EvolutionConfig) {
        for island in &mut self.islands {
            island.config = config.clone();
        }
    }

    fn reset(&mut self) {
        self.generations_run = 0;
    }
}

/// 適応的進化
pub struct AdaptiveEvolution {
    algorithm: GeneticAlgorithm,
    performance_history: Vec<f64>,
    adaptation_threshold: f64,
    generations_run: u32,
}

impl AdaptiveEvolution {
    pub fn new(custom_config: Option<EvolutionConfig>) -> Self {
        let mut config = custom_config.unwrap_or_default();
        config.adaptive_mutation = true;

        let algorithm = GeneticAlgorithm::new(
            Box::new(TournamentSelection::new(2)),
            Box::new(UniformCrossover::new(0.5)),
            Box::new(GaussianMutation::new(0.1)),
            config,
        );

        Self {
            algorithm,
            performance_history: Vec::new(),
            adaptation_threshold: 5,
            generations_run: 0,
        }
    }

    fn adapt_parameters(&mut self, current_fitness: f64) {
        self.performance_history.push(current_fitness);

        if self.performance_history.len() > 10 {
            self.performance_history.remove(0);
        }

        if self.performance_history.len() >= 5 {
            let recent_avg = self.performance_history.iter().rev().take(3).sum::<f64>() / 3.0;
            let older_avg = self.performance_history.iter().take(3).sum::<f64>() / 3.0;

            let improvement = recent_avg - older_avg;

            if improvement < self.adaptation_threshold {
                // 改善が少ない場合はパラメータを調整
                self.algorithm.config.mutation_rate =
                    (self.algorithm.config.mutation_rate * 1.2).min(0.3);
                self.algorithm.config.selection_pressure =
                    (self.algorithm.config.selection_pressure * 0.9).max(1.0);
            } else if improvement > self.adaptation_threshold * 2.0 {
                // 大幅改善の場合は現在の設定を維持/強化
                self.algorithm.config.mutation_rate =
                    (self.algorithm.config.mutation_rate * 0.9).max(0.01);
                self.algorithm.config.selection_pressure =
                    (self.algorithm.config.selection_pressure * 1.1).min(5.0);
            }
        }
    }
}

impl EvolutionStrategy for AdaptiveEvolution {
    fn evolve(&mut self, world: &SimulationWorld) -> Result<EvolutionResult, EvolutionError> {
        let result = self.algorithm.evolve(world)?;

        // 現在の最高適応度に基づいてパラメータを適応
        let max_fitness = world
            .agents
            .iter()
            .map(|a| a.fitness())
            .fold(f64::NEG_INFINITY, |a, b| a.max(b));

        self.adapt_parameters(max_fitness);
        self.generations_run += 1;

        Ok(result)
    }

    fn get_config(&self) -> &EvolutionConfig {
        &self.algorithm.config
    }

    fn update_config(&mut self, config: EvolutionConfig) {
        self.algorithm.config = config;
    }

    fn reset(&mut self) {
        self.generations_run = 0;
        self.performance_history.clear();
    }
}

/// 多目的進化（NSGA-II風）
pub struct MultiObjectiveEvolution {
    algorithm: GeneticAlgorithm,
    objectives: Vec<ObjectiveFunction>,
    generations_run: u32,
}

/// 目的関数の種類
pub enum ObjectiveFunction {
    MaximizeFitness,
    MaximizeCooperation,
    MinimizeAggression,
    MaximizeDiversity,
}

impl MultiObjectiveEvolution {
    pub fn new(custom_config: Option<EvolutionConfig>) -> Self {
        let config = custom_config.unwrap_or_default();

        let algorithm = GeneticAlgorithm::new(
            Box::new(TournamentSelection::new(2)),
            Box::new(UniformCrossover::new(0.5)),
            Box::new(GaussianMutation::new(0.1)),
            config,
        );

        Self {
            algorithm,
            objectives: vec![
                ObjectiveFunction::MaximizeFitness,
                ObjectiveFunction::MaximizeCooperation,
                ObjectiveFunction::MinimizeAggression,
            ],
            generations_run: 0,
        }
    }

    fn evaluate_objectives(&self, agent: &Agent) -> Vec<f64> {
        self.objectives
            .iter()
            .map(|obj| {
                match obj {
                    ObjectiveFunction::MaximizeFitness => agent.fitness(),
                    ObjectiveFunction::MaximizeCooperation => agent.traits.cooperation_rate,
                    ObjectiveFunction::MinimizeAggression => 1.0 - agent.traits.aggression_level,
                    ObjectiveFunction::MaximizeDiversity => {
                        // 簡易的な多様性指標
                        let trait_variance = [
                            agent.traits.cooperation_rate,
                            agent.traits.movement_rate,
                            agent.traits.aggression_level,
                            agent.traits.learning_rate,
                        ]
                        .iter()
                        .map(|&x| (x - 0.5).powi(2))
                        .sum::<f64>();
                        trait_variance / 4.0
                    }
                }
            })
            .collect()
    }

    fn pareto_rank(&self, agents: &[Agent]) -> Vec<usize> {
        let mut ranks = vec![0; agents.len()];
        let objectives: Vec<Vec<f64>> = agents
            .iter()
            .map(|agent| self.evaluate_objectives(agent))
            .collect();

        for i in 0..agents.len() {
            for j in 0..agents.len() {
                if i != j && self.dominates(&objectives[j], &objectives[i]) {
                    ranks[i] += 1;
                }
            }
        }

        ranks
    }

    fn dominates(&self, obj1: &[f64], obj2: &[f64]) -> bool {
        let mut at_least_one_better = false;

        for (val1, val2) in obj1.iter().zip(obj2.iter()) {
            if val1 < val2 {
                return false; // obj1はobj2に劣る
            }
            if val1 > val2 {
                at_least_one_better = true;
            }
        }

        at_least_one_better
    }
}

impl EvolutionStrategy for MultiObjectiveEvolution {
    fn evolve(&mut self, world: &SimulationWorld) -> Result<EvolutionResult, EvolutionError> {
        // パレートランキングを考慮した選択を実装
        let ranks = self.pareto_rank(&world.agents);

        // 通常の進化を実行
        let mut result = self.algorithm.evolve(world)?;

        // パレートフロントに基づいて結果を調整
        result.new_generation.sort_by_key(|agent| {
            let objectives = self.evaluate_objectives(agent);
            // 単純化: 最初の目的関数の負の値でソート
            -(objectives[0] * 1000.0) as i64
        });

        self.generations_run += 1;
        Ok(result)
    }

    fn get_config(&self) -> &EvolutionConfig {
        &self.algorithm.config
    }

    fn update_config(&mut self, config: EvolutionConfig) {
        self.algorithm.config = config;
    }

    fn reset(&mut self) {
        self.generations_run = 0;
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::core::{Agent, AgentId, AgentTraits, Position, WorldDimensions};

    #[test]
    fn test_strategy_factory() {
        let strategy =
            EvolutionStrategyFactory::create_strategy(EvolutionStrategyType::Classic, None);

        // 基本的な作成テスト
        assert!(strategy.get_config().mutation_rate > 0.0);
    }

    #[test]
    fn test_classic_evolution() {
        let mut strategy = ClassicEvolution::new(None);
        let mut world = SimulationWorld::new(WorldDimensions::new(10, 10).unwrap());

        // テスト用エージェントを追加
        for i in 0..5 {
            let agent = Agent::new(
                AgentId(i),
                Position::new(i % 10, i / 10),
                AgentTraits {
                    cooperation_rate: 0.5,
                    movement_rate: 0.5,
                    aggression_level: 0.5,
                    learning_rate: 0.5,
                },
            );
            world.add_agent(agent);
        }

        let result = strategy.evolve(&world).unwrap();
        assert_eq!(result.new_generation.len(), 5);
    }

    #[test]
    fn test_strategy_recommendation() {
        let rec1 = EvolutionStrategyFactory::recommend_strategy(50, 0.5, true);
        assert_eq!(rec1, EvolutionStrategyType::Elitist);

        let rec2 = EvolutionStrategyFactory::recommend_strategy(1000, 0.9, false);
        assert_eq!(rec2, EvolutionStrategyType::IslandModel);
    }
}
