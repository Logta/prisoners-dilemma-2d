// ========================================
// Agent Traits - エージェントの特性値オブジェクト
// ========================================

use serde::{Deserialize, Serialize};

/// エージェントの遺伝的特性
#[derive(Debug, Clone, Copy, PartialEq, Serialize, Deserialize)]
pub struct AgentTraits {
    cooperation_tendency: f64,     // 協力傾向（0.0-1.0）
    aggression_level: f64,         // 攻撃性（0.0-1.0）
    learning_ability: f64,         // 学習能力（0.0-1.0）
    movement_tendency: f64,        // 移動傾向（0.0-1.0）
}

/// エージェントの状態
#[derive(Debug, Clone, Copy, PartialEq, Serialize, Deserialize)]
pub struct AgentState {
    score: f64,           // 累積スコア
    energy: f64,          // エネルギー（0.0-100.0）
    age: u32,             // 年齢
    battles_fought: u32,  // 戦闘回数
}

/// 特性エラー
#[derive(Debug, Clone, PartialEq)]
pub enum TraitsError {
    InvalidRange,
}

impl AgentTraits {
    /// 新しい特性を作成
    pub fn new(
        cooperation_tendency: f64,
        aggression_level: f64,
        learning_ability: f64,
        movement_tendency: f64,
    ) -> Result<Self, TraitsError> {
        if !Self::is_valid_range(cooperation_tendency)
            || !Self::is_valid_range(aggression_level)
            || !Self::is_valid_range(learning_ability)
            || !Self::is_valid_range(movement_tendency)
        {
            return Err(TraitsError::InvalidRange);
        }

        Ok(Self {
            cooperation_tendency,
            aggression_level,
            learning_ability,
            movement_tendency,
        })
    }

    /// ランダムな特性を生成
    pub fn random() -> Self {
        use rand::Rng;
        let mut rng = rand::thread_rng();
        
        Self {
            cooperation_tendency: rng.gen_range(0.0..=1.0),
            aggression_level: rng.gen_range(0.0..=1.0),
            learning_ability: rng.gen_range(0.0..=1.0),
            movement_tendency: rng.gen_range(0.0..=1.0),
        }
    }

    /// ゲッター
    pub fn cooperation_tendency(&self) -> f64 { self.cooperation_tendency }
    pub fn aggression_level(&self) -> f64 { self.aggression_level }
    pub fn learning_ability(&self) -> f64 { self.learning_ability }
    pub fn movement_tendency(&self) -> f64 { self.movement_tendency }

    /// 値の範囲チェック
    fn is_valid_range(value: f64) -> bool {
        (0.0..=1.0).contains(&value)
    }

    /// 変異（遺伝的アルゴリズム用）
    pub fn mutate(&mut self, mutation_rate: f64, mutation_strength: f64) {
        use rand::Rng;
        use rand_distr::{Distribution, Normal};
        
        let mut rng = rand::thread_rng();
        let normal = Normal::new(0.0, mutation_strength).unwrap();

        if rng.gen_bool(mutation_rate) {
            self.cooperation_tendency = (self.cooperation_tendency + normal.sample(&mut rng)).clamp(0.0, 1.0);
        }
        if rng.gen_bool(mutation_rate) {
            self.aggression_level = (self.aggression_level + normal.sample(&mut rng)).clamp(0.0, 1.0);
        }
        if rng.gen_bool(mutation_rate) {
            self.learning_ability = (self.learning_ability + normal.sample(&mut rng)).clamp(0.0, 1.0);
        }
        if rng.gen_bool(mutation_rate) {
            self.movement_tendency = (self.movement_tendency + normal.sample(&mut rng)).clamp(0.0, 1.0);
        }
    }

