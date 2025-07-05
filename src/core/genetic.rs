// ========================================
// Genetic Algorithm Module - 遺伝的アルゴリズム
// ========================================

use crate::core::entities::{Agent, AgentId, AgentTraits};
use crate::core::value_objects::Position;
use rand::Rng;
use rand_distr::{Distribution, Normal};

#[derive(Clone, Debug)]
pub enum SelectionMethod {
    TopPercent(f64),   // 上位パーセント選択
    RouletteWheel,     // ルーレット選択
    Tournament(usize), // トーナメント選択（サイズ）
}

#[derive(Clone, Debug)]
pub enum CrossoverMethod {
    OnePoint,     // 一点交叉
    TwoPoint,     // 二点交叉
    Uniform(f64), // 一様交叉（交叉確率）
}

/// エージェントの選択
pub fn select_agents(agents: &[Agent], method: &SelectionMethod, count: usize) -> Vec<Agent> {
    match method {
        SelectionMethod::TopPercent(percent) => {
            let mut sorted_agents = agents.to_vec();
            sorted_agents.sort_by(|a, b| b.fitness().partial_cmp(&a.fitness()).unwrap());

            let selection_count = ((agents.len() as f64 * percent).ceil() as usize).min(count);
            sorted_agents.into_iter().take(selection_count).collect()
        }
        SelectionMethod::RouletteWheel => {
            let mut rng = rand::thread_rng();
            let mut selected = Vec::new();

            // 最低適応度を0に調整（負の適応度がある場合）
            let min_fitness = agents.iter().map(|a| a.fitness()).fold(f64::INFINITY, f64::min);
            let adjusted_fitness: Vec<f64> = agents
                .iter()
                .map(|a| a.fitness() - min_fitness + 1.0) // +1.0で最低1.0を保証
                .collect();
            let total_fitness: f64 = adjusted_fitness.iter().sum();

            for _ in 0..count {
                let mut random_value = rng.gen::<f64>() * total_fitness;
                for (i, &fitness) in adjusted_fitness.iter().enumerate() {
                    random_value -= fitness;
                    if random_value <= 0.0 {
                        selected.push(agents[i].clone());
                        break;
                    }
                }
            }
            selected
        }
        SelectionMethod::Tournament(size) => {
            let mut rng = rand::thread_rng();
            let mut selected = Vec::new();

            for _ in 0..count {
                let mut tournament = Vec::new();
                for _ in 0..*size {
                    let idx = rng.gen_range(0..agents.len());
                    tournament.push(&agents[idx]);
                }
                
                let winner = tournament
                    .into_iter()
                    .max_by(|a, b| a.fitness().partial_cmp(&b.fitness()).unwrap())
                    .unwrap();
                
                selected.push(winner.clone());
            }
            selected
        }
    }
}

