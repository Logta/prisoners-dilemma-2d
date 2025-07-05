// ========================================
// Domain Services - 複雑なビジネスロジックを実装
// ========================================

use crate::core::{
    Agent, AgentId, BattleRadius, PayoffMatrix, Position, SimulationWorld, WorldDimensions,
};
use rand::Rng;
use std::collections::HashMap;

/// 戦闘サービス - エージェント間の戦闘を管理
pub struct BattleService;

impl BattleService {
    /// 指定されたエージェントの戦闘を実行
    pub fn execute_battles_for_agent(
        world: &mut SimulationWorld,
        agent_index: usize,
        payoff_matrix: &PayoffMatrix,
        battle_radius: BattleRadius,
    ) -> Result<u32, BattleError> {
        if agent_index >= world.agents.len() {
            return Err(BattleError::AgentNotFound);
        }

        let agent_position = world.agents[agent_index].position;
        let agent_id = world.agents[agent_index].id;

        // 戦闘範囲内の敵を見つける
        let mut opponents = Vec::new();
        for (i, other_agent) in world.agents.iter().enumerate() {
            if i != agent_index
                && battle_radius.is_within_range(&agent_position, &other_agent.position)
            {
                opponents.push(i);
            }
        }

        let battles_fought = opponents.len() as u32;

        // 各対戦相手と戦闘
        for opponent_index in opponents {
            Self::execute_single_battle(world, agent_index, opponent_index, payoff_matrix)?;
        }

        world.generation.total_battles += battles_fought as u64;
        Ok(battles_fought)
    }

    /// 単一の戦闘を実行
    fn execute_single_battle(
        world: &mut SimulationWorld,
        agent1_index: usize,
        agent2_index: usize,
        payoff_matrix: &PayoffMatrix,
    ) -> Result<(), BattleError> {
        let mut rng = rand::thread_rng();

        // 両エージェントの戦略決定（履歴なしでランダム戦略）
        let agent1_cooperates = world.agents[agent1_index].decides_to_cooperate(None, None, &mut rng);
        let agent2_cooperates = world.agents[agent2_index].decides_to_cooperate(None, None, &mut rng);

        // 利得計算
        let (agent1_payoff, agent2_payoff) =
            payoff_matrix.calculate_payoff(agent1_cooperates, agent2_cooperates);

        // スコア更新
        world.agents[agent1_index].update_score(agent1_payoff);
        world.agents[agent2_index].update_score(agent2_payoff);

        // 戦闘後の状態更新
        world.agents[agent1_index].after_battle();
        world.agents[agent2_index].after_battle();

        Ok(())
    }

    /// 全エージェントの戦闘を一括実行
    pub fn execute_all_battles(
        world: &mut SimulationWorld,
        payoff_matrix: &PayoffMatrix,
        battle_radius: BattleRadius,
    ) -> Result<u64, BattleError> {
        let agent_count = world.agents.len();
        let mut total_battles = 0;

        for i in 0..agent_count {
            if i >= world.agents.len() {
                break; // 戦闘中にエージェントが死亡した場合
            }

            let battles = Self::execute_battles_for_agent(world, i, payoff_matrix, battle_radius)?;
            total_battles += battles as u64;
        }

        Ok(total_battles)
    }
}

/// 移動サービス - エージェントの移動を管理
pub struct MovementService;

impl MovementService {
    /// 全エージェントの移動を実行
    pub fn move_all_agents(world: &mut SimulationWorld) {
        let mut rng = rand::thread_rng();

        for agent in &mut world.agents {
            if agent.decides_to_move(&mut rng) {
                Self::move_agent(agent, &world.dimensions, &mut rng);
            }
        }
    }

    /// 単一エージェントの移動
    fn move_agent<R: Rng>(agent: &mut Agent, dimensions: &WorldDimensions, rng: &mut R) {
        let neighbors = agent.position.neighbors(dimensions);

        if !neighbors.is_empty() {
            let new_position = neighbors[rng.gen_range(0..neighbors.len())];
            agent.move_to(new_position);
        }
    }

