use crate::domain::agent::{Agent, Position};
use std::collections::HashMap;
use uuid::Uuid;

pub struct Grid {
    width: usize,
    height: usize,
    agents: HashMap<Uuid, Agent>,
    position_map: HashMap<Position, Uuid>,
    torus_mode: bool,
}

impl Grid {
    pub fn new(width: usize, height: usize) -> Self {
        Self {
            width,
            height,
            agents: HashMap::new(),
            position_map: HashMap::new(),
            torus_mode: false,
        }
    }

    pub fn with_torus_mode(mut self, torus_mode: bool) -> Self {
        self.torus_mode = torus_mode;
        self
    }

    pub fn set_torus_mode(&mut self, torus_mode: bool) {
        self.torus_mode = torus_mode;
    }

    pub fn width(&self) -> usize {
        self.width
    }

    pub fn height(&self) -> usize {
        self.height
    }

    pub fn add_agent(&mut self, agent: Agent) -> Result<(), String> {
        // Validate position bounds
        if agent.position.x >= self.width || agent.position.y >= self.height {
            return Err(format!(
                "Agent position ({}, {}) is out of bounds for grid {}x{}",
                agent.position.x, agent.position.y, self.width, self.height
            ));
        }

        if self.position_map.contains_key(&agent.position) {
            return Err("Position already occupied".to_string());
        }

        let id = agent.id;
        let position = agent.position;

        self.agents.insert(id, agent);
        self.position_map.insert(position, id);

        Ok(())
    }

    pub fn remove_agent(&mut self, id: &Uuid) -> Option<Agent> {
        if let Some(agent) = self.agents.remove(id) {
            self.position_map.remove(&agent.position);
            Some(agent)
        } else {
            None
        }
    }

    pub fn get_agent(&self, id: &Uuid) -> Option<&Agent> {
        self.agents.get(id)
    }

    pub fn get_agent_mut(&mut self, id: &Uuid) -> Option<&mut Agent> {
        self.agents.get_mut(id)
    }

    pub fn get_agent_at_position(&self, position: &Position) -> Option<&Agent> {
        // Validate position bounds
        if position.x >= self.width || position.y >= self.height {
            return None;
        }

        self.position_map
            .get(position)
            .and_then(|id| self.agents.get(id))
    }

    pub fn get_neighbors(&self, position: &Position) -> Vec<&Agent> {
        position
            .neighbors_with_mode(self.width, self.height, self.torus_mode)
            .iter()
            .filter_map(|pos| self.get_agent_at_position(pos))
            .collect()
    }

    pub fn get_neighbors_mut(&mut self, position: &Position) -> Vec<Uuid> {
        position
            .neighbors_with_mode(self.width, self.height, self.torus_mode)
            .iter()
            .filter_map(|pos| self.position_map.get(pos))
            .copied()
            .collect()
    }

    pub fn is_position_free(&self, position: &Position) -> bool {
        !self.position_map.contains_key(position)
    }

    pub fn move_agent(&mut self, id: &Uuid, new_position: Position) -> Result<(), String> {
        // Validate position bounds
        if new_position.x >= self.width || new_position.y >= self.height {
            return Err(format!(
                "Position ({}, {}) is out of bounds for grid {}x{}",
                new_position.x, new_position.y, self.width, self.height
            ));
        }

        if !self.is_position_free(&new_position) {
            return Err("Target position is occupied".to_string());
        }

        if let Some(agent) = self.agents.get_mut(id) {
            let old_position = agent.position;
            agent.move_to(new_position);

            self.position_map.remove(&old_position);
            self.position_map.insert(new_position, *id);

            Ok(())
        } else {
            Err("Agent not found".to_string())
        }
    }

    pub fn get_empty_neighbors(&self, position: &Position) -> Vec<Position> {
        position
            .neighbors_with_mode(self.width, self.height, self.torus_mode)
            .into_iter()
            .filter(|pos| self.is_position_free(pos))
            .collect()
    }

    pub fn agents(&self) -> &HashMap<Uuid, Agent> {
        &self.agents
    }

    pub fn agents_mut(&mut self) -> &mut HashMap<Uuid, Agent> {
        &mut self.agents
    }

    pub fn agent_count(&self) -> usize {
        self.agents.len()
    }

