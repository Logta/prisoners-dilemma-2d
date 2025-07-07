use super::{Action, Position, StrategyType};
use serde::{Deserialize, Serialize};
use std::collections::VecDeque;
use uuid::Uuid;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Agent {
    pub id: Uuid,
    pub position: Position,
    pub strategy: StrategyType,
    pub mobility: f64, // 0.0 - 1.0
    pub score: i32,
    pub history: GameHistory,
}

impl Agent {
    pub fn new(position: Position, strategy: StrategyType, mobility: f64) -> Self {
        Self {
            id: Uuid::new_v4(),
            position,
            strategy,
            mobility: mobility.clamp(0.0, 1.0),
            score: 0,
            history: GameHistory::new(),
        }
    }

    pub fn random(position: Position) -> Self {
        use rand::Rng;
        let mut rng = rand::thread_rng();
        
        Self::new(
            position,
            StrategyType::random(),
            rng.gen_range(0.0..=1.0),
        )
    }

    pub fn decide_action(&self, opponent_id: &Uuid) -> Action {
        let last_opponent_action = self.history.get_last_opponent_action(opponent_id);
        let last_my_action = self.history.get_last_my_action(opponent_id);
        let last_payoff = self.history.get_last_payoff(opponent_id);
        
        self.strategy.decide_action(last_opponent_action, last_my_action, last_payoff)
    }

    pub fn add_game_result(&mut self, opponent_id: Uuid, my_action: Action, opponent_action: Action, payoff: i32) {
        self.score += payoff;
        self.history.add_game(opponent_id, my_action, opponent_action, payoff);
    }

    pub fn cooperation_rate(&self) -> f64 {
        self.history.cooperation_rate()
    }

    pub fn should_move(&self) -> bool {
        use rand::Rng;
        let mut rng = rand::thread_rng();
        
        let base_probability = self.mobility;
        let recent_performance = self.history.recent_performance();
        
        let move_probability = if recent_performance < 0.0 {
            // 成績が悪い場合は移動確率を2倍に
            base_probability * 2.0
        } else if recent_performance > 0.0 {
            // 成績が良い場合は移動確率を半分に
            base_probability * 0.5
        } else {
            base_probability
        };
        
        rng.gen::<f64>() < move_probability.clamp(0.0, 1.0)
    }

    pub fn move_to(&mut self, new_position: Position) {
        self.position = new_position;
    }

    pub fn crossover(parent1: &Agent, parent2: &Agent, position: Position) -> Agent {
        use rand::Rng;
        let mut rng = rand::thread_rng();
        
        let strategy = if rng.gen_bool(0.5) {
            parent1.strategy
        } else {
            parent2.strategy
        };
        
        let mobility = (parent1.mobility + parent2.mobility) / 2.0;
        
        Agent::new(position, strategy, mobility)
    }

    pub fn mutate(&mut self) {
        use rand::Rng;
        let mut rng = rand::thread_rng();
        
        if rng.gen_bool(0.05) { // 5%の確率で突然変異
            // 戦略の突然変異
            if rng.gen_bool(0.5) {
                self.strategy = StrategyType::random();
            }
            
            // 移動性向の突然変異
            let change = rng.gen_range(-0.2..=0.2);
            self.mobility = (self.mobility + change).clamp(0.0, 1.0);
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GameHistory {
    games: VecDeque<GameRecord>,
    max_history: usize,
}

impl GameHistory {
    pub fn new() -> Self {
        Self {
            games: VecDeque::new(),
            max_history: 10,
        }
    }

    pub fn add_game(&mut self, opponent_id: Uuid, my_action: Action, opponent_action: Action, payoff: i32) {
        if self.games.len() >= self.max_history {
            self.games.pop_front();
        }
        
        self.games.push_back(GameRecord {
            opponent_id,
            my_action,
            opponent_action,
            payoff,
        });
    }

    pub fn get_last_opponent_action(&self, opponent_id: &Uuid) -> Option<Action> {
        self.games
            .iter()
            .rev()
            .find(|game| &game.opponent_id == opponent_id)
            .map(|game| game.opponent_action)
    }

    pub fn get_last_my_action(&self, opponent_id: &Uuid) -> Option<Action> {
        self.games
            .iter()
            .rev()
            .find(|game| &game.opponent_id == opponent_id)
            .map(|game| game.my_action)
    }

    pub fn get_last_payoff(&self, opponent_id: &Uuid) -> Option<i32> {
        self.games
            .iter()
            .rev()
            .find(|game| &game.opponent_id == opponent_id)
            .map(|game| game.payoff)
    }

    pub fn cooperation_rate(&self) -> f64 {
        if self.games.is_empty() {
            0.5 // デフォルト値
        } else {
            let cooperations = self.games
                .iter()
                .filter(|game| game.my_action == Action::Cooperate)
                .count();
            cooperations as f64 / self.games.len() as f64
        }
    }

    pub fn recent_performance(&self) -> f64 {
        if self.games.is_empty() {
            0.0
        } else {
            let average_payoff = self.games.iter().map(|game| game.payoff).sum::<i32>() as f64 / self.games.len() as f64;
            average_payoff - 2.0 // 期待値（2.0）からの偏差
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
struct GameRecord {
    opponent_id: Uuid,
    my_action: Action,
    opponent_action: Action,
    payoff: i32,
}