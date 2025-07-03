use crate::agent::Agent;

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
}