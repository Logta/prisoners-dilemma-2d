// ========================================
// Repository Traits - データ永続化の抽象化
// ========================================

use crate::core::{Agent, AgentId, SimulationWorld, WorldStatistics};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;

/// シミュレーション状態の永続化を管理するリポジトリ
pub trait SimulationRepository {
    type Error: std::error::Error + Send + Sync + 'static;

    /// シミュレーション状態を保存
    async fn save_world(&mut self, world: &SimulationWorld) -> Result<String, Self::Error>;

    /// シミュレーション状態を読み込み
    async fn load_world(&self, id: &str) -> Result<SimulationWorld, Self::Error>;

    /// 保存されたシミュレーションのリストを取得
    async fn list_saved_worlds(&self) -> Result<Vec<SavedWorldMetadata>, Self::Error>;

    /// シミュレーション状態を削除
    async fn delete_world(&mut self, id: &str) -> Result<(), Self::Error>;
}

/// 統計データの永続化を管理するリポジトリ
pub trait StatisticsRepository {
    type Error: std::error::Error + Send + Sync + 'static;

    /// 統計データを保存
    async fn save_statistics(&mut self, stats: &WorldStatistics) -> Result<(), Self::Error>;

    /// 指定期間の統計データを取得
    async fn get_statistics_range(
        &self,
        start_generation: u32,
        end_generation: u32,
    ) -> Result<Vec<WorldStatistics>, Self::Error>;

    /// 最新の統計データを取得
    async fn get_latest_statistics(&self) -> Result<Option<WorldStatistics>, Self::Error>;

    /// 統計データをクリア
    async fn clear_statistics(&mut self) -> Result<(), Self::Error>;
}

/// エージェント履歴の永続化を管理するリポジトリ
pub trait AgentHistoryRepository {
    type Error: std::error::Error + Send + Sync + 'static;

    /// エージェントの履歴を保存
    async fn save_agent_history(
        &mut self,
        agent_id: AgentId,
        history: &AgentHistory,
    ) -> Result<(), Self::Error>;

    /// エージェントの履歴を取得
    async fn get_agent_history(
        &self,
        agent_id: AgentId,
    ) -> Result<Option<AgentHistory>, Self::Error>;

    /// 世代ごとのエージェント系譜を取得
    async fn get_lineage(&self, agent_id: AgentId) -> Result<Vec<AgentLineage>, Self::Error>;

    /// 履歴データをクリア
    async fn clear_history(&mut self) -> Result<(), Self::Error>;
}

/// 保存されたシミュレーションのメタデータ
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SavedWorldMetadata {
    pub id: String,
    pub name: String,
    pub description: Option<String>,
    pub generation: u32,
    pub population: usize,
    pub created_at: chrono::DateTime<chrono::Utc>,
    pub last_modified: chrono::DateTime<chrono::Utc>,
    pub file_size: u64,
}

/// エージェントの履歴データ
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AgentHistory {
    pub agent_id: AgentId,
    pub born_generation: u32,
    pub death_generation: Option<u32>,
    pub parent_ids: Vec<AgentId>,
    pub children_ids: Vec<AgentId>,
    pub lifetime_statistics: LifetimeStatistics,
    pub generational_data: Vec<GenerationalData>,
}

/// 生涯統計
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LifetimeStatistics {
    pub total_battles: u32,
    pub total_score: f64,
    pub cooperation_ratio: f64,
    pub survival_generations: u32,
    pub offspring_count: usize,
    pub max_score_per_generation: f64,
    pub territories_visited: usize,
}

/// 世代ごとのデータ
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GenerationalData {
    pub generation: u32,
    pub score: f64,
    pub battles_fought: u32,
    pub position: (usize, usize),
    pub energy: f64,
    pub traits_snapshot: AgentTraitsSnapshot,
}

/// エージェント特性のスナップショット
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AgentTraitsSnapshot {
    pub cooperation_rate: f64,
    pub movement_rate: f64,
    pub aggression_level: f64,
    pub learning_rate: f64,
}

