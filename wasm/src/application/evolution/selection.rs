use crate::domain::agent::{Agent, StrategyType};
use rand::RngExt;
use std::collections::HashMap;
use uuid::Uuid;

pub struct RouletteSelection;

impl RouletteSelection {
    pub fn select_parents(agents: &HashMap<Uuid, Agent>) -> Vec<Agent> {
        let mut rng = rand::rng();
        let mut selected = Vec::new();

        let agents_vec: Vec<&Agent> = agents.values().collect();
        if agents_vec.is_empty() {
            return selected;
        }

        let adjusted_scores = Self::adjusted_scores(&agents_vec);

        let total_score: i32 = adjusted_scores.iter().sum();

        if total_score <= 0 {
            for _ in 0..agents_vec.len() {
                let index = rng.random_range(0..agents_vec.len());
                selected.push(agents_vec[index].clone());
            }
            return selected;
        }

        for _ in 0..agents_vec.len() {
            let random_value = rng.random_range(1..=total_score);
            let selected_agent =
                Self::roulette_index(&adjusted_scores, random_value).map(|i| agents_vec[i].clone());

            // Fallback: if no agent was selected (shouldn't happen), select a random one
            if let Some(agent) = selected_agent {
                selected.push(agent);
            } else {
                let fallback_index = rng.random_range(0..agents_vec.len());
                selected.push(agents_vec[fallback_index].clone());
            }
        }

        selected
    }

    pub fn select_parents_with_penalty(
        agents: &HashMap<Uuid, Agent>,
        penalty_rate: f32,
    ) -> Vec<Agent> {
        let mut rng = rand::rng();
        let mut selected = Vec::new();

        let agents_vec: Vec<&Agent> = agents.values().collect();
        if agents_vec.is_empty() {
            return selected;
        }

        let adjusted_scores = Self::penalized_scores(&agents_vec, penalty_rate);

        let total_score: f32 = adjusted_scores.iter().sum();

        if total_score <= 0.0 {
            for _ in 0..agents_vec.len() {
                let index = rng.random_range(0..agents_vec.len());
                selected.push(agents_vec[index].clone());
            }
            return selected;
        }

        for _ in 0..agents_vec.len() {
            // (0, total_score] の値を引く。0.0 を引くと重み 0 の個体が選ばれうるため避ける。
            let random_value = total_score - rng.random_range(0.0..total_score);
            let selected_agent =
                Self::roulette_index(&adjusted_scores, random_value).map(|i| agents_vec[i].clone());

            // Fallback: if no agent was selected (shouldn't happen), select a random one
            if let Some(agent) = selected_agent {
                selected.push(agent);
            } else {
                let fallback_index = rng.random_range(0..agents_vec.len());
                selected.push(agents_vec[fallback_index].clone());
            }
        }

        selected
    }

    /// 最低スコアの個体が重み 1 になるよう平行移動したスコア（常に 1 以上）。
    fn adjusted_scores(agents: &[&Agent]) -> Vec<i32> {
        let min_score = agents.iter().map(|a| a.score).min().unwrap_or(0);
        agents.iter().map(|a| a.score - min_score + 1).collect()
    }

    /// `adjusted_scores` に、複雑な戦略（TitForTat / Pavlov）へのペナルティを掛けた重み。
    fn penalized_scores(agents: &[&Agent], penalty_rate: f32) -> Vec<f32> {
        let penalty_multiplier = 1.0 - penalty_rate;
        Self::adjusted_scores(agents)
            .into_iter()
            .zip(agents)
            .map(|(score, agent)| {
                let base_score = score as f32;
                match agent.strategy {
                    StrategyType::TitForTat | StrategyType::Pavlov => {
                        base_score * penalty_multiplier
                    }
                    _ => base_score,
                }
            })
            .collect()
    }

