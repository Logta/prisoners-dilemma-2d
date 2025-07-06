// ========================================
// Agent Entity - エージェントエンティティ
// ========================================

use crate::domain::shared::{AgentId, Position};
use super::traits::{AgentTraits, AgentState};
use super::strategy::{StrategyState, StrategyGenes};
use serde::{Deserialize, Serialize};

/// エージェントエンティティ
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct Agent {
    id: AgentId,
    position: Position,
    traits: AgentTraits,
    state: AgentState,
    strategy: StrategyState,
}

impl Agent {
    /// 新しいエージェントを作成
    pub fn new(id: AgentId, position: Position, traits: AgentTraits) -> Self {
        let strategy = StrategyState::random();
        Self {
            id,
            position,
            traits,
            state: AgentState::new(),
            strategy,
        }
    }

    /// 戦略遺伝子を指定してエージェントを作成
    pub fn new_with_strategy(id: AgentId, position: Position, traits: AgentTraits, strategy_genes: StrategyGenes) -> Self {
        let strategy = StrategyState::new(strategy_genes);
        Self {
            id,
            position,
            traits,
            state: AgentState::new(),
            strategy,
        }
    }

    /// ランダムなエージェントを作成
    pub fn random(id: AgentId, position: Position) -> Self {
        Self::new(id, position, AgentTraits::random())
    }

    /// ゲッター
    pub fn id(&self) -> AgentId { self.id }
    pub fn position(&self) -> Position { self.position }
    pub fn traits(&self) -> &AgentTraits { &self.traits }
    pub fn state(&self) -> &AgentState { &self.state }
    pub fn strategy(&self) -> &StrategyState { &self.strategy }

    /// 可変ゲッター
    pub fn traits_mut(&mut self) -> &mut AgentTraits { &mut self.traits }
    pub fn state_mut(&mut self) -> &mut AgentState { &mut self.state }
    pub fn strategy_mut(&mut self) -> &mut StrategyState { &mut self.strategy }

    /// 位置を変更
    pub fn move_to(&mut self, new_position: Position) {
        self.position = new_position;
        self.state.consume_energy(0.5); // 移動コスト
    }

    /// スコアを追加
    pub fn add_score(&mut self, points: f64) {
        self.state.add_score(points);
    }

    /// 戦闘を記録
    pub fn record_battle(&mut self) {
        self.state.record_battle();
    }

    /// 年齢を重ねる
    pub fn age_up(&mut self) {
        self.state.age_up();
    }

    /// 生存チェック
    pub fn is_alive(&self) -> bool {
        self.state.is_alive()
    }

    /// 適応度
    pub fn fitness(&self) -> f64 {
        self.state.fitness()
    }

    /// 特定の相手に対する協力決定（戦略ベース）
    pub fn decides_to_cooperate_with(&mut self, opponent_id: AgentId) -> Result<bool, String> {
        let mut cooperation_rate = self.traits.cooperation_tendency();
        
        // バリデーション: 協力率が無効な値でないかチェック
        if cooperation_rate < 0.0 || cooperation_rate > 1.0 {
            return Err(format!(
                "Invalid cooperation tendency: {} for agent {}. Must be between 0.0 and 1.0", 
                cooperation_rate, 
                self.id.value()
            ));
        }
        
        // エージェントが生存しているかチェック
        if !self.is_alive() {
            return Err(format!("Agent {} is not alive and cannot make cooperation decisions", self.id.value()));
        }
        
        // 環境要因による調整
        if self.state.energy() < 30.0 {
            cooperation_rate *= 0.7; // エネルギー不足時は非協力的
        }
        
        if self.state.age() > 500 {
            cooperation_rate *= 1.2; // 年配エージェントはより協力的
        }
        
        cooperation_rate = cooperation_rate.min(1.0);
        
        // 戦略に基づく協力決定
        Ok(self.strategy.decide_cooperation(opponent_id, cooperation_rate))
    }

    /// 協力するかどうかの決定（一般版 - ダミー相手IDを使用）
    pub fn decides_to_cooperate(&mut self) -> Result<bool, String> {
        // ダミーのAgentIdを使用して戦略ベース判定を行う
        let dummy_opponent = AgentId::new(0);
        self.decides_to_cooperate_with(dummy_opponent)
    }

    /// 移動するかどうかの決定
    pub fn decides_to_move(&self) -> bool {
        use rand::Rng;
        let mut rng = rand::thread_rng();
        
        let movement_rate = self.traits.movement_tendency() * (self.state.energy() / 100.0);
        rng.gen::<f64>() < movement_rate
    }

    /// 相互作用を記録
    pub fn record_interaction(&mut self, opponent_id: AgentId, my_action: bool, opponent_action: bool, outcome_score: f64) {
        self.strategy.record_interaction(opponent_id, my_action, opponent_action, outcome_score);
    }

    /// 戦略の学習と適応
    pub fn adapt_strategy(&mut self) {
        self.strategy.adapt_strategy();
    }

    /// 子エージェントを生成（遺伝的アルゴリズム用）
    pub fn reproduce_with(&self, other: &Agent, child_id: AgentId, position: Position) -> Agent {
        let (child_traits, _) = self.traits.crossover(&other.traits);
        let (child_strategy_genes, _) = self.strategy.genes().crossover(other.strategy.genes());
        Agent::new_with_strategy(child_id, position, child_traits, child_strategy_genes)
    }

