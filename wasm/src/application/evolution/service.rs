use super::RouletteSelection;
use crate::application::simulation::SimulationConfig;
use crate::domain::agent::{Agent, Position};
use rand::RngExt;
use rand::seq::SliceRandom;
use std::collections::HashMap;
use uuid::Uuid;

pub struct EvolutionService;

impl Default for EvolutionService {
    fn default() -> Self {
        Self::new()
    }
}

impl EvolutionService {
    pub fn new() -> Self {
        Self
    }

    pub fn evolve(
        &self,
        current_agents: &HashMap<Uuid, Agent>,
        width: usize,
        height: usize,
    ) -> Vec<Agent> {
        self.evolve_with_config(current_agents, &SimulationConfig::default(), width, height)
    }

    /// 現世代のエージェントから次世代を生成する。
    ///
    /// `width`/`height` には呼び出し元のグリッドの実サイズを渡すこと。
    /// ここで生成する子エージェントの座標は必ずそのグリッド内に収まり、
    /// かつ（`current_agents.len() <= width * height` である限り）互いに重複しないことが保証される。
    pub fn evolve_with_config(
        &self,
        current_agents: &HashMap<Uuid, Agent>,
        config: &SimulationConfig,
        width: usize,
        height: usize,
    ) -> Vec<Agent> {
        if current_agents.is_empty() {
            return Vec::new();
        }

        let parents = if config.strategy_complexity_penalty_enabled {
            RouletteSelection::select_parents_with_penalty(
                current_agents,
                config.strategy_complexity_penalty_rate,
            )
        } else {
            RouletteSelection::select_parents(current_agents)
        };

        let mut new_agents = Vec::new();
        let mut rng = rand::rng();

        let agent_count = current_agents.len();
        let grid_positions = self.generate_positions(width, height, agent_count);

        for position in grid_positions.iter() {
            if parents.len() < 2 {
                let agent = Agent::random(*position);
                new_agents.push(agent);
                continue;
            }

            let parent1_idx = rng.random_range(0..parents.len());
            let parent2_idx = rng.random_range(0..parents.len());

            let parent1 = &parents[parent1_idx];
            let parent2 = &parents[parent2_idx];

            let mut child = Agent::crossover(parent1, parent2, *position);
            child.mutate();

            new_agents.push(child);
        }

        new_agents
    }

    /// `width x height` のグリッド上に `count` 個の座標を生成する。
    ///
    /// `count <= width * height` の場合、全マスをシャッフルして先頭から取るため
    /// 返り値の座標は重複しないことが保証される（`Grid::add_agent` が座標重複を理由に
    /// 失敗することはない）。`count` がグリッド容量を超える場合のみ、
    /// 収まりきらない分はランダムに重複しうる座標として補う。
    fn generate_positions(&self, width: usize, height: usize, count: usize) -> Vec<Position> {
        let mut rng = rand::rng();
        let capacity = width * height;

        let mut all_positions: Vec<Position> = (0..width)
            .flat_map(|x| (0..height).map(move |y| Position::new(x, y)))
            .collect();
        all_positions.shuffle(&mut rng);

        if count <= capacity {
            all_positions.truncate(count);
            return all_positions;
        }

        // グリッド容量を超える分は、重複を許容してランダムに補う。
        let mut positions = all_positions;
        for _ in capacity..count {
            let x = rng.random_range(0..width.max(1));
            let y = rng.random_range(0..height.max(1));
            positions.push(Position::new(x, y));
        }

        positions
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::domain::agent::{MovementStrategy, StrategyType};
    use std::collections::HashSet;

    fn agents_map(count: usize) -> HashMap<Uuid, Agent> {
        (0..count)
            .map(|i| {
                let agent = Agent::new(
                    Position::new(i % 5, i / 5),
                    StrategyType::AllCooperate,
                    0.5,
                    MovementStrategy::Settler,
                );
                (agent.id, agent)
            })
            .collect()
    }

    #[test]
    fn generate_positions_within_capacity_are_unique_and_in_bounds() {
        let service = EvolutionService::new();
        let positions = service.generate_positions(10, 8, 40);

        assert_eq!(positions.len(), 40);

        let unique: HashSet<_> = positions.iter().collect();
        assert_eq!(unique.len(), 40, "生成された座標は重複してはならない");

        for position in &positions {
            assert!(
                position.x < 10,
                "x座標がグリッド幅を超えている: {position:?}"
            );
            assert!(
                position.y < 8,
                "y座標がグリッド高さを超えている: {position:?}"
            );
        }
    }

    #[test]
    fn generate_positions_respects_non_square_and_non_default_grid_size() {
        // かつてグリッドサイズが100固定だったため、100x100以外では境界外の座標が生成され得た。
        let service = EvolutionService::new();
        let positions = service.generate_positions(3, 4, 12);

        assert_eq!(positions.len(), 12);
        let unique: HashSet<_> = positions.iter().collect();
        assert_eq!(
            unique.len(),
            12,
            "3x4グリッドの全12マスがちょうど埋まるはず"
        );

        for position in &positions {
            assert!(position.x < 3);
            assert!(position.y < 4);
        }
    }

    #[test]
    fn generate_positions_exceeding_capacity_still_stays_in_bounds() {
        let service = EvolutionService::new();
        let positions = service.generate_positions(2, 2, 10);

        assert_eq!(positions.len(), 10);
        for position in &positions {
            assert!(position.x < 2);
            assert!(position.y < 2);
        }
    }

    #[test]
    fn evolve_with_config_preserves_agent_count_on_non_default_grid() {
        let service = EvolutionService::new();
        let agents = agents_map(20);

        let next_gen = service.evolve_with_config(&agents, &SimulationConfig::default(), 10, 8);

        assert_eq!(
            next_gen.len(),
            20,
            "グリッドサイズが100x100以外でも子エージェント数は元の個体数と一致するはず"
        );

        let unique_positions: HashSet<_> = next_gen.iter().map(|a| a.position).collect();
        assert_eq!(
            unique_positions.len(),
            20,
            "子エージェントの座標は重複してはならない"
        );

        for agent in &next_gen {
            assert!(agent.position.x < 10);
            assert!(agent.position.y < 8);
        }
    }

    #[test]
    fn evolve_with_config_returns_empty_for_no_agents() {
        let service = EvolutionService::new();
        let agents: HashMap<Uuid, Agent> = HashMap::new();

        let next_gen = service.evolve_with_config(&agents, &SimulationConfig::default(), 10, 10);

        assert!(next_gen.is_empty());
    }
}
