use crate::agent::Agent;
use rand::Rng;

#[derive(Clone, Debug)]
pub enum SelectionMethod {
    TopPercent(f64),     // 上位パーセント選択
    RouletteWheel,       // ルーレット選択
    Tournament(usize),   // トーナメント選択（サイズ）
}

pub fn select_agents(agents: &[Agent], method: &SelectionMethod, count: usize) -> Vec<Agent> {
    match method {
        SelectionMethod::TopPercent(percent) => {
            let mut sorted_agents = agents.to_vec();
            sorted_agents.sort_by(|a, b| b.score.partial_cmp(&a.score).unwrap());
            
            let selection_count = ((agents.len() as f64 * percent).ceil() as usize).min(count);
            sorted_agents.into_iter().take(selection_count).collect()
        },
        SelectionMethod::RouletteWheel => {
            let mut rng = rand::thread_rng();
            let mut selected = Vec::new();
            
            // 最低スコアを0に調整（負のスコアがある場合）
            let min_score = agents.iter().map(|a| a.score).fold(f64::INFINITY, f64::min);
            let adjusted_scores: Vec<f64> = agents.iter()
                .map(|a| a.score - min_score + 1.0) // +1.0で最低1.0を保証
                .collect();
            let total_score: f64 = adjusted_scores.iter().sum();
            
            for _ in 0..count {
                let mut random_value = rng.gen::<f64>() * total_score;
                for (i, &score) in adjusted_scores.iter().enumerate() {
                    random_value -= score;
                    if random_value <= 0.0 {
                        selected.push(agents[i].clone());
                        break;
                    }
                }
            }
            selected
        },
        SelectionMethod::Tournament(tournament_size) => {
            let mut rng = rand::thread_rng();
            let mut selected = Vec::new();
            
            for _ in 0..count {
                let mut tournament = Vec::new();
                for _ in 0..*tournament_size {
                    let index = rng.gen_range(0..agents.len());
                    tournament.push(&agents[index]);
                }
                
                let winner = tournament.iter()
                    .max_by(|a, b| a.score.partial_cmp(&b.score).unwrap())
                    .unwrap();
                selected.push((**winner).clone());
            }
            selected
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_top_percent_selection() {
        let mut agents = vec![
            Agent::new(0, 0, 0.5, 0.5), // スコア 0.0
            Agent::new(1, 1, 0.6, 0.4), // スコア 0.0
            Agent::new(2, 2, 0.7, 0.3), // スコア 0.0
            Agent::new(3, 3, 0.8, 0.2), // スコア 0.0
        ];
        
        // スコアを設定
        agents[0].update_score(10.0);
        agents[1].update_score(5.0);
        agents[2].update_score(15.0);
        agents[3].update_score(8.0);
        
        let selected = select_agents(&agents, &SelectionMethod::TopPercent(0.5), 2);
        assert_eq!(selected.len(), 2);
        
        // 最高スコア（15.0）と2番目（10.0）が選ばれているはず
        assert!(selected.iter().any(|a| a.score == 15.0));
        assert!(selected.iter().any(|a| a.score == 10.0));
    }

    #[test]
    fn test_tournament_selection() {
        let mut agents = vec![
            Agent::new(0, 0, 0.5, 0.5),
            Agent::new(1, 1, 0.6, 0.4),
            Agent::new(2, 2, 0.7, 0.3),
        ];
        
        agents[0].update_score(5.0);
        agents[1].update_score(10.0);
        agents[2].update_score(15.0);
        
        let selected = select_agents(&agents, &SelectionMethod::Tournament(2), 2);
        assert_eq!(selected.len(), 2);
        
        // 選択されたエージェントは元の集合に含まれているはず
        for agent in &selected {
            assert!(agents.iter().any(|a| a.score == agent.score));
        }
    }

    #[test]
    fn test_roulette_wheel_selection() {
        let mut agents = vec![
            Agent::new(0, 0, 0.5, 0.5),
            Agent::new(1, 1, 0.6, 0.4),
            Agent::new(2, 2, 0.7, 0.3),
        ];
        
        // 正のスコアを設定（ルーレット選択用）
        agents[0].update_score(1.0);
        agents[1].update_score(2.0);
        agents[2].update_score(3.0);
        
        let selected = select_agents(&agents, &SelectionMethod::RouletteWheel, 2);
        assert_eq!(selected.len(), 2);
        
        // 選択されたエージェントは元の集合に含まれているはず
        for agent in &selected {
            assert!(agents.iter().any(|a| a.score == agent.score));
        }
    }
}