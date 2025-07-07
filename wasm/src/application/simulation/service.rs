use crate::domain::{
    agent::Agent,
    game::GameService,
    grid::{Grid, GridService},
};
use super::SimulationStatistics;

pub struct SimulationService {
    grid: Grid,
    generation: u32,
    turn: u32,
    turns_per_generation: u32,
}

impl SimulationService {
    pub fn new(width: usize, height: usize, agent_count: usize) -> Result<Self, String> {
        let mut grid = Grid::new(width, height);
        GridService::initialize_random_agents(&mut grid, agent_count)?;
        
        Ok(Self {
            grid,
            generation: 0,
            turn: 0,
            turns_per_generation: 100,
        })
    }

    pub fn step(&mut self) -> SimulationStatistics {
        self.process_games();
        GridService::process_movements(&mut self.grid);
        
        self.turn += 1;
        
        if self.turn >= self.turns_per_generation {
            self.next_generation();
        }
        
        self.get_statistics()
    }

    pub fn get_statistics(&self) -> SimulationStatistics {
        SimulationStatistics::calculate(self.grid.agents(), self.generation)
    }

    pub fn get_agents(&self) -> Vec<Agent> {
        self.grid.agents().values().cloned().collect()
    }

    pub fn get_grid_size(&self) -> (usize, usize) {
        (self.grid.width(), self.grid.height())
    }

    pub fn get_generation(&self) -> u32 {
        self.generation
    }

    pub fn get_turn(&self) -> u32 {
        self.turn
    }

    pub fn reset(&mut self, agent_count: usize) -> Result<(), String> {
        self.grid.clear();
        GridService::initialize_random_agents(&mut self.grid, agent_count)?;
        self.generation = 0;
        self.turn = 0;
        Ok(())
    }

    fn process_games(&mut self) {
        let mut games_to_play = Vec::new();
        
        for agent in self.grid.agents().values() {
            let neighbors = self.grid.get_neighbors(&agent.position);
            for neighbor in neighbors {
                if agent.id < neighbor.id {
                    games_to_play.push((agent.id, neighbor.id));
                }
            }
        }

        for (id1, id2) in games_to_play {
            let agent1_clone = self.grid.get_agent(&id1).unwrap().clone();
            let agent2_clone = self.grid.get_agent(&id2).unwrap().clone();
            
            let mut agent1 = agent1_clone;
            let mut agent2 = agent2_clone;
            
            GameService::play_game(&mut agent1, &mut agent2);
            
            if let Some(agent) = self.grid.get_agent_mut(&id1) {
                *agent = agent1;
            }
            if let Some(agent) = self.grid.get_agent_mut(&id2) {
                *agent = agent2;
            }
        }
    }

    fn next_generation(&mut self) {
        let evolution_service = crate::application::evolution::EvolutionService::new();
        let new_agents = evolution_service.evolve(self.grid.agents());
        
        self.grid.clear();
        for agent in new_agents {
            let _ = self.grid.add_agent(agent);
        }
        
        self.generation += 1;
        self.turn = 0;
    }
}