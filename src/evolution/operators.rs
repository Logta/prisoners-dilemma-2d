// ========================================
// Genetic Operators - 選択、交叉、突然変異の実装
// ========================================

use crate::core::{Agent, AgentTraits};
use crate::evolution::EvolutionError;
use rand::Rng;

// ========================================
// Selection Strategies
// ========================================

pub trait SelectionStrategy: Send + Sync {
    fn select(
        &self,
        agents: &[Agent],
        fitness_scores: &[f64],
        selection_pressure: f64,
    ) -> Result<Vec<Agent>, EvolutionError>;
}

/// トーナメント選択
pub struct TournamentSelection {
    tournament_size: usize,
}

impl TournamentSelection {
    pub fn new(tournament_size: usize) -> Self {
        Self { tournament_size }
    }
}

impl SelectionStrategy for TournamentSelection {
    fn select(
        &self,
        agents: &[Agent],
        fitness_scores: &[f64],
        _selection_pressure: f64,
    ) -> Result<Vec<Agent>, EvolutionError> {
        let mut rng = rand::thread_rng();
        let mut selected = Vec::new();

        for _ in 0..agents.len() {
            let mut best_index = 0;
            let mut best_fitness = f64::NEG_INFINITY;

            for _ in 0..self.tournament_size {
                let index = rng.gen_range(0..agents.len());
                if fitness_scores[index] > best_fitness {
                    best_fitness = fitness_scores[index];
                    best_index = index;
                }
            }

            selected.push(agents[best_index].clone());
        }

        Ok(selected)
    }
}

/// ルーレット選択
pub struct RouletteSelection;

impl SelectionStrategy for RouletteSelection {
    fn select(
        &self,
        agents: &[Agent],
        fitness_scores: &[f64],
        _selection_pressure: f64,
    ) -> Result<Vec<Agent>, EvolutionError> {
        let mut rng = rand::thread_rng();
        let mut selected = Vec::new();

        // 負の適応度を調整
        let min_fitness = fitness_scores.iter().fold(f64::INFINITY, |a, &b| a.min(b));
        let adjusted_fitness: Vec<f64> = if min_fitness < 0.0 {
            fitness_scores
                .iter()
                .map(|&f| f - min_fitness + 1.0)
                .collect()
        } else {
            fitness_scores.to_vec()
        };

        let total_fitness: f64 = adjusted_fitness.iter().sum();

        if total_fitness <= 0.0 {
            return Err(EvolutionError::Selection(
                "Total fitness is zero or negative".to_string(),
            ));
        }

        for _ in 0..agents.len() {
            let r = rng.gen::<f64>() * total_fitness;
            let mut cumsum = 0.0;

            for (i, &fitness) in adjusted_fitness.iter().enumerate() {
                cumsum += fitness;
                if cumsum >= r {
                    selected.push(agents[i].clone());
                    break;
                }
            }
        }

        Ok(selected)
    }
}

/// ランク選択
pub struct RankSelection {
    selective_pressure: f64,
}

impl RankSelection {
    pub fn new(selective_pressure: f64) -> Self {
        Self { selective_pressure }
    }
}

impl SelectionStrategy for RankSelection {
    fn select(
        &self,
        agents: &[Agent],
        fitness_scores: &[f64],
        _selection_pressure: f64,
    ) -> Result<Vec<Agent>, EvolutionError> {
        let mut rng = rand::thread_rng();
        let mut selected = Vec::new();

        // 適応度でソートしてランクを付ける
        let mut ranked_indices: Vec<usize> = (0..agents.len()).collect();
        ranked_indices.sort_by(|&a, &b| {
            fitness_scores[a]
                .partial_cmp(&fitness_scores[b])
                .unwrap_or(std::cmp::Ordering::Equal)
        });

        let n = agents.len() as f64;
        let mut rank_fitness = Vec::new();

        for (rank, _) in ranked_indices.iter().enumerate() {
            let r = rank as f64 + 1.0;
            let fitness = 2.0 - self.selective_pressure
                + 2.0 * (self.selective_pressure - 1.0) * (r - 1.0) / (n - 1.0);
            rank_fitness.push(fitness);
        }

        let total_rank_fitness: f64 = rank_fitness.iter().sum();

        for _ in 0..agents.len() {
            let r = rng.gen::<f64>() * total_rank_fitness;
            let mut cumsum = 0.0;

            for (i, &fitness) in rank_fitness.iter().enumerate() {
                cumsum += fitness;
                if cumsum >= r {
                    selected.push(agents[ranked_indices[i]].clone());
                    break;
                }
            }
        }

        Ok(selected)
    }
}

