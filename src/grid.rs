use crate::agent::Agent;
use rand::Rng;

pub struct Grid {
    pub width: usize,
    pub height: usize,
    pub agents: Vec<Agent>,
}

impl Grid {
    pub fn new(width: usize, height: usize) -> Self {
        Grid {
            width,
            height,
            agents: Vec::new(),
        }
    }
    
    pub fn add_agent(&mut self, agent: Agent) {
        self.agents.push(agent);
    }
    
    pub fn populate_agents(&mut self, density: f64) {
        let mut rng = rand::thread_rng();
        let total_cells = self.width * self.height;
        let target_agents = (total_cells as f64 * density) as usize;
        
        for _ in 0..target_agents {
            let x = rng.gen_range(0..self.width);
            let y = rng.gen_range(0..self.height);
            let cooperation_rate = rng.gen_range(0.0..=1.0);
            let movement_rate = rng.gen_range(0.0..=1.0);
            
            let agent = Agent::new(x, y, cooperation_rate, movement_rate);
            self.add_agent(agent);
        }
    }
    
    pub fn get_agent_at(&self, x: usize, y: usize) -> Option<&Agent> {
        self.agents.iter().find(|agent| agent.x == x && agent.y == y)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_grid_creation() {
        let grid = Grid::new(10, 8);
        
        assert_eq!(grid.width, 10);
        assert_eq!(grid.height, 8);
        assert_eq!(grid.agents.len(), 0);
    }

    #[test]
    fn test_grid_add_agent() {
        let mut grid = Grid::new(10, 8);
        let agent = Agent::new(3, 4, 0.5, 0.2);
        
        grid.add_agent(agent);
        
        assert_eq!(grid.agents.len(), 1);
        assert_eq!(grid.agents[0].x, 3);
        assert_eq!(grid.agents[0].y, 4);
    }

    #[test]
    fn test_grid_populate_agents() {
        let mut grid = Grid::new(10, 10);
        
        grid.populate_agents(0.3);
        
        // With 30% density on 100 cells, expect around 30 agents (±5 for randomness)
        assert!(grid.agents.len() >= 25 && grid.agents.len() <= 35);
        
        // Check all agents are within bounds
        for agent in &grid.agents {
            assert!(agent.x < grid.width);
            assert!(agent.y < grid.height);
        }
    }

    #[test]
    fn test_grid_get_agent_at() {
        let mut grid = Grid::new(10, 10);
        let agent = Agent::new(3, 4, 0.7, 0.2);
        grid.add_agent(agent);
        
        assert!(grid.get_agent_at(3, 4).is_some());
        assert!(grid.get_agent_at(2, 4).is_none());
        assert_eq!(grid.get_agent_at(3, 4).unwrap().cooperation_rate, 0.7);
    }
}