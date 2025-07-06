// ========================================
// Preset Management - プリセット管理
// ========================================

use super::types::{SimulationPreset, PersistenceError};
use crate::domain::SimulationConfig;

/// プリセット管理サービス
pub struct PresetService;

impl PresetService {
    /// プリセットを作成
    pub fn create_preset(
        name: String,
        description: String,
        config: SimulationConfig,
    ) -> SimulationPreset {
        let now = "2024-01-01 12:00:00 UTC".to_string(); // 簡易実装
        
        SimulationPreset {
            name,
            description,
            config,
            created_at: now,
        }
    }

    /// プリセットをJSONとしてエクスポート
    pub fn export_preset(preset: &SimulationPreset) -> Result<String, PersistenceError> {
        serde_json::to_string_pretty(preset)
            .map_err(|e| PersistenceError::SerializationError(e.to_string()))
    }

    /// JSONからプリセットをインポート
    pub fn import_preset(json: &str) -> Result<SimulationPreset, PersistenceError> {
        serde_json::from_str(json)
            .map_err(|e| PersistenceError::SerializationError(e.to_string()))
    }

    /// 標準プリセットを生成
    pub fn create_standard_presets() -> Vec<SimulationPreset> {
        vec![
            Self::create_preset(
                "Small World".to_string(),
                "Small 20x20 world with fast evolution".to_string(),
                SimulationConfig::new(
                    crate::domain::WorldSize::new(20, 20).unwrap(),
                    50,
                    100,
                    50,
                    1,
                    crate::domain::EvolutionConfig::new(
                        0.15,
                        0.1,
                        0.15,
                        crate::domain::SelectionMethod::Tournament,
                        crate::domain::CrossoverMethod::Uniform,
                    ),
                ),
            ),
            Self::create_preset(
                "Standard".to_string(),
                "Standard 50x50 world with balanced parameters".to_string(),
                SimulationConfig::new(
                    crate::domain::WorldSize::new(50, 50).unwrap(),
                    100,
                    1000,
                    100,
                    2,
                    crate::domain::EvolutionConfig::standard(),
                ),
            ),
            Self::create_preset(
                "Large World".to_string(),
                "Large 100x100 world with slow, stable evolution".to_string(),
                SimulationConfig::new(
                    crate::domain::WorldSize::new(100, 100).unwrap(),
                    500,
                    2000,
                    200,
                    3,
                    crate::domain::EvolutionConfig::new(
                        0.05,
                        0.03,
                        0.05,
                        crate::domain::SelectionMethod::Rank,
                        crate::domain::CrossoverMethod::TwoPoint,
                    ),
                ),
            ),
            Self::create_preset(
                "High Mutation".to_string(),
                "Standard world with high mutation for rapid adaptation".to_string(),
                SimulationConfig::new(
                    crate::domain::WorldSize::new(50, 50).unwrap(),
                    100,
                    500,
                    100,
                    2,
                    crate::domain::EvolutionConfig::new(
                        0.3,
                        0.15,
                        0.1,
                        crate::domain::SelectionMethod::Roulette,
                        crate::domain::CrossoverMethod::OnePoint,
                    ),
                ),
            ),
        ]
    }
}