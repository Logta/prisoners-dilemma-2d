// ========================================
// Domain Layer - ビジネスロジックの中核
// ========================================

pub mod agent;
pub mod battle;
pub mod shared;
pub mod simulation;

// 再エクスポート
pub use agent::*;
pub use battle::{PayoffMatrix, BattleOutcome, BattleHistory, BattleStrategy, BattleService};
pub use shared::*;
pub use simulation::{Grid, GridError, EvolutionService, EvolutionConfig, SelectionMethod, CrossoverMethod, SimulationService, SimulationConfig, SimulationStats};