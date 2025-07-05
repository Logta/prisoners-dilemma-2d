// ========================================
// Battle Service - 戦闘サービス
// ========================================

use crate::domain::agent::Agent;
use crate::domain::shared::AgentId;
use super::{PayoffMatrix, BattleOutcome, BattleHistory};

/// 戦闘戦略
pub trait BattleStrategy {
    /// 協力するかどうかを決定
    fn decide_cooperation(
        &self,
        agent: &Agent,
        opponent_id: AgentId,
        history: &BattleHistory,
    ) -> bool;
}

/// ランダム戦略
pub struct RandomStrategy;

/// Tit-for-Tat戦略
pub struct TitForTatStrategy;

/// Pavlov戦略（Win-Stay-Lose-Shift）
pub struct PavlovStrategy;

/// 戦闘サービス
pub struct BattleService {
    payoff_matrix: PayoffMatrix,
}

impl BattleStrategy for RandomStrategy {
    fn decide_cooperation(
        &self,
        agent: &Agent,
        _opponent_id: AgentId,
        _history: &BattleHistory,
    ) -> bool {
        agent.decides_to_cooperate()
    }
}

impl BattleStrategy for TitForTatStrategy {
    fn decide_cooperation(
        &self,
        agent: &Agent,
        opponent_id: AgentId,
        history: &BattleHistory,
    ) -> bool {
        // 最初は協力、その後は相手の前回の行動をコピー
        match history.last_battle_with(agent.id(), opponent_id) {
            Some(last_battle) => last_battle.opponent_cooperated(),
            None => true, // 初回は協力
        }
    }
}

impl BattleStrategy for PavlovStrategy {
    fn decide_cooperation(
        &self,
        agent: &Agent,
        opponent_id: AgentId,
        history: &BattleHistory,
    ) -> bool {
        match history.last_battle_with(agent.id(), opponent_id) {
            Some(last_battle) => {
                // 前回のスコアが良かった（3.0以上）なら同じ行動、悪かったなら変更
                if last_battle.agent_score() >= 3.0 {
                    last_battle.agent_cooperated()
                } else {
                    !last_battle.agent_cooperated()
                }
            }
            None => true, // 初回は協力
        }
    }
}

impl BattleService {
    /// 新しい戦闘サービスを作成
    pub fn new(payoff_matrix: PayoffMatrix) -> Self {
        Self { payoff_matrix }
    }

    /// 標準的な戦闘サービスを作成
    pub fn standard() -> Self {
        Self::new(PayoffMatrix::standard())
    }

    /// エージェントの戦略を選択
    pub fn select_strategy(&self, agent: &Agent) -> Box<dyn BattleStrategy> {
        let aggression = agent.traits().aggression_level();
        let learning = agent.traits().learning_ability();

        if aggression < 0.3 {
            Box::new(RandomStrategy)
        } else if aggression >= 0.3 && aggression < 0.7 && learning > 0.5 {
            Box::new(TitForTatStrategy)
        } else if aggression >= 0.7 && learning > 0.4 {
            Box::new(PavlovStrategy)
        } else {
            Box::new(RandomStrategy)
        }
    }

    /// 2つのエージェント間で戦闘を実行
    pub fn execute_battle(
        &self,
        agent1: &Agent,
        agent2: &Agent,
        history: &BattleHistory,
    ) -> BattleOutcome {
        let strategy1 = self.select_strategy(agent1);
        let strategy2 = self.select_strategy(agent2);

        let agent1_cooperates = strategy1.decide_cooperation(agent1, agent2.id(), history);
        let agent2_cooperates = strategy2.decide_cooperation(agent2, agent1.id(), history);

        self.payoff_matrix.calculate_outcome(agent1_cooperates, agent2_cooperates)
    }