/// エージェント系譜
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AgentLineage {
    pub generation: u32,
    pub agent_id: AgentId,
    pub parent_id: Option<AgentId>,
    pub fitness: f64,
    pub traits: AgentTraitsSnapshot,
}

/// インメモリのシミュレーションリポジトリ（テスト・開発用）
pub struct InMemorySimulationRepository {
    worlds: HashMap<String, SimulationWorld>,
    metadata: HashMap<String, SavedWorldMetadata>,
}

impl InMemorySimulationRepository {
    pub fn new() -> Self {
        Self {
            worlds: HashMap::new(),
            metadata: HashMap::new(),
        }
    }
}

#[async_trait::async_trait]
impl SimulationRepository for InMemorySimulationRepository {
    type Error = RepositoryError;

    async fn save_world(&mut self, world: &SimulationWorld) -> Result<String, Self::Error> {
        let id = uuid::Uuid::new_v4().to_string();
        let now = chrono::Utc::now();

        let metadata = SavedWorldMetadata {
            id: id.clone(),
            name: format!("Simulation Gen {}", world.generation.current),
            description: Some(format!("Population: {}", world.agents.len())),
            generation: world.generation.current,
            population: world.agents.len(),
            created_at: now,
            last_modified: now,
            file_size: 0, // インメモリなのでサイズは0
        };

        self.worlds.insert(id.clone(), world.clone());
        self.metadata.insert(id.clone(), metadata);

        Ok(id)
    }

    async fn load_world(&self, id: &str) -> Result<SimulationWorld, Self::Error> {
        self.worlds
            .get(id)
            .cloned()
            .ok_or(RepositoryError::NotFound)
    }

    async fn list_saved_worlds(&self) -> Result<Vec<SavedWorldMetadata>, Self::Error> {
        Ok(self.metadata.values().cloned().collect())
    }

    async fn delete_world(&mut self, id: &str) -> Result<(), Self::Error> {
        self.worlds.remove(id);
        self.metadata.remove(id);
        Ok(())
    }
}

/// インメモリの統計リポジトリ
pub struct InMemoryStatisticsRepository {
    statistics: Vec<WorldStatistics>,
}

impl InMemoryStatisticsRepository {
    pub fn new() -> Self {
        Self {
            statistics: Vec::new(),
        }
    }
}

#[async_trait::async_trait]
impl StatisticsRepository for InMemoryStatisticsRepository {
    type Error = RepositoryError;

    async fn save_statistics(&mut self, stats: &WorldStatistics) -> Result<(), Self::Error> {
        // 同じ世代の統計が既に存在する場合は更新
        if let Some(existing) = self
            .statistics
            .iter_mut()
            .find(|s| s.generation == stats.generation)
        {
            *existing = stats.clone();
        } else {
            self.statistics.push(stats.clone());
            // 世代順にソート
            self.statistics.sort_by_key(|s| s.generation);
        }
        Ok(())
    }

    async fn get_statistics_range(
        &self,
        start_generation: u32,
        end_generation: u32,
    ) -> Result<Vec<WorldStatistics>, Self::Error> {
        Ok(self
            .statistics
            .iter()
            .filter(|s| s.generation >= start_generation && s.generation <= end_generation)
            .cloned()
            .collect())
    }

    async fn get_latest_statistics(&self) -> Result<Option<WorldStatistics>, Self::Error> {
        Ok(self.statistics.last().cloned())
    }

    async fn clear_statistics(&mut self) -> Result<(), Self::Error> {
        self.statistics.clear();
        Ok(())
    }
}

/// インメモリのエージェント履歴リポジトリ
pub struct InMemoryAgentHistoryRepository {
    histories: HashMap<AgentId, AgentHistory>,
    lineages: HashMap<AgentId, Vec<AgentLineage>>,
}

impl InMemoryAgentHistoryRepository {
    pub fn new() -> Self {
        Self {
            histories: HashMap::new(),
            lineages: HashMap::new(),
        }
    }
}

#[async_trait::async_trait]
impl AgentHistoryRepository for InMemoryAgentHistoryRepository {
    type Error = RepositoryError;

