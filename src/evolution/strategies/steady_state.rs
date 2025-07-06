// ========================================
// Steady State Evolution Strategy - 定常状態遺伝的アルゴリズム
// ========================================

use crate::core::SimulationWorld;
use crate::evolution::{
    EvolutionConfig, EvolutionError, EvolutionResult, GeneticAlgorithm,
    TournamentSelection, UniformCrossover, GaussianMutation
};
use super::types::EvolutionStrategy;

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