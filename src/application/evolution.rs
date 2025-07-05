// ========================================
// Evolution Use Case - 進化ユースケース
// ========================================

use crate::domain::{
    Agent, AgentId, EvolutionService, EvolutionConfig, SelectionMethod, CrossoverMethod
};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;

/// 進化実行コマンド
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct EvolvePopulationCommand {
    pub agents: HashMap<AgentId, Agent>,
    pub target_population: usize,
    pub config: EvolutionConfig,
}

/// 進化結果
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct EvolutionResult {
    pub new_generation: Vec<Agent>,
    pub statistics: EvolutionStatistics,
}

/// 進化統計
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct EvolutionStatistics {
    pub original_population: usize,
    pub new_population: usize,
    pub elite_count: usize,
    pub average_fitness: f64,
    pub max_fitness: f64,
    pub min_fitness: f64,
    pub average_cooperation: f64,
    pub average_aggression: f64,
    pub average_learning: f64,
    pub average_movement: f64,
}

/// 個体評価コマンド
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct EvaluateAgentCommand {
    pub agent: Agent,
}

/// 個体評価結果
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct AgentEvaluationResult {
    pub fitness: f64,
    pub cooperation_tendency: f64,
    pub aggression_level: f64,
    pub learning_ability: f64,
    pub movement_tendency: f64,
    pub score: f64,
    pub age: u32,
    pub battles_fought: u32,
    pub is_alive: bool,
}

/// 進化ユースケース
pub struct EvolutionUseCase {
    service: EvolutionService,
}

/// 進化エラー
#[derive(Debug, Clone, PartialEq)]
pub enum EvolutionUseCaseError {
    EmptyPopulation,
    InvalidTargetPopulation,
    InvalidConfig,
}

impl EvolutionUseCase {
    /// 新しい進化ユースケースを作成
    pub fn new(config: EvolutionConfig) -> Self {
        Self {
            service: EvolutionService::new(config),
        }
    }

    /// 標準的な進化ユースケースを作成
    pub fn standard() -> Self {
        Self {
            service: EvolutionService::standard(),
        }
    }

    /// 集団を進化
    pub fn evolve_population(&self, command: EvolvePopulationCommand) -> Result<EvolutionResult, EvolutionUseCaseError> {
        if command.agents.is_empty() {
            return Err(EvolutionUseCaseError::EmptyPopulation);
        }

        if command.target_population == 0 {
            return Err(EvolutionUseCaseError::InvalidTargetPopulation);
        }

        // 統計を計算（進化前の統計）
        let _original_stats = self.calculate_population_statistics(&command.agents);

        // 進化実行
        let new_generation = self.service.evolve_generation(&command.agents, command.target_population);

        // 新世代の統計を計算
        let new_agents_map: HashMap<AgentId, Agent> = new_generation.iter()
            .map(|agent| (agent.id(), agent.clone()))
            .collect();
        let new_stats = self.calculate_population_statistics(&new_agents_map);

        let elite_count = (command.target_population as f64 * self.service.config().elite_ratio) as usize;

        let statistics = EvolutionStatistics {
            original_population: command.agents.len(),
            new_population: new_generation.len(),
            elite_count,
            average_fitness: new_stats.average_fitness,
            max_fitness: new_stats.max_fitness,
            min_fitness: new_stats.min_fitness,
            average_cooperation: new_stats.average_cooperation,
            average_aggression: new_stats.average_aggression,
            average_learning: new_stats.average_learning,
            average_movement: new_stats.average_movement,
        };

        Ok(EvolutionResult {
            new_generation,
            statistics,
        })
    }