    async fn save_agent_history(
        &mut self,
        agent_id: AgentId,
        history: &AgentHistory,
    ) -> Result<(), Self::Error> {
        self.histories.insert(agent_id, history.clone());
        Ok(())
    }

    async fn get_agent_history(
        &self,
        agent_id: AgentId,
    ) -> Result<Option<AgentHistory>, Self::Error> {
        Ok(self.histories.get(&agent_id).cloned())
    }

    async fn get_lineage(&self, agent_id: AgentId) -> Result<Vec<AgentLineage>, Self::Error> {
        Ok(self.lineages.get(&agent_id).cloned().unwrap_or_default())
    }

    async fn clear_history(&mut self) -> Result<(), Self::Error> {
        self.histories.clear();
        self.lineages.clear();
        Ok(())
    }
}

/// リポジトリエラー
#[derive(Debug, thiserror::Error)]
pub enum RepositoryError {
    #[error("データが見つかりません")]
    NotFound,

    #[error("シリアライゼーションエラー: {0}")]
    Serialization(#[from] serde_json::Error),

    #[error("IOエラー: {0}")]
    Io(#[from] std::io::Error),

    #[error("データベースエラー: {message}")]
    Database { message: String },

    #[error("権限エラー")]
    Permission,

    #[error("データ破損")]
    Corruption,
}

/// リポジトリファクトリ - 異なる実装を提供
pub struct RepositoryFactory;

impl RepositoryFactory {
    /// インメモリリポジトリセットを作成
    pub fn create_in_memory() -> (
        InMemorySimulationRepository,
        InMemoryStatisticsRepository,
        InMemoryAgentHistoryRepository,
    ) {
        (
            InMemorySimulationRepository::new(),
            InMemoryStatisticsRepository::new(),
            InMemoryAgentHistoryRepository::new(),
        )
    }

    /// ファイルベースリポジトリセットを作成（将来の実装）
    pub fn create_file_based(_base_path: &str) -> Result<(), RepositoryError> {
        // TODO: ファイルベースの実装
        todo!("File-based repositories not yet implemented")
    }

    /// SQLiteベースリポジトリセットを作成（将来の実装）
    pub fn create_sqlite(_db_path: &str) -> Result<(), RepositoryError> {
        // TODO: SQLiteベースの実装
        todo!("SQLite-based repositories not yet implemented")
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::core::{Agent, AgentTraits, Position, WorldDimensions};

    #[tokio::test]
    async fn test_in_memory_simulation_repository() {
        let mut repo = InMemorySimulationRepository::new();
        let world = SimulationWorld::new(WorldDimensions::new(10, 10).unwrap());

        let id = repo.save_world(&world).await.unwrap();
        let loaded_world = repo.load_world(&id).await.unwrap();

        assert_eq!(world.dimensions.width, loaded_world.dimensions.width);
        assert_eq!(world.dimensions.height, loaded_world.dimensions.height);
        assert_eq!(world.generation.current, loaded_world.generation.current);
    }

    #[tokio::test]
    async fn test_in_memory_statistics_repository() {
        let mut repo = InMemoryStatisticsRepository::new();
        let stats = WorldStatistics {
            generation: 1,
            population: 100,
            avg_cooperation: 0.5,
            avg_movement: 0.3,
            avg_score: 50.0,
            avg_energy: 75.0,
            min_cooperation: 0.0,
            max_cooperation: 1.0,
            std_cooperation: 0.2,
            total_battles: 1000,
        };

        repo.save_statistics(&stats).await.unwrap();
        let latest = repo.get_latest_statistics().await.unwrap().unwrap();

        assert_eq!(stats.generation, latest.generation);
        assert_eq!(stats.population, latest.population);
    }

    #[tokio::test]
    async fn test_repository_factory() {
        let (sim_repo, stats_repo, history_repo) = RepositoryFactory::create_in_memory();

        // 基本的な作成テスト
        assert_eq!(sim_repo.worlds.len(), 0);
        assert_eq!(stats_repo.statistics.len(), 0);
        assert_eq!(history_repo.histories.len(), 0);
    }
}
