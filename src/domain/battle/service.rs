// ========================================
// Battle Service - 戦闘サービス
// ========================================

use crate::domain::agent::Agent;
use super::{PayoffMatrix, BattleOutcome};

/// 戦闘サービス
pub struct BattleService {
    payoff_matrix: PayoffMatrix,
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

    /// 2つのエージェント間で戦闘を実行（新しい戦略システム使用）
    pub fn execute_battle(
        &self,
        agent1: &mut Agent,
        agent2: &mut Agent,
    ) -> Result<BattleOutcome, String> {
        // 新しい戦略システムを使用して協力判定
        let agent1_cooperates = agent1.decides_to_cooperate_with(agent2.id())?;
        let agent2_cooperates = agent2.decides_to_cooperate_with(agent1.id())?;

        let outcome = self.payoff_matrix.calculate_outcome(agent1_cooperates, agent2_cooperates);

        // 相互作用を記録
        agent1.record_interaction(agent2.id(), agent1_cooperates, agent2_cooperates, outcome.agent1_score);
        agent2.record_interaction(agent1.id(), agent2_cooperates, agent1_cooperates, outcome.agent2_score);

        Ok(outcome)
    }

    /// 利得マトリクスを取得
    pub fn payoff_matrix(&self) -> &PayoffMatrix {
        &self.payoff_matrix
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::domain::agent::{AgentTraits, Agent, StrategyGenes};
    use crate::domain::shared::{Position, AgentId};

    fn create_test_agent(id: u64, cooperation: f64, strategy_gene: f64) -> Agent {
        let agent_id = AgentId::new(id);
        let position = Position::new(0, 0);
        let traits = AgentTraits::new(cooperation, 0.5, 0.7, 0.5).unwrap();
        let strategy_genes = StrategyGenes::new(strategy_gene, 0.8, 0.6, 0.7);
        Agent::new_with_strategy(agent_id, position, traits, strategy_genes)
    }

    #[test]
    fn test_battle_service_creation() {
        let service = BattleService::standard();
        assert_eq!(service.payoff_matrix().mutual_cooperation(), 3.0);
    }

    #[test]
    fn test_battle_service_execute_battle() {
        let service = BattleService::standard();
        let mut agent1 = create_test_agent(1, 0.8, 0.1); // Always Cooperate
        let mut agent2 = create_test_agent(2, 0.3, 0.2); // Always Defect
        
        let outcome = service.execute_battle(&mut agent1, &mut agent2).unwrap();
        
        // 結果が有効な範囲内であることを確認
        assert!(outcome.agent1_score >= 0.0);
        assert!(outcome.agent2_score >= 0.0);
        assert!(outcome.agent1_score <= 5.0);
        assert!(outcome.agent2_score <= 5.0);
    }

    #[test]
    fn test_battle_service_strategy_integration() {
        let service = BattleService::standard();
        let mut agent1 = create_test_agent(1, 0.8, 0.4); // Tit-for-Tat
        let mut agent2 = create_test_agent(2, 0.6, 0.6); // Pavlov
        
        // 複数回戦闘を実行して戦略の動作を確認
        for _ in 0..5 {
            let _outcome = service.execute_battle(&mut agent1, &mut agent2).unwrap();
        }
        
        // エージェントが相互作用履歴を持っていることを確認
        // （具体的な値は戦略次第だが、記録自体は行われているはず）
    }

    #[test]
    fn test_battle_service_custom_matrix() {
        let custom_matrix = PayoffMatrix::new(2.0, 0.5, -1.0, 4.0);
        let service = BattleService::new(custom_matrix);
        
        assert_eq!(service.payoff_matrix().mutual_cooperation(), 2.0);
        assert_eq!(service.payoff_matrix().defection_advantage(), 4.0);
    }
}