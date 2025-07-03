// ========================================
// Evolution Algorithms - 遺伝的アルゴリズムの主要ロジック
// ========================================

use crate::core::{Agent, AgentId, AgentTraits, SimulationWorld};
use crate::evolution::{CrossoverStrategy, EvolutionMetrics, MutationStrategy, SelectionStrategy};
use rand::Rng;
use serde::{Deserialize, Serialize};

/// 遺伝的アルゴリズムエンジン
pub struct GeneticAlgorithm {
    pub selection_strategy: Box<dyn SelectionStrategy>,
    pub crossover_strategy: Box<dyn CrossoverStrategy>,
    pub mutation_strategy: Box<dyn MutationStrategy>,
    pub config: EvolutionConfig,
}

/// 進化設定
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct EvolutionConfig {
    pub mutation_rate: f64,
    pub mutation_strength: f64,
    pub crossover_rate: f64,
    pub elitism_rate: f64,
    pub selection_pressure: f64,
    pub max_population_size: usize,
    pub min_population_size: usize,
    pub diversity_threshold: f64,
    pub adaptive_mutation: bool,
}

impl Default for EvolutionConfig {
    fn default() -> Self {
        Self {
            mutation_rate: 0.1,
            mutation_strength: 0.05,
            crossover_rate: 0.8,
            elitism_rate: 0.1,
            selection_pressure: 2.0,
            max_population_size: 1000,
            min_population_size: 50,
            diversity_threshold: 0.01,
            adaptive_mutation: true,
        }
    }
}

/// 進化結果
#[derive(Debug, Clone)]
pub struct EvolutionResult {
    pub new_generation: Vec<Agent>,
    pub metrics: EvolutionMetrics,
    pub convergence_info: ConvergenceInfo,
}

/// 収束情報
#[derive(Debug, Clone)]
pub struct ConvergenceInfo {
    pub diversity_score: f64,
    pub fitness_variance: f64,
    pub is_converged: bool,
    pub generations_to_convergence: Option<u32>,
}

impl GeneticAlgorithm {
    /// 新しい遺伝的アルゴリズムインスタンスを作成
    pub fn new(
        selection_strategy: Box<dyn SelectionStrategy>,
        crossover_strategy: Box<dyn CrossoverStrategy>,
        mutation_strategy: Box<dyn MutationStrategy>,
        config: EvolutionConfig,
    ) -> Self {
        Self {
            selection_strategy,
            crossover_strategy,
            mutation_strategy,
            config,
        }
    }

    /// デフォルトの遺伝的アルゴリズムを作成
    pub fn default() -> Self {
        use crate::evolution::*;

        Self::new(
            Box::new(TournamentSelection::new(2)),
            Box::new(UniformCrossover::new(0.5)),
            Box::new(GaussianMutation::new(0.1)),
            EvolutionConfig::default(),
        )
    }

    /// 進化を実行
    pub fn evolve(&mut self, world: &SimulationWorld) -> Result<EvolutionResult, EvolutionError> {
        if world.agents.is_empty() {
            return Err(EvolutionError::EmptyPopulation);
        }

        let start_time = std::time::Instant::now();

        // 1. 適応度評価
        let fitness_scores = self.evaluate_fitness(&world.agents);

        // 2. 選択
        let selected_agents = self.selection_strategy.select(
            &world.agents,
            &fitness_scores,
            self.config.selection_pressure,
        )?;

        // 3. エリート保存
        let elite_count = (world.agents.len() as f64 * self.config.elitism_rate) as usize;
        let mut elite_agents = self.select_elite(&world.agents, &fitness_scores, elite_count);

        // 4. 交叉と突然変異
        let mut new_generation = self.create_offspring(&selected_agents)?;

        // 5. 人口調整
        new_generation.append(&mut elite_agents);
        new_generation = self.regulate_population_size(new_generation)?;

        // 6. 多様性チェック
        let diversity_score = self.calculate_diversity(&new_generation);

        // 7. 適応的突然変異
        if self.config.adaptive_mutation {
            self.adapt_mutation_rate(diversity_score);
        }

        // 8. メトリクス計算
        let metrics = self.calculate_metrics(&world.agents, &new_generation, start_time.elapsed());

        // 9. 収束情報
        let convergence_info = self.analyze_convergence(&fitness_scores, diversity_score);

        Ok(EvolutionResult {
            new_generation,
            metrics,
            convergence_info,
        })
    }

    /// 適応度を評価
    fn evaluate_fitness(&self, agents: &[Agent]) -> Vec<f64> {
        agents.iter().map(|agent| agent.fitness()).collect()
    }

    /// エリートエージェントを選択
    fn select_elite(&self, agents: &[Agent], fitness_scores: &[f64], count: usize) -> Vec<Agent> {
        let mut indexed_fitness: Vec<(usize, f64)> = fitness_scores
            .iter()
            .enumerate()
            .map(|(i, &fitness)| (i, fitness))
            .collect();

        indexed_fitness.sort_by(|a, b| b.1.partial_cmp(&a.1).unwrap_or(std::cmp::Ordering::Equal));

        indexed_fitness
            .iter()
            .take(count)
            .map(|(i, _)| agents[*i].clone())
            .collect()
    }

