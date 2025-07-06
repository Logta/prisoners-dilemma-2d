// ========================================
// Persistence Module - 永続化モジュール
// ========================================

mod types;
mod presets;
mod export;
mod file_utils;
mod service;

// Re-export public types and main service
pub use types::*;
pub use service::PersistenceService;

// Export individual services for direct use if needed
pub use presets::PresetService;
pub use export::ExportService;
pub use file_utils::FileUtilsService;

#[cfg(test)]
mod tests {
    use super::*;
    use crate::domain::{Agent, AgentId, AgentTraits, Position, SimulationConfig, WorldSize, EvolutionConfig, SelectionMethod, CrossoverMethod};
    use crate::application::{SimulationResult, GenerationHistory, BattleHistoryResult};
    use std::collections::HashMap;

    fn create_test_agent() -> Agent {
        Agent::new(
            AgentId::new(1),
            Position::new(0, 0),
            AgentTraits::new(0.5, 0.5, 0.5, 0.5).unwrap(),
        )
    }

    fn create_test_config() -> SimulationConfig {
        SimulationConfig::new(
            WorldSize::new(10, 10).unwrap(),
            10,
            100,
            10,
            1,
            EvolutionConfig::new(
                0.1,
                0.05,
                0.1,
                SelectionMethod::Tournament,
                CrossoverMethod::OnePoint,
            ),
        )
    }

    fn create_test_simulation_result() -> SimulationResult {
        SimulationResult {
            final_generation: Vec::new(),
            generation_history: Vec::new(),
            final_statistics: crate::application::SimulationStatistics {
                generation: 0,
                population_size: 0,
                avg_cooperation_rate: 0.0,
                avg_movement_rate: 0.0,
                avg_aggression_level: 0.0,
                avg_learning_rate: 0.0,
                avg_fitness: 0.0,
                diversity_index: 0.0,
                total_battles: 0,
            },
            total_time: std::time::Duration::from_secs(1),
        }
    }

    #[test]
    fn test_preset_creation() {
        let config = create_test_config();
        let preset = PersistenceService::create_preset(
            "Test Preset".to_string(),
            "A test preset".to_string(),
            config.clone(),
        );

        assert_eq!(preset.name, "Test Preset");
        assert_eq!(preset.description, "A test preset");
        assert_eq!(preset.config.world_size, config.world_size);
    }

    #[test]
    fn test_preset_export_import() {
        let config = create_test_config();
        let preset = PersistenceService::create_preset(
            "Test Preset".to_string(),
            "A test preset".to_string(),
            config,
        );

        let json = PersistenceService::export_preset(&preset).unwrap();
        let imported_preset = PersistenceService::import_preset(&json).unwrap();

        assert_eq!(preset, imported_preset);
    }

    #[test]
    fn test_standard_presets() {
        let presets = PersistenceService::create_standard_presets();
        assert_eq!(presets.len(), 4);
        
        let preset_names: Vec<&str> = presets.iter().map(|p| p.name.as_str()).collect();
        assert!(preset_names.contains(&"Small World"));
        assert!(preset_names.contains(&"Standard"));
        assert!(preset_names.contains(&"Large World"));
        assert!(preset_names.contains(&"High Mutation"));
    }

    #[test]
    fn test_export_data_agents_json() {
        let agent = create_test_agent();
        let mut agents = HashMap::new();
        agents.insert(agent.id(), agent);

        let export_data = ExportData::new().with_agents(agents);
        let result = PersistenceService::export_data(
            ExportType::Agents,
            ExportFormat::Json,
            &export_data,
        );

        assert!(result.is_ok());
        let json = result.unwrap();
        assert!(json.contains("AgentId"));
    }

    #[test]
    fn test_export_data_config_json() {
        let config = create_test_config();
        let export_data = ExportData::new().with_config(config);
        
        let result = PersistenceService::export_data(
            ExportType::Config,
            ExportFormat::Json,
            &export_data,
        );

        assert!(result.is_ok());
        let json = result.unwrap();
        assert!(json.contains("world_size"));
    }

    #[test]
    fn test_filename_generation() {
        let filename = PersistenceService::generate_filename(
            ExportType::Agents,
            ExportFormat::Json,
            Some("20240101_120000"),
        );

        assert_eq!(filename, "prisoners_dilemma_agents_20240101_120000.json");
    }

    #[test]
    fn test_export_summary() {
        let summary = PersistenceService::generate_export_summary(
            ExportType::Statistics,
            ExportFormat::Csv,
            1024,
        );

        assert!(summary.contains("Type: Statistics"));
        assert!(summary.contains("Format: Csv"));
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