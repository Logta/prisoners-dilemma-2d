use crate::domain::agent::{Agent, StrategyType};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SimulationStatistics {
    pub generation: u32,
    pub total_agents: usize,
    pub strategy_counts: HashMap<StrategyType, usize>,
    pub movement_strategy_counts: HashMap<String, usize>,
    pub average_cooperation_rate: f64,
    pub average_mobility: f64,
    pub average_score: f64,
}

impl SimulationStatistics {
    pub fn new() -> Self {
        Self {
            generation: 0,
            total_agents: 0,
            strategy_counts: HashMap::new(),
            movement_strategy_counts: HashMap::new(),
            average_cooperation_rate: 0.0,
            average_mobility: 0.0,
            average_score: 0.0,
        }
    }

    pub fn calculate(agents: &HashMap<uuid::Uuid, Agent>, generation: u32) -> Self {
        let total_agents = agents.len();
        
        if total_agents == 0 {
            return Self::new();
        }

        let mut strategy_counts = HashMap::new();
        let mut movement_strategy_counts = HashMap::new();
        let mut total_cooperation_rate = 0.0;
        let mut total_mobility = 0.0;
        let mut total_score = 0.0;

        for agent in agents.values() {
            *strategy_counts.entry(agent.strategy).or_insert(0) += 1;
            *movement_strategy_counts.entry(agent.movement_strategy.to_string()).or_insert(0) += 1;
            total_cooperation_rate += agent.cooperation_rate();
            total_mobility += agent.mobility;
            total_score += agent.score as f64;
        }

        Self {
            generation,
            total_agents,
            strategy_counts,
            movement_strategy_counts,
            average_cooperation_rate: total_cooperation_rate / total_agents as f64,
            average_mobility: total_mobility / total_agents as f64,
            average_score: total_score / total_agents as f64,
        }
    }

    pub fn get_strategy_percentage(&self, strategy: StrategyType) -> f64 {
        if self.total_agents == 0 {
            0.0
        } else {
            let count = self.strategy_counts.get(&strategy).unwrap_or(&0);
            *count as f64 / self.total_agents as f64 * 100.0
        }
    }

    pub fn get_movement_strategy_percentage(&self, movement_strategy: &str) -> f64 {
        if self.total_agents == 0 {
            0.0
        } else {
            let count = self.movement_strategy_counts.get(movement_strategy).unwrap_or(&0);
            *count as f64 / self.total_agents as f64 * 100.0
        }
    }
}