// ========================================
// Crossover Strategies
// ========================================

pub trait CrossoverStrategy: Send + Sync {
    fn crossover(
        &self,
        parent1: &AgentTraits,
        parent2: &AgentTraits,
    ) -> Result<(AgentTraits, AgentTraits), EvolutionError>;
}

/// 一点交叉
pub struct OnePointCrossover;

impl CrossoverStrategy for OnePointCrossover {
    fn crossover(
        &self,
        parent1: &AgentTraits,
        parent2: &AgentTraits,
    ) -> Result<(AgentTraits, AgentTraits), EvolutionError> {
        let mut rng = rand::thread_rng();
        let crossover_point = rng.gen_range(0..4); // 4つの特性

        let p1_traits = [
            parent1.cooperation_rate,
            parent1.movement_rate,
            parent1.aggression_level,
            parent1.learning_rate,
        ];

        let p2_traits = [
            parent2.cooperation_rate,
            parent2.movement_rate,
            parent2.aggression_level,
            parent2.learning_rate,
        ];

        let mut child1_traits = p1_traits;
        let mut child2_traits = p2_traits;

        // 交叉点以降を交換
        for i in crossover_point..4 {
            child1_traits[i] = p2_traits[i];
            child2_traits[i] = p1_traits[i];
        }

        let child1 = AgentTraits {
            cooperation_rate: child1_traits[0],
            movement_rate: child1_traits[1],
            aggression_level: child1_traits[2],
            learning_rate: child1_traits[3],
        };

        let child2 = AgentTraits {
            cooperation_rate: child2_traits[0],
            movement_rate: child2_traits[1],
            aggression_level: child2_traits[2],
            learning_rate: child2_traits[3],
        };

        Ok((child1, child2))
    }
}

/// 二点交叉
pub struct TwoPointCrossover;

impl CrossoverStrategy for TwoPointCrossover {
    fn crossover(
        &self,
        parent1: &AgentTraits,
        parent2: &AgentTraits,
    ) -> Result<(AgentTraits, AgentTraits), EvolutionError> {
        let mut rng = rand::thread_rng();
        let mut points = [rng.gen_range(0..4), rng.gen_range(0..4)];
        points.sort();

        let p1_traits = [
            parent1.cooperation_rate,
            parent1.movement_rate,
            parent1.aggression_level,
            parent1.learning_rate,
        ];

        let p2_traits = [
            parent2.cooperation_rate,
            parent2.movement_rate,
            parent2.aggression_level,
            parent2.learning_rate,
        ];

        let mut child1_traits = p1_traits;
        let mut child2_traits = p2_traits;

        // 二点間を交換
        for i in points[0]..points[1] {
            child1_traits[i] = p2_traits[i];
            child2_traits[i] = p1_traits[i];
        }

        let child1 = AgentTraits {
            cooperation_rate: child1_traits[0],
            movement_rate: child1_traits[1],
            aggression_level: child1_traits[2],
            learning_rate: child1_traits[3],
        };

        let child2 = AgentTraits {
            cooperation_rate: child2_traits[0],
            movement_rate: child2_traits[1],
            aggression_level: child2_traits[2],
            learning_rate: child2_traits[3],
        };

        Ok((child1, child2))
    }
}

/// 均等交叉
pub struct UniformCrossover {
    probability: f64,
}

impl UniformCrossover {
    pub fn new(probability: f64) -> Self {
        Self { probability }
    }
}

