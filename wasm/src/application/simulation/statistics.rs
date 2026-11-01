use crate::domain::agent::{Agent, MovementStrategy, StrategyType};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SimulationStatistics {
    pub generation: u32,
    pub total_agents: usize,
    pub strategy_counts: HashMap<StrategyType, usize>,
    pub movement_strategy_counts: HashMap<MovementStrategy, usize>,
    pub average_cooperation_rate: f64,
    pub average_mobility: f64,
    pub average_score: f64,
}

impl Default for SimulationStatistics {
    fn default() -> Self {
        Self::new()
    }
}

impl SimulationStatistics {
    pub fn new() -> Self {
        Self {
            generation: 0,
            total_agents: 0,
            strategy_counts: HashMap::new(),
            movement_strategy_counts: HashMap::new(),
            average_cooperation_rate: 0.0,
            average_mobility: 0.0,
            average_score: 0.0,
        }
    }

    pub fn calculate(agents: &HashMap<uuid::Uuid, Agent>, generation: u32) -> Self {
        let total_agents = agents.len();

        if total_agents == 0 {
            return Self::new();
        }

        let mut strategy_counts = HashMap::new();
        let mut movement_strategy_counts = HashMap::new();
        let mut total_cooperation_rate = 0.0;
        let mut total_mobility = 0.0;
        let mut total_score = 0.0;

        for agent in agents.values() {
            *strategy_counts.entry(agent.strategy).or_insert(0) += 1;
            *movement_strategy_counts
                .entry(agent.movement_strategy)
                .or_insert(0) += 1;
            total_cooperation_rate += agent.cooperation_rate();
            total_mobility += agent.mobility;
            total_score += agent.score as f64;
        }

        Self {
            generation,
            total_agents,
            strategy_counts,
            movement_strategy_counts,
            average_cooperation_rate: total_cooperation_rate / total_agents as f64,
            average_mobility: total_mobility / total_agents as f64,
            average_score: total_score / total_agents as f64,
        }
    }

    pub fn get_strategy_percentage(&self, strategy: StrategyType) -> f64 {
        if self.total_agents == 0 {
            0.0
        } else {
            let count = self.strategy_counts.get(&strategy).unwrap_or(&0);
            *count as f64 / self.total_agents as f64 * 100.0
        }
    }

    pub fn get_movement_strategy_percentage(&self, movement_strategy: MovementStrategy) -> f64 {
        if self.total_agents == 0 {
            0.0
        } else {
            let count = self
                .movement_strategy_counts
                .get(&movement_strategy)
                .unwrap_or(&0);
            *count as f64 / self.total_agents as f64 * 100.0
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::domain::agent::{Agent, Position, StrategyType};

    #[test]
    fn calculate_counts_every_movement_strategy_variant_without_loss() {
        // 回帰テスト: movement_strategy_counts が HashMap<String, _> だった頃は、
        // Display文字列とキー文字列がズレると該当戦略の集計が黙って0になりうった。
        // 型安全なMovementStrategyキーに変えたことで、全バリアントが確実に集計されることを確認する。
        let agents: HashMap<uuid::Uuid, Agent> = MovementStrategy::ALL
            .iter()
            .map(|&movement_strategy| {
                let agent = Agent::new(
                    Position::new(0, 0),
                    StrategyType::AllCooperate,
                    0.5,
                    movement_strategy,
                );
                (agent.id, agent)
            })
            .collect();

        let stats = SimulationStatistics::calculate(&agents, 0);

        for movement_strategy in MovementStrategy::ALL {
            assert_eq!(
                stats.movement_strategy_counts.get(&movement_strategy),
                Some(&1),
                "{movement_strategy} の集計が失われている"
            );
            assert!(
                stats.get_movement_strategy_percentage(movement_strategy) > 0.0,
                "{movement_strategy} のパーセンテージが0になっている"
            );
        }
    }

    #[test]
    fn calculate_returns_empty_stats_for_no_agents() {
        let agents: HashMap<uuid::Uuid, Agent> = HashMap::new();

        let stats = SimulationStatistics::calculate(&agents, 5);

        assert_eq!(stats.total_agents, 0);
        assert!(stats.movement_strategy_counts.is_empty());
        assert!(stats.strategy_counts.is_empty());
    }

    fn agent_with(
        strategy: StrategyType,
        movement: MovementStrategy,
        mobility: f64,
        score: i32,
        action: crate::domain::agent::Action,
    ) -> Agent {
        let mut agent = Agent::new(Position::new(0, 0), strategy, mobility, movement);
        agent.add_game_result(uuid::Uuid::new_v4(), action, action, score);
        agent
    }

    #[test]
    fn calculate_aggregates_counts_and_averages() {
        use crate::domain::agent::Action;
        let agents: HashMap<uuid::Uuid, Agent> = [
            agent_with(
                StrategyType::AllCooperate,
                MovementStrategy::Explorer,
                0.2,
                3,
                Action::Cooperate,
            ),
            agent_with(
                StrategyType::AllCooperate,
                MovementStrategy::Explorer,
                0.6,
                5,
                Action::Defect,
            ),
        ]
        .into_iter()
        .map(|a| (a.id, a))
        .collect();

        let stats = SimulationStatistics::calculate(&agents, 7);

        assert_eq!(stats.generation, 7);
        assert_eq!(stats.total_agents, 2);
        assert_eq!(
            stats.strategy_counts.get(&StrategyType::AllCooperate),
            Some(&2)
        );
        assert_eq!(
            stats
                .movement_strategy_counts
                .get(&MovementStrategy::Explorer),
            Some(&2)
        );
        assert!((stats.average_cooperation_rate - 0.5).abs() < 1e-9);
        assert!((stats.average_mobility - 0.4).abs() < 1e-9);
        assert!((stats.average_score - 4.0).abs() < 1e-9);
    }

    #[test]
    fn percentages_are_share_of_total_in_percent() {
        use crate::domain::agent::Action;
        let agents: HashMap<uuid::Uuid, Agent> = [
            (StrategyType::AllDefect, MovementStrategy::Social),
            (StrategyType::AllCooperate, MovementStrategy::Explorer),
            (StrategyType::AllCooperate, MovementStrategy::Explorer),
            (StrategyType::AllCooperate, MovementStrategy::Explorer),
        ]
        .into_iter()
        .map(|(s, m)| agent_with(s, m, 0.5, 1, Action::Cooperate))
        .map(|a| (a.id, a))
        .collect();

        let stats = SimulationStatistics::calculate(&agents, 0);
        assert!((stats.get_strategy_percentage(StrategyType::AllDefect) - 25.0).abs() < 1e-9);
        assert!((stats.get_strategy_percentage(StrategyType::Pavlov)).abs() < 1e-9);
        assert!(
            (stats.get_movement_strategy_percentage(MovementStrategy::Social) - 25.0).abs() < 1e-9
        );

        let empty = SimulationStatistics::new();
        assert_eq!(empty.get_strategy_percentage(StrategyType::AllDefect), 0.0);
        assert_eq!(
            empty.get_movement_strategy_percentage(MovementStrategy::Social),
            0.0
        );
    }
}