    /// 特定の位置への移動（パスファインディング付き）
    pub fn move_agent_towards_target(
        agent: &mut Agent,
        target: Position,
        dimensions: &WorldDimensions,
    ) -> bool {
        let neighbors = agent.position.neighbors(dimensions);

        if let Some(best_position) = neighbors
            .iter()
            .min_by_key(|pos| pos.manhattan_distance(&target))
        {
            agent.move_to(*best_position);
            true
        } else {
            false
        }
    }
}

/// 人口サービス - エージェント人口の管理
pub struct PopulationService;

impl PopulationService {
    /// 指定密度でエージェントを生成
    pub fn populate_world(
        world: &mut SimulationWorld,
        density: f64,
    ) -> Result<usize, PopulationError> {
        if density < 0.0 || density > 1.0 {
            return Err(PopulationError::InvalidDensity);
        }

        let target_population = (world.dimensions.total_cells() as f64 * density) as usize;
        let mut rng = rand::thread_rng();
        let mut agent_counter = world.generation.total_agents_born;

        world.agents.clear();

        // 重複のない位置を生成
        let mut occupied_positions = std::collections::HashSet::new();

        for _ in 0..target_population {
            // 最大試行回数を設定して無限ループを防ぐ
            let mut attempts = 0;
            const MAX_ATTEMPTS: usize = 1000;

            while attempts < MAX_ATTEMPTS {
                let position = world.dimensions.random_position(&mut rng);

                if !occupied_positions.contains(&position) {
                    occupied_positions.insert(position);

                    let agent_id = AgentId(agent_counter);
                    let agent = Agent::random(agent_id, position, &mut rng);
                    world.add_agent(agent);
                    agent_counter += 1;
                    break;
                }
                attempts += 1;
            }

            if attempts >= MAX_ATTEMPTS {
                break; // 密度が高すぎる場合は部分的な生成で終了
            }
        }

        Ok(world.agents.len())
    }

    /// 生存チェックと死亡エージェントの除去
    pub fn cleanup_dead_agents(world: &mut SimulationWorld) -> usize {
        let initial_count = world.agents.len();
        world.remove_dead_agents();
        initial_count - world.agents.len()
    }

    /// 人口密度を計算
    pub fn calculate_density(world: &SimulationWorld) -> f64 {
        world.agents.len() as f64 / world.dimensions.total_cells() as f64
    }

    /// エージェントの空間分布を分析
    pub fn analyze_spatial_distribution(world: &SimulationWorld) -> SpatialDistribution {
        if world.agents.is_empty() {
            return SpatialDistribution::empty();
        }

        let mut position_counts: HashMap<Position, usize> = HashMap::new();

        for agent in &world.agents {
            *position_counts.entry(agent.position).or_insert(0) += 1;
        }

        let max_density = *position_counts.values().max().unwrap_or(&0);
        let occupied_cells = position_counts.len();
        let total_cells = world.dimensions.total_cells();

        SpatialDistribution {
            occupied_cells,
            total_cells,
            max_local_density: max_density,
            clustering_coefficient: Self::calculate_clustering(&world.agents),
        }
    }

    /// クラスタリング係数を計算
    fn calculate_clustering(agents: &[Agent]) -> f64 {
        if agents.len() < 2 {
            return 0.0;
        }

        let mut total_neighbors = 0;
        let mut clustered_neighbors = 0;

        for (i, agent) in agents.iter().enumerate() {
            let neighbors: Vec<_> = agents
                .iter()
                .enumerate()
                .filter(|(j, other)| {
                    *j != i && agent.position.chebyshev_distance(&other.position) <= 1
                })
                .collect();

            total_neighbors += neighbors.len();

            // 隣接エージェント同士の接続をチェック
            for (j, (_, neighbor1)) in neighbors.iter().enumerate() {
                for (_, neighbor2) in neighbors.iter().skip(j + 1) {
                    if neighbor1.position.chebyshev_distance(&neighbor2.position) <= 1 {
                        clustered_neighbors += 1;
                    }
                }
            }
        }

        if total_neighbors == 0 {
            0.0
        } else {
            clustered_neighbors as f64 / total_neighbors as f64
        }
    }
}

