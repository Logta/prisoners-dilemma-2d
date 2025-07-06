// ========================================
// Evolution Strategy Factory - 進化戦略ファクトリ
// ========================================

use super::types::{EvolutionStrategy, EvolutionStrategyType};
use super::{
    ClassicEvolution, ElitistEvolution, SteadyStateEvolution, 
    IslandModelEvolution, AdaptiveEvolution, MultiObjectiveEvolution
};
use crate::evolution::EvolutionConfig;

/// 進化戦略ファクトリ
pub struct EvolutionStrategyFactory;

impl EvolutionStrategyFactory {
    /// 戦略タイプに基づいて遺伝的アルゴリズムを作成
    pub fn create_strategy(
        strategy_type: EvolutionStrategyType,
        custom_config: Option<EvolutionConfig>,
    ) -> Box<dyn EvolutionStrategy> {
        match strategy_type {
            EvolutionStrategyType::Classic => Box::new(ClassicEvolution::new(custom_config)),
            EvolutionStrategyType::Elitist => Box::new(ElitistEvolution::new(custom_config)),
            EvolutionStrategyType::SteadyState => {
                Box::new(SteadyStateEvolution::new(custom_config))
            }
            EvolutionStrategyType::IslandModel => {
                Box::new(IslandModelEvolution::new(custom_config))
            }
            EvolutionStrategyType::Adaptive => Box::new(AdaptiveEvolution::new(custom_config)),
            EvolutionStrategyType::MultiObjective => {
                Box::new(MultiObjectiveEvolution::new(custom_config))
            }
        }
    }

    /// 設定に基づいて最適な戦略を推奨
    pub fn recommend_strategy(
        population_size: usize,
        problem_complexity: f64,
        convergence_speed_priority: bool,
    ) -> EvolutionStrategyType {
        match (
            population_size,
            problem_complexity,
            convergence_speed_priority,
        ) {
            (size, _, true) if size < 100 => EvolutionStrategyType::Elitist,
            (size, complexity, false) if size > 500 && complexity > 0.7 => {
                EvolutionStrategyType::IslandModel
            }
            (_, complexity, _) if complexity > 0.8 => EvolutionStrategyType::Adaptive,
            (size, _, _) if size > 200 => EvolutionStrategyType::SteadyState,
            _ => EvolutionStrategyType::Classic,
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_strategy_factory() {
        let strategy =
            EvolutionStrategyFactory::create_strategy(EvolutionStrategyType::Classic, None);

        // 基本的な作成テスト
        assert!(strategy.get_config().mutation_rate > 0.0);
    }

    #[test]
    fn test_strategy_recommendation() {
        let rec1 = EvolutionStrategyFactory::recommend_strategy(50, 0.5, true);
        assert_eq!(rec1, EvolutionStrategyType::Elitist);

        let rec2 = EvolutionStrategyFactory::recommend_strategy(1000, 0.9, false);
        assert_eq!(rec2, EvolutionStrategyType::IslandModel);
    }
}