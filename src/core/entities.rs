// ========================================
// Core Entities - ドメインの中心的なビジネスロジック
// ========================================

use rand::Rng;
use serde::{Deserialize, Serialize};

/// エージェントエンティティ - シミュレーションの主要なアクター
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Agent {
    pub id: AgentId,
    pub position: Position,
    pub traits: AgentTraits,
    pub state: AgentState,
}

/// エージェントの固有識別子
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub struct AgentId(pub u64);

/// エージェントの特性 - 遺伝的に受け継がれる属性
#[derive(Debug, Clone, Copy, Serialize, Deserialize)]
pub struct AgentTraits {
    pub cooperation_rate: f64,
    pub movement_rate: f64,
    pub aggression_level: f64, // 新しい特性
    pub learning_rate: f64,    // 新しい特性
}

/// エージェントの現在状態
#[derive(Debug, Clone, Copy, Serialize, Deserialize)]
pub struct AgentState {
    pub score: f64,
    pub energy: f64,         // 新しい状態
    pub age: u32,            // 新しい状態
    pub battles_fought: u32, // 新しい状態
}

/// シミュレーション世界のグリッド
#[derive(Debug, Clone)]
pub struct SimulationWorld {
    pub dimensions: WorldDimensions,
    pub agents: Vec<Agent>,
    pub generation: Generation,
    pub environment: Environment,
}

/// 世代情報
#[derive(Debug, Clone, Copy, Serialize, Deserialize)]
pub struct Generation {
    pub current: u32,
    pub total_battles: u64,
    pub total_agents_born: u64,
}

/// 環境設定
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Environment {
    pub resource_density: f64,
    pub mutation_pressure: f64,
    pub climate_harshness: f64,
}

impl Agent {
    /// 新しいエージェントを生成
    pub fn new(id: AgentId, position: Position, traits: AgentTraits) -> Self {
        Self {
            id,
            position,
            traits,
            state: AgentState {
                score: 0.0,
                energy: 100.0,
                age: 0,
                battles_fought: 0,
            },
        }
    }

    /// ランダムな特性を持つエージェントを生成
    pub fn random<R: Rng>(id: AgentId, position: Position, rng: &mut R) -> Self {
        let traits = AgentTraits {
            cooperation_rate: rng.gen_range(0.0..=1.0),
            movement_rate: rng.gen_range(0.0..=1.0),
            aggression_level: rng.gen_range(0.0..=1.0),
            learning_rate: rng.gen_range(0.0..=1.0),
        };
        Self::new(id, position, traits)
    }

    /// 協力するかどうかを決定（確率的）
    pub fn decides_to_cooperate<R: Rng>(&self, rng: &mut R) -> bool {
        let mut cooperation_rate = self.traits.cooperation_rate;

        // 環境要因による調整
        if self.state.energy < 30.0 {
            cooperation_rate *= 0.7; // エネルギー不足時は非協力的に
        }

        if self.state.age > 100 {
            cooperation_rate *= 1.2; // 年配エージェントはより協力的
        }

        rng.gen::<f64>() < cooperation_rate.min(1.0)
    }

    /// 移動するかどうかを決定
    pub fn decides_to_move<R: Rng>(&self, rng: &mut R) -> bool {
        let movement_rate = self.traits.movement_rate * (self.state.energy / 100.0);
        rng.gen::<f64>() < movement_rate
    }

    /// スコアを更新
    pub fn update_score(&mut self, points: f64) {
        self.state.score += points;
        self.state.energy += points * 0.1; // スコアがエネルギーに影響
        self.state.energy = self.state.energy.min(100.0);
    }

    /// 戦闘後の状態更新
    pub fn after_battle(&mut self) {
        self.state.battles_fought += 1;
        self.state.energy -= 1.0; // 戦闘コスト
        self.state.age += 1;
    }

    /// 新しい位置に移動
    pub fn move_to(&mut self, new_position: Position) {
        self.position = new_position;
        self.state.energy -= 0.5; // 移動コスト
    }

    /// エージェントが生存可能かチェック
    pub fn is_alive(&self) -> bool {
        self.state.energy > 0.0 && self.state.age < 1000
    }

    /// 適応度を計算（選択圧で使用）
    pub fn fitness(&self) -> f64 {
        let base_fitness = self.state.score;
        let age_penalty = (self.state.age as f64 / 1000.0) * 50.0;
        let energy_bonus = self.state.energy * 0.1;

        (base_fitness + energy_bonus - age_penalty).max(0.0)
    }

