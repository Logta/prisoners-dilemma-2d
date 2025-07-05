// ========================================
// 2D Prisoner's Dilemma - Clean Architecture
// ========================================

pub mod domain;
pub mod application;
pub mod infrastructure;

// Public API exports
pub use domain::*;
pub use application::{
    SimulationUseCase, SimulationUseCaseError, RunSimulationCommand, SimulationResult,
    InitializeSimulationCommand, SimulationInitializationResult,
    BattleUseCase, BattleUseCaseError, ExecuteBattleCommand, BattleResult,
    BattleHistoryQuery, BattleHistoryResult, BattleHistoryEntry,
    EvolutionUseCase, EvolutionUseCaseError, EvolvePopulationCommand, EvolutionResult,
    EvolutionStatistics, EvaluateAgentCommand, AgentEvaluationResult, PopulationStatistics
};
pub use infrastructure::{
    WasmSimulationManager, WasmBattleManager, WasmSimulationConfig,
    SerializationService, SerializationError,
    PersistenceService, PersistenceError, SimulationPreset, ExportFormat, ExportType, ExportData
};
