// ========================================
// Agent Entity - エージェントエンティティ
// ========================================

use crate::domain::shared::{AgentId, Position};
use super::traits::{AgentTraits, AgentState};
use serde::{Deserialize, Serialize};

/// エージェントエンティティ
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct Agent {
    id: AgentId,
    position: Position,
    traits: AgentTraits,
    state: AgentState,
}

impl Agent {
    /// 新しいエージェントを作成
    pub fn new(id: AgentId, position: Position, traits: AgentTraits) -> Self {
        Self {
            id,
            position,
            traits,
            state: AgentState::new(),
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

    /// 可変ゲッター
    pub fn traits_mut(&mut self) -> &mut AgentTraits { &mut self.traits }
    pub fn state_mut(&mut self) -> &mut AgentState { &mut self.state }

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

    /// 協力するかどうかの決定（基本版）
    pub fn decides_to_cooperate(&self) -> bool {
        use rand::Rng;
        let mut rng = rand::thread_rng();
        
        let mut cooperation_rate = self.traits.cooperation_tendency();
        
        // 環境要因による調整
        if self.state.energy() < 30.0 {
            cooperation_rate *= 0.7; // エネルギー不足時は非協力的
        }
        
        if self.state.age() > 500 {
            cooperation_rate *= 1.2; // 年配エージェントはより協力的
        }
        
        rng.gen::<f64>() < cooperation_rate.min(1.0)
    }

    /// 移動するかどうかの決定
    pub fn decides_to_move(&self) -> bool {
        use rand::Rng;
        let mut rng = rand::thread_rng();
        
        let movement_rate = self.traits.movement_tendency() * (self.state.energy() / 100.0);
        rng.gen::<f64>() < movement_rate
    }

    /// 子エージェントを生成（遺伝的アルゴリズム用）
    pub fn reproduce_with(&self, other: &Agent, child_id: AgentId, position: Position) -> Agent {
        let (child_traits, _) = self.traits.crossover(&other.traits);
        Agent::new(child_id, position, child_traits)
    }

    /// 突然変異
    pub fn mutate(&mut self, mutation_rate: f64, mutation_strength: f64) {
        self.traits.mutate(mutation_rate, mutation_strength);
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
        Agent::new(id, position, traits)
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
        let agent = create_test_agent();
        
        // 確率的なので複数回テスト
        let mut cooperation_count = 0;
        for _ in 0..100 {
            if agent.decides_to_cooperate() {
                cooperation_count += 1;
            }
        }
        
        // 協力傾向0.6なので、大体60%前後で協力するはず
        assert!(cooperation_count > 40);
        assert!(cooperation_count < 80);
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
            if agent.decides_to_cooperate() {
                cooperation_count += 1;
            }
        }
        
        // 通常の60%より低いはず（70%掛けなので42%前後）
        assert!(cooperation_count < 55);
    }
}