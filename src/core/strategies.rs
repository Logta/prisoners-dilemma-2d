// ========================================
// Strategy Module - 戦略パターンの実装
// ========================================

use crate::core::entities::{Agent, AgentId};
use rand::Rng;
use std::collections::HashMap;

/// 戦略パターンのトレイト
pub trait Strategy {
    fn decide_cooperation<R: Rng>(
        &self,
        agent: &Agent,
        history: &BattleHistory,
        opponent_id: AgentId,
        rng: &mut R,
    ) -> bool;
}

/// 戦闘履歴を記録する構造体
#[derive(Debug, Clone)]
pub struct BattleHistory {
    /// プレイヤーごとの戦闘記録
    battles: HashMap<(AgentId, AgentId), Vec<BattleRecord>>,
}

/// 個別の戦闘記録
#[derive(Debug, Clone)]
pub struct BattleRecord {
    pub player1_cooperated: bool,
    pub player2_cooperated: bool,
    pub player1_payoff: f64,
    pub player2_payoff: f64,
}

/// TitForTat戦略
pub struct TitForTatStrategy;

/// Pavlov戦略
pub struct PavlovStrategy;

impl BattleHistory {
    /// 新しい戦闘履歴を作成
    pub fn new() -> Self {
        Self {
            battles: HashMap::new(),
        }
    }

    /// 戦闘結果を記録
    pub fn add_battle_result(
        &mut self,
        player1_id: AgentId,
        player2_id: AgentId,
        player1_cooperated: bool,
        player2_cooperated: bool,
    ) {
        let key = (player1_id, player2_id);
        let record = BattleRecord {
            player1_cooperated,
            player2_cooperated,
            player1_payoff: 0.0, // 後で設定
            player2_payoff: 0.0,
        };
        
        self.battles.entry(key).or_insert_with(Vec::new).push(record);
    }

    /// 最後の戦闘の利得を設定
    pub fn set_payoff_for_last_battle(&mut self, player1_id: AgentId, player1_payoff: f64, player2_payoff: f64) {
        if let Some(battles) = self.battles.values_mut().find(|battles| !battles.is_empty()) {
            if let Some(last_battle) = battles.last_mut() {
                last_battle.player1_payoff = player1_payoff;
                last_battle.player2_payoff = player2_payoff;
            }
        }
    }

    /// 相手との最後の戦闘記録を取得
    pub fn get_last_battle_against(&self, player_id: AgentId, opponent_id: AgentId) -> Option<&BattleRecord> {
        self.battles.get(&(player_id, opponent_id))
            .and_then(|battles| battles.last())
    }

    /// 相手との戦闘履歴を取得
    pub fn get_battles_against(&self, player_id: AgentId, opponent_id: AgentId) -> Vec<&BattleRecord> {
        self.battles.get(&(player_id, opponent_id))
            .map(|battles| battles.iter().collect())
            .unwrap_or_else(Vec::new)
    }
}

impl Strategy for TitForTatStrategy {
    fn decide_cooperation<R: Rng>(
        &self,
        agent: &Agent,
        history: &BattleHistory,
        opponent_id: AgentId,
        _rng: &mut R,
    ) -> bool {
        // 最初の手は協力する
        if let Some(last_battle) = history.get_last_battle_against(agent.id, opponent_id) {
            // 相手の前回の行動をコピー
            last_battle.player2_cooperated
        } else {
            // 最初の手は協力
            true
        }
    }
}