    /// 子世代を作成
    fn create_offspring(
        &mut self,
        selected_agents: &[Agent],
    ) -> Result<Vec<Agent>, EvolutionError> {
        let mut offspring = Vec::new();
        let mut rng = rand::thread_rng();
        let mut agent_counter = 0u64;

        for i in (0..selected_agents.len()).step_by(2) {
            if i + 1 < selected_agents.len() {
                let parent1 = &selected_agents[i];
                let parent2 = &selected_agents[i + 1];

                // 交叉確率をチェック
                if rng.gen::<f64>() < self.config.crossover_rate {
                    let (child1_traits, child2_traits) = self
                        .crossover_strategy
                        .crossover(&parent1.traits, &parent2.traits)?;

                    // 突然変異
                    let mutated_traits1 = if rng.gen::<f64>() < self.config.mutation_rate {
                        self.mutation_strategy
                            .mutate(&child1_traits, self.config.mutation_strength)?
                    } else {
                        child1_traits
                    };

                    let mutated_traits2 = if rng.gen::<f64>() < self.config.mutation_rate {
                        self.mutation_strategy
                            .mutate(&child2_traits, self.config.mutation_strength)?
                    } else {
                        child2_traits
                    };

                    // 新しいエージェントを作成
                    let child1 = Agent::new(
                        AgentId(agent_counter),
                        parent1.position, // 初期位置は親から継承
                        mutated_traits1,
                    );
                    agent_counter += 1;

                    let child2 =
                        Agent::new(AgentId(agent_counter), parent2.position, mutated_traits2);
                    agent_counter += 1;

                    offspring.push(child1);
                    offspring.push(child2);
                } else {
                    // 交叉しない場合は親をそのままコピー
                    offspring.push(parent1.clone());
                    offspring.push(parent2.clone());
                }
            }
        }

        Ok(offspring)
    }

    /// 人口サイズを調整
    fn regulate_population_size(
        &self,
        mut population: Vec<Agent>,
    ) -> Result<Vec<Agent>, EvolutionError> {
        if population.len() > self.config.max_population_size {
            // 適応度に基づいてランダム選択
            let mut rng = rand::thread_rng();
            let fitness_scores: Vec<f64> = population.iter().map(|a| a.fitness()).collect();
            let total_fitness: f64 = fitness_scores.iter().sum();

            let mut new_population = Vec::new();

            for _ in 0..self.config.max_population_size {
                let r = rng.gen::<f64>() * total_fitness;
                let mut cumsum = 0.0;

                for (i, &fitness) in fitness_scores.iter().enumerate() {
                    cumsum += fitness;
                    if cumsum >= r {
                        new_population.push(population[i].clone());
                        break;
                    }
                }
            }

            population = new_population;
        } else if population.len() < self.config.min_population_size {
            // 人口が少なすぎる場合は複製で補う
            let deficit = self.config.min_population_size - population.len();
            let mut rng = rand::thread_rng();

            for _ in 0..deficit {
                let original = &population[rng.gen_range(0..population.len())];
                let mut clone = original.clone();
                clone.id = AgentId(rng.gen()); // 新しいIDを割り当て
                population.push(clone);
            }
        }

        Ok(population)
    }

    /// 遺伝的多様性を計算
    fn calculate_diversity(&self, agents: &[Agent]) -> f64 {
        if agents.len() < 2 {
            return 0.0;
        }

        let mut total_distance = 0.0;
        let mut comparisons = 0;

        for i in 0..agents.len() {
            for j in (i + 1)..agents.len() {
                let distance = self.calculate_trait_distance(&agents[i].traits, &agents[j].traits);
                total_distance += distance;
                comparisons += 1;
            }
        }

        if comparisons > 0 {
            total_distance / comparisons as f64
        } else {
            0.0
        }
    }

    /// 特性間の距離を計算
    fn calculate_trait_distance(&self, traits1: &AgentTraits, traits2: &AgentTraits) -> f64 {
        let d1 = (traits1.cooperation_rate - traits2.cooperation_rate).powi(2);
        let d2 = (traits1.movement_rate - traits2.movement_rate).powi(2);
        let d3 = (traits1.aggression_level - traits2.aggression_level).powi(2);
        let d4 = (traits1.learning_rate - traits2.learning_rate).powi(2);

        (d1 + d2 + d3 + d4).sqrt()
    }

    /// 適応的突然変異率を調整
    fn adapt_mutation_rate(&mut self, diversity_score: f64) {
        if diversity_score < self.config.diversity_threshold {
            // 多様性が低い場合は突然変異率を上げる
            self.config.mutation_rate = (self.config.mutation_rate * 1.5).min(0.5);
        } else if diversity_score > 0.8 {
            // 多様性が高い場合は突然変異率を下げる
            self.config.mutation_rate = (self.config.mutation_rate * 0.8).max(0.01);
        }
    }

