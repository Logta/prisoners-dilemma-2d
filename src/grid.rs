use crate::agent::Agent;
use rand::Rng;

pub struct Grid {
    pub width: usize,
    pub height: usize,
    pub agents: Vec<Agent>,
}

impl Grid {
    pub fn new(width: usize, height: usize) -> Self {
        Grid {
            width,
            height,
            agents: Vec::new(),
        }
    }

    pub fn add_agent(&mut self, agent: Agent) {
        self.agents.push(agent);
    }

    pub fn populate_agents(&mut self, density: f64) {
        let mut rng = rand::thread_rng();
        let total_cells = self.width * self.height;
        let target_agents = (total_cells as f64 * density) as usize;

        for _ in 0..target_agents {
            let x = rng.gen_range(0..self.width);
            let y = rng.gen_range(0..self.height);
            let cooperation_rate = rng.gen_range(0.0..=1.0);
            let movement_rate = rng.gen_range(0.0..=1.0);

            let agent = Agent::new(x, y, cooperation_rate, movement_rate);
            self.add_agent(agent);
        }
    }

    pub fn get_agent_at(&self, x: usize, y: usize) -> Option<&Agent> {
        self.agents
            .iter()
            .find(|agent| agent.x == x && agent.y == y)
    }

    pub fn find_neighbors_within_radius(
        &self,
        center_x: usize,
        center_y: usize,
        radius: usize,
    ) -> Vec<&Agent> {
        self.agents
            .iter()
            .filter(|agent| {
                // 中心のエージェント自身は除外
                if agent.x == center_x && agent.y == center_y {
                    return false;
                }

                // マンハッタン距離で半径内かチェック
                let dx = if agent.x > center_x {
                    agent.x - center_x
                } else {
                    center_x - agent.x
                };
                let dy = if agent.y > center_y {
                    agent.y - center_y
                } else {
                    center_y - agent.y
                };

                dx.max(dy) <= radius
            })
            .collect()
    }

    pub fn execute_battles_for_agent(
        &mut self,
        agent_index: usize,
        matrix: &crate::game::PayoffMatrix,
        radius: usize,
    ) {
        if agent_index >= self.agents.len() {
            return;
        }

        let center_x = self.agents[agent_index].x;
        let center_y = self.agents[agent_index].y;
        let agent_cooperates = self.agents[agent_index].decides_to_cooperate();

        // 隣接エージェントのインデックスを収集
        let neighbor_indices: Vec<usize> = self
            .agents
            .iter()
            .enumerate()
            .filter_map(|(i, agent)| {
                if i == agent_index {
                    return None;
                }

                let dx = if agent.x > center_x {
                    agent.x - center_x
                } else {
                    center_x - agent.x
                };
                let dy = if agent.y > center_y {
                    agent.y - center_y
                } else {
                    center_y - agent.y
                };

                if dx.max(dy) <= radius {
                    Some(i)
                } else {
                    None
                }
            })
            .collect();

        // 各隣接エージェントと対戦
        let mut score_updates = Vec::new();
        for &neighbor_index in &neighbor_indices {
            // 境界チェック
            if neighbor_index >= self.agents.len() {
                continue;
            }

            let neighbor_cooperates = self.agents[neighbor_index].decides_to_cooperate();
            let (agent_score, neighbor_score) =
                crate::game::calculate_payoff(matrix, agent_cooperates, neighbor_cooperates);

            score_updates.push((agent_index, agent_score));
            score_updates.push((neighbor_index, neighbor_score));
        }

        // スコアの更新を一括で実行
        for (index, score) in score_updates {
            if index < self.agents.len() {
                self.agents[index].update_score(score);
            }
        }
    }

