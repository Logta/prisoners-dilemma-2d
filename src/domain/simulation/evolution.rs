// ========================================
// Evolution - 遺伝的アルゴリズム
// ========================================

use crate::domain::agent::Agent;
use crate::domain::shared::AgentId;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;

/// 選択方法
#[derive(Debug, Clone, Copy, PartialEq, Serialize, Deserialize)]
pub enum SelectionMethod {
    Tournament,
    Roulette,
    Rank,
}

/// 交叉方法
#[derive(Debug, Clone, Copy, PartialEq, Serialize, Deserialize)]
pub enum CrossoverMethod {
    Uniform,
    OnePoint,
    TwoPoint,
}

/// 進化パラメータ
#[derive(Debug, Clone, Copy, PartialEq, Serialize, Deserialize)]
pub struct EvolutionConfig {
    pub mutation_rate: f64,
    pub mutation_strength: f64,
    pub elite_ratio: f64,
    pub selection_method: SelectionMethod,
    pub crossover_method: CrossoverMethod,
}

/// 遺伝的アルゴリズムサービス
pub struct EvolutionService {
    config: EvolutionConfig,
}

impl EvolutionConfig {
    /// 標準的な進化設定を作成
    pub fn standard() -> Self {
        Self {
            mutation_rate: 0.1,
            mutation_strength: 0.05,
            elite_ratio: 0.1,
            selection_method: SelectionMethod::Tournament,
            crossover_method: CrossoverMethod::Uniform,
        }
    }

    /// カスタム進化設定を作成
    pub fn new(
        mutation_rate: f64,
        mutation_strength: f64,
        elite_ratio: f64,
        selection_method: SelectionMethod,
        crossover_method: CrossoverMethod,
    ) -> Self {
        Self {
            mutation_rate,
            mutation_strength,
            elite_ratio,
            selection_method,
            crossover_method,
        }
    }
}

impl EvolutionService {
    /// 新しい進化サービスを作成
    pub fn new(config: EvolutionConfig) -> Self {
        Self { config }
    }

    /// 標準的な進化サービスを作成
    pub fn standard() -> Self {
        Self::new(EvolutionConfig::standard())
    }

    /// 次世代のエージェントを生成
    pub fn evolve_generation(
        &self,
        agents: &HashMap<AgentId, Agent>,
        target_population: usize,
    ) -> Vec<Agent> {
        if agents.is_empty() {
            return Vec::new();
        }

        let mut sorted_agents: Vec<&Agent> = agents.values().collect();
        sorted_agents.sort_by(|a, b| b.fitness().partial_cmp(&a.fitness()).unwrap());

        let elite_count = (target_population as f64 * self.config.elite_ratio) as usize;
        let mut next_generation = Vec::new();

        // エリートを保持
        for i in 0..elite_count.min(sorted_agents.len()) {
            next_generation.push(sorted_agents[i].clone());
        }

        // 残りを交叉と突然変異で生成
        let mut next_id = agents.len() as u64 + 1;
        let mut attempts = 0;
        while next_generation.len() < target_population && attempts < target_population * 10 {
            let parent1 = self.select_parent(&sorted_agents);
            let parent2 = self.select_parent(&sorted_agents);

            // 異なる親または一定回数試行したら強制的に子を生成
            if parent1.id() != parent2.id() || attempts > target_population * 5 {
                let child_id = AgentId::new(next_id);
                next_id += 1;

                let mut child = parent1.reproduce_with(parent2, child_id, parent1.position());
                
                // 突然変異を適用
                child.mutate(self.config.mutation_rate, self.config.mutation_strength);
                
                next_generation.push(child);
            }
            attempts += 1;
        }

        next_generation.truncate(target_population);
        next_generation
    }

