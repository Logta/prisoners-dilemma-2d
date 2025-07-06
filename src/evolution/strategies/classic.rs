// ========================================
// Classic Evolution Strategy - クラシック遺伝的アルゴリズム
// ========================================

use crate::core::SimulationWorld;
use crate::evolution::{
    EvolutionConfig, EvolutionError, EvolutionResult, GeneticAlgorithm,
    RouletteSelection, OnePointCrossover, GaussianMutation
};
use super::types::EvolutionStrategy;

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

#[cfg(test)]
mod tests {
    use super::*;
    use crate::core::{Agent, AgentId, AgentTraits, Position, WorldDimensions};

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
}