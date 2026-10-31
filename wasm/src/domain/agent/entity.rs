use super::{Action, MovementStrategy, Position, StrategyType};
use serde::{Deserialize, Serialize};
use std::collections::VecDeque;
use uuid::Uuid;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Agent {
    pub id: Uuid,
    pub position: Position,
    pub strategy: StrategyType,
    pub mobility: f64, // 0.0 - 1.0
    pub movement_strategy: MovementStrategy,
    pub score: i32,
    pub history: GameHistory,
}

impl Agent {
    pub fn new(
        position: Position,
        strategy: StrategyType,
        mobility: f64,
        movement_strategy: MovementStrategy,
    ) -> Self {
        Self {
            id: Uuid::new_v4(),
            position,
            strategy,
            mobility: mobility.clamp(0.0, 1.0),
            movement_strategy,
            score: 0,
            history: GameHistory::new(),
        }
    }

    pub fn random(position: Position) -> Self {
        use rand::RngExt;
        let mut rng = rand::rng();
        let movement_strategy = MovementStrategy::random();

        Self::new(
            position,
            StrategyType::random(),
            movement_strategy.default_mobility() + rng.random_range(-0.2..=0.2),
            movement_strategy,
        )
    }

    pub fn decide_action(&self, opponent_id: &Uuid) -> Action {
        let last_opponent_action = self.history.get_last_opponent_action(opponent_id);
        let last_my_action = self.history.get_last_my_action(opponent_id);
        let last_payoff = self.history.get_last_payoff(opponent_id);

        self.strategy
            .decide_action(last_opponent_action, last_my_action, last_payoff)
    }

    pub fn add_game_result(
        &mut self,
        opponent_id: Uuid,
        my_action: Action,
        opponent_action: Action,
        payoff: i32,
    ) {
        self.score += payoff;
        self.history
            .add_game(opponent_id, my_action, opponent_action, payoff);
    }

    pub fn cooperation_rate(&self) -> f64 {
        self.history.cooperation_rate()
    }

    pub fn should_move(&self) -> bool {
        self.should_move_with_neighbors(&[], &[])
    }

    pub fn should_move_with_neighbors(
        &self,
        neighbor_agents: &[&Agent],
        neighbor_strategies: &[StrategyType],
    ) -> bool {
        use rand::RngExt;
        let mut rng = rand::rng();

        rng.random::<f64>() < self.move_probability(neighbor_agents, neighbor_strategies)
    }

    /// 移動戦略・直近の成績・周囲の状況から、このターンに移動する確率（0.0〜1.0）を求める。
    pub fn move_probability(
        &self,
        neighbor_agents: &[&Agent],
        neighbor_strategies: &[StrategyType],
    ) -> f64 {
        let base_probability = self.mobility;
        let recent_performance = self.history.recent_performance();

        let move_probability = match self.movement_strategy {
            MovementStrategy::Explorer => {
                // 高い基本移動性（0.7-0.9）+ ランダム移動
                base_probability * 1.2
            }
            MovementStrategy::Settler => {
                // 低い基本移動性（0.1-0.3）+ 成績が良い時は絶対に移動しない
                if recent_performance > 0.5 {
                    0.0
                } else if recent_performance < -0.5 {
                    base_probability * 1.5 // 成績が非常に悪い時だけ移動
                } else {
                    base_probability * 0.3
                }
            }
            MovementStrategy::Adaptive => {
                // 現在の実装と同様の動的調整
                if recent_performance < 0.0 {
                    base_probability * 2.0
                } else if recent_performance > 0.0 {
                    base_probability * 0.5
                } else {
                    base_probability
                }
            }
            MovementStrategy::Opportunist => {
                // 隣接エージェントの協力率を評価
                let neighbor_cooperation = if neighbor_agents.is_empty() {
                    0.5 // デフォルト値
                } else {
                    neighbor_agents
                        .iter()
                        .map(|agent| agent.cooperation_rate())
                        .sum::<f64>()
                        / neighbor_agents.len() as f64
                };

                if neighbor_cooperation < 0.4 {
                    base_probability * 2.0 // 協力率低い場合は移動
                } else if neighbor_cooperation > 0.7 {
                    base_probability * 0.3 // 協力率高い場合は留まる
                } else {
                    base_probability
                }
            }
            MovementStrategy::Social => {
                // 同じ戦略のエージェントに近づく
                let same_strategy_count = neighbor_strategies
                    .iter()
                    .filter(|&&strategy| strategy == self.strategy)
                    .count();

                if same_strategy_count < 2 {
                    base_probability * 1.5 // 仲間が少ない場合は移動
                } else {
                    base_probability * 0.5 // 仲間が多い場合は留まる
                }
            }
            MovementStrategy::Antisocial => {
                // 異なる戦略から離れる
                let different_strategy_count = neighbor_strategies
                    .iter()
                    .filter(|&&strategy| strategy != self.strategy)
                    .count();

                (different_strategy_count as f64 * base_probability * 0.3).min(0.9)
            }
        };

        move_probability.clamp(0.0, 1.0)
    }