    /// 個体を評価
    pub fn evaluate_agent(&self, command: EvaluateAgentCommand) -> AgentEvaluationResult {
        let agent = &command.agent;
        
        AgentEvaluationResult {
            fitness: agent.fitness(),
            cooperation_tendency: agent.traits().cooperation_tendency(),
            aggression_level: agent.traits().aggression_level(),
            learning_ability: agent.traits().learning_ability(),
            movement_tendency: agent.traits().movement_tendency(),
            score: agent.state().score(),
            age: agent.state().age(),
            battles_fought: agent.state().battles_fought(),
            is_alive: agent.is_alive(),
        }
    }

    /// 集団統計を計算
    pub fn calculate_population_statistics(&self, agents: &HashMap<AgentId, Agent>) -> PopulationStatistics {
        if agents.is_empty() {
            return PopulationStatistics::empty();
        }

        let fitness_values: Vec<f64> = agents.values().map(|a| a.fitness()).collect();
        let cooperation_values: Vec<f64> = agents.values().map(|a| a.traits().cooperation_tendency()).collect();
        let aggression_values: Vec<f64> = agents.values().map(|a| a.traits().aggression_level()).collect();
        let learning_values: Vec<f64> = agents.values().map(|a| a.traits().learning_ability()).collect();
        let movement_values: Vec<f64> = agents.values().map(|a| a.traits().movement_tendency()).collect();

        PopulationStatistics {
            population_size: agents.len(),
            average_fitness: fitness_values.iter().sum::<f64>() / agents.len() as f64,
            max_fitness: fitness_values.iter().fold(f64::NEG_INFINITY, |a, &b| a.max(b)),
            min_fitness: fitness_values.iter().fold(f64::INFINITY, |a, &b| a.min(b)),
            average_cooperation: cooperation_values.iter().sum::<f64>() / agents.len() as f64,
            average_aggression: aggression_values.iter().sum::<f64>() / agents.len() as f64,
            average_learning: learning_values.iter().sum::<f64>() / agents.len() as f64,
            average_movement: movement_values.iter().sum::<f64>() / agents.len() as f64,
        }
    }

    /// 上位エージェントを取得
    pub fn get_top_agents(&self, agents: &HashMap<AgentId, Agent>, count: usize) -> Vec<Agent> {
        let mut sorted_agents: Vec<&Agent> = agents.values().collect();
        sorted_agents.sort_by(|a, b| b.fitness().partial_cmp(&a.fitness()).unwrap());
        
        sorted_agents.into_iter()
            .take(count)
            .cloned()
            .collect()
    }

    /// 最適な設定を提案
    pub fn suggest_optimal_config(&self, agents: &HashMap<AgentId, Agent>) -> EvolutionConfig {
        let stats = self.calculate_population_statistics(agents);
        
        // 集団の特性に基づいて設定を調整
        let mutation_rate = if stats.average_fitness < 50.0 {
            0.15 // 低フィットネスなら変異率を上げる
        } else {
            0.05 // 高フィットネスなら変異率を下げる
        };

        let elite_ratio = if stats.population_size < 50 {
            0.2 // 小集団なら多めにエリートを保持
        } else {
            0.1 // 大集団なら標準的な比率
        };

        let selection_method = if stats.average_fitness > 100.0 {
            SelectionMethod::Rank // 高フィットネスならランク選択
        } else {
            SelectionMethod::Tournament // 標準的にはトーナメント選択
        };

        EvolutionConfig::new(
            mutation_rate,
            0.05, // 変異強度は固定
            elite_ratio,
            selection_method,
            CrossoverMethod::Uniform,
        )
    }

    /// 現在の設定を取得
    pub fn config(&self) -> &EvolutionConfig {
        self.service.config()
    }
}

/// 集団統計
#[derive(Debug, Clone, PartialEq)]
pub struct PopulationStatistics {
    pub population_size: usize,
    pub average_fitness: f64,
    pub max_fitness: f64,
    pub min_fitness: f64,
    pub average_cooperation: f64,
    pub average_aggression: f64,
    pub average_learning: f64,
    pub average_movement: f64,
}

