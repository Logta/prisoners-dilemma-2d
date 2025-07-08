use super::{SimulationConfig, SimulationStatistics};
use crate::domain::{
    agent::Agent,
    game::GameService,
    grid::{Grid, GridService},
};

pub struct SimulationService {
    grid: Grid,
    generation: u32,
    turn: u32,
    turns_per_generation: u32,
    config: SimulationConfig,
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
            config: SimulationConfig::default(),
        })
    }

    pub fn with_config(
        width: usize,
        height: usize,
        agent_count: usize,
        config: SimulationConfig,
    ) -> Result<Self, String> {
        let mut grid = Grid::new(width, height).with_torus_mode(config.torus_field_enabled);
        GridService::initialize_random_agents(&mut grid, agent_count)?;

        Ok(Self {
            grid,
            generation: 0,
            turn: 0,
            turns_per_generation: 100,
            config,
        })
    }

    pub fn set_strategy_complexity_penalty(&mut self, enabled: bool) {
        self.config.strategy_complexity_penalty_enabled = enabled;
    }

    pub fn set_strategy_complexity_penalty_rate(&mut self, rate: f32) {
        self.config.strategy_complexity_penalty_rate = rate.clamp(0.0, 1.0);
    }

    pub fn set_torus_field(&mut self, enabled: bool) {
        self.config.torus_field_enabled = enabled;
        self.grid.set_torus_mode(enabled);
    }

    pub fn step(&mut self) -> SimulationStatistics {
        self.process_games();
        GridService::process_movements(&mut self.grid, self.config.torus_field_enabled);

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
        let new_agents = evolution_service.evolve_with_config(self.grid.agents(), &self.config);

        self.grid.clear();
        for agent in new_agents {
            let _ = self.grid.add_agent(agent);
        }

        self.generation += 1;
        self.turn = 0;
    }
}