    pub fn move_to(&mut self, new_position: Position) {
        self.position = new_position;
    }

    pub fn crossover(parent1: &Agent, parent2: &Agent, position: Position) -> Agent {
        use rand::RngExt;
        let mut rng = rand::rng();

        let strategy = if rng.random_bool(0.5) {
            parent1.strategy
        } else {
            parent2.strategy
        };

        let mobility = (parent1.mobility + parent2.mobility) / 2.0;

        // 移動戦略の継承：75%で親から、25%で新規ランダム
        let movement_strategy = if rng.random_bool(0.75) {
            if rng.random_bool(0.5) {
                parent1.movement_strategy
            } else {
                parent2.movement_strategy
            }
        } else {
            MovementStrategy::random()
        };

        Agent::new(position, strategy, mobility, movement_strategy)
    }

    pub fn mutate(&mut self) {
        use rand::RngExt;
        let mut rng = rand::rng();

        if rng.random_bool(0.05) {
            // 5%の確率で突然変異
            // 戦略の突然変異
            if rng.random_bool(0.5) {
                self.strategy = StrategyType::random();
            }

            // 移動性向の突然変異
            let change = rng.random_range(-0.2..=0.2);
            self.mobility = (self.mobility + change).clamp(0.0, 1.0);

            // 移動戦略の突然変異
            if rng.random_bool(0.3) {
                // 30%の確率で移動戦略も変異
                self.movement_strategy = MovementStrategy::random();
            }
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GameHistory {
    games: VecDeque<GameRecord>,
    max_history: usize,
}

impl Default for GameHistory {
    fn default() -> Self {
        Self::new()
    }
}

impl GameHistory {
    pub fn new() -> Self {
        Self {
            games: VecDeque::new(),
            max_history: 10,
        }
    }

    pub fn add_game(
        &mut self,
        opponent_id: Uuid,
        my_action: Action,
        opponent_action: Action,
        payoff: i32,
    ) {
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
            let cooperations = self
                .games
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
            let average_payoff = self.games.iter().map(|game| game.payoff).sum::<i32>() as f64
                / self.games.len() as f64;
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

#[cfg(test)]
mod tests {
    use super::*;

    const EPS: f64 = 1e-9;

    fn agent(strategy: StrategyType, mobility: f64, movement: MovementStrategy) -> Agent {
        Agent::new(Position::new(0, 0), strategy, mobility, movement)
    }

    /// 指定した利得の対戦履歴を持つエージェントを作る（直近成績 = 平均利得 - 2.0）。
    fn agent_with_payoffs(movement: MovementStrategy, mobility: f64, payoffs: &[i32]) -> Agent {
        let mut a = agent(StrategyType::AllCooperate, mobility, movement);
        for &payoff in payoffs {
            a.add_game_result(Uuid::new_v4(), Action::Cooperate, Action::Cooperate, payoff);
        }
        a
    }

    /// 指定した回数だけ協力・裏切りした履歴を持つエージェント。
    fn agent_with_cooperation(cooperations: usize, defections: usize) -> Agent {
        let mut a = agent(StrategyType::AllCooperate, 0.5, MovementStrategy::Settler);
        for _ in 0..cooperations {
            a.add_game_result(Uuid::new_v4(), Action::Cooperate, Action::Cooperate, 3);
        }
        for _ in 0..defections {
            a.add_game_result(Uuid::new_v4(), Action::Defect, Action::Cooperate, 5);
        }
        a
    }

    fn assert_close(actual: f64, expected: f64) {
        assert!(
            (actual - expected).abs() < EPS,
            "expected {expected}, got {actual}"
        );
    }

    #[test]
    fn new_clamps_mobility() {
        assert_close(
            agent(StrategyType::AllDefect, 1.5, MovementStrategy::Explorer).mobility,
            1.0,
        );
        assert_close(
            agent(StrategyType::AllDefect, -0.5, MovementStrategy::Explorer).mobility,
            0.0,
        );
    }

    #[test]
    fn random_mobility_stays_within_default_plus_minus_0_2() {
        let mut saw_below_default = false;
        let mut saw_above_default = false;
        for _ in 0..500 {
            let a = Agent::random(Position::new(0, 0));
            let default = a.movement_strategy.default_mobility();
            assert!(
                a.mobility >= default - 0.2 - EPS && a.mobility <= default + 0.2 + EPS,
                "{:?}: mobility {} は {default}±0.2 の範囲外",
                a.movement_strategy,
                a.mobility
            );
            saw_below_default |= a.mobility < default - 0.01;
            saw_above_default |= a.mobility > default + 0.01;
        }
        assert!(saw_below_default && saw_above_default);
    }

    #[test]
    fn add_game_result_accumulates_score_and_history() {
        let opponent = Uuid::new_v4();
        let mut a = agent(StrategyType::TitForTat, 0.5, MovementStrategy::Settler);
        a.add_game_result(opponent, Action::Cooperate, Action::Defect, 3);
        a.add_game_result(opponent, Action::Defect, Action::Cooperate, 5);

        assert_eq!(a.score, 8);
        assert_eq!(
            a.history.get_last_opponent_action(&opponent),
            Some(Action::Cooperate)
        );
        // TitForTat は相手の直前の手をまねる
        assert_eq!(a.decide_action(&opponent), Action::Cooperate);
    }

    #[test]
    fn history_lookups_return_latest_game_against_that_opponent() {
        let (alice, bob) = (Uuid::new_v4(), Uuid::new_v4());
        let mut history = GameHistory::new();
        history.add_game(alice, Action::Cooperate, Action::Defect, 0);
        history.add_game(bob, Action::Defect, Action::Defect, 1);
        history.add_game(alice, Action::Defect, Action::Cooperate, 5);
        history.add_game(bob, Action::Cooperate, Action::Cooperate, 3);

        assert_eq!(
            history.get_last_opponent_action(&alice),
            Some(Action::Cooperate)
        );
        assert_eq!(history.get_last_my_action(&alice), Some(Action::Defect));
        assert_eq!(history.get_last_payoff(&alice), Some(5));
        assert_eq!(
            history.get_last_opponent_action(&bob),
            Some(Action::Cooperate)
        );
        assert_eq!(history.get_last_my_action(&bob), Some(Action::Cooperate));
        assert_eq!(history.get_last_payoff(&bob), Some(3));

        let stranger = Uuid::new_v4();
        assert_eq!(history.get_last_opponent_action(&stranger), None);
        assert_eq!(history.get_last_my_action(&stranger), None);
        assert_eq!(history.get_last_payoff(&stranger), None);
    }

    #[test]
    fn history_keeps_only_the_latest_10_games() {
        let mut history = GameHistory::new();
        history.add_game(Uuid::new_v4(), Action::Defect, Action::Defect, 1);
        for _ in 0..10 {
            history.add_game(Uuid::new_v4(), Action::Cooperate, Action::Cooperate, 3);
        }
        // 最初の裏切りは押し出されるので協力率は 1.0 になる（残っていれば 10/11）
        assert_close(history.cooperation_rate(), 1.0);
        assert_close(history.recent_performance(), 1.0);

        let mut short = GameHistory::new();
        short.add_game(Uuid::new_v4(), Action::Defect, Action::Defect, 1);
        short.add_game(Uuid::new_v4(), Action::Cooperate, Action::Cooperate, 3);
        assert_close(short.cooperation_rate(), 0.5);
    }

    #[test]
    fn cooperation_rate_is_ratio_of_own_cooperations() {
        assert_close(GameHistory::new().cooperation_rate(), 0.5);
        assert_close(agent_with_cooperation(3, 1).cooperation_rate(), 0.75);
        assert_close(agent_with_cooperation(0, 2).cooperation_rate(), 0.0);
    }

    #[test]
    fn recent_performance_is_average_payoff_minus_2() {
        assert_close(GameHistory::new().recent_performance(), 0.0);
        let a = agent_with_payoffs(MovementStrategy::Settler, 0.5, &[5, 5]);
        assert_close(a.history.recent_performance(), 3.0);
        let b = agent_with_payoffs(MovementStrategy::Settler, 0.5, &[0, 1, 2]);
        assert_close(b.history.recent_performance(), -1.0);
    }

    #[test]
    fn explorer_moves_with_1_2x_mobility() {
        let a = agent(StrategyType::AllCooperate, 0.5, MovementStrategy::Explorer);
        assert_close(a.move_probability(&[], &[]), 0.6);
        let fast = agent(StrategyType::AllCooperate, 1.0, MovementStrategy::Explorer);
        assert_close(fast.move_probability(&[], &[]), 1.0);
    }

    #[test]
    fn settler_depends_on_recent_performance() {
        // 成績が良い（> 0.5）なら移動しない
        let good = agent_with_payoffs(MovementStrategy::Settler, 0.4, &[5]);
        assert_close(good.move_probability(&[], &[]), 0.0);
        // 成績が非常に悪い（< -0.5）なら 1.5 倍
        let bad = agent_with_payoffs(MovementStrategy::Settler, 0.4, &[0]);
        assert_close(bad.move_probability(&[], &[]), 0.6);
        // それ以外は 0.3 倍
        let neutral = agent_with_payoffs(MovementStrategy::Settler, 0.4, &[2]);
        assert_close(neutral.move_probability(&[], &[]), 0.12);
        // 境界値 ±0.5 は「それ以外」
        let upper = agent_with_payoffs(MovementStrategy::Settler, 0.4, &[3, 2]);
        assert_close(upper.move_probability(&[], &[]), 0.12);
        let lower = agent_with_payoffs(MovementStrategy::Settler, 0.4, &[1, 2]);
        assert_close(lower.move_probability(&[], &[]), 0.12);
    }

    #[test]
    fn adaptive_moves_more_when_losing_and_less_when_winning() {
        let losing = agent_with_payoffs(MovementStrategy::Adaptive, 0.3, &[1]);
        assert_close(losing.move_probability(&[], &[]), 0.6);
        let winning = agent_with_payoffs(MovementStrategy::Adaptive, 0.3, &[3]);
        assert_close(winning.move_probability(&[], &[]), 0.15);
        let even = agent_with_payoffs(MovementStrategy::Adaptive, 0.3, &[2]);
        assert_close(even.move_probability(&[], &[]), 0.3);
    }

    #[test]
    fn opportunist_reacts_to_average_neighbor_cooperation() {
        let me = agent(
            StrategyType::AllCooperate,
            0.4,
            MovementStrategy::Opportunist,
        );
        // 隣人なし → 協力率 0.5 とみなし基本確率のまま
        assert_close(me.move_probability(&[], &[]), 0.4);

        // 平均 (0.0 + 0.5) / 2 = 0.25 < 0.4 → 2 倍
        let (n1, n2) = (agent_with_cooperation(0, 2), agent_with_cooperation(1, 1));
        assert_close(me.move_probability(&[&n1, &n2], &[]), 0.8);

        // 平均 0.8 > 0.7 → 0.3 倍
        let (n3, n4) = (agent_with_cooperation(4, 1), agent_with_cooperation(4, 1));
        assert_close(me.move_probability(&[&n3, &n4], &[]), 0.12);

        // 境界値 0.4 / 0.7 は基本確率のまま
        let at_low = agent_with_cooperation(2, 3);
        assert_close(me.move_probability(&[&at_low], &[]), 0.4);
        let at_high = agent_with_cooperation(7, 3);
        assert_close(me.move_probability(&[&at_high], &[]), 0.4);
    }

    #[test]
    fn social_stays_when_at_least_two_same_strategy_neighbors() {
        let me = agent(StrategyType::TitForTat, 0.4, MovementStrategy::Social);
        let tft = StrategyType::TitForTat;
        let other = StrategyType::AllDefect;
        assert_close(me.move_probability(&[], &[]), 0.6);
        assert_close(me.move_probability(&[], &[tft, other, other]), 0.6);
        assert_close(me.move_probability(&[], &[tft, tft, other]), 0.2);
    }

    #[test]
    fn antisocial_scales_with_different_strategy_neighbors_up_to_0_9() {
        let me = agent(StrategyType::Pavlov, 0.5, MovementStrategy::Antisocial);
        let same = StrategyType::Pavlov;
        let other = StrategyType::AllCooperate;
        assert_close(me.move_probability(&[], &[]), 0.0);
        assert_close(me.move_probability(&[], &[other, other, same]), 0.3);

        let fast = agent(StrategyType::Pavlov, 1.0, MovementStrategy::Antisocial);
        assert_close(fast.move_probability(&[], &[other; 8]), 0.9);
    }

    #[test]
    fn should_move_follows_move_probability_extremes() {
        let always = agent(StrategyType::AllCooperate, 1.0, MovementStrategy::Explorer);
        let never = agent(StrategyType::AllCooperate, 0.0, MovementStrategy::Explorer);
        for _ in 0..100 {
            assert!(always.should_move());
            assert!(always.should_move_with_neighbors(&[], &[]));
            assert!(!never.should_move());
            assert!(!never.should_move_with_neighbors(&[], &[]));
        }
    }

    #[test]
    fn move_to_updates_position() {
        let mut a = agent(StrategyType::AllCooperate, 0.5, MovementStrategy::Explorer);
        a.move_to(Position::new(3, 4));
        assert_eq!(a.position, Position::new(3, 4));
    }

    #[test]
    fn crossover_averages_mobility_and_inherits_a_parent_strategy() {
        let p1 = agent(StrategyType::AllCooperate, 0.2, MovementStrategy::Explorer);
        let p2 = agent(StrategyType::AllDefect, 0.6, MovementStrategy::Settler);
        for _ in 0..50 {
            let child = Agent::crossover(&p1, &p2, Position::new(1, 2));
            assert_close(child.mobility, 0.4);
            assert!(matches!(
                child.strategy,
                StrategyType::AllCooperate | StrategyType::AllDefect
            ));
            assert_eq!(child.position, Position::new(1, 2));
            assert_eq!(child.score, 0);
        }
    }

    #[test]
    fn mutate_occasionally_shifts_mobility_by_at_most_0_2() {
        let original = agent(StrategyType::AllCooperate, 0.5, MovementStrategy::Explorer);
        let mut decreased = false;
        let mut increased = false;
        for _ in 0..3000 {
            let mut a = original.clone();
            a.mutate();
            assert!(
                a.mobility >= 0.3 - EPS && a.mobility <= 0.7 + EPS,
                "mobility {} が 0.5±0.2 の範囲外",
                a.mobility
            );
            decreased |= a.mobility < 0.5 - EPS;
            increased |= a.mobility > 0.5 + EPS;
        }
        assert!(
            decreased && increased,
            "3000 回のうち一度は上下に変異するはず"
        );
    }
}
