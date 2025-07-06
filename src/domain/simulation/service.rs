// ========================================
// Simulation Service - シミュレーションサービス
// ========================================

use crate::domain::agent::Agent;
use crate::domain::battle::{BattleService, BattleHistory};
use crate::domain::shared::{AgentId, Position, WorldSize};
use super::{Grid, EvolutionService, EvolutionConfig, GridError};
use serde::{Deserialize, Serialize};
use rand::seq::SliceRandom;

/// シミュレーション設定
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct SimulationConfig {
    pub world_size: WorldSize,
    pub initial_population: usize,
    pub max_generations: u32,
    pub battles_per_generation: u32,
    pub neighbor_radius: u32,
    pub evolution_config: EvolutionConfig,
}

/// シミュレーション統計
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct SimulationStats {
    pub generation: u32,
    pub population: usize,
    pub average_score: f64,
    pub max_score: f64,
    pub min_score: f64,
    pub average_cooperation: f64,
    pub total_battles: u32,
}

/// シミュレーションサービス
pub struct SimulationService {
    config: SimulationConfig,
    grid: Grid,
    battle_service: BattleService,
    battle_history: BattleHistory,
    evolution_service: EvolutionService,
    current_generation: u32,
    total_battles: u32,
}

impl SimulationConfig {
    /// 標準的なシミュレーション設定を作成
    pub fn standard() -> Result<Self, GridError> {
        Ok(Self {
            world_size: WorldSize::new(50, 50)?,
            initial_population: 100,
            max_generations: 1000,
            battles_per_generation: 100,
            neighbor_radius: 2,
            evolution_config: EvolutionConfig::standard(),
        })
    }

    /// カスタムシミュレーション設定を作成
    pub fn new(
        world_size: WorldSize,
        initial_population: usize,
        max_generations: u32,
        battles_per_generation: u32,
        neighbor_radius: u32,
        evolution_config: EvolutionConfig,
    ) -> Self {
        Self {
            world_size,
            initial_population,
            max_generations,
            battles_per_generation,
            neighbor_radius,
            evolution_config,
        }
    }
}

impl SimulationService {
    /// 新しいシミュレーションサービスを作成
    pub fn new(config: SimulationConfig) -> Result<Self, GridError> {
        let grid = Grid::new(config.world_size)?;
        let battle_service = BattleService::standard();
        let battle_history = BattleHistory::new();
        let evolution_service = EvolutionService::new(config.evolution_config);

        Ok(Self {
            config,
            grid,
            battle_service,
            battle_history,
            evolution_service,
            current_generation: 0,
            total_battles: 0,
        })
    }

    /// 標準的なシミュレーションサービスを作成
    pub fn standard() -> Result<Self, GridError> {
        Self::new(SimulationConfig::standard()?)
    }

    /// シミュレーションを初期化
    pub fn initialize(&mut self) -> Result<(), GridError> {
        // 初期エージェントを配置
        for _ in 0..self.config.initial_population {
            self.grid.add_random_agent()?;
        }
        
        self.current_generation = 0;
        self.total_battles = 0;
        self.battle_history.clear();
        
        Ok(())
    }

    /// 1ステップのシミュレーションを実行
    pub fn step(&mut self) {
        // 戦闘フェーズ
        self.execute_battles();
        
        // エージェントの移動フェーズ
        self.move_agents();
        
        // 年齢を重ねる
        self.age_agents();
    }

    /// 1世代のシミュレーションを実行
    pub fn run_generation(&mut self) {
        for _ in 0..self.config.battles_per_generation {
            self.step();
        }
        
        // 世代交代
        self.evolve_generation();
        self.current_generation += 1;
        self.battle_history.advance_round();
    }

    /// 指定した世代数だけシミュレーションを実行
    pub fn run(&mut self, generations: u32) {
        for _ in 0..generations.min(self.config.max_generations - self.current_generation) {
            self.run_generation();
        }
    }

    /// 戦闘を実行
    fn execute_battles(&mut self) {
        let agent_ids: Vec<AgentId> = self.grid.agents().keys().cloned().collect();
        
        use rand::seq::SliceRandom;
        let mut rng = rand::thread_rng();
        let mut shuffled_ids = agent_ids.clone();
        shuffled_ids.shuffle(&mut rng);
        
        for agent_id in shuffled_ids {
            if let Some(agent_pos) = self.grid.get_agent(agent_id).map(|a| a.position()) {
                let neighbors = self.grid.get_neighbors(agent_pos, self.config.neighbor_radius);
                
                if !neighbors.is_empty() {
                    let opponent = neighbors.choose(&mut rng).unwrap();
                    self.execute_battle(agent_id, opponent.id());
                }
            }
        }
    }

