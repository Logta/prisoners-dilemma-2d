// ========================================
// Persistence Service - 永続化サービス統合
// ========================================

use super::presets::PresetService;
use super::export::ExportService;
use super::file_utils::FileUtilsService;
use super::types::*;

/// 永続化サービス（統合インターフェース）
pub struct PersistenceService;

impl PersistenceService {
    /// プリセットを作成
    pub fn create_preset(
        name: String,
        description: String,
        config: crate::domain::SimulationConfig,
    ) -> SimulationPreset {
        PresetService::create_preset(name, description, config)
    }

    /// プリセットをJSONとしてエクスポート
    pub fn export_preset(preset: &SimulationPreset) -> Result<String, PersistenceError> {
        PresetService::export_preset(preset)
    }

    /// JSONからプリセットをインポート
    pub fn import_preset(json: &str) -> Result<SimulationPreset, PersistenceError> {
        PresetService::import_preset(json)
    }

    /// 標準プリセットを生成
    pub fn create_standard_presets() -> Vec<SimulationPreset> {
        PresetService::create_standard_presets()
    }

    /// シミュレーション結果を保存
    pub fn save_simulation_result(
        name: String,
        result: crate::application::SimulationResult,
    ) -> SavedSimulationResult {
        ExportService::save_simulation_result(name, result)
    }

    /// データをエクスポート
    pub fn export_data(
        export_type: ExportType,
        format: ExportFormat,
        data: &ExportData,
    ) -> Result<String, PersistenceError> {
        ExportService::export_data(export_type, format, data)
    }

    /// バイナリデータからエージェントをインポート
    pub fn import_agents_from_binary(
        debug_data: &str,
    ) -> Result<std::collections::HashMap<crate::domain::AgentId, crate::domain::Agent>, PersistenceError> {
        ExportService::import_agents_from_binary(debug_data)
    }

    /// ファイル名を生成
    pub fn generate_filename(
        export_type: ExportType,
        format: ExportFormat,
        timestamp: Option<&str>,
    ) -> String {
        FileUtilsService::generate_filename(export_type, format, timestamp)
    }

    /// エクスポートのサマリーを生成
    pub fn generate_export_summary(
        export_type: ExportType,
        format: ExportFormat,
        data_size: usize,
    ) -> String {
        FileUtilsService::generate_export_summary(export_type, format, data_size)
    }
}