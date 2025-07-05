// ========================================
// Battle History - 戦闘履歴の管理
// ========================================

use crate::domain::shared::AgentId;
use super::BattleOutcome;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;

/// 戦闘履歴のエントリ
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct BattleRecord {
    opponent_id: AgentId,
    agent_cooperated: bool,
    opponent_cooperated: bool,
    agent_score: f64,
    round: u32,
}

/// エージェント間の戦闘履歴
#[derive(Debug, Clone, Default, Serialize, Deserialize)]
pub struct BattleHistory {
    records: HashMap<AgentId, Vec<BattleRecord>>,
    current_round: u32,
}

impl BattleRecord {
    /// 新しい戦闘記録を作成
    pub fn new(
        opponent_id: AgentId,
        agent_cooperated: bool,
        opponent_cooperated: bool,
        agent_score: f64,
        round: u32,
    ) -> Self {
        Self {
            opponent_id,
            agent_cooperated,
            opponent_cooperated,
            agent_score,
            round,
        }
    }

    /// ゲッター
    pub fn opponent_id(&self) -> AgentId { self.opponent_id }
    pub fn agent_cooperated(&self) -> bool { self.agent_cooperated }
    pub fn opponent_cooperated(&self) -> bool { self.opponent_cooperated }
    pub fn agent_score(&self) -> f64 { self.agent_score }
    pub fn round(&self) -> u32 { self.round }
}

impl BattleHistory {
    /// 新しい戦闘履歴を作成
    pub fn new() -> Self {
        Self {
            records: HashMap::new(),
            current_round: 0,
        }
    }

    /// 戦闘記録を追加
    pub fn add_battle(
        &mut self,
        agent_id: AgentId,
        outcome: &BattleOutcome,
        opponent_id: AgentId,
        agent_was_first: bool,
    ) {
        let (agent_cooperated, opponent_cooperated, agent_score) = if agent_was_first {
            (outcome.agent1_cooperated, outcome.agent2_cooperated, outcome.agent1_score)
        } else {
            (outcome.agent2_cooperated, outcome.agent1_cooperated, outcome.agent2_score)
        };

        let record = BattleRecord::new(
            opponent_id,
            agent_cooperated,
            opponent_cooperated,
            agent_score,
            self.current_round,
        );

        self.records.entry(agent_id).or_insert_with(Vec::new).push(record);
    }

    /// 特定の相手との最後の戦闘記録を取得
    pub fn last_battle_with(&self, agent_id: AgentId, opponent_id: AgentId) -> Option<&BattleRecord> {
        self.records
            .get(&agent_id)?
            .iter()
            .rev()
            .find(|record| record.opponent_id == opponent_id)
    }

    /// 特定の相手との戦闘記録を全て取得
    pub fn battles_with(&self, agent_id: AgentId, opponent_id: AgentId) -> Vec<&BattleRecord> {
        self.records
            .get(&agent_id)
            .map(|records| {
                records
                    .iter()
                    .filter(|record| record.opponent_id == opponent_id)
                    .collect()
            })
            .unwrap_or_default()
    }

    /// エージェントの全戦闘記録を取得
    pub fn all_battles(&self, agent_id: AgentId) -> Option<&Vec<BattleRecord>> {
        self.records.get(&agent_id)
    }

    /// 現在のラウンドを進める
    pub fn advance_round(&mut self) {
        self.current_round += 1;
    }

    /// 現在のラウンド数を取得
    pub fn current_round(&self) -> u32 {
        self.current_round
    }

