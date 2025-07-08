use super::Grid;
use crate::domain::agent::{Agent, Position};
use rand::Rng;

pub struct GridService;

impl GridService {
    pub fn initialize_random_agents(grid: &mut Grid, agent_count: usize) -> Result<(), String> {
        if agent_count > grid.width() * grid.height() {
            return Err("Too many agents for grid size".to_string());
        }

        let mut rng = rand::thread_rng();
        let mut placed_agents = 0;
        let max_attempts = agent_count * 10;
        let mut attempts = 0;

        while placed_agents < agent_count && attempts < max_attempts {
            let x = rng.gen_range(0..grid.width());
            let y = rng.gen_range(0..grid.height());
            let position = Position::new(x, y);

            if grid.is_position_free(&position) {
                let agent = Agent::random(position);
                if let Ok(()) = grid.add_agent(agent) {
                    placed_agents += 1;
                }
            }

            attempts += 1;
        }

        if placed_agents < agent_count {
            return Err(format!(
                "Could only place {} out of {} agents",
                placed_agents, agent_count
            ));
        }

        Ok(())
    }

    pub fn process_movements(grid: &mut Grid, torus_mode: bool) {
        let mut movements = Vec::new();

        for agent in grid.agents().values() {
            // 隣接エージェントの情報を収集
            let neighbor_positions =
                agent
                    .position
                    .neighbors_with_mode(grid.width(), grid.height(), torus_mode);
            let mut neighbor_agents = Vec::new();
            let mut neighbor_strategies = Vec::new();

            for neighbor_pos in neighbor_positions {
                if let Some(neighbor_agent) = grid.get_agent_at_position(&neighbor_pos) {
                    neighbor_agents.push(neighbor_agent);
                    neighbor_strategies.push(neighbor_agent.strategy);
                }
            }

            if agent.should_move_with_neighbors(&neighbor_agents, &neighbor_strategies) {
                let empty_neighbors = grid.get_empty_neighbors(&agent.position);
                if !empty_neighbors.is_empty() {
                    let mut rng = rand::thread_rng();
                    let target_position = empty_neighbors[rng.gen_range(0..empty_neighbors.len())];
                    movements.push((agent.id, target_position));
                }
            }
        }

        for (agent_id, new_position) in movements {
            let _ = grid.move_agent(&agent_id, new_position);
        }
    }
}
