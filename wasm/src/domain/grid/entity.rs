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
            return Err(format!("Agent position ({}, {}) is out of bounds for grid {}x{}", 
                agent.position.x, agent.position.y, self.width, self.height));
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
            return Err(format!("Position ({}, {}) is out of bounds for grid {}x{}", 
                new_position.x, new_position.y, self.width, self.height));
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