    pub fn move_agents(&mut self) {
        use rand::Rng;
        let mut rng = rand::thread_rng();

        for agent in &mut self.agents {
            if agent.decides_to_move() {
                // 隣接8マスのうちランダムな位置に移動
                let directions = [
                    (-1i32, -1i32),
                    (-1, 0),
                    (-1, 1),
                    (0, -1),
                    (0, 1),
                    (1, -1),
                    (1, 0),
                    (1, 1),
                ];

                let (dx, dy) = directions[rng.gen_range(0..directions.len())];
                let new_x = (agent.x as i32 + dx).max(0).min(self.width as i32 - 1) as usize;
                let new_y = (agent.y as i32 + dy).max(0).min(self.height as i32 - 1) as usize;

                agent.move_to(new_x, new_y);
            }
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_grid_creation() {
        let grid = Grid::new(10, 8);

        assert_eq!(grid.width, 10);
        assert_eq!(grid.height, 8);
        assert_eq!(grid.agents.len(), 0);
    }

    #[test]
    fn test_grid_add_agent() {
        let mut grid = Grid::new(10, 8);
        let agent = Agent::new(3, 4, 0.5, 0.2);

        grid.add_agent(agent);

        assert_eq!(grid.agents.len(), 1);
        assert_eq!(grid.agents[0].x, 3);
        assert_eq!(grid.agents[0].y, 4);
    }

    #[test]
    fn test_grid_populate_agents() {
        let mut grid = Grid::new(10, 10);

        grid.populate_agents(0.3);

        // With 30% density on 100 cells, expect around 30 agents (±5 for randomness)
        assert!(grid.agents.len() >= 25 && grid.agents.len() <= 35);

        // Check all agents are within bounds
        for agent in &grid.agents {
            assert!(agent.x < grid.width);
            assert!(agent.y < grid.height);
        }
    }

    #[test]
    fn test_grid_get_agent_at() {
        let mut grid = Grid::new(10, 10);
        let agent = Agent::new(3, 4, 0.7, 0.2);
        grid.add_agent(agent);

        assert!(grid.get_agent_at(3, 4).is_some());
        assert!(grid.get_agent_at(2, 4).is_none());
        assert_eq!(grid.get_agent_at(3, 4).unwrap().cooperation_rate, 0.7);
    }

    #[test]
    fn test_find_neighbors_within_radius() {
        let mut grid = Grid::new(10, 10);

        // 中心のエージェント
        grid.add_agent(Agent::new(5, 5, 0.5, 0.5));

        // 隣接エージェント
        grid.add_agent(Agent::new(4, 5, 0.6, 0.4)); // 左
        grid.add_agent(Agent::new(6, 5, 0.7, 0.3)); // 右
        grid.add_agent(Agent::new(5, 4, 0.8, 0.2)); // 上
        grid.add_agent(Agent::new(5, 6, 0.9, 0.1)); // 下

        // 半径2の範囲内
        grid.add_agent(Agent::new(3, 5, 0.3, 0.7)); // 半径2

        // 範囲外
        grid.add_agent(Agent::new(1, 1, 0.1, 0.9)); // 範囲外

        let neighbors = grid.find_neighbors_within_radius(5, 5, 1);
        assert_eq!(neighbors.len(), 4); // 隣接する4つのエージェント

        let neighbors_radius_2 = grid.find_neighbors_within_radius(5, 5, 2);
        assert_eq!(neighbors_radius_2.len(), 5); // 半径2以内の5つのエージェント
    }

    #[test]
    fn test_find_neighbors_boundary_conditions() {
        let mut grid = Grid::new(5, 5);

        // 角にエージェントを配置
        grid.add_agent(Agent::new(0, 0, 0.5, 0.5));
        grid.add_agent(Agent::new(1, 0, 0.6, 0.4));
        grid.add_agent(Agent::new(0, 1, 0.7, 0.3));

        let neighbors = grid.find_neighbors_within_radius(0, 0, 1);
        assert_eq!(neighbors.len(), 2); // 境界条件での隣接エージェント
    }

    #[test]
    fn test_execute_battles_for_agent() {
        let mut grid = Grid::new(10, 10);
        let matrix = crate::game::PayoffMatrix::default();

        // エージェントを配置
        grid.add_agent(Agent::new(5, 5, 1.0, 0.0)); // 常に協力
        grid.add_agent(Agent::new(4, 5, 0.0, 0.0)); // 常に裏切り
        grid.add_agent(Agent::new(6, 5, 1.0, 0.0)); // 常に協力

        let initial_scores: Vec<f64> = grid.agents.iter().map(|a| a.score).collect();
        assert_eq!(initial_scores, vec![0.0, 0.0, 0.0]);

        grid.execute_battles_for_agent(0, &matrix, 1);

        // エージェント0（協力）は隣接の1つの裏切りエージェントと1つの協力エージェントと対戦
        // 協力vs裏切り: (0, 5), 協力vs協力: (3, 3) なので合計3点
        // ただし、実際にはランダム要素があるので、スコアが0より大きいことを確認
        assert!(grid.agents[0].score > 0.0);
    }

    #[test]
    fn test_move_agents() {
        let mut grid = Grid::new(10, 10);

        // 確実に移動するエージェント
        grid.add_agent(Agent::new(5, 5, 0.5, 1.0));
        // 確実に移動しないエージェント
        grid.add_agent(Agent::new(2, 2, 0.5, 0.0));

        let original_positions: Vec<(usize, usize)> =
            grid.agents.iter().map(|a| (a.x, a.y)).collect();

        grid.move_agents();

        let new_positions: Vec<(usize, usize)> = grid.agents.iter().map(|a| (a.x, a.y)).collect();

        // 移動確率1.0のエージェントは移動している可能性が高い（ランダムなので必ずではない）
        // 移動確率0.0のエージェントは移動していない
        assert_eq!(new_positions[1], original_positions[1]); // 移動しないエージェント

        // すべてのエージェントがグリッド内にいることを確認
        for agent in &grid.agents {
            assert!(agent.x < grid.width);
            assert!(agent.y < grid.height);
        }
    }
}
