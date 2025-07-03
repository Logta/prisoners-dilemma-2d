use crate::agent::Agent;
use rand::Rng;

#[derive(Clone, Debug)]
pub enum SelectionMethod {
    TopPercent(f64),     // 上位パーセント選択
    RouletteWheel,       // ルーレット選択
    Tournament(usize),   // トーナメント選択（サイズ）
}

#[derive(Clone, Debug)]
pub enum CrossoverMethod {
    OnePoint,     // 一点交叉
    TwoPoint,     // 二点交叉
    Uniform(f64), // 一様交叉（交叉確率）
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

pub fn replace_generation(
    current_generation: &[Agent],
    selection_method: &SelectionMethod,
    crossover_method: &CrossoverMethod,
    mutation_rate: f64,
    mutation_strength: f64,
) -> Vec<Agent> {
    let population_size = current_generation.len();
    let mut new_generation = Vec::with_capacity(population_size);
    
    // 選択する親の数（偶数にする）
    let parent_count = if population_size % 2 == 0 { population_size } else { population_size + 1 };
    let parents = select_agents(current_generation, selection_method, parent_count);
    
    // 交叉と突然変異を繰り返して新世代を生成
    let mut i = 0;
    while new_generation.len() < population_size {
        let parent1 = &parents[i % parents.len()];
        let parent2 = &parents[(i + 1) % parents.len()];
        
        let (mut child1, mut child2) = crossover(parent1, parent2, crossover_method);
        
        // 突然変異を適用
        child1 = mutate(&child1, mutation_rate, mutation_strength);
        child2 = mutate(&child2, mutation_rate, mutation_strength);
        
        new_generation.push(child1);
        if new_generation.len() < population_size {
            new_generation.push(child2);
        }
        
        i += 2;
    }
    
    new_generation
}

pub fn mutate(agent: &Agent, mutation_rate: f64, mutation_strength: f64) -> Agent {
    let mut rng = rand::thread_rng();
    let mut mutated = agent.clone();
    
    // 協力確率の突然変異
    if rng.gen::<f64>() < mutation_rate {
        let change = (rng.gen::<f64>() - 0.5) * 2.0 * mutation_strength;
        mutated.cooperation_rate = (mutated.cooperation_rate + change).clamp(0.0, 1.0);
    }
    
    // 移動確率の突然変異
    if rng.gen::<f64>() < mutation_rate {
        let change = (rng.gen::<f64>() - 0.5) * 2.0 * mutation_strength;
        mutated.movement_rate = (mutated.movement_rate + change).clamp(0.0, 1.0);
    }
    
    mutated
}

pub fn crossover(parent1: &Agent, parent2: &Agent, method: &CrossoverMethod) -> (Agent, Agent) {
    let mut rng = rand::thread_rng();
    
    match method {
        CrossoverMethod::OnePoint => {
            // 一点交叉：遺伝子を2つの特性とみなし、ランダムな点で分割
            if rng.gen::<bool>() {
                // 協力確率で分割
                (
                    Agent::new(0, 0, parent1.cooperation_rate, parent2.movement_rate),
                    Agent::new(0, 0, parent2.cooperation_rate, parent1.movement_rate),
                )
            } else {
                // 移動確率で分割
                (
                    Agent::new(0, 0, parent2.cooperation_rate, parent1.movement_rate),
                    Agent::new(0, 0, parent1.cooperation_rate, parent2.movement_rate),
                )
            }
        },
        CrossoverMethod::TwoPoint => {
            // 二点交叉：2つの特性を持つので実質的に一様交叉と同じ動作
            if rng.gen::<bool>() {
                (
                    Agent::new(0, 0, parent1.cooperation_rate, parent1.movement_rate),
                    Agent::new(0, 0, parent2.cooperation_rate, parent2.movement_rate),
                )
            } else {
                (
                    Agent::new(0, 0, parent2.cooperation_rate, parent2.movement_rate),
                    Agent::new(0, 0, parent1.cooperation_rate, parent1.movement_rate),
                )
            }
        },
        CrossoverMethod::Uniform(prob) => {
            // 一様交叉：各遺伝子を確率的に選択
            let coop_rate1 = if rng.gen::<f64>() < *prob { 
                parent1.cooperation_rate 
            } else { 
                parent2.cooperation_rate 
            };
            let coop_rate2 = if rng.gen::<f64>() < *prob { 
                parent2.cooperation_rate 
            } else { 
                parent1.cooperation_rate 
            };
            
            let move_rate1 = if rng.gen::<f64>() < *prob { 
                parent1.movement_rate 
            } else { 
                parent2.movement_rate 
            };
            let move_rate2 = if rng.gen::<f64>() < *prob { 
                parent2.movement_rate 
            } else { 
                parent1.movement_rate 
            };
            
            (
                Agent::new(0, 0, coop_rate1, move_rate1),
                Agent::new(0, 0, coop_rate2, move_rate2),
            )
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

    #[test]
    fn test_one_point_crossover() {
        let parent1 = Agent::new(0, 0, 0.8, 0.2);
        let parent2 = Agent::new(1, 1, 0.3, 0.7);
        
        let (child1, child2) = crossover(&parent1, &parent2, &CrossoverMethod::OnePoint);
        
        // 子は親の特性を継承している
        assert!(child1.cooperation_rate == parent1.cooperation_rate || child1.cooperation_rate == parent2.cooperation_rate);
        assert!(child1.movement_rate == parent1.movement_rate || child1.movement_rate == parent2.movement_rate);
        assert!(child2.cooperation_rate == parent1.cooperation_rate || child2.cooperation_rate == parent2.cooperation_rate);
        assert!(child2.movement_rate == parent1.movement_rate || child2.movement_rate == parent2.movement_rate);
    }

    #[test]
    fn test_two_point_crossover() {
        let parent1 = Agent::new(0, 0, 0.9, 0.1);
        let parent2 = Agent::new(1, 1, 0.2, 0.8);
        
        let (child1, child2) = crossover(&parent1, &parent2, &CrossoverMethod::TwoPoint);
        
        // 子は親の特性を継承している
        assert!(child1.cooperation_rate == parent1.cooperation_rate || child1.cooperation_rate == parent2.cooperation_rate);
        assert!(child1.movement_rate == parent1.movement_rate || child1.movement_rate == parent2.movement_rate);
        assert!(child2.cooperation_rate == parent1.cooperation_rate || child2.cooperation_rate == parent2.cooperation_rate);
        assert!(child2.movement_rate == parent1.movement_rate || child2.movement_rate == parent2.movement_rate);
    }

    #[test]
    fn test_uniform_crossover() {
        let parent1 = Agent::new(0, 0, 0.7, 0.3);
        let parent2 = Agent::new(1, 1, 0.4, 0.6);
        
        let (child1, child2) = crossover(&parent1, &parent2, &CrossoverMethod::Uniform(0.5));
        
        // 子は親の特性を継承している
        assert!(child1.cooperation_rate == parent1.cooperation_rate || child1.cooperation_rate == parent2.cooperation_rate);
        assert!(child1.movement_rate == parent1.movement_rate || child1.movement_rate == parent2.movement_rate);
        assert!(child2.cooperation_rate == parent1.cooperation_rate || child2.cooperation_rate == parent2.cooperation_rate);
        assert!(child2.movement_rate == parent1.movement_rate || child2.movement_rate == parent2.movement_rate);
    }

    #[test]
    fn test_mutate_agent() {
        let original = Agent::new(0, 0, 0.5, 0.5);
        let mutated = mutate(&original, 1.0, 0.1); // 100%突然変異確率、0.1の変異幅
        
        // 突然変異により値が変更されている
        assert_ne!(mutated.cooperation_rate, original.cooperation_rate);
        assert_ne!(mutated.movement_rate, original.movement_rate);
        
        // 値は0.0〜1.0の範囲内
        assert!(mutated.cooperation_rate >= 0.0 && mutated.cooperation_rate <= 1.0);
        assert!(mutated.movement_rate >= 0.0 && mutated.movement_rate <= 1.0);
    }

    #[test]
    fn test_mutate_no_mutation() {
        let original = Agent::new(0, 0, 0.5, 0.5);
        let not_mutated = mutate(&original, 0.0, 0.1); // 0%突然変異確率
        
        // 突然変異が起こらない
        assert_eq!(not_mutated.cooperation_rate, original.cooperation_rate);
        assert_eq!(not_mutated.movement_rate, original.movement_rate);
    }

    #[test]
    fn test_mutate_boundary_values() {
        // 最大値での突然変異テスト
        let max_agent = Agent::new(0, 0, 1.0, 1.0);
        let mutated_max = mutate(&max_agent, 1.0, 0.1);
        assert!(mutated_max.cooperation_rate <= 1.0);
        assert!(mutated_max.movement_rate <= 1.0);
        
        // 最小値での突然変異テスト
        let min_agent = Agent::new(0, 0, 0.0, 0.0);
        let mutated_min = mutate(&min_agent, 1.0, 0.1);
        assert!(mutated_min.cooperation_rate >= 0.0);
        assert!(mutated_min.movement_rate >= 0.0);
    }

    #[test]
    fn test_replace_generation() {
        // 現在の世代（スコア付き）
        let mut current_generation = vec![
            Agent::new(0, 0, 0.5, 0.5),
            Agent::new(1, 1, 0.6, 0.4),
            Agent::new(2, 2, 0.7, 0.3),
            Agent::new(3, 3, 0.8, 0.2),
        ];
        current_generation[0].update_score(10.0);
        current_generation[1].update_score(5.0);
        current_generation[2].update_score(15.0);
        current_generation[3].update_score(8.0);

        let new_generation = replace_generation(
            &current_generation,
            &SelectionMethod::TopPercent(0.5),
            &CrossoverMethod::OnePoint,
            0.1, // 突然変異確率
            0.05 // 突然変異強度
        );

        // 新世代のサイズは元の世代と同じ
        assert_eq!(new_generation.len(), current_generation.len());
        
        // 新世代のエージェントは位置がリセットされている
        for agent in &new_generation {
            assert_eq!(agent.x, 0);
            assert_eq!(agent.y, 0);
            assert_eq!(agent.score, 0.0);
        }
        
        // 特性は0.0〜1.0の範囲内
        for agent in &new_generation {
            assert!(agent.cooperation_rate >= 0.0 && agent.cooperation_rate <= 1.0);
            assert!(agent.movement_rate >= 0.0 && agent.movement_rate <= 1.0);
        }
    }

    #[test]
    fn test_replace_generation_preserves_good_traits() {
        // 極端な例：高協力・低移動のエージェントが高スコア
        let mut current_generation = vec![
            Agent::new(0, 0, 0.9, 0.1), // 高協力・低移動
            Agent::new(1, 1, 0.1, 0.9), // 低協力・高移動
        ];
        current_generation[0].update_score(100.0); // 高スコア
        current_generation[1].update_score(1.0);   // 低スコア

        let new_generation = replace_generation(
            &current_generation,
            &SelectionMethod::TopPercent(1.0), // 全選択
            &CrossoverMethod::OnePoint,
            0.0, // 突然変異なし
            0.0
        );

        // 新世代は元の世代数と同じ
        assert_eq!(new_generation.len(), 2);
        
        // 高スコアエージェントの特性が継承されているかチェック
        // 突然変異がないので、親の特性がそのまま受け継がれる
        let has_high_coop = new_generation.iter().any(|a| a.cooperation_rate == 0.9);
        let has_low_move = new_generation.iter().any(|a| a.movement_rate == 0.1);
        assert!(has_high_coop);
        assert!(has_low_move);
    }
}