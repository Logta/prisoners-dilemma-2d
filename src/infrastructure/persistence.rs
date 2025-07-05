// ========================================
// Persistence - データ永続化機能
// ========================================

use crate::domain::{Agent, AgentId, SimulationConfig};
use crate::application::{SimulationResult, BattleHistoryResult};
use crate::infrastructure::SerializationService;
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

/// 永続化サービス
pub struct PersistenceService;

/// 永続化エラー
#[derive(Debug, Clone, PartialEq)]
pub enum PersistenceError {
    SerializationError(String),
    InvalidFormat,
    InvalidData,
    PresetNotFound,
    ExportError(String),
}

impl PersistenceService {
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

    /// ファイル名を生成
    pub fn generate_filename(
        export_type: ExportType,
        format: ExportFormat,
        timestamp: Option<&str>,
    ) -> String {
        let type_str = match export_type {
            ExportType::Agents => "agents",
            ExportType::Statistics => "statistics",
            ExportType::BattleHistory => "battle_history",
            ExportType::SimulationResult => "simulation_result",
            ExportType::Config => "config",
        };

        let ext = match format {
            ExportFormat::Json => "json",
            ExportFormat::Csv => "csv",
            ExportFormat::Binary => "bin",
        };

        let default_timestamp = "20240101_120000".to_string(); // 簡易実装
        let timestamp = timestamp.unwrap_or(&default_timestamp);

        format!("prisoners_dilemma_{}_{}.{}", type_str, timestamp, ext)
    }

    /// エクスポートのサマリーを生成
    pub fn generate_export_summary(
        export_type: ExportType,
        format: ExportFormat,
        data_size: usize,
    ) -> String {
        format!(
            "Export Summary:\n\
             Type: {:?}\n\
             Format: {:?}\n\
             Data Size: {} bytes\n\
             Exported at: {}",
            export_type,
            format,
            data_size,
            "2024-01-01 12:00:00 UTC" // 簡易実装
        )
    }
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

#[cfg(test)]
mod tests {
    use super::*;
    use crate::domain::{Agent, AgentTraits, Position, WorldSize, EvolutionConfig, SelectionMethod, CrossoverMethod, SimulationStats};

    fn create_test_config() -> SimulationConfig {
        SimulationConfig::new(
            WorldSize::new(20, 20).unwrap(),
            50,
            100,
            50,
            2,
            EvolutionConfig::new(0.1, 0.05, 0.1, SelectionMethod::Tournament, CrossoverMethod::Uniform),
        )
    }

    fn create_test_agent() -> Agent {
        let agent_id = AgentId::new(1);
        let position = Position::new(5, 10);
        let traits = AgentTraits::new(0.7, 0.3, 0.8, 0.4).unwrap();
        Agent::new(agent_id, position, traits)
    }

    fn create_test_simulation_result() -> SimulationResult {
        let stats = SimulationStats {
            generation: 10,
            population: 50,
            average_score: 25.0,
            max_score: 50.0,
            min_score: 10.0,
            average_cooperation: 0.6,
            total_battles: 500,
        };

        SimulationResult {
            final_stats: stats.clone(),
            generation_history: vec![stats],
            final_agents: vec![create_test_agent()],
        }
    }

    #[test]
    fn test_create_preset() {
        let config = create_test_config();
        let preset = PersistenceService::create_preset(
            "Test Preset".to_string(),
            "A test preset".to_string(),
            config.clone(),
        );

        assert_eq!(preset.name, "Test Preset");
        assert_eq!(preset.description, "A test preset");
        assert_eq!(preset.config.initial_population, config.initial_population);
        assert!(!preset.created_at.is_empty());
    }

    #[test]
    fn test_export_import_preset() {
        let config = create_test_config();
        let preset = PersistenceService::create_preset(
            "Test Export".to_string(),
            "Export test".to_string(),
            config,
        );

        let json = PersistenceService::export_preset(&preset).unwrap();
        let imported_preset = PersistenceService::import_preset(&json).unwrap();

        assert_eq!(preset.name, imported_preset.name);
        assert_eq!(preset.description, imported_preset.description);
        assert_eq!(preset.config.initial_population, imported_preset.config.initial_population);
    }

    #[test]
    fn test_save_simulation_result() {
        let result = create_test_simulation_result();
        let saved_result = PersistenceService::save_simulation_result(
            "Test Result".to_string(),
            result.clone(),
        );

        assert_eq!(saved_result.name, "Test Result");
        assert_eq!(saved_result.result.final_stats.generation, result.final_stats.generation);
        assert!(!saved_result.saved_at.is_empty());
    }

    #[test]
    fn test_export_agents_json() {
        let mut agents = HashMap::new();
        let agent = create_test_agent();
        agents.insert(agent.id(), agent);

        let export_data = ExportData::new().with_agents(agents);
        let json = PersistenceService::export_data(
            ExportType::Agents,
            ExportFormat::Json,
            &export_data,
        ).unwrap();

        assert!(json.contains("1")); // AgentIdの値
        assert!(json.contains("cooperation_tendency"));
    }