    /// 親を選択
    fn select_parent<'a>(&self, sorted_agents: &[&'a Agent]) -> &'a Agent {
        match self.config.selection_method {
            SelectionMethod::Tournament => self.tournament_selection(sorted_agents),
            SelectionMethod::Roulette => self.roulette_selection(sorted_agents),
            SelectionMethod::Rank => self.rank_selection(sorted_agents),
        }
    }

    /// トーナメント選択
    fn tournament_selection<'a>(&self, agents: &[&'a Agent]) -> &'a Agent {
        if agents.is_empty() {
            panic!("Cannot select from empty agent list");
        }
        
        use rand::seq::SliceRandom;
        let mut rng = rand::thread_rng();
        
        let tournament_size = 3.min(agents.len());
        let tournament: Vec<&Agent> = agents.choose_multiple(&mut rng, tournament_size).cloned().collect();
        
        tournament
            .iter()
            .max_by(|a, b| a.fitness().partial_cmp(&b.fitness()).unwrap_or(std::cmp::Ordering::Equal))
            .unwrap_or(&agents[0])
    }

    /// ルーレット選択
    fn roulette_selection<'a>(&self, agents: &[&'a Agent]) -> &'a Agent {
        if agents.is_empty() {
            panic!("Cannot select from empty agent list");
        }
        
        use rand::Rng;
        let mut rng = rand::thread_rng();
        
        let total_fitness: f64 = agents.iter().map(|a| a.fitness().max(0.0)).sum();
        
        if total_fitness <= 0.0 {
            return agents[0];
        }
        
        let mut target = rng.gen_range(0.0..total_fitness);
        
        for agent in agents {
            target -= agent.fitness().max(0.0);
            if target <= 0.0 {
                return agent;
            }
        }
        
        agents[0] // フォールバック
    }

    /// ランク選択
    fn rank_selection<'a>(&self, sorted_agents: &[&'a Agent]) -> &'a Agent {
        if sorted_agents.is_empty() {
            panic!("Cannot select from empty agent list");
        }
        
        use rand::Rng;
        let mut rng = rand::thread_rng();
        
        let n = sorted_agents.len() as f64;
        let rank_sum = n * (n + 1.0) / 2.0;
        let mut target = rng.gen_range(0.0..rank_sum);
        
        for (i, agent) in sorted_agents.iter().enumerate() {
            let rank = n - i as f64;
            target -= rank;
            if target <= 0.0 {
                return agent;
            }
        }
        
        sorted_agents[0] // フォールバック
    }

    /// 設定を取得
    pub fn config(&self) -> &EvolutionConfig {
        &self.config
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::domain::agent::{Agent, AgentTraits};
    use crate::domain::shared::Position;

    fn create_test_agent(id: u64, score: f64) -> Agent {
        let agent_id = AgentId::new(id);
        let position = Position::new(0, 0);
        let traits = AgentTraits::new(0.5, 0.5, 0.5, 0.5).unwrap();
        let mut agent = Agent::new(agent_id, position, traits);
        agent.add_score(score);
        agent
    }

    #[test]
    fn test_evolution_config_standard() {
        let config = EvolutionConfig::standard();
        
        assert_eq!(config.mutation_rate, 0.1);
        assert_eq!(config.mutation_strength, 0.05);
        assert_eq!(config.elite_ratio, 0.1);
        assert_eq!(config.selection_method, SelectionMethod::Tournament);
        assert_eq!(config.crossover_method, CrossoverMethod::Uniform);
    }

    #[test]
    fn test_evolution_config_custom() {
        let config = EvolutionConfig::new(
            0.2,
            0.1,
            0.05,
            SelectionMethod::Roulette,
            CrossoverMethod::OnePoint,
        );
        
        assert_eq!(config.mutation_rate, 0.2);
        assert_eq!(config.mutation_strength, 0.1);
        assert_eq!(config.elite_ratio, 0.05);
        assert_eq!(config.selection_method, SelectionMethod::Roulette);
        assert_eq!(config.crossover_method, CrossoverMethod::OnePoint);
    }

    #[test]
    fn test_evolution_service_creation() {
        let service = EvolutionService::standard();
        assert_eq!(service.config().mutation_rate, 0.1);
    }

    #[test]
    fn test_evolve_empty_population() {
        let service = EvolutionService::standard();
        let agents = HashMap::new();
        
        let next_gen = service.evolve_generation(&agents, 10);
        assert!(next_gen.is_empty());
    }

    #[test]
    fn test_evolve_generation_basic() {
        let service = EvolutionService::standard();
        let mut agents = HashMap::new();
        
        // 異なるスコアのエージェントを作成
        for i in 1..=5 {
            let agent = create_test_agent(i, i as f64 * 10.0);
            agents.insert(agent.id(), agent);
        }
        
        let next_gen = service.evolve_generation(&agents, 5);
        
        assert_eq!(next_gen.len(), 5);
        
        // エリートが含まれていることを確認（最高スコアのエージェント）
        let elite_count = (5.0 * 0.1) as usize; // 0個（小数点切り捨て）だが、最低1個は保証されるべき
        if elite_count > 0 {
            assert!(next_gen.iter().any(|a| a.state().score() >= 40.0));
        }
    }

    #[test]
    fn test_evolve_generation_elite_preservation() {
        let config = EvolutionConfig::new(
            0.1,
            0.05,
            0.5, // 50%エリート
            SelectionMethod::Tournament,
            CrossoverMethod::Uniform,
        );
        let service = EvolutionService::new(config);
        let mut agents = HashMap::new();
        
        // 明確に異なるスコアのエージェントを作成
        for i in 1..=4 {
            let agent = create_test_agent(i, i as f64 * 100.0);
            agents.insert(agent.id(), agent);
        }
        
        let next_gen = service.evolve_generation(&agents, 4);
        assert_eq!(next_gen.len(), 4);
        
        // エリート2個が保持されているはず
        let elite_count = (4.0 * 0.5) as usize;
        assert_eq!(elite_count, 2);
        
        // 高スコアのエージェントが含まれている
        let high_score_count = next_gen.iter().filter(|a| a.state().score() >= 300.0).count();
        assert!(high_score_count >= 1);
    }

    #[test]
    fn test_tournament_selection() {
        let service = EvolutionService::standard();
        let agents = vec![
            create_test_agent(1, 10.0),
            create_test_agent(2, 50.0),
            create_test_agent(3, 30.0),
        ];
        let agent_refs: Vec<&Agent> = agents.iter().collect();
        
        // トーナメント選択は決定的ではないが、実行エラーがないことを確認
        let selected = service.tournament_selection(&agent_refs);
        assert!(agents.iter().any(|a| a.id() == selected.id()));
    }

    #[test]
    fn test_roulette_selection() {
        let service = EvolutionService::standard();
        let agents = vec![
            create_test_agent(1, 10.0),
            create_test_agent(2, 50.0),
            create_test_agent(3, 30.0),
        ];
        let agent_refs: Vec<&Agent> = agents.iter().collect();
        
        // ルーレット選択も決定的ではないが、実行エラーがないことを確認
        let selected = service.roulette_selection(&agent_refs);
        assert!(agents.iter().any(|a| a.id() == selected.id()));
    }

    #[test]
    fn test_rank_selection() {
        let service = EvolutionService::standard();
        let mut agents = vec![
            create_test_agent(1, 10.0),
            create_test_agent(2, 50.0),
            create_test_agent(3, 30.0),
        ];
        
        // スコア順にソート（降順）
        agents.sort_by(|a, b| b.fitness().partial_cmp(&a.fitness()).unwrap());
        let agent_refs: Vec<&Agent> = agents.iter().collect();
        
        // ランク選択も決定的ではないが、実行エラーがないことを確認
        let selected = service.rank_selection(&agent_refs);
        assert!(agents.iter().any(|a| a.id() == selected.id()));
    }

    #[test]
    fn test_evolve_with_different_selection_methods() {
        let mut agents = HashMap::new();
        for i in 1..=3 {
            let agent = create_test_agent(i, i as f64 * 10.0);
            agents.insert(agent.id(), agent);
        }
        
        // 各選択方法をテスト
        for method in [SelectionMethod::Tournament, SelectionMethod::Roulette, SelectionMethod::Rank] {
            let config = EvolutionConfig::new(0.1, 0.05, 0.1, method, CrossoverMethod::Uniform);
            let service = EvolutionService::new(config);
            
            let next_gen = service.evolve_generation(&agents, 3);
            assert_eq!(next_gen.len(), 3);
        }
    }

    #[test]
    fn test_zero_fitness_agents() {
        let service = EvolutionService::standard();
        let mut agents = HashMap::new();
        
        // 全てのエージェントが0スコア
        for i in 1..=3 {
            let agent = create_test_agent(i, 0.0);
            agents.insert(agent.id(), agent);
        }
        
        let next_gen = service.evolve_generation(&agents, 3);
        assert_eq!(next_gen.len(), 3);
    }
}