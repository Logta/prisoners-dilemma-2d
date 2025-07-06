// ========================================
// Battle Use Case - 戦闘ユースケース
// ========================================

use crate::domain::{
    Agent, AgentId, BattleService, BattleHistory, BattleOutcome, PayoffMatrix
};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;

/// 戦闘実行コマンド
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct ExecuteBattleCommand {
    pub agent1_id: AgentId,
    pub agent2_id: AgentId,
}

/// 戦闘結果
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct BattleResult {
    pub outcome: BattleOutcome,
    pub agent1_strategy: String,
    pub agent2_strategy: String,
}

/// 戦闘履歴クエリ
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct BattleHistoryQuery {
    pub agent_id: AgentId,
    pub opponent_id: Option<AgentId>,
    pub limit: Option<usize>,
}

/// 戦闘履歴結果
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct BattleHistoryResult {
    pub battles: Vec<BattleHistoryEntry>,
    pub total_battles: usize,
    pub win_rate: f64,
    pub average_score: f64,
}

/// 戦闘履歴エントリ
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct BattleHistoryEntry {
    pub opponent_id: AgentId,
    pub agent_cooperated: bool,
    pub opponent_cooperated: bool,
    pub agent_score: f64,
    pub round: u32,
}

/// 戦闘ユースケース
pub struct BattleUseCase {
    battle_service: BattleService,
    battle_history: BattleHistory,
}

/// 戦闘エラー
#[derive(Debug, Clone, PartialEq)]
pub enum BattleUseCaseError {
    AgentNotFound,
    SameAgent,
    InvalidHistory,
}

impl BattleUseCase {
    /// 新しい戦闘ユースケースを作成
    pub fn new() -> Self {
        Self {
            battle_service: BattleService::standard(),
            battle_history: BattleHistory::new(),
        }
    }

    /// カスタム利得マトリクスで戦闘ユースケースを作成
    pub fn with_payoff_matrix(matrix: PayoffMatrix) -> Self {
        Self {
            battle_service: BattleService::new(matrix),
            battle_history: BattleHistory::new(),
        }
    }

    /// 2つのエージェント間で戦闘を実行
    pub fn execute_battle(
        &mut self,
        command: ExecuteBattleCommand,
        agents: &HashMap<AgentId, Agent>,
    ) -> Result<BattleResult, BattleUseCaseError> {
        if command.agent1_id == command.agent2_id {
            return Err(BattleUseCaseError::SameAgent);
        }

        let agent1 = agents.get(&command.agent1_id).ok_or(BattleUseCaseError::AgentNotFound)?;
        let agent2 = agents.get(&command.agent2_id).ok_or(BattleUseCaseError::AgentNotFound)?;

        // 新しい戦略システムでは、エージェント自体が戦略を持っているため
        // 基本的な協力判定のみを行い、相互作用記録は省略
        let agent1_cooperates = {
            let mut agent1_clone = agent1.clone();
            agent1_clone.decides_to_cooperate_with(command.agent2_id).unwrap_or(false)
        };
        
        let agent2_cooperates = {
            let mut agent2_clone = agent2.clone();
            agent2_clone.decides_to_cooperate_with(command.agent1_id).unwrap_or(false)
        };
        
        let outcome = self.battle_service.payoff_matrix().calculate_outcome(agent1_cooperates, agent2_cooperates);

        // 戦闘履歴を記録
        self.battle_history.add_battle(command.agent1_id, &outcome, command.agent2_id, true);
        self.battle_history.add_battle(command.agent2_id, &outcome, command.agent1_id, false);

        // 戦略名を取得
        let strategy1 = self.get_strategy_name(agent1);
        let strategy2 = self.get_strategy_name(agent2);

        Ok(BattleResult {
            outcome,
            agent1_strategy: strategy1,
            agent2_strategy: strategy2,
        })
    }