impl CrossoverStrategy for UniformCrossover {
    fn crossover(
        &self,
        parent1: &AgentTraits,
        parent2: &AgentTraits,
    ) -> Result<(AgentTraits, AgentTraits), EvolutionError> {
        let mut rng = rand::thread_rng();

        let p1_traits = [
            parent1.cooperation_rate,
            parent1.movement_rate,
            parent1.aggression_level,
            parent1.learning_rate,
        ];

        let p2_traits = [
            parent2.cooperation_rate,
            parent2.movement_rate,
            parent2.aggression_level,
            parent2.learning_rate,
        ];

        let mut child1_traits = [0.0; 4];
        let mut child2_traits = [0.0; 4];

        for i in 0..4 {
            if rng.gen::<f64>() < self.probability {
                child1_traits[i] = p2_traits[i];
                child2_traits[i] = p1_traits[i];
            } else {
                child1_traits[i] = p1_traits[i];
                child2_traits[i] = p2_traits[i];
            }
        }

        let child1 = AgentTraits {
            cooperation_rate: child1_traits[0],
            movement_rate: child1_traits[1],
            aggression_level: child1_traits[2],
            learning_rate: child1_traits[3],
        };

        let child2 = AgentTraits {
            cooperation_rate: child2_traits[0],
            movement_rate: child2_traits[1],
            aggression_level: child2_traits[2],
            learning_rate: child2_traits[3],
        };

        Ok((child1, child2))
    }
}

/// 算術交叉
pub struct ArithmeticCrossover {
    alpha: f64,
}

impl ArithmeticCrossover {
    pub fn new(alpha: f64) -> Self {
        Self { alpha }
    }
}

impl CrossoverStrategy for ArithmeticCrossover {
    fn crossover(
        &self,
        parent1: &AgentTraits,
        parent2: &AgentTraits,
    ) -> Result<(AgentTraits, AgentTraits), EvolutionError> {
        let child1 = AgentTraits {
            cooperation_rate: self.alpha * parent1.cooperation_rate
                + (1.0 - self.alpha) * parent2.cooperation_rate,
            movement_rate: self.alpha * parent1.movement_rate
                + (1.0 - self.alpha) * parent2.movement_rate,
            aggression_level: self.alpha * parent1.aggression_level
                + (1.0 - self.alpha) * parent2.aggression_level,
            learning_rate: self.alpha * parent1.learning_rate
                + (1.0 - self.alpha) * parent2.learning_rate,
        };

        let child2 = AgentTraits {
            cooperation_rate: (1.0 - self.alpha) * parent1.cooperation_rate
                + self.alpha * parent2.cooperation_rate,
            movement_rate: (1.0 - self.alpha) * parent1.movement_rate
                + self.alpha * parent2.movement_rate,
            aggression_level: (1.0 - self.alpha) * parent1.aggression_level
                + self.alpha * parent2.aggression_level,
            learning_rate: (1.0 - self.alpha) * parent1.learning_rate
                + self.alpha * parent2.learning_rate,
        };

        Ok((child1, child2))
    }
}

// ========================================
// Mutation Strategies
// ========================================

pub trait MutationStrategy: Send + Sync {
    fn mutate(
        &self,
        traits: &AgentTraits,
        mutation_strength: f64,
    ) -> Result<AgentTraits, EvolutionError>;
}

/// ガウシアン突然変異
pub struct GaussianMutation {
    std_dev: f64,
}

impl GaussianMutation {
    pub fn new(std_dev: f64) -> Self {
        Self { std_dev }
    }
}

impl MutationStrategy for GaussianMutation {
    fn mutate(
        &self,
        traits: &AgentTraits,
        mutation_strength: f64,
    ) -> Result<AgentTraits, EvolutionError> {
        use rand_distr::{Distribution, Normal};
        let mut rng = rand::thread_rng();
        let normal = Normal::new(0.0, self.std_dev * mutation_strength)
            .map_err(|e| EvolutionError::Mutation(e.to_string()))?;

        let mutated = AgentTraits {
            cooperation_rate: (traits.cooperation_rate + normal.sample(&mut rng)).clamp(0.0, 1.0),
            movement_rate: (traits.movement_rate + normal.sample(&mut rng)).clamp(0.0, 1.0),
            aggression_level: (traits.aggression_level + normal.sample(&mut rng)).clamp(0.0, 1.0),
            learning_rate: (traits.learning_rate + normal.sample(&mut rng)).clamp(0.0, 1.0),
        };

        Ok(mutated)
    }
}

/// 一様突然変異
pub struct UniformMutation {
    range: f64,
}

impl UniformMutation {
    pub fn new(range: f64) -> Self {
        Self { range }
    }
}