/// 交叉
pub fn crossover(
    parent1: &Agent,
    parent2: &Agent,
    method: &CrossoverMethod,
) -> (Agent, Agent) {
    let mut rng = rand::thread_rng();
    
    let (child1_traits, child2_traits) = match method {
        CrossoverMethod::OnePoint => {
            let traits1 = &parent1.traits;
            let traits2 = &parent2.traits;
            
            if rng.gen_bool(0.5) {
                (
                    AgentTraits {
                        cooperation_rate: traits1.cooperation_rate,
                        movement_rate: traits2.movement_rate,
                        aggression_level: traits1.aggression_level,
                        learning_rate: traits2.learning_rate,
                    },
                    AgentTraits {
                        cooperation_rate: traits2.cooperation_rate,
                        movement_rate: traits1.movement_rate,
                        aggression_level: traits2.aggression_level,
                        learning_rate: traits1.learning_rate,
                    }
                )
            } else {
                (
                    AgentTraits {
                        cooperation_rate: traits1.cooperation_rate,
                        movement_rate: traits1.movement_rate,
                        aggression_level: traits2.aggression_level,
                        learning_rate: traits2.learning_rate,
                    },
                    AgentTraits {
                        cooperation_rate: traits2.cooperation_rate,
                        movement_rate: traits2.movement_rate,
                        aggression_level: traits1.aggression_level,
                        learning_rate: traits1.learning_rate,
                    }
                )
            }
        }
        CrossoverMethod::TwoPoint => {
            let traits1 = &parent1.traits;
            let traits2 = &parent2.traits;
            
            let point = rng.gen_range(0..4);
            
            match point {
                0 => (
                    AgentTraits {
                        cooperation_rate: traits2.cooperation_rate,
                        movement_rate: traits2.movement_rate,
                        aggression_level: traits1.aggression_level,
                        learning_rate: traits1.learning_rate,
                    },
                    AgentTraits {
                        cooperation_rate: traits1.cooperation_rate,
                        movement_rate: traits1.movement_rate,
                        aggression_level: traits2.aggression_level,
                        learning_rate: traits2.learning_rate,
                    }
                ),
                1 => (
                    AgentTraits {
                        cooperation_rate: traits1.cooperation_rate,
                        movement_rate: traits2.movement_rate,
                        aggression_level: traits2.aggression_level,
                        learning_rate: traits1.learning_rate,
                    },
                    AgentTraits {
                        cooperation_rate: traits2.cooperation_rate,
                        movement_rate: traits1.movement_rate,
                        aggression_level: traits1.aggression_level,
                        learning_rate: traits2.learning_rate,
                    }
                ),
                2 => (
                    AgentTraits {
                        cooperation_rate: traits1.cooperation_rate,
                        movement_rate: traits1.movement_rate,
                        aggression_level: traits2.aggression_level,
                        learning_rate: traits2.learning_rate,
                    },
                    AgentTraits {
                        cooperation_rate: traits2.cooperation_rate,
                        movement_rate: traits2.movement_rate,
                        aggression_level: traits1.aggression_level,
                        learning_rate: traits1.learning_rate,
                    }
                ),
                _ => (traits1.clone(), traits2.clone()),
            }
        }
        CrossoverMethod::Uniform(prob) => {
            let traits1 = &parent1.traits;
            let traits2 = &parent2.traits;
            
            (
                AgentTraits {
                    cooperation_rate: if rng.gen_bool(*prob) { traits1.cooperation_rate } else { traits2.cooperation_rate },
                    movement_rate: if rng.gen_bool(*prob) { traits1.movement_rate } else { traits2.movement_rate },
                    aggression_level: if rng.gen_bool(*prob) { traits1.aggression_level } else { traits2.aggression_level },
                    learning_rate: if rng.gen_bool(*prob) { traits1.learning_rate } else { traits2.learning_rate },
                },
                AgentTraits {
                    cooperation_rate: if rng.gen_bool(*prob) { traits2.cooperation_rate } else { traits1.cooperation_rate },
                    movement_rate: if rng.gen_bool(*prob) { traits2.movement_rate } else { traits1.movement_rate },
                    aggression_level: if rng.gen_bool(*prob) { traits2.aggression_level } else { traits1.aggression_level },
                    learning_rate: if rng.gen_bool(*prob) { traits2.learning_rate } else { traits1.learning_rate },
                }
            )
        }
    };
    
    // 新しいIDを生成
    let child1_id = AgentId(rng.gen());
    let child2_id = AgentId(rng.gen());
    
    // 子エージェントを作成
    let child1 = Agent::new(child1_id, parent1.position, child1_traits);
    let child2 = Agent::new(child2_id, parent2.position, child2_traits);
    
    (child1, child2)
}

/// 突然変異
pub fn mutate(agent: &mut Agent, mutation_rate: f64, mutation_strength: f64) {
    let mut rng = rand::thread_rng();
    let normal = Normal::new(0.0, mutation_strength).unwrap();
    
    if rng.gen_bool(mutation_rate) {
        let delta = normal.sample(&mut rng);
        agent.traits.cooperation_rate = (agent.traits.cooperation_rate + delta).clamp(0.0, 1.0);
    }
    
    if rng.gen_bool(mutation_rate) {
        let delta = normal.sample(&mut rng);
        agent.traits.movement_rate = (agent.traits.movement_rate + delta).clamp(0.0, 1.0);
    }
    
    if rng.gen_bool(mutation_rate) {
        let delta = normal.sample(&mut rng);
        agent.traits.aggression_level = (agent.traits.aggression_level + delta).clamp(0.0, 1.0);
    }
    
    if rng.gen_bool(mutation_rate) {
        let delta = normal.sample(&mut rng);
        agent.traits.learning_rate = (agent.traits.learning_rate + delta).clamp(0.0, 1.0);
    }
}