    /// 戦闘履歴を取得
    pub fn get_battle_history(&self, query: BattleHistoryQuery) -> Result<BattleHistoryResult, BattleUseCaseError> {
        let battles: Vec<BattleHistoryEntry> = if let Some(opponent_id) = query.opponent_id {
            // 特定の相手との戦闘履歴
            self.battle_history.battles_with(query.agent_id, opponent_id)
                .into_iter()
                .map(|record| BattleHistoryEntry {
                    opponent_id: record.opponent_id(),
                    agent_cooperated: record.agent_cooperated(),
                    opponent_cooperated: record.opponent_cooperated(),
                    agent_score: record.agent_score(),
                    round: record.round(),
                })
                .collect()
        } else {
            // 全ての戦闘履歴
            self.battle_history.all_battles(query.agent_id)
                .map(|records| {
                    records.iter()
                        .map(|record| BattleHistoryEntry {
                            opponent_id: record.opponent_id(),
                            agent_cooperated: record.agent_cooperated(),
                            opponent_cooperated: record.opponent_cooperated(),
                            agent_score: record.agent_score(),
                            round: record.round(),
                        })
                        .collect()
                })
                .unwrap_or_default()
        };

        let total_battles = battles.len();
        let wins = battles.iter().filter(|b| b.agent_score >= 3.0).count();
        let win_rate = if total_battles > 0 {
            wins as f64 / total_battles as f64
        } else {
            0.0
        };

        let total_score: f64 = battles.iter().map(|b| b.agent_score).sum();
        let average_score = if total_battles > 0 {
            total_score / total_battles as f64
        } else {
            0.0
        };

        let limited_battles = if let Some(limit) = query.limit {
            battles.into_iter().rev().take(limit).collect()
        } else {
            battles
        };

        Ok(BattleHistoryResult {
            battles: limited_battles,
            total_battles,
            win_rate,
            average_score,
        })
    }

    /// 最後の戦闘結果を取得
    pub fn get_last_battle_with(
        &self,
        agent_id: AgentId,
        opponent_id: AgentId,
    ) -> Option<BattleHistoryEntry> {
        self.battle_history.last_battle_with(agent_id, opponent_id)
            .map(|record| BattleHistoryEntry {
                opponent_id: record.opponent_id(),
                agent_cooperated: record.agent_cooperated(),
                opponent_cooperated: record.opponent_cooperated(),
                agent_score: record.agent_score(),
                round: record.round(),
            })
    }

    /// 現在のラウンドを取得
    pub fn current_round(&self) -> u32 {
        self.battle_history.current_round()
    }

    /// ラウンドを進める
    pub fn advance_round(&mut self) {
        self.battle_history.advance_round();
    }

    /// 履歴をクリア
    pub fn clear_history(&mut self) {
        self.battle_history.clear();
    }

    /// 利得マトリクスを取得
    pub fn payoff_matrix(&self) -> &PayoffMatrix {
        self.battle_service.payoff_matrix()
    }

    /// エージェントの戦略名を取得
    fn get_strategy_name(&self, agent: &Agent) -> String {
        agent.strategy().current_strategy().description().to_string()
    }
}

impl Default for BattleUseCase {
    fn default() -> Self {
        Self::new()
    }
}

impl std::fmt::Display for BattleUseCaseError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            BattleUseCaseError::AgentNotFound => write!(f, "Agent not found"),
            BattleUseCaseError::SameAgent => write!(f, "Cannot battle with the same agent"),
            BattleUseCaseError::InvalidHistory => write!(f, "Invalid battle history"),
        }
    }
}