    /// 履歴をクリア
    pub fn clear(&mut self) {
        self.records.clear();
        self.current_round = 0;
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::domain::battle::PayoffMatrix;

    fn create_test_outcome(agent1_coop: bool, agent2_coop: bool) -> BattleOutcome {
        let matrix = PayoffMatrix::standard();
        matrix.calculate_outcome(agent1_coop, agent2_coop)
    }

    #[test]
    fn test_battle_record_creation() {
        let opponent_id = AgentId::new(2);
        
        let record = BattleRecord::new(opponent_id, true, false, 0.0, 5);
        
        assert_eq!(record.opponent_id(), opponent_id);
        assert!(record.agent_cooperated());
        assert!(!record.opponent_cooperated());
        assert_eq!(record.agent_score(), 0.0);
        assert_eq!(record.round(), 5);
    }

    #[test]
    fn test_battle_history_creation() {
        let history = BattleHistory::new();
        
        assert_eq!(history.current_round(), 0);
        assert!(history.all_battles(AgentId::new(1)).is_none());
    }

    #[test]
    fn test_battle_history_add_battle() {
        let mut history = BattleHistory::new();
        let agent1 = AgentId::new(1);
        let agent2 = AgentId::new(2);
        let outcome = create_test_outcome(true, false);
        
        history.add_battle(agent1, &outcome, agent2, true);
        
        let records = history.all_battles(agent1).unwrap();
        assert_eq!(records.len(), 1);
        assert_eq!(records[0].opponent_id(), agent2);
        assert!(records[0].agent_cooperated());
        assert!(!records[0].opponent_cooperated());
    }

    #[test]
    fn test_battle_history_last_battle_with() {
        let mut history = BattleHistory::new();
        let agent1 = AgentId::new(1);
        let agent2 = AgentId::new(2);
        
        // 最初の戦闘
        let outcome1 = create_test_outcome(true, false);
        history.add_battle(agent1, &outcome1, agent2, true);
        
        // 2回目の戦闘
        let outcome2 = create_test_outcome(false, true);
        history.add_battle(agent1, &outcome2, agent2, true);
        
        let last_battle = history.last_battle_with(agent1, agent2).unwrap();
        assert!(!last_battle.agent_cooperated());
        assert!(last_battle.opponent_cooperated());
    }

    #[test]
    fn test_battle_history_battles_with() {
        let mut history = BattleHistory::new();
        let agent1 = AgentId::new(1);
        let agent2 = AgentId::new(2);
        let agent3 = AgentId::new(3);
        
        // エージェント2との戦闘2回
        history.add_battle(agent1, &create_test_outcome(true, false), agent2, true);
        history.add_battle(agent1, &create_test_outcome(false, true), agent2, true);
        
        // エージェント3との戦闘1回
        history.add_battle(agent1, &create_test_outcome(true, true), agent3, true);
        
        let battles_with_2 = history.battles_with(agent1, agent2);
        let battles_with_3 = history.battles_with(agent1, agent3);
        
        assert_eq!(battles_with_2.len(), 2);
        assert_eq!(battles_with_3.len(), 1);
    }

    #[test]
    fn test_battle_history_round_advancement() {
        let mut history = BattleHistory::new();
        
        assert_eq!(history.current_round(), 0);
        
        history.advance_round();
        assert_eq!(history.current_round(), 1);
        
        history.advance_round();
        assert_eq!(history.current_round(), 2);
    }

    #[test]
    fn test_battle_history_clear() {
        let mut history = BattleHistory::new();
        let agent1 = AgentId::new(1);
        let agent2 = AgentId::new(2);
        
        history.add_battle(agent1, &create_test_outcome(true, false), agent2, true);
        history.advance_round();
        
        assert!(history.all_battles(agent1).is_some());
        assert_eq!(history.current_round(), 1);
        
        history.clear();
        
        assert!(history.all_battles(agent1).is_none());
        assert_eq!(history.current_round(), 0);
    }

    #[test]
    fn test_battle_history_agent_was_second() {
        let mut history = BattleHistory::new();
        let agent1 = AgentId::new(1);
        let agent2 = AgentId::new(2);
        let outcome = create_test_outcome(true, false); // agent1=true, agent2=false
        
        // agent2の視点で記録（agent_was_first=false）
        history.add_battle(agent2, &outcome, agent1, false);
        
        let record = &history.all_battles(agent2).unwrap()[0];
        assert!(!record.agent_cooperated()); // agent2が協力しなかった
        assert!(record.opponent_cooperated()); // opponent(agent1)が協力した
    }
}