// ========================================
// Data Export Service - データエクスポートサービス
// ========================================

use super::types::{ExportData, ExportFormat, ExportType, PersistenceError, SavedSimulationResult};
use crate::domain::{Agent, AgentId};
use crate::application::SimulationResult;
use crate::infrastructure::SerializationService;
use std::collections::HashMap;

/// データエクスポートサービス
pub struct ExportService;

impl ExportService {
    /// シミュレーション結果を保存
    pub fn save_simulation_result(
        name: String,
        result: SimulationResult,
    ) -> SavedSimulationResult {
        let now = "2024-01-01 12:00:00 UTC".to_string(); // 簡易実装
        
        SavedSimulationResult {
            name,
            result,
            saved_at: now,
        }
    }

    /// データをエクスポート
    pub fn export_data(
        export_type: ExportType,
        format: ExportFormat,
        data: &ExportData,
    ) -> Result<String, PersistenceError> {
        match (export_type, format) {
            (ExportType::Agents, ExportFormat::Json) => {
                let agents = data.agents.as_ref().ok_or(PersistenceError::InvalidData)?;
                SerializationService::agents_to_json(agents)
                    .map_err(|e| PersistenceError::SerializationError(e.to_string()))
            },
            (ExportType::Agents, ExportFormat::Csv) => {
                let agents = data.agents.as_ref().ok_or(PersistenceError::InvalidData)?;
                SerializationService::agents_to_csv(agents)
                    .map_err(|e| PersistenceError::SerializationError(e.to_string()))
            },
            (ExportType::Statistics, ExportFormat::Json) => {
                let stats = data.simulation_result.as_ref().ok_or(PersistenceError::InvalidData)?;
                serde_json::to_string_pretty(&stats.generation_history)
                    .map_err(|e| PersistenceError::SerializationError(e.to_string()))
            },
            (ExportType::Statistics, ExportFormat::Csv) => {
                let stats = data.simulation_result.as_ref().ok_or(PersistenceError::InvalidData)?;
                SerializationService::stats_history_to_csv(&stats.generation_history)
                    .map_err(|e| PersistenceError::SerializationError(e.to_string()))
            },
            (ExportType::BattleHistory, ExportFormat::Json) => {
                let history = data.battle_history.as_ref().ok_or(PersistenceError::InvalidData)?;
                serde_json::to_string_pretty(history)
                    .map_err(|e| PersistenceError::SerializationError(e.to_string()))
            },
            (ExportType::BattleHistory, ExportFormat::Csv) => {
                let history = data.battle_history.as_ref().ok_or(PersistenceError::InvalidData)?;
                SerializationService::battle_history_to_csv(history)
                    .map_err(|e| PersistenceError::SerializationError(e.to_string()))
            },
            (ExportType::SimulationResult, ExportFormat::Json) => {
                let result = data.simulation_result.as_ref().ok_or(PersistenceError::InvalidData)?;
                SerializationService::simulation_result_to_json(result)
                    .map_err(|e| PersistenceError::SerializationError(e.to_string()))
            },
            (ExportType::Config, ExportFormat::Json) => {
                let config = data.config.as_ref().ok_or(PersistenceError::InvalidData)?;
                SerializationService::config_to_json(config)
                    .map_err(|e| PersistenceError::SerializationError(e.to_string()))
            },
            (_, ExportFormat::Binary) => {
                if let Some(agents) = &data.agents {
                    let binary = SerializationService::agents_to_binary(agents)
                        .map_err(|e| PersistenceError::SerializationError(e.to_string()))?;
                    // 簡易実装: バイナリデータをそのままJSONに変換
                    Ok(format!("{:?}", binary))
                } else {
                    Err(PersistenceError::InvalidData)
                }
            },
            _ => Err(PersistenceError::InvalidFormat),
        }
    }

    /// バイナリデータからエージェントをインポート
    pub fn import_agents_from_binary(debug_data: &str) -> Result<HashMap<AgentId, Agent>, PersistenceError> {
        // 簡易実装: デバッグ形式からVec<u8>に復元（実際のプロダクションでは適切なパースが必要）
        // ここでは簡単にJSONからデータを取得
        if debug_data.starts_with('[') && debug_data.ends_with(']') {
            // Vec<u8>のデバッグ形式を簡易パース
            let binary = debug_data.chars().filter(|c| c.is_ascii_digit() || *c == ',')
                .collect::<String>()
                .split(',')
                .filter_map(|s| s.trim().parse::<u8>().ok())
                .collect::<Vec<u8>>();
            
            SerializationService::agents_from_binary(&binary)
                .map_err(|e| PersistenceError::SerializationError(e.to_string()))
        } else {
            Err(PersistenceError::InvalidData)
        }
    }
}