impl Strategy for PavlovStrategy {
    fn decide_cooperation<R: Rng>(
        &self,
        agent: &Agent,
        history: &BattleHistory,
        opponent_id: AgentId,
        _rng: &mut R,
    ) -> bool {
        // 最初の手は協力する
        if let Some(last_battle) = history.get_last_battle_against(agent.id, opponent_id) {
            // 前回の利得が良かった場合は同じ行動を繰り返す
            // 悪かった場合は行動を変える
            let my_payoff = last_battle.player1_payoff;
            let opponent_payoff = last_battle.player2_payoff;
            
            if my_payoff >= opponent_payoff {
                // 前回勝った（または引き分け）場合は同じ行動を繰り返す
                last_battle.player1_cooperated
            } else {
                // 前回負けた場合は行動を変える
                !last_battle.player1_cooperated
            }
        } else {
            // 最初の手は協力
            true
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::core::entities::{Agent, AgentId, AgentTraits};
    use crate::core::value_objects::Position;

    #[test]
    fn test_tit_for_tat_strategy_first_move() {
        // TitForTat戦略：最初の手は協力する
        let position = Position::new(0, 0);
        let traits = AgentTraits {
            cooperation_rate: 0.5,
            movement_rate: 0.3,
            aggression_level: 0.2,
            learning_rate: 0.1,
        };
        
        let agent = Agent::new(AgentId(1), position, traits);
        let opponent_id = AgentId(2);
        let history = BattleHistory::new();
        
        let strategy = TitForTatStrategy;
        let decision = strategy.decide_cooperation(
            &agent,
            &history,
            opponent_id,
            &mut rand::thread_rng()
        );
        assert!(decision);
    }

    #[test]
    fn test_tit_for_tat_strategy_copy_last_move() {
        // TitForTat戦略：相手の前回の行動をコピー
        let position = Position::new(0, 0);
        let traits = AgentTraits {
            cooperation_rate: 0.5,
            movement_rate: 0.3,
            aggression_level: 0.2,
            learning_rate: 0.1,
        };
        
        let agent = Agent::new(AgentId(1), position, traits);
        let opponent_id = AgentId(2);
        let mut history = BattleHistory::new();
        
        // 相手が前回裏切った場合
        history.add_battle_result(AgentId(1), opponent_id, true, false);
        
        let strategy = TitForTatStrategy;
        let decision = strategy.decide_cooperation(
            &agent,
            &history,
            opponent_id,
            &mut rand::thread_rng()
        );
        assert!(!decision); // 相手が前回裏切ったので、今回は裏切る
    }

    #[test]
    fn test_pavlov_strategy_repeat_if_won() {
        // Pavlov戦略：前回勝った場合は同じ行動を繰り返す
        let position = Position::new(0, 0);
        let traits = AgentTraits {
            cooperation_rate: 0.5,
            movement_rate: 0.3,
            aggression_level: 0.2,
            learning_rate: 0.1,
        };
        
        let agent = Agent::new(AgentId(1), position, traits);
        let opponent_id = AgentId(2);
        let mut history = BattleHistory::new();
        
        // 前回協力して勝った場合（CC: 両方協力）
        history.add_battle_result(AgentId(1), opponent_id, true, true);
        history.set_payoff_for_last_battle(AgentId(1), 3.0, 3.0);
        
        let strategy = PavlovStrategy;
        let decision = strategy.decide_cooperation(
            &agent,
            &history,
            opponent_id,
            &mut rand::thread_rng()
        );
        assert!(decision); // 前回協力して利得を得たので、今回も協力
    }

    #[test]
    fn test_pavlov_strategy_switch_if_lost() {
        // Pavlov戦略：前回負けた場合は行動を変える
        let position = Position::new(0, 0);
        let traits = AgentTraits {
            cooperation_rate: 0.5,
            movement_rate: 0.3,
            aggression_level: 0.2,
            learning_rate: 0.1,
        };
        
        let agent = Agent::new(AgentId(1), position, traits);
        let opponent_id = AgentId(2);
        let mut history = BattleHistory::new();
        
        // 前回協力して負けた場合（CD: 協力vs裏切り）
        history.add_battle_result(AgentId(1), opponent_id, true, false);
        history.set_payoff_for_last_battle(AgentId(1), 0.0, 5.0);
        
        let strategy = PavlovStrategy;
        let decision = strategy.decide_cooperation(
            &agent,
            &history,
            opponent_id,
            &mut rand::thread_rng()
        );
        assert!(!decision); // 前回協力して負けたので、今回は裏切る
    }
}