    /// 戦略に基づいて協力するかどうかを決定
    pub fn decides_to_cooperate_with_strategy<R: Rng, S: crate::core::strategies::Strategy>(
        &self,
        strategy: &S,
        history: &crate::core::strategies::BattleHistory,
        opponent_id: AgentId,
        rng: &mut R,
    ) -> bool {
        strategy.decide_cooperation(self, history, opponent_id, rng)
    }
}

impl SimulationWorld {
    /// 新しいシミュレーション世界を作成
    pub fn new(dimensions: WorldDimensions) -> Self {
        Self {
            dimensions,
            agents: Vec::new(),
            generation: Generation {
                current: 0,
                total_battles: 0,
                total_agents_born: 0,
            },
            environment: Environment {
                resource_density: 1.0,
                mutation_pressure: 0.1,
                climate_harshness: 0.5,
            },
        }
    }

    /// エージェントを追加
    pub fn add_agent(&mut self, agent: Agent) {
        self.agents.push(agent);
        self.generation.total_agents_born += 1;
    }

    /// 生存エージェントのみをフィルタリング
    pub fn remove_dead_agents(&mut self) {
        self.agents.retain(|agent| agent.is_alive());
    }

    /// 世代を進める
    pub fn advance_generation(&mut self) {
        self.generation.current += 1;

        // 環境変化のシミュレーション
        let mut rng = rand::thread_rng();
        self.environment.climate_harshness += rng.gen_range(-0.1..0.1);
        self.environment.climate_harshness = self.environment.climate_harshness.clamp(0.0, 1.0);
    }

    /// 統計情報を取得
    pub fn calculate_statistics(&self) -> WorldStatistics {
        if self.agents.is_empty() {
            return WorldStatistics::empty(self.generation.current);
        }

        let total_agents = self.agents.len() as f64;

        let avg_cooperation = self
            .agents
            .iter()
            .map(|a| a.traits.cooperation_rate)
            .sum::<f64>()
            / total_agents;

        let avg_movement = self
            .agents
            .iter()
            .map(|a| a.traits.movement_rate)
            .sum::<f64>()
            / total_agents;

        let avg_score = self.agents.iter().map(|a| a.state.score).sum::<f64>() / total_agents;

        let avg_energy = self.agents.iter().map(|a| a.state.energy).sum::<f64>() / total_agents;

        let cooperation_rates: Vec<f64> = self
            .agents
            .iter()
            .map(|a| a.traits.cooperation_rate)
            .collect();

        let min_cooperation = cooperation_rates
            .iter()
            .min_by(|a, b| a.partial_cmp(b).unwrap())
            .copied()
            .unwrap_or(0.0);

        let max_cooperation = cooperation_rates
            .iter()
            .max_by(|a, b| a.partial_cmp(b).unwrap())
            .copied()
            .unwrap_or(0.0);

        let variance = cooperation_rates
            .iter()
            .map(|&x| (x - avg_cooperation).powi(2))
            .sum::<f64>()
            / total_agents;
        let std_cooperation = variance.sqrt();

        WorldStatistics {
            generation: self.generation.current,
            population: self.agents.len(),
            avg_cooperation,
            avg_movement,
            avg_score,
            avg_energy,
            min_cooperation,
            max_cooperation,
            std_cooperation,
            total_battles: self.generation.total_battles,
        }
    }
}

/// 世界の統計情報
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WorldStatistics {
    pub generation: u32,
    pub population: usize,
    pub avg_cooperation: f64,
    pub avg_movement: f64,
    pub avg_score: f64,
    pub avg_energy: f64,
    pub min_cooperation: f64,
    pub max_cooperation: f64,
    pub std_cooperation: f64,
    pub total_battles: u64,
}

impl WorldStatistics {
    pub fn empty(generation: u32) -> Self {
        Self {
            generation,
            population: 0,
            avg_cooperation: 0.0,
            avg_movement: 0.0,
            avg_score: 0.0,
            avg_energy: 0.0,
            min_cooperation: 0.0,
            max_cooperation: 0.0,
            std_cooperation: 0.0,
            total_battles: 0,
        }
    }
}


#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_agent_creation() {
        let position = Position::new(5, 5);
        let traits = AgentTraits {
            cooperation_rate: 0.5,
            movement_rate: 0.3,
            aggression_level: 0.2,
            learning_rate: 0.1,
        };
        
        let agent = Agent::new(AgentId(1), position, traits);
        assert_eq!(agent.id, AgentId(1));
        assert_eq!(agent.position, position);
        assert_eq!(agent.traits.cooperation_rate, 0.5);
        assert_eq!(agent.state.score, 0.0);
        assert_eq!(agent.state.energy, 100.0);
    }

}
