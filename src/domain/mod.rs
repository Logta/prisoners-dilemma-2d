// ========================================
// Domain Layer - ビジネスロジックの中核
// ========================================

pub mod agent;
pub mod battle;
pub mod shared;
pub mod simulation;
pub mod errors;

// 再エクスポート
pub use agent::*;
pub use battle::{PayoffMatrix, BattleOutcome, BattleHistory, BattleService};
pub use shared::*;
pub use simulation::{Grid, GridError, EvolutionService, EvolutionConfig, SelectionMethod, CrossoverMethod, SimulationService, SimulationConfig, SimulationStats};
pub use errors::{IndexOutOfBoundsError, EmptyCollectionError, SafeAccessError, safe_index_access, safe_vector_access, safe_slice_access};