    /// 交叉（遺伝的アルゴリズム用）
    pub fn crossover(&self, other: &AgentTraits) -> (AgentTraits, AgentTraits) {
        use rand::Rng;
        let mut rng = rand::thread_rng();

        let child1 = AgentTraits {
            cooperation_tendency: if rng.gen_bool(0.5) { self.cooperation_tendency } else { other.cooperation_tendency },
            aggression_level: if rng.gen_bool(0.5) { self.aggression_level } else { other.aggression_level },
            learning_ability: if rng.gen_bool(0.5) { self.learning_ability } else { other.learning_ability },
            movement_tendency: if rng.gen_bool(0.5) { self.movement_tendency } else { other.movement_tendency },
        };

        let child2 = AgentTraits {
            cooperation_tendency: if child1.cooperation_tendency == self.cooperation_tendency { other.cooperation_tendency } else { self.cooperation_tendency },
            aggression_level: if child1.aggression_level == self.aggression_level { other.aggression_level } else { self.aggression_level },
            learning_ability: if child1.learning_ability == self.learning_ability { other.learning_ability } else { self.learning_ability },
            movement_tendency: if child1.movement_tendency == self.movement_tendency { other.movement_tendency } else { self.movement_tendency },
        };

        (child1, child2)
    }
}

impl AgentState {
    /// 新しい状態を作成
    pub fn new() -> Self {
        Self {
            score: 0.0,
            energy: 100.0,
            age: 0,
            battles_fought: 0,
        }
    }

    /// ゲッター
    pub fn score(&self) -> f64 { self.score }
    pub fn energy(&self) -> f64 { self.energy }
    pub fn age(&self) -> u32 { self.age }
    pub fn battles_fought(&self) -> u32 { self.battles_fought }

    /// スコア更新
    pub fn add_score(&mut self, points: f64) {
        self.score += points;
        // スコアがエネルギーに少し影響
        self.energy = (self.energy + points * 0.1).min(100.0);
    }

    /// エネルギー消費
    pub fn consume_energy(&mut self, amount: f64) {
        self.energy = (self.energy - amount).max(0.0);
    }

    /// 年齢を重ねる
    pub fn age_up(&mut self) {
        self.age += 1;
    }

    /// 戦闘を記録
    pub fn record_battle(&mut self) {
        self.battles_fought += 1;
        self.consume_energy(1.0); // 戦闘によるエネルギー消費
    }

    /// 生存チェック
    pub fn is_alive(&self) -> bool {
        self.energy > 0.0 && self.age < 1000
    }

    /// 適応度計算
    pub fn fitness(&self) -> f64 {
        let base_fitness = self.score;
        let age_penalty = (self.age as f64 / 1000.0) * 50.0;
        let energy_bonus = self.energy * 0.1;

        (base_fitness + energy_bonus - age_penalty).max(0.0)
    }
}

impl Default for AgentState {
    fn default() -> Self {
        Self::new()
    }
}

impl std::fmt::Display for TraitsError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            TraitsError::InvalidRange => write!(f, "Trait values must be between 0.0 and 1.0"),
        }
    }
}

impl std::error::Error for TraitsError {}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_agent_traits_creation() {
        let traits = AgentTraits::new(0.5, 0.3, 0.8, 0.2).unwrap();
        