    /// 2つのエージェント間で戦闘を実行
    fn execute_battle(&mut self, agent1_id: AgentId, agent2_id: AgentId) {
        if let (Some(_agent1), Some(_agent2)) = (
            self.grid.get_agent(agent1_id).cloned(),
            self.grid.get_agent(agent2_id).cloned(),
        ) {
            // 新しい戦略システムでは、mutableなエージェントが必要
            // 戦略の決定と相互作用記録のため、別のアプローチを使用
            let agent1_cooperates = {
                if let Some(agent1_mut) = self.grid.get_agent_mut(agent1_id) {
                    agent1_mut.decides_to_cooperate_with(agent2_id)
                } else {
                    false
                }
            };
            
            let agent2_cooperates = {
                if let Some(agent2_mut) = self.grid.get_agent_mut(agent2_id) {
                    agent2_mut.decides_to_cooperate_with(agent1_id)
                } else {
                    false
                }
            };
            
            let outcome = self.battle_service.payoff_matrix().calculate_outcome(agent1_cooperates, agent2_cooperates);
            
            // スコアを更新し、相互作用を記録
            if let Some(agent1_mut) = self.grid.get_agent_mut(agent1_id) {
                agent1_mut.add_score(outcome.agent1_score);
                agent1_mut.record_battle();
                agent1_mut.record_interaction(agent2_id, agent1_cooperates, agent2_cooperates, outcome.agent1_score);
            }
            
            if let Some(agent2_mut) = self.grid.get_agent_mut(agent2_id) {
                agent2_mut.add_score(outcome.agent2_score);
                agent2_mut.record_battle();
                agent2_mut.record_interaction(agent1_id, agent2_cooperates, agent1_cooperates, outcome.agent2_score);
            }
            
            // 戦闘履歴を記録
            self.battle_history.add_battle(agent1_id, &outcome, agent2_id, true);
            self.battle_history.add_battle(agent2_id, &outcome, agent1_id, false);
            
            self.total_battles += 1;
        }
    }

    /// エージェントを移動
    fn move_agents(&mut self) {
        let agent_ids: Vec<AgentId> = self.grid.agents().keys().cloned().collect();
        
        for agent_id in agent_ids {
            if let Some(agent) = self.grid.get_agent(agent_id) {
                if agent.decides_to_move() {
                    if let Some(new_pos) = self.find_random_empty_position_near(agent.position()) {
                        let _ = self.grid.move_agent(agent_id, new_pos);
                    }
                }
            }
        }
    }

    /// 近くのランダムな空位置を探す
    fn find_random_empty_position_near(&self, position: Position) -> Option<Position> {
        use rand::seq::SliceRandom;
        let mut rng = rand::thread_rng();
        
        let mut candidates = Vec::new();
        let radius = 2;
        
        for dx in -(radius as i32)..=(radius as i32) {
            for dy in -(radius as i32)..=(radius as i32) {
                if dx == 0 && dy == 0 {
                    continue;
                }
                
                let new_x = (position.x as i32 + dx).max(0) as u32;
                let new_y = (position.y as i32 + dy).max(0) as u32;
                let new_pos = Position::new(new_x, new_y);
                
                if new_x < self.config.world_size.width 
                    && new_y < self.config.world_size.height
                    && self.grid.get_agent_at(new_pos).is_none() {
                    candidates.push(new_pos);
                }
            }
        }
        
        candidates.choose(&mut rng).copied()
    }

    /// エージェントの年齢を重ねる
    fn age_agents(&mut self) {
        let agent_ids: Vec<AgentId> = self.grid.agents().keys().cloned().collect();
        
        for agent_id in agent_ids {
            if let Some(agent) = self.grid.get_agent_mut(agent_id) {
                agent.age_up();
                
                // 死亡したエージェントを削除
                if !agent.is_alive() {
                    self.grid.remove_agent(agent_id).ok();
                }
            }
        }
    }

    /// 世代交代を実行
    fn evolve_generation(&mut self) {
        let current_agents = self.grid.agents().clone();
        let target_population = self.config.initial_population;
        
        let next_generation = self.evolution_service.evolve_generation(&current_agents, target_population);
        
        // 新しい世代でグリッドをリセット
        self.grid = Grid::new(self.config.world_size).unwrap();
        
        // 新しいエージェントを配置
        for agent in next_generation {
            let empty_positions = self.grid.get_empty_positions();
            if let Some(position) = {
                let mut rng = rand::thread_rng();
                empty_positions.choose(&mut rng).copied()
            } {
                let agent_score = agent.state().score();
                let new_id = AgentId::new((self.grid.agent_count() + 1) as u64);
                let mut evolved_agent = Agent::new(new_id, position, *agent.traits());
                evolved_agent.state_mut().add_score(agent_score);
                
                if let Ok(placed_id) = self.grid.add_agent_at(position) {
                    if let Some(placed_agent) = self.grid.get_agent_mut(placed_id) {
                        *placed_agent = evolved_agent;
                    }
                }
            }
        }
    }

