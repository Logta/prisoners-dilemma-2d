// ========================================
// File Utilities - ファイル関連ユーティリティ
// ========================================

use super::types::{ExportFormat, ExportType};

/// ファイル関連ユーティリティサービス
pub struct FileUtilsService;

impl FileUtilsService {
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