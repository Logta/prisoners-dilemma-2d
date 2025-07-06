// ========================================
// Evolution Strategy Types - 進化戦略タイプ定義
// ========================================

use serde::{Deserialize, Serialize};

/// 進化戦略の種類
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub enum EvolutionStrategyType {
    Classic,
    Elitist,
    SteadyState,
    IslandModel,
    Adaptive,
    MultiObjective,
}

/// 進化戦略の共通インターフェース
pub trait EvolutionStrategy: Send + Sync {
    fn evolve(&mut self, world: &crate::core::SimulationWorld) -> Result<crate::evolution::EvolutionResult, crate::evolution::EvolutionError>;
    fn get_config(&self) -> &crate::evolution::EvolutionConfig;
    fn update_config(&mut self, config: crate::evolution::EvolutionConfig);
    fn reset(&mut self);
}