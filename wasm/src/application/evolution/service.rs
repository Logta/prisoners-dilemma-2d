use super::RouletteSelection;
use crate::application::simulation::SimulationConfig;
use crate::domain::agent::{Agent, Position};
use rand::Rng;
use std::collections::HashMap;
use uuid::Uuid;

pub struct EvolutionService;

impl EvolutionService {
    pub fn new() -> Self {
        Self
    }

    pub fn evolve(&self, current_agents: &HashMap<Uuid, Agent>) -> Vec<Agent> {
        self.evolve_with_config(current_agents, &SimulationConfig::default())
    }

    pub fn evolve_with_config(
        &self,
        current_agents: &HashMap<Uuid, Agent>,
        config: &SimulationConfig,
    ) -> Vec<Agent> {
        if current_agents.is_empty() {
            return Vec::new();
        }

        let parents = if config.strategy_complexity_penalty_enabled {
            RouletteSelection::select_parents_with_penalty(
                current_agents,
                config.strategy_complexity_penalty_rate,
            )
        } else {
            RouletteSelection::select_parents(current_agents)
        };

        let mut new_agents = Vec::new();
        let mut rng = rand::thread_rng();

        let agent_count = current_agents.len();
        let grid_positions = self.generate_positions(agent_count);

        for (_i, position) in grid_positions.iter().enumerate().take(agent_count) {
            if parents.len() < 2 {
                let agent = Agent::random(*position);
                new_agents.push(agent);
                continue;
            }

            let parent1_idx = rng.gen_range(0..parents.len());
            let parent2_idx = rng.gen_range(0..parents.len());

            let parent1 = &parents[parent1_idx];
            let parent2 = &parents[parent2_idx];

            let mut child = Agent::crossover(parent1, parent2, *position);
            child.mutate();

            new_agents.push(child);
        }

        new_agents
    }

    fn generate_positions(&self, count: usize) -> Vec<Position> {
        let mut positions = Vec::new();
        let mut rng = rand::thread_rng();
        let grid_size = 100;
        let max_positions = grid_size * grid_size;

        // If we need more positions than available, allow overlapping
        if count > max_positions {
            for _ in 0..count {
                let x = rng.gen_range(0..grid_size);
                let y = rng.gen_range(0..grid_size);
                positions.push(Position::new(x, y));
            }
        } else {
            // Try to avoid overlapping positions
            let mut attempts = 0;
            for _ in 0..count {
                loop {
                    let x = rng.gen_range(0..grid_size);
                    let y = rng.gen_range(0..grid_size);
                    let position = Position::new(x, y);

                    if !positions.contains(&position) || attempts > max_positions * 2 {
                        positions.push(position);
                        break;
                    }
                    attempts += 1;
                }
            }
        }

        positions
    }
}
