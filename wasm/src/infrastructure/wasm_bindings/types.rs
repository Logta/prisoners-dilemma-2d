use crate::application::simulation::SimulationStatistics;
use crate::domain::agent::{Agent, MovementStrategy, StrategyType};
use serde::{Deserialize, Serialize};
use wasm_bindgen::prelude::*;

#[wasm_bindgen]
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WasmAgent {
    id: String,
    x: usize,
    y: usize,
    strategy: u8,
    movement_strategy: u8,
    mobility: f64,
    score: i32,
    cooperation_rate: f64,
}

impl From<&Agent> for WasmAgent {
    fn from(agent: &Agent) -> Self {
        Self {
            id: agent.id.to_string(),
            x: agent.position.x,
            y: agent.position.y,
            strategy: match agent.strategy {
                StrategyType::AllCooperate => 0,
                StrategyType::AllDefect => 1,
                StrategyType::TitForTat => 2,
                StrategyType::Pavlov => 3,
            },
            movement_strategy: match agent.movement_strategy {
                MovementStrategy::Explorer => 0,
                MovementStrategy::Settler => 1,
                MovementStrategy::Adaptive => 2,
                MovementStrategy::Opportunist => 3,
                MovementStrategy::Social => 4,
                MovementStrategy::Antisocial => 5,
            },
            mobility: agent.mobility,
            score: agent.score,
            cooperation_rate: agent.cooperation_rate(),
        }
    }
}

#[wasm_bindgen]
impl WasmAgent {
    #[wasm_bindgen(getter)]
    pub fn id(&self) -> String {
        self.id.clone()
    }

    #[wasm_bindgen(getter)]
    pub fn x(&self) -> usize {
        self.x
    }

    #[wasm_bindgen(getter)]
    pub fn y(&self) -> usize {
        self.y
    }

    #[wasm_bindgen(getter)]
    pub fn strategy(&self) -> u8 {
        self.strategy
    }

    #[wasm_bindgen(getter)]
    pub fn movement_strategy(&self) -> u8 {
        self.movement_strategy
    }

    #[wasm_bindgen(getter)]
    pub fn mobility(&self) -> f64 {
        self.mobility
    }

    #[wasm_bindgen(getter)]
    pub fn score(&self) -> i32 {
        self.score
    }

    #[wasm_bindgen(getter)]
    pub fn cooperation_rate(&self) -> f64 {
        self.cooperation_rate
    }
}

#[wasm_bindgen]
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WasmStatistics {
    generation: u32,
    total_agents: usize,
    all_cooperate_count: usize,
    all_defect_count: usize,
    tit_for_tat_count: usize,
    pavlov_count: usize,
    explorer_count: usize,
    settler_count: usize,
    adaptive_count: usize,
    opportunist_count: usize,
    social_count: usize,
    antisocial_count: usize,
    average_cooperation_rate: f64,
    average_mobility: f64,
    average_score: f64,
}

impl From<&SimulationStatistics> for WasmStatistics {
    fn from(stats: &SimulationStatistics) -> Self {
        Self {
            generation: stats.generation,
            total_agents: stats.total_agents,
            all_cooperate_count: *stats
                .strategy_counts
                .get(&StrategyType::AllCooperate)
                .unwrap_or(&0),
            all_defect_count: *stats
                .strategy_counts
                .get(&StrategyType::AllDefect)
                .unwrap_or(&0),
            tit_for_tat_count: *stats
                .strategy_counts
                .get(&StrategyType::TitForTat)
                .unwrap_or(&0),
            pavlov_count: *stats
                .strategy_counts
                .get(&StrategyType::Pavlov)
                .unwrap_or(&0),
            explorer_count: *stats.movement_strategy_counts.get("Explorer").unwrap_or(&0),
            settler_count: *stats.movement_strategy_counts.get("Settler").unwrap_or(&0),
            adaptive_count: *stats.movement_strategy_counts.get("Adaptive").unwrap_or(&0),
            opportunist_count: *stats
                .movement_strategy_counts
                .get("Opportunist")
                .unwrap_or(&0),
            social_count: *stats.movement_strategy_counts.get("Social").unwrap_or(&0),
            antisocial_count: *stats
                .movement_strategy_counts
                .get("Antisocial")
                .unwrap_or(&0),
            average_cooperation_rate: stats.average_cooperation_rate,
            average_mobility: stats.average_mobility,
            average_score: stats.average_score,
        }
    }
}

#[wasm_bindgen]
impl WasmStatistics {
    #[wasm_bindgen(getter)]
    pub fn generation(&self) -> u32 {
        self.generation
    }

    #[wasm_bindgen(getter)]
    pub fn total_agents(&self) -> usize {
        self.total_agents
    }

    #[wasm_bindgen(getter)]
    pub fn all_cooperate_count(&self) -> usize {
        self.all_cooperate_count
    }

    #[wasm_bindgen(getter)]
    pub fn all_defect_count(&self) -> usize {
        self.all_defect_count
    }

    #[wasm_bindgen(getter)]
    pub fn tit_for_tat_count(&self) -> usize {
        self.tit_for_tat_count
    }

    #[wasm_bindgen(getter)]
    pub fn pavlov_count(&self) -> usize {
        self.pavlov_count
    }

    #[wasm_bindgen(getter)]
    pub fn explorer_count(&self) -> usize {
        self.explorer_count
    }

    #[wasm_bindgen(getter)]
    pub fn settler_count(&self) -> usize {
        self.settler_count
    }

    #[wasm_bindgen(getter)]
    pub fn adaptive_count(&self) -> usize {
        self.adaptive_count
    }

    #[wasm_bindgen(getter)]
    pub fn opportunist_count(&self) -> usize {
        self.opportunist_count
    }

    #[wasm_bindgen(getter)]
    pub fn social_count(&self) -> usize {
        self.social_count
    }

    #[wasm_bindgen(getter)]
    pub fn antisocial_count(&self) -> usize {
        self.antisocial_count
    }

    #[wasm_bindgen(getter)]
    pub fn average_cooperation_rate(&self) -> f64 {
        self.average_cooperation_rate
    }

    #[wasm_bindgen(getter)]
    pub fn average_mobility(&self) -> f64 {
        self.average_mobility
    }

    #[wasm_bindgen(getter)]
    pub fn average_score(&self) -> f64 {
        self.average_score
    }
}

#[wasm_bindgen]
pub fn movement_strategy_name(strategy_id: u8) -> String {
    match strategy_id {
        0 => "Explorer".to_string(),
        1 => "Settler".to_string(),
        2 => "Adaptive".to_string(),
        3 => "Opportunist".to_string(),
        4 => "Social".to_string(),
        5 => "Antisocial".to_string(),
        _ => "Unknown".to_string(),
    }
}