    /// 進化メトリクスを計算
    fn calculate_metrics(
        &self,
        old_generation: &[Agent],
        new_generation: &[Agent],
        evolution_time: std::time::Duration,
    ) -> EvolutionMetrics {
        let old_fitness: Vec<f64> = old_generation.iter().map(|a| a.fitness()).collect();
        let new_fitness: Vec<f64> = new_generation.iter().map(|a| a.fitness()).collect();

        let old_avg_fitness = old_fitness.iter().sum::<f64>() / old_fitness.len() as f64;
        let new_avg_fitness = new_fitness.iter().sum::<f64>() / new_fitness.len() as f64;

        let old_max_fitness = old_fitness.iter().fold(f64::NEG_INFINITY, |a, &b| a.max(b));
        let new_max_fitness = new_fitness.iter().fold(f64::NEG_INFINITY, |a, &b| a.max(b));

        EvolutionMetrics {
            generation_time: evolution_time,
            fitness_improvement: new_avg_fitness - old_avg_fitness,
            max_fitness_improvement: new_max_fitness - old_max_fitness,
            diversity_score: self.calculate_diversity(new_generation),
            selection_intensity: self.config.selection_pressure,
            mutation_rate: self.config.mutation_rate,
            crossover_rate: self.config.crossover_rate,
            population_size: new_generation.len(),
        }
    }

    /// 収束分析
    fn analyze_convergence(&self, fitness_scores: &[f64], diversity_score: f64) -> ConvergenceInfo {
        let mean_fitness = fitness_scores.iter().sum::<f64>() / fitness_scores.len() as f64;
        let fitness_variance = fitness_scores
            .iter()
            .map(|&x| (x - mean_fitness).powi(2))
            .sum::<f64>()
            / fitness_scores.len() as f64;

        let is_converged =
            diversity_score < self.config.diversity_threshold && fitness_variance < 0.1;

        ConvergenceInfo {
            diversity_score,
            fitness_variance,
            is_converged,
            generations_to_convergence: None, // 外部で追跡
        }
    }
}

/// 進化エラー
#[derive(Debug, thiserror::Error)]
pub enum EvolutionError {
    #[error("人口が空です")]
    EmptyPopulation,

    #[error("選択エラー: {0}")]
    Selection(String),

    #[error("交叉エラー: {0}")]
    Crossover(String),

    #[error("突然変異エラー: {0}")]
    Mutation(String),

    #[error("設定エラー: {message}")]
    Configuration { message: String },

    #[error("計算エラー: {0}")]
    Computation(String),
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::core::{AgentTraits, Position, WorldDimensions};

    #[test]
    fn test_genetic_algorithm_creation() {
        let ga = GeneticAlgorithm::default();
        assert_eq!(ga.config.mutation_rate, 0.1);
        assert_eq!(ga.config.crossover_rate, 0.8);
    }

    #[test]
    fn test_evolution_with_small_population() {
        let mut ga = GeneticAlgorithm::default();
        let mut world = SimulationWorld::new(WorldDimensions::new(10, 10).unwrap());

        // テスト用エージェントを追加
        for i in 0..10 {
            let agent = Agent::new(
                AgentId(i),
                Position::new(i % 10, i / 10),
                AgentTraits {
                    cooperation_rate: 0.5,
                    movement_rate: 0.5,
                    aggression_level: 0.5,
                    learning_rate: 0.5,
                },
            );
            world.add_agent(agent);
        }

        let result = ga.evolve(&world).unwrap();
        assert_eq!(result.new_generation.len(), 10);
        assert!(result.metrics.generation_time.as_millis() >= 0);
    }

    #[test]
    fn test_diversity_calculation() {
        let ga = GeneticAlgorithm::default();

        // 同じ特性を持つエージェント（多様性なし）
        let agents1 = vec![
            Agent::new(
                AgentId(1),
                Position::new(0, 0),
                AgentTraits {
                    cooperation_rate: 0.5,
                    movement_rate: 0.5,
                    aggression_level: 0.5,
                    learning_rate: 0.5,
                },
            ),
            Agent::new(
                AgentId(2),
                Position::new(0, 0),
                AgentTraits {
                    cooperation_rate: 0.5,
                    movement_rate: 0.5,
                    aggression_level: 0.5,
                    learning_rate: 0.5,
                },
            ),
        ];

        let diversity1 = ga.calculate_diversity(&agents1);
        assert_eq!(diversity1, 0.0);

        // 異なる特性を持つエージェント（高い多様性）
        let agents2 = vec![
            Agent::new(
                AgentId(1),
                Position::new(0, 0),
                AgentTraits {
                    cooperation_rate: 0.0,
                    movement_rate: 0.0,
                    aggression_level: 0.0,
                    learning_rate: 0.0,
                },
            ),
            Agent::new(
                AgentId(2),
                Position::new(0, 0),
                AgentTraits {
                    cooperation_rate: 1.0,
                    movement_rate: 1.0,
                    aggression_level: 1.0,
                    learning_rate: 1.0,
                },
            ),
        ];

        let diversity2 = ga.calculate_diversity(&agents2);
        assert!(diversity2 > 0.0);
    }
}
