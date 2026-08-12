use crate::application::simulation::SimulationStatistics;
use crate::domain::agent::{Agent, MovementStrategy, StrategyType};
use serde::{Deserialize, Serialize};
use wasm_bindgen::prelude::*;

/// `domain::MovementStrategy` のJS向け公開表現。
///
/// domain層はwasm-bindgenに依存しないため、JSへ公開する数値表現（enum判別値）は
/// このinfrastructure層で一元管理する。判別値はフロントエンドとの互換性のため
/// 既存の並び順（Explorer=0 〜 Antisocial=5）を維持すること。
#[wasm_bindgen]
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum WasmMovementStrategy {
    Explorer = 0,
    Settler = 1,
    Adaptive = 2,
    Opportunist = 3,
    Social = 4,
    Antisocial = 5,
}

impl From<MovementStrategy> for WasmMovementStrategy {
    fn from(strategy: MovementStrategy) -> Self {
        match strategy {
            MovementStrategy::Explorer => WasmMovementStrategy::Explorer,
            MovementStrategy::Settler => WasmMovementStrategy::Settler,
            MovementStrategy::Adaptive => WasmMovementStrategy::Adaptive,
            MovementStrategy::Opportunist => WasmMovementStrategy::Opportunist,
            MovementStrategy::Social => WasmMovementStrategy::Social,
            MovementStrategy::Antisocial => WasmMovementStrategy::Antisocial,
        }
    }
}

impl From<WasmMovementStrategy> for MovementStrategy {
    fn from(strategy: WasmMovementStrategy) -> Self {
        match strategy {
            WasmMovementStrategy::Explorer => MovementStrategy::Explorer,
            WasmMovementStrategy::Settler => MovementStrategy::Settler,
            WasmMovementStrategy::Adaptive => MovementStrategy::Adaptive,
            WasmMovementStrategy::Opportunist => MovementStrategy::Opportunist,
            WasmMovementStrategy::Social => MovementStrategy::Social,
            WasmMovementStrategy::Antisocial => MovementStrategy::Antisocial,
        }
    }
}

impl TryFrom<u8> for WasmMovementStrategy {
    type Error = ();

    fn try_from(value: u8) -> Result<Self, Self::Error> {
        match value {
            0 => Ok(WasmMovementStrategy::Explorer),
            1 => Ok(WasmMovementStrategy::Settler),
            2 => Ok(WasmMovementStrategy::Adaptive),
            3 => Ok(WasmMovementStrategy::Opportunist),
            4 => Ok(WasmMovementStrategy::Social),
            5 => Ok(WasmMovementStrategy::Antisocial),
            _ => Err(()),
        }
    }
}

// wasm_bindgen methods for MovementStrategy（domain層をwasm-bindgenから切り離すため、
// このinfrastructure層に配置している）
#[wasm_bindgen]
pub fn movement_strategy_to_string(strategy: WasmMovementStrategy) -> String {
    MovementStrategy::from(strategy).to_string()
}

#[wasm_bindgen]
pub fn movement_strategy_random() -> WasmMovementStrategy {
    WasmMovementStrategy::from(MovementStrategy::random())
}

#[wasm_bindgen]
pub fn movement_strategy_variant_count() -> u32 {
    MovementStrategy::ALL.len() as u32
}

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
            movement_strategy: WasmMovementStrategy::from(agent.movement_strategy) as u8,
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
            explorer_count: *stats
                .movement_strategy_counts
                .get(&MovementStrategy::Explorer)
                .unwrap_or(&0),
            settler_count: *stats
                .movement_strategy_counts
                .get(&MovementStrategy::Settler)
                .unwrap_or(&0),
            adaptive_count: *stats
                .movement_strategy_counts
                .get(&MovementStrategy::Adaptive)
                .unwrap_or(&0),
            opportunist_count: *stats
                .movement_strategy_counts
                .get(&MovementStrategy::Opportunist)
                .unwrap_or(&0),
            social_count: *stats
                .movement_strategy_counts
                .get(&MovementStrategy::Social)
                .unwrap_or(&0),
            antisocial_count: *stats
                .movement_strategy_counts
                .get(&MovementStrategy::Antisocial)
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
    match WasmMovementStrategy::try_from(strategy_id) {
        Ok(strategy) => MovementStrategy::from(strategy).to_string(),
        Err(()) => "Unknown".to_string(),
    }
}