    pub fn clear(&mut self) {
        self.agents.clear();
        self.position_map.clear();
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::domain::agent::{MovementStrategy, StrategyType};

    fn agent_at(x: usize, y: usize) -> Agent {
        Agent::new(
            Position::new(x, y),
            StrategyType::AllCooperate,
            0.5,
            MovementStrategy::Settler,
        )
    }

    #[test]
    fn add_agent_rejects_out_of_bounds_on_either_axis_and_occupied_cells() {
        let mut grid = Grid::new(4, 3);
        assert!(grid.add_agent(agent_at(4, 0)).is_err());
        assert!(grid.add_agent(agent_at(0, 3)).is_err());
        assert!(grid.add_agent(agent_at(3, 2)).is_ok());
        assert!(grid.add_agent(agent_at(3, 2)).is_err());
        assert_eq!(grid.agent_count(), 1);
    }

    #[test]
    fn lookups_find_added_agents() {
        let mut grid = Grid::new(4, 3);
        let a = agent_at(1, 1);
        let id = a.id;
        grid.add_agent(a).unwrap();

        assert_eq!(grid.get_agent(&id).map(|a| a.id), Some(id));
        assert_eq!(
            grid.get_agent_at_position(&Position::new(1, 1))
                .map(|a| a.id),
            Some(id)
        );
        assert!(grid.get_agent_at_position(&Position::new(2, 1)).is_none());
        assert!(!grid.is_position_free(&Position::new(1, 1)));
        assert!(grid.is_position_free(&Position::new(2, 1)));

        grid.get_agent_mut(&id).unwrap().score = 42;
        assert_eq!(grid.get_agent(&id).unwrap().score, 42);
        grid.agents_mut().get_mut(&id).unwrap().score = 7;
        assert_eq!(grid.agents()[&id].score, 7);
    }

    #[test]
    fn get_agent_at_position_ignores_out_of_bounds_on_either_axis() {
        let mut grid = Grid::new(4, 3);
        grid.add_agent(agent_at(3, 2)).unwrap();
        // 範囲外の座標は position_map を参照する前に弾く
        grid.position_map
            .insert(Position::new(4, 0), *grid.agents.keys().next().unwrap());
        grid.position_map
            .insert(Position::new(0, 3), *grid.agents.keys().next().unwrap());
        assert!(grid.get_agent_at_position(&Position::new(4, 0)).is_none());
        assert!(grid.get_agent_at_position(&Position::new(0, 3)).is_none());
        assert!(grid.get_agent_at_position(&Position::new(3, 2)).is_some());
    }

    #[test]
    fn remove_agent_frees_its_cell() {
        let mut grid = Grid::new(4, 3);
        let a = agent_at(2, 2);
        let id = a.id;
        grid.add_agent(a).unwrap();

        assert_eq!(grid.remove_agent(&id).map(|a| a.id), Some(id));
        assert!(grid.is_position_free(&Position::new(2, 2)));
        assert_eq!(grid.agent_count(), 0);
        assert!(grid.remove_agent(&id).is_none());
    }

    #[test]
    fn neighbor_queries_respect_torus_mode() {
        let mut grid = Grid::new(3, 3);
        let corner = agent_at(0, 0);
        let far = agent_at(2, 2);
        let far_id = far.id;
        grid.add_agent(corner).unwrap();
        grid.add_agent(far).unwrap();

        assert!(grid.get_neighbors(&Position::new(0, 0)).is_empty());
        assert!(grid.get_neighbors_mut(&Position::new(0, 0)).is_empty());
        assert_eq!(grid.get_empty_neighbors(&Position::new(0, 0)).len(), 3);

        grid.set_torus_mode(true);
        let neighbors: Vec<Uuid> = grid
            .get_neighbors(&Position::new(0, 0))
            .iter()
            .map(|a| a.id)
            .collect();
        assert_eq!(neighbors, vec![far_id]);
        assert_eq!(grid.get_neighbors_mut(&Position::new(0, 0)), vec![far_id]);
        assert_eq!(grid.get_empty_neighbors(&Position::new(0, 0)).len(), 7);
    }

    #[test]
    fn move_agent_validates_bounds_occupancy_and_existence() {
        let mut grid = Grid::new(4, 3);
        let a = agent_at(0, 0);
        let id = a.id;
        grid.add_agent(a).unwrap();
        grid.add_agent(agent_at(1, 0)).unwrap();

        assert!(grid.move_agent(&id, Position::new(4, 0)).is_err());
        assert!(grid.move_agent(&id, Position::new(0, 3)).is_err());
        assert!(grid.move_agent(&id, Position::new(1, 0)).is_err());
        assert!(
            grid.move_agent(&Uuid::new_v4(), Position::new(2, 2))
                .is_err()
        );
        assert_eq!(grid.get_agent(&id).unwrap().position, Position::new(0, 0));

        assert!(grid.move_agent(&id, Position::new(3, 2)).is_ok());
        assert_eq!(grid.get_agent(&id).unwrap().position, Position::new(3, 2));
        assert!(grid.is_position_free(&Position::new(0, 0)));
        assert_eq!(
            grid.get_agent_at_position(&Position::new(3, 2))
                .map(|a| a.id),
            Some(id)
        );
    }

    #[test]
    fn clear_removes_everything() {
        let mut grid = Grid::new(2, 2);
        grid.add_agent(agent_at(0, 0)).unwrap();
        grid.add_agent(agent_at(1, 1)).unwrap();
        assert_eq!(grid.agent_count(), 2);
        grid.clear();
        assert_eq!(grid.agent_count(), 0);
        assert!(grid.is_position_free(&Position::new(0, 0)));
    }
}
