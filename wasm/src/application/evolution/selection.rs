use crate::domain::agent::Agent;
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
        let adjusted_scores: Vec<i32> = agents_vec
            .iter()
            .map(|a| a.score - min_score + 1)
            .collect();
        
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
            
            for (i, score) in adjusted_scores.iter().enumerate() {
                random_value -= score;
                if random_value <= 0 {
                    selected.push(agents_vec[i].clone());
                    break;
                }
            }
        }
        
        selected
    }
}