    /// 現在の統計を取得
    pub fn get_stats(&self) -> SimulationStats {
        let agents = self.grid.agents();
        
        if agents.is_empty() {
            return SimulationStats {
                generation: self.current_generation,
                population: 0,
                average_score: 0.0,
                max_score: 0.0,
                min_score: 0.0,
                average_cooperation: 0.0,
                total_battles: self.total_battles,
            };
        }
        
        let scores: Vec<f64> = agents.values().map(|a| a.state().score()).collect();
        let cooperations: Vec<f64> = agents.values().map(|a| a.traits().cooperation_tendency()).collect();
        
        let total_score: f64 = scores.iter().sum();
        let total_cooperation: f64 = cooperations.iter().sum();
        
        SimulationStats {
            generation: self.current_generation,
            population: agents.len(),
            average_score: total_score / agents.len() as f64,
            max_score: scores.iter().fold(f64::NEG_INFINITY, |a, &b| a.max(b)),
            min_score: scores.iter().fold(f64::INFINITY, |a, &b| a.min(b)),
            average_cooperation: total_cooperation / agents.len() as f64,
            total_battles: self.total_battles,
        }
    }

    /// ゲッター
    pub fn config(&self) -> &SimulationConfig {
        &self.config
    }

    pub fn grid(&self) -> &Grid {
        &self.grid
    }

    pub fn current_generation(&self) -> u32 {
        self.current_generation
    }

    pub fn is_finished(&self) -> bool {
        self.current_generation >= self.config.max_generations || self.grid.agent_count() == 0
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_simulation_config_standard() {
        let config = SimulationConfig::standard().unwrap();
        
        assert_eq!(config.world_size, WorldSize::new(50, 50).unwrap());
        assert_eq!(config.initial_population, 100);
        assert_eq!(config.max_generations, 1000);
        assert_eq!(config.battles_per_generation, 100);
        assert_eq!(config.neighbor_radius, 2);
    }

    #[test]
    fn test_simulation_service_creation() {
        let config = SimulationConfig::standard().unwrap();
        let service = SimulationService::new(config).unwrap();
        
        assert_eq!(service.current_generation(), 0);
        assert_eq!(service.grid().agent_count(), 0);
        // 初期化前はエージェントが0個なので終了状態
        assert!(service.is_finished());
    }

    #[test]
    fn test_simulation_initialization() {
        let mut service = SimulationService::standard().unwrap();
        
        service.initialize().unwrap();
        
        assert_eq!(service.grid().agent_count(), 100);
        assert_eq!(service.current_generation(), 0);
    }

    #[test]
    fn test_simulation_step() {
        let mut service = SimulationService::standard().unwrap();
        service.initialize().unwrap();
        
        let initial_stats = service.get_stats();
        service.step();
        let after_stats = service.get_stats();
        
        // ステップ後も人口は同じ（世代交代はまだ）
        assert_eq!(after_stats.population, initial_stats.population);
        // 戦闘が発生したかもしれない
        assert!(after_stats.total_battles >= initial_stats.total_battles);
    }

    #[test]
    fn test_simulation_generation() {
        let mut service = SimulationService::standard().unwrap();
        service.initialize().unwrap();
        
        let initial_generation = service.current_generation();
        service.run_generation();
        
        assert_eq!(service.current_generation(), initial_generation + 1);
        // 進化によって人口が変わる可能性がある
        assert!(service.grid().agent_count() > 0);
    }

    #[test]
    fn test_simulation_stats() {
        let mut service = SimulationService::standard().unwrap();
        service.initialize().unwrap();
        
        let stats = service.get_stats();
        
        assert_eq!(stats.generation, 0);
        assert_eq!(stats.population, 100);
        assert!(stats.average_cooperation >= 0.0 && stats.average_cooperation <= 1.0);
        assert_eq!(stats.total_battles, 0); // まだ戦闘していない
    }

    #[test]
    fn test_simulation_empty_stats() {
        let service = SimulationService::standard().unwrap();
        
        let stats = service.get_stats();
        
        assert_eq!(stats.population, 0);
        assert_eq!(stats.average_score, 0.0);
        assert_eq!(stats.average_cooperation, 0.0);
    }

    #[test]
    fn test_simulation_run_multiple_generations() {
        let mut service = SimulationService::standard().unwrap();
        service.initialize().unwrap();
        
        service.run(3);
        
        assert_eq!(service.current_generation(), 3);
    }

    #[test]
    fn test_simulation_finish_condition() {
        let config = SimulationConfig::new(
            WorldSize::new(10, 10).unwrap(),
            5,
            5, // 最大5世代
            10,
            1,
            EvolutionConfig::standard(),
        );
        let mut service = SimulationService::new(config).unwrap();
        service.initialize().unwrap();
        
        service.run(10); // 10世代実行を試みる
        
        // 最大5世代で止まる
        assert!(service.current_generation() <= 5);
        assert!(service.is_finished());
    }

    #[test]
    fn test_small_world_simulation() {
        let config = SimulationConfig::new(
            WorldSize::new(3, 3).unwrap(),
            5,
            2,
            5,
            1,
            EvolutionConfig::standard(),
        );
        let mut service = SimulationService::new(config).unwrap();
        
        // 小さい世界でも初期化できる
        service.initialize().unwrap();
        assert!(service.grid().agent_count() <= 9); // 最大9個しか配置できない
        
        // シミュレーションも実行できる
        service.run_generation();
        assert_eq!(service.current_generation(), 1);
    }
}