    /// 突然変異
    pub fn mutate(&mut self, mutation_rate: f64, mutation_strength: f64) {
        self.traits.mutate(mutation_rate, mutation_strength);
        self.strategy.genes_mut().mutate(mutation_rate, mutation_strength);
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::domain::shared::*;

    fn create_test_agent() -> Agent {
        let id = AgentId::new(1);
        let position = Position::new(5, 5);
        let traits = AgentTraits::new(0.6, 0.3, 0.8, 0.4).unwrap();
        // 常に協力戦略（strategy_gene = 0.1）で確実な協力を提供
        let strategy_genes = StrategyGenes::new(0.1, 0.9, 0.5, 0.6);
        Agent::new_with_strategy(id, position, traits, strategy_genes)
    }

    #[test]
    fn test_agent_creation() {
        let agent = create_test_agent();
        
        assert_eq!(agent.id(), AgentId::new(1));
        assert_eq!(agent.position(), Position::new(5, 5));
        assert_eq!(agent.traits().cooperation_tendency(), 0.6);
        assert_eq!(agent.state().score(), 0.0);
        assert!(agent.is_alive());
    }

    #[test]
    fn test_agent_random_creation() {
        let id = AgentId::new(1);
        let position = Position::new(0, 0);
        let agent = Agent::random(id, position);
        
        assert_eq!(agent.id(), id);
        assert_eq!(agent.position(), position);
        assert!(agent.traits().cooperation_tendency() >= 0.0);
        assert!(agent.traits().cooperation_tendency() <= 1.0);
    }

    #[test]
    fn test_agent_movement() {
        let mut agent = create_test_agent();
        let new_position = Position::new(10, 10);
        let initial_energy = agent.state().energy();
        
        agent.move_to(new_position);
        
        assert_eq!(agent.position(), new_position);
        assert!(agent.state().energy() < initial_energy); // 移動コスト
    }

    #[test]
    fn test_agent_score_addition() {
        let mut agent = create_test_agent();
        
        agent.add_score(25.0);
        assert_eq!(agent.state().score(), 25.0);
    }

    #[test]
    fn test_agent_battle_recording() {
        let mut agent = create_test_agent();
        let initial_battles = agent.state().battles_fought();
        
        agent.record_battle();
        assert_eq!(agent.state().battles_fought(), initial_battles + 1);
    }

    #[test]
    fn test_agent_aging() {
        let mut agent = create_test_agent();
        let initial_age = agent.state().age();
        
        agent.age_up();
        assert_eq!(agent.state().age(), initial_age + 1);
    }

    #[test]
    fn test_agent_cooperation_decision() {
        let mut agent = create_test_agent();
        
        // 確率的なので複数回テスト
        let mut cooperation_count = 0;
        for _ in 0..100 {
            if agent.decides_to_cooperate().unwrap_or(false) {
                cooperation_count += 1;
            }
        }
        
        // 常に協力戦略なので、ほぼ100%協力するはず（環境要因で若干変動）
        assert!(cooperation_count > 90);
        assert!(cooperation_count <= 100);
    }

    #[test]
    fn test_agent_movement_decision() {
        let agent = create_test_agent();
        
        // 移動傾向0.4なので、時々移動する
        let mut movement_count = 0;
        for _ in 0..100 {
            if agent.decides_to_move() {
                movement_count += 1;
            }
        }
        
        assert!(movement_count > 20);
        assert!(movement_count < 60);
    }

    #[test]
    fn test_agent_reproduction() {
        let parent1 = create_test_agent();
        let parent2 = Agent::new(
            AgentId::new(2),
            Position::new(0, 0),
            AgentTraits::new(0.2, 0.8, 0.1, 0.9).unwrap(),
        );
        
        let child = parent1.reproduce_with(&parent2, AgentId::new(3), Position::new(2, 2));
        
        assert_eq!(child.id(), AgentId::new(3));
        assert_eq!(child.position(), Position::new(2, 2));
        
        // 子の特性は親の特性の組み合わせ
        let child_cooperation = child.traits().cooperation_tendency();
        assert!(child_cooperation == 0.6 || child_cooperation == 0.2);
    }

    #[test]
    fn test_agent_mutation() {
        let mut agent = create_test_agent();
        
        agent.mutate(1.0, 0.1); // 100%変異率
        
        // 特性が変異した可能性が高い（確率的だが）
        // 少なくとも範囲内に収まることを確認
        assert!(agent.traits().cooperation_tendency() >= 0.0);
        assert!(agent.traits().cooperation_tendency() <= 1.0);
    }

    #[test]
    fn test_agent_fitness() {
        let mut agent = create_test_agent();
        let initial_fitness = agent.fitness();
        
        agent.add_score(50.0);
        let improved_fitness = agent.fitness();
        
        assert!(improved_fitness > initial_fitness);
    }

    #[test]
    fn test_agent_survival() {
        let mut agent = create_test_agent();
        
        // エネルギーを使い果たす
        for _ in 0..200 {
            agent.state_mut().consume_energy(1.0);
        }
        
        assert!(!agent.is_alive());
    }

    #[test]
    fn test_agent_environmental_cooperation_adjustment() {
        let mut agent = create_test_agent();
        
        // エネルギーを減らす
        agent.state_mut().consume_energy(80.0);
        
        // 低エネルギーでは協力率が下がる
        let mut cooperation_count = 0;
        for _ in 0..100 {
            if agent.decides_to_cooperate().unwrap_or(false) {
                cooperation_count += 1;
            }
        }
        
        // 常に協力戦略だが、エネルギー不足で70%に減少される
        // 実際の戦略の純度や環境要因で多少の変動があることを考慮
        assert!(cooperation_count > 50);
        assert!(cooperation_count < 95);
    }
}