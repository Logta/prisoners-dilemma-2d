use crate::domain::agent::{Agent, StrategyType};
use rand::Rng;
use std::collections::HashMap;
use uuid::Uuid;

pub struct RouletteSelection;

impl RouletteSelection {
    pub fn select_parents(agents: &HashMap<Uuid, Agent>) -> Vec<Agent> {
        let mut rng = rand::thread_rng();
        let mut selected = Vec::new();

        let agents_vec: Vec<&Agent> = agents.values().collect();
        if agents_vec.is_empty() {
            return selected;
        }

        let min_score = agents_vec.iter().map(|a| a.score).min().unwrap_or(0);
        let adjusted_scores: Vec<i32> =
            agents_vec.iter().map(|a| a.score - min_score + 1).collect();

        let total_score: i32 = adjusted_scores.iter().sum();

        if total_score <= 0 {
            for _ in 0..agents_vec.len() {
                let index = rng.gen_range(0..agents_vec.len());
                selected.push(agents_vec[index].clone());
            }
            return selected;
        }

        for _ in 0..agents_vec.len() {
            let mut random_value = rng.gen_range(1..=total_score);
            let mut selected_agent = None;

            for (i, score) in adjusted_scores.iter().enumerate() {
                random_value -= score;
                if random_value <= 0 {
                    selected_agent = Some(agents_vec[i].clone());
                    break;
                }
            }

            // Fallback: if no agent was selected (shouldn't happen), select a random one
            if let Some(agent) = selected_agent {
                selected.push(agent);
            } else {
                let fallback_index = rng.gen_range(0..agents_vec.len());
                selected.push(agents_vec[fallback_index].clone());
            }
        }

        selected
    }

    pub fn select_parents_with_penalty(
        agents: &HashMap<Uuid, Agent>,
        penalty_rate: f32,
    ) -> Vec<Agent> {
        let mut rng = rand::thread_rng();
        let mut selected = Vec::new();

        let agents_vec: Vec<&Agent> = agents.values().collect();
        if agents_vec.is_empty() {
            return selected;
        }

        let min_score = agents_vec.iter().map(|a| a.score).min().unwrap_or(0);

        // Apply penalty for complex strategies
        let penalty_multiplier = 1.0 - penalty_rate;
        let adjusted_scores: Vec<f32> = agents_vec
            .iter()
            .map(|a| {
                let base_score = (a.score - min_score + 1) as f32;
                match a.strategy {
                    StrategyType::TitForTat | StrategyType::Pavlov => {
                        base_score * penalty_multiplier
                    }
                    _ => base_score,
                }
            })
            .collect();

        let total_score: f32 = adjusted_scores.iter().sum();

        if total_score <= 0.0 {
            for _ in 0..agents_vec.len() {
                let index = rng.gen_range(0..agents_vec.len());
                selected.push(agents_vec[index].clone());
            }
            return selected;
        }

        for _ in 0..agents_vec.len() {
            let mut random_value = rng.gen_range(0.0..total_score);
            let mut selected_agent = None;

            for (i, score) in adjusted_scores.iter().enumerate() {
                random_value -= score;
                if random_value <= 0.0 {
                    selected_agent = Some(agents_vec[i].clone());
                    break;
                }
            }

            // Fallback: if no agent was selected (shouldn't happen), select a random one
            if let Some(agent) = selected_agent {
                selected.push(agent);
            } else {
                let fallback_index = rng.gen_range(0..agents_vec.len());
                selected.push(agents_vec[fallback_index].clone());
            }
        }

        selected
    }
}