impl std::error::Error for BattleUseCaseError {}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::domain::{Agent, AgentTraits, Position, StrategyGenes};

    fn create_test_agent(id: u64, cooperation: f64, strategy_gene: f64) -> Agent {
        let agent_id = AgentId::new(id);
        let position = Position::new(0, 0);
        let traits = AgentTraits::new(cooperation, 0.5, 0.7, 0.5).unwrap();
        let strategy_genes = StrategyGenes::new(strategy_gene, 0.8, 0.6, 0.7);
        Agent::new_with_strategy(agent_id, position, traits, strategy_genes)
    }

    fn create_test_agents() -> HashMap<AgentId, Agent> {
        let mut agents = HashMap::new();
        
        let agent1 = create_test_agent(1, 0.8, 0.75); // Random (strategy_gene 0.75)
        let agent2 = create_test_agent(2, 0.6, 0.4);  // TitForTat (strategy_gene 0.4)
        let agent3 = create_test_agent(3, 0.5, 0.6);  // Pavlov (strategy_gene 0.6)
        
        agents.insert(agent1.id(), agent1);
        agents.insert(agent2.id(), agent2);
        agents.insert(agent3.id(), agent3);
        
        agents
    }

    #[test]
    fn test_battle_use_case_creation() {
        let battle_use_case = BattleUseCase::new();
        
        assert_eq!(battle_use_case.current_round(), 0);
        assert_eq!(battle_use_case.payoff_matrix().mutual_cooperation(), 3.0);
    }

    #[test]
    fn test_battle_use_case_with_custom_matrix() {
        let custom_matrix = PayoffMatrix::new(2.0, 0.5, -1.0, 4.0);
        let battle_use_case = BattleUseCase::with_payoff_matrix(custom_matrix);
        
        assert_eq!(battle_use_case.payoff_matrix().mutual_cooperation(), 2.0);
        assert_eq!(battle_use_case.payoff_matrix().defection_advantage(), 4.0);
    }

    #[test]
    fn test_execute_battle() {
        let mut battle_use_case = BattleUseCase::new();
        let agents = create_test_agents();
        
        let command = ExecuteBattleCommand {
            agent1_id: AgentId::new(1),
            agent2_id: AgentId::new(2),
        };
        
        let result = battle_use_case.execute_battle(command, &agents).unwrap();
        
        assert_eq!(result.agent1_strategy, "ランダム");
        assert_eq!(result.agent2_strategy, "しっぺ返し");
        assert!(result.outcome.agent1_score >= 0.0);
        assert!(result.outcome.agent2_score >= 0.0);
    }

    #[test]
    fn test_execute_battle_same_agent_error() {
        let mut battle_use_case = BattleUseCase::new();
        let agents = create_test_agents();
        
        let command = ExecuteBattleCommand {
            agent1_id: AgentId::new(1),
            agent2_id: AgentId::new(1), // 同じエージェント
        };
        
        let result = battle_use_case.execute_battle(command, &agents);
        assert!(matches!(result.unwrap_err(), BattleUseCaseError::SameAgent));
    }

    #[test]
    fn test_execute_battle_agent_not_found() {
        let mut battle_use_case = BattleUseCase::new();
        let agents = create_test_agents();
        
        let command = ExecuteBattleCommand {
            agent1_id: AgentId::new(1),
            agent2_id: AgentId::new(999), // 存在しないエージェント
        };
        
        let result = battle_use_case.execute_battle(command, &agents);
        assert!(matches!(result.unwrap_err(), BattleUseCaseError::AgentNotFound));
    }

    #[test]
    fn test_get_battle_history() {
        let mut battle_use_case = BattleUseCase::new();
        let agents = create_test_agents();
        
        // 戦闘を実行
        let command = ExecuteBattleCommand {
            agent1_id: AgentId::new(1),
            agent2_id: AgentId::new(2),
        };
        
        battle_use_case.execute_battle(command, &agents).unwrap();
        
        // 履歴を取得
        let query = BattleHistoryQuery {
            agent_id: AgentId::new(1),
            opponent_id: None,
            limit: None,
        };
        
        let history = battle_use_case.get_battle_history(query).unwrap();
        
        assert_eq!(history.total_battles, 1);
        assert_eq!(history.battles.len(), 1);
        assert!(history.average_score >= 0.0);
    }

    #[test]
    fn test_get_battle_history_with_specific_opponent() {
        let mut battle_use_case = BattleUseCase::new();
        let agents = create_test_agents();
        
        // 複数の戦闘を実行
        let command1 = ExecuteBattleCommand {
            agent1_id: AgentId::new(1),
            agent2_id: AgentId::new(2),
        };
        let command2 = ExecuteBattleCommand {
            agent1_id: AgentId::new(1),
            agent2_id: AgentId::new(3),
        };
        
        battle_use_case.execute_battle(command1, &agents).unwrap();
        battle_use_case.execute_battle(command2, &agents).unwrap();
        
        // 特定の相手との履歴を取得
        let query = BattleHistoryQuery {
            agent_id: AgentId::new(1),
            opponent_id: Some(AgentId::new(2)),
            limit: None,
        };
        
        let history = battle_use_case.get_battle_history(query).unwrap();
        
        assert_eq!(history.battles.len(), 1);
        assert_eq!(history.battles[0].opponent_id, AgentId::new(2));
    }

    #[test]
    fn test_get_last_battle_with() {
        let mut battle_use_case = BattleUseCase::new();
        let agents = create_test_agents();
        
        // 戦闘を実行
        let command = ExecuteBattleCommand {
            agent1_id: AgentId::new(1),
            agent2_id: AgentId::new(2),
        };
        
        battle_use_case.execute_battle(command, &agents).unwrap();
        
        let last_battle = battle_use_case.get_last_battle_with(AgentId::new(1), AgentId::new(2));
        assert!(last_battle.is_some());
        
        let battle = last_battle.unwrap();
        assert_eq!(battle.opponent_id, AgentId::new(2));
    }

    #[test]
    fn test_advance_round() {
        let mut battle_use_case = BattleUseCase::new();
        
        assert_eq!(battle_use_case.current_round(), 0);
        
        battle_use_case.advance_round();
        assert_eq!(battle_use_case.current_round(), 1);
        
        battle_use_case.advance_round();
        assert_eq!(battle_use_case.current_round(), 2);
    }

    #[test]
    fn test_clear_history() {
        let mut battle_use_case = BattleUseCase::new();
        let agents = create_test_agents();
        
        // 戦闘を実行
        let command = ExecuteBattleCommand {
            agent1_id: AgentId::new(1),
            agent2_id: AgentId::new(2),
        };
        
        battle_use_case.execute_battle(command, &agents).unwrap();
        battle_use_case.advance_round();
        
        assert_eq!(battle_use_case.current_round(), 1);
        
        battle_use_case.clear_history();
        
        assert_eq!(battle_use_case.current_round(), 0);
        
        let query = BattleHistoryQuery {
            agent_id: AgentId::new(1),
            opponent_id: None,
            limit: None,
        };
        
        let history = battle_use_case.get_battle_history(query).unwrap();
        assert_eq!(history.total_battles, 0);
    }

    #[test]
    fn test_strategy_name_detection() {
        let battle_use_case = BattleUseCase::new();
        
        let random_agent = create_test_agent(1, 0.5, 0.75); // Random (strategy_gene 0.75)
        let tft_agent = create_test_agent(2, 0.6, 0.4);   // TitForTat (strategy_gene 0.4)
        let pavlov_agent = create_test_agent(3, 0.5, 0.6); // Pavlov (strategy_gene 0.6)
        
        assert_eq!(battle_use_case.get_strategy_name(&random_agent), "ランダム");
        assert_eq!(battle_use_case.get_strategy_name(&tft_agent), "しっぺ返し");
        assert_eq!(battle_use_case.get_strategy_name(&pavlov_agent), "パブロフ戦略");
    }

    #[test]
    fn test_battle_history_limit() {
        let mut battle_use_case = BattleUseCase::new();
        let agents = create_test_agents();
        
        // 複数の戦闘を実行
        for _ in 0..5 {
            let command = ExecuteBattleCommand {
                agent1_id: AgentId::new(1),
                agent2_id: AgentId::new(2),
            };
            battle_use_case.execute_battle(command, &agents).unwrap();
        }
        
        // 制限ありで履歴を取得
        let query = BattleHistoryQuery {
            agent_id: AgentId::new(1),
            opponent_id: None,
            limit: Some(3),
        };
        
        let history = battle_use_case.get_battle_history(query).unwrap();
        
        assert_eq!(history.total_battles, 5);
        assert_eq!(history.battles.len(), 3);
    }
}