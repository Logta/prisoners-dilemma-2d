// ========================================
// Elitist Evolution Strategy - エリート保存戦略
// ========================================

use crate::core::SimulationWorld;
use crate::evolution::{
    EvolutionConfig, EvolutionError, EvolutionResult, GeneticAlgorithm,
    TournamentSelection, TwoPointCrossover, GaussianMutation
};
use super::types::EvolutionStrategy;

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