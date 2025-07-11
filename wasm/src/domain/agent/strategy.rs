use rand::Rng;
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub enum StrategyType {
    AllCooperate,
    AllDefect,
    TitForTat,
    Pavlov,
}

impl StrategyType {
    pub fn random() -> Self {
        let mut rng = rand::thread_rng();
        match rng.gen_range(0..4) {
            0 => StrategyType::AllCooperate,
            1 => StrategyType::AllDefect,
            2 => StrategyType::TitForTat,
            _ => StrategyType::Pavlov,
        }
    }

    pub fn decide_action(
        &self,
        last_opponent_action: Option<Action>,
        last_my_action: Option<Action>,
        last_payoff: Option<i32>,
    ) -> Action {
        match self {
            StrategyType::AllCooperate => Action::Cooperate,
            StrategyType::AllDefect => Action::Defect,
            StrategyType::TitForTat => {
                match last_opponent_action {
                    Some(action) => action,
                    None => Action::Cooperate, // 初回は協力
                }
            }
            StrategyType::Pavlov => {
                match (last_my_action, last_payoff) {
                    (Some(action), Some(payoff)) => {
                        if payoff >= 3 {
                            // 勝利または相互協力
                            action // 同じ行動を継続
                        } else {
                            action.opposite() // 逆の行動
                        }
                    }
                    _ => Action::Cooperate, // 初回は協力
                }
            }
        }
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum Action {
    Cooperate,
    Defect,
}

impl Action {
    pub fn opposite(&self) -> Self {
        match self {
            Action::Cooperate => Action::Defect,
            Action::Defect => Action::Cooperate,
        }
    }
}