impl MutationStrategy for UniformMutation {
    fn mutate(
        &self,
        traits: &AgentTraits,
        mutation_strength: f64,
    ) -> Result<AgentTraits, EvolutionError> {
        let mut rng = rand::thread_rng();
        let delta = self.range * mutation_strength;

        let mutated = AgentTraits {
            cooperation_rate: (traits.cooperation_rate + rng.gen_range(-delta..delta))
                .clamp(0.0, 1.0),
            movement_rate: (traits.movement_rate + rng.gen_range(-delta..delta)).clamp(0.0, 1.0),
            aggression_level: (traits.aggression_level + rng.gen_range(-delta..delta))
                .clamp(0.0, 1.0),
            learning_rate: (traits.learning_rate + rng.gen_range(-delta..delta)).clamp(0.0, 1.0),
        };

        Ok(mutated)
    }
}

/// 多項式突然変異
pub struct PolynomialMutation {
    eta: f64,
}

impl PolynomialMutation {
    pub fn new(eta: f64) -> Self {
        Self { eta }
    }
}

impl MutationStrategy for PolynomialMutation {
    fn mutate(
        &self,
        traits: &AgentTraits,
        mutation_strength: f64,
    ) -> Result<AgentTraits, EvolutionError> {
        let mut rng = rand::thread_rng();

        let mutated = AgentTraits {
            cooperation_rate: self.polynomial_mutate(
                traits.cooperation_rate,
                mutation_strength,
                &mut rng,
            ),
            movement_rate: self.polynomial_mutate(
                traits.movement_rate,
                mutation_strength,
                &mut rng,
            ),
            aggression_level: self.polynomial_mutate(
                traits.aggression_level,
                mutation_strength,
                &mut rng,
            ),
            learning_rate: self.polynomial_mutate(
                traits.learning_rate,
                mutation_strength,
                &mut rng,
            ),
        };

        Ok(mutated)
    }
}

impl PolynomialMutation {
    fn polynomial_mutate(&self, value: f64, mutation_strength: f64, rng: &mut impl Rng) -> f64 {
        let u = rng.gen::<f64>();
        let delta = if u <= 0.5 {
            (2.0 * u).powf(1.0 / (self.eta + 1.0)) - 1.0
        } else {
            1.0 - (2.0 * (1.0 - u)).powf(1.0 / (self.eta + 1.0))
        };

        (value + delta * mutation_strength).clamp(0.0, 1.0)
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::core::{Agent, AgentId, Position};

    #[test]
    fn test_tournament_selection() {
        let selection = TournamentSelection::new(2);
        let agents = vec![
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
                    cooperation_rate: 0.3,
                    movement_rate: 0.3,
                    aggression_level: 0.3,
                    learning_rate: 0.3,
                },
            ),
        ];
        let fitness = vec![10.0, 5.0];

        let selected = selection.select(&agents, &fitness, 2.0).unwrap();
        assert_eq!(selected.len(), 2);
    }

    #[test]
    fn test_one_point_crossover() {
        let crossover = OnePointCrossover;
        let parent1 = AgentTraits {
            cooperation_rate: 1.0,
            movement_rate: 1.0,
            aggression_level: 1.0,
            learning_rate: 1.0,
        };
        let parent2 = AgentTraits {
            cooperation_rate: 0.0,
            movement_rate: 0.0,
            aggression_level: 0.0,
            learning_rate: 0.0,
        };

        let (child1, child2) = crossover.crossover(&parent1, &parent2).unwrap();

        // 子は親の特性の組み合わせを持つ
        assert!(child1.cooperation_rate == 1.0 || child1.cooperation_rate == 0.0);
        assert!(child2.cooperation_rate == 1.0 || child2.cooperation_rate == 0.0);
    }

    #[test]
    fn test_gaussian_mutation() {
        let mutation = GaussianMutation::new(0.1);
        let original = AgentTraits {
            cooperation_rate: 0.5,
            movement_rate: 0.5,
            aggression_level: 0.5,
            learning_rate: 0.5,
        };

        let mutated = mutation.mutate(&original, 0.1).unwrap();

        // 突然変異後も有効な範囲内
        assert!(mutated.cooperation_rate >= 0.0 && mutated.cooperation_rate <= 1.0);
        assert!(mutated.movement_rate >= 0.0 && mutated.movement_rate <= 1.0);
        assert!(mutated.aggression_level >= 0.0 && mutated.aggression_level <= 1.0);
        assert!(mutated.learning_rate >= 0.0 && mutated.learning_rate <= 1.0);
    }
}