impl PopulationStatistics {
    fn empty() -> Self {
        Self {
            population_size: 0,
            average_fitness: 0.0,
            max_fitness: 0.0,
            min_fitness: 0.0,
            average_cooperation: 0.0,
            average_aggression: 0.0,
            average_learning: 0.0,
            average_movement: 0.0,
        }
    }
}

impl std::fmt::Display for EvolutionUseCaseError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            EvolutionUseCaseError::EmptyPopulation => write!(f, "Population is empty"),
            EvolutionUseCaseError::InvalidTargetPopulation => write!(f, "Invalid target population size"),
            EvolutionUseCaseError::InvalidConfig => write!(f, "Invalid evolution configuration"),
        }
    }
}

impl std::error::Error for EvolutionUseCaseError {}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::domain::{Agent, AgentTraits, Position};

    fn create_test_agent(id: u64, score: f64, cooperation: f64) -> Agent {
        let agent_id = AgentId::new(id);
        let position = Position::new(0, 0);
        let traits = AgentTraits::new(cooperation, 0.5, 0.5, 0.5).unwrap();
        let mut agent = Agent::new(agent_id, position, traits);
        agent.add_score(score);
        agent
    }

    fn create_test_population() -> HashMap<AgentId, Agent> {
        let mut agents = HashMap::new();
        
        for i in 1..=5 {
            let agent = create_test_agent(i, i as f64 * 10.0, 0.3 + (i as f64 * 0.1));
            agents.insert(agent.id(), agent);
        }
        
        agents
    }

    #[test]
    fn test_evolution_use_case_creation() {
        let config = EvolutionConfig::standard();
        let use_case = EvolutionUseCase::new(config);
        
        assert_eq!(use_case.config().mutation_rate, 0.1);
    }

    #[test]
    fn test_evolution_use_case_standard() {
        let use_case = EvolutionUseCase::standard();
        assert_eq!(use_case.config().mutation_rate, 0.1);
    }

    #[test]
    fn test_evolve_population() {
        let use_case = EvolutionUseCase::standard();
        let agents = create_test_population();
        
        let command = EvolvePopulationCommand {
            agents,
            target_population: 5,
            config: EvolutionConfig::standard(),
        };
        
        let result = use_case.evolve_population(command).unwrap();
        
        assert_eq!(result.new_generation.len(), 5);
        assert_eq!(result.statistics.original_population, 5);
        assert_eq!(result.statistics.new_population, 5);
        assert!(result.statistics.average_fitness >= 0.0);
    }

    #[test]
    fn test_evolve_empty_population_error() {
        let use_case = EvolutionUseCase::standard();
        let empty_agents = HashMap::new();
        
        let command = EvolvePopulationCommand {
            agents: empty_agents,
            target_population: 5,
            config: EvolutionConfig::standard(),
        };
        
        let result = use_case.evolve_population(command);
        assert!(matches!(result.unwrap_err(), EvolutionUseCaseError::EmptyPopulation));
    }

    #[test]
    fn test_evolve_invalid_target_population() {
        let use_case = EvolutionUseCase::standard();
        let agents = create_test_population();
        
        let command = EvolvePopulationCommand {
            agents,
            target_population: 0, // 無効な目標人口
            config: EvolutionConfig::standard(),
        };
        
        let result = use_case.evolve_population(command);
        assert!(matches!(result.unwrap_err(), EvolutionUseCaseError::InvalidTargetPopulation));
    }

    #[test]
    fn test_evaluate_agent() {
        let use_case = EvolutionUseCase::standard();
        let agent = create_test_agent(1, 50.0, 0.7);
        
        let command = EvaluateAgentCommand { agent };
        let result = use_case.evaluate_agent(command);
        
        assert_eq!(result.cooperation_tendency, 0.7);
        assert_eq!(result.score, 50.0);
        assert!(result.is_alive);
        assert!(result.fitness > 0.0);
    }

    #[test]
    fn test_calculate_population_statistics() {
        let use_case = EvolutionUseCase::standard();
        let agents = create_test_population();
        
        let stats = use_case.calculate_population_statistics(&agents);
        
        assert_eq!(stats.population_size, 5);
        assert!(stats.average_fitness > 0.0);
        assert!(stats.max_fitness >= stats.min_fitness);
        assert!(stats.average_cooperation >= 0.0 && stats.average_cooperation <= 1.0);
    }

    #[test]
    fn test_calculate_empty_population_statistics() {
        let use_case = EvolutionUseCase::standard();
        let empty_agents = HashMap::new();
        
        let stats = use_case.calculate_population_statistics(&empty_agents);
        
        assert_eq!(stats.population_size, 0);
        assert_eq!(stats.average_fitness, 0.0);
    }

    #[test]
    fn test_get_top_agents() {
        let use_case = EvolutionUseCase::standard();
        let agents = create_test_population();
        
        let top_agents = use_case.get_top_agents(&agents, 3);
        
        assert_eq!(top_agents.len(), 3);
        
        // フィットネス順にソートされているかチェック
        for i in 0..top_agents.len()-1 {
            assert!(top_agents[i].fitness() >= top_agents[i+1].fitness());
        }
    }

    #[test]
    fn test_get_top_agents_more_than_population() {
        let use_case = EvolutionUseCase::standard();
        let agents = create_test_population();
        
        let top_agents = use_case.get_top_agents(&agents, 10);
        
        // 集団サイズを超えて取得はできない
        assert_eq!(top_agents.len(), 5);
    }

    #[test]
    fn test_suggest_optimal_config() {
        let use_case = EvolutionUseCase::standard();
        
        // 低フィットネス集団
        let mut low_fitness_agents = HashMap::new();
        for i in 1..=3 {
            let agent = create_test_agent(i, 10.0, 0.5); // 低スコア
            low_fitness_agents.insert(agent.id(), agent);
        }
        
        let config = use_case.suggest_optimal_config(&low_fitness_agents);
        assert_eq!(config.mutation_rate, 0.15); // 高い変異率
        
        // 高フィットネス集団
        let mut high_fitness_agents = HashMap::new();
        for i in 1..=3 {
            let agent = create_test_agent(i, 150.0, 0.5); // 高スコア
            high_fitness_agents.insert(agent.id(), agent);
        }
        
        let config = use_case.suggest_optimal_config(&high_fitness_agents);
        assert_eq!(config.mutation_rate, 0.05); // 低い変異率
        assert_eq!(config.selection_method, SelectionMethod::Rank);
    }

    #[test]
    fn test_evolution_statistics() {
        let use_case = EvolutionUseCase::standard();
        let agents = create_test_population();
        
        let command = EvolvePopulationCommand {
            agents,
            target_population: 6, // 人口を増やす
            config: EvolutionConfig::standard(),
        };
        
        let result = use_case.evolve_population(command).unwrap();
        
        assert_eq!(result.statistics.original_population, 5);
        assert_eq!(result.statistics.new_population, 6);
        // エリート数は非負の値
        assert!(result.statistics.average_cooperation >= 0.0);
        assert!(result.statistics.average_cooperation <= 1.0);
    }

    #[test]
    fn test_evolution_with_different_configs() {
        let use_case = EvolutionUseCase::standard();
        let agents = create_test_population();
        
        // 高変異率設定
        let high_mutation_config = EvolutionConfig::new(
            0.5, // 高変異率
            0.1,
            0.1,
            SelectionMethod::Tournament,
            CrossoverMethod::Uniform,
        );
        
        let command = EvolvePopulationCommand {
            agents,
            target_population: 5,
            config: high_mutation_config,
        };
        
        let result = use_case.evolve_population(command).unwrap();
        assert_eq!(result.new_generation.len(), 5);
        
        // 結果は変異により多様性が増している可能性が高い
        assert!(result.statistics.average_cooperation >= 0.0);
        assert!(result.statistics.average_cooperation <= 1.0);
    }
}