/// 空間分布情報
#[derive(Debug, Clone)]
pub struct SpatialDistribution {
    pub occupied_cells: usize,
    pub total_cells: usize,
    pub max_local_density: usize,
    pub clustering_coefficient: f64,
}

impl SpatialDistribution {
    pub fn empty() -> Self {
        Self {
            occupied_cells: 0,
            total_cells: 0,
            max_local_density: 0,
            clustering_coefficient: 0.0,
        }
    }

    pub fn occupation_rate(&self) -> f64 {
        if self.total_cells == 0 {
            0.0
        } else {
            self.occupied_cells as f64 / self.total_cells as f64
        }
    }
}

/// 戦闘エラー
#[derive(Debug, Clone, PartialEq, Eq)]
pub enum BattleError {
    AgentNotFound,
    InvalidIndex,
}

impl std::fmt::Display for BattleError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            BattleError::AgentNotFound => write!(f, "Agent not found"),
            BattleError::InvalidIndex => write!(f, "Invalid agent index"),
        }
    }
}

impl std::error::Error for BattleError {}

/// 人口エラー
#[derive(Debug, Clone, PartialEq)]
pub enum PopulationError {
    InvalidDensity,
    PopulationTooLarge,
}

impl std::fmt::Display for PopulationError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            PopulationError::InvalidDensity => write!(f, "Invalid population density"),
            PopulationError::PopulationTooLarge => write!(f, "Population too large for world size"),
        }
    }
}

impl std::error::Error for PopulationError {}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::core::{AgentTraits, WorldDimensions};

    #[test]
    fn test_battle_service() {
        let mut world = SimulationWorld::new(WorldDimensions::new(10, 10).unwrap());
        let payoff_matrix = PayoffMatrix::classic();
        let battle_radius = BattleRadius::new(1).unwrap();

        // テスト用エージェントを追加
        let agent1 = Agent::new(
            AgentId(1),
            Position::new(5, 5),
            AgentTraits {
                cooperation_rate: 1.0,
                movement_rate: 0.0,
                aggression_level: 0.5,
                learning_rate: 0.5,
            },
        );
        let agent2 = Agent::new(
            AgentId(2),
            Position::new(5, 6),
            AgentTraits {
                cooperation_rate: 0.0,
                movement_rate: 0.0,
                aggression_level: 0.5,
                learning_rate: 0.5,
            },
        );

        world.add_agent(agent1);
        world.add_agent(agent2);

        let battles =
            BattleService::execute_battles_for_agent(&mut world, 0, &payoff_matrix, battle_radius)
                .unwrap();

        assert_eq!(battles, 1);
        assert!(world.agents[0].state.score >= 0.0);
        assert!(world.agents[1].state.score >= 0.0);
    }

    #[test]
    fn test_population_service() {
        let mut world = SimulationWorld::new(WorldDimensions::new(10, 10).unwrap());

        let count = PopulationService::populate_world(&mut world, 0.3).unwrap();
        assert_eq!(count, 30);
        assert_eq!(world.agents.len(), 30);

        let density = PopulationService::calculate_density(&world);
        assert!((density - 0.3).abs() < 0.01);
    }

    #[test]
    fn test_movement_service() {
        let mut world = SimulationWorld::new(WorldDimensions::new(10, 10).unwrap());

        let agent = Agent::new(
            AgentId(1),
            Position::new(5, 5),
            AgentTraits {
                cooperation_rate: 0.5,
                movement_rate: 1.0, // 必ず移動
                aggression_level: 0.5,
                learning_rate: 0.5,
            },
        );
        world.add_agent(agent);

        let original_position = world.agents[0].position;
        MovementService::move_all_agents(&mut world);

        // 移動確率が1.0なので移動している可能性が高い
        // ただし、ランダムなので必ずしも位置が変わるとは限らない
        assert!(
            world.agents[0]
                .position
                .chebyshev_distance(&original_position)
                <= 1
        );
    }
}
