// ========================================
// Adaptive Evolution Strategy - 適応的進化
// ========================================

use crate::core::SimulationWorld;
use crate::evolution::{
    EvolutionConfig, EvolutionError, EvolutionResult, GeneticAlgorithm,
    TournamentSelection, UniformCrossover, GaussianMutation
};
use super::types::EvolutionStrategy;

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
            adaptation_threshold: 5.0,
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