/// 世代交代
pub fn replace_generation(
    current_generation: &[Agent],
    selection_method: &SelectionMethod,
    crossover_method: &CrossoverMethod,
    mutation_rate: f64,
    mutation_strength: f64,
    elite_count: usize,
) -> Vec<Agent> {
    let mut new_generation = Vec::new();
    let mut rng = rand::thread_rng();
    
    // エリート保存
    let mut elite = current_generation.to_vec();
    elite.sort_by(|a, b| b.fitness().partial_cmp(&a.fitness()).unwrap());
    new_generation.extend(elite.iter().take(elite_count).cloned());
    
    // 残りの個体を生成
    while new_generation.len() < current_generation.len() {
        // 親選択
        let parents = select_agents(current_generation, selection_method, 2);
        if parents.len() >= 2 {
            // 交叉
            let (mut child1, mut child2) = crossover(&parents[0], &parents[1], crossover_method);
            
            // 突然変異
            mutate(&mut child1, mutation_rate, mutation_strength);
            mutate(&mut child2, mutation_rate, mutation_strength);
            
            // ランダムな位置に配置
            let pos1 = Position::new(
                rng.gen_range(0..100), // TODO: 実際のグリッドサイズを使用
                rng.gen_range(0..100),
            );
            let pos2 = Position::new(
                rng.gen_range(0..100),
                rng.gen_range(0..100),
            );
            
            child1.position = pos1;
            child2.position = pos2;
            
            new_generation.push(child1);
            if new_generation.len() < current_generation.len() {
                new_generation.push(child2);
            }
        }
    }
    
    new_generation
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_top_percent_selection() {
        let agents = create_test_agents();
        let selected = select_agents(&agents, &SelectionMethod::TopPercent(0.5), 2);
        
        assert_eq!(selected.len(), 2);
        // 高い適応度を持つエージェントが選ばれているはず
        assert!(selected[0].fitness() >= selected[1].fitness());
    }

    #[test]
    fn test_roulette_wheel_selection() {
        let agents = create_test_agents();
        let selected = select_agents(&agents, &SelectionMethod::RouletteWheel, 2);
        
        assert_eq!(selected.len(), 2);
    }

    #[test]
    fn test_tournament_selection() {
        let agents = create_test_agents();
        let selected = select_agents(&agents, &SelectionMethod::Tournament(3), 2);
        
        assert_eq!(selected.len(), 2);
    }

    #[test]
    fn test_one_point_crossover() {
        let parent1 = create_test_agent(0.8, 0.2);
        let parent2 = create_test_agent(0.2, 0.8);
        
        let (child1, child2) = crossover(&parent1, &parent2, &CrossoverMethod::OnePoint);
        
        // 子の特性は親の特性の組み合わせであるべき
        assert!(child1.traits.cooperation_rate == 0.8 || child1.traits.cooperation_rate == 0.2);
        assert!(child2.traits.cooperation_rate == 0.8 || child2.traits.cooperation_rate == 0.2);
    }

    #[test]
    fn test_mutation() {
        let mut agent = create_test_agent(0.5, 0.5);
        let original_cooperation = agent.traits.cooperation_rate;
        
        // 100%の確率で突然変異
        mutate(&mut agent, 1.0, 0.1);
        
        // 値が変化しているはず（確率的なので必ずではないが）
        // ただし0.0から1.0の範囲内
        assert!(agent.traits.cooperation_rate >= 0.0);
        assert!(agent.traits.cooperation_rate <= 1.0);
    }

    // テスト用ヘルパー関数
    fn create_test_agents() -> Vec<Agent> {
        vec![
            create_test_agent_with_score(0.5, 0.5, 10.0),
            create_test_agent_with_score(0.7, 0.3, 20.0),
            create_test_agent_with_score(0.3, 0.7, 5.0),
            create_test_agent_with_score(0.9, 0.1, 30.0),
        ]
    }

    fn create_test_agent(cooperation_rate: f64, movement_rate: f64) -> Agent {
        let traits = AgentTraits {
            cooperation_rate,
            movement_rate,
            aggression_level: 0.5,
            learning_rate: 0.5,
        };
        Agent::new(AgentId(1), Position::new(0, 0), traits)
    }

    fn create_test_agent_with_score(
        cooperation_rate: f64,
        movement_rate: f64,
        score: f64,
    ) -> Agent {
        let traits = AgentTraits {
            cooperation_rate,
            movement_rate,
            aggression_level: 0.5,
            learning_rate: 0.5,
        };
        let mut agent = Agent::new(AgentId(1), Position::new(0, 0), traits);
        agent.state.score = score;
        agent
    }
}