    /// ルーレット選択: 重みの累積和が `random_value` 以上になった最初のインデックスを返す。
    /// `random_value` は (0, 重みの総和] の範囲で渡すこと。
    fn roulette_index<S>(scores: &[S], mut random_value: S) -> Option<usize>
    where
        S: Copy + PartialOrd + Default + std::ops::SubAssign,
    {
        for (i, score) in scores.iter().enumerate() {
            random_value -= *score;
            if random_value <= S::default() {
                return Some(i);
            }
        }
        None
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::domain::agent::{MovementStrategy, Position};

    fn agent(strategy: StrategyType, score: i32) -> Agent {
        let mut a = Agent::new(
            Position::new(0, 0),
            strategy,
            0.5,
            MovementStrategy::Settler,
        );
        a.score = score;
        a
    }

    fn to_map(agents: Vec<Agent>) -> HashMap<Uuid, Agent> {
        agents.into_iter().map(|a| (a.id, a)).collect()
    }

    #[test]
    fn roulette_index_picks_first_index_whose_cumulative_weight_reaches_value() {
        let scores = [1, 3, 2];
        assert_eq!(RouletteSelection::roulette_index(&scores, 1), Some(0));
        assert_eq!(RouletteSelection::roulette_index(&scores, 2), Some(1));
        assert_eq!(RouletteSelection::roulette_index(&scores, 4), Some(1));
        assert_eq!(RouletteSelection::roulette_index(&scores, 5), Some(2));
        assert_eq!(RouletteSelection::roulette_index(&scores, 6), Some(2));
        assert_eq!(RouletteSelection::roulette_index(&scores, 7), None);

        let weights = [0.5_f32, 0.0, 1.5];
        assert_eq!(RouletteSelection::roulette_index(&weights, 0.25), Some(0));
        assert_eq!(RouletteSelection::roulette_index(&weights, 0.75), Some(2));
        assert_eq!(RouletteSelection::roulette_index(&weights, 2.5), None);
    }

    #[test]
    fn adjusted_scores_shift_minimum_to_one() {
        let agents = [
            agent(StrategyType::AllCooperate, -2),
            agent(StrategyType::AllCooperate, 0),
            agent(StrategyType::AllCooperate, 5),
        ];
        let refs: Vec<&Agent> = agents.iter().collect();
        assert_eq!(RouletteSelection::adjusted_scores(&refs), vec![1, 3, 8]);
    }

    #[test]
    fn penalized_scores_only_penalize_complex_strategies() {
        let agents = [
            agent(StrategyType::TitForTat, 3),
            agent(StrategyType::Pavlov, 3),
            agent(StrategyType::AllDefect, 3),
            agent(StrategyType::AllCooperate, 0),
        ];
        let refs: Vec<&Agent> = agents.iter().collect();
        assert_eq!(
            RouletteSelection::penalized_scores(&refs, 0.25),
            vec![3.0, 3.0, 4.0, 1.0]
        );
    }

    /// 1 体だけ極端に高得点な集団から選ぶと、ほぼその個体ばかりが選ばれる。
    fn assert_strongly_prefers_top(select: impl Fn(&HashMap<Uuid, Agent>) -> Vec<Agent>) {
        let top = agent(StrategyType::AllDefect, 1000);
        let top_id = top.id;
        let agents = to_map(vec![
            top,
            agent(StrategyType::AllDefect, 0),
            agent(StrategyType::AllDefect, 0),
            agent(StrategyType::AllDefect, 0),
        ]);

        let mut top_picks = 0;
        for _ in 0..50 {
            let selected = select(&agents);
            assert_eq!(selected.len(), agents.len());
            top_picks += selected.iter().filter(|a| a.id == top_id).count();
        }
        // 期待値はほぼ 200 回中 199 回。一様に選ぶと 50 回程度になる。
        assert!(top_picks > 180, "top was picked only {top_picks}/200 times");
    }

    #[test]
    fn select_parents_is_fitness_proportional() {
        assert_strongly_prefers_top(RouletteSelection::select_parents);
        assert!(RouletteSelection::select_parents(&HashMap::new()).is_empty());
    }

    #[test]
    fn select_parents_with_penalty_is_fitness_proportional() {
        assert_strongly_prefers_top(|agents| {
            RouletteSelection::select_parents_with_penalty(agents, 0.15)
        });
        assert!(RouletteSelection::select_parents_with_penalty(&HashMap::new(), 0.15).is_empty());
    }

    #[test]
    fn full_penalty_never_selects_complex_strategies() {
        let agents = to_map(vec![
            agent(StrategyType::TitForTat, 10),
            agent(StrategyType::Pavlov, 10),
            agent(StrategyType::AllDefect, 0),
        ]);
        for _ in 0..50 {
            let selected = RouletteSelection::select_parents_with_penalty(&agents, 1.0);
            assert!(
                selected
                    .iter()
                    .all(|a| a.strategy == StrategyType::AllDefect)
            );
        }
    }
}
