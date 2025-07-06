// ========================================
// Island Model Evolution Strategy - 島モデル進化
// ========================================

use crate::core::{Agent, SimulationWorld};
use crate::evolution::{
    EvolutionConfig, EvolutionError, EvolutionResult, GeneticAlgorithm,
    TournamentSelection, OnePointCrossover, TwoPointCrossover, UniformCrossover,
    ArithmeticCrossover, RouletteSelection, RankSelection,
    GaussianMutation, UniformMutation, PolynomialMutation
};
use super::types::EvolutionStrategy;

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
        if populations.len() < 2 || populations.is_empty() {
            return;
        }

        let first_pop_len = populations.first().map(|p| p.len()).unwrap_or(0);
        let migration_count = (first_pop_len as f64 * self.migration_rate) as usize;
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
        self.islands.first().map(|i| &i.config).unwrap_or_else(|| {
            panic!("Island model must have at least one island")
        })
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