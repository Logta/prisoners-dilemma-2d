// ========================================
// Persistence Types - 永続化関連型定義
// ========================================

use crate::domain::{Agent, AgentId, SimulationConfig};
use crate::application::{SimulationResult, BattleHistoryResult};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;

/// プリセット設定
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct SimulationPreset {
    pub name: String,
    pub description: String,
    pub config: SimulationConfig,
    pub created_at: String,
}

/// 保存されたシミュレーション結果
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct SavedSimulationResult {
    pub name: String,
    pub result: SimulationResult,
    pub saved_at: String,
}

/// エクスポートフォーマット
#[derive(Debug, Clone, Copy, PartialEq)]
pub enum ExportFormat {
    Json,
    Csv,
    Binary,
}

/// エクスポートタイプ
#[derive(Debug, Clone, Copy, PartialEq)]
pub enum ExportType {
    Agents,
    Statistics,
    BattleHistory,
    SimulationResult,
    Config,
}

/// 永続化エラー
#[derive(Debug, Clone, PartialEq)]
pub enum PersistenceError {
    SerializationError(String),
    InvalidFormat,
    InvalidData,
    PresetNotFound,
    ExportError(String),
}

/// エクスポート用データコンテナ
#[derive(Debug, Default)]
pub struct ExportData {
    pub agents: Option<HashMap<AgentId, Agent>>,
    pub simulation_result: Option<SimulationResult>,
    pub battle_history: Option<BattleHistoryResult>,
    pub config: Option<SimulationConfig>,
}

impl ExportData {
    pub fn new() -> Self {
        Self::default()
    }

    pub fn with_agents(mut self, agents: HashMap<AgentId, Agent>) -> Self {
        self.agents = Some(agents);
        self
    }

    pub fn with_simulation_result(mut self, result: SimulationResult) -> Self {
        self.simulation_result = Some(result);
        self
    }

    pub fn with_battle_history(mut self, history: BattleHistoryResult) -> Self {
        self.battle_history = Some(history);
        self
    }

    pub fn with_config(mut self, config: SimulationConfig) -> Self {
        self.config = Some(config);
        self
    }
}

impl std::fmt::Display for PersistenceError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            PersistenceError::SerializationError(msg) => write!(f, "Serialization error: {}", msg),
            PersistenceError::InvalidFormat => write!(f, "Invalid format"),
            PersistenceError::InvalidData => write!(f, "Invalid data"),
            PersistenceError::PresetNotFound => write!(f, "Preset not found"),
            PersistenceError::ExportError(msg) => write!(f, "Export error: {}", msg),
        }
    }
}

impl std::error::Error for PersistenceError {}