    /// 利得マトリクスを取得
    pub fn payoff_matrix(&self) -> &PayoffMatrix {
        &self.payoff_matrix
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::domain::agent::{AgentTraits, Agent};
    use crate::domain::shared::Position;

    fn create_test_agent(id: u64, aggression: f64, learning: f64) -> Agent {
        let agent_id = AgentId::new(id);
        let position = Position::new(0, 0);
        let traits = AgentTraits::new(0.5, aggression, learning, 0.5).unwrap();
        Agent::new(agent_id, position, traits)
    }

    #[test]
    fn test_random_strategy() {
        let strategy = RandomStrategy;
        let agent = create_test_agent(1, 0.2, 0.3); // 低攻撃性
        let history = BattleHistory::new();
        
        // ランダムなので結果は予測不可能だが、エラーが出ないことを確認
        let _result = strategy.decide_cooperation(&agent, AgentId::new(2), &history);
    }

    #[test]
    fn test_tit_for_tat_strategy_first_move() {
        let strategy = TitForTatStrategy;
        let agent = create_test_agent(1, 0.5, 0.8);
        let history = BattleHistory::new();
        
        // 初回は協力
        assert!(strategy.decide_cooperation(&agent, AgentId::new(2), &history));
    }

    #[test]
    fn test_tit_for_tat_strategy_with_history() {
        let strategy = TitForTatStrategy;
        let agent = create_test_agent(1, 0.5, 0.8);
        let mut history = BattleHistory::new();
        
        // 相手が裏切った履歴を追加
        let outcome = PayoffMatrix::standard().calculate_outcome(true, false);
        history.add_battle(agent.id(), &outcome, AgentId::new(2), true);
        
        // 相手の前回の行動（裏切り）をコピー
        assert!(!strategy.decide_cooperation(&agent, AgentId::new(2), &history));
    }

    #[test]
    fn test_pavlov_strategy_first_move() {
        let strategy = PavlovStrategy;
        let agent = create_test_agent(1, 0.8, 0.6);
        let history = BattleHistory::new();
        
        // 初回は協力
        assert!(strategy.decide_cooperation(&agent, AgentId::new(2), &history));
    }

    #[test]
    fn test_pavlov_strategy_good_outcome() {
        let strategy = PavlovStrategy;
        let agent = create_test_agent(1, 0.8, 0.6);
        let mut history = BattleHistory::new();
        
        // 良い結果（相互協力）の履歴を追加
        let outcome = PayoffMatrix::standard().calculate_outcome(true, true);
        history.add_battle(agent.id(), &outcome, AgentId::new(2), true);
        
        // 良い結果だったので同じ行動（協力）を継続
        assert!(strategy.decide_cooperation(&agent, AgentId::new(2), &history));
    }

    #[test]
    fn test_pavlov_strategy_bad_outcome() {
        let strategy = PavlovStrategy;
        let agent = create_test_agent(1, 0.8, 0.6);
        let mut history = BattleHistory::new();
        
        // 悪い結果（裏切られた）の履歴を追加
        let outcome = PayoffMatrix::standard().calculate_outcome(true, false);
        history.add_battle(agent.id(), &outcome, AgentId::new(2), true);
        
        // 悪い結果だったので行動を変更（協力→裏切り）
        assert!(!strategy.decide_cooperation(&agent, AgentId::new(2), &history));
    }

    #[test]
    fn test_battle_service_creation() {
        let service = BattleService::standard();
        assert_eq!(service.payoff_matrix().mutual_cooperation(), 3.0);
    }

    #[test]
    fn test_battle_service_strategy_selection() {
        let service = BattleService::standard();
        
        // 低攻撃性 -> Random
        let low_aggression = create_test_agent(1, 0.2, 0.8);
        let _strategy = service.select_strategy(&low_aggression);
        // 実際の型チェックは難しいので、実行エラーがないことを確認
        
        // 中攻撃性・高学習 -> TitForTat
        let mid_aggression = create_test_agent(2, 0.5, 0.8);
        let _strategy = service.select_strategy(&mid_aggression);
        
        // 高攻撃性・高学習 -> Pavlov
        let high_aggression = create_test_agent(3, 0.8, 0.6);
        let _strategy = service.select_strategy(&high_aggression);
    }

    #[test]
    fn test_battle_service_execute_battle() {
        let service = BattleService::standard();
        let agent1 = create_test_agent(1, 0.2, 0.3); // Random
        let agent2 = create_test_agent(2, 0.5, 0.8); // TitForTat
        let history = BattleHistory::new();
        
        let outcome = service.execute_battle(&agent1, &agent2, &history);
        
        // 初回なのでTitForTatは協力、Randomは不定
        // 結果が有効な範囲内であることを確認
        assert!(outcome.agent1_score >= 0.0);
        assert!(outcome.agent2_score >= 0.0);
        assert!(outcome.agent1_score <= 5.0);
        assert!(outcome.agent2_score <= 5.0);
    }

    #[test]
    fn test_battle_service_custom_matrix() {
        let custom_matrix = PayoffMatrix::new(2.0, 0.5, -1.0, 4.0);
        let service = BattleService::new(custom_matrix);
        
        assert_eq!(service.payoff_matrix().mutual_cooperation(), 2.0);
        assert_eq!(service.payoff_matrix().defection_advantage(), 4.0);
    }
}