        assert_eq!(traits.cooperation_tendency(), 0.5);
        assert_eq!(traits.aggression_level(), 0.3);
        assert_eq!(traits.learning_ability(), 0.8);
        assert_eq!(traits.movement_tendency(), 0.2);
    }

    #[test]
    fn test_agent_traits_validation() {
        assert!(AgentTraits::new(1.1, 0.5, 0.5, 0.5).is_err());
        assert!(AgentTraits::new(-0.1, 0.5, 0.5, 0.5).is_err());
        assert!(AgentTraits::new(0.5, 0.5, 0.5, 0.5).is_ok());
    }

    #[test]
    fn test_agent_traits_random() {
        let traits = AgentTraits::random();
        
        assert!(traits.cooperation_tendency() >= 0.0 && traits.cooperation_tendency() <= 1.0);
        assert!(traits.aggression_level() >= 0.0 && traits.aggression_level() <= 1.0);
        assert!(traits.learning_ability() >= 0.0 && traits.learning_ability() <= 1.0);
        assert!(traits.movement_tendency() >= 0.0 && traits.movement_tendency() <= 1.0);
    }

    #[test]
    fn test_agent_traits_mutation() {
        let mut traits = AgentTraits::new(0.5, 0.5, 0.5, 0.5).unwrap();
        
        // 100%変異率でテスト
        traits.mutate(1.0, 0.1);
        
        // 値が0.0-1.0の範囲内にあることを確認
        assert!(traits.cooperation_tendency() >= 0.0 && traits.cooperation_tendency() <= 1.0);
        assert!(traits.aggression_level() >= 0.0 && traits.aggression_level() <= 1.0);
        assert!(traits.learning_ability() >= 0.0 && traits.learning_ability() <= 1.0);
        assert!(traits.movement_tendency() >= 0.0 && traits.movement_tendency() <= 1.0);
    }

    #[test]
    fn test_agent_traits_crossover() {
        let parent1 = AgentTraits::new(1.0, 0.0, 1.0, 0.0).unwrap();
        let parent2 = AgentTraits::new(0.0, 1.0, 0.0, 1.0).unwrap();
        
        let (child1, child2) = parent1.crossover(&parent2);
        
        // 子の特性は親の特性の組み合わせであること
        assert!(child1.cooperation_tendency() == 1.0 || child1.cooperation_tendency() == 0.0);
        assert!(child1.aggression_level() == 0.0 || child1.aggression_level() == 1.0);
        assert!(child2.cooperation_tendency() == 1.0 || child2.cooperation_tendency() == 0.0);
        assert!(child2.aggression_level() == 0.0 || child2.aggression_level() == 1.0);
    }

    #[test]
    fn test_agent_state_creation() {
        let state = AgentState::new();
        
        assert_eq!(state.score(), 0.0);
        assert_eq!(state.energy(), 100.0);
        assert_eq!(state.age(), 0);
        assert_eq!(state.battles_fought(), 0);
        assert!(state.is_alive());
    }

    #[test]
    fn test_agent_state_score_update() {
        let mut state = AgentState::new();
        let initial_energy = state.energy();
        
        state.add_score(10.0);
        assert_eq!(state.score(), 10.0);
        assert!(state.energy() >= initial_energy); // エネルギーボーナス（最大100で制限）
    }

    #[test]
    fn test_agent_state_energy_consumption() {
        let mut state = AgentState::new();
        
        state.consume_energy(50.0);
        assert_eq!(state.energy(), 50.0);
        
        state.consume_energy(60.0);
        assert_eq!(state.energy(), 0.0); // 負にならない
    }

    #[test]
    fn test_agent_state_aging() {
        let mut state = AgentState::new();
        
        state.age_up();
        assert_eq!(state.age(), 1);
    }

    #[test]
    fn test_agent_state_battle_recording() {
        let mut state = AgentState::new();
        let initial_energy = state.energy();
        
        state.record_battle();
        assert_eq!(state.battles_fought(), 1);
        assert!(state.energy() < initial_energy); // エネルギー消費
    }

    #[test]
    fn test_agent_state_survival() {
        let mut state = AgentState::new();
        
        // エネルギーを0にする
        state.consume_energy(100.0);
        assert!(!state.is_alive());
        
        // 年齢で死亡
        let mut old_state = AgentState::new();
        for _ in 0..1000 {
            old_state.age_up();
        }
        assert!(!old_state.is_alive());
    }

    #[test]
    fn test_agent_state_fitness() {
        let mut state = AgentState::new();
        state.add_score(100.0);
        
        let fitness = state.fitness();
        assert!(fitness > 0.0);
        
        // 年齢でペナルティ
        for _ in 0..500 {
            state.age_up();
        }
        let aged_fitness = state.fitness();
        assert!(aged_fitness < fitness);
    }
}