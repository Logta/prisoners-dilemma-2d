use crate::domain::agent::{Agent, StrategyType};
use crate::application::simulation::SimulationStatistics;
use serde::{Deserialize, Serialize};
use wasm_bindgen::prelude::*;

#[wasm_bindgen]
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WasmAgent {
    id: String,
    x: usize,
    y: usize,
    strategy: u8,
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
    average_cooperation_rate: f64,
    average_mobility: f64,
    average_score: f64,
}

impl From<&SimulationStatistics> for WasmStatistics {
    fn from(stats: &SimulationStatistics) -> Self {
        Self {
            generation: stats.generation,
            total_agents: stats.total_agents,
            all_cooperate_count: *stats.strategy_counts.get(&StrategyType::AllCooperate).unwrap_or(&0),
            all_defect_count: *stats.strategy_counts.get(&StrategyType::AllDefect).unwrap_or(&0),
            tit_for_tat_count: *stats.strategy_counts.get(&StrategyType::TitForTat).unwrap_or(&0),
            pavlov_count: *stats.strategy_counts.get(&StrategyType::Pavlov).unwrap_or(&0),
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