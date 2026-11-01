use super::Grid;
use crate::domain::agent::{Agent, Position};
use rand::RngExt;
use rand::seq::SliceRandom;

pub struct GridService;

impl GridService {
    /// 空いているマスからランダムに `agent_count` 個を選び、ランダムなエージェントを配置する。
    ///
    /// 空きマスを列挙してシャッフルするため、空きマスが足りている限り必ず成功する
    /// （以前はランダムな座標を試行回数上限つきで引いていたため、グリッドが密な場合に
    /// 空きがあっても失敗することがあった）。
    pub fn initialize_random_agents(grid: &mut Grid, agent_count: usize) -> Result<(), String> {
        if agent_count > grid.width() * grid.height() {
            return Err("Too many agents for grid size".to_string());
        }

        let (width, height) = (grid.width(), grid.height());
        let mut free_positions: Vec<Position> = (0..width)
            .flat_map(|x| (0..height).map(move |y| Position::new(x, y)))
            .filter(|position| grid.is_position_free(position))
            .collect();

        if free_positions.len() < agent_count {
            return Err(format!(
                "Could only place {} out of {agent_count} agents",
                free_positions.len()
            ));
        }

        free_positions.shuffle(&mut rand::rng());
        for position in free_positions.into_iter().take(agent_count) {
            grid.add_agent(Agent::random(position))?;
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
                    let mut rng = rand::rng();
                    let target_position =
                        empty_neighbors[rng.random_range(0..empty_neighbors.len())];
                    movements.push((agent.id, target_position));
                }
            }
        }

        for (agent_id, new_position) in movements {
            let _ = grid.move_agent(&agent_id, new_position);
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::domain::agent::{MovementStrategy, StrategyType};
    use std::collections::HashSet;

    #[test]
    fn initialize_fills_exactly_the_requested_number_of_cells() {
        let mut grid = Grid::new(4, 4);
        GridService::initialize_random_agents(&mut grid, 16).expect("満杯まで配置できるはず");
        assert_eq!(grid.agent_count(), 16);
        let positions: HashSet<_> = grid.agents().values().map(|a| a.position).collect();
        assert_eq!(positions.len(), 16);
    }

    #[test]
    fn initialize_rejects_more_agents_than_cells() {
        let mut grid = Grid::new(2, 2);
        assert!(GridService::initialize_random_agents(&mut grid, 5).is_err());
        assert_eq!(grid.agent_count(), 0);
    }

    #[test]
    fn initialize_fails_when_not_enough_free_cells_remain() {
        let mut grid = Grid::new(2, 2);
        GridService::initialize_random_agents(&mut grid, 3).unwrap();
        assert!(GridService::initialize_random_agents(&mut grid, 2).is_err());
        assert!(GridService::initialize_random_agents(&mut grid, 1).is_ok());
        assert_eq!(grid.agent_count(), 4);
    }

    fn single_agent_grid(mobility: f64) -> (Grid, uuid::Uuid) {
        let mut grid = Grid::new(3, 3);
        let agent = Agent::new(
            Position::new(1, 1),
            StrategyType::AllCooperate,
            mobility,
            MovementStrategy::Explorer,
        );
        let id = agent.id;
        grid.add_agent(agent).unwrap();
        (grid, id)
    }

    #[test]
    fn process_movements_moves_agents_that_decide_to_move() {
        let (mut grid, id) = single_agent_grid(1.0);
        GridService::process_movements(&mut grid, false);
        let moved_to = grid.get_agent(&id).unwrap().position;
        assert_ne!(moved_to, Position::new(1, 1));
        assert!(Position::new(1, 1).neighbors(3, 3).contains(&moved_to));
        assert!(grid.is_position_free(&Position::new(1, 1)));
    }

    #[test]
    fn process_movements_keeps_agents_that_do_not_move() {
        let (mut grid, id) = single_agent_grid(0.0);
        GridService::process_movements(&mut grid, false);
        assert_eq!(grid.get_agent(&id).unwrap().position, Position::new(1, 1));
    }
}
