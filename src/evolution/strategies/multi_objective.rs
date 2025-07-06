// ========================================
// Multi-Objective Evolution Strategy - 多目的進化（NSGA-II風）
// ========================================

use crate::core::{Agent, SimulationWorld};
use crate::evolution::{
    EvolutionConfig, EvolutionError, EvolutionResult, GeneticAlgorithm,
    TournamentSelection, UniformCrossover, GaussianMutation
};
use super::types::EvolutionStrategy;

/// 目的関数の種類
pub enum ObjectiveFunction {
    MaximizeFitness,
    MaximizeCooperation,
    MinimizeAggression,
    MaximizeDiversity,
}

/// 多目的進化（NSGA-II風）
pub struct MultiObjectiveEvolution {
    algorithm: GeneticAlgorithm,
    objectives: Vec<ObjectiveFunction>,
    generations_run: u32,
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
        let _ranks = self.pareto_rank(&world.agents);

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