    #[test]
    fn test_export_agents_csv() {
        let mut agents = HashMap::new();
        let agent = create_test_agent();
        agents.insert(agent.id(), agent);

        let export_data = ExportData::new().with_agents(agents);
        let csv = PersistenceService::export_data(
            ExportType::Agents,
            ExportFormat::Csv,
            &export_data,
        ).unwrap();

        assert!(csv.contains("id,x,y,cooperation_tendency"));
        assert!(csv.contains("1,5,10,0.7"));
    }

    #[test]
    fn test_export_simulation_result_json() {
        let result = create_test_simulation_result();
        let export_data = ExportData::new().with_simulation_result(result);
        
        let json = PersistenceService::export_data(
            ExportType::SimulationResult,
            ExportFormat::Json,
            &export_data,
        ).unwrap();

        assert!(json.contains("final_stats"));
        assert!(json.contains("generation_history"));
        assert!(json.contains("final_agents"));
    }

    #[test]
    fn test_export_config_json() {
        let config = create_test_config();
        let export_data = ExportData::new().with_config(config);
        
        let json = PersistenceService::export_data(
            ExportType::Config,
            ExportFormat::Json,
            &export_data,
        ).unwrap();

        assert!(json.contains("world_size"));
        assert!(json.contains("initial_population"));
        assert!(json.contains("evolution_config"));
    }

    #[test]
    fn test_export_agents_binary() {
        let mut agents = HashMap::new();
        let agent = create_test_agent();
        agents.insert(agent.id(), agent);

        let export_data = ExportData::new().with_agents(agents.clone());
        let binary_data = PersistenceService::export_data(
            ExportType::Agents,
            ExportFormat::Binary,
            &export_data,
        ).unwrap();

        // バイナリデータをインポートして検証
        let imported_agents = PersistenceService::import_agents_from_binary(&binary_data).unwrap();
        assert_eq!(agents.len(), imported_agents.len());
    }

    #[test]
    fn test_export_invalid_data() {
        let export_data = ExportData::new(); // 空のデータ
        
        let result = PersistenceService::export_data(
            ExportType::Agents,
            ExportFormat::Json,
            &export_data,
        );

        assert!(result.is_err());
        assert!(matches!(result.unwrap_err(), PersistenceError::InvalidData));
    }

    #[test]
    fn test_export_invalid_format() {
        let config = create_test_config();
        let export_data = ExportData::new().with_config(config);
        
        let result = PersistenceService::export_data(
            ExportType::Config,
            ExportFormat::Csv, // ConfigはCSVサポートなし
            &export_data,
        );

        assert!(result.is_err());
        assert!(matches!(result.unwrap_err(), PersistenceError::InvalidFormat));
    }

    #[test]
    fn test_create_standard_presets() {
        let presets = PersistenceService::create_standard_presets();
        
        assert_eq!(presets.len(), 4);
        assert_eq!(presets[0].name, "Small World");
        assert_eq!(presets[1].name, "Standard");
        assert_eq!(presets[2].name, "Large World");
        assert_eq!(presets[3].name, "High Mutation");
        
        // 各プリセットが有効な設定を持つことを確認
        for preset in &presets {
            assert!(!preset.name.is_empty());
            assert!(!preset.description.is_empty());
            assert!(preset.config.initial_population > 0);
        }
    }

    #[test]
    fn test_generate_filename() {
        let filename = PersistenceService::generate_filename(
            ExportType::Agents,
            ExportFormat::Json,
            Some("20231201_120000"),
        );

        assert_eq!(filename, "prisoners_dilemma_agents_20231201_120000.json");
    }

    #[test]
    fn test_generate_filename_with_current_timestamp() {
        let filename = PersistenceService::generate_filename(
            ExportType::Statistics,
            ExportFormat::Csv,
            None,
        );

        assert!(filename.starts_with("prisoners_dilemma_statistics_"));
        assert!(filename.ends_with(".csv"));
    }

    #[test]
    fn test_generate_export_summary() {
        let summary = PersistenceService::generate_export_summary(
            ExportType::Agents,
            ExportFormat::Json,
            1024,
        );

        assert!(summary.contains("Export Summary:"));
        assert!(summary.contains("Type: Agents"));
        assert!(summary.contains("Format: Json"));
        assert!(summary.contains("Data Size: 1024 bytes"));
        assert!(summary.contains("Exported at:"));
    }

    #[test]
    fn test_export_data_builder() {
        let agent = create_test_agent();
        let mut agents = HashMap::new();
        agents.insert(agent.id(), agent);

        let config = create_test_config();
        let result = create_test_simulation_result();

        let export_data = ExportData::new()
            .with_agents(agents.clone())
            .with_config(config.clone())
            .with_simulation_result(result.clone());

        assert!(export_data.agents.is_some());
        assert!(export_data.config.is_some());
        assert!(export_data.simulation_result.is_some());
        assert!(export_data.battle_history.is_none());
    }

    #[test]
    fn test_import_invalid_preset() {
        let invalid_json = "{ invalid json }";
        let result = PersistenceService::import_preset(invalid_json);
        
        assert!(result.is_err());
        assert!(matches!(result.unwrap_err(), PersistenceError::SerializationError(_)));
    }
}