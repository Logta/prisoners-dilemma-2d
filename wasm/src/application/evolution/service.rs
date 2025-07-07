use crate::domain::agent::{Agent, Position};
use super::RouletteSelection;
use rand::Rng;
use std::collections::HashMap;
use uuid::Uuid;

pub struct EvolutionService;

impl EvolutionService {
    pub fn new() -> Self {
        Self
    }

    pub fn evolve(&self, current_agents: &HashMap<Uuid, Agent>) -> Vec<Agent> {
        if current_agents.is_empty() {
            return Vec::new();
        }

        let parents = RouletteSelection::select_parents(current_agents);
        let mut new_agents = Vec::new();
        let mut rng = rand::thread_rng();

        let agent_count = current_agents.len();
        let grid_positions = self.generate_positions(agent_count);

        for i in 0..agent_count {
            if parents.len() < 2 {
                let agent = Agent::random(grid_positions[i]);
                new_agents.push(agent);
                continue;
            }

            let parent1_idx = rng.gen_range(0..parents.len());
            let parent2_idx = rng.gen_range(0..parents.len());
            
            let parent1 = &parents[parent1_idx];
            let parent2 = &parents[parent2_idx];
            
            let mut child = Agent::crossover(parent1, parent2, grid_positions[i]);
            child.mutate();
            
            new_agents.push(child);
        }

        new_agents
    }

    fn generate_positions(&self, count: usize) -> Vec<Position> {
        let mut positions = Vec::new();
        let mut rng = rand::thread_rng();
        let grid_size = 100;

        for _ in 0..count {
            loop {
                let x = rng.gen_range(0..grid_size);
                let y = rng.gen_range(0..grid_size);
                let position = Position::new(x, y);
                
                if !positions.contains(&position) {
                    positions.push(position);
                    break;
                }
            }
        }

        positions
    }
}