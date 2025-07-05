// ========================================
// ID Types - エンティティの識別子
// ========================================

use serde::{Deserialize, Serialize};
use std::hash::Hash;

/// エージェント ID
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub struct AgentId(u64);

/// シミュレーション ID
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub struct SimulationId(u64);

impl AgentId {
    /// 新しいエージェントIDを生成
    pub fn new(id: u64) -> Self {
        Self(id)
    }

    /// IDの値を取得
    pub fn value(&self) -> u64 {
        self.0
    }

    /// ランダムなIDを生成
    pub fn generate() -> Self {
        use rand::Rng;
        Self(rand::thread_rng().gen())
    }
}

impl SimulationId {
    /// 新しいシミュレーションIDを生成
    pub fn new(id: u64) -> Self {
        Self(id)
    }

    /// IDの値を取得
    pub fn value(&self) -> u64 {
        self.0
    }

    /// ランダムなIDを生成
    pub fn generate() -> Self {
        use rand::Rng;
        Self(rand::thread_rng().gen())
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::collections::HashSet;

    #[test]
    fn test_agent_id_creation() {
        let id = AgentId::new(42);
        assert_eq!(id.value(), 42);
    }

    #[test]
    fn test_agent_id_equality() {
        let id1 = AgentId::new(42);
        let id2 = AgentId::new(42);
        let id3 = AgentId::new(43);

        assert_eq!(id1, id2);
        assert_ne!(id1, id3);
    }

    #[test]
    fn test_agent_id_hash() {
        let mut set = HashSet::new();
        let id1 = AgentId::new(42);
        let id2 = AgentId::new(42);
        let id3 = AgentId::new(43);

        set.insert(id1);
        set.insert(id2); // 同じIDなので追加されない
        set.insert(id3);

        assert_eq!(set.len(), 2);
    }

    #[test]
    fn test_agent_id_generate() {
        let id1 = AgentId::generate();
        let id2 = AgentId::generate();

        // 生成されたIDが異なることを確認（確率的だが非常に高い確率で成功）
        assert_ne!(id1, id2);
    }

    #[test]
    fn test_simulation_id_creation() {
        let id = SimulationId::new(123);
        assert_eq!(id.value(), 123);
    }

    #[test]
    fn test_simulation_id_generate() {
        let id1 = SimulationId::generate();
        let id2 = SimulationId::generate();

        assert_ne!